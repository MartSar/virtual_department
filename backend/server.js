const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const app = express();
// const multer = require('multer');
// const storage = multer.memoryStorage();
// const upload = multer({ storage });
const port = 3000;

// --------------------------
// Middleware
// --------------------------
app.use(cors());
app.use(express.json());

// --------------------------
// PostgreSQL Pool
// --------------------------
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'virtual_department_v1',
    password: 'M2005v2003',
    port: 5432,
});

// --------------------------
// Generic GET all from table
// --------------------------
const getAllFromTable = (tableName) => async (req, res) => {
    try {
        const result = await pool.query(`SELECT * FROM ${tableName}`);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error retrieving data' });
    }
};

// --------------------------
// Table GET routes
// --------------------------
app.get('/central_topics', getAllFromTable('central_topics'));
app.get('/countries', getAllFromTable('countries'));
app.get('/cities', getAllFromTable('cities'));
app.get('/universities', getAllFromTable('universities'));
app.get('/faculties', getAllFromTable('faculties'));
app.get('/professors', getAllFromTable('professors'));
app.get('/postgraduates', getAllFromTable('postgraduates'));
app.get('/authors', getAllFromTable('authors'));
app.get('/publications', getAllFromTable('publications'));
app.get('/publication_authors', getAllFromTable('publication_authors'));
app.get('/students', getAllFromTable('students'));
app.get('/users', getAllFromTable('users'));
app.get('/borrowings', getAllFromTable('borrowings'));

