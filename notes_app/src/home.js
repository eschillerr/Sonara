import React, { useState } from "react";
import './static/css/home.css';
import Navbar from './navbar';
import Carousel from './components/Carousel';
import Feed from './components/Feed';

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
