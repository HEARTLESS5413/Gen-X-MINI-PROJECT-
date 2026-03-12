import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Search, PlusSquare, Heart, User, MessageCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { messages as msgStore } from '../lib/store';

export default function MobileNav({ onCreateClick, onSearchClick }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const path = location.pathname;
    const [unreadMsgs, setUnreadMsgs] = useState(0);

    useEffect(() => {
        if (!user) return;
        msgStore.getUnreadCount(user.id).then(count => setUnreadMsgs(count));
        const interval = setInterval(() => {
            msgStore.getUnreadCount(user.id).then(count => setUnreadMsgs(count));
        }, 30000);
        return () => clearInterval(interval);
    }, [user, path]);

    const items = [
        { icon: Home, path: '/', onClick: () => navigate('/') },
        { icon: Search, onClick: onSearchClick },
        { icon: PlusSquare, onClick: onCreateClick },
        { icon: MessageCircle, path: '/messages', onClick: () => navigate('/messages'), badge: unreadMsgs },
        { icon: User, path: `/profile/${user?.username}`, onClick: () => navigate(`/profile/${user?.username}`) },
    ];

    return (
        <nav className="mobile-nav">
            <div className="mobile-nav-inner">
                {items.map((item, i) => (
                    <button key={i} className={`mobile-nav-item ${item.path && path === item.path ? 'active' : ''}`} onClick={item.onClick}>
                        <item.icon size={24} />
                        {item.badge > 0 && (
                            <span style={{
                                position: 'absolute', top: 0, right: 6,
                                width: 8, height: 8, borderRadius: '50%',
                                background: 'var(--accent)', border: '2px solid var(--bg-primary)'
                            }} />
                        )}
                    </button>
                ))}
            </div>
        </nav>
    );
}
