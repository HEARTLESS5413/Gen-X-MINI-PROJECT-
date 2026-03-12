import React, { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle, Send, Bookmark, Music, MoreHorizontal, Play } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { posts as postsStore, users as usersStore, likes as likesStore } from '../lib/store';
import { useNavigate } from 'react-router-dom';

const REEL_VIBES = [
    { gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', song: 'Trending Sound • 2.3M' },
    { gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', song: 'Viral Beat • 5.1M' },
    { gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', song: 'Chill Vibes • 890K' },
    { gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', song: 'Party Mix • 3.7M' },
    { gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', song: 'Lo-fi Dreams • 1.2M' },
    { gradient: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)', song: 'Bass Drop • 4.5M' },
    { gradient: 'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)', song: 'Rock On • 780K' },
    { gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)', song: 'Dance Floor • 6.2M' },
];

function ReelCard({ post, vibe }) {
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();
    const [postUser, setPostUser] = useState(null);
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(post.likes_count || post.likes || 0);
    const [showHeart, setShowHeart] = useState(false);

    useEffect(() => {
        async function load() {
            const u = await usersStore.getById(post.user_id || post.userId);
            setPostUser(u);
            if (currentUser) {
                const isLiked = await likesStore.isLiked(currentUser.id, post.id);
                setLiked(isLiked);
            }
        }
        load();
    }, [post.id, currentUser]);

    const handleLike = async () => {
        if (!currentUser) return;
        const isNowLiked = await likesStore.toggle(currentUser.id, post.id);
        setLiked(isNowLiked);
        setLikeCount(prev => isNowLiked ? prev + 1 : prev - 1);
    };

    const handleDoubleTap = () => {
        if (!liked) handleLike();
        setShowHeart(true);
        setTimeout(() => setShowHeart(false), 1000);
    };

    return (
        <div className="reel-card" onDoubleClick={handleDoubleTap}>
            <div className="reel-background" style={{ background: vibe.gradient }}>
                <img src={post.image} alt="" className="reel-image" />
                {showHeart && <div className="reel-heart-animation"><Heart size={80} fill="white" color="white" /></div>}
            </div>
            <div className="reel-actions">
                <button className={`reel-action-btn ${liked ? 'liked' : ''}`} onClick={handleLike}>
                    <Heart size={28} fill={liked ? '#ff3040' : 'none'} color={liked ? '#ff3040' : 'white'} /><span>{likeCount}</span>
                </button>
                <button className="reel-action-btn"><MessageCircle size={28} /><span>{Math.floor(Math.random() * 200)}</span></button>
                <button className="reel-action-btn"><Send size={28} /></button>
                <button className="reel-action-btn"><Bookmark size={28} /></button>
                <button className="reel-action-btn"><MoreHorizontal size={28} /></button>
                <div className="reel-music-disc"><img src={postUser?.avatar} alt="" /></div>
            </div>
            <div className="reel-info">
                <div className="reel-user" onClick={() => navigate(`/profile/${postUser?.username}`)}>
                    <img className="avatar avatar-sm" src={postUser?.avatar} alt="" />
                    <span className="reel-username">{postUser?.username}</span>
                    <button className="reel-follow-btn">Follow</button>
                </div>
                <p className="reel-caption">{post.caption}</p>
                <div className="reel-song"><Music size={14} /><span className="reel-song-text">{vibe.song}</span></div>
            </div>
        </div>
    );
}

export default function Reels() {
    const [allPosts, setAllPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        postsStore.getAll().then(posts => { setAllPosts(posts); setLoading(false); });
    }, []);

    if (loading) return <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-tertiary)' }}>Loading reels...</div>;

    return (
        <div className="reels-page">
            <div className="reels-container">
                {allPosts.map((post, i) => (
                    <ReelCard key={post.id} post={post} vibe={REEL_VIBES[i % REEL_VIBES.length]} />
                ))}
                {allPosts.length === 0 && (
                    <div className="reels-empty"><Play size={48} /><h2>No Reels Yet</h2><p>Create your first reel!</p></div>
                )}
            </div>
        </div>
    );
}
