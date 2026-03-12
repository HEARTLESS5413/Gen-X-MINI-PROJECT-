import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Volume2, VolumeX, PhoneOff } from 'lucide-react';
import { endCall, sendOffer, sendAnswer, sendIceCandidate, pollCallUpdates, acceptCall } from '../lib/callSignaling';
import { WebRTCConnection } from '../lib/webrtc';

export default function AudioCall({ user, callId, onClose, isIncoming = false }) {
    const [isMuted, setIsMuted] = useState(false);
    const [isSpeaker, setIsSpeaker] = useState(true);
    const [callDuration, setCallDuration] = useState(0);
    const [callState, setCallState] = useState(isIncoming ? 'connecting' : 'calling');
    const rtcRef = useRef(null);
    const remoteAudioRef = useRef(null);
    const ringtoneRef = useRef(null);
    const pollStopRef = useRef(null);
    const processedCandidatesRef = useRef(0);
    const callIdRef = useRef(callId);

    // Cleanup function
    const cleanup = useCallback(() => {
        stopRingtone();
        if (pollStopRef.current) pollStopRef.current();
        if (rtcRef.current) rtcRef.current.destroy();
    }, []);

    // End the call
    const handleEnd = useCallback(() => {
        endCall(callIdRef.current);
        cleanup();
        onClose();
    }, [cleanup, onClose]);

    useEffect(() => {
        callIdRef.current = callId;
        if (!callId) return;

        playRingtone();

        const rtc = new WebRTCConnection({
            onRemoteStream: (stream) => {
                if (remoteAudioRef.current) {
                    remoteAudioRef.current.srcObject = stream;
                    remoteAudioRef.current.play().catch(() => { });
                }
            },
            onIceCandidate: (candidate) => {
                sendIceCandidate(callId, candidate, isIncoming ? 'callee' : 'caller');
            },
            onConnectionStateChange: (state) => {
                if (state === 'connected') {
                    setCallState('connected');
                    stopRingtone();
                } else if (state === 'disconnected' || state === 'failed') {
                    handleEnd();
                }
            },
        });
        rtcRef.current = rtc;

        async function startCall() {
            try {
                await rtc.getLocalStream('audio');

                if (isIncoming) {
                    // Receiver: accept, wait for offer, then answer
                    await acceptCall(callId);
                    setCallState('connecting');
                    stopRingtone();
                } else {
                    // Caller: create & send offer
                    const offer = await rtc.createOffer();
                    await sendOffer(callId, offer);
                }
            } catch (err) {
                console.error('Call setup error:', err);
            }
        }
        startCall();

        // Poll for SDP/ICE exchange and status
        const stopPoll = pollCallUpdates(callId, async (call) => {
            if (!call) return;
            if (call.status === 'ended' || call.status === 'declined') {
                cleanup();
                onClose();
                return;
            }

            // Caller: wait for answer
            if (!isIncoming && call.sdp_answer && rtc.pc.remoteDescription === null) {
                try {
                    await rtc.setRemoteAnswer(JSON.parse(call.sdp_answer));
                } catch (e) { console.error('Set answer error:', e); }
            }

            // Receiver: wait for offer, then create answer
            if (isIncoming && call.sdp_offer && rtc.pc.remoteDescription === null) {
                try {
                    const answer = await rtc.createAnswer(JSON.parse(call.sdp_offer));
                    await sendAnswer(callId, answer);
                } catch (e) { console.error('Create answer error:', e); }
            }

            // Process new ICE candidates
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

    // Duration timer
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
            gain.gain.value = 0.08;
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
        if (rtcRef.current) {
            const muted = rtcRef.current.toggleMute();
            setIsMuted(muted);
        }
    };

    const toggleSpeaker = () => {
        // Toggle between speaker and earpiece (via audio element volume)
        if (remoteAudioRef.current) {
            remoteAudioRef.current.volume = isSpeaker ? 0.3 : 1.0;
        }
        setIsSpeaker(!isSpeaker);
    };

    const formatDuration = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
    const waves = Array.from({ length: 7 }, (_, i) => i);

    return (
        <div className="call-overlay">
            <audio ref={remoteAudioRef} autoPlay playsInline />
            <div className="call-container audio-call">
                {/* Animated gradient background */}
                <div className="call-bg-gradient" />

                <div className="call-content">
                    {/* Avatar with status ring */}
                    <div className={`call-avatar-wrapper ${callState}`}>
                        <div className="call-avatar-ring" />
                        <div className="call-avatar-ring delay" />
                        <img src={user?.avatar} alt="" className="call-avatar-img" />
                    </div>

                    <h2 className="call-user-name">{user?.name || user?.username}</h2>
                    <p className="call-username">@{user?.username}</p>

                    {/* Status text */}
                    <div className="call-status">
                        {callState === 'calling' && <span className="status-text calling">Calling<span className="dot-animation">...</span></span>}
                        {callState === 'connecting' && <span className="status-text connecting">Connecting<span className="dot-animation">...</span></span>}
                        {callState === 'connected' && <span className="status-text connected">{formatDuration(callDuration)}</span>}
                    </div>

                    {/* Audio visualization waves */}
                    {callState === 'connected' && !isMuted && (
                        <div className="call-audio-waves">
                            {waves.map(i => <div key={i} className="call-wave" style={{ animationDelay: `${i * 0.12}s` }} />)}
                        </div>
                    )}
                </div>

                {/* Controls */}
                <div className="call-controls-bar">
                    <button className={`call-control-btn ${isMuted ? 'active' : ''}`} onClick={toggleMute} title={isMuted ? 'Unmute' : 'Mute'}>
                        {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
                        <span className="call-control-label">{isMuted ? 'Unmute' : 'Mute'}</span>
                    </button>

                    <button className={`call-control-btn ${!isSpeaker ? 'active' : ''}`} onClick={toggleSpeaker} title={isSpeaker ? 'Earpiece' : 'Speaker'}>
                        {isSpeaker ? <Volume2 size={22} /> : <VolumeX size={22} />}
                        <span className="call-control-label">{isSpeaker ? 'Speaker' : 'Earpiece'}</span>
                    </button>

                    <button className="call-control-btn end-call" onClick={handleEnd} title="End Call">
                        <PhoneOff size={24} />
                        <span className="call-control-label">End</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
