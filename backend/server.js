const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const app = express();
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
// Get single user by ID
// --------------------------
app.get('/users/:id', async (req, res) => {
    const userId = req.params.id;
    try {
        const result = await pool.query(
            'SELECT id, name, lastname, role FROM users WHERE id = $1',
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
// Registration
// --------------------------
app.post('/register', async (req, res) => {
    let client;
    try {
        const { role, name, lastname, password } = req.body;

        if (!name || !lastname || !password || !role) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (!['student', 'professor', 'postgraduate'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const roleTable =
            role === 'student' ? 'students' :
                role === 'professor' ? 'professors' :
                    'postgraduates';

        client = await pool.connect();
        await client.query('BEGIN');

        const userResult = await client.query(
            `INSERT INTO users (name, lastname, password, role)
       VALUES ($1, $2, $3, $4) RETURNING id, name, lastname, role`,
            [name, lastname, hashedPassword, role]
        );

        const user = userResult.rows[0];

        const roleResult = await client.query(
            `INSERT INTO ${roleTable} (name, lastname, user_id)
       VALUES ($1, $2, $3) RETURNING *`,
            [name, lastname, user.id]
        );

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
        const { role, name, lastname, password } = req.body;

        if (!role || !name || !lastname || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (!['student', 'professor', 'postgraduate'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }

        const userResult = await pool.query(
            `SELECT id, name, lastname, password, role
       FROM users WHERE name=$1 AND lastname=$2 AND role=$3`,
            [name, lastname, role]
        );

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

        const roleDataResult = await pool.query(
            `SELECT * FROM ${roleTable} WHERE user_id = $1`,
            [user.id]
        );

        const roleData = roleDataResult.rows[0] || {};

        res.json({
            success: true,
            message: `Welcome, ${name} ${lastname}!`,
            user: {
                id: user.id,
                name: user.name,
                lastname: user.lastname,
                role: user.role,
                details: roleData,
            }
        });

    } catch (err) {
        console.error('❌ Login error:', err);
        res.status(500).json({ error: 'Login failed' });
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
// Get Borrowings of current student
// --------------------------
app.get('/api/borrowings/student/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            `SELECT b.id, b.start_date, b.end_date, 
                    b.publication_id, p.title AS publication_title,
                    (b.end_date > NOW()) AS is_active
             FROM borrowings b
             JOIN publications p ON b.publication_id = p.id
             WHERE b.borrower_id = $1
             ORDER BY b.start_date DESC`,
            [id]
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
