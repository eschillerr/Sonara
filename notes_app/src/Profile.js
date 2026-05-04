import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './navbar';
import Stars from './components/Stars';
import './static/css/profile.css';

function Profile() {
    const [userData, setUserData] = useState(null);
    const [friends, setFriends] = useState([]);
    const [recentActivity, setRecentActivity] = useState([]);
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('No token found. Please log in.');
                setLoading(false);
                return;
            }

            try {
                let currentUserId;

                // Obtenemos los datos del usuario actual
                const response = await fetch('http://localhost:3000/api/me', {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.ok) {
                    const data = await response.json();
                    setUserData(data);
                    currentUserId = data.id;
                } else {
                    setError('Failed to fetch session. Invalid or expired token.');
                    localStorage.removeItem('token');
                    setLoading(false);
                    return;
                }

                // Obtenemos los amigos de la base de datos
                const friendsResponse = await fetch('http://localhost:3000/api/friends', {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (friendsResponse.ok) {
                    const dataFriends = await friendsResponse.json();
                    // Mapear los datos de la BD a la estructura visual de las cards
                    const formattedFriends = dataFriends.map(f => ({
                        id: f.id,
                        name: `@${f.username}`,
                        avatar: `https://ui-avatars.com/api/?name=${f.username}&background=random&color=fff&size=150`
                    }));
                    setFriends(formattedFriends);
                }

                // Obtenemos la actividad reciente (calificaciones)
                const activityResponse = await fetch('http://localhost:3000/api/my-activity', {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (activityResponse.ok) {
                    const activityData = await activityResponse.json();
                    setRecentActivity(activityData);
                }

                // Get favorites
                if (currentUserId) {
                    const favResponse = await fetch(`http://localhost:3000/api/users/${currentUserId}/favorites`, {
                        method: 'GET',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (favResponse.ok) {
                        const favData = await favResponse.json();
                        setFavorites(favData);
                    }
                }

            } catch (err) {
                console.error('Error fetching data:', err);
                setError('An error occurred while fetching information.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/');
    };

    const handleRemoveFavorite = async (trackId) => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const res = await fetch(`http://localhost:3000/api/favorites/${trackId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setFavorites(prev => prev.filter(f => f.track_id !== trackId));
            }
        } catch (err) {
            console.error("Error removing favorite:", err);
        }
    };

    if (loading) {
        return (
            <div className="profile-container">
                <Navbar />
                <div className="profile-loading">
                    <div className="profile-spinner"></div>
                    <p>Loading profile...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="profile-container">
                <Navbar />
                <div className="profile-error">
                    <h2>Oops!</h2>
                    <p>{error}</p>
                    <button className="profile-btn-primary" onClick={() => navigate('/')}>
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="profile-container">
            <Navbar />
            
            <div className="profile-content">
                {/* Profile Header Card */}
                <div className="profile-header-card">
                    <div className="profile-avatar-wrapper">
                        <img 
                            src={`https://ui-avatars.com/api/?name=${userData?.username || 'User'}&background=random&color=fff&size=150`} 
                            alt={`${userData?.username}'s avatar`} 
                            className="profile-main-avatar"
                        />
                    </div>
                    
                    <div className="profile-user-info">
                        <h1 className="profile-username">{userData?.username || 'Username'}</h1>
                        <p className="profile-handle">@{userData?.username?.toLowerCase().replace(/\s/g, '') || 'username'}</p>
                        <p className="profile-bio">Music lover and passionate listener. Exploring the world of sound.</p>
                        
                        <div className="profile-stats">
                            <div className="stat-item">
                                <span className="stat-value">{friends.length}</span>
                                <span className="stat-label">Following</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-value">124</span>
                                <span className="stat-label">Playlists</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-value">12.5k</span>
                                <span className="stat-label">Followers</span>
                            </div>
                        </div>

                        <div className="profile-actions">
                            <button className="profile-btn-primary">Edit Profile</button>
                            <button className="profile-btn-secondary" onClick={handleLogout}>Logout</button>
                        </div>
                    </div>
                </div>

                {/* Top 5 Canciones Section */}
                <div className="profile-section mt-4">
                    <h2 className="section-title">Top 5 Canciones Favoritas</h2>
                    {favorites.length === 0 ? (
                        <p style={{ color: '#a1a1aa' }}>Aún no has elegido tus canciones favoritas.</p>
                    ) : (
                        <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '8px' }}>
                            {favorites.map((fav) => (
                                <div key={fav.id} className="friend-card" style={{ flex: '0 0 auto', width: '160px', position: 'relative' }}>
                                    <img src={fav.cover_url || "https://via.placeholder.com/150"} alt={fav.title} style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '8px' }} />
                                    <div className="friend-info" style={{ marginTop: '12px' }}>
                                        <h3 className="friend-name" style={{ fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{fav.title}</h3>
                                        <p style={{ color: '#a1a1aa', fontSize: '0.8rem', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{fav.artist_name}</p>
                                    </div>
                                    <button 
                                        className="friend-action-btn" 
                                        title="Eliminar de Favoritos"
                                        onClick={() => handleRemoveFavorite(fav.track_id)}
                                        style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', padding: '4px', cursor: 'pointer', color: 'white' }}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Following Section */}
                <div className="profile-section mt-4">
                    <h2 className="section-title">Following</h2>
                    <div className="friends-grid">
                        {friends.map(friend => (
                            <div key={friend.id} className="friend-card">
                                <img src={friend.avatar} alt={friend.name} className="friend-avatar" />
                                <div className="friend-info">
                                    <h3 className="friend-name">{friend.name}</h3>
                                </div>
                                <button className="friend-action-btn" title="Unfollow">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                        <circle cx="12" cy="7" r="4"></circle>
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Activity Section */}
                <div className="profile-section mt-4">
                    <h2 className="section-title">Actividad Reciente</h2>
                    {recentActivity.length === 0 ? (
                        <p style={{ color: '#a1a1aa' }}>Aún no has calificado ninguna canción o álbum.</p>
                    ) : (
                        <div className="recent-activity-list" style={{ display: 'grid', gap: '16px', marginTop: '16px' }}>
                            {recentActivity.map((activity, index) => (
                                <div key={index} className="activity-card" style={{ 
                                    display: 'flex', gap: '16px', backgroundColor: '#27272a', 
                                    padding: '16px', borderRadius: '12px', alignItems: 'flex-start' 
                                }}>
                                    <img 
                                        src={activity.cover_url || "https://via.placeholder.com/150"} 
                                        alt={activity.title} 
                                        style={{ width: '80px', height: '80px', borderRadius: '8px', objectFit: 'cover' }} 
                                    />
                                    <div className="activity-details" style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div>
                                                <h3 style={{ margin: '0 0 4px', fontSize: '1.1rem', color: 'white' }}>{activity.title}</h3>
                                                <p style={{ margin: '0 0 8px', color: '#a1a1aa', fontSize: '0.9rem' }}>{activity.artist_name}</p>
                                            </div>
                                            <span style={{ fontSize: '0.8rem', color: '#a1a1aa' }}>
                                                {new Date(activity.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                            <Stars rating={activity.score} />
                                        </div>
                                        {activity.review_text && (
                                            <p style={{ 
                                                margin: 0, color: '#e4e4e7', fontSize: '0.95rem', 
                                                fontStyle: 'italic', borderLeft: '2px solid #3b82f6',
                                                paddingLeft: '10px'
                                            }}>
                                                "{activity.review_text}"
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Profile;
