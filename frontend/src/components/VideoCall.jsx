import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Video as VideoIcon, VideoOff, Monitor, MonitorOff, Maximize2, Minimize2, PhoneOff, Move } from 'lucide-react';
import { endCall, sendOffer, sendAnswer, sendIceCandidate, pollCallUpdates, acceptCall } from '../lib/callSignaling';
import { WebRTCConnection } from '../lib/webrtc';

export default function VideoCall({ user, callId, onClose, isIncoming = false }) {
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOn, setIsVideoOn] = useState(true);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [isFloating, setIsFloating] = useState(false);
    const [callDuration, setCallDuration] = useState(0);
    const [callState, setCallState] = useState(isIncoming ? 'connecting' : 'calling');
    const [showControls, setShowControls] = useState(true);

    const rtcRef = useRef(null);
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const ringtoneRef = useRef(null);
    const pollStopRef = useRef(null);
    const processedCandidatesRef = useRef(0);
    const callIdRef = useRef(callId);
    const floatingRef = useRef(null);
    const controlsTimerRef = useRef(null);

    const cleanup = useCallback(() => {
        stopRingtone();
        if (pollStopRef.current) pollStopRef.current();
        if (rtcRef.current) rtcRef.current.destroy();
    }, []);

    const handleEnd = useCallback(() => {
        endCall(callIdRef.current);
        cleanup();
        onClose();
    }, [cleanup, onClose]);

    // Auto-hide controls
    const resetControlsTimer = () => {
        setShowControls(true);
        if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
        controlsTimerRef.current = setTimeout(() => setShowControls(false), 4000);
    };

    useEffect(() => {
        callIdRef.current = callId;
        if (!callId) return;

        playRingtone();

        const rtc = new WebRTCConnection({
            onRemoteStream: (stream) => {
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = stream;
                    remoteVideoRef.current.play().catch(() => { });
                }
            },
            onIceCandidate: (candidate) => {
                sendIceCandidate(callId, candidate, isIncoming ? 'callee' : 'caller');
            },
            onConnectionStateChange: (state) => {
                if (state === 'connected') {
                    setCallState('connected');
                    stopRingtone();
                    resetControlsTimer();
                } else if (state === 'disconnected' || state === 'failed') {
                    handleEnd();
                }
            },
        });
        rtcRef.current = rtc;

        async function startCall() {
            try {
                const stream = await rtc.getLocalStream('video');
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }

                if (isIncoming) {
                    await acceptCall(callId);
                    setCallState('connecting');
                    stopRingtone();
                } else {
                    const offer = await rtc.createOffer();
                    await sendOffer(callId, offer);
                }
            } catch (err) {
                console.error('Video call setup error:', err);
            }
        }
        startCall();

        // Poll for SDP/ICE exchange
        const stopPoll = pollCallUpdates(callId, async (call) => {
            if (!call) return;
            if (call.status === 'ended' || call.status === 'declined') {
                cleanup(); onClose(); return;
            }

            if (!isIncoming && call.sdp_answer && rtc.pc.remoteDescription === null) {
                try { await rtc.setRemoteAnswer(JSON.parse(call.sdp_answer)); } catch (e) { }
            }

            if (isIncoming && call.sdp_offer && rtc.pc.remoteDescription === null) {
                try {
                    const answer = await rtc.createAnswer(JSON.parse(call.sdp_offer));
                    await sendAnswer(callId, answer);
                } catch (e) { }
            }

            const candidates = call.ice_candidates || [];
            const mySide = isIncoming ? 'caller' : 'callee';
            const newCandidates = candidates.filter(c => c.side === mySide);
            for (let i = processedCandidatesRef.current; i < newCandidates.length; i++) {
                await rtc.addIceCandidate(newCandidates[i]);
            }
            processedCandidatesRef.current = newCandidates.length;
        }, 1000);
        pollStopRef.current = stopPoll;

        return () => { cleanup(); };
    }, [callId]);

    useEffect(() => {
        if (callState !== 'connected') return;
        const timer = setInterval(() => setCallDuration(d => d + 1), 1000);
        return () => clearInterval(timer);
    }, [callState]);

    const playRingtone = () => {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator(); const gain = ctx.createGain();
            osc.type = 'sine'; osc.frequency.value = isIncoming ? 440 : 380; gain.gain.value = 0.08;
            osc.connect(gain); gain.connect(ctx.destination); osc.start();
            const pulseInterval = setInterval(() => { gain.gain.value = gain.gain.value > 0 ? 0 : 0.08; }, 600);
            ringtoneRef.current = { ctx, osc, gain, pulseInterval };
        } catch (e) { }
    };

    const stopRingtone = () => {
        if (!ringtoneRef.current) return;
        clearInterval(ringtoneRef.current.pulseInterval);
        try { ringtoneRef.current.osc.stop(); ringtoneRef.current.ctx.close(); } catch (e) { }
        ringtoneRef.current = null;
    };

    const toggleMute = () => {
        if (rtcRef.current) setIsMuted(rtcRef.current.toggleMute());
        resetControlsTimer();
    };

    const toggleVideo = () => {
        if (rtcRef.current) setIsVideoOn(rtcRef.current.toggleCamera());
        resetControlsTimer();
    };

    const toggleScreenShare = async () => {
        if (!rtcRef.current) return;
        if (!isScreenSharing) {
            const screen = await rtcRef.current.startScreenShare();
            if (screen && localVideoRef.current) localVideoRef.current.srcObject = screen;
            setIsScreenSharing(!!screen);
        } else {
            await rtcRef.current.stopScreenShare();
            if (localVideoRef.current && rtcRef.current.localStream) localVideoRef.current.srcObject = rtcRef.current.localStream;
            setIsScreenSharing(false);
        }
        resetControlsTimer();
    };

    // Draggable floating PiP
    const handleDragStart = (e) => {
        if (!floatingRef.current) return;
        const el = floatingRef.current;
        const rect = el.getBoundingClientRect();
        const offsetX = (e.clientX || e.touches[0].clientX) - rect.left;
        const offsetY = (e.clientY || e.touches[0].clientY) - rect.top;

        const handleMove = (ev) => {
            const x = (ev.clientX || ev.touches[0].clientX) - offsetX;
            const y = (ev.clientY || ev.touches[0].clientY) - offsetY;
            el.style.left = `${Math.max(0, Math.min(window.innerWidth - rect.width, x))}px`;
            el.style.top = `${Math.max(0, Math.min(window.innerHeight - rect.height, y))}px`;
            el.style.right = 'auto'; el.style.bottom = 'auto';
        };
        const handleUp = () => {
            document.removeEventListener('mousemove', handleMove);
            document.removeEventListener('mouseup', handleUp);
            document.removeEventListener('touchmove', handleMove);
            document.removeEventListener('touchend', handleUp);
        };
        document.addEventListener('mousemove', handleMove);
        document.addEventListener('mouseup', handleUp);
        document.addEventListener('touchmove', handleMove);
        document.addEventListener('touchend', handleUp);
    };

    const formatDuration = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

    // Floating mini mode
    if (isFloating && callState === 'connected') {
        return (
            <div className="video-call-floating" ref={floatingRef}
                onMouseDown={handleDragStart} onTouchStart={handleDragStart}>
                <video ref={remoteVideoRef} autoPlay playsInline className="floating-remote-video" />
                <div className="floating-info">
                    <span className="floating-name">{user?.username}</span>
                    <span className="floating-duration">{formatDuration(callDuration)}</span>
                </div>
                <div className="floating-controls">
                    <button className="floating-btn" onClick={() => setIsFloating(false)}><Maximize2 size={14} /></button>
                    <button className="floating-btn end" onClick={handleEnd}><PhoneOff size={14} /></button>
                </div>
                {/* Hidden local video to keep stream alive */}
                <video ref={localVideoRef} autoPlay muted playsInline style={{ display: 'none' }} />
            </div>
        );
    }

    return (
        <div className="call-overlay" onClick={resetControlsTimer}>
            <div className="call-container video-call">
                {/* Remote video / connecting state */}
                <div className="video-remote-area">
                    {callState === 'connected' ? (
                        <video ref={remoteVideoRef} autoPlay playsInline className="video-remote-stream" />
                    ) : (
                        <div className="video-connecting-state">
                            <div className={`call-avatar-wrapper ${callState}`}>
                                <div className="call-avatar-ring" />
                                <div className="call-avatar-ring delay" />
                                <img src={user?.avatar} alt="" className="call-avatar-img" />
                            </div>
                            <h3>{user?.name || user?.username}</h3>
                            {callState === 'calling' && <p className="status-text calling">Calling<span className="dot-animation">...</span></p>}
                            {callState === 'connecting' && <p className="status-text connecting">Connecting<span className="dot-animation">...</span></p>}
                        </div>
                    )}
                </div>

                {/* Local video PiP */}
                {callState === 'connected' && (
                    <div className="video-local-pip">
                        <video ref={localVideoRef} autoPlay muted playsInline />
                        {!isVideoOn && (
                            <div className="video-off-overlay">
                                <VideoOff size={20} />
                            </div>
                        )}
                    </div>
                )}

                {/* Duration badge */}
                {callState === 'connected' && (
                    <div className="video-duration-badge">
                        {isScreenSharing && <Monitor size={12} />}
                        <span>{formatDuration(callDuration)}</span>
                    </div>
                )}

                {/* User info overlay */}
                {callState === 'connected' && (
                    <div className="video-user-overlay">
                        <span>{user?.username}</span>
                    </div>
                )}

                {/* Controls */}
                <div className={`video-controls-bar ${showControls ? 'visible' : 'hidden'}`}>
                    <button className={`call-control-btn ${isMuted ? 'active' : ''}`} onClick={toggleMute}>
                        {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                        <span className="call-control-label">Mute</span>
                    </button>

                    <button className={`call-control-btn ${!isVideoOn ? 'active' : ''}`} onClick={toggleVideo}>
                        {isVideoOn ? <VideoIcon size={20} /> : <VideoOff size={20} />}
                        <span className="call-control-label">Camera</span>
                    </button>

                    <button className={`call-control-btn ${isScreenSharing ? 'active' : ''}`} onClick={toggleScreenShare}>
                        {isScreenSharing ? <MonitorOff size={20} /> : <Monitor size={20} />}
                        <span className="call-control-label">Share</span>
                    </button>

                    <button className="call-control-btn" onClick={() => setIsFloating(true)}>
                        <Minimize2 size={20} />
                        <span className="call-control-label">Float</span>
                    </button>

                    <button className="call-control-btn end-call" onClick={handleEnd}>
                        <PhoneOff size={22} />
                        <span className="call-control-label">End</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
