import React, { useEffect, useState } from 'react';
import { Heart, UserPlus, MessageSquare, Image } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { notifications as notifStore, users as usersStore, follows as followsStore } from '../lib/store';

export default function Notifications() {
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();
    const [notifs, setNotifs] = useState([]);
    const [notifUsers, setNotifUsers] = useState({});
    const [suggestedUsers, setSuggestedUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser) return;
        async function load() {
            const notifsData = await notifStore.getForUser(currentUser.id);
            setNotifs(notifsData);
            await notifStore.markAllRead(currentUser.id);

            // Load all unique users referenced in notifications
            const userIds = [...new Set(notifsData.map(n => n.from_user_id || n.fromUserId).filter(Boolean))];
            const usersData = await Promise.all(userIds.map(id => usersStore.getById(id)));
            const userMap = {};
            usersData.filter(Boolean).forEach(u => userMap[u.id] = u);
            setNotifUsers(userMap);

            // Load suggested users
            const allUsers = await usersStore.getAll();
            const suggested = [];
            for (const u of allUsers) {
                if (u.id === currentUser.id) continue;
                const isFollowing = await followsStore.isFollowing(currentUser.id, u.id);
                if (!isFollowing) suggested.push(u);
                if (suggested.length >= 5) break;
            }
            setSuggestedUsers(suggested);
            setLoading(false);
        }
        load();
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

    const getMessage = (notif, fromUser) => {
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
        if (!ts) return '';
        const date = new Date(ts);
        const diff = Date.now() - date.getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'now';
        if (mins < 60) return `${mins}m`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h`;
        return `${Math.floor(hrs / 24)}d`;
    };

    if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>Loading...</div>;

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
                const fromUser = notifUsers[notif.from_user_id || notif.fromUserId];
                if (!fromUser) return null;
                return (
                    <div key={notif.id} className={`notif-item ${!notif.read ? 'unread' : ''}`}>
                        <img className="avatar avatar-md" src={fromUser.avatar} alt="" style={{ cursor: 'pointer' }}
                            onClick={() => navigate(`/profile/${fromUser.username}`)} />
                        <div className="notif-text">
                            {getMessage(notif, fromUser)}
                            <span className="notif-time" style={{ marginLeft: '8px' }}>{formatTime(notif.created_at || notif.createdAt)}</span>
                        </div>
                        {notif.type === 'follow' && (
                            <FollowBtn userId={currentUser?.id} targetId={notif.from_user_id || notif.fromUserId} />
                        )}
                    </div>
                );
            })}

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
    const [following, setFollowing] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (userId) {
            followsStore.isFollowing(userId, targetId).then(result => {
                setFollowing(result);
                setLoading(false);
            });
        } else {
            setLoading(false);
        }
    }, [userId, targetId]);

    const handleToggle = async () => {
        if (!userId) return;
        const result = await followsStore.toggle(userId, targetId);
        setFollowing(result);
    };

    if (loading) return null;

    return (
        <button className={following ? 'btn-following' : 'btn-follow'} onClick={handleToggle}>
            {following ? 'Following' : 'Follow'}
        </button>
    );
}
