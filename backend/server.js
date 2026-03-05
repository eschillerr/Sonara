const jwt = require("jsonwebtoken"); // For authentication  
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const axios = require('axios'); // For Spotify API calls
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const db = new Pool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "123456",
    database: process.env.DB_NAME || "sonara",
    port: process.env.DB_PORT || 5432
});

// --- SPOTIFY API CONFIGURATION ---
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
let SPOTIFY_REFRESH_TOKEN = process.env.SPOTIFY_REFRESH_TOKEN || '';
const SPOTIFY_REDIRECT_URI = 'http://localhost:3000/api/spotify/callback';

// Function to get Spotify Access Token
// Usa refresh token si existe (Authorization Code flow), si no, usa Client Credentials
async function getSpotifyToken() {
    const basicAuth = 'Basic ' + Buffer.from(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET).toString('base64');

    // Si tenemos un refresh token, lo usamos para obtener un access token fresco
    if (SPOTIFY_REFRESH_TOKEN) {
        try {
            const response = await axios.post('https://accounts.spotify.com/api/token',
                `grant_type=refresh_token&refresh_token=${SPOTIFY_REFRESH_TOKEN}`,
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Authorization': basicAuth
                    }
                }
            );
            // Si Spotify nos da un nuevo refresh token, lo actualizamos
            if (response.data.refresh_token) {
                SPOTIFY_REFRESH_TOKEN = response.data.refresh_token;
            }
            return response.data.access_token;
        } catch (error) {
            console.error("Error refreshing Spotify token:", error.response ? error.response.data : error.message);
            console.log("Falling back to Client Credentials...");
        }
    }

    // Fallback: Client Credentials (no puede acceder a playlists curadas)
    try {
        const response = await axios.post('https://accounts.spotify.com/api/token',
            'grant_type=client_credentials',
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': basicAuth
                }
            }
        );
        return response.data.access_token;
    } catch (error) {
        console.error("Error obtaining Spotify token:", error.response ? error.response.data : error.message);
        return null;
    }
}

// --- SPOTIFY AUTHORIZATION CODE FLOW ---
// Ruta para iniciar la autorización (visitar en el navegador una sola vez)
app.get('/api/spotify/authorize', (req, res) => {
    const scopes = 'playlist-read-private playlist-read-collaborative';
    const authUrl = 'https://accounts.spotify.com/authorize?' +
        `client_id=${SPOTIFY_CLIENT_ID}` +
        `&response_type=code` +
        `&redirect_uri=${encodeURIComponent(SPOTIFY_REDIRECT_URI)}` +
        `&scope=${encodeURIComponent(scopes)}`;
    res.redirect(authUrl);
});

// Callback que recibe el código de autorización y lo intercambia por tokens
app.get('/api/spotify/callback', async (req, res) => {
    const code = req.query.code;
    const error = req.query.error;

    if (error) {
        return res.status(400).json({ error: `Spotify authorization failed: ${error}` });
    }

    if (!code) {
        return res.status(400).json({ error: 'No authorization code received' });
    }

    try {
        const basicAuth = 'Basic ' + Buffer.from(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET).toString('base64');
        const response = await axios.post('https://accounts.spotify.com/api/token',
            `grant_type=authorization_code&code=${code}&redirect_uri=${encodeURIComponent(SPOTIFY_REDIRECT_URI)}`,
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': basicAuth
                }
            }
        );

        const { access_token, refresh_token } = response.data;

        // Guardar el refresh token en memoria
        SPOTIFY_REFRESH_TOKEN = refresh_token;

        // Guardar el refresh token en el archivo .env para que persista entre reinicios
        const envPath = path.join(__dirname, '.env');
        let envContent = fs.readFileSync(envPath, 'utf8');
        if (envContent.includes('SPOTIFY_REFRESH_TOKEN=')) {
            envContent = envContent.replace(/SPOTIFY_REFRESH_TOKEN=.*/, `SPOTIFY_REFRESH_TOKEN=${refresh_token}`);
        } else {
            envContent += `\nSPOTIFY_REFRESH_TOKEN=${refresh_token}`;
        }
        fs.writeFileSync(envPath, envContent);

        res.send(`
            <html><body style="font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #1DB954; color: white;">
                <div style="text-align: center;">
                    <h1>✅ ¡Autorización exitosa!</h1>
                    <p>El refresh token se guardó en tu archivo .env</p>
                    <p>Ya puedes cerrar esta pestaña y usar el endpoint /api/spotify/top-hits</p>
                </div>
            </body></html>
        `);
    } catch (err) {
        console.error('Error exchanging code for tokens:', err.response ? err.response.data : err.message);
        res.status(500).json({ error: 'Failed to exchange authorization code for tokens' });
    }
});

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

