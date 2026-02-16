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
app.get('/postgraduates', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, name, lastname, faculty_id
       FROM users
       WHERE role = 'postgraduate'
       ORDER BY lastname, name`
        );
        return res.json(result.rows);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to fetch postgraduates' });
    }
});
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
        const { role, name, lastname, login, password, faculty_id } = req.body;

        // validation
        if (!role || !name || !lastname || !login || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (faculty_id === undefined || faculty_id === null || faculty_id === '') {
            return res.status(400).json({ error: 'Faculty is required' });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        client = await pool.connect();

        // insert into users
        const userResult = await client.query(
            `INSERT INTO users (login, name, lastname, password, role, faculty_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, login, name, lastname, role, faculty_id`,
            [login, name, lastname, hashedPassword, role, faculty_id]
        );

        return res.status(201).json({
            success: true,
            message: 'Registration successful',
            user: userResult.rows[0],
        });

    } catch (err) {
        if (client) await client.query('ROLLBACK');
        console.error('❌ Registration error:', err);
        return res.status(500).json({ error: 'Registration failed' });
    } finally {
        if (client) client.release();
    }
});

// --------------------------
// Login
// --------------------------
app.post("/login", async (req, res) => {
    try {
        const { login, password } = req.body;

        if (!login || !password) {
            return res.status(400).json({ error: "login and password are required" });
        }

        // Load user by login
        const userResult = await pool.query(
            `SELECT id, login, name, lastname, role, password, faculty_id
             FROM users
             WHERE login = $1
                 LIMIT 1`,
            [login]
        );

        if (userResult.rowCount === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        const user = userResult.rows[0];

        // Check password
        const ok = await bcrypt.compare(password, user.password);
        if (!ok) {
            return res.status(401).json({ error: "Incorrect password" });
        }

        // Success (do NOT return hashed password)
        return res.json({
            success: true,
            message: "Login successful",
            user: {
                id: user.id,
                login: user.login,
                name: user.name,
                lastname: user.lastname,
                role: user.role,
                faculty_id: user.faculty_id,
            },
        });
    } catch (err) {
        console.error("Login error:", err);
        return res.status(500).json({ error: "Login failed" });
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
// Create Borrowing (only students) + prevent duplicate active borrowings
// --------------------------
app.post("/api/borrowings/create", async (req, res) => {
    const { borrower_id, publication_id, duration_days } = req.body;

    if (!borrower_id || !publication_id || !duration_days) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        // 1) Проверка что borrower — студент
        const userRes = await pool.query(
            `SELECT role FROM users WHERE id = $1 LIMIT 1`,
            [borrower_id]
        );

        if (userRes.rowCount === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        if (userRes.rows[0].role !== "student") {
            return res.status(403).json({ error: "Only students can borrow publications" });
        }

        const activeRes = await pool.query(
            `SELECT 1
       FROM borrowings
       WHERE borrower_id = $1
         AND publication_id = $2
         AND end_date >= NOW()
       LIMIT 1`,
            [borrower_id, publication_id]
        );

        if (activeRes.rowCount > 0) {
            return res.status(409).json({ error: "You already have active access to this publication" });
        }

        // 3) Создаём borrowing
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(startDate.getDate() + Number(duration_days));

        await pool.query(
            `INSERT INTO borrowings (borrower_id, publication_id, start_date, end_date)
             VALUES ($1, $2, $3, $4)`,
            [borrower_id, publication_id, startDate, endDate]
        );

        return res.status(201).json({ success: true });
    } catch (err) {
        console.error("BORROW ERROR:", err);
        return res.status(500).json({ error: "Failed to borrow publication" });
    }
});



// --------------------------
// GET borrowings for user (borrower_id -> users.id)
// --------------------------
app.get('/users/:userId/borrowings', async (req, res) => {
    const { userId } = req.params;

    try {
        const result = await pool.query(
            `
                SELECT
                    b.id,
                    b.publication_id,
                    b.start_date,
                    b.end_date,
                    p.title AS publication_title,
                    p.file_name,
                    (NOW() <= b.end_date) AS is_active
                FROM borrowings b
                         JOIN publications p ON p.id = b.publication_id
                WHERE b.borrower_id = $1
                ORDER BY b.start_date DESC
            `,
            [userId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'No borrowings found' });
        }

        return res.json(result.rows);
    } catch (err) {
        console.error('Failed to fetch borrowings:', err);
        return res.status(500).json({ error: 'Failed to fetch borrowings' });
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
// Get User for Dashboard (from users table)
// --------------------------
app.get('/users/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const result = await pool.query(
            `SELECT id, login, name, lastname, role, faculty_id
             FROM users
             WHERE id = $1
                 LIMIT 1`,
            [userId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        return res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Database error' });
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
            `SELECT id, login, name, lastname, role
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
app.get('/professors/:userId/postgraduates', async (req, res) => {
    const { userId } = req.params;

    try {
        const result = await pool.query(
            `
                SELECT
                    pg.id,
                    pg.name,
                    pg.lastname,

                    f.id  AS faculty_id,
                    f.name AS faculty_name,

                    uni.id  AS university_id,
                    uni.name AS university_name,

                    c.id  AS city_id,
                    c.name AS city_name,

                    co.id AS country_id,
                    co.name AS country_name
                FROM professor_postgraduates pp
                         JOIN users prof ON prof.id = pp.professor_id
                         JOIN users pg   ON pg.id = pp.postgraduate_id

                         LEFT JOIN faculties f      ON f.id = pg.faculty_id
                         LEFT JOIN universities uni ON uni.id = f.university_id
                         LEFT JOIN cities c         ON c.id = uni.city_id
                         LEFT JOIN countries co     ON co.id = c.country_id

                WHERE pp.professor_id = $1
                  AND prof.role = 'professor'
                  AND pg.role = 'postgraduate'
                ORDER BY pg.lastname, pg.name
            `,
            [userId]
        );

        const rows = result.rows.map(r => ({
            id: r.id,
            name: r.name,
            lastname: r.lastname,
            faculty: r.faculty_id ? { id: r.faculty_id, name: r.faculty_name } : null,
            university: r.university_id ? { id: r.university_id, name: r.university_name } : null,
            city: r.city_id ? { id: r.city_id, name: r.city_name } : null,
            country: r.country_id ? { id: r.country_id, name: r.country_name } : null,
        }));

        return res.json(rows);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to fetch assigned postgraduates' });
    }
});


// --------------------------
// GET professors of a postgraduate (users-based)
// --------------------------
app.get('/postgraduates/:id/professors', async (req, res) => {
    const { id } = req.params; // postgraduate user id

    try {
        const result = await pool.query(
            `
                SELECT
                    prof.id,
                    prof.name,
                    prof.lastname,

                    f.id  AS faculty_id,
                    f.name AS faculty_name,

                    uni.id  AS university_id,
                    uni.name AS university_name,

                    c.id  AS city_id,
                    c.name AS city_name,

                    co.id AS country_id,
                    co.name AS country_name
                FROM professor_postgraduates pp
                         JOIN users prof ON prof.id = pp.professor_id
                         JOIN users pg   ON pg.id = pp.postgraduate_id

                         LEFT JOIN faculties f      ON f.id = prof.faculty_id
                         LEFT JOIN universities uni ON uni.id = f.university_id
                         LEFT JOIN cities c         ON c.id = uni.city_id
                         LEFT JOIN countries co     ON co.id = c.country_id

                WHERE pp.postgraduate_id = $1
                  AND prof.role = 'professor'
                  AND pg.role = 'postgraduate'
                ORDER BY prof.lastname, prof.name
            `,
            [id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'No professors assigned' });
        }

        const rows = result.rows.map(r => ({
            id: r.id,
            name: r.name,
            lastname: r.lastname,
            faculty: r.faculty_id ? { id: r.faculty_id, name: r.faculty_name } : null,
            university: r.university_id ? { id: r.university_id, name: r.university_name } : null,
            city: r.city_id ? { id: r.city_id, name: r.city_name } : null,
            country: r.country_id ? { id: r.country_id, name: r.country_name } : null,
        }));

        return res.json(rows);
    } catch (err) {
        console.error('Failed to fetch professors:', err);
        return res.status(500).json({ error: 'Failed to fetch professors' });
    }
});



// --------------------------
// POST assign a postgraduate to professor
// --------------------------
app.post('/professors/:userId/postgraduates', async (req, res) => {
    const { userId } = req.params; // professor_id (users.id)
    const { postgraduate_id } = req.body; // postgraduate_id (users.id)

    if (!postgraduate_id) {
        return res.status(400).json({ error: 'postgraduate_id is required' });
    }

    try {
        const check = await pool.query(
            `SELECT id, role FROM users WHERE id IN ($1, $2)`,
            [userId, postgraduate_id]
        );
        const prof = check.rows.find(r => String(r.id) === String(userId));
        const pg = check.rows.find(r => String(r.id) === String(postgraduate_id));

        if (!prof || prof.role !== 'professor') {
            return res.status(400).json({ error: 'userId is not professor' });
        }
        if (!pg || pg.role !== 'postgraduate') {
            return res.status(400).json({ error: 'postgraduate_id is not postgraduate' });
        }

        await pool.query(
            `INSERT INTO professor_postgraduates (professor_id, postgraduate_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
            [userId, postgraduate_id]
        );

        return res.json({ success: true });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to assign postgraduate' });
    }
});



// --------------------------
// GET professor of a postgraduate (users-based)
// --------------------------
app.get('/postgraduates/:id/professor', async (req, res) => {
    const { id } = req.params; // postgraduate user id

    try {
        const result = await pool.query(
            `
                SELECT
                    prof.id,
                    prof.name,
                    prof.lastname
                FROM professor_postgraduates pp
                         JOIN users prof ON prof.id = pp.professor_id
                         JOIN users pg   ON pg.id = pp.postgraduate_id
                WHERE pp.postgraduate_id = $1
                  AND prof.role = 'professor'
                  AND pg.role = 'postgraduate'
            `,
            [id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Professor not found for this postgraduate' });
        }

        return res.json(result.rows);
    } catch (err) {
        console.error('Failed to fetch professor:', err);
        return res.status(500).json({ error: 'Failed to fetch professor' });
    }
});


// GET professor by user_id
// app.get('/professors/user/:userId', async (req, res) => {
//     const { userId } = req.params;
//     try {
//         const result = await pool.query(
//             `SELECT id, user_id FROM professors WHERE user_id = $1`,
//             [userId]
//         );
//         if (result.rows.length === 0) {
//             return res.status(404).json({ error: 'Professor not found' });
//         }
//         res.json(result.rows[0]);
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ error: 'Failed to fetch professor' });
//     }
// });
//
// // GET postgraduates by user_id
// app.get('/postgraduates/user/:userId', async (req, res) => {
//     const { userId } = req.params;
//     try {
//         const result = await pool.query(
//             `SELECT id, user_id FROM postgraduates WHERE user_id = $1`,
//             [userId]
//         );
//         if (result.rows.length === 0) {
//             return res.status(404).json({ error: 'Postgraduates not found' });
//         }
//         res.json(result.rows[0]);
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ error: 'Failed to fetch postgraduate' });
//     }
// });

app.get('/authors', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT a.id, a.author_type, u.name, u.lastname
            FROM authors a
            JOIN users u ON a.user_id = u.id
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch authors' });
    }
});

app.post('/publications/:id/authors', async (req, res) => {
    const { id } = req.params; // publication_id
    const { author_id } = req.body;

    if (!author_id) return res.status(400).json({ error: "author_id is required" });

    try {
        const check = await pool.query(
            `SELECT * FROM publication_authors
             WHERE publication_id = $1 AND author_id = $2`,
            [id, author_id]
        );

        if (check.rows.length > 0) {
            return res.status(400).json({ error: "Author is already added to this publication" });
        }

        await pool.query(
            `INSERT INTO publication_authors (publication_id, author_id, is_primary_author) VALUES ($1, $2, FALSE)`,
            [id, author_id]
        );

        res.json({ message: "Co-author added successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to add co-author" });
    }
});

// // GET /authors/:authorId/publications-with-primary
// // Возвращает публикации автора с полем is_primary_author для текущего автора
// app.get("/authors/:authorId/publications-with-primary", async (req, res) => {
//     const { authorId } = req.params;
//
//     try {
//         const { rows } = await pool.query(
//             `SELECT p.id,
//                     p.title,
//                     p.topic_id,
//                     t.name AS topic_name,
//                     p.file_type,
//                     p.description,
//                     pa.is_primary_author
//              FROM publications p
//              JOIN publication_authors pa ON pa.publication_id = p.id
//              LEFT JOIN topics t ON t.id = p.topic_id
//              WHERE pa.author_id = $1`,
//             [authorId]
//         );
//
//         res.json(rows);
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ error: "Failed to fetch publications with primary author info" });
//     }
// });


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
// Create Publication (user_id -> publication_authors.user_id)
// --------------------------
app.post("/api/publications/create", async (req, res) => {
    const { title, file_type, content, description, user_id, file_name, topic_id } = req.body;

    if (!title || !file_type || !content || !topic_id || !user_id) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        const contentBuffer = Buffer.from(content, "base64");

        const pubResult = await pool.query(
            `INSERT INTO publications (title, content, file_name, file_type, description, topic_id)
             VALUES ($1, $2, $3, $4, $5, $6)
                 RETURNING id`,
            [title, contentBuffer, file_name, file_type, description, topic_id]
        );

        const publication_id = pubResult.rows[0].id;

        await pool.query(
            `INSERT INTO publication_authors (publication_id, user_id, is_primary_author)
             VALUES ($1, $2, TRUE)`,
            [publication_id, user_id]
        );

        return res.status(201).json({ success: true, publication_id });
    } catch (err) {
        console.error("CREATE PUBLICATION ERROR:", err);
        return res.status(500).json({ error: "Failed to create publication" });
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

        res.json(result.rows);
    } catch (err) {
        console.error("FETCH AUTHORS ERROR:", err);
        res.status(500).json({ error: "Failed to fetch authors" });
    }
});

// Publication Deletion
app.delete('/api/publications/:id', async (req, res) => {
    const { id } = req.params;
    try {

        const publication = await pool.query('SELECT * FROM publications WHERE id = $1', [id]);
        if (!publication.rows.length) {
            return res.status(404).json({ error: 'Publication not found' });
        }

        await pool.query('DELETE FROM publications WHERE id = $1', [id]);

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete publication' });
    }
});


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

// ----------------------------
// Get all publications of primary author (is_primary_author = true)
// ----------------------------
app.get("/authors/:authorId/publications/primary", async (req, res) => {
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
             WHERE pa.author_id = $1 AND pa.is_primary_author = true
             ORDER BY p.id DESC`,
            [authorId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "No primary authored publications found" });
        }

        res.json(result.rows);

    } catch (err) {
        console.error("PRIMARY AUTHOR PUBLICATIONS ERROR:", err);
        res.status(500).json({ error: "Failed to fetch primary authored publications" });
    }
});

// ----------------------------
// Get all publications of co-author (is_primary_author = false)
// ----------------------------
app.get("/authors/:authorId/publications/co-author", async (req, res) => {
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
             WHERE pa.author_id = $1 AND pa.is_primary_author = false
             ORDER BY p.id DESC`,
            [authorId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "No co-authored publications found" });
        }

        res.json(result.rows);

    } catch (err) {
        console.error("COAUTHOR PUBLICATIONS ERROR:", err);
        res.status(500).json({ error: "Failed to fetch co-authored publications" });
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
// GET user location (Faculty -> University -> City -> Country) for ALL roles
// --------------------------
app.get('/users/:id/location', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            `
                SELECT
                    us.role AS role,

                    f.id  AS faculty_id,
                    f.name AS faculty_name,

                    uni.id  AS university_id,
                    uni.name AS university_name,

                    c.id  AS city_id,
                    c.name AS city_name,

                    co.id AS country_id,
                    co.name AS country_name
                FROM users us
                         LEFT JOIN faculties f       ON us.faculty_id = f.id
                         LEFT JOIN universities uni  ON f.university_id = uni.id
                         LEFT JOIN cities c          ON uni.city_id = c.id
                         LEFT JOIN countries co      ON c.country_id = co.id
                WHERE us.id = $1
                    LIMIT 1
            `,
            [id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const loc = result.rows[0];

        // если у пользователя нет faculty_id или цепочка не настроена
        if (!loc.faculty_id) {
            return res.status(404).json({ error: 'User location not found (faculty not set)' });
        }

        return res.json({
            role: loc.role,
            faculty: loc.faculty_id ? { id: loc.faculty_id, name: loc.faculty_name } : null,
            university: loc.university_id ? { id: loc.university_id, name: loc.university_name } : null,
            city: loc.city_id ? { id: loc.city_id, name: loc.city_name } : null,
            country: loc.country_id ? { id: loc.country_id, name: loc.country_name } : null,
        });
    } catch (err) {
        console.error('Failed to fetch user location:', err);
        return res.status(500).json({ error: 'Failed to fetch user location' });
    }
});



// get Author id by postgraduate or professor (postgraduate/professor -> user -> authors)
// по профессора либо аспиранту берем user_id и находим такого автора у которого user_id равняется найденному
// ----------------------------------------
// GET author by user_id (for professor/postgraduate)
// ----------------------------------------
app.get('/authors/user/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const result = await pool.query(
            `
            SELECT id
            FROM authors
            WHERE user_id = $1
            `,
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Author not found for this user'
            });
        }

        res.json({
            author_id: result.rows[0].id
        });
    } catch (err) {
        console.error('Failed to fetch author:', err);
        res.status(500).json({
            error: 'Failed to fetch author'
        });
    }
});

