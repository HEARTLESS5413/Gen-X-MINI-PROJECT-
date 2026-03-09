import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Grid3X3, Bookmark, Film, Settings, MessageCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { users as usersStore, posts as postsStore, follows as followsStore, saved as savedStore } from '../lib/store';

export default function Profile() {
    const { username } = useParams();
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();

    const profileUser = usersStore.getByUsername(username);
    const isOwnProfile = currentUser?.id === profileUser?.id;
    const [isFollowing, setIsFollowing] = useState(
        currentUser && profileUser ? followsStore.isFollowing(currentUser.id, profileUser.id) : false
    );
    const [activeTab, setActiveTab] = useState('posts');

    if (!profileUser) {
        return (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-tertiary)' }}>
                <h2>User not found</h2>
            </div>
        );
    }

    const userPosts = postsStore.getByUser(profileUser.id);
    const followers = followsStore.getFollowers(profileUser.id);
    const following = followsStore.getFollowing(profileUser.id);
    const savedPosts = isOwnProfile ? savedStore.getByUser(currentUser.id) : [];

    const handleFollow = () => {
        if (currentUser) {
            followsStore.toggle(currentUser.id, profileUser.id);
            setIsFollowing(!isFollowing);
        }
    };

    const canViewPosts = profileUser.isPublic || isOwnProfile || isFollowing;

    const displayPosts = activeTab === 'posts' ? userPosts : activeTab === 'saved' ? savedPosts : userPosts;

    return (
        <div className="profile-page">
            {/* Header */}
            <div className="profile-header">
                <div className="profile-avatar-section">
                    <div className="story-ring" style={{ width: '156px', height: '156px' }}>
                        <img className="avatar avatar-xxl" src={profileUser.avatar} alt={profileUser.username} />
                    </div>
                </div>
                <div className="profile-info">
                    <div className="profile-username">
                        <span>{profileUser.username}</span>
                        {isOwnProfile ? (
                            <>
                                <button className="btn btn-secondary" onClick={() => navigate('/edit-profile')}>Edit profile</button>
                                <button className="btn-ghost" onClick={() => navigate('/settings')}><Settings size={20} /></button>
                            </>
                        ) : (
                            <>
                                <button className={isFollowing ? 'btn btn-secondary' : 'btn btn-primary'} onClick={handleFollow}>
                                    {isFollowing ? 'Following' : 'Follow'}
                                </button>
                                <button className="btn btn-secondary" onClick={() => navigate('/messages')}>
                                    <MessageCircle size={16} /> Message
                                </button>
                            </>
                        )}
                    </div>

                    <div className="profile-stats">
                        <span><strong>{userPosts.length}</strong> posts</span>
                        <span><strong>{followers.length}</strong> followers</span>
                        <span><strong>{following.length}</strong> following</span>
                    </div>

                    <div className="profile-bio">
                        <span className="name">{profileUser.name}</span>
                        {profileUser.bio && profileUser.bio.split('\n').map((line, i) => <span key={i}>{line}<br /></span>)}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="profile-tabs">
                <button className={`profile-tab ${activeTab === 'posts' ? 'active' : ''}`} onClick={() => setActiveTab('posts')}>
                    <Grid3X3 size={14} /> Posts
                </button>
                {isOwnProfile && (
                    <button className={`profile-tab ${activeTab === 'saved' ? 'active' : ''}`} onClick={() => setActiveTab('saved')}>
                        <Bookmark size={14} /> Saved
                    </button>
                )}
                <button className={`profile-tab ${activeTab === 'reels' ? 'active' : ''}`} onClick={() => setActiveTab('reels')}>
                    <Film size={14} /> Reels
                </button>
            </div>

            {/* Posts Grid */}
            {canViewPosts ? (
                <div className="profile-grid">
                    {displayPosts.map(post => (
                        <div key={post.id} className="profile-grid-item">
                            <img src={post.image} alt="" loading="lazy" />
                        </div>
                    ))}
                    {displayPosts.length === 0 && (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 20px', color: 'var(--text-tertiary)' }}>
                            <h3 style={{ fontWeight: '300' }}>No {activeTab} yet</h3>
                        </div>
                    )}
                </div>
            ) : (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-tertiary)' }}>
                    <h3>This Account is Private</h3>
                    <p style={{ fontSize: '0.9rem', marginTop: '8px' }}>Follow this account to see their posts.</p>
                </div>
            )}
        </div>
    );
}
