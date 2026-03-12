import React, { useState } from 'react';
import { X, Image } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { posts as postsStore } from '../lib/store';

export default function CreateModal({ onClose }) {
    const { user } = useAuth();
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [caption, setCaption] = useState('');
    const [tab, setTab] = useState('post');
    const [sharing, setSharing] = useState(false);

    const handleFile = (e) => {
        if (e.target.files?.[0]) {
            const f = e.target.files[0];
            setFile(f);
            setPreview(URL.createObjectURL(f));
        }
    };

    const handleShare = async () => {
        if (!user || !preview) return;
        setSharing(true);
        await postsStore.create(user.id, preview, caption);
        setSharing(false);
        onClose();
        window.location.reload();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="create-modal" onClick={(e) => e.stopPropagation()}>
                <div className="create-modal-header">
                    <button className="btn-ghost" onClick={onClose}><X size={20} /></button>
                    <span>Create new {tab}</span>
                    {preview && (
                        <button onClick={handleShare} disabled={sharing} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: '700', cursor: 'pointer' }}>
                            {sharing ? 'Sharing...' : 'Share'}
                        </button>
                    )}
                </div>
                <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
                    {['post', 'story', 'reel'].map(t => (
                        <button key={t} onClick={() => setTab(t)} style={{
                            flex: 1, padding: '10px', background: tab === t ? 'var(--bg-elevated)' : 'transparent',
                            border: 'none', color: 'var(--text-primary)', fontWeight: tab === t ? '700' : '400',
                            textTransform: 'capitalize', cursor: 'pointer', borderBottom: tab === t ? '2px solid var(--accent)' : 'none'
                        }}>{t}</button>
                    ))}
                </div>
                <div className="create-modal-body">
                    {!preview ? (
                        <label className="create-dropzone">
                            <Image size={64} strokeWidth={1} />
                            <p style={{ fontSize: '1.2rem', fontWeight: '300' }}>Drag photos and videos here</p>
                            <button className="btn btn-primary" onClick={(e) => e.stopPropagation()}>Select from computer</button>
                            <input type="file" hidden onChange={handleFile} accept="image/*,video/*" />
                        </label>
                    ) : (
                        <>
                            <div className="create-preview">
                                <img src={preview} alt="preview" />
                                <button className="btn-ghost" onClick={() => { setPreview(null); setFile(null); }}
                                    style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.5)', color: 'white' }}>
                                    <X size={18} />
                                </button>
                            </div>
                            <div className="create-caption">
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '12px' }}>
                                    <img className="avatar avatar-sm" src={user?.avatar} alt="" />
                                    <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{user?.username}</span>
                                </div>
                                <textarea placeholder="Write a caption..." value={caption} onChange={(e) => setCaption(e.target.value)} />
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