// --------------------------
// Get primary publications for user
// --------------------------
app.get('/users/:userId/publications/primary', async (req, res) => {
    const { userId } = req.params;

    try {
        const result = await pool.query(
            `SELECT
                 p.*,
                 ct.name AS topic_name
             FROM publications p
                      JOIN publication_authors pa
                           ON pa.publication_id = p.id
                      LEFT JOIN central_topics ct
                                ON ct.id = p.topic_id
             WHERE pa.user_id = $1
               AND pa.is_primary_author = true
             ORDER BY p.id DESC`,
            [userId]
        );

        return res.json(result.rows);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to fetch publications' });
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
// Get co-authored publications for user (is_primary_author = false)
// --------------------------
app.get('/users/:userId/publications/co-author', async (req, res) => {
    const { userId } = req.params;

    try {
        const result = await pool.query(
            `SELECT
                 p.*,
                 ct.name AS topic_name
             FROM publications p
                      JOIN publication_authors pa
                           ON pa.publication_id = p.id
                      LEFT JOIN central_topics ct
                                ON ct.id = p.topic_id
             WHERE pa.user_id = $1
               AND pa.is_primary_author = false
             ORDER BY p.id DESC`,
            [userId]
        );

        return res.json(result.rows);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to fetch co-authored publications' });
    }
});

// --------------------------
// Get authors + location for publication (users-based)
// --------------------------
app.get('/publications/:id/authors-location', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            `
      SELECT
        u.id AS user_id,
        u.name,
        u.lastname,
        u.role,
        pa.is_primary_author,

        f.id AS faculty_id,
        f.name AS faculty_name,

        uni.id AS university_id,
        uni.name AS university_name,

        c.id AS city_id,
        c.name AS city_name,

        co.id AS country_id,
        co.name AS country_name
      FROM publication_authors pa
      JOIN users u              ON u.id = pa.user_id
      LEFT JOIN faculties f     ON f.id = u.faculty_id
      LEFT JOIN universities uni ON uni.id = f.university_id
      LEFT JOIN cities c        ON c.id = uni.city_id
      LEFT JOIN countries co    ON co.id = c.country_id
      WHERE pa.publication_id = $1
      ORDER BY pa.is_primary_author DESC, u.lastname ASC, u.name ASC
      `,
            [id]
        );

        return res.json({
            authors: result.rows.map(r => ({
                user_id: r.user_id,
                name: r.name,
                lastname: r.lastname,
                role: r.role,
                is_primary_author: r.is_primary_author,

                faculty: r.faculty_id ? { faculty_id: r.faculty_id, name: r.faculty_name } : null,
                university: r.university_id ? { university_id: r.university_id, name: r.university_name } : null,
                city: r.city_id ? { city_id: r.city_id, name: r.city_name } : null,
                country: r.country_id ? { country_id: r.country_id, name: r.country_name } : null,
            }))
        });
    } catch (err) {
        console.error("Error fetching authors, faculties, universities, cities, and countries:", err);
        return res.status(500).json({ error: "Failed to fetch authors location" });
    }
});

// --------------------------
// Server start
// --------------------------
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
