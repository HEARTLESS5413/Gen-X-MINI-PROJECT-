import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera } from 'lucide-react';

export default function EditProfile() {
    const { user, updateProfile } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({
        name: user?.name || '',
        username: user?.username || '',
        bio: user?.bio || '',
        avatar: user?.avatar || '',
    });
    const [saved, setSaved] = useState(false);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setSaved(false);
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setForm({ ...form, avatar: url });
            setSaved(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        updateProfile(form);
        setSaved(true);
        setTimeout(() => navigate(`/profile/${form.username}`), 500);
    };

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '24px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                <button className="btn-ghost" onClick={() => navigate(-1)}><ArrowLeft size={24} /></button>
                <h2 style={{ fontWeight: '700', fontSize: '1.3rem' }}>Edit profile</h2>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Avatar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '20px', background: 'var(--bg-elevated)', borderRadius: '16px' }}>
                    <div style={{ position: 'relative' }}>
                        <img className="avatar avatar-xl" src={form.avatar} alt="" />
                        <label style={{
                            position: 'absolute', bottom: '-4px', right: '-4px',
                            width: '28px', height: '28px', borderRadius: '50%',
                            background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', border: '2px solid var(--bg-primary)'
                        }}>
                            <Camera size={14} color="white" />
                            <input type="file" hidden accept="image/*" onChange={handleAvatarChange} />
                        </label>
                    </div>
                    <div>
                        <div style={{ fontWeight: '600' }}>{user?.username}</div>
                        <label style={{ color: 'var(--accent)', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer' }}>
                            Change profile photo
                            <input type="file" hidden accept="image/*" onChange={handleAvatarChange} />
                        </label>
                    </div>
                </div>

                {/* Fields */}
                <div>
                    <label style={{ fontWeight: '600', fontSize: '0.9rem', display: 'block', marginBottom: '8px' }}>Name</label>
                    <input className="input-field" name="name" value={form.name} onChange={handleChange} />
                </div>
                <div>
                    <label style={{ fontWeight: '600', fontSize: '0.9rem', display: 'block', marginBottom: '8px' }}>Username</label>
                    <input className="input-field" name="username" value={form.username} onChange={handleChange} />
                </div>
                <div>
                    <label style={{ fontWeight: '600', fontSize: '0.9rem', display: 'block', marginBottom: '8px' }}>Bio</label>
                    <textarea className="input-field" name="bio" value={form.bio} onChange={handleChange} rows="3" style={{ resize: 'vertical' }} />
                </div>

                <button className="btn btn-primary" type="submit" style={{ alignSelf: 'flex-start' }}>
                    {saved ? '✓ Saved!' : 'Submit'}
                </button>
            </form>
        </div>
    );
}
