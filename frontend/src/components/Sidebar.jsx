import React, { useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Search, Compass, MessageCircle, Heart, PlusSquare, User, Menu, Settings, Bookmark, Sun, Moon, LogOut, Film, Gamepad2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { notifications as notifStore, messages as msgStore } from '../lib/store';

export default function Sidebar({ onCreateClick, onSearchClick }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();
    const { themeMode, toggleTheme } = useTheme();
    const [showMore, setShowMore] = useState(false);
    const [expanded, setExpanded] = useState(false);

    const unreadNotifs = user ? notifStore.getUnreadCount(user.id) : 0;
    const unreadMsgs = user ? msgStore.getUnreadCount(user.id) : 0;
    const currentPath = location.pathname;

    const handleNav = useCallback((action) => {
        action();
        setExpanded(false);
    }, []);

    const navItems = [
        { icon: Home, label: 'Home', path: '/', onClick: () => handleNav(() => navigate('/')) },
        { icon: Search, label: 'Search', onClick: () => handleNav(onSearchClick) },
        { icon: Compass, label: 'Explore', path: '/explore', onClick: () => handleNav(() => navigate('/explore')) },
        { icon: Film, label: 'Reels', path: '/reels', onClick: () => handleNav(() => navigate('/reels')) },
        { icon: Gamepad2, label: 'Games', path: '/games', onClick: () => handleNav(() => navigate('/games')) },
        { icon: MessageCircle, label: 'Messages', path: '/messages', onClick: () => handleNav(() => navigate('/messages')), badge: unreadMsgs },
        { icon: Heart, label: 'Activity', path: '/notifications', onClick: () => handleNav(() => navigate('/notifications')), badge: unreadNotifs },
        { icon: PlusSquare, label: 'Create', onClick: () => handleNav(onCreateClick) },
        { icon: User, label: 'Profile', path: `/profile/${user?.username}`, onClick: () => handleNav(() => navigate(`/profile/${user?.username}`)) },
    ];

    return (
        <>
            <aside
                className={`sidebar ${expanded ? 'sidebar-expanded' : ''}`}
                onMouseEnter={() => setExpanded(true)}
                onMouseLeave={() => setExpanded(false)}
            >
                <div className="sidebar-logo" onClick={() => handleNav(() => navigate('/'))}>
                    <svg
                        className="sidebar-label sidebar-logo-svg"
                        viewBox="0 0 160 50"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <text
                            className="logo-letter logo-text-path"
                            x="0"
                            y="40"
                        >
                            Gen-X
                        </text>
                    </svg>
                </div>
                <nav className="sidebar-nav">
                    {navItems.map((item) => (
                        <button
                            key={item.label}
                            className={`sidebar-item ${item.path && currentPath === item.path ? 'active' : ''} ${item.label === 'Games' ? 'sidebar-games' : ''}`}
                            onClick={item.onClick}
                            title={item.label}
                        >
                            <item.icon size={22} strokeWidth={item.path && currentPath === item.path ? 2.5 : 1.8} />
                            <span className="sidebar-label">{item.label}</span>
                            {item.badge > 0 && <span className="badge">{item.badge > 9 ? '9+' : item.badge}</span>}
                        </button>
                    ))}
                </nav>
                <div className="sidebar-more">
                    <button className="sidebar-item" onClick={() => setShowMore(!showMore)} title="More">
                        <Menu size={22} strokeWidth={1.8} />
                        <span className="sidebar-label">More</span>
                    </button>
                </div>
            </aside>

            {showMore && (
                <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 199 }} onClick={() => setShowMore(false)} />
                    <div className="more-menu">
                        <button className="more-menu-item" onClick={() => { navigate('/settings'); setShowMore(false); setExpanded(false); }}>
                            <Settings size={20} /> Settings
                        </button>
                        <button className="more-menu-item" onClick={() => { navigate('/saved'); setShowMore(false); setExpanded(false); }}>
                            <Bookmark size={20} /> Saved
                        </button>
                        <button className="more-menu-item" onClick={() => { toggleTheme(); setShowMore(false); }}>
                            {themeMode === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                            Switch appearance
                        </button>
                        <div className="more-menu-divider" />
                        <button className="more-menu-item" onClick={() => { logout(); navigate('/login'); setShowMore(false); setExpanded(false); }} style={{ color: 'var(--danger)' }}>
                            <LogOut size={20} /> Log out
                        </button>
                    </div>
                </>
            )}
        </>
    );
}
