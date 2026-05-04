import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from './navbar';
import Stars from './components/Stars';
import './static/css/profile.css';

function UserProfile() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [userData, setUserData] = useState(null);
    const [recentActivity, setRecentActivity] = useState([]);
    const [favorites, setFavorites] = useState([]);
    const [isFollowing, setIsFollowing] = useState(false);
    const [isLoadingToggle, setIsLoadingToggle] = useState(false);
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('No token found. Please log in.');
                setLoading(false);
                return;
            }

            try {
                // Determine if following
                const followRes = await fetch(`http://localhost:3000/api/is-following/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (followRes.ok) {
                    const followData = await followRes.json();
                    setIsFollowing(followData.isFollowing);
                }

                // Get target user info
                const userRes = await fetch(`http://localhost:3000/api/users/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (userRes.ok) {
                    const data = await userRes.json();
                    setUserData(data);
                } else if (userRes.status === 404) {
                    setError('User not found.');
                    setLoading(false);
                    return;
                } else {
                    setError('Failed to fetch user data.');
                    setLoading(false);
                    return;
                }

                // Get target user activity
                const activityRes = await fetch(`http://localhost:3000/api/users/${id}/activity`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (activityRes.ok) {
                    const activityData = await activityRes.json();
                    setRecentActivity(activityData);
                }

                // Get target user favorites
                const favRes = await fetch(`http://localhost:3000/api/users/${id}/favorites`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (favRes.ok) {
                    const favData = await favRes.json();
                    setFavorites(favData);
                }

            } catch (err) {
                console.error('Error fetching data:', err);
                setError('An error occurred while fetching information.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    const handleToggleFollow = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        setIsLoadingToggle(true);
        try {
            if (isFollowing) {
                // Unfollow
                const res = await fetch(`http://localhost:3000/api/unfollow/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    setIsFollowing(false);
                    setUserData(prev => ({ ...prev, followersCount: Math.max(0, prev.followersCount - 1) }));
                }
            } else {
                // Follow
                const res = await fetch(`http://localhost:3000/api/follow`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ targetUserId: id })
                });
                if (res.ok) {
                    setIsFollowing(true);
                    setUserData(prev => ({ ...prev, followersCount: prev.followersCount + 1 }));
                }
            }
        } catch (err) {
            console.error('Error toggling follow status', err);
        } finally {
            setIsLoadingToggle(false);
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
                    <button className="profile-btn-primary" onClick={() => navigate(-1)}>
                        Go Back
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
                        
                        <div className="profile-stats">
                            <div className="stat-item">
                                <span className="stat-value">{userData?.followingCount || 0}</span>
                                <span className="stat-label">Following</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-value">{userData?.followersCount || 0}</span>
                                <span className="stat-label">Followers</span>
                            </div>
                        </div>

                        <div className="profile-actions">
                            <button 
                                className={`profile-btn-primary ${isFollowing ? 'following' : ''}`} 
                                onClick={handleToggleFollow}
                                disabled={isLoadingToggle}
                                style={isFollowing ? { backgroundColor: '#3f3f46' } : {}}
                            >
                                {isLoadingToggle ? '...' : isFollowing ? 'Dejar de seguir' : 'Seguir'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Top 5 Canciones Section */}
                <div className="profile-section mt-4">
                    <h2 className="section-title">Top 5 Canciones Favoritas</h2>
                    {favorites.length === 0 ? (
                        <p style={{ color: '#a1a1aa' }}>Este usuario aún no ha elegido sus canciones favoritas.</p>
                    ) : (
                        <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '8px' }}>
                            {favorites.map((fav) => (
                                <div key={fav.id} className="friend-card" style={{ flex: '0 0 auto', width: '160px', position: 'relative' }}>
                                    <img src={fav.cover_url || "https://via.placeholder.com/150"} alt={fav.title} style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '8px' }} />
                                    <div className="friend-info" style={{ marginTop: '12px' }}>
                                        <h3 className="friend-name" style={{ fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{fav.title}</h3>
                                        <p style={{ color: '#a1a1aa', fontSize: '0.8rem', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{fav.artist_name}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent Activity Section */}
                <div className="profile-section mt-4">
                    <h2 className="section-title">Actividad Reciente</h2>
                    {recentActivity.length === 0 ? (
                        <p style={{ color: '#a1a1aa' }}>Este usuario aún no ha calificado ninguna canción o álbum.</p>
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

export default UserProfile;
