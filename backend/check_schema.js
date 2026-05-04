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

db.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'friendships'", (err, res) => {
    if (err) {
        console.error(err);
    } else {
        console.log("Friendships columns:", res.rows);
    }
    
    db.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'users'", (err, res2) => {
        if (err) {
            console.error(err);
        } else {
            console.log("Users columns:", res2.rows);
        }
        db.end();
    });
});
