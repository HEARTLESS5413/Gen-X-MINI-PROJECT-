import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth as authStore } from '../lib/store';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Load current user from localStorage cache
        const currentUser = authStore.getCurrentUser();
        setUser(currentUser);
        setLoading(false);
    }, []);

    const login = async (emailOrUsername, password) => {
        const result = await authStore.login(emailOrUsername, password);
        if (result.user) setUser(result.user);
        return result;
    };

    const signup = async (username, email, password, name) => {
        const result = await authStore.signup(username, email, password, name);
        if (result.user) setUser(result.user);
        return result;
    };

    const logout = () => {
        authStore.logout();
        setUser(null);
    };

    const updateProfile = async (updates) => {
        if (!user) return;
        const result = await authStore.updateProfile(user.id, updates);
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
