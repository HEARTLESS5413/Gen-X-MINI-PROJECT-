import React, { useState, useEffect, useRef } from 'react';
import { X, Mic, MicOff, Volume2, VolumeX, Phone, PhoneOff } from 'lucide-react';
import { acceptCall, endCall, onCallEvent, getActiveCall } from '../lib/callSignaling';

export default function AudioCall({ user, onClose, isIncoming = false }) {
    const [isMuted, setIsMuted] = useState(false);
    const [isSpeaker, setIsSpeaker] = useState(true);
    const [callDuration, setCallDuration] = useState(0);
    const [callState, setCallState] = useState(isIncoming ? 'ringing' : 'calling'); // 'calling' | 'ringing' | 'connected' | 'declined' | 'ended'
    const localStream = useRef(null);
    const ringtoneRef = useRef(null);

    useEffect(() => {
        // Play ringing tone
        playRingtone();

        // Listen for call events
        const cleanup = onCallEvent((event) => {
            if (event.action === 'accepted') {
                setCallState('connected');
                stopRingtone();
                startMic();
            } else if (event.action === 'declined') {
                setCallState('declined');
                stopRingtone();
                setTimeout(() => handleEnd(), 2000);
            } else if (event.action === 'ended') {
                setCallState('ended');
                stopRingtone();
                setTimeout(() => handleEnd(), 1000);
            }
        });

        // Also poll the active call status
        const pollInterval = setInterval(() => {
            const call = getActiveCall();
            if (!call || call.status === 'ended') {
                setCallState('ended');
                stopRingtone();
                setTimeout(() => handleEnd(), 1000);
            } else if (call.status === 'accepted' && callState !== 'connected') {
                setCallState('connected');
                stopRingtone();
                startMic();
            } else if (call.status === 'declined' && callState !== 'declined') {
                setCallState('declined');
                stopRingtone();
                setTimeout(() => handleEnd(), 2000);
            }
        }, 500);

        return () => {
            cleanup();
            clearInterval(pollInterval);
            stopMic();
            stopRingtone();
        };
    }, []);

    useEffect(() => {
        if (callState !== 'connected') return;
        const timer = setInterval(() => setCallDuration(d => d + 1), 1000);
        return () => clearInterval(timer);
    }, [callState]);

    const playRingtone = () => {
        try {
            // Create oscillator-based ringtone
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = isIncoming ? 440 : 380;
            gain.gain.value = 0.1;
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();

            // Pulse the ringtone
            const pulseInterval = setInterval(() => {
                gain.gain.value = gain.gain.value > 0 ? 0 : 0.1;
            }, isIncoming ? 500 : 1000);

            ringtoneRef.current = { ctx, osc, gain, pulseInterval };
        } catch (e) {
            console.log('Audio context error:', e);
        }
    };

    const stopRingtone = () => {
        if (ringtoneRef.current) {
            clearInterval(ringtoneRef.current.pulseInterval);
            try {
                ringtoneRef.current.osc.stop();
                ringtoneRef.current.ctx.close();
            } catch (e) {}
            ringtoneRef.current = null;
        }
    };

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

    const handleAccept = () => {
        acceptCall();
        setCallState('connected');
        stopRingtone();
        startMic();
    };

    const handleEnd = () => {
        endCall();
        stopMic();
        stopRingtone();
        onClose();
    };

    const formatDuration = (s) => {
        const mins = Math.floor(s / 60);
        const secs = s % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const waves = Array.from({ length: 5 }, (_, i) => i);

    return (
        <div className="call-overlay">
            <div className="call-container audio-call">
                <div className="audio-call-bg" />

                <div className="audio-call-content">
                    <div className={`audio-avatar-ring ${callState === 'connected' ? 'connected' : ''}`}>
                        <img src={user?.avatar} alt="" className={`call-avatar-large ${callState !== 'connected' ? 'pulse' : ''}`} />
                    </div>

                    <h2 className="audio-call-name">{user?.username}</h2>

                    {callState === 'calling' && (
                        <p className="audio-call-status">Calling...</p>
                    )}
                    {callState === 'ringing' && (
                        <p className="audio-call-status" style={{ color: '#c9a96e' }}>Incoming call...</p>
                    )}
                    {callState === 'connected' && (
                        <p className="audio-call-status">{formatDuration(callDuration)}</p>
                    )}
                    {callState === 'declined' && (
                        <p className="audio-call-status" style={{ color: '#c4636c' }}>Call declined</p>
                    )}
                    {callState === 'ended' && (
                        <p className="audio-call-status" style={{ color: '#7a7a7a' }}>Call ended</p>
                    )}

                    {/* Audio waves */}
                    {callState === 'connected' && !isMuted && (
                        <div className="audio-waves">
                            {waves.map(i => (
                                <div key={i} className="audio-wave" style={{ animationDelay: `${i * 0.15}s` }} />
                            ))}
                        </div>
                    )}
                </div>

                <div className="call-controls">
                    {/* Incoming call: Accept + Decline */}
                    {callState === 'ringing' && (
                        <>
                            <button className="call-btn accept-call" onClick={handleAccept} title="Accept">
                                <Phone size={22} />
                            </button>
                            <button className="call-btn end-call" onClick={handleEnd} title="Decline">
                                <PhoneOff size={22} />
                            </button>
                        </>
                    )}

                    {/* Connected: Mute + Speaker + End */}
                    {callState === 'connected' && (
                        <>
                            <button className={`call-btn ${isMuted ? 'active' : ''}`} onClick={toggleMute}>
                                {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
                            </button>
                            <button className={`call-btn ${!isSpeaker ? 'active' : ''}`} onClick={() => setIsSpeaker(!isSpeaker)}>
                                {isSpeaker ? <Volume2 size={22} /> : <VolumeX size={22} />}
                            </button>
                            <button className="call-btn end-call" onClick={handleEnd}>
                                <PhoneOff size={22} />
                            </button>
                        </>
                    )}

                    {/* Calling (outgoing, waiting): only End */}
                    {callState === 'calling' && (
                        <button className="call-btn end-call" onClick={handleEnd}>
                            <PhoneOff size={22} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
