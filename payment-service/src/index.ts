import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import { initTracing } from './observability/tracing';
import { metricsMiddleware, setupMetrics } from './observability/metrics';
// Initialize tracing before any other imports that might need instrumentation
initTracing();

import axios from 'axios';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';

dotenv.config();
// ci trigger: payment-service pipeline test -rember to remove after 
// Second // ci trigger: payment-service pipeline test -rember to remove after 

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/payday_payment',
});

const app = express();
const PORT = process.env.PORT || 4002;
const AUTH_URL = process.env.AUTH_URL || 'http://localhost:4001';
const PAYMENT_URL = process.env.PAYMENT_URL || `http://localhost:4002`;


const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Payday Payment Service API',
            version: '1.0.0',
            description: 'Payment microservice for Payday platform',
        },
        servers: [
            {
                url: PAYMENT_URL,
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: ['./src/**/*.ts', path.join(__dirname, '/**/*.js')],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.use(cors());
app.use(express.json());

// Initialize metrics endpoint
app.use(metricsMiddleware);
setupMetrics(app);

// Database initialization
const initDB = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS accounts (
                user_id BIGINT PRIMARY KEY,
                balance DECIMAL(10, 2) DEFAULT 0,
                account_number BIGINT GENERATED ALWAYS AS IDENTITY
                (START WITH 1000000001 INCREMENT BY 1) UNIQUE NOT NULL,
                name VARCHAR(255) NOT NULL
            );
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS transactions (
                id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                user_id BIGINT NOT NULL,
                type VARCHAR(50) NOT NULL,
                amount DECIMAL(10, 2) NOT NULL,
                related_user_id BIGINT,
                related_name VARCHAR(255),
                related_account_number VARCHAR(255),
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log('Payment Database initialized');
    } catch (error) {
        console.error('Database initialization failed:', error);
    }
};

initDB();

// Middleware to verify Auth
const authenticate = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'Missing token' });

    try {
        const response = await axios.get(`${AUTH_URL}/verify`, {
            headers: { Authorization: authHeader }
        });
        if (response.data.valid) {
            (req as any).user = response.data.user;
            next();
        } else {
            res.status(401).json({ message: 'Invalid token' });
        }
    } catch (error) {
        res.status(401).json({ message: 'Authentication failed' });
    }
};

app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
});

/**
 * @swagger
 * /balance:
 *   get:
 *     summary: Get account balance and details
 *     tags: [Account]
 *     responses:
 *       200:
 *         description: Current balance and account details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 balance:
 *                   type: number
 *                 accountNumber:
 *                   type: string
 *                 name:
 *                   type: string
 *       401:
 *         description: Unauthorized
 */
