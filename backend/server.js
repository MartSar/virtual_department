const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Подключение к PostgreSQL
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'virtual_department_v1',
  password: 'M2005v2003',
  port: 5432,
});

// Универсальная функция для получения всех данных из таблицы
const getAllFromTable = (tableName) => async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM ${tableName}`);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error receiving data' });
  }
};

// Routes для обычного получения данных
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

// --------------------------
// Registration
// --------------------------
app.post('/register', async (req, res) => {
    try {
        const { role, name, lastname, password } = req.body;

        if (!['student', 'professor', 'postgraduate'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }

        // Определяем таблицу
        let table;
        if (role === 'student') table = 'students';
        else if (role === 'professor') table = 'professors';
        else table = 'postgraduates';

        // // Проверяем, существует ли уже такой пароль (по хэшу)
        // const existingUsers = await pool.query(`SELECT password FROM ${table}`);
        //
        // for (let user of existingUsers.rows) {
        //     const match = await bcrypt.compare(password, user.password);
        //     if (match) {
        //         return res.status(400).json({ error: 'This password is already in use!' });
        //     }
        // }

        // Хэшируем пароль и добавляем пользователя
        const hashedPassword = await bcrypt.hash(password, 12);
        const query = `INSERT INTO ${table} (name, lastname, password) VALUES ($1, $2, $3) RETURNING *`;
        const result = await pool.query(query, [name, lastname, hashedPassword]);

        res.json({ success: true, user: result.rows[0] });

    } catch (err) {
        console.error('❌ Registration error:', err);
        res.status(500).json({ error: 'Registration failed' });
    }
});


// --------------------------
// Login
// --------------------------
app.post('/login', async (req, res) => {
  try {
    const { role, name, lastname, password } = req.body;

    if (!['student', 'professor', 'postgraduate'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    let table;
    if (role === 'student') table = 'students';
    else if (role === 'professor') table = 'professors';
    else table = 'postgraduates';

    const result = await pool.query(`SELECT * FROM ${table} WHERE name = $1 AND lastname = $2`, [name, lastname]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Wrong password' });

    res.json({ success: true, message: `Welcome ${role} ${name} ${lastname}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Server Start
app.listen(port, () => {
  console.log(`The server is running on http://localhost:${port}`);
});


// Borrow publication (для студентов)
app.post('/borrow', async (req, res) => {
    try {
        const { student_id, publication_id } = req.body;

        // Publication availability
        const [existing] = await pool.query(
            `SELECT * FROM loans WHERE publication_id = $1 AND status = 'active'`,
            [publication_id]
        );

        if (existing.length > 0) {
            return res.status(400).json({ error: 'Publication already borrowed' });
        }

        // record addition to loans
        const result = await pool.query(
            `INSERT INTO loans (publication_id, borrower_student_id) VALUES ($1, $2) RETURNING *`,
            [publication_id, student_id]
        );

        res.json({ success: true, loan: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to borrow publication' });
    }
});

// Add new publication (professors and postgraduates)
app.post('/add-publication', async (req, res) => {
    try {
        const { title, author_id } = req.body;

        const result = await pool.query(
            `INSERT INTO publications (title, author_id) VALUES ($1, $2) RETURNING *`,
            [title, author_id]
        );

        res.json({ success: true, publication: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to add publication' });
    }
});

// Publication filter getting from DB

app.get('/filters', async (req, res) => {
    try {
        const topicsRes = await pool.query(
            'SELECT id, name FROM central_topics ORDER BY name'
        );
        const countriesRes = await pool.query(
            'SELECT id, name FROM countries ORDER BY name'
        );
        const citiesRes = await pool.query(
            'SELECT id, name FROM cities ORDER BY name'
        );
        const universitiesRes = await pool.query(
            'SELECT id, name FROM universities ORDER BY name'
        );
        const facultiesRes = await pool.query(
            'SELECT id, name FROM faculties ORDER BY name'
        );

        res.json({
            topics: topicsRes.rows,
            countries: countriesRes.rows,
            cities: citiesRes.rows,
            universities: universitiesRes.rows,
            faculties: facultiesRes.rows
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to load filters' });
    }
});
