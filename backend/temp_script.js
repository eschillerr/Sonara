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

async function setup() {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS favorite_songs (
                id SERIAL PRIMARY KEY,
                user_id INT REFERENCES users(id) ON DELETE CASCADE,
                track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, track_id)
            );
        `);
        console.log("Tabla 'favorite_songs' creada correctamente.");
    } catch (err) {
        console.error("Error creando tablas:", err);
    } finally {
        db.end();
    }
}
setup();
