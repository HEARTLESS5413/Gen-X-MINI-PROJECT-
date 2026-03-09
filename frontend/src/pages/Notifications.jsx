import React, { useEffect, useState } from 'react';
import { Heart, UserPlus, MessageSquare, Image } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { notifications as notifStore, users as usersStore, follows as followsStore } from '../lib/store';

export default function Notifications() {
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();
    const [notifs, setNotifs] = useState([]);

    useEffect(() => {
        if (currentUser) {
            setNotifs(notifStore.getForUser(currentUser.id));
            notifStore.markAllRead(currentUser.id);
        }
    }, [currentUser]);

    const getIcon = (type) => {
        switch (type) {
            case 'like': return <Heart size={16} fill="var(--danger)" color="var(--danger)" />;
            case 'comment': return <MessageSquare size={16} color="var(--accent)" />;
            case 'follow': return <UserPlus size={16} color="var(--success)" />;
            case 'new_post': return <Image size={16} color="var(--warning)" />;
            default: return <Heart size={16} />;
        }
    };

    const getMessage = (notif) => {
        const fromUser = usersStore.getById(notif.fromUserId);
        if (!fromUser) return '';
        switch (notif.type) {
            case 'like': return <><strong>{fromUser.username}</strong> liked your post</>;
            case 'comment': return <><strong>{fromUser.username}</strong> commented: {notif.text}</>;
            case 'follow': return <><strong>{fromUser.username}</strong> started following you</>;
            case 'new_post': return <><strong>{fromUser.username}</strong> shared a new post</>;
            default: return '';
        }
    };

    const formatTime = (ts) => {
        const diff = Date.now() - ts;
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'now';
        if (mins < 60) return `${mins}m`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h`;
        return `${Math.floor(hrs / 24)}d`;
    };

    // Suggested users for "Suggested for you"
    const suggestedUsers = usersStore.getAll()
        .filter(u => u.id !== currentUser?.id && currentUser && !followsStore.isFollowing(currentUser.id, u.id))
        .slice(0, 5);

    return (
        <div className="notif-page">
            <h2>Notifications</h2>

            {notifs.length === 0 && (
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <Heart size={48} strokeWidth={1} color="var(--text-tertiary)" />
                    <h3 style={{ fontWeight: '300', margin: '16px 0 8px', color: 'var(--text-secondary)' }}>Activity On Your Posts</h3>
                    <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>When someone likes or comments on one of your posts, you'll see it here.</p>
                </div>
            )}

            {notifs.map(notif => {
                const fromUser = usersStore.getById(notif.fromUserId);
                if (!fromUser) return null;
                return (
                    <div key={notif.id} className={`notif-item ${!notif.read ? 'unread' : ''}`}>
                        <img className="avatar avatar-md" src={fromUser.avatar} alt="" style={{ cursor: 'pointer' }}
                            onClick={() => navigate(`/profile/${fromUser.username}`)} />
                        <div className="notif-text">
                            {getMessage(notif)}
                            <span className="notif-time" style={{ marginLeft: '8px' }}>{formatTime(notif.createdAt)}</span>
                        </div>
                        {notif.type === 'follow' && (
                            <FollowBtn userId={currentUser?.id} targetId={notif.fromUserId} />
                        )}
                    </div>
                );
            })}

            {/* Suggested For You */}
            <div style={{ marginTop: '32px' }}>
                <h3 style={{ fontWeight: '600', marginBottom: '16px' }}>Suggested for you</h3>
                {suggestedUsers.map(u => (
                    <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0' }}>
                        <img className="avatar avatar-md" src={u.avatar} alt="" style={{ cursor: 'pointer' }}
                            onClick={() => navigate(`/profile/${u.username}`)} />
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{u.username}</div>
                            <div style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>Suggested for you</div>
                        </div>
                        <FollowBtn userId={currentUser?.id} targetId={u.id} />
                    </div>
                ))}
            </div>
        </div>
    );
}

function FollowBtn({ userId, targetId }) {
    const [following, setFollowing] = useState(userId ? followsStore.isFollowing(userId, targetId) : false);
    return (
        <button className={following ? 'btn-following' : 'btn-follow'} onClick={() => {
            if (userId) { followsStore.toggle(userId, targetId); setFollowing(!following); }
        }}>
            {following ? 'Following' : 'Follow'}
        </button>
    );
}
