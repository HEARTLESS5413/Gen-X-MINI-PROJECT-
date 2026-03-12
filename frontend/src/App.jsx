import React, { useState, useCallback, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

// Only load auth pages and shell components eagerly (needed immediately)
import Login from './pages/Login';
import Signup from './pages/Signup';
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';
import LoadingScreen from './components/LoadingScreen';

// Lazy-load everything else (only downloaded when user navigates there)
const Home = lazy(() => import('./pages/Home'));
const Explore = lazy(() => import('./pages/Explore'));
const Reels = lazy(() => import('./pages/Reels'));
const Games = lazy(() => import('./pages/Games'));
const Messages = lazy(() => import('./pages/Messages'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Profile = lazy(() => import('./pages/Profile'));
const EditProfile = lazy(() => import('./pages/EditProfile'));
const Settings = lazy(() => import('./pages/Settings'));
const Saved = lazy(() => import('./pages/Saved'));

// Game pages — very heavy, lazy-load
const LudoGame = lazy(() => import('./pages/games/LudoGame'));
const ChessGame = lazy(() => import('./pages/games/ChessGame'));
const FlappyBird = lazy(() => import('./pages/games/FlappyBird'));
const RockPaperScissors = lazy(() => import('./pages/games/RockPaperScissors'));
const GuessTheWord = lazy(() => import('./pages/games/GuessTheWord'));

// Heavy overlays — lazy-load
const CreateModal = lazy(() => import('./components/CreateModal'));
const SearchPanel = lazy(() => import('./components/SearchPanel'));
const CursorEffects = lazy(() => import('./components/CursorEffects'));
const IncomingCall = lazy(() => import('./components/IncomingCall'));

// Lightweight page loading spinner
function PageLoader() {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
            <div style={{ width: '32px', height: '32px', border: '3px solid rgba(99, 102, 241, 0.2)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
    );
}

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
                    <Suspense fallback={<PageLoader />}>
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
                    </Suspense>
                </main>
                <MobileNav
                    onCreateClick={() => setShowCreate(true)}
                    onSearchClick={() => setShowSearch(!showSearch)}
                />
            </div>

            <Suspense fallback={null}>
                {showCreate && <CreateModal onClose={() => setShowCreate(false)} />}
                {showSearch && <SearchPanel onClose={() => setShowSearch(false)} />}
                <CursorEffects />
                <IncomingCall />
            </Suspense>
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
                    <AppShell />
                </AuthProvider>
            </ThemeProvider>
        </BrowserRouter>
    );
}
