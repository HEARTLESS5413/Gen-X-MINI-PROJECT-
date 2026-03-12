import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Volume2, VolumeX, PhoneOff, Minimize2, Maximize2 } from 'lucide-react';
import { endCall, sendOffer, sendAnswer, sendIceCandidate, pollCallUpdates, acceptCall } from '../lib/callSignaling';
import { WebRTCConnection } from '../lib/webrtc';

export default function AudioCall({ user, callId, onClose, isIncoming = false }) {
    const [isMuted, setIsMuted] = useState(false);
    const [isSpeaker, setIsSpeaker] = useState(true);
    const [callDuration, setCallDuration] = useState(0);
    const [callState, setCallState] = useState(isIncoming ? 'connecting' : 'calling');
    const [isFloating, setIsFloating] = useState(false);
    const rtcRef = useRef(null);
    const remoteAudioRef = useRef(null);
    const ringtoneRef = useRef(null);
    const pollStopRef = useRef(null);
    const processedCandidatesRef = useRef(0);
    const callIdRef = useRef(callId);
    const floatingRef = useRef(null);
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

    useEffect(() => {
        callIdRef.current = callId;
        if (!callId) return;
        hasEndedRef.current = false;

        playRingtone();

        const rtc = new WebRTCConnection({
            onRemoteStream: (stream) => {
                if (remoteAudioRef.current) {
                    remoteAudioRef.current.srcObject = stream;
                    remoteAudioRef.current.play().catch(() => {});
                }
            },
            onIceCandidate: (candidate) => {
                sendIceCandidate(callId, candidate, isIncoming ? 'callee' : 'caller');
            },
            onConnectionStateChange: (state) => {
                if (state === 'connected') { setCallState('connected'); stopRingtone(); }
                else if (state === 'disconnected' || state === 'failed') { handleEnd(); }
            },
        });
        rtcRef.current = rtc;

        (async () => {
            try {
                await rtc.getLocalStream('audio');
                if (isIncoming) {
                    await acceptCall(callId);
                    setCallState('connecting');
                    stopRingtone();
                } else {
                    const offer = await rtc.createOffer();
                    await sendOffer(callId, offer);
                }
            } catch (err) { console.error('Call setup error:', err); }
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

    const toggleMute = () => { if (rtcRef.current) setIsMuted(rtcRef.current.toggleMute()); };
    const toggleSpeaker = () => {
        if (remoteAudioRef.current) remoteAudioRef.current.volume = isSpeaker ? 0.3 : 1.0;
        setIsSpeaker(!isSpeaker);
    };

    const formatDuration = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

    // Draggable floating
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

    // Floating mini mode
    if (isFloating) {
        return (
            <div className="audio-call-floating" ref={floatingRef} onMouseDown={handleDragStart} onTouchStart={handleDragStart}>
                <audio ref={remoteAudioRef} autoPlay playsInline />
                <div className="floating-audio-bg" />
                <img src={user?.avatar} alt="" className="floating-audio-avatar" />
                <div className="floating-audio-info">
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
            </div>
        );
    }

    const waves = Array.from({ length: 7 }, (_, i) => i);

    return (
        <div className="call-overlay">
            <audio ref={remoteAudioRef} autoPlay playsInline />
            <div className="call-container audio-call">
                <div className="call-bg-gradient" />
                <div className="call-content">
                    <div className={`call-avatar-wrapper ${callState}`}>
                        <div className="call-avatar-ring" />
                        <div className="call-avatar-ring delay" />
                        <img src={user?.avatar} alt="" className="call-avatar-img" />
                    </div>
                    <h2 className="call-user-name">{user?.name || user?.username}</h2>
                    <p className="call-username">@{user?.username}</p>
                    <div className="call-status">
                        {callState === 'calling' && <span className="status-text calling">Calling<span className="dot-animation">...</span></span>}
                        {callState === 'connecting' && <span className="status-text connecting">Connecting<span className="dot-animation">...</span></span>}
                        {callState === 'connected' && <span className="status-text connected">{formatDuration(callDuration)}</span>}
                    </div>
                    {callState === 'connected' && !isMuted && (
                        <div className="call-audio-waves">
                            {waves.map(i => <div key={i} className="call-wave" style={{ animationDelay: `${i * 0.12}s` }} />)}
                        </div>
                    )}
                </div>

                <div className="call-controls-bar">
                    <button className={`call-ctrl-btn ${isMuted ? 'active' : ''}`} onClick={toggleMute}>
                        <div className="call-ctrl-icon">{isMuted ? <MicOff size={22} /> : <Mic size={22} />}</div>
                        <span className="call-ctrl-label">{isMuted ? 'Unmute' : 'Mute'}</span>
                    </button>
                    <button className={`call-ctrl-btn ${!isSpeaker ? 'active' : ''}`} onClick={toggleSpeaker}>
                        <div className="call-ctrl-icon">{isSpeaker ? <Volume2 size={22} /> : <VolumeX size={22} />}</div>
                        <span className="call-ctrl-label">{isSpeaker ? 'Speaker' : 'Earpiece'}</span>
                    </button>
                    <button className="call-ctrl-btn" onClick={() => setIsFloating(true)}>
                        <div className="call-ctrl-icon"><Minimize2 size={22} /></div>
                        <span className="call-ctrl-label">Float</span>
                    </button>
                    <button className="call-ctrl-btn end" onClick={handleEnd}>
                        <div className="call-ctrl-icon end"><PhoneOff size={24} /></div>
                        <span className="call-ctrl-label">End</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
