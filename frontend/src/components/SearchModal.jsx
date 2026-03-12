import React, { useState } from 'react';
import { X, Search as SearchIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SearchModal = ({ isOpen, onClose }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);

    const handleSearch = (e) => {
        const val = e.target.value;
        setQuery(val);
        // Mock search results
        if (val.length > 2) {
            setResults([
                { id: 1, name: 'Cyber Punk', username: 'cyber_punk' },
                { id: 2, name: 'Zen Viibes', username: 'zen_vibes' },
                { id: 3, name: 'GenX Star', username: 'genx_star' }
            ]);
        } else {
            setResults([]);
        }
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
                            background: '#262626',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            padding: '8px 16px',
                            marginBottom: '24px'
                        }}>
                            <SearchIcon size={18} color="#8e8e8e" />
                            <input
                                type="text"
                                placeholder="Search"
                                value={query}
                                onChange={handleSearch}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'white',
                                    marginLeft: '10px',
                                    outline: 'none',
                                    width: '100%'
                                }}
                            />
                            {query && <X size={16} color="#8e8e8e" onClick={() => setQuery('')} style={{ cursor: 'pointer' }} />}
                        </div>

                        <div className="search-results">
                            {results.map(user => (
                                <div key={user.id} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '12px 0',
                                    cursor: 'pointer'
                                }}>
                                    <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#333' }} />
                                    <div>
                                        <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{user.username}</div>
                                        <div style={{ color: '#8e8e8e', fontSize: '0.85rem' }}>{user.name}</div>
                                    </div>
                                </div>
                            ))}
                            {query.length > 0 && results.length === 0 && (
                                <div style={{ color: '#8e8e8e', fontSize: '0.9rem', textAlign: 'center', marginTop: '40px' }}>
                                    No results found.
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
