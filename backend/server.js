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

// --- SWAGGER DOCUMENTATION CONFIGURATION ---
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load(path.join(__dirname, 'swagger.yaml'));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

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

// --- SPOTIFY API CONFIGURATION ---
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
let SPOTIFY_REFRESH_TOKEN = process.env.SPOTIFY_REFRESH_TOKEN || '';
const SPOTIFY_REDIRECT_URI = 'http://127.0.0.1:3000/api/spotify/callback';

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

async function findOrCreateTrack(spotifyId, type = 'track') {
    // 1. Buscar en tu DB primero
    let track = await db.query(
        'SELECT * FROM tracks WHERE spotify_id = $1',
        [spotifyId]
    );

    if (track.rows.length > 0) {
        return track.rows[0]; // cache local
    }

    // 2. Traer de Spotify usando axios
    const token = await getSpotifyToken();
    if (!token) throw new Error("Failed to authenticate with Spotify");

    // Endpoint cambia según sea track o album
    const endpointType = type === 'album' ? 'albums' : 'tracks';
    
    let spotifyData;
    try {
        const response = await axios.get(`https://api.spotify.com/v1/${endpointType}/${spotifyId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        spotifyData = response.data;
    } catch (e) {
        throw new Error("Failed to fetch from Spotify: " + e.message);
    }

    // Adaptar variables dependiendo si es track o album
    const isAlbum = type === 'album' || spotifyData.type === 'album';
    const title = spotifyData.name;
    const artist_name = spotifyData.artists?.[0]?.name || 'Unknown';
    const album_name = isAlbum ? spotifyData.name : (spotifyData.album?.name || 'Unknown');
    const cover_url = isAlbum 
        ? (spotifyData.images?.[0]?.url || '') 
        : (spotifyData.album?.images?.[0]?.url || '');
    const duration_ms = spotifyData.duration_ms || 0;

    // 3. Guardar en tu DB
    const newTrack = await db.query(`
        INSERT INTO tracks (spotify_id, title, artist_name, album_name, cover_url, duration_ms)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (spotify_id) DO NOTHING
        RETURNING *
    `, [
        spotifyData.id,
        title,
        artist_name,
        album_name,
        cover_url,
        duration_ms
    ]);

    // Si ON CONFLICT se activó y no devolvió nada, hacemos otro SELECT
    if (newTrack.rows.length === 0) {
        track = await db.query('SELECT * FROM tracks WHERE spotify_id = $1', [spotifyId]);
        return track.rows[0];
    }

    return newTrack.rows[0];
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
// Intenta obtener tracks de playlists populares de Spotify, con fallback a búsqueda
app.get('/api/spotify/top-hits', async (req, res) => {
    const token = await getSpotifyToken();
    if (!token) {
        return res.status(500).json({ error: "Failed to authenticate with Spotify" });
    }

    // Estrategia 1: Intentar múltiples playlists conocidas de Spotify
    const playlistIds = [
        '37i9dQZEVXbMDoHDwVN2tF',  // Top 50 - Global
        '37i9dQZF1DXcBWIGoYBM5M',  // Today's Top Hits
        '37i9dQZF1DX0XUsuxWHRQd',  // RapCaviar
        '37i9dQZF1DX4JAvHpjipBk',  // New Music Friday
    ];

    for (const playlistId of playlistIds) {
        try {
            console.log(`Intentando playlist: ${playlistId}`);
            const response = await axios.get(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
                params: { limit: 10 },
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const topTracks = response.data.items.map(item => item.track);
            console.log(`✅ Playlist ${playlistId} exitosa - ${topTracks.length} tracks`);
            return res.json(topTracks);
        } catch (error) {
            console.log(`❌ Playlist ${playlistId} falló: ${error.response?.status || error.message}`);
            continue;
        }
    }

    // Estrategia 2: Fallback - usar la API de búsqueda para obtener tracks populares
    console.log("Todas las playlists fallaron, usando búsqueda como fallback...");
    try {
        const response = await axios.get('https://api.spotify.com/v1/search', {
            params: {
                q: 'genre:pop year:2025-2026',
                type: 'track',
                limit: 10,
                market: 'MX'
            },
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const topTracks = response.data.tracks.items;
        console.log(`✅ Búsqueda exitosa - ${topTracks.length} tracks`);
        return res.json(topTracks);
    } catch (searchError) {
        console.error("❌ Búsqueda también falló:", searchError.response?.data || searchError.message);
        return res.status(500).json({ error: "Failed to fetch top hits from all sources" });
    }
});

// Feed Mix Endpoint - Varied genres for a diverse feed
app.get('/api/spotify/feed-mix', async (req, res) => {
    const token = await getSpotifyToken();
    if (!token) {
        return res.status(500).json({ error: "Failed to authenticate with Spotify" });
    }

    // Search queries across many different genres and styles
    const genreQueries = [
        { q: 'genre:latin year:2025-2026', market: 'MX' },
        { q: 'genre:rock year:2024-2026', market: 'US' },
        { q: 'genre:hip-hop year:2025-2026', market: 'US' },
        { q: 'genre:electronic year:2025-2026', market: 'US' },
        { q: 'genre:r-n-b year:2024-2026', market: 'US' },
        { q: 'genre:reggaeton year:2025-2026', market: 'MX' },
        { q: 'genre:indie year:2024-2026', market: 'US' },
        { q: 'genre:jazz year:2024-2026', market: 'US' },
        { q: 'genre:k-pop year:2024-2026', market: 'US' },
        { q: 'genre:metal year:2024-2026', market: 'US' },
        { q: 'genre:classical year:2024-2026', market: 'US' },
        { q: 'genre:country year:2024-2026', market: 'US' },
    ];

    try {
        const allTracks = [];

        // Fetch 1-2 tracks from each genre in parallel
        const results = await Promise.allSettled(
            genreQueries.map(async ({ q, market }) => {
                const response = await axios.get('https://api.spotify.com/v1/search', {
                    params: {
                        q,
                        type: 'track',
                        limit: 3,
                        market,
                    },
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                return response.data.tracks.items || [];
            })
        );

        // Collect tracks, taking 1-2 from each genre
        results.forEach(result => {
            if (result.status === 'fulfilled' && result.value.length > 0) {
                // Take a random 1-2 tracks from each genre result
                const shuffled = result.value.sort(() => Math.random() - 0.5);
                allTracks.push(...shuffled.slice(0, 2));
            }
        });

        // Shuffle the final collection for variety
        const shuffledTracks = allTracks.sort(() => Math.random() - 0.5);

        console.log(`✅ Feed mix: ${shuffledTracks.length} tracks from ${genreQueries.length} genres`);
        return res.json(shuffledTracks);
    } catch (error) {
        console.error("Error fetching feed mix:", error.response?.data || error.message);
        return res.status(500).json({ error: "Failed to fetch feed mix" });
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
});

// endpoint to get "friends" (other registered users)
app.get('/api/friends', (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "Token not provided or invalid format" });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_key_123');
        const { id } = decodedToken;
        
        // Obtenemos los amigos reales desde la tabla friendships
        const sql = `
            SELECT u.id, u.first_name, u.last_name, u.username 
            FROM users u
            JOIN friendships f ON (u.id = f.requester_id OR u.id = f.addressee_id)
            WHERE (f.requester_id = $1 OR f.addressee_id = $1)
            AND u.id != $1
        `;
        const values = [id];

        db.query(sql, values, (err, result) => {
            if (err) {
                console.error("Error al obtener amigos:", err);
                return res.status(500).json({ error: "Error al obtener amigos de la base de datos" });
            }

            return res.status(200).json(result.rows);
        });
    } catch (error) {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
});

// Endpoint: POST /api/ratings
app.post('/api/ratings', async (req, res) => {
    // Validar el token y obtener el ID del usuario
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "Token not provided or invalid format" });
    }

    const token = authHeader.split(' ')[1];
    let userId;

    try {
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_key_123');
        userId = decodedToken.id;
    } catch (error) {
        return res.status(401).json({ error: "Invalid or expired token" });
    }

    const { spotifyId, score, type, review } = req.body;

    if (!spotifyId || score === undefined) {
        return res.status(400).json({ error: "Faltan datos requeridos (spotifyId o score)" });
    }

    try {
        // Garantiza que el track/album existe en tu base de datos
        const track = await findOrCreateTrack(spotifyId, type || 'track');

        // Ahora creamos el rating con el ID interno
        await db.query(`
            INSERT INTO ratings (user_id, track_id, score, review_text) 
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (user_id, track_id) 
            DO UPDATE SET score = $3, review_text = $4
        `, [userId, track.id, score, review || null]);

        return res.json({ success: true, message: "Puntuación y reseña guardadas correctamente." });
    } catch (error) {
        console.error("Error al guardar rating:", error);
        return res.status(500).json({ error: "Error interno al guardar la puntuación." });
    }
});

// Endpoint: GET /api/my-activity
app.get('/api/my-activity', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "Token not provided or invalid format" });
    }

    const token = authHeader.split(' ')[1];
    let userId;

    try {
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_key_123');
        userId = decodedToken.id;
    } catch (error) {
        return res.status(401).json({ error: "Invalid or expired token" });
    }

    try {
        const result = await db.query(`
            SELECT r.score, r.review_text, r.created_at, 
                   t.title, t.artist_name, t.cover_url, t.spotify_id, t.album_name
            FROM ratings r
            JOIN tracks t ON r.track_id = t.id
            WHERE r.user_id = $1
            ORDER BY r.created_at DESC
        `, [userId]);

        return res.json(result.rows);
    } catch (error) {
        console.error("Error obteniendo actividad:", error);
        return res.status(500).json({ error: "Error interno al obtener la actividad." });
    }
});

// Endpoint: GET /api/users/search
app.get('/api/users/search', async (req, res) => {
    const query = req.query.q;
    if (!query) {
        return res.status(400).json({ error: "Search query 'q' is required" });
    }

    try {
        const searchTerm = `%${query}%`;
        const result = await db.query(`
            SELECT id, first_name, last_name, username 
            FROM users 
            WHERE username ILIKE $1 OR first_name ILIKE $1 OR last_name ILIKE $1
            LIMIT 10
        `, [searchTerm]);

        return res.json(result.rows);
    } catch (error) {
        console.error("Error searching users:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});

// Endpoint: GET /api/users/:id
app.get('/api/users/:id', async (req, res) => {
    const userId = req.params.id;
    try {
        const result = await db.query(`
            SELECT id, first_name, last_name, username, created_at
            FROM users 
            WHERE id = $1
        `, [userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        const user = result.rows[0];

        // Get followers count
        const followersRes = await db.query(`SELECT COUNT(*) FROM friendships WHERE addressee_id = $1`, [userId]);
        // Get following count
        const followingRes = await db.query(`SELECT COUNT(*) FROM friendships WHERE requester_id = $1`, [userId]);

        user.followersCount = parseInt(followersRes.rows[0].count, 10);
        user.followingCount = parseInt(followingRes.rows[0].count, 10);

        return res.json(user);
    } catch (error) {
        console.error("Error fetching user:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});

// Endpoint: GET /api/users/:id/activity
app.get('/api/users/:id/activity', async (req, res) => {
    const userId = req.params.id;
    try {
        const result = await db.query(`
            SELECT r.score, r.review_text, r.created_at, 
                   t.title, t.artist_name, t.cover_url, t.spotify_id, t.album_name
            FROM ratings r
            JOIN tracks t ON r.track_id = t.id
            WHERE r.user_id = $1
            ORDER BY r.created_at DESC
        `, [userId]);

        return res.json(result.rows);
    } catch (error) {
        console.error("Error fetching user activity:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});

// Endpoint: GET /api/is-following/:id
app.get('/api/is-following/:id', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "Token not provided" });
    }

    const token = authHeader.split(' ')[1];
    let loggedInUserId;
    try {
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_key_123');
        loggedInUserId = decodedToken.id;
    } catch (error) {
        return res.status(401).json({ error: "Invalid token" });
    }

    const targetUserId = req.params.id;
    
    try {
        const result = await db.query(`
            SELECT * FROM friendships 
            WHERE requester_id = $1 AND addressee_id = $2
        `, [loggedInUserId, targetUserId]);

        return res.json({ isFollowing: result.rows.length > 0 });
    } catch (error) {
        console.error("Error checking follow status:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});

// Endpoint: POST /api/follow
app.post('/api/follow', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "Token not provided" });
    }

    const token = authHeader.split(' ')[1];
    let requester_id;
    try {
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_key_123');
        requester_id = decodedToken.id;
    } catch (error) {
        return res.status(401).json({ error: "Invalid token" });
    }

    const { targetUserId } = req.body;
    if (!targetUserId) {
        return res.status(400).json({ error: "Missing targetUserId" });
    }

    if (requester_id == targetUserId) {
        return res.status(400).json({ error: "Cannot follow yourself" });
    }

    try {
        await db.query(`
            INSERT INTO friendships (requester_id, addressee_id) 
            VALUES ($1, $2) 
            ON CONFLICT DO NOTHING
        `, [requester_id, targetUserId]);

        return res.json({ success: true, message: "Followed successfully" });
    } catch (error) {
        console.error("Error following user:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});

// Endpoint: DELETE /api/unfollow/:id
app.delete('/api/unfollow/:id', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "Token not provided" });
    }

    const token = authHeader.split(' ')[1];
    let requester_id;
    try {
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_key_123');
        requester_id = decodedToken.id;
    } catch (error) {
        return res.status(401).json({ error: "Invalid token" });
    }

    const targetUserId = req.params.id;

    try {
        await db.query(`
            DELETE FROM friendships 
            WHERE requester_id = $1 AND addressee_id = $2
        `, [requester_id, targetUserId]);

        return res.json({ success: true, message: "Unfollowed successfully" });
    } catch (error) {
        console.error("Error unfollowing user:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});

// Endpoint: GET /api/feed
app.get('/api/feed', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "Token not provided" });
    }

    const token = authHeader.split(' ')[1];
    let loggedInUserId;
    try {
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_key_123');
        loggedInUserId = decodedToken.id;
    } catch (error) {
        return res.status(401).json({ error: "Invalid token" });
    }

    try {
        // Query to get ratings from people the user is following
        const result = await db.query(`
            SELECT 
                r.score, r.review_text, r.created_at, 
                t.title, t.artist_name, t.cover_url, t.spotify_id, t.album_name,
                u.id as user_id, u.username, u.first_name, u.last_name
            FROM ratings r
            JOIN tracks t ON r.track_id = t.id
            JOIN users u ON r.user_id = u.id
            JOIN friendships f ON r.user_id = f.addressee_id
            WHERE f.requester_id = $1
            ORDER BY r.created_at DESC
            LIMIT 20
        `, [loggedInUserId]);

        return res.json(result.rows);
    } catch (error) {
        console.error("Error fetching feed:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});

// Endpoint: POST /api/favorites
app.post('/api/favorites', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "Token not provided" });
    }

    const token = authHeader.split(' ')[1];
    let userId;
    try {
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_key_123');
        userId = decodedToken.id;
    } catch (error) {
        return res.status(401).json({ error: "Invalid token" });
    }

    const { spotifyId, type } = req.body;
    if (!spotifyId) {
        return res.status(400).json({ error: "Missing spotifyId" });
    }

    try {
        // check limits
        const countRes = await db.query('SELECT COUNT(*) FROM favorite_songs WHERE user_id = $1', [userId]);
        if (parseInt(countRes.rows[0].count, 10) >= 5) {
            return res.status(400).json({ error: "Ya tienes 5 canciones favoritas" });
        }

        const track = await findOrCreateTrack(spotifyId, type || 'track');

        await db.query(`
            INSERT INTO favorite_songs (user_id, track_id) 
            VALUES ($1, $2)
            ON CONFLICT DO NOTHING
        `, [userId, track.id]);

        return res.json({ success: true, message: "Añadida a favoritos" });
    } catch (error) {
        console.error("Error adding favorite:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});

// Endpoint: DELETE /api/favorites/:id
app.delete('/api/favorites/:id', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "Token not provided" });
    }

    const token = authHeader.split(' ')[1];
    let userId;
    try {
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_key_123');
        userId = decodedToken.id;
    } catch (error) {
        return res.status(401).json({ error: "Invalid token" });
    }

    const trackId = req.params.id;

    try {
        await db.query(`
            DELETE FROM favorite_songs 
            WHERE user_id = $1 AND track_id = $2
        `, [userId, trackId]);

        return res.json({ success: true, message: "Eliminada de favoritos" });
    } catch (error) {
        console.error("Error removing favorite:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});

// Endpoint: GET /api/users/:id/favorites
app.get('/api/users/:id/favorites', async (req, res) => {
    const userId = req.params.id;
    try {
        const result = await db.query(`
            SELECT f.track_id as id, t.title, t.artist_name, t.cover_url, t.spotify_id, t.album_name, t.id as track_id
            FROM favorite_songs f
            JOIN tracks t ON f.track_id = t.id
            WHERE f.user_id = $1
            ORDER BY f.created_at ASC
        `, [userId]);

        return res.json(result.rows);
    } catch (error) {
        console.error("Error fetching favorites:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});
