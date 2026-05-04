require('dotenv').config({ path: './.env' });
const { Pool } = require('pg');

const poolConfig = process.env.DATABASE_URL 
    ? { connectionString: process.env.DATABASE_URL }
    : {
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
    };

const db = new Pool(poolConfig);

async function check() {
    try {
        const res = await db.query("SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_name IN ('users', 'tracks');");
        console.table(res.rows);
    } catch (e) {
        console.error(e);
    } finally {
        db.end();
    }
}

check();
