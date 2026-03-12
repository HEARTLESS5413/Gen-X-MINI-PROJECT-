import React, { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Heart, Send } from 'lucide-react';
import { users as usersStore, stories as storiesStore } from '../lib/store';

export default function StoryViewer({ stories, startIndex = 0, onClose }) {
    const [currentIndex, setCurrentIndex] = useState(startIndex);
    const [progress, setProgress] = useState(0);
    const [paused, setPaused] = useState(false);
    const [storyUser, setStoryUser] = useState(null);

    const currentStory = stories[currentIndex];

    useEffect(() => {
        if (currentStory) {
            usersStore.getById(currentStory.user_id || currentStory.userId).then(u => setStoryUser(u));
        }
    }, [currentIndex]);

    // Random gradient backgrounds for stories
    const gradients = [
        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
        'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)',
        'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
    ];

    const autoAdvance = useCallback(() => {
        if (currentIndex < stories.length - 1) {
            setCurrentIndex(i => i + 1);
            setProgress(0);
        } else {
            onClose();
        }
    }, [currentIndex, stories.length, onClose]);

    useEffect(() => {
        if (paused) return;
        const duration = 5000; // 5 seconds per story
        const interval = 50;
        const step = (interval / duration) * 100;

        const timer = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    autoAdvance();
                    return 0;
                }
                return prev + step;
            });
        }, interval);

        return () => clearInterval(timer);
    }, [currentIndex, paused, autoAdvance]);

    const goNext = () => {
        if (currentIndex < stories.length - 1) {
            setCurrentIndex(i => i + 1);
            setProgress(0);
        } else {
            onClose();
        }
    };

    const goPrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(i => i - 1);
            setProgress(0);
        }
    };

    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Escape') onClose();
        if (e.key === 'ArrowRight') goNext();
        if (e.key === 'ArrowLeft') goPrev();
    }, [currentIndex]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    if (!currentStory || !storyUser) return null;

    return (
        <div className="story-viewer-overlay" onClick={onClose}>
            <div className="story-viewer" onClick={e => e.stopPropagation()}>
                {/* Progress bars */}
                <div className="story-progress-container">
                    {stories.map((_, i) => (
                        <div key={i} className="story-progress-bar">
                            <div
                                className="story-progress-fill"
                                style={{
                                    width: i < currentIndex ? '100%' : i === currentIndex ? `${progress}%` : '0%',
                                    transition: i === currentIndex ? 'none' : 'width 0.3s'
                                }}
                            />
                        </div>
                    ))}
                </div>

                {/* Header */}
                <div className="story-viewer-header">
                    <img className="avatar avatar-sm" src={storyUser.avatar} alt="" />
                    <span className="story-viewer-username">{storyUser.username}</span>
                    <span className="story-viewer-time">
                        {currentStory.createdAt ? new Date(currentStory.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '2h'}
                    </span>
                    <button className="story-viewer-close" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                {/* Story Content */}
                <div
                    className="story-viewer-content"
                    style={{ background: gradients[currentIndex % gradients.length] }}
                    onMouseDown={() => setPaused(true)}
                    onMouseUp={() => setPaused(false)}
                    onTouchStart={() => setPaused(true)}
                    onTouchEnd={() => setPaused(false)}
                >
                    <div className="story-viewer-text">
                        <img src={storyUser.avatar} alt="" className="story-big-avatar" />
                        <h2>{storyUser.name}</h2>
                        <p>{storyUser.bio?.split('\n')[0] || '✨'}</p>
                    </div>
                </div>

                {/* Navigation Areas */}
                <div className="story-nav-left" onClick={goPrev} />
                <div className="story-nav-right" onClick={goNext} />

                {/* Nav Arrows */}
                {currentIndex > 0 && (
                    <button className="story-arrow story-arrow-left" onClick={goPrev}>
                        <ChevronLeft size={28} />
                    </button>
                )}
                {currentIndex < stories.length - 1 && (
                    <button className="story-arrow story-arrow-right" onClick={goNext}>
                        <ChevronRight size={28} />
                    </button>
                )}

                {/* Reply bar */}
                <div className="story-reply-bar">
                    <input placeholder="Reply to story..." className="story-reply-input" />
                    <button className="btn-ghost"><Heart size={22} /></button>
                    <button className="btn-ghost"><Send size={22} /></button>
                </div>
            </div>
        </div>
    );
}
