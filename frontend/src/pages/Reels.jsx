import React, { useState, useRef, useEffect } from 'react';
import { Heart, MessageCircle, Send, Bookmark, Music, MoreHorizontal, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { posts as postsStore, users as usersStore, likes as likesStore } from '../lib/store';
import { useNavigate } from 'react-router-dom';

// Simulated reel data
const REEL_VIBES = [
    { gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', emoji: '🎬', song: 'Trending Sound • 2.3M' },
    { gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', emoji: '🔥', song: 'Viral Beat • 5.1M' },
    { gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', emoji: '✨', song: 'Chill Vibes • 890K' },
    { gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', emoji: '🌟', song: 'Party Mix • 3.7M' },
    { gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', emoji: '💫', song: 'Lo-fi Dreams • 1.2M' },
    { gradient: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)', emoji: '🎶', song: 'Bass Drop • 4.5M' },
    { gradient: 'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)', emoji: '🎸', song: 'Rock On • 780K' },
    { gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)', emoji: '💃', song: 'Dance Floor • 6.2M' },
];

function ReelCard({ post, vibe, index }) {
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();
    const postUser = usersStore.getById(post.userId);
    const [liked, setLiked] = useState(currentUser ? likesStore.isLiked(currentUser.id, post.id) : false);
    const [likeCount, setLikeCount] = useState(post.likes);
    const [showHeart, setShowHeart] = useState(false);
    const cardRef = useRef(null);

    const handleLike = () => {
        if (!currentUser) return;
        const isNowLiked = likesStore.toggle(currentUser.id, post.id);
        setLiked(isNowLiked);
        setLikeCount(prev => isNowLiked ? prev + 1 : prev - 1);
    };

    const handleDoubleTap = () => {
        if (!liked) handleLike();
        setShowHeart(true);
        setTimeout(() => setShowHeart(false), 1000);
    };

    return (
        <div className="reel-card" ref={cardRef} onDoubleClick={handleDoubleTap}>
            <div className="reel-background" style={{ background: vibe.gradient }}>
                <img src={post.image} alt="" className="reel-image" />
                {showHeart && (
                    <div className="reel-heart-animation">
                        <Heart size={80} fill="white" color="white" />
                    </div>
                )}
            </div>

            {/* Right side actions */}
            <div className="reel-actions">
                <button className={`reel-action-btn ${liked ? 'liked' : ''}`} onClick={handleLike}>
                    <Heart size={28} fill={liked ? '#ff3040' : 'none'} color={liked ? '#ff3040' : 'white'} />
                    <span>{likeCount}</span>
                </button>
                <button className="reel-action-btn">
                    <MessageCircle size={28} />
                    <span>{Math.floor(Math.random() * 200)}</span>
                </button>
                <button className="reel-action-btn">
                    <Send size={28} />
                </button>
                <button className="reel-action-btn">
                    <Bookmark size={28} />
                </button>
                <button className="reel-action-btn">
                    <MoreHorizontal size={28} />
                </button>
                <div className="reel-music-disc">
                    <img src={postUser?.avatar} alt="" />
                </div>
            </div>

            {/* Bottom info */}
            <div className="reel-info">
                <div className="reel-user" onClick={() => navigate(`/profile/${postUser?.username}`)}>
                    <img className="avatar avatar-sm" src={postUser?.avatar} alt="" />
                    <span className="reel-username">{postUser?.username}</span>
                    <button className="reel-follow-btn">Follow</button>
                </div>
                <p className="reel-caption">{post.caption}</p>
                <div className="reel-song">
                    <Music size={14} />
                    <span className="reel-song-text">{vibe.song}</span>
                </div>
            </div>
        </div>
    );
}

export default function Reels() {
    const allPosts = postsStore.getAll();
    const containerRef = useRef(null);

    return (
        <div className="reels-page" ref={containerRef}>
            <div className="reels-container">
                {allPosts.map((post, i) => (
                    <ReelCard
                        key={post.id}
                        post={post}
                        vibe={REEL_VIBES[i % REEL_VIBES.length]}
                        index={i}
                    />
                ))}
                {allPosts.length === 0 && (
                    <div className="reels-empty">
                        <Play size={48} />
                        <h2>No Reels Yet</h2>
                        <p>Create your first reel!</p>
                    </div>
                )}
            </div>
        </div>
    );
}
