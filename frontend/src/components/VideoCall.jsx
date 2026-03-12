import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, VideoIcon, VideoOff, Monitor, MonitorOff, Maximize, Minimize, Phone, PhoneOff } from 'lucide-react';
import { acceptCall, endCall, onCallEvent, getActiveCall } from '../lib/callSignaling';

export default function VideoCall({ user, onClose, isIncoming = false }) {
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOn, setIsVideoOn] = useState(true);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [callDuration, setCallDuration] = useState(0);
    const [callState, setCallState] = useState(isIncoming ? 'ringing' : 'calling');
    const localVideoRef = useRef(null);
    const localStream = useRef(null);
    const ringtoneRef = useRef(null);

    useEffect(() => {
        playRingtone();

        const cleanup = onCallEvent((event) => {
            if (event.action === 'accepted') {
                setCallState('connected');
                stopRingtone();
                startCamera();
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

        const pollInterval = setInterval(() => {
            const call = getActiveCall();
            if (!call || call.status === 'ended') {
                setCallState('ended');
                stopRingtone();
                setTimeout(() => handleEnd(), 1000);
            } else if (call.status === 'accepted' && callState !== 'connected') {
                setCallState('connected');
                stopRingtone();
                startCamera();
            } else if (call.status === 'declined' && callState !== 'declined') {
                setCallState('declined');
                stopRingtone();
                setTimeout(() => handleEnd(), 2000);
            }
        }, 500);

        return () => {
            cleanup();
            clearInterval(pollInterval);
            stopCamera();
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
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = isIncoming ? 440 : 380;
            gain.gain.value = 0.1;
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
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

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            localStream.current = stream;
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.log('Camera error:', err);
        }
    };

    const stopCamera = () => {
        localStream.current?.getTracks().forEach(t => t.stop());
    };

    const toggleMute = () => {
        if (localStream.current) {
            localStream.current.getAudioTracks().forEach(t => t.enabled = isMuted);
        }
        setIsMuted(!isMuted);
    };

    const toggleVideo = () => {
        if (localStream.current) {
            localStream.current.getVideoTracks().forEach(t => t.enabled = !isVideoOn);
        }
        setIsVideoOn(!isVideoOn);
    };

    const toggleScreenShare = async () => {
        if (!isScreenSharing) {
            try {
                const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = screenStream;
                }
                screenStream.getVideoTracks()[0].onended = () => {
                    if (localVideoRef.current && localStream.current) {
                        localVideoRef.current.srcObject = localStream.current;
                    }
                    setIsScreenSharing(false);
                };
                setIsScreenSharing(true);
            } catch (err) {
                console.log('Screen share error:', err);
            }
        } else {
            if (localVideoRef.current && localStream.current) {
                localVideoRef.current.srcObject = localStream.current;
            }
            setIsScreenSharing(false);
        }
    };

    const handleAccept = () => {
        acceptCall();
        setCallState('connected');
        stopRingtone();
        startCamera();
    };

    const handleEnd = () => {
        endCall();
        stopCamera();
        stopRingtone();
        onClose();
    };

    const formatDuration = (s) => {
        const mins = Math.floor(s / 60);
        const secs = s % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className={`call-overlay ${isFullScreen ? 'fullscreen' : ''}`}>
            <div className="call-container video-call">
                {/* Remote video area */}
                <div className="call-remote-video">
                    {callState === 'calling' && (
                        <div className="call-connecting">
                            <img src={user?.avatar} alt="" className="call-avatar-large pulse" />
                            <h3>Calling {user?.username}...</h3>
                            <div className="call-dots">
                                <span>.</span><span>.</span><span>.</span>
                            </div>
                        </div>
                    )}
                    {callState === 'ringing' && (
                        <div className="call-connecting">
                            <img src={user?.avatar} alt="" className="call-avatar-large pulse" />
                            <h3 style={{ color: '#c9a96e' }}>Incoming video call...</h3>
                            <p style={{ color: '#7a7a7a', fontSize: '0.9rem' }}>{user?.username}</p>
                        </div>
                    )}
                    {callState === 'connected' && (
                        <>
                            <img src={user?.avatar} alt="" className="call-remote-placeholder" />
                            <div className="call-remote-name">{user?.username}</div>
                        </>
                    )}
                    {callState === 'declined' && (
                        <div className="call-connecting">
                            <img src={user?.avatar} alt="" className="call-avatar-large" />
                            <h3 style={{ color: '#c4636c' }}>Call declined</h3>
                        </div>
                    )}
                    {callState === 'ended' && (
                        <div className="call-connecting">
                            <img src={user?.avatar} alt="" className="call-avatar-large" />
                            <h3 style={{ color: '#7a7a7a' }}>Call ended</h3>
                        </div>
                    )}
                </div>

                {/* Local video (PiP) — only show when connected */}
                {callState === 'connected' && (
                    <div className="call-local-video">
                        <video ref={localVideoRef} autoPlay muted playsInline />
                        {!isVideoOn && (
                            <div className="call-video-off">
                                <VideoOff size={24} />
                            </div>
                        )}
                    </div>
                )}

                {/* Duration */}
                {callState === 'connected' && (
                    <div className="call-duration">
                        {isScreenSharing && <Monitor size={14} />}
                        {formatDuration(callDuration)}
                    </div>
                )}

                {/* Controls */}
                <div className="call-controls">
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

                    {callState === 'connected' && (
                        <>
                            <button className={`call-btn ${isMuted ? 'active' : ''}`} onClick={toggleMute}>
                                {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
                            </button>
                            <button className={`call-btn ${!isVideoOn ? 'active' : ''}`} onClick={toggleVideo}>
                                {isVideoOn ? <VideoIcon size={22} /> : <VideoOff size={22} />}
                            </button>
                            <button className={`call-btn ${isScreenSharing ? 'active screen-share' : ''}`} onClick={toggleScreenShare}>
                                {isScreenSharing ? <MonitorOff size={22} /> : <Monitor size={22} />}
                            </button>
                            <button className={`call-btn ${isFullScreen ? 'active' : ''}`} onClick={() => setIsFullScreen(!isFullScreen)}>
                                {isFullScreen ? <Minimize size={22} /> : <Maximize size={22} />}
                            </button>
                            <button className="call-btn end-call" onClick={handleEnd}>
                                <PhoneOff size={22} />
                            </button>
                        </>
                    )}

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
