import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth as authStore } from '../lib/store';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const currentUser = authStore.getCurrentUser();
        setUser(currentUser);
        setLoading(false);
    }, []);

    const login = (emailOrUsername, password) => {
        const result = authStore.login(emailOrUsername, password);
        if (result.user) setUser(result.user);
        return result;
    };

    const signup = (username, email, password, name) => {
        const result = authStore.signup(username, email, password, name);
        if (result.user) setUser(result.user);
        return result;
    };

    const logout = () => {
        authStore.logout();
        setUser(null);
    };

    const updateProfile = (updates) => {
        if (!user) return;
        const result = authStore.updateProfile(user.id, updates);
        if (result.user) setUser(result.user);
        return result;
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, signup, logout, updateProfile }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
}
