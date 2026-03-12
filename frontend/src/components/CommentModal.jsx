import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { comments as commentsStore, users as usersStore } from '../lib/store';

export default function CommentModal({ post, onClose }) {
    const { user: currentUser } = useAuth();
    const [comment, setComment] = useState('');
    const [commentList, setCommentList] = useState([]);
    const [commentUsers, setCommentUsers] = useState({});
    const [postUser, setPostUser] = useState(null);

    useEffect(() => {
        async function load() {
            const [cmts, pUser] = await Promise.all([
                commentsStore.getByPost(post.id),
                usersStore.getById(post.user_id || post.userId),
            ]);
            setCommentList(cmts);
            setPostUser(pUser);

            // Load all comment authors
            const userIds = [...new Set(cmts.map(c => c.user_id || c.userId))];
            const usersData = await Promise.all(userIds.map(id => usersStore.getById(id)));
            const map = {};
            usersData.filter(Boolean).forEach(u => map[u.id] = u);
            setCommentUsers(map);
        }
        load();
    }, [post.id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!comment.trim() || !currentUser) return;
        const newComment = await commentsStore.add(currentUser.id, post.id, comment);
        if (newComment) {
            setCommentList(prev => [...prev, newComment]);
            setCommentUsers(prev => ({ ...prev, [currentUser.id]: currentUser }));
        }
        setComment('');
    };

    const formatTime = (time) => {
        if (!time) return 'now';
        const date = new Date(time);
        const diff = Date.now() - date.getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}m`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h`;
        return `${Math.floor(hrs / 24)}d`;
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="comment-modal" onClick={(e) => e.stopPropagation()}>
                <div className="comment-modal-header">
                    <span>Comments</span>
                    <button className="btn-ghost" onClick={onClose} style={{ position: 'absolute', right: '12px', top: '12px' }}>
                        <X size={20} />
                    </button>
                </div>
                <div className="comment-list">
                    {postUser && (
                        <div className="comment-item">
                            <img className="avatar avatar-sm" src={postUser.avatar} alt="" />
                            <div className="comment-content">
                                <span className="comment-user">{postUser.username}</span>
                                <div className="comment-text">{post.caption}</div>
                            </div>
                        </div>
                    )}
                    {commentList.map(c => {
                        const cUser = commentUsers[c.user_id || c.userId];
                        if (!cUser) return null;
                        return (
                            <div key={c.id} className="comment-item">
                                <img className="avatar avatar-sm" src={cUser.avatar} alt="" />
                                <div className="comment-content">
                                    <span className="comment-user">{cUser.username}</span>
                                    <div className="comment-text">{c.text}</div>
                                    <div className="comment-meta">
                                        <span>{formatTime(c.created_at || c.createdAt)}</span>
                                        <span style={{ cursor: 'pointer' }}>{c.likes || 0} likes</span>
                                        <span style={{ cursor: 'pointer' }}>Reply</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {commentList.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                            <h3 style={{ fontWeight: '700', marginBottom: '8px' }}>No comments yet.</h3>
                            <p style={{ fontSize: '0.9rem' }}>Start the conversation.</p>
                        </div>
                    )}
                </div>
                <form className="comment-input-bar" onSubmit={handleSubmit}>
                    <input placeholder="Add a comment..." value={comment} onChange={(e) => setComment(e.target.value)} className="input-field" style={{ border: 'none', padding: '8px 0' }} />
                    {comment && <button type="submit">Post</button>}
                </form>
            </div>
        </div>
    );
}
