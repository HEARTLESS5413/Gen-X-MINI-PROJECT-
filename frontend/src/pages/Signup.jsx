import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Camera, Check, Upload, User, Phone as PhoneIcon, AtSign } from 'lucide-react';

export default function Signup() {
    const { signup, updateProfile } = useAuth();
    const navigate = useNavigate();

    const [step, setStep] = useState(1);
    const [form, setForm] = useState({
        name: '',
        username: '',
        phone: '',
        email: '',
        password: '',
    });
    const [profilePhoto, setProfilePhoto] = useState(null);
    const [profilePhotoPreview, setProfilePhotoPreview] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef(null);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handlePhotoSelect = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setProfilePhoto(file);
            const reader = new FileReader();
            reader.onload = (ev) => setProfilePhotoPreview(ev.target.result);
            reader.readAsDataURL(file);
        }
    };

    const handleCreateAccount = (e) => {
        e.preventDefault();
        setError('');
        if (!form.username) {
            setError('Username is required');
            return;
        }
        if (!form.password || form.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }
        setStep(2);
    };

    const handleCompleteProfile = (e) => {
        e.preventDefault();
        setError('');
        if (!form.name) {
            setError('Please enter your name');
            return;
        }
        if (!form.phone || form.phone.length < 10) {
            setError('Please enter a valid phone number');
            return;
        }

        setLoading(true);

        const result = signup(form.username, form.email || `${form.username}@genx.app`, form.password, form.name);
        if (result.error) {
            setError(result.error);
            setLoading(false);
            return;
        }

        // Update the profile with additional info
        const users = JSON.parse(localStorage.getItem('genx_users') || '[]');
        const idx = users.findIndex(u => u.username === form.username);
        if (idx > -1) {
            users[idx].phone = form.phone;
            users[idx].name = form.name;
            if (profilePhotoPreview) {
                users[idx].avatar = profilePhotoPreview;
            }
            localStorage.setItem('genx_users', JSON.stringify(users));
        }

        const currentUser = JSON.parse(localStorage.getItem('genx_current_user') || 'null');
        if (currentUser) {
            currentUser.phone = form.phone;
            currentUser.name = form.name;
            if (profilePhotoPreview) {
                currentUser.avatar = profilePhotoPreview;
            }
            localStorage.setItem('genx_current_user', JSON.stringify(currentUser));
        }

        setLoading(false);
        navigate('/');
    };

    return (
        <div className="auth-page">
            <div style={{ width: '100%', maxWidth: '440px' }}>
                <div className="auth-card">
                    <div className="auth-logo">Gen-X</div>

                    {/* Progress */}
                    <div className="signup-steps">
                        <div className={`signup-step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
                            <div className="signup-step-circle">{step > 1 ? <Check size={14} /> : '1'}</div>
                            <span>Account</span>
                        </div>
                        <div className={`signup-step ${step >= 2 ? 'active' : ''}`}>
                            <div className="signup-step-circle">2</div>
                            <span>Profile</span>
                        </div>
                    </div>

                    {/* Step 1: Create Account */}
                    {step === 1 && (
                        <form className="auth-form" onSubmit={handleCreateAccount}>
                            <div className="input-with-icon">
                                <AtSign size={16} className="input-icon" />
                                <input className="input-field" type="text" name="username" placeholder="Username *" value={form.username} onChange={handleChange} />
                            </div>
                            <input className="input-field" type="email" name="email" placeholder="Email (optional)" value={form.email} onChange={handleChange} />
                            <input className="input-field" type="password" name="password" placeholder="Password (min 6 chars) *" value={form.password} onChange={handleChange} />
                            {error && <div className="auth-error">{error}</div>}
                            <button className="btn btn-primary" type="submit">
                                Next: Set Up Profile <ArrowRight size={16} />
                            </button>
                        </form>
                    )}

                    {/* Step 2: Profile Setup */}
                    {step === 2 && (
                        <form className="auth-form" onSubmit={handleCompleteProfile}>
                            <p className="auth-subtitle">Set up your profile</p>

                            {/* Profile Photo */}
                            <div className="profile-photo-upload" onClick={() => fileInputRef.current?.click()}>
                                {profilePhotoPreview ? (
                                    <img src={profilePhotoPreview} alt="Profile" className="profile-photo-preview" />
                                ) : (
                                    <div className="profile-photo-placeholder">
                                        <Camera size={28} />
                                        <span>Add Photo</span>
                                    </div>
                                )}
                                <div className="profile-photo-badge">
                                    <Upload size={14} />
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handlePhotoSelect}
                                    style={{ display: 'none' }}
                                />
                            </div>

                            {/* Name */}
                            <div className="input-with-icon">
                                <User size={16} className="input-icon" />
                                <input className="input-field" type="text" name="name" placeholder="Full Name *" value={form.name} onChange={handleChange} />
                            </div>

                            {/* Phone */}
                            <div className="input-with-icon">
                                <PhoneIcon size={16} className="input-icon" />
                                <div className="auth-phone-group" style={{ flex: 1 }}>
                                    <div className="auth-country-code" style={{ padding: '10px 10px' }}>
                                        <span>🇮🇳</span>
                                        <span>+91</span>
                                    </div>
                                    <input
                                        className="input-field"
                                        type="tel"
                                        name="phone"
                                        placeholder="Phone number *"
                                        value={form.phone}
                                        onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                                        maxLength={10}
                                    />
                                </div>
                            </div>

                            {/* Username display */}
                            <div className="profile-setup-username">
                                <AtSign size={14} />
                                <span>@{form.username}</span>
                            </div>

                            {error && <div className="auth-error">{error}</div>}

                            <button className="btn btn-primary" type="submit" disabled={loading}>
                                {loading ? 'Creating...' : <>Complete Signup <Check size={16} /></>}
                            </button>

                            <button type="button" className="btn btn-secondary" onClick={() => { setStep(1); setError(''); }}>
                                Back
                            </button>
                        </form>
                    )}

                    <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '16px', lineHeight: 1.5 }}>
                        By signing up, you agree to our Terms, Privacy Policy and Cookies Policy.
                    </p>
                </div>
                <div className="auth-footer">
                    Have an account? <span className="auth-link" onClick={() => navigate('/login')}>Log in</span>
                </div>
            </div>
        </div>
    );
}
