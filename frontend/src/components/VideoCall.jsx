import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Video as VideoIcon, VideoOff, Monitor, MonitorOff, Maximize2, Minimize2, PhoneOff } from 'lucide-react';
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
    const hasEndedRef = useRef(false);

    const cleanup = useCallback(() => {
        stopRingtone();
        if (pollStopRef.current) { pollStopRef.current(); pollStopRef.current = null; }
        if (rtcRef.current) { rtcRef.current.destroy(); rtcRef.current = null; }
    }, []);

    const handleEnd = useCallback(() => {
        if (hasEndedRef.current) return;
        hasEndedRef.current = true;
        endCall(callIdRef.current);
        cleanup();
        onClose();
    }, [cleanup, onClose]);

    const resetControlsTimer = () => {
        setShowControls(true);
        if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
        controlsTimerRef.current = setTimeout(() => setShowControls(false), 5000);
    };

    useEffect(() => {
        callIdRef.current = callId;
        if (!callId) return;
        hasEndedRef.current = false;

        playRingtone();

        const rtc = new WebRTCConnection({
            onRemoteStream: (stream) => {
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = stream;
                    remoteVideoRef.current.play().catch(() => {});
                }
            },
            onIceCandidate: (candidate) => {
                sendIceCandidate(callId, candidate, isIncoming ? 'callee' : 'caller');
            },
            onConnectionStateChange: (state) => {
                if (state === 'connected') { setCallState('connected'); stopRingtone(); resetControlsTimer(); }
                else if (state === 'disconnected' || state === 'failed') { handleEnd(); }
            },
        });
        rtcRef.current = rtc;

        (async () => {
            try {
                const stream = await rtc.getLocalStream('video');
                if (localVideoRef.current) localVideoRef.current.srcObject = stream;

                if (isIncoming) {
                    await acceptCall(callId);
                    setCallState('connecting');
                    stopRingtone();
                } else {
                    const offer = await rtc.createOffer();
                    await sendOffer(callId, offer);
                }
            } catch (err) { console.error('Video call setup error:', err); }
        })();

        const stopPoll = pollCallUpdates(callId, async (call) => {
            if (!call || hasEndedRef.current) return;
            if (call.status === 'ended' || call.status === 'declined') { handleEnd(); return; }

            if (!isIncoming && call.sdp_answer && rtc.pc.signalingState !== 'stable') {
                try { await rtc.setRemoteAnswer(JSON.parse(call.sdp_answer)); } catch (e) {}
            }
            if (isIncoming && call.sdp_offer && !rtc.pc.remoteDescription) {
                try {
                    const answer = await rtc.createAnswer(JSON.parse(call.sdp_offer));
                    await sendAnswer(callId, answer);
                } catch (e) {}
            }

            const candidates = call.ice_candidates || [];
            const mySide = isIncoming ? 'caller' : 'callee';
            const relevant = candidates.filter(c => c.side === mySide);
            for (let i = processedCandidatesRef.current; i < relevant.length; i++) {
                await rtc.addIceCandidate(relevant[i]);
            }
            processedCandidatesRef.current = relevant.length;
        }, 800);
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
            const pi = setInterval(() => { gain.gain.value = gain.gain.value > 0 ? 0 : 0.08; }, 600);
            ringtoneRef.current = { ctx, osc, gain, pulseInterval: pi };
        } catch (e) {}
    };

    const stopRingtone = () => {
        if (!ringtoneRef.current) return;
        clearInterval(ringtoneRef.current.pulseInterval);
        try { ringtoneRef.current.osc.stop(); ringtoneRef.current.ctx.close(); } catch (e) {}
        ringtoneRef.current = null;
    };

    const toggleMute = () => { if (rtcRef.current) setIsMuted(rtcRef.current.toggleMute()); resetControlsTimer(); };
    const toggleVideo = () => { if (rtcRef.current) setIsVideoOn(rtcRef.current.toggleCamera()); resetControlsTimer(); };

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

    const handleDragStart = (e) => {
        if (!floatingRef.current) return;
        const el = floatingRef.current;
        const rect = el.getBoundingClientRect();
        const ox = (e.clientX || e.touches?.[0]?.clientX || 0) - rect.left;
        const oy = (e.clientY || e.touches?.[0]?.clientY || 0) - rect.top;
        const move = (ev) => {
            const x = (ev.clientX || ev.touches?.[0]?.clientX || 0) - ox;
            const y = (ev.clientY || ev.touches?.[0]?.clientY || 0) - oy;
            el.style.left = `${Math.max(0, Math.min(window.innerWidth - rect.width, x))}px`;
            el.style.top = `${Math.max(0, Math.min(window.innerHeight - rect.height, y))}px`;
            el.style.right = 'auto'; el.style.bottom = 'auto';
        };
        const up = () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); document.removeEventListener('touchmove', move); document.removeEventListener('touchend', up); };
        document.addEventListener('mousemove', move); document.addEventListener('mouseup', up);
        document.addEventListener('touchmove', move); document.addEventListener('touchend', up);
    };

    const formatDuration = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

    // Floating mini mode
    if (isFloating && callState === 'connected') {
        return (
            <div className="video-call-floating" ref={floatingRef} onMouseDown={handleDragStart} onTouchStart={handleDragStart}>
                <video ref={remoteVideoRef} autoPlay playsInline className="floating-remote-video" />
                <div className="floating-info">
                    <span className="floating-name">{user?.username}</span>
                    <span className="floating-duration">{formatDuration(callDuration)}</span>
                </div>
                <div className="floating-controls">
                    <button className="floating-btn" onClick={(e) => { e.stopPropagation(); toggleMute(); }}>
                        {isMuted ? <MicOff size={12} /> : <Mic size={12} />}
                    </button>
                    <button className="floating-btn" onClick={(e) => { e.stopPropagation(); setIsFloating(false); }}>
                        <Maximize2 size={12} />
                    </button>
                    <button className="floating-btn end" onClick={(e) => { e.stopPropagation(); handleEnd(); }}>
                        <PhoneOff size={12} />
                    </button>
                </div>
                <video ref={localVideoRef} autoPlay muted playsInline style={{ display: 'none' }} />
            </div>
        );
    }

    return (
        <div className="call-overlay" onClick={resetControlsTimer}>
            <div className="call-container video-call">
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

                {callState === 'connected' && (
                    <div className="video-local-pip">
                        <video ref={localVideoRef} autoPlay muted playsInline />
                        {!isVideoOn && <div className="video-off-overlay"><VideoOff size={20} /></div>}
                    </div>
                )}

                {callState === 'connected' && (
                    <div className="video-duration-badge">
                        {isScreenSharing && <Monitor size={12} />}
                        <span>{formatDuration(callDuration)}</span>
                    </div>
                )}

                {callState === 'connected' && <div className="video-user-overlay"><span>{user?.username}</span></div>}

                <div className={`video-controls-bar ${showControls ? 'visible' : 'hidden'}`}>
                    <button className={`call-ctrl-btn ${isMuted ? 'active' : ''}`} onClick={toggleMute}>
                        <div className="call-ctrl-icon">{isMuted ? <MicOff size={20} /> : <Mic size={20} />}</div>
                        <span className="call-ctrl-label">Mute</span>
                    </button>
                    <button className={`call-ctrl-btn ${!isVideoOn ? 'active' : ''}`} onClick={toggleVideo}>
                        <div className="call-ctrl-icon">{isVideoOn ? <VideoIcon size={20} /> : <VideoOff size={20} />}</div>
                        <span className="call-ctrl-label">Camera</span>
                    </button>
                    <button className={`call-ctrl-btn ${isScreenSharing ? 'active' : ''}`} onClick={toggleScreenShare}>
                        <div className="call-ctrl-icon">{isScreenSharing ? <MonitorOff size={20} /> : <Monitor size={20} />}</div>
                        <span className="call-ctrl-label">Share</span>
                    </button>
                    <button className="call-ctrl-btn" onClick={() => setIsFloating(true)}>
                        <div className="call-ctrl-icon"><Minimize2 size={20} /></div>
                        <span className="call-ctrl-label">Float</span>
                    </button>
                    <button className="call-ctrl-btn end" onClick={handleEnd}>
                        <div className="call-ctrl-icon end"><PhoneOff size={22} /></div>
                        <span className="call-ctrl-label">End</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
