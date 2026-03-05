import React, { useState, useEffect, useRef } from "react";
import Stars from './Stars';
import { ChevronLeft, ChevronRight } from './Icons';

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

export default function Carousel() {
    const [albums, setAlbums] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [current, setCurrent] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [transitioning, setTransitioning] = useState(false);
    const timerRef = useRef(null);

    useEffect(() => {
        const fetchTopHits = async () => {
            try {
                const response = await fetch('http://localhost:3000/api/spotify/top-hits');
                const data = await response.json();

                if (Array.isArray(data)) {
                    const formattedTracks = data.map((track, index) => ({
                        id: track.id,
                        rank: index + 1,
                        title: track.name,
                        artist: track.artists[0]?.name,
                        year: track.album && track.album.release_date ? track.album.release_date.substring(0, 4) : 'N/A',
                        rating: (Math.random() * (5.0 - 4.0) + 4.0).toFixed(1),
                        reviews: Math.floor(Math.random() * 200) + "k",
                        cover: track.album?.images?.[0]?.url || "https://via.placeholder.com/300"
                    }));
                    setAlbums(formattedTracks);
                }
            } catch (error) {
                console.error("Error fetching Spotify top hits:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTopHits();
    }, []);

    const total = albums.length;

    const advance = (dir = 1) => {
        if (transitioning || total === 0) return;
        setTransitioning(true);
        setTimeout(() => {
            setCurrent(c => (c + dir + total) % total);
            setTransitioning(false);
        }, 300);
    };

    useEffect(() => {
        if (!isPaused && total > 0) {
            timerRef.current = setInterval(() => advance(1), 3200);
        }
        return () => clearInterval(timerRef.current);
    }, [isPaused, current, transitioning, total]);

    if (isLoading) {
        return (
            <section className="carousel-section">
                <div className="section-header">
                    <div>
                        <p className="section-subtitle">Spotify API</p>
                        <h2 className="section-title">Top 10 Caciones</h2>
                    </div>
                </div>
                <div style={{ textAlign: "center", padding: "40px" }}>Cargando canciones...</div>
            </section>
        );
    }

    if (total === 0) {
        return null;
    }

    // Show 3 cards: prev, center, next
    const getIdx = (offset) => (current + offset + total) % total;
    const cards = [
        { album: albums[getIdx(-1)], pos: "left" },
        { album: albums[getIdx(0)], pos: "center" },
        { album: albums[getIdx(1)], pos: "right" },
    ];

    return (
        <section
            className="carousel-section"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            <div className="section-header">
                <div>
                    <p className="section-subtitle">Spotify API</p>
                    <h2 className="section-title">Top 10 Global</h2>
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
                    {albums.map((_, i) => (
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
