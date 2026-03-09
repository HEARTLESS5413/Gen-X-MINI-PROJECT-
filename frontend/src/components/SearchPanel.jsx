import React, { useState } from 'react';
import { X, Search as SearchIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { users as usersStore, follows as followsStore } from '../lib/store';
import { useAuth } from '../context/AuthContext';

export default function SearchPanel({ onClose }) {
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();
    const [query, setQuery] = useState('');
    const results = usersStore.search(query).filter(u => u.id !== currentUser?.id);

    return (
        <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 89 }} onClick={onClose} />
            <div className="search-panel">
                <h2>Search</h2>
                <div className="search-input-wrap">
                    <SearchIcon size={18} color="var(--text-tertiary)" />
                    <input placeholder="Search" value={query} onChange={(e) => setQuery(e.target.value)} autoFocus />
                    {query && <X size={16} color="var(--text-tertiary)" onClick={() => setQuery('')} style={{ cursor: 'pointer' }} />}
                </div>

                {results.length > 0 ? (
                    results.map(u => {
                        const isFollowing = currentUser ? followsStore.isFollowing(currentUser.id, u.id) : false;
                        return (
                            <div key={u.id} className="search-result-item" onClick={() => { navigate(`/profile/${u.username}`); onClose(); }}>
                                <img className="avatar avatar-md" src={u.avatar} alt="" />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{u.username}</div>
                                    <div style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>{u.name}{isFollowing ? ' • Following' : ''}</div>
                                </div>
                            </div>
                        );
                    })
                ) : query.length > 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>No results found.</div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                        <p style={{ fontWeight: '600', marginBottom: '8px' }}>Recent searches</p>
                        <p style={{ fontSize: '0.85rem' }}>No recent searches.</p>
                    </div>
                )}
            </div>
        </>
    );
}
