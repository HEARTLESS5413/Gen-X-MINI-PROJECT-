import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { users as usersStore, likes as likesStore, saved as savedStore, comments as commentsStore } from '../lib/store';
import sounds from '../lib/sounds';

export default function PostCard({ post, onCommentClick }) {
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();
    const [postUser, setPostUser] = useState(null);
    const [isLiked, setIsLiked] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [likeCount, setLikeCount] = useState(post.likes_count || post.likes || 0);
    const [comment, setComment] = useState('');
    const [commentCount, setCommentCount] = useState(0);
    const [showHeart, setShowHeart] = useState(false);

    useEffect(() => {
        async function loadData() {
            const u = await usersStore.getById(post.user_id || post.userId);
            setPostUser(u);
            if (currentUser) {
                const [liked, saved, cmts] = await Promise.all([
                    likesStore.isLiked(currentUser.id, post.id),
                    savedStore.isSaved(currentUser.id, post.id),
                    commentsStore.getByPost(post.id),
                ]);
                setIsLiked(liked);
                setIsSaved(saved);
                setCommentCount(cmts.length);
            }
        }
        loadData();
    }, [post.id, currentUser]);

    const handleLike = async () => {
        if (!currentUser) return;
        const liked = await likesStore.toggle(currentUser.id, post.id);
        setIsLiked(liked);
        setLikeCount(prev => liked ? prev + 1 : prev - 1);
        if (liked) sounds.like();
    };

    const handleSave = async () => {
        if (!currentUser) return;
        const saved = await savedStore.toggle(currentUser.id, post.id);
        setIsSaved(saved);
    };

    const handleDoubleClick = () => {
        if (!isLiked) handleLike();
        setShowHeart(true);
        setTimeout(() => setShowHeart(false), 800);
    };

    const handleComment = async (e) => {
        e.preventDefault();
        if (!comment.trim() || !currentUser) return;
        await commentsStore.add(currentUser.id, post.id, comment);
        setComment('');
        setCommentCount(prev => prev + 1);
        sounds.notification();
    };

    const formatTime = (time) => {
        if (!time) return '';
        if (typeof time === 'string' && !time.includes('T')) return time;
        const date = new Date(time);
        const diff = Date.now() - date.getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}m`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h`;
        return `${Math.floor(hrs / 24)}d`;
    };

    if (!postUser) return null;

    return (
        <article className="post-card">
            <div className="post-header">
                <div className="post-user" style={{ cursor: 'pointer' }} onClick={() => navigate(`/profile/${postUser.username}`)}>
                    <div className="story-ring" style={{ width: '36px', height: '36px' }}>
                        <img className="avatar" style={{ width: '30px', height: '30px' }} src={postUser.avatar} alt={postUser.username} />
                    </div>
                    <span className="post-username">{postUser.username}</span>
                    <span className="post-time">• {formatTime(post.created_at || post.createdAt)}</span>
                </div>
                <button className="btn-ghost"><MoreHorizontal size={20} /></button>
            </div>

            <div style={{ position: 'relative', overflow: 'hidden' }} onDoubleClick={handleDoubleClick}>
                <img className="post-image" src={post.image} alt="post" loading="lazy" />
                {showHeart && (
                    <div style={{
                        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        pointerEvents: 'none', animation: 'heartPop 0.8s ease-in-out'
                    }}>
                        <Heart size={80} fill="white" color="white" style={{ filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.5))' }} />
                    </div>
                )}
            </div>

            <div className="post-actions">
                <div className="post-actions-left">
                    <button className={`action-btn ${isLiked ? 'liked' : ''}`} onClick={handleLike}>
                        <Heart size={24} fill={isLiked ? 'currentColor' : 'none'} />
                    </button>
                    <button className="action-btn" onClick={() => onCommentClick && onCommentClick(post)}>
                        <MessageCircle size={24} />
                    </button>
                    <button className="action-btn"><Send size={24} /></button>
                </div>
                <button className={`action-btn ${isSaved ? 'saved' : ''}`} onClick={handleSave}>
                    <Bookmark size={24} fill={isSaved ? 'currentColor' : 'none'} />
                </button>
            </div>

            <div className="post-likes">{likeCount.toLocaleString()} likes</div>
            <div className="post-caption">
                <strong onClick={() => navigate(`/profile/${postUser.username}`)} style={{ cursor: 'pointer' }}>{postUser.username}</strong>
                {post.caption}
            </div>
            {commentCount > 0 && (
                <div className="post-comments-link" onClick={() => onCommentClick && onCommentClick(post)}>
                    View all {commentCount} comments
                </div>
            )}
            <form className="post-add-comment" onSubmit={handleComment}>
                <input placeholder="Add a comment..." value={comment} onChange={(e) => setComment(e.target.value)} />
                {comment && <button type="submit">Post</button>}
            </form>
        </article>
    );
}
