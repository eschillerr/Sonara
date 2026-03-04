import React, { useState, useEffect, useRef } from "react";
import './static/css/home.css';
import Navbar from './navbar';

// ── Mock Data ────────────────────────────────────────────────────────────────

const TOP_ALBUMS = [
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

const FRIENDS_POSTS = [
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

// ── Icons ────────────────────────────────────────────────────────────────────

const StarIcon = ({ filled }) => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
);

const HeartIcon = ({ size = 16, filled = false }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
);

const ChatIcon = ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
);

const ChevronLeft = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <polyline points="15 18 9 12 15 6" />
    </svg>
);

const ChevronRight = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <polyline points="9 18 15 12 9 6" />
    </svg>
);

// ── Star Rating ──────────────────────────────────────────────────────────────

const Stars = ({ rating, color = "#111827" }) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
        stars.push(
            <span key={i} style={{ color: i <= rating ? color : "#d1d5db" }}>
                <StarIcon filled={i <= rating} />
            </span>
        );
    }
    return <span className="stars-container">{stars}</span>;
};

// ── Shared Carousel Item Component ──────────────────────────────────────────

function CarouselCard({ album, pos, transitioning }) {
    const isCenter = pos === "center";

    return (
        <div className={`carousel-card-wrapper pos-${pos} ${transitioning ? 'transitioning' : ''}`}>
            <div className={`carousel-card ${isCenter ? 'center-card' : 'side-card'}`}>
                {/* Album cover */}
                <div className="carousel-cover-container">
                    <img
                        src={album.cover}
                        alt={album.title}
                        className="carousel-cover"
                        onError={e => { e.target.style.background = "#e5e7eb"; }}
                    />
                    {/* Rank badge */}
                    <div className="carousel-badge">
                        #{album.rank}
                    </div>
                </div>

                {/* Info (Only visible strictly on the center card for elegance) */}
                {isCenter && (
                    <div className="carousel-info">
                        <p className="carousel-title">
                            {album.title}
                        </p>
                        <p className="carousel-artist">{album.artist} · {album.year}</p>
                        <div className="carousel-stats">
                            <div className="carousel-rating">
                                <Stars rating={Math.round(album.rating)} />
                                <span className="rating-number">{album.rating}</span>
                            </div>
                            <span className="reviews-count">{album.reviews} reseñas</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Carousel Section ────────────────────────────────────────────────────────

function Carousel() {
    const [current, setCurrent] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [transitioning, setTransitioning] = useState(false);
    const timerRef = useRef(null);

    const total = TOP_ALBUMS.length;

    const advance = (dir = 1) => {
        if (transitioning) return;
        setTransitioning(true);
        setTimeout(() => {
            setCurrent(c => (c + dir + total) % total);
            setTransitioning(false);
        }, 300);
    };

    useEffect(() => {
        if (!isPaused) {
            timerRef.current = setInterval(() => advance(1), 3200);
        }
        return () => clearInterval(timerRef.current);
    }, [isPaused, current, transitioning]);

    // Show 3 cards: prev, center, next
    const getIdx = (offset) => (current + offset + total) % total;
    const cards = [
        { album: TOP_ALBUMS[getIdx(-1)], pos: "left" },
        { album: TOP_ALBUMS[getIdx(0)], pos: "center" },
        { album: TOP_ALBUMS[getIdx(1)], pos: "right" },
    ];

    return (
        <section
            className="carousel-section"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            <div className="section-header">
                <div>
                    <p className="section-subtitle">Este mes</p>
                    <h2 className="section-title">Los 10 más escuchados</h2>
                </div>
            </div>

            <div className="carousel-track-container">
                {cards.map(({ album, pos }) => (
                    <CarouselCard
                        key={album.id}
                        album={album}
                        pos={pos}
                        transitioning={transitioning}
                    />
                ))}
            </div>

            <div className="carousel-controls">
                <button className="carousel-btn prev-btn" onClick={() => advance(-1)}>
                    <ChevronLeft />
                </button>

                <div className="carousel-dots">
                    {TOP_ALBUMS.map((_, i) => (
                        <button
                            key={i}
                            className={`carousel-dot ${i === current ? 'active' : ''}`}
                            onClick={() => { setTransitioning(false); setCurrent(i); }}
                        />
                    ))}
                </div>

                <button className="carousel-btn next-btn" onClick={() => advance(1)}>
                    <ChevronRight />
                </button>
            </div>
        </section>
    );
}

// ── Feed Post Component ─────────────────────────────────────────────────────

function FeedPost({ post, index }) {
    const [liked, setLiked] = useState(false);
    const [likes, setLikes] = useState(post.likes);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setVisible(true), index * 100);
        return () => clearTimeout(timer);
    }, [index]);

    const toggleLike = () => {
        setLiked(l => !l);
        setLikes(n => liked ? n - 1 : n + 1);
    };

    return (
        <article className={`feed-post ${visible ? 'visible' : ''}`}>
            <div className="feed-post-inner">
                {/* Avatar */}
                <div
                    className="feed-avatar"
                    style={{ backgroundColor: post.avatarColor }}
                >
                    {post.avatar}
                </div>

                <div className="feed-content">
                    {/* Header */}
                    <div className="feed-header">
                        <span className="feed-user">@{post.user}</span>
                        <span className="feed-action">{post.action}</span>
                        {post.listName && (
                            <span className="feed-listname">"{post.listName}"</span>
                        )}
                        <span className="feed-time">{post.time}</span>
                    </div>

                    {/* Album row */}
                    <div className={`feed-album-row ${!post.text ? 'no-margin' : ''}`}>
                        <img
                            src={post.cover}
                            alt={post.album}
                            className="feed-album-cover"
                            onError={e => { e.target.style.background = "#e5e7eb"; }}
                        />
                        <div className="feed-album-info">
                            <p className="feed-album-title">{post.album}</p>
                            <p className="feed-album-artist">{post.artist}</p>
                            {post.rating && (
                                <div className="feed-album-rating">
                                    <Stars rating={Math.floor(post.rating)} />
                                    <span className="feed-rating-val">{post.rating}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Review text */}
                    {post.text && (
                        <p className="feed-review-text">
                            "{post.text}"
                        </p>
                    )}

                    {/* Tags */}
                    {post.tags.length > 0 && (
                        <div className="feed-tags">
                            {post.tags.map(tag => (
                                <span key={tag} className="feed-tag">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="feed-actions">
                        <button
                            onClick={toggleLike}
                            className={`feed-action-btn ${liked ? 'liked' : ''}`}
                        >
                            <HeartIcon filled={liked} />
                            <span>{likes}</span>
                        </button>
                        <button className="feed-action-btn">
                            <ChatIcon />
                            <span>{post.comments}</span>
                        </button>
                    </div>
                </div>
            </div>
        </article>
    );
}

// ── Feed Section ────────────────────────────────────────────────────────────

function Feed() {
    return (
        <section className="feed-section">
            <div className="section-header space-between">
                <div>
                    <p className="section-subtitle">Red social</p>
                    <h2 className="section-title">Qué escuchan tus amigos</h2>
                </div>
                <button className="ver-todo-btn">
                    Ver todo
                </button>
            </div>

            <div className="feed-list">
                {FRIENDS_POSTS.map((post, i) => (
                    <FeedPost key={post.id} post={post} index={i} />
                ))}
            </div>
        </section>
    );
}

// ── Main Home Component ─────────────────────────────────────────────────────

export default function Home() {
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Search function to query the backend Spotify endpoint
    const handleSearch = async (e) => {
        e.preventDefault();

        if (!searchQuery.trim()) {
            setIsSearching(false);
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        setIsLoading(true);

        try {
            // Call our local backend instead of Spotify directly
            const response = await fetch(`http://localhost:3000/api/spotify/search?q=${encodeURIComponent(searchQuery)}`);
            const data = await response.json();

            if (data && data.tracks && data.tracks.items) {
                // Formatting results to be consistent for our UI
                const formattedResults = [
                    ...(data.tracks.items.map(track => ({
                        id: track.id,
                        title: track.name,
                        artist: track.artists[0]?.name,
                        cover: track.album?.images[0]?.url,
                        type: 'track'
                    })) || []),
                    ...(data.albums?.items.map(album => ({
                        id: album.id,
                        title: album.name,
                        artist: album.artists[0]?.name,
                        cover: album.images[0]?.url,
                        type: 'album'
                    })) || []),
                    ...(data.artists?.items.map(artist => ({
                        id: artist.id,
                        title: artist.name,
                        artist: "Artist",
                        cover: artist.images && artist.images.length > 0 ? artist.images[0].url : 'https://via.placeholder.com/150',
                        type: 'artist'
                    })) || [])
                ];

                setSearchResults(formattedResults);
            }
        } catch (error) {
            console.error("Error fetching search results:", error);
            setSearchResults([]);
        } finally {
            setIsLoading(false);
        }
    };

    const clearSearch = () => {
        setSearchQuery("");
        setIsSearching(false);
        setSearchResults([]);
    };

    return (
        <div className="home-container">
            <Navbar />

            {/* Search Bar Section */}
            <div className="search-container">
                <form onSubmit={handleSearch} className="search-bar-form">
                    <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Buscar artistas, canciones o álbumes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {isSearching && (
                        <button type="button" className="clear-search-btn" onClick={clearSearch}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    )}
                </form>
            </div>

            {/* Content Area - Conditionally Rendered */}
            {isSearching ? (
                // Search Results View
                <section className="search-results-section">
                    <div className="section-header">
                        <h2 className="section-title">Resultados de Búsqueda</h2>
                        <p className="search-meta">Mostrando resultados para "{searchQuery}"</p>
                    </div>

                    {isLoading ? (
                        <div className="loading-spinner-container">
                            <div className="loading-spinner"></div>
                            <p>Buscando en Spotify...</p>
                        </div>
                    ) : searchResults.length > 0 ? (
                        <div className="search-grid">
                            {searchResults.map((result) => (
                                <div key={`${result.type}-${result.id}`} className="search-card">
                                    <div className="search-card-img-wrapper">
                                        <img
                                            src={result.cover || "https://via.placeholder.com/150"}
                                            alt={result.title}
                                            className={`search-card-img ${result.type === 'artist' ? 'artist-img' : ''}`}
                                            onError={(e) => { e.target.src = "https://via.placeholder.com/150"; e.target.style.background = "#e5e7eb"; }}
                                        />
                                    </div>
                                    <div className="search-card-info">
                                        <h3 className="search-card-title">{result.title}</h3>
                                        <p className="search-card-artist">{result.artist}</p>
                                        <span className="search-card-type badge">{result.type}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="no-results-state">
                            <p>No encontramos nada para tu búsqueda.</p>
                        </div>
                    )}
                </section>
            ) : (
                // Default View
                <>
                    <Carousel />
                    <div className="section-divider" />
                    <Feed />
                </>
            )}
        </div>
    );
}
