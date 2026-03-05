import React, { useState, useEffect } from "react";
import Stars from './Stars';
import { HeartIcon, ChatIcon } from './Icons';
import { FRIENDS_POSTS } from '../data/mockData';

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
