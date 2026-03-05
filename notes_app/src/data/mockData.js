export const TOP_ALBUMS = [
    { id: 1, rank: 1, title: "OK Computer", artist: "Radiohead", year: 1997, rating: 4.8, reviews: "142k", color: "#1a2a3a", accent: "#4a9eff", cover: "https://upload.wikimedia.org/wikipedia/en/b/ba/Radioheadokcomputer.png" },
    { id: 2, rank: 2, title: "To Pimp a Butterfly", artist: "Kendrick Lamar", year: 2015, rating: 4.9, reviews: "198k", color: "#1a1a0a", accent: "#f5c842", cover: "https://upload.wikimedia.org/wikipedia/en/d/d3/To_Pimp_a_Butterfly.jpg" },
    { id: 3, rank: 3, title: "MOTOMAMI", artist: "Rosalía", year: 2022, rating: 4.7, reviews: "89k", color: "#1a0a0a", accent: "#ff6060", cover: "https://upload.wikimedia.org/wikipedia/en/5/57/Rosalia_-_Motomami.png" },
    { id: 4, rank: 4, title: "Blonde", artist: "Frank Ocean", year: 2016, rating: 4.8, reviews: "176k", color: "#0a1a10", accent: "#5aff9a", cover: "https://upload.wikimedia.org/wikipedia/en/a/a0/Blonde_-_Frank_Ocean.jpeg" },
    { id: 5, rank: 5, title: "Vespertine", artist: "Björk", year: 2001, rating: 4.6, reviews: "67k", color: "#0a0a1a", accent: "#c0a0ff", cover: "https://upload.wikimedia.org/wikipedia/en/2/2e/Bj%C3%B6rk_vespertine_albumcover.jpg" },
    { id: 6, rank: 6, title: "Igor", artist: "Tyler, the Creator", year: 2019, rating: 4.7, reviews: "134k", color: "#1a100a", accent: "#ffaa40", cover: "https://upload.wikimedia.org/wikipedia/en/5/51/Tyler_the_creator_Igor_Album_Cover.jpg" },
    { id: 7, rank: 7, title: "In Rainbows", artist: "Radiohead", year: 2007, rating: 4.7, reviews: "121k", color: "#1a0a10", accent: "#ff8aaa", cover: "https://upload.wikimedia.org/wikipedia/en/e/e5/InRainbows.png" },
    { id: 8, rank: 8, title: "Since I Left You", artist: "The Avalanches", year: 2000, rating: 4.5, reviews: "54k", color: "#0a1a1a", accent: "#40e0d0", cover: "https://upload.wikimedia.org/wikipedia/en/2/2b/Avalanches_sinceleftyou.jpg" },
    { id: 9, rank: 9, title: "Coloured in Red", artist: "Arooj Aftab", year: 2021, rating: 4.5, reviews: "31k", color: "#1a0a0a", accent: "#ff9060", cover: "https://upload.wikimedia.org/wikipedia/en/e/e1/Arooj_Aftab_-_Vulture_Prince_%282021%29.png" },
    { id: 10, rank: 10, title: "Black Messiah", artist: "D'Angelo", year: 2014, rating: 4.6, reviews: "78k", color: "#100a00", accent: "#d4a050", cover: "https://upload.wikimedia.org/wikipedia/en/8/8c/D%27Angelo-BlackMessiah.jpg" },
];

export const FRIENDS_POSTS = [
    {
        id: 1, user: "marina_v", avatar: "M", avatarColor: "#e8507a",
        action: "reseñó", album: "MOTOMAMI", artist: "Rosalía",
        cover: "https://upload.wikimedia.org/wikipedia/en/5/57/Rosalia_-_Motomami.png",
        rating: 5, text: "Rosalía destruyó todo lo que conocíamos sobre el pop en español. Cada canción es un mundo aparte y juntas forman algo que no tiene nombre todavía.",
        likes: 47, comments: 12, time: "hace 23 min", tags: ["pop", "experimental", "flamenco"],
    },
    {
        id: 2, user: "theo_r", avatar: "T", avatarColor: "#4a9eff",
        action: "agregó a su lista", album: "OK Computer", artist: "Radiohead",
        cover: "https://upload.wikimedia.org/wikipedia/en/b/ba/Radioheadokcomputer.png",
        rating: null, text: null, listName: "álbumes que cambiaron mi vida",
        likes: 18, comments: 3, time: "hace 1 h", tags: [],
    },
    {
        id: 3, user: "camille_x", avatar: "C", avatarColor: "#5aff9a",
        action: "calificó", album: "Blonde", artist: "Frank Ocean",
        cover: "https://upload.wikimedia.org/wikipedia/en/a/a0/Blonde_-_Frank_Ocean.jpeg",
        rating: 4.5, text: "Volver a escuchar esto después de años y entender que todo lo que ha salido después intenta ser esto. Intemporal.",
        likes: 92, comments: 28, time: "hace 2 h", tags: ["r&b", "soul", "indie"],
    },
    {
        id: 4, user: "felix_p", avatar: "F", avatarColor: "#c0a0ff",
        action: "reseñó", album: "Igor", artist: "Tyler, the Creator",
        cover: "https://upload.wikimedia.org/wikipedia/en/5/51/Tyler_the_creator_Igor_Album_Cover.jpg",
        rating: 4, text: "Un álbum conceptual sobre enamorarse de alguien que no te puede amar de vuelta. Doloroso y brillante al mismo tiempo.",
        likes: 34, comments: 9, time: "hace 3 h", tags: ["hip-hop", "neo-soul"],
    },
    {
        id: 5, user: "sola_m", avatar: "S", avatarColor: "#ffaa40",
        action: "reseñó", album: "Vespertine", artist: "Björk",
        cover: "https://upload.wikimedia.org/wikipedia/en/2/2e/Bj%C3%B6rk_vespertine_albumcover.jpg",
        rating: 5, text: "Música que suena como si la hubieran grabado dentro de un cristal. No hay nada igual y nunca lo habrá.",
        likes: 61, comments: 15, time: "hace 5 h", tags: ["experimental", "art pop"],
    },
];
