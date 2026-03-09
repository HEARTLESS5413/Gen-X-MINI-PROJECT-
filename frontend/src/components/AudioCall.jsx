import React, { useState, useEffect, useRef } from 'react';
import { X, Mic, MicOff, Volume2, VolumeX, Phone } from 'lucide-react';

export default function AudioCall({ user, onClose }) {
    const [isMuted, setIsMuted] = useState(false);
    const [isSpeaker, setIsSpeaker] = useState(true);
    const [callDuration, setCallDuration] = useState(0);
    const [connecting, setConnecting] = useState(true);
    const localStream = useRef(null);

    useEffect(() => {
        startMic();
        const timer = setTimeout(() => setConnecting(false), 2000);
        return () => {
            clearTimeout(timer);
            stopMic();
        };
    }, []);

    useEffect(() => {
        if (connecting) return;
        const timer = setInterval(() => setCallDuration(d => d + 1), 1000);
        return () => clearInterval(timer);
    }, [connecting]);

    const startMic = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            localStream.current = stream;
        } catch (err) {
            console.log('Mic error:', err);
        }
    };

    const stopMic = () => {
        localStream.current?.getTracks().forEach(t => t.stop());
    };

    const toggleMute = () => {
        if (localStream.current) {
            localStream.current.getAudioTracks().forEach(t => t.enabled = isMuted);
        }
        setIsMuted(!isMuted);
    };

    const formatDuration = (s) => {
        const mins = Math.floor(s / 60);
        const secs = s % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Audio wave animation
    const waves = Array.from({ length: 5 }, (_, i) => i);

    return (
        <div className="call-overlay">
            <div className="call-container audio-call">
                <div className="audio-call-bg" />

                <div className="audio-call-content">
                    <div className={`audio-avatar-ring ${!connecting ? 'connected' : ''}`}>
                        <img src={user?.avatar} alt="" className={`call-avatar-large ${connecting ? 'pulse' : ''}`} />
                    </div>

                    <h2 className="audio-call-name">{user?.username}</h2>

                    {connecting ? (
                        <p className="audio-call-status">Calling...</p>
                    ) : (
                        <p className="audio-call-status">{formatDuration(callDuration)}</p>
                    )}

                    {/* Audio waves */}
                    {!connecting && !isMuted && (
                        <div className="audio-waves">
                            {waves.map(i => (
                                <div key={i} className="audio-wave" style={{ animationDelay: `${i * 0.15}s` }} />
                            ))}
                        </div>
                    )}
                </div>

                <div className="call-controls">
                    <button className={`call-btn ${isMuted ? 'active' : ''}`} onClick={toggleMute}>
                        {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
                    </button>
                    <button className={`call-btn ${!isSpeaker ? 'active' : ''}`} onClick={() => setIsSpeaker(!isSpeaker)}>
                        {isSpeaker ? <Volume2 size={22} /> : <VolumeX size={22} />}
                    </button>
                    <button className="call-btn end-call" onClick={onClose}>
                        <Phone size={22} />
                    </button>
                </div>
            </div>
        </div>
    );
}
