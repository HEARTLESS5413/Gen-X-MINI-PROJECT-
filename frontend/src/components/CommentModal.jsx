import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { comments as commentsStore, users as usersStore } from '../lib/store';

export default function CommentModal({ post, onClose }) {
    const { user: currentUser } = useAuth();
    const [comment, setComment] = useState('');
    const [commentList, setCommentList] = useState(commentsStore.getByPost(post.id));
    const postUser = usersStore.getById(post.userId);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!comment.trim() || !currentUser) return;
        commentsStore.add(currentUser.id, post.id, comment);
        setCommentList(commentsStore.getByPost(post.id));
        setComment('');
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
                    {/* Post caption as first comment */}
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
                        const cUser = usersStore.getById(c.userId);
                        if (!cUser) return null;
                        return (
                            <div key={c.id} className="comment-item">
                                <img className="avatar avatar-sm" src={cUser.avatar} alt="" />
                                <div className="comment-content">
                                    <span className="comment-user">{cUser.username}</span>
                                    <div className="comment-text">{c.text}</div>
                                    <div className="comment-meta">
                                        <span>{c.time || 'now'}</span>
                                        <span style={{ cursor: 'pointer' }}>{c.likes} likes</span>
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
