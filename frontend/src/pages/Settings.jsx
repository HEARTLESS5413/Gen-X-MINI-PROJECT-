import React from 'react';
import { Sun, Moon, LogOut, Bookmark, ChevronRight, Shield, Bell, Eye, HelpCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { saved as savedStore } from '../lib/store';

export default function Settings() {
    const { user, logout } = useAuth();
    const { themeMode, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="settings-page">
            <h2>Settings</h2>

            <div className="settings-group">
                <h3>Appearance</h3>
                <div className="settings-item" onClick={toggleTheme}>
                    <div className="settings-item-left">
                        {themeMode === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                        <div>
                            <div className="settings-item-label">Dark mode</div>
                            <div className="settings-item-desc">{themeMode === 'dark' ? 'Currently using dark mode' : 'Currently using light mode'}</div>
                        </div>
                    </div>
                    <label className="toggle" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" checked={themeMode === 'dark'} onChange={toggleTheme} />
                        <span className="toggle-slider"></span>
                    </label>
                </div>
            </div>

            <div className="settings-group">
                <h3>Content</h3>
                <div className="settings-item" onClick={() => navigate('/saved')}>
                    <div className="settings-item-left">
                        <Bookmark size={20} />
                        <div>
                            <div className="settings-item-label">Saved</div>
                            <div className="settings-item-desc">View your saved posts</div>
                        </div>
                    </div>
                    <ChevronRight size={18} color="var(--text-tertiary)" />
                </div>
            </div>

            <div className="settings-group">
                <h3>Account</h3>
                <div className="settings-item" onClick={() => navigate('/edit-profile')}>
                    <div className="settings-item-left">
                        <Shield size={20} />
                        <div>
                            <div className="settings-item-label">Edit profile</div>
                            <div className="settings-item-desc">Change your profile info</div>
                        </div>
                    </div>
                    <ChevronRight size={18} color="var(--text-tertiary)" />
                </div>
                <div className="settings-item">
                    <div className="settings-item-left">
                        <Bell size={20} />
                        <div>
                            <div className="settings-item-label">Notifications</div>
                            <div className="settings-item-desc">Manage notification preferences</div>
                        </div>
                    </div>
                    <ChevronRight size={18} color="var(--text-tertiary)" />
                </div>
                <div className="settings-item">
                    <div className="settings-item-left">
                        <Eye size={20} />
                        <div>
                            <div className="settings-item-label">Privacy</div>
                            <div className="settings-item-desc">Control who can see your content</div>
                        </div>
                    </div>
                    <ChevronRight size={18} color="var(--text-tertiary)" />
                </div>
            </div>

            <div className="settings-group">
                <h3>Support</h3>
                <div className="settings-item">
                    <div className="settings-item-left">
                        <HelpCircle size={20} />
                        <div>
                            <div className="settings-item-label">Help</div>
                            <div className="settings-item-desc">Get help with Gen-X</div>
                        </div>
                    </div>
                    <ChevronRight size={18} color="var(--text-tertiary)" />
                </div>
            </div>

            <button className="settings-item" onClick={handleLogout} style={{ width: '100%', color: 'var(--danger)', fontWeight: '600' }}>
                <div className="settings-item-left">
                    <LogOut size={20} />
                    <div className="settings-item-label">Log out</div>
                </div>
            </button>
        </div>
    );
}
