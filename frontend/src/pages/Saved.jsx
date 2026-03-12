import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { saved as savedStore } from '../lib/store';
import { Heart } from 'lucide-react';

export default function Saved() {
    const { user } = useAuth();
    const [savedPosts, setSavedPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        savedStore.getByUser(user.id).then(posts => { setSavedPosts(posts); setLoading(false); });
    }, [user]);

    if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>Loading...</div>;

    return (
        <div style={{ maxWidth: '960px', margin: '0 auto', padding: '24px 16px' }}>
            <h2 style={{ fontWeight: '700', marginBottom: '24px' }}>Saved</h2>
            {savedPosts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-tertiary)' }}>
                    <h3 style={{ fontWeight: '300' }}>No saved posts yet</h3>
                    <p style={{ fontSize: '0.9rem', marginTop: '8px' }}>Save posts by tapping the bookmark icon</p>
                </div>
            ) : (
                <div className="explore-grid">
                    {savedPosts.map(post => (
                        <div key={post.id} className="explore-item">
                            <img src={post.image} alt="" />
                            <div className="overlay">
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Heart size={18} fill="white" /> {post.likes_count || post.likes}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
