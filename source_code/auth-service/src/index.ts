import express from 'express';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import axios from 'axios';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/payday_auth',
});

const app = express();
const PORT = process.env.PORT || 4001;
const JWT_SECRET = process.env.JWT_SECRET || 'payday_super_secret_key';
const AUTH_URL = process.env.AUTH_URL || `http://localhost:4001`;
const PAYMENT_URL = process.env.PAYMENT_URL || 'http://localhost:4002';

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Payday Auth Service API',
            version: '1.0.0',
            description: 'Authentication service for Payday platform',
        },
        servers: [
            {
                url: AUTH_URL,
            },
        ],
    },
    apis: ['./src/**/*.ts', './dist/**/*.js'], // files containing annotations as above
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.use(cors());
app.use(express.json());

// Mock user database
// Database initialization
const initDB = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                name VARCHAR(255) NOT NULL
            );
        `);

        // Seed initial users
        const seedUsers = [
            { username: 'merchant_bob', password: 'password123', name: 'Bob\'s Coffee' },
            { username: 'merchant_alice', password: 'password123', name: 'Alice\'s Tech' }
        ];

        for (const user of seedUsers) {
            await pool.query(
                'INSERT INTO users (username, password, name) VALUES ($1, $2, $3) ON CONFLICT (username) DO NOTHING',
                [user.username, user.password, user.name]
            );
        }
        console.log('Database initialized');
    } catch (error) {
        console.error('Database initialization failed:', error);
    }
};

initDB();

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Login to the application
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successful login
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *       401:
 *         description: Invalid credentials
 */
/**
 * @swagger
 * /register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *               - name
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successful registration
 *       400:
 *         description: Username already exists
 */
app.post('/register', async (req, res) => {
    const { username, password, name } = req.body;

    try {
        const existingUser = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        const newUserResult = await pool.query(
            'INSERT INTO users (username, password, name) VALUES ($1, $2, $3) RETURNING id, username, name',
            [username, password, name]
        );

        const newUser = newUserResult.rows[0];

        // Create account in Payment Service
        try {
            await axios.post(`${PAYMENT_URL}/accounts`, {
                userId: newUser.id,
                name: newUser.name
            });
        } catch (error) {
            console.error('Failed to create account in payment service', error);
            // In a real app, we might want to rollback the user creation here via a transaction
        }

        res.json({ message: 'Registration successful', user: newUser });
    } catch (error) {
        console.error('Registration failed:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1 AND password = $2', [username, password]);
        const user = result.rows[0];

        if (user) {
            const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
            return res.json({
                token,
                user: { id: user.id, username: user.username, name: user.name }
            });
        }

        res.status(401).json({ message: 'Invalid credentials' });
    } catch (error) {
        console.error('Login failed:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

/**
 * @swagger
 * /verify:
 *   get:
 *     summary: Verify JWT token
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Valid token
 *       401:
 *         description: Invalid or missing token
 */
app.get('/verify', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'No token provided' });

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        res.json({ valid: true, user: decoded });
    } catch (err) {
        res.status(401).json({ valid: false, message: 'Invalid token' });
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.listen(PORT, () => {
    console.log(`Auth service running on port ${PORT}`);
});

