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
app.get('/users', getAllFromTable('users'));

// Маршрут для получения одного пользователя по ID из базы данных
app.get('/users/:id', async (req, res) => {
    const userId = req.params.id;
    try {
        // Делаем запрос к PostgreSQL
        const result = await pool.query('SELECT id, name, lastname, role FROM users WHERE id = $1', [userId]);

        if (result.rows.length > 0) {
            // Если пользователь найден, отправляем его
            res.json(result.rows[0]);
        } else {
            // Если массив пустой, значит пользователя с таким ID нет
            res.status(404).json({ error: 'User not found' });
        }
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

        // Валидация входных данных
        if (!name || !lastname || !password || !role) {
            return res.status(400).json({ error: 'Все поля обязательны' });
        }

        if (!['student', 'professor', 'postgraduate'].includes(role)) {
            return res.status(400).json({ error: 'Неверная роль' });
        }

        // Хэшируем пароль один раз
        const hashedPassword = await bcrypt.hash(password, 12);

        // Таблица в зависимости от роли
        const roleTable = role === 'student' ? 'students' :
            role === 'professor' ? 'professors' :
                'postgraduates';

        // Получаем клиент для транзакции
        client = await pool.connect();

        try {
            await client.query('BEGIN');

            // 1. Вставка в таблицу users
            const usersQuery = `
                INSERT INTO users (name, lastname, password, role)
                VALUES ($1, $2, $3, $4)
                RETURNING id, name, lastname, role;
            `;
            const usersResult = await client.query(usersQuery, [name, lastname, hashedPassword, role]);
            const user = usersResult.rows[0]; // здесь есть id

            // 2. Вставка в таблицу роли с user_id
            const roleQuery = `
                INSERT INTO ${roleTable} (name, lastname, user_id)
                VALUES ($1, $2, $3)
                RETURNING *;
            `;
            const roleResult = await client.query(roleQuery, [name, lastname, user.id]);

            await client.query('COMMIT');

            // Ответ клиенту
            res.status(201).json({
                success: true,
                message: 'Регистрация прошла успешно',
                user: {
                    id: user.id,
                    name: user.name,
                    lastname: user.lastname,
                    role: user.role,
                    roleData: roleResult.rows[0] // данные из таблицы роли
                }
            });

        } catch (innerErr) {
            await client.query('ROLLBACK');
            throw innerErr;
        } finally {
            client.release();
        }

    } catch (err) {
        console.error('❌ Ошибка регистрации:', err);

        // Обработка уникального нарушения (например, если user_id или другие уникальные поля дублируются)
        if (err.code === '23505') {
            return res.status(400).json({ error: 'Пользователь с такими данными уже существует' });
        }

        res.status(500).json({ error: 'Ошибка регистрации' });
    }
});


// --------------------------
// Login
// --------------------------
app.post('/login', async (req, res) => {
    try {
        const { role, name, lastname, password } = req.body;

        // Базовая валидация
        if (!role || !name || !lastname || !password) {
            return res.status(400).json({ error: 'Все поля обязательны' });
        }

        if (!['student', 'professor', 'postgraduate'].includes(role)) {
            return res.status(400).json({ error: 'Неверная роль' });
        }

        // 1. Ищем пользователя в таблице users по имени, фамилии и роли
        const usersQuery = `
            SELECT id, name, lastname, password, role 
            FROM users 
            WHERE name = $1 
              AND lastname = $2 
              AND role = $3
        `;
        const usersResult = await pool.query(usersQuery, [name, lastname, role]);

        if (usersResult.rows.length === 0) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        const user = usersResult.rows[0];

        // 2. Проверяем пароль
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Неверный пароль' });
        }

        // 3. Определяем таблицу роли и подтягиваем дополнительные данные (если нужны)
        const roleTable =
            role === 'student' ? 'students' :
                role === 'professor' ? 'professors' :
                    'postgraduates';

        const roleQuery = `
            SELECT * FROM ${roleTable} 
            WHERE user_id = $1
        `;
        const roleResult = await pool.query(roleQuery, [user.id]);

        // Если по какой-то причине записи в таблице роли нет (данные повреждены) — можно обработать
        const roleData = roleResult.rows[0] || {};

        // 4. (Опционально) Генерируем JWT токен для авторизации в будущем
        // const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

        // Ответ
        res.json({
            success: true,
            message: `Welcome, ${name} ${lastname}!`,
            user: {
                id: user.id,
                name: user.name,
                lastname: user.lastname,
                role: user.role,
                // token: token, // <-- раскомментировать, если используешь JWT
                details: roleData // дополнительные поля из таблицы роли (группа, кафедра и т.д.)
            }
        });

    } catch (err) {
        console.error('❌ Error login:', err);
        res.status(500).json({ error: 'Error login' });
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
