import React, { useState, useEffect } from 'react';

export default function LoadingScreen({ onFinish }) {
    const [progress, setProgress] = useState(0);
    const [phase, setPhase] = useState('loading'); // loading, reveal

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setPhase('reveal');
                    setTimeout(() => onFinish && onFinish(), 800);
                    return 100;
                }
                return prev + Math.random() * 8 + 2;
            });
        }, 60);
        return () => clearInterval(interval);
    }, [onFinish]);

    return (
        <div className={`loading-screen ${phase === 'reveal' ? 'loading-exit' : ''}`}>
            {/* Animated background orbs */}
            <div className="loading-orb loading-orb-1" />
            <div className="loading-orb loading-orb-2" />
            <div className="loading-orb loading-orb-3" />

            <div className="loading-content">
                {/* Animated logo */}
                <div className="loading-logo-wrap">
                    <div className="loading-logo">Rimi</div>
                    <div className="loading-logo-glow" />
                </div>

                {/* Tagline */}
                <div className="loading-tagline">
                    {'connect. create. vibe.'.split('').map((char, i) => (
                        <span key={i} className="loading-char" style={{ animationDelay: `${i * 0.04}s` }}>
                            {char === ' ' ? '\u00A0' : char}
                        </span>
                    ))}
                </div>

                {/* Progress bar */}
                <div className="loading-bar-track">
                    <div className="loading-bar-fill" style={{ width: `${Math.min(progress, 100)}%` }} />
                    <div className="loading-bar-glow" style={{ left: `${Math.min(progress, 100)}%` }} />
                </div>

                <div className="loading-percent">{Math.min(Math.round(progress), 100)}%</div>
            </div>
        </div>
    );
}
