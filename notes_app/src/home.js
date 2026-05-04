import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import './static/css/home.css';
import Navbar from './navbar';
import Carousel from './components/Carousel';
import Feed from './components/Feed';
import RatingModal from './components/RatingModal';

export default function Home() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [filterType, setFilterType] = useState("all");
    const [selectedItem, setSelectedItem] = useState(null);

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
            const [spotifyRes, usersRes] = await Promise.all([
                fetch(`http://localhost:3000/api/spotify/search?q=${encodeURIComponent(searchQuery)}`),
                fetch(`http://localhost:3000/api/users/search?q=${encodeURIComponent(searchQuery)}`)
            ]);

            const data = await spotifyRes.json();
            const usersData = await usersRes.ok ? await usersRes.json() : [];

            if (data || usersData) {
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
                    ...(data?.artists?.items.map(artist => ({
                        id: artist.id,
                        title: artist.name,
                        artist: "Artist",
                        cover: artist.images && artist.images.length > 0 ? artist.images[0].url : 'https://via.placeholder.com/150',
                        type: 'artist'
                    })) || []),
                    ...(usersData?.map(user => ({
                        id: user.id,
                        title: `@${user.username}`,
                        artist: `${user.first_name} ${user.last_name}`,
                        cover: `https://ui-avatars.com/api/?name=${user.username}&background=random&color=fff&size=150`,
                        type: 'user'
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
        setFilterType("all");
    };

    // Filter results based on active tab
    const filteredResults = filterType === "all"
        ? searchResults
        : searchResults.filter(r => r.type === filterType);

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

                    {/* Filter Tabs */}
                    {!isLoading && searchResults.length > 0 && (
                        <div className="search-filter-tabs">
                            {[
                                { key: "all", label: "Todos", icon: "" },
                                { key: "track", label: "Canciones", icon: "" },
                                { key: "album", label: "Álbumes", icon: "" },
                                { key: "artist", label: "Artistas", icon: "" },
                                { key: "user", label: "Usuarios", icon: "" },
                            ].map(tab => {
                                const count = tab.key === "all"
                                    ? searchResults.length
                                    : searchResults.filter(r => r.type === tab.key).length;
                                return (
                                    <button
                                        key={tab.key}
                                        className={`filter-tab ${filterType === tab.key ? 'active' : ''}`}
                                        onClick={() => setFilterType(tab.key)}
                                    >
                                        <span className="filter-tab-icon">{tab.icon}</span>
                                        {tab.label}
                                        <span className="filter-tab-count">{count}</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {isLoading ? (
                        <div className="loading-spinner-container">
                            <div className="loading-spinner"></div>
                            <p>Buscando en Spotify...</p>
                        </div>
                    ) : filteredResults.length > 0 ? (
                        <div className="search-grid">
                            {filteredResults.map((result) => (
                                <div 
                                    key={`${result.type}-${result.id}`} 
                                    className={`search-card ${result.type !== 'artist' ? 'clickable' : ''}`}
                                    onClick={() => {
                                        if (result.type === 'user') {
                                            navigate(`/user/${result.id}`);
                                        } else if (result.type !== 'artist') {
                                            setSelectedItem(result);
                                        }
                                    }}
                                    style={result.type !== 'artist' ? { cursor: 'pointer' } : {}}
                                >
                                    <div className="search-card-img-wrapper">
                                        <img
                                            src={result.cover || "https://via.placeholder.com/150"}
                                            alt={result.title}
                                            className={`search-card-img ${result.type === 'artist' || result.type === 'user' ? 'artist-img' : ''}`}
                                            onError={(e) => { e.target.src = "https://via.placeholder.com/150"; e.target.style.background = "#e5e7eb"; }}
                                        />
                                    </div>
                                    <div className="search-card-info">
                                        <h3 className="search-card-title">{result.title}</h3>
                                        <p className="search-card-artist">{result.artist}</p>
                                        <span className={`search-card-type badge badge-${result.type}`}>
                                            {result.type === 'track' ? 'Canción' : result.type === 'album' ? 'Álbum' : result.type === 'user' ? 'Usuario' : 'Artista'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : searchResults.length > 0 ? (
                        <div className="no-results-state">
                            <p>No hay resultados de este tipo. Prueba otro filtro.</p>
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

            {selectedItem && (
                <RatingModal 
                    item={selectedItem} 
                    onClose={() => setSelectedItem(null)} 
                    onSubmitSuccess={() => {
                        setSelectedItem(null);
                        // Optional: trigger a small success toast/alert
                        alert("¡Calificación guardada con éxito!");
                    }}
                />
            )}
        </div>
    );
}
