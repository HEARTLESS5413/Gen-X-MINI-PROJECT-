import React, { useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';
import Explore from './pages/Explore';
import Reels from './pages/Reels';
import Games from './pages/Games';
import Messages from './pages/Messages';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import EditProfile from './pages/EditProfile';
import Settings from './pages/Settings';
import Saved from './pages/Saved';

// Game pages
import LudoGame from './pages/games/LudoGame';
import ChessGame from './pages/games/ChessGame';
import FlappyBird from './pages/games/FlappyBird';
import RockPaperScissors from './pages/games/RockPaperScissors';
import GuessTheWord from './pages/games/GuessTheWord';

// Components
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';
import CreateModal from './components/CreateModal';
import SearchPanel from './components/SearchPanel';
import CursorEffects from './components/CursorEffects';
import LoadingScreen from './components/LoadingScreen';
import IncomingCall from './components/IncomingCall';

function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();
    if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}><div className="auth-logo" style={{ fontSize: '3rem', fontWeight: '800', background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Gen-X</div></div>;
    if (!user) return <Navigate to="/login" replace />;
    return children;
}

function AppShell() {
    const { user } = useAuth();
    const [showCreate, setShowCreate] = useState(false);
    const [showSearch, setShowSearch] = useState(false);

    if (!user) {
        return (
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        );
    }

    return (
        <>
            <div className="app-layout">
                <Sidebar
                    onCreateClick={() => setShowCreate(true)}
                    onSearchClick={() => setShowSearch(!showSearch)}
                />
                <main className="main-content">
                    <Routes>
                        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
                        <Route path="/explore" element={<ProtectedRoute><Explore /></ProtectedRoute>} />
                        <Route path="/reels" element={<ProtectedRoute><Reels /></ProtectedRoute>} />
                        <Route path="/games" element={<ProtectedRoute><Games /></ProtectedRoute>} />
                        <Route path="/games/ludo" element={<ProtectedRoute><LudoGame /></ProtectedRoute>} />
                        <Route path="/games/chess" element={<ProtectedRoute><ChessGame /></ProtectedRoute>} />
                        <Route path="/games/flappy" element={<ProtectedRoute><FlappyBird /></ProtectedRoute>} />
                        <Route path="/games/rps" element={<ProtectedRoute><RockPaperScissors /></ProtectedRoute>} />
                        <Route path="/games/word" element={<ProtectedRoute><GuessTheWord /></ProtectedRoute>} />
                        <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
                        <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                        <Route path="/profile/:username" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                        <Route path="/edit-profile" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
                        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                        <Route path="/saved" element={<ProtectedRoute><Saved /></ProtectedRoute>} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </main>
                <MobileNav
                    onCreateClick={() => setShowCreate(true)}
                    onSearchClick={() => setShowSearch(!showSearch)}
                />
            </div>

            {showCreate && <CreateModal onClose={() => setShowCreate(false)} />}
            {showSearch && <SearchPanel onClose={() => setShowSearch(false)} />}
            <IncomingCall />
        </>
    );
}

export default function App() {
    const [showLoading, setShowLoading] = useState(true);
    const handleLoadingFinish = useCallback(() => setShowLoading(false), []);

    return (
        <BrowserRouter>
            <ThemeProvider>
                <AuthProvider>
                    {showLoading && <LoadingScreen onFinish={handleLoadingFinish} />}
                    <CursorEffects />
                    <AppShell />
                </AuthProvider>
            </ThemeProvider>
        </BrowserRouter>
    );
}
