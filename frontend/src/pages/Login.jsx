import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [error, setError] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = (e) => {
        e.preventDefault();
        setError('');
        if (!email || !password) { setError('Please fill in all fields'); return; }
        const result = login(email, password);
        if (result.error) setError(result.error);
        else navigate('/');
    };

    return (
        <div className="auth-page">
            <div style={{ width: '100%', maxWidth: '420px' }}>
                <div className="auth-card">
                    <div className="auth-logo">Gen-X</div>

                    <form className="auth-form" onSubmit={handleLogin}>
                        <input
                            className="input-field"
                            type="text"
                            placeholder="Username or email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <input
                            className="input-field"
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        {error && <div className="auth-error">{error}</div>}
                        <button className="btn btn-primary" type="submit">Log In</button>
                    </form>

                    <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', marginTop: '12px' }}>
                        Demo: <strong>cyber_punk</strong> / <strong>demo123</strong>
                    </p>
                </div>
                <div className="auth-footer">
                    Don't have an account? <span className="auth-link" onClick={() => navigate('/signup')}>Sign up</span>
                </div>
            </div>
        </div>
    );
}
