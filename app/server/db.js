const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const initDB = async () => {
    try {
        // Table for storing dynamic columns definition
        await pool.query(`
            CREATE TABLE IF NOT EXISTS columns (
                id SERIAL PRIMARY KEY,
                column_id INTEGER,
                label TEXT NOT NULL,
                type TEXT,
                length TEXT,
                required TEXT,
                width INTEGER
            );
        `);

        // Table for storing inventory items
        // We use JSONB for flexible schema since columns can be added dynamically
        await pool.query(`
            CREATE TABLE IF NOT EXISTS inventory (
                id SERIAL PRIMARY KEY,
                data JSONB NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Table for users
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log('Database tables initialized');
    } catch (err) {
        console.error('Error initializing database tables:', err);
    }
};

module.exports = { pool, initDB };
