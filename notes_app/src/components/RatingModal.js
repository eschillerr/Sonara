import React, { useState } from 'react';
import './../static/css/home.css';

export default function RatingModal({ item, onClose, onSubmitSuccess }) {
    const [score, setScore] = useState(0);
    const [hoverScore, setHoverScore] = useState(0);
    const [review, setReview] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmittingFav, setIsSubmittingFav] = useState(false);
    const [error, setError] = useState(null);

    const handleFavorite = async () => {
        setIsSubmittingFav(true);
        setError(null);

        const token = localStorage.getItem('token');
        if (!token) {
            setError("No estás autenticado.");
            setIsSubmittingFav(false);
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/api/favorites', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    spotifyId: item.id,
                    type: item.type
                })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Error al añadir a favoritos.');
            }

            setIsSubmittingFav(false);
            alert("Añadida a tus Top 5 Favoritas");
            if (onSubmitSuccess) {
                onSubmitSuccess();
            } else {
                onClose();
            }
        } catch (err) {
            setError(err.message);
            setIsSubmittingFav(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (score === 0) {
            setError("Por favor, selecciona una calificación (1-5 estrellas).");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        const token = localStorage.getItem('token');
        if (!token) {
            setError("No estás autenticado.");
            setIsSubmitting(false);
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/api/ratings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    spotifyId: item.id,
                    type: item.type,
                    score,
                    review
                })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Error al guardar la calificación.');
            }

            // Exito
            setIsSubmitting(false);
            if (onSubmitSuccess) {
                onSubmitSuccess();
            } else {
                onClose();
            }
        } catch (err) {
            setError(err.message);
            setIsSubmitting(false);
        }
    };

    return (
        <div className="rating-modal-overlay" onClick={onClose} style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
            backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', 
            justifyContent: 'center', alignItems: 'center'
        }}>
            <div className="rating-modal-content" onClick={(e) => e.stopPropagation()} style={{
                backgroundColor: '#18181b', color: 'white', padding: '24px', 
                borderRadius: '12px', width: '90%', maxWidth: '400px'
            }}>
                <button 
                    onClick={onClose} 
                    style={{ float: 'right', background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer', fontSize: '1.2rem' }}
                >✕</button>
                
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', gap: '16px' }}>
                    <img 
                        src={item.cover || "https://via.placeholder.com/150"} 
                        alt={item.title} 
                        style={{ width: '80px', height: '80px', borderRadius: '8px', objectFit: 'cover' }}
                    />
                    <div>
                        <h3 style={{ margin: '0 0 4px', fontSize: '1.2rem' }}>{item.title}</h3>
                        <p style={{ margin: 0, color: '#a1a1aa', fontSize: '0.9rem' }}>{item.artist}</p>
                        <span style={{ 
                            display: 'inline-block', padding: '2px 8px', borderRadius: '12px', 
                            fontSize: '0.7rem', marginTop: '6px', backgroundColor: '#3f3f46' 
                        }}>
                            {item.type === 'track' ? 'Canción' : item.type === 'album' ? 'Álbum' : 'Artista'}
                        </span>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                        <p style={{ margin: '0 0 10px', fontSize: '0.9rem', color: '#e4e4e7' }}>¿Qué te pareció?</p>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                            {[1, 2, 3, 4, 5].map(star => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setScore(star)}
                                    onMouseEnter={() => setHoverScore(star)}
                                    onMouseLeave={() => setHoverScore(0)}
                                    style={{
                                        background: 'none', border: 'none', cursor: 'pointer', 
                                        padding: '0', fontSize: '2rem', 
                                        color: star <= (hoverScore || score) ? '#eab308' : '#3f3f46',
                                        transition: 'color 0.2s'
                                    }}
                                >
                                    ★
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#e4e4e7' }}>
                            Reseña (Opcional)
                        </label>
                        <textarea
                            value={review}
                            onChange={(e) => setReview(e.target.value)}
                            placeholder="Escribe lo que piensas aquí..."
                            style={{
                                width: '100%', padding: '12px', borderRadius: '8px', 
                                border: '1px solid #3f3f46', backgroundColor: '#27272a', 
                                color: 'white', minHeight: '80px', resize: 'vertical',
                                boxSizing: 'border-box', fontFamily: 'inherit'
                            }}
                        />
                    </div>

                    {error && <div style={{ color: '#ef4444', marginBottom: '16px', fontSize: '0.9rem', textAlign: 'center' }}>{error}</div>}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <button 
                            type="submit" 
                            disabled={isSubmitting || isSubmittingFav}
                            style={{
                                width: '100%', padding: '12px', borderRadius: '24px',
                                backgroundColor: score > 0 ? '#10b981' : '#3f3f46', 
                                color: 'white', border: 'none', fontWeight: 'bold',
                                cursor: score > 0 ? 'pointer' : 'not-allowed',
                                transition: 'background-color 0.2s'
                            }}
                        >
                            {isSubmitting ? 'Guardando...' : 'Guardar Calificación'}
                        </button>

                        <button 
                            type="button" 
                            onClick={handleFavorite}
                            disabled={isSubmitting || isSubmittingFav}
                            style={{
                                width: '100%', padding: '12px', borderRadius: '24px',
                                backgroundColor: '#27272a', 
                                color: '#eab308', border: '1px solid #eab308', fontWeight: 'bold',
                                cursor: 'pointer',
                                transition: 'background-color 0.2s'
                            }}
                        >
                            {isSubmittingFav ? 'Añadiendo...' : 'Añadir a Favoritos ⭐'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
