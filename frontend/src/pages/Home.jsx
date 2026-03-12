import React, { useState } from 'react';
import PostCard from '../components/PostCard';
import CommentModal from '../components/CommentModal';
import StoryViewer from '../components/StoryViewer';
import { posts as postsStore, stories as storiesStore, users as usersStore } from '../lib/store';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Home() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const allPosts = postsStore.getAll();
    const allStories = storiesStore.getAll();
    const [commentPost, setCommentPost] = useState(null);
    const [viewingStory, setViewingStory] = useState(null);

    const storyUsers = [...new Set(allStories.map(s => s.userId))].map(id => usersStore.getById(id)).filter(Boolean);

    const handleStoryClick = (userId) => {
        const storyIndex = storyUsers.findIndex(u => u.id === userId);
        if (storyIndex >= 0) {
            setViewingStory(storyIndex);
        }
    };

    return (
        <div className="feed-container">
            {/* Stories */}
            <div className="stories-bar">
                {/* Your story */}
                {user && (
                    <div className="story-item" onClick={() => { }}>
                        <div style={{ position: 'relative' }}>
                            <img className="avatar avatar-lg" src={user.avatar} alt={user.username} />
                            <div style={{
                                position: 'absolute', bottom: '-2px', right: '-2px',
                                width: '22px', height: '22px', borderRadius: '50%',
                                background: 'var(--accent)', color: '#fff', display: 'flex',
                                alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '700',
                                border: '2px solid var(--bg-primary)'
                            }}>+</div>
                        </div>
                        <span>Your story</span>
                    </div>
                )}
                {storyUsers.map(u => (
                    <div key={u.id} className="story-item" onClick={() => handleStoryClick(u.id)} style={{ cursor: 'pointer' }}>
                        <div className="story-ring" style={{ width: '70px', height: '70px' }}>
                            <img className="avatar avatar-lg" src={u.avatar} alt={u.username} />
                        </div>
                        <span>{u.username}</span>
                    </div>
                ))}
            </div>

            {/* Feed */}
            {allPosts.map(post => (
                <PostCard key={post.id} post={post} onCommentClick={setCommentPost} />
            ))}

            {allPosts.length === 0 && (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-tertiary)' }}>
                    <h2 style={{ fontWeight: '300', marginBottom: '12px' }}>Welcome to Gen-X</h2>
                    <p>Follow people to see their posts here.</p>
                </div>
            )}

            {/* Comment Modal */}
            {commentPost && <CommentModal post={commentPost} onClose={() => setCommentPost(null)} />}

            {/* Story Viewer */}
            {viewingStory !== null && (
                <StoryViewer
                    stories={allStories}
                    startIndex={viewingStory}
                    onClose={() => setViewingStory(null)}
                />
            )}
        </div>
    );
}
