import React, { useState, useRef, useEffect } from 'react';
import { X, Mic, MicOff, Video, VideoOff, Maximize, Minimize, Send, Play, Youtube, HardDrive, Film, ArrowLeft } from 'lucide-react';
import { posts as postsStore, users as usersStore } from '../lib/store';
import { useAuth } from '../context/AuthContext';

const PLATFORMS = [
    { id: 'youtube', name: 'YouTube', icon: Youtube, color: '#ff0000', description: 'Watch YouTube videos together' },
    { id: 'drive', name: 'Google Drive', icon: HardDrive, color: '#4285f4', description: 'Watch Drive videos together' },
    { id: 'reels', name: 'Reels', icon: Film, color: '#833AB4', description: 'Browse reels together' },
];

function extractYouTubeId(url) {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
}

export default function WatchTogether({ user, onClose }) {
    const { user: currentUser } = useAuth();
    const [platform, setPlatform] = useState(null);
    const [url, setUrl] = useState('');
    const [videoId, setVideoId] = useState(null);
    const [isMicOn, setIsMicOn] = useState(false);
    const [isCamOn, setIsCamOn] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [chatMsg, setChatMsg] = useState('');
    const [messages, setMessages] = useState([]);
    const [currentReel, setCurrentReel] = useState(0);
    const localVideoRef = useRef(null);
    const localStream = useRef(null);

    const allPosts = postsStore.getAll();

    const toggleMic = async () => {
        if (!isMicOn) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                localStream.current = stream;
                setIsMicOn(true);
            } catch (err) {
                console.log('Mic error:', err);
            }
        } else {
            localStream.current?.getAudioTracks().forEach(t => t.stop());
            setIsMicOn(false);
        }
    };

    const toggleCam = async () => {
        if (!isCamOn) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                if (localVideoRef.current) localVideoRef.current.srcObject = stream;
                setIsCamOn(true);
            } catch (err) {
                console.log('Cam error:', err);
            }
        } else {
            if (localVideoRef.current?.srcObject) {
                localVideoRef.current.srcObject.getTracks().forEach(t => t.stop());
                localVideoRef.current.srcObject = null;
            }
            setIsCamOn(false);
        }
    };

    const handleLoadVideo = () => {
        if (platform === 'youtube') {
            const id = extractYouTubeId(url);
            if (id) setVideoId(id);
            else alert('Invalid YouTube URL');
        } else if (platform === 'drive') {
            setVideoId(url);
        }
    };

    const sendChat = (e) => {
        e.preventDefault();
        if (!chatMsg.trim()) return;
        const msg = {
            id: Date.now(),
            text: chatMsg,
            user: currentUser?.username || 'You',
            avatar: currentUser?.avatar,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, msg]);
        setChatMsg('');

        // Auto-remove floating messages after 5s
        setTimeout(() => {
            setMessages(prev => prev.filter(m => m.id !== msg.id));
        }, 5000);
    };

    useEffect(() => {
        return () => {
            localStream.current?.getTracks().forEach(t => t.stop());
            if (localVideoRef.current?.srcObject) {
                localVideoRef.current.srcObject.getTracks().forEach(t => t.stop());
            }
        };
    }, []);

    // Platform selection screen
    if (!platform) {
        return (
            <div className="watch-overlay">
                <div className="watch-select-container">
                    <div className="watch-select-header">
                        <h2>🍿 Watch Together</h2>
                        <p>with <strong>{user?.username}</strong></p>
                        <button className="watch-close" onClick={onClose}><X size={22} /></button>
                    </div>
                    <div className="watch-platforms">
                        {PLATFORMS.map(p => (
                            <button key={p.id} className="watch-platform-card" onClick={() => setPlatform(p.id)}>
                                <div className="watch-platform-icon" style={{ background: p.color }}>
                                    <p.icon size={28} color="white" />
                                </div>
                                <h3>{p.name}</h3>
                                <p>{p.description}</p>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`watch-overlay ${isFullScreen ? 'fullscreen' : ''}`}>
            <div className="watch-container">
                {/* Header */}
                <div className="watch-header">
                    <button className="btn-ghost" onClick={() => setPlatform(null)}>
                        <ArrowLeft size={20} />
                    </button>
                    <div className="watch-header-info">
                        <span className="watch-platform-badge" style={{ background: PLATFORMS.find(p => p.id === platform)?.color }}>
                            {PLATFORMS.find(p => p.id === platform)?.name}
                        </span>
                        <span>watching with <strong>{user?.username}</strong></span>
                    </div>
                    <button className="btn-ghost" onClick={() => setIsFullScreen(!isFullScreen)}>
                        {isFullScreen ? <Minimize size={20} /> : <Maximize size={20} />}
                    </button>
                    <button className="btn-ghost" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="watch-content">
                    {/* Video area */}
                    <div className="watch-video-area">
                        {platform === 'youtube' && !videoId && (
                            <div className="watch-url-input">
                                <Youtube size={32} color="#ff0000" />
                                <h3>Paste YouTube URL</h3>
                                <div className="watch-url-bar">
                                    <input
                                        placeholder="https://youtube.com/watch?v=..."
                                        value={url}
                                        onChange={e => setUrl(e.target.value)}
                                        className="input-field"
                                    />
                                    <button className="btn btn-primary" onClick={handleLoadVideo}>
                                        <Play size={16} /> Load
                                    </button>
                                </div>
                            </div>
                        )}

                        {platform === 'youtube' && videoId && (
                            <iframe
                                className="watch-youtube-frame"
                                src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        )}

                        {platform === 'drive' && !videoId && (
                            <div className="watch-url-input">
                                <HardDrive size={32} color="#4285f4" />
                                <h3>Paste Google Drive Video Link</h3>
                                <div className="watch-url-bar">
                                    <input
                                        placeholder="https://drive.google.com/file/d/..."
                                        value={url}
                                        onChange={e => setUrl(e.target.value)}
                                        className="input-field"
                                    />
                                    <button className="btn btn-primary" onClick={handleLoadVideo}>
                                        <Play size={16} /> Load
                                    </button>
                                </div>
                            </div>
                        )}

                        {platform === 'drive' && videoId && (
                            <iframe
                                className="watch-drive-frame"
                                src={videoId.replace('/view', '/preview')}
                                allow="autoplay"
                                allowFullScreen
                            />
                        )}

                        {platform === 'reels' && (
                            <div className="watch-reels-feed">
                                {allPosts.slice(currentReel, currentReel + 1).map(post => {
                                    const postUser = usersStore.getById(post.userId);
                                    return (
                                        <div key={post.id} className="watch-reel-card">
                                            <img src={post.image} alt="" className="watch-reel-image" />
                                            <div className="watch-reel-info">
                                                <img className="avatar avatar-sm" src={postUser?.avatar} alt="" />
                                                <span>{postUser?.username}</span>
                                            </div>
                                            <p className="watch-reel-caption">{post.caption}</p>
                                        </div>
                                    );
                                })}
                                <div className="watch-reel-nav">
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => setCurrentReel(Math.max(0, currentReel - 1))}
                                        disabled={currentReel === 0}
                                    >
                                        ⬆️ Prev
                                    </button>
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => setCurrentReel(Math.min(allPosts.length - 1, currentReel + 1))}
                                        disabled={currentReel >= allPosts.length - 1}
                                    >
                                        ⬇️ Next
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Floating messages */}
                        <div className="watch-floating-messages">
                            {messages.map(msg => (
                                <div key={msg.id} className="watch-floating-msg">
                                    <img className="avatar avatar-xs" src={msg.avatar} alt="" />
                                    <span>{msg.text}</span>
                                </div>
                            ))}
                        </div>

                        {/* Local cam PiP */}
                        {isCamOn && (
                            <div className="watch-local-cam">
                                <video ref={localVideoRef} autoPlay muted playsInline />
                            </div>
                        )}

                        {/* Friend cam placeholder */}
                        <div className="watch-friend-cam">
                            <img src={user?.avatar} alt="" className="avatar avatar-md" />
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="watch-controls">
                    <button className={`call-btn ${isMicOn ? 'active' : ''}`} onClick={toggleMic}>
                        {isMicOn ? <Mic size={20} /> : <MicOff size={20} />}
                    </button>
                    <button className={`call-btn ${isCamOn ? 'active' : ''}`} onClick={toggleCam}>
                        {isCamOn ? <Video size={20} /> : <VideoOff size={20} />}
                    </button>
                    <form className="watch-chat-input" onSubmit={sendChat}>
                        <input
                            placeholder="Send a message..."
                            value={chatMsg}
                            onChange={e => setChatMsg(e.target.value)}
                            className="input-field"
                        />
                        <button type="submit" className="btn-ghost"><Send size={18} /></button>
                    </form>
                </div>
            </div>
        </div>
    );
}