// Get New Releases Endpoint
// app.get('/api/spotify/new-releases', async (req, res) => {
//     const token = await getSpotifyToken();
//     if (!token) {
//         return res.status(500).json({ error: "Failed to authenticate with Spotify" });
//     }

//     try {
//         const response = await axios.get('https://api.spotify.com/v1/browse/new-releases', {
//             params: {
//                 limit: 10
//             },
//             headers: {
//                 'Authorization': `Bearer ${token}`
//             }
//         });

//         res.json(response.data);
//     } catch (error) {
//         console.error("Error fetching new releases:", error.response ? error.response.data : error.message);
//         res.status(500).json({ error: "Failed to fetch new releases" });
//     }
// });

// Get Top Hits Endpoint (Top 10 Global)
// Requiere Authorization Code flow (refresh token) para acceder a playlists curadas de Spotify
app.get('/api/spotify/top-hits', async (req, res) => {
    const token = await getSpotifyToken();
    if (!token) {
        return res.status(500).json({ error: "Failed to authenticate with Spotify" });
    }

    // Verificar si tenemos refresh token (necesario para acceder a playlists)
    if (!SPOTIFY_REFRESH_TOKEN) {
        return res.status(401).json({
            error: "Se requiere autorización. Visita http://localhost:3000/api/spotify/authorize para autorizar la app."
        });
    }

    try {
        // ID de la playlist "Top 50 - Global"
        const playlistId = '37i9dQZEVXbMDoHDwVN2tF';

        const response = await axios.get(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
            params: {
                limit: 10
            },
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const topTracks = response.data.items.map(item => item.track);
        res.json(topTracks);
    } catch (error) {
        console.error("Error fetching top hits:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: "Failed to fetch top hits" });
    }
});

// to execute server node on port 3000
app.listen(3000, () => {
    console.log('Server running on port 3000');
})

app.post('/api/register', (req, res) => {
    const { first_name, last_name, email, username, password } = req.body;

    // preparar la consulta con los datos 
    const sql = "INSERT INTO users (first_name, last_name, email, username, password) VALUES ($1, $2, $3, $4, $5)";
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

// login endpoint
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    // preparar la consulta con los datos 
    const sql = "SELECT * FROM users WHERE username = $1 AND password = $2";
    const values = [username, password];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error("Error al iniciar sesión:", err);
            return res.status(500).json({ error: "Error al iniciar sesión en la base de datos" });
        }

        // Verificar si el usuario existe y la contraseña coincide (en este caso es texto plano)
        if (result.rows.length === 0) {
            return res.status(401).json({ error: "Usuario o contraseña incorrectos" });
        }

        const user = result.rows[0];

        // 1. Generar el token (Node.js no tiene localStorage, eso es del navegador)
        const token = jwt.sign(
            { id: user.id, username: user.username },
            process.env.JWT_SECRET || 'super_secret_key_123', // Usar variable de entorno o un secreto por defecto
            { expiresIn: '2h' }
        );

        // 2. Enviar el token en la respuesta JSON al frontend
        return res.status(200).json({
            message: "Inicio de sesión exitoso",
            token: token
        });
    });

})


// endpoint "me" for testing login 
app.get('/api/me', (req, res) => {
    const authHeader = req.headers.authorization;

    // 1. Verificar si hay header y si empieza con "Bearer "
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "Token not provided or invalid format" });
    }

    // 2. Extraer el token separando "Bearer <token>"
    const token = authHeader.split(' ')[1];

    try {
        // 3. Verificar token
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_key_123');
        const { username } = decodedToken;
        const sql = "SELECT * FROM users WHERE username = $1";
        const values = [username];

        db.query(sql, values, (err, result) => {
            if (err) {
                console.error("Error al obtener usuario:", err);
                return res.status(500).json({ error: "Error al obtener usuario de la base de datos" });
            }

            if (result.rows.length === 0) {
                return res.status(404).json({ error: "Usuario no encontrado" });
            }

            const user = result.rows[0];
            // No enviar la contraseña al frontend por seguridad
            delete user.password;

            // 4. Devolver los datos del usuario en lugar de solo un mensaje
            return res.status(200).json(user);
        });
    } catch (error) {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
})