app.get('/balance', authenticate, async (req, res) => {
    const user = (req as any).user;
    try {
        const result = await pool.query('SELECT * FROM accounts WHERE user_id = $1', [user.id]);
        const account = result.rows[0];

        if (!account) return res.status(404).json({ message: 'Account not found' });

        res.json({
            balance: parseFloat(account.balance), // pg returns decimals as strings
            accountNumber: account.account_number,
            name: account.name
        });
    } catch (error) {
        console.error('Get balance failed:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

/**
 * @swagger
 * /accounts:
 *   post:
 *     summary: Create a new account (Internal use mostly)
 *     tags: [Account]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - name
 *             properties:
 *               userId:
 *                 type: string
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Account created
 */
app.post('/accounts', async (req, res) => {
    const { userId, name } = req.body;

    try {
        const existing = await pool.query('SELECT * FROM accounts WHERE user_id = $1', [userId]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ message: 'Account already exists' });
        }

        const result = await pool.query(
            'INSERT INTO accounts (user_id, balance, name) VALUES ($1, 0, $2) RETURNING account_number',
            [userId, name]
        );

        const accountNumber = result.rows[0].account_number;

        res.json({
            userId,
            balance: 0,
            accountNumber,
            name
        });
    } catch (error) {
        console.error('Create account failed:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

/**
 * @swagger
 * /accounts/{accountNumber}:
 *   get:
 *     summary: Look up account name by number
 *     tags: [Account]
 *     parameters:
 *       - in: path
 *         name: accountNumber
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Account found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *       404:
 *         description: Account not found
 */
app.get('/accounts/:accountNumber', authenticate, async (req, res) => {
    try {
        const result = await pool.query('SELECT name FROM accounts WHERE account_number = $1', [req.params.accountNumber]);
        const account = result.rows[0];

        if (!account) return res.status(404).json({ message: 'Account not found' });
        res.json({ name: account.name });
    } catch (error) {
        console.error('Get account failed:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

/**
 * @swagger
 * /deposit:
 *   post:
 *     summary: Deposit funds into account
 *     tags: [Account]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Deposit successful
 *       401:
 *         description: Unauthorized
 */
app.post('/deposit', authenticate, async (req, res) => {
    const { amount } = req.body;
    const user = (req as any).user;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const accResult = await client.query('SELECT * FROM accounts WHERE user_id = $1 FOR UPDATE', [user.id]);
        const account = accResult.rows[0];

        if (!account) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Account not found' });
        }

        const newBalance = parseFloat(account.balance) + amount;
        await client.query('UPDATE accounts SET balance = $1 WHERE user_id = $2', [newBalance, user.id]);

        await client.query(
            'INSERT INTO transactions (user_id, type, amount) VALUES ($1, $2, $3)',
            [user.id, 'DEPOSIT', amount]
        );

        await client.query('COMMIT');

        res.json({ message: 'Deposit successful', balance: newBalance });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Deposit failed:', error);
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        client.release();
    }
});

/**
 * @swagger
 * /withdraw:
 *   post:
 *     summary: Withdraw funds from account
 *     tags: [Account]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Withdrawal successful
 *       400:
 *         description: Insufficient funds
 *       401:
 *         description: Unauthorized
 */
app.post('/withdraw', authenticate, async (req, res) => {
    const { amount } = req.body;
    const user = (req as any).user;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const accResult = await client.query('SELECT * FROM accounts WHERE user_id = $1 FOR UPDATE', [user.id]);
        const account = accResult.rows[0];

        if (!account) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Account not found' });
        }

        if (parseFloat(account.balance) < amount) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Insufficient funds' });
        }

        const newBalance = parseFloat(account.balance) - amount;
        await client.query('UPDATE accounts SET balance = $1 WHERE user_id = $2', [newBalance, user.id]);

        await client.query(
            'INSERT INTO transactions (user_id, type, amount) VALUES ($1, $2, $3)',
            [user.id, 'WITHDRAW', amount]
        );

        await client.query('COMMIT');

        res.json({ message: 'Withdrawal successful', balance: newBalance });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Withdraw failed:', error);
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        client.release();
    }
});

/**
 * @swagger
 * /transfer:
 *   post:
 *     summary: Transfer funds to another user
 *     tags: [Account]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - toAccountNumber
 *             properties:
 *               amount:
 *                 type: number
 *               toAccountNumber:
 *                 type: string
 *     responses:
 *       200:
 *         description: Transfer successful
 *       400:
 *         description: Insufficient funds
 *       401:
 *         description: Unauthorized
 */
app.post('/transfer', authenticate, async (req, res) => {
    const { amount, toAccountNumber } = req.body;
    const user = (req as any).user;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const fromAccResult = await client.query('SELECT * FROM accounts WHERE user_id = $1 FOR UPDATE', [user.id]);
        const fromAccount = fromAccResult.rows[0];

        if (!fromAccount) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Sender account not found' });
        }

        if (parseFloat(fromAccount.balance) < amount) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Insufficient funds' });
        }

        const toAccResult = await client.query('SELECT * FROM accounts WHERE account_number = $1 FOR UPDATE', [toAccountNumber]);
        const toAccount = toAccResult.rows[0];

        if (!toAccount) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Recipient account not found' });
        }

        const newFromBalance = parseFloat(fromAccount.balance) - amount;
        await client.query('UPDATE accounts SET balance = $1 WHERE user_id = $2', [newFromBalance, user.id]);

        const newToBalance = parseFloat(toAccount.balance) + amount;
        await client.query('UPDATE accounts SET balance = $1 WHERE user_id = $2', [newToBalance, toAccount.user_id]);

        await client.query(
            `INSERT INTO transactions 
            (user_id, type, amount, related_user_id, related_name, related_account_number) 
            VALUES ($1, $2, $3, $4, $5, $6)`,
            [user.id, 'TRANSFER_OUT', amount, toAccount.user_id, toAccount.name, toAccount.account_number]
        );

        await client.query(
            `INSERT INTO transactions 
            (user_id, type, amount, related_user_id, related_name, related_account_number) 
            VALUES ($1, $2, $3, $4, $5, $6)`,
            [toAccount.user_id, 'TRANSFER_IN', amount, user.id, fromAccount.name, fromAccount.account_number]
        );

        await client.query('COMMIT');

        res.json({ message: 'Transfer successful', balance: newFromBalance });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Transfer failed: ', error);
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        client.release();
    }
});

/**
 * @swagger
 * /transactions:
 *   get:
 *     summary: Get transaction history
 *     tags: [Account]
 *     responses:
 *       200:
 *         description: Transaction list
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   type:
 *                     type: string
 *                   amount:
 *                     type: number
 *                   timestamp:
 *                     type: string
 *       401:
 *         description: Unauthorized
 */
app.get('/transactions', authenticate, async (req, res) => {
    const user = (req as any).user;
    try {
        const result = await pool.query('SELECT * FROM transactions WHERE user_id = $1 ORDER BY timestamp DESC', [user.id]);

        // Map back to API format if needed, but the structure is similar enough or I can adjust API spec later
        // The original API returned camelCase, SQL returns snake_case.
        // Let's map it to be safe.
        const history = result.rows.map(row => ({
            id: row.id,
            userId: row.user_id,
            type: row.type,
            amount: parseFloat(row.amount),
            relatedUserId: row.related_user_id,
            relatedName: row.related_name,
            relatedAccountNumber: row.related_account_number,
            timestamp: row.timestamp
        }));

        res.json(history);
    } catch (error) {
        console.error('Get transactions failed:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.listen(PORT, () => {
    console.log(`Payment service running on port ${PORT}`);
});
