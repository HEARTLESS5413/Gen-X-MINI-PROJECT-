import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Search, PlusSquare, Heart, User, MessageCircle, Compass, Film, Gamepad2, Bookmark, Settings, Sun, Moon, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { messages as msgStore } from '../lib/store';

export default function MobileNav({ onCreateClick, onSearchClick }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();
    const { themeMode, toggleTheme } = useTheme();
    const path = location.pathname;
    const [unreadMsgs, setUnreadMsgs] = useState(0);
    const [showMore, setShowMore] = useState(false);

    useEffect(() => {
        if (!user) return;
        msgStore.getUnreadCount(user.id).then(count => setUnreadMsgs(count));
        const interval = setInterval(() => {
            msgStore.getUnreadCount(user.id).then(count => setUnreadMsgs(count));
        }, 30000);
        return () => clearInterval(interval);
    }, [user, path]);

    const handleMoreNav = (action) => {
        action();
        setShowMore(false);
    };

    const items = [
        { icon: Home, path: '/', onClick: () => navigate('/') },
        { icon: Search, onClick: onSearchClick },
        { icon: PlusSquare, onClick: onCreateClick },
        { icon: MessageCircle, path: '/messages', onClick: () => navigate('/messages'), badge: unreadMsgs },
        { icon: User, path: `/profile/${user?.username}`, onClick: () => navigate(`/profile/${user?.username}`) },
        { icon: Menu, label: 'More', onClick: () => setShowMore(!showMore) },
    ];

    const moreItems = [
        { icon: Compass, label: 'Explore', onClick: () => handleMoreNav(() => navigate('/explore')) },
        { icon: Film, label: 'Reels', onClick: () => handleMoreNav(() => navigate('/reels')) },
        { icon: Gamepad2, label: 'Games', onClick: () => handleMoreNav(() => navigate('/games')) },
        { icon: Heart, label: 'Activity', onClick: () => handleMoreNav(() => navigate('/notifications')) },
        { icon: Bookmark, label: 'Saved', onClick: () => handleMoreNav(() => navigate('/saved')) },
        { icon: Settings, label: 'Settings', onClick: () => handleMoreNav(() => navigate('/settings')) },
        { icon: themeMode === 'dark' ? Sun : Moon, label: 'Switch Theme', onClick: () => handleMoreNav(toggleTheme) },
        { icon: LogOut, label: 'Log out', onClick: () => handleMoreNav(() => { logout(); navigate('/login'); }), danger: true },
    ];

    return (
        <>
            <nav className="mobile-nav">
                <div className="mobile-nav-inner">
                    {items.map((item, i) => (
                        <button
                            key={i}
                            className={`mobile-nav-item ${item.path && path === item.path ? 'active' : ''} ${item.label === 'More' && showMore ? 'active' : ''}`}
                            onClick={item.onClick}
                        >
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

            {/* More Menu Overlay */}
            {showMore && (
                <>
                    <div className="mobile-more-overlay" onClick={() => setShowMore(false)} />
                    <div className="mobile-more-menu">
                        <div className="mobile-more-header">
                            <span>More</span>
                            <button className="btn-ghost" onClick={() => setShowMore(false)}><X size={20} /></button>
                        </div>
                        <div className="mobile-more-items">
                            {moreItems.map((item, i) => (
                                <button
                                    key={i}
                                    className={`mobile-more-item ${item.danger ? 'danger' : ''}`}
                                    onClick={item.onClick}
                                >
                                    <item.icon size={20} />
                                    <span>{item.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
