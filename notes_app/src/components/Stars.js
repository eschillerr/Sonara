import React from 'react';
import { StarIcon } from './Icons';

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

export default Stars;