// --------------------------
// Registration
// --------------------------
app.post('/register', async (req, res) => {
    let client;

    try {
        const { role, name, lastname, password, university_id } = req.body;

        if (!role || !name || !lastname || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (!['student', 'professor', 'postgraduate'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }

        // university_id required ONLY for students
        if (role === 'student' && !university_id) {
            return res.status(400).json({ error: 'University is required for students' });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const roleTable =
            role === 'student' ? 'students' :
                role === 'professor' ? 'professors' :
                    'postgraduates';

        client = await pool.connect();
        await client.query('BEGIN');

        // create user
        const userResult = await client.query(
            `INSERT INTO users (name, lastname, password, role)
             VALUES ($1, $2, $3, $4)
             RETURNING id, name, lastname, role`,
            [name, lastname, hashedPassword, role]
        );

        const user = userResult.rows[0];

        // create role-specific record
        let roleResult;

        if (role === 'student') {
            roleResult = await client.query(
                `INSERT INTO students (name, lastname, user_id, university_id)
                 VALUES ($1, $2, $3, $4)
                 RETURNING *`,
                [name, lastname, user.id, university_id]
            );
        } else {
            roleResult = await client.query(
                `INSERT INTO ${roleTable} (name, lastname, user_id)
                 VALUES ($1, $2, $3)
                 RETURNING *`,
                [name, lastname, user.id]
            );
        }

        await client.query('COMMIT');

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            user: {
                id: user.id,
                name: user.name,
                lastname: user.lastname,
                role: user.role,
                roleData: roleResult.rows[0],
            }
        });

    } catch (err) {
        if (client) await client.query('ROLLBACK');
        console.error('❌ Registration error:', err);

        if (err.code === '23505') {
            return res.status(400).json({ error: 'User already exists' });
        }

        res.status(500).json({ error: 'Registration failed' });
    } finally {
        if (client) client.release();
    }
});

// --------------------------
// Login
// --------------------------
app.post('/login', async (req, res) => {
    try {
        const { role, name, lastname, password, university_id } = req.body;

        if (!role || !name || !lastname || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (role === 'student' && !university_id) {
            return res.status(400).json({ error: 'University is required for students' });
        }

        if (!['student', 'professor', 'postgraduate'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }

        let userResult;

        if (role === 'student') {
            userResult = await pool.query(
                `SELECT u.id, u.name, u.lastname, u.password, u.role
         FROM users u
         JOIN students s ON s.user_id = u.id
         WHERE u.name=$1
           AND u.lastname=$2
           AND u.role=$3
           AND s.university_id=$4`,
                [name, lastname, role, university_id]
            );
        } else {
            userResult = await pool.query(
                `SELECT id, name, lastname, password, role
         FROM users
         WHERE name=$1 AND lastname=$2 AND role=$3`,
                [name, lastname, role]
            );
        }

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = userResult.rows[0];
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({ error: 'Incorrect password' });
        }

        const roleTable =
            role === 'student' ? 'students' :
                role === 'professor' ? 'professors' :
                    'postgraduates';

        let roleDataResult;

        if (role === 'student') {
            roleDataResult = await pool.query(
                `SELECT s.*, u.name AS university_name
                 FROM students s
                 LEFT JOIN universities u ON u.id = s.university_id
                 WHERE s.user_id = $1`,
                [user.id]
            );
        } else {
            roleDataResult = await pool.query(
                `SELECT * FROM ${roleTable} WHERE user_id = $1`,
                [user.id]
            );
        }

        res.json({
            success: true,
            message: `Welcome, ${name} ${lastname}!`,
            user: {
                id: user.id,
                name: user.name,
                lastname: user.lastname,
                role: user.role,
                details: roleDataResult.rows[0] || {},
            }
        });

    } catch (err) {
        console.error('❌ Login error:', err);
        res.status(500).json({ error: 'Login failed' });
    }
});

// --------------------------
// Upload user avatar
// --------------------------
// app.post('/api/users/:userId/avatar', upload.single('avatar'), async (req, res) => {
//     const { userId } = req.params;
//     const file = req.file;
//
//     if (!file) return res.status(400).json({ error: 'No file uploaded' });
//
//     try {
//         const result = await pool.query(
//             `UPDATE users SET avatar = $1 WHERE id = $2 RETURNING id, name, lastname`,
//             [file.buffer, userId]
//         );
//
//         res.json({ success: true, user: result.rows[0] });
//     } catch (err) {
//         console.error('Avatar upload error:', err);
//         res.status(500).json({ error: 'Failed to upload avatar' });
//     }
// });


// --------------------------
// Borrow publication (students only)
// --------------------------
app.post('/api/borrowings/create', async (req, res) => {
    try {
        const { student_id, publication_id, duration_days } = req.body;

        if (!student_id || !publication_id || !duration_days) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // prevent duplicate active borrowings
        const check = await pool.query(
            `SELECT 1 FROM borrowings
             WHERE borrower_id = $1
               AND publication_id = $2
               AND end_date > NOW()`,
            [student_id, publication_id]
        );

        if (check.rows.length > 0) {
            return res.status(400).json({
                error: 'You already borrowed this publication'
            });
        }

        const result = await pool.query(
            `INSERT INTO borrowings (borrower_id, publication_id, start_date, end_date)
             VALUES ($1, $2, NOW(), NOW() + ($3 || ' days')::INTERVAL)
                 RETURNING *`,
            [student_id, publication_id, duration_days]
        );

        res.json({
            success: true,
            borrowing: result.rows[0]
        });

    } catch (err) {
        console.error('❌ Borrowing error:', err);
        res.status(500).json({ error: 'Borrowing failed' });
    }
});

// --------------------------
// Get Borrowings of a student by borrower_id
// --------------------------
app.get('/borrowings/:borrowerId', async (req, res) => {
    const { borrowerId } = req.params;

    try {
        const result = await pool.query(
            `SELECT b.id, b.start_date, b.end_date, 
                    b.publication_id, p.title AS publication_title,
                    (b.end_date > NOW()) AS is_active
             FROM borrowings b
             JOIN publications p ON b.publication_id = p.id
             WHERE b.borrower_id = $1
             ORDER BY b.start_date DESC`,
            [borrowerId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No borrowings found for this student' });
        }

        res.json(result.rows);
    } catch (err) {
        console.error('Failed to fetch borrowings:', err);
        res.status(500).json({ error: 'Database error' });
    }
});


// --------------------------
// Add publication (professors/postgraduates)
// --------------------------
app.post('/add-publication', async (req, res) => {
    try {
        const { title, author_id } = req.body;

        const result = await pool.query(
            `INSERT INTO publications (title, author_id)
       VALUES ($1, $2) RETURNING *`,
            [title, author_id]
        );

        res.json({ success: true, publication: result.rows[0] });
    } catch (err) {
        console.error('❌ Add publication error:', err);
        res.status(500).json({ error: 'Failed to add publication' });
    }
});

// --------------------------
// Filters
// --------------------------
app.get('/filters', async (req, res) => {
    try {
        const topicsRes = await pool.query('SELECT id, name FROM central_topics ORDER BY name');
        const countriesRes = await pool.query('SELECT id, name FROM countries ORDER BY name');
        const citiesRes = await pool.query('SELECT id, name FROM cities ORDER BY name');
        const universitiesRes = await pool.query('SELECT id, name FROM universities ORDER BY name');
        const facultiesRes = await pool.query('SELECT id, name FROM faculties ORDER BY name');

        res.json({
            topics: topicsRes.rows,
            countries: countriesRes.rows,
            cities: citiesRes.rows,
            universities: universitiesRes.rows,
            faculties: facultiesRes.rows,
        });
    } catch (err) {
        console.error('❌ Filters error:', err);
        res.status(500).json({ error: 'Failed to load filters' });
    }
});

// --------------------------
// Get Student
// --------------------------
app.get('/students/user/:userId', async (req, res) => {
    const userId = req.params.userId;
    try {
        const result = await pool.query(
            `SELECT * FROM students WHERE user_id = $1`,
            [userId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Student not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// --------------------------
// Get Postgraduate
// --------------------------
app.get('/postgraduates/user/:userId', async (req, res) => {
    const userId = req.params.userId;
    try {
        const result = await pool.query(
            `SELECT * FROM postgraduates WHERE user_id = $1`,
            [userId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Postgraduate not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// --------------------------
// Get Professor
// --------------------------
app.get('/professors/user/:userId', async (req, res) => {
    const userId = req.params.userId;
    try {
        const result = await pool.query(
            `SELECT * FROM professors WHERE user_id = $1`,
            [userId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Professor not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});


// --------------------------
// Get User
// --------------------------
app.get('/users/:id', async (req, res) => {
    const userId = req.params.id;

    try {
        const result = await pool.query(
            `SELECT id, name, lastname, role
             FROM users
             WHERE id = $1`,
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// --------------------------
// Get user avatar
// --------------------------
// app.get('/api/users/:userId/avatar', async (req, res) => {
//     const { userId } = req.params;
//
//     try {
//         const result = await pool.query(`SELECT avatar FROM users WHERE id = $1`, [userId]);
//
//         if (result.rows.length === 0 || !result.rows[0].avatar) {
//             return res.status(404).send('No avatar');
//         }
//
//         res.setHeader('Content-Type', 'image/png'); // можно менять по типу файла
//         res.send(result.rows[0].avatar);
//     } catch (err) {
//         console.error('Fetch avatar error:', err);
//         res.status(500).json({ error: 'Failed to fetch avatar' });
//     }
// });


// --------------------------
// Get Borrowings of current student
// --------------------------
app.get(`borrowings/:id`, async (req, res) => {
    const { studentId } = req.params;
    try {
        const result = await pool.query(
            `SELECT b.id, b.start_date, b.end_date, 
                    b.publication_id, p.title AS publication_title,
                    (b.end_date > NOW()) AS is_active
             FROM borrowings b
             JOIN publications p ON b.publication_id = p.id
             WHERE b.borrower_id = $1
             ORDER BY b.start_date DESC`,
            [studentId]
        );

        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch borrowings" });
    }
});


// --------------------------
// Server start
// --------------------------
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
