const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mysql = require('mysql2'); // MySQL2 client for Node.js
const axios = require('axios'); // For Spotify API calls

dotenv.config(); // Load environment variables from .env file

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const db = mysql.createConnection({
    host: "localhost", // Database host
    user: "root",      // Database username
    password: "123456", // Database password
    database: "Sonara" // Name of the database
});

// --- SPOTIFY API CONFIGURATION ---
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

// Function to get Spotify Access Token
async function getSpotifyToken() {
    try {
        const response = await axios.post('https://accounts.spotify.com/api/token',
            'grant_type=client_credentials',
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': 'Basic ' + Buffer.from(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET).toString('base64')
                }
            }
        );
        return response.data.access_token;
    } catch (error) {
        console.error("Error obtaining Spotify token:", error.response ? error.response.data : error.message);
        return null;
    }
}

// Search Endpoint
app.get('/api/spotify/search', async (req, res) => {
    const query = req.query.q;
    const type = req.query.type || 'album,artist,track'; // Default search types

    if (!query) {
        return res.status(400).json({ error: "Search query 'q' is required" });
    }

    const token = await getSpotifyToken();
    if (!token) {
        return res.status(500).json({ error: "Failed to authenticate with Spotify" });
    }

    try {
        const response = await axios.get('https://api.spotify.com/v1/search', {
            params: {
                q: query,
                type: type,
                limit: 10 // Let's limit to top 10 results for now
            },
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error("Error searching Spotify:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: "Failed to search Spotify" });
    }
});
// ---------------------------------



app.listen(3000, () => {
    console.log('Server running on port 3000');
})

app.post('/api/register', (req, res) => {
    const { first_name, last_name, email, username, password } = req.body;

    // preparar la consulta con los datos 
    const sql = "INSERT INTO users (first_name, last_name, email, username, password) VALUES (?, ?, ?, ?, ?)";
    const values = [first_name, last_name, email, username, password];

    // ejecucion de la consulta 
    db.query(sql, values, (err, result) => {
        if (err) {
            console.error("Error al insertar usuario:", err);
            return res.status(500).json({ error: "Error al registrar usuario en la base de datos" });
        }
        // Si todo salió bien
        return res.status(201).json({ message: "Usuario registrado con éxito" });
    });

})