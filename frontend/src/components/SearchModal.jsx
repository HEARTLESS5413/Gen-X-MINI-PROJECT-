import React, { useState } from 'react';
import { X, Search as SearchIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { users as usersStore } from '../lib/store';
import { useNavigate } from 'react-router-dom';

const SearchModal = ({ isOpen, onClose }) => {
    const [query, setQuery] = useState('');
    const navigate = useNavigate();

    // Search real users from localStorage
    const results = usersStore.search(query);

    const handleSearch = (e) => {
        setQuery(e.target.value);
    };

    const handleUserClick = (username) => {
        navigate(`/profile/${username}`);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="modal-overlay" style={{
                    position: 'fixed',
                    top: 0,
                    left: '280px',
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.4)',
                    zIndex: 90,
                    display: 'flex',
                    justifyContent: 'flex-start'
                }} onClick={onClose}>
                    <motion.div
                        initial={{ x: -280, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -280, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            width: '380px',
                            height: '100vh',
                            background: '#0a0a0a',
                            borderRight: '1px solid var(--glass-border)',
                            padding: '24px',
                            boxShadow: '20px 0 40px rgba(0,0,0,0.5)'
                        }}
                    >
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '24px' }}>Search</h2>
                        <div style={{
                            background: '#1a1a1a',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            padding: '8px 16px',
                            marginBottom: '24px'
                        }}>
                            <SearchIcon size={18} color="var(--text-tertiary)" />
                            <input
                                type="text"
                                placeholder="Search"
                                value={query}
                                onChange={handleSearch}
                                autoFocus
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--text-primary)',
                                    marginLeft: '10px',
                                    outline: 'none',
                                    width: '100%'
                                }}
                            />
                            {query && <X size={16} color="var(--text-tertiary)" onClick={() => setQuery('')} style={{ cursor: 'pointer' }} />}
                        </div>

                        <div className="search-results">
                            {results.map(user => (
                                <div key={user.id} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '12px 0',
                                    cursor: 'pointer',
                                    transition: 'opacity 0.2s'
                                }} onClick={() => handleUserClick(user.username)}
                                   onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
                                   onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                                >
                                    <img src={user.avatar} alt="" style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover' }} />
                                    <div>
                                        <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{user.username}</div>
                                        <div style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>{user.name}</div>
                                    </div>
                                </div>
                            ))}
                            {query.length > 0 && results.length === 0 && (
                                <div style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem', textAlign: 'center', marginTop: '40px' }}>
                                    No results found.
                                </div>
                            )}
                            {query.length === 0 && (
                                <div style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem', textAlign: 'center', marginTop: '40px' }}>
                                    <p style={{ fontWeight: '600', marginBottom: '8px' }}>Search for users</p>
                                    <p>Type a username or name to find people.</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default SearchModal;
