import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, MapPin, UserPlus, Users, Sparkles, Search as SearchIcon, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { users as usersStore, posts as postsStore, follows as followsStore } from '../lib/store';
import { useAuth } from '../context/AuthContext';

const EXPLORE_INTENTS = [
    { id: 'friends', emoji: '👫', label: 'Looking for Friends', color: '#4dabf7', description: 'Meet cool people nearby' },
    { id: 'relationship', emoji: '💕', label: 'Open to Relationship', color: '#ff6b6b', description: 'Find your special someone' },
    { id: 'undecided', emoji: '🤷', label: 'Not Decided', color: '#a29bfe', description: 'Just exploring possibilities' },
];

const INTERESTS_LIST = ['Music', 'Gaming', 'Travel', 'Food', 'Fitness', 'Art', 'Tech', 'Movies', 'Books', 'Dance', 'Photography', 'Sports'];

function IntentSelection({ onSelect }) {
    return (
        <div className="explore-intent-page">
            <div className="explore-intent-header">
                <Sparkles size={28} className="explore-sparkle" />
                <h2>What are you looking for?</h2>
                <p>We'll show you the right people</p>
            </div>
            <div className="explore-intent-cards">
                {EXPLORE_INTENTS.map((intent, i) => (
                    <button key={intent.id} className="explore-intent-card"
                        style={{ '--intent-color': intent.color, animationDelay: `${i * 0.1}s` }}
                        onClick={() => onSelect(intent.id)}>
                        <span className="explore-intent-emoji">{intent.emoji}</span>
                        <h3>{intent.label}</h3>
                        <p>{intent.description}</p>
                    </button>
                ))}
            </div>
        </div>
    );
}

function ProfileCard({ profile, currentUser, onAdd, onSkip, onMessage }) {
    const navigate = useNavigate();
    const [imgIndex, setImgIndex] = useState(0);
    const [profilePosts, setProfilePosts] = useState([]);
    const [followerCount, setFollowerCount] = useState(0);

    useEffect(() => {
        async function load() {
            const [posts, followers] = await Promise.all([
                postsStore.getByUser(profile.id),
                followsStore.getFollowers(profile.id),
            ]);
            setProfilePosts(posts);
            setFollowerCount(followers.length);
        }
        load();
    }, [profile.id]);

    const images = [profile.avatar, ...profilePosts.slice(0, 3).map(p => p.image)];

    return (
        <div className="explore-profile-card">
            <div className="explore-card-images">
                <img src={images[imgIndex]} alt="" className="explore-card-img" />
                <div className="explore-card-img-dots">
                    {images.map((_, i) => (
                        <div key={i} className={`explore-card-dot ${i === imgIndex ? 'active' : ''}`} />
                    ))}
                </div>
                {imgIndex > 0 && (
                    <button className="explore-card-nav left" onClick={() => setImgIndex(i => i - 1)}><ChevronLeft size={20} /></button>
                )}
                {imgIndex < images.length - 1 && (
                    <button className="explore-card-nav right" onClick={() => setImgIndex(i => i + 1)}><ChevronRight size={20} /></button>
                )}
            </div>
            <div className="explore-card-info">
                <div className="explore-card-name-row">
                    <h3 onClick={() => navigate(`/profile/${profile.username}`)}>{profile.name}</h3>
                    <span className="explore-card-username">@{profile.username}</span>
                </div>
                {profile.bio && <p className="explore-card-bio">{profile.bio}</p>}
                <div className="explore-card-meta">
                    <span><MapPin size={14} /> {Math.floor(Math.random() * 20 + 1)}km away</span>
                    <span><Users size={14} /> {followerCount} followers</span>
                </div>
                <div className="explore-card-interests">
                    {INTERESTS_LIST.slice(Math.floor(Math.random() * 4), Math.floor(Math.random() * 4) + 3).map(tag => (
                        <span key={tag} className="explore-interest-tag">{tag}</span>
                    ))}
                </div>
            </div>
            <div className="explore-card-actions">
                <button className="explore-card-btn skip" onClick={onSkip}><X size={24} /></button>
                <button className="explore-card-btn message" onClick={onMessage}><MessageCircle size={24} /></button>
                <button className="explore-card-btn add" onClick={onAdd}><UserPlus size={24} /></button>
            </div>
        </div>
    );
}

export default function Explore() {
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();
    const [intent, setIntent] = useState(null);
    const [availableUsers, setAvailableUsers] = useState([]);
    const [addedUsers, setAddedUsers] = useState(new Set());
    const [skippedUsers, setSkippedUsers] = useState(new Set());
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!intent || !currentUser) return;
        async function loadUsers() {
            setLoading(true);
            const allUsers = await usersStore.getAll();
            const filtered = [];
            for (const u of allUsers) {
                if (u.id === currentUser.id) continue;
                const isFollowing = await followsStore.isFollowing(currentUser.id, u.id);
                if (!isFollowing) filtered.push(u);
            }
            setAvailableUsers(filtered);
            setLoading(false);
        }
        loadUsers();
    }, [intent, currentUser]);

    const handleAdd = async (userId) => {
        if (currentUser) await followsStore.toggle(currentUser.id, userId);
        setAddedUsers(prev => new Set([...prev, userId]));
    };

    const handleSkip = (userId) => {
        setSkippedUsers(prev => new Set([...prev, userId]));
    };

    if (!intent) return <IntentSelection onSelect={setIntent} />;

    const visibleUsers = availableUsers.filter(u => !addedUsers.has(u.id) && !skippedUsers.has(u.id));
    const currentProfile = visibleUsers[0];

    if (loading) return <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-tertiary)' }}>Finding people...</div>;

    return (
        <div className="explore-discover-page">
            <div className="explore-discover-header">
                <button className="btn-ghost" onClick={() => setIntent(null)}><ChevronLeft size={22} /></button>
                <h2>{EXPLORE_INTENTS.find(i => i.id === intent)?.emoji}{' '}{EXPLORE_INTENTS.find(i => i.id === intent)?.label}</h2>
            </div>
            <div className="explore-card-stack">
                {currentProfile ? (
                    <ProfileCard key={currentProfile.id} profile={currentProfile} currentUser={currentUser}
                        onAdd={() => handleAdd(currentProfile.id)} onSkip={() => handleSkip(currentProfile.id)}
                        onMessage={() => navigate('/messages')} />
                ) : (
                    <div className="explore-empty">
                        <Sparkles size={48} />
                        <h3>You've seen everyone!</h3>
                        <p>Check back later for new people</p>
                        <button className="btn btn-primary" onClick={() => { setSkippedUsers(new Set()); }}>Start Over</button>
                    </div>
                )}
            </div>
        </div>
    );
}
