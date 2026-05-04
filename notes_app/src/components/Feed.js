import React, { useState, useEffect } from "react";
import Stars from './Stars';
import { HeartIcon, ChatIcon } from './Icons';


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

export default function Feed() {
    const [posts, setPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchFeed = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                setIsLoading(false);
                return;
            }

            try {
                const response = await fetch('http://localhost:3000/api/feed', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();

                if (response.ok && Array.isArray(data) && data.length > 0) {
                    const dbPosts = data.map((activity, index) => {
                        return {
                            id: index,
                            user: activity.username,
                            avatar: activity.username.charAt(0).toUpperCase(),
                            avatarColor: '#1DB954',
                            action: activity.review_text ? 'escribió una reseña para' : 'calificó',
                            listName: null,
                            rating: activity.score,
                            text: activity.review_text,
                            likes: 0,
                            comments: 0,
                            time: new Date(activity.created_at).toLocaleDateString(),
                            tags: [],
                            album: activity.title,
                            artist: activity.artist_name,
                            cover: activity.cover_url || 'https://via.placeholder.com/150',
                        };
                    });

                    setPosts(dbPosts);
                } else {
                    // Fallback to empty or mock
                    setPosts([]);
                }
            } catch (error) {
                console.error("Error fetching feed:", error);
                setPosts([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchFeed();
    }, []);

    return (
        <section className="feed-section">
            <div className="section-header space-between">
                <div>
                    <p className="section-subtitle">Actividad Reciente</p>
                    <h2 className="section-title">Qué escuchan tus amigos</h2>
                </div>
                <button className="ver-todo-btn">
                    Ver todo
                </button>
            </div>

            {isLoading ? (
                <div style={{ textAlign: "center", padding: "40px", color: "#9ca3af" }}>
                    <div className="loading-spinner" style={{ margin: "0 auto 12px" }}></div>
                    Cargando actividad...
                </div>
            ) : posts.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", color: "#9ca3af" }}>
                    No hay actividad reciente. Intenta seguir a otros usuarios.
                </div>
            ) : (
                <div className="feed-list">
                    {posts.map((post, i) => (
                        <FeedPost key={post.id} post={post} index={i} />
                    ))}
                </div>
            )}
        </section>
    );
}
