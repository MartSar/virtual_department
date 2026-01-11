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
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

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
// --------------------------
// Registration
// --------------------------
app.post('/register', async (req, res) => {
    let client;

    try {
        const {
            role,
            name,
            lastname,
            password,
            university_id,
            faculty_id
        } = req.body;

        if (!role || !name || !lastname || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (!['student', 'professor', 'postgraduate'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }

        if (role === 'student' && !university_id) {
            return res.status(400).json({ error: 'University is required for students' });
        }

        if ((role === 'professor' || role === 'postgraduate') && !faculty_id) {
            return res.status(400).json({ error: 'Faculty is required for authors' });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        client = await pool.connect();
        await client.query('BEGIN');

        // users
        const userResult = await client.query(
            `INSERT INTO users (name, lastname, password, role)
             VALUES ($1, $2, $3, $4)
                 RETURNING id, name, lastname, role`,
            [name, lastname, hashedPassword, role]
        );

        const user = userResult.rows[0];
        let roleData = null;

        // students
        if (role === 'student') {
            const studentResult = await client.query(
                `INSERT INTO students (user_id, name, lastname, university_id)
                 VALUES ($1, $2, $3, $4)
                     RETURNING *`,
                [user.id, name, lastname, university_id]
            );

            roleData = studentResult.rows[0];
        }

        // professors / postgraduates
        if (role === 'professor' || role === 'postgraduate') {
            const tableName = role === 'professor' ? 'professors' : 'postgraduates';

            const roleResult = await client.query(
                `INSERT INTO ${tableName} (user_id, name, lastname, faculty_id)
                 VALUES ($1, $2, $3, $4)
                 RETURNING *`,
                [user.id, name, lastname, faculty_id]
            );

            // authors — связь через user_id
            const authorResult = await client.query(
                `INSERT INTO authors (user_id, author_type)
                 VALUES ($1, $2)
                 RETURNING *`,
                [user.id, role]
            );

            roleData = {
                profile: roleResult.rows[0],
                author: authorResult.rows[0]
            };
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
                roleData
            }
        });

    } catch (err) {
        if (client) await client.query('ROLLBACK');
        console.error('❌ Registration error:', err);

        res.status(500).json({ error: 'Registration failed' });
    } finally {
        if (client) client.release();
    }
});


// --------------------------
// Login
// --------------------------
// --------------------------
// Login
// --------------------------
app.post('/login', async (req, res) => {
    try {
        const {
            role,
            name,
            lastname,
            password,
            university_id,
            faculty_id
        } = req.body;

        if (!role || !name || !lastname || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (!['student', 'professor', 'postgraduate'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }

        let userResult;

        // student
        if (role === 'student') {
            if (!university_id) {
                return res.status(400).json({ error: 'University is required' });
            }

            userResult = await pool.query(
                `SELECT u.*
                 FROM users u
                          JOIN students s ON s.user_id = u.id
                 WHERE u.name = $1
                   AND u.lastname = $2
                   AND u.role = $3
                   AND s.university_id = $4`,
                [name, lastname, role, university_id]
            );
        }

        // professor / postgraduate
        if (role === 'professor' || role === 'postgraduate') {
            const tableName = role === 'professor' ? 'professors' : 'postgraduates';

            userResult = await pool.query(
                `SELECT u.*
                 FROM users u
                          JOIN ${tableName} r ON r.user_id = u.id
                 WHERE u.name = $1
                   AND u.lastname = $2
                   AND u.role = $3`,
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

        res.json({
            success: true,
            message: 'Login successful',
            user: {
                id: user.id,
                name: user.name,
                lastname: user.lastname,
                role: user.role
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
// Get Student for Dashboard
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
// Get Author for Dashboard
// --------------------------
app.get('/authors/user/:userId', async (req, res) => {
    const userId = req.params.userId;
    try {
        const result = await pool.query(
            `SELECT * FROM authors WHERE user_id = $1`,
            [userId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Author not found' });
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
// GET all postgraduates of a professor
// --------------------------
app.get('/professors/:id/postgraduates', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            `SELECT
                 pg.id,
                 u.name,
                 u.lastname,
                 f.id AS faculty_id,
                 f.name AS faculty_name,
                 uni.id AS university_id,
                 uni.name AS university_name,
                 ci.id AS city_id,
                 ci.name AS city_name,
                 co.id AS country_id,
                 co.name AS country_name
             FROM professor_postgraduates pp
                      JOIN postgraduates pg ON pp.postgraduate_id = pg.id
                      JOIN users u ON pg.user_id = u.id
                      LEFT JOIN faculties f ON pg.faculty_id = f.id
                      LEFT JOIN universities uni ON f.university_id = uni.id
                      LEFT JOIN cities ci ON uni.city_id = ci.id
                      LEFT JOIN countries co ON ci.country_id = co.id
             WHERE pp.professor_id = $1`,
            [id]
        );

        // Форматируем для фронта
        const postgraduatesWithLocation = result.rows.map(pg => ({
            id: pg.id,
            name: pg.name,
            lastname: pg.lastname,
            faculty: { id: pg.faculty_id, name: pg.faculty_name },
            university: { id: pg.university_id, name: pg.university_name },
            city: { id: pg.city_id, name: pg.city_name },
            country: { id: pg.country_id, name: pg.country_name }
        }));

        res.json(postgraduatesWithLocation);
    } catch (err) {
        console.error('Failed to fetch postgraduates:', err);
        res.status(500).json({ error: 'Failed to fetch postgraduates' });
    }
});

// --------------------------
// GET all professors of a postgraduate
// --------------------------
app.get('/postgraduates/:id/professors', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            `SELECT
                 p.id,
                 u.name,
                 u.lastname,
                 f.id AS faculty_id,
                 f.name AS faculty_name,
                 uni.id AS university_id,
                 uni.name AS university_name,
                 ci.id AS city_id,
                 ci.name AS city_name,
                 co.id AS country_id,
                 co.name AS country_name
             FROM professor_postgraduates pp
                      JOIN professors p ON pp.professor_id = p.id
                      JOIN users u ON p.user_id = u.id
                      LEFT JOIN faculties f ON p.faculty_id = f.id
                      LEFT JOIN universities uni ON f.university_id = uni.id
                      LEFT JOIN cities ci ON uni.city_id = ci.id
                      LEFT JOIN countries co ON ci.country_id = co.id
             WHERE pp.postgraduate_id = $1`,
            [id]
        );

        // Форматируем для фронта
        const professorsWithLocation = result.rows.map(prof => ({
            id: prof.id,
            name: prof.name,
            lastname: prof.lastname,
            faculty: { id: prof.faculty_id, name: prof.faculty_name },
            university: { id: prof.university_id, name: prof.university_name },
            city: { id: prof.city_id, name: prof.city_name },
            country: { id: prof.country_id, name: prof.country_name }
        }));

        res.json(professorsWithLocation);
    } catch (err) {
        console.error('Failed to fetch professors:', err);
        res.status(500).json({ error: 'Failed to fetch professors' });
    }
});


// --------------------------
// POST assign a postgraduate to professor
// --------------------------
app.post('/professors/:id/postgraduates', async (req, res) => {
    const professorId = req.params.id;
    const { postgraduate_id } = req.body;

    try {
        const result = await pool.query(
            `INSERT INTO professor_postgraduates (professor_id, postgraduate_id) VALUES ($1, $2) RETURNING *`,
            [professorId, postgraduate_id]
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error("Failed to assign postgraduate:", err);
        res.status(500).json({ error: err.message });
    }
});


// --------------------------
// GET professor of a postgraduate
// --------------------------
app.get('/postgraduates/:id/professor', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            `SELECT pr.id, u.name, u.lastname
             FROM professor_postgraduates pp
             JOIN professors pr ON pp.professor_id = pr.id
             JOIN users u ON pr.user_id = u.id
             WHERE pp.postgraduate_id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Professor not found for this postgraduate' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Failed to fetch professor:', err);
        res.status(500).json({ error: 'Failed to fetch professor' });
    }
});

// GET professor by user_id
app.get('/professors/user/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const result = await pool.query(
            `SELECT id, user_id FROM professors WHERE user_id = $1`,
            [userId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Professor not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch professor' });
    }
});

// GET postgraduates by user_id
app.get('/postgraduates/user/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const result = await pool.query(
            `SELECT id, user_id FROM postgraduates WHERE user_id = $1`,
            [userId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Postgraduates not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch postgraduate' });
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


// GET /central_topics/:id — получить имя темы по id
app.get("/central_topics/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            "SELECT id, name FROM central_topics WHERE id = $1",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Topic not found" });
        }

        res.json(result.rows[0]); // { id, name }
    } catch (err) {
        console.error("Failed to fetch topic:", err);
        res.status(500).json({ error: "Failed to fetch topic" });
    }
});


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
// Create Publication
// --------------------------
app.post("/api/publications/create", async (req, res) => {
    const { title, file_type, content, description, author_id, file_name, topic_id } = req.body;

    if (!title || !file_type || !content || !topic_id) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        const contentBuffer = Buffer.from(content, "base64");

        // вставка публикации с topic_id
        const pubResult = await pool.query(
            `INSERT INTO publications (title, content, file_name, file_type, description, topic_id)
             VALUES ($1, $2, $3, $4, $5, $6)
                 RETURNING id`,
            [title, contentBuffer, file_name, file_type, description, topic_id]
        );

        const publication_id = pubResult.rows[0].id;

        // привязка автора
        if (author_id) {
            await pool.query(
                `INSERT INTO publication_authors (publication_id, author_id)
                 VALUES ($1, $2)`,
                [publication_id, author_id]
            );
        }

        res.status(201).json({ success: true, publication_id });
    } catch (err) {
        console.error("CREATE PUBLICATION ERROR:", err);
        res.status(500).json({ error: "Failed to create publication" });
    }
});


// --------------------------
// Get all authors for publication
// --------------------------
app.get("/publications/:id/authors", async (req, res) => {
    const publicationId = req.params.id;

    try {
        const result = await pool.query(
            `SELECT a.id, u.name, u.lastname, a.author_type
             FROM publication_authors pa
             JOIN authors a ON pa.author_id = a.id
             JOIN users u ON a.user_id = u.id
             WHERE pa.publication_id = $1`,
            [publicationId]
        );

        res.json(result.rows); // возвращаем массив авторов
    } catch (err) {
        console.error("FETCH AUTHORS ERROR:", err);
        res.status(500).json({ error: "Failed to fetch authors" });
    }
});

// Publication Deletion
app.delete('/api/publications/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // проверка, что публикация существует
        const publication = await pool.query('SELECT * FROM publications WHERE id = $1', [id]);
        if (!publication.rows.length) {
            return res.status(404).json({ error: 'Publication not found' });
        }

        // удаляем публикацию
        await pool.query('DELETE FROM publications WHERE id = $1', [id]);

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete publication' });
    }
});


// GET /publications?topic_id=1&country_id=2&city_id=3&university_id=4&faculty_id=5
app.get("/publications", async (req, res) => {
    const { topic_id, country_id, city_id, university_id, faculty_id } = req.query;

    try {
        let query = `
            SELECT 
                p.*, 
                t.name AS topic_name,
                c.name AS country_name,
                ci.name AS city_name,
                u.name AS university_name,
                f.name AS faculty_name
            FROM publications p
            LEFT JOIN central_topics t ON p.topic_id = t.id
            LEFT JOIN countries c ON p.country_id = c.id
            LEFT JOIN cities ci ON p.city_id = ci.id
            LEFT JOIN universities u ON p.university_id = u.id
            LEFT JOIN faculties f ON p.faculty_id = f.id
            WHERE 1=1
        `;

        const params = [];
        let idx = 1;

        if (topic_id) {
            query += ` AND p.topic_id = $${idx++}`;
            params.push(topic_id);
        }
        if (country_id) {
            query += ` AND p.country_id = $${idx++}`;
            params.push(country_id);
        }
        if (city_id) {
            query += ` AND p.city_id = $${idx++}`;
            params.push(city_id);
        }
        if (university_id) {
            query += ` AND p.university_id = $${idx++}`;
            params.push(university_id);
        }
        if (faculty_id) {
            query += ` AND p.faculty_id = $${idx++}`;
            params.push(faculty_id);
        }

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch publications" });
    }
});

// Get all publications of one author
app.get("/authors/:authorId/publications", async (req, res) => {
    const { authorId } = req.params;

    if (!authorId) return res.status(400).json({ error: "authorId is required" });

    try {
        const result = await pool.query(
            `SELECT
                 p.id,
                 p.title,
                 p.file_type,
                 p.description,
                 p.topic_id,
                 t.name AS topic_name
             FROM publication_authors pa
                      JOIN publications p ON pa.publication_id = p.id
                      LEFT JOIN central_topics t ON p.topic_id = t.id
             WHERE pa.author_id = $1
             ORDER BY p.id DESC`,
            [authorId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "No publications found for this author" });
        }

        res.json(result.rows);

    } catch (err) {
        console.error("AUTHORED PUBLICATIONS ERROR:", err);
        res.status(500).json({ error: "Failed to fetch authored publications" });
    }
});

// Download Publication
app.get('/api/publications/download/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            `SELECT file_name, file_type, content
             FROM publications
             WHERE id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Publication not found' });
        }

        const pub = result.rows[0];

        // content хранится как base64 в БД
        const fileBuffer = Buffer.from(pub.content, 'base64');

        res.setHeader('Content-Disposition', `attachment; filename="${pub.file_name}"`);
        res.setHeader('Content-Type', pub.file_type || 'application/octet-stream');
        res.send(fileBuffer);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to download publication' });
    }
});

// --------------------------
// GET student location (University → City → Country)
// --------------------------
app.get('/students/:id/location', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            `SELECT 
                u.id AS university_id,
                u.name AS university_name,
                c.id AS city_id,
                c.name AS city_name,
                co.id AS country_id,
                co.name AS country_name
            FROM students s
            LEFT JOIN universities u ON s.university_id = u.id
            LEFT JOIN cities c ON u.city_id = c.id
            LEFT JOIN countries co ON c.country_id = co.id
            WHERE s.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Student location not found' });
        }

        const location = result.rows[0];
        res.json({
            university: { id: location.university_id, name: location.university_name },
            city: { id: location.city_id, name: location.city_name },
            country: { id: location.country_id, name: location.country_name }
        });
    } catch (err) {
        console.error('Failed to fetch student location:', err);
        res.status(500).json({ error: 'Failed to fetch student location' });
    }
});


// Author Location
app.get('/authors/:id/location', async (req, res) => {
    const { id } = req.params;
    try {
        const client = await pool.connect();

        // Получаем факультет, университет, город, страну для автора
        const result = await client.query(`
            SELECT f.name AS faculty_name,
                   u.name AS university_name,
                   c.name AS city_name,
                   co.name AS country_name
            FROM authors a
                     JOIN ${'professors'} p ON a.user_id = p.user_id OR 1=1
                     LEFT JOIN faculties f ON f.id = p.faculty_id
                     LEFT JOIN universities u ON u.id = f.university_id
                     LEFT JOIN cities c ON c.id = u.city_id
                     LEFT JOIN countries co ON co.id = c.country_id
            WHERE a.id = $1
                LIMIT 1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Location not found" });
        }

        res.json(result.rows[0]);
        client.release();
    } catch (err) {
        console.error('❌ Failed to fetch author location:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


// --------------------------
// Server start
// --------------------------
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
