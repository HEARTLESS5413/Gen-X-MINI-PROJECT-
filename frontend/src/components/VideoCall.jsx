import React, { useState, useRef, useEffect } from 'react';
import { X, Mic, MicOff, VideoIcon, VideoOff, Monitor, MonitorOff, Maximize, Minimize, Phone } from 'lucide-react';

export default function VideoCall({ user, onClose }) {
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOn, setIsVideoOn] = useState(true);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [callDuration, setCallDuration] = useState(0);
    const [connecting, setConnecting] = useState(true);
    const localVideoRef = useRef(null);
    const localStream = useRef(null);

    useEffect(() => {
        // Start local camera
        startCamera();

        // Simulate connection
        const connectTimer = setTimeout(() => setConnecting(false), 2000);

        return () => {
            clearTimeout(connectTimer);
            stopCamera();
        };
    }, []);

    useEffect(() => {
        if (connecting) return;
        const timer = setInterval(() => setCallDuration(d => d + 1), 1000);
        return () => clearInterval(timer);
    }, [connecting]);

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

    const formatDuration = (s) => {
        const mins = Math.floor(s / 60);
        const secs = s % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className={`call-overlay ${isFullScreen ? 'fullscreen' : ''}`}>
            <div className="call-container video-call">
                {/* Remote video (simulated with user avatar) */}
                <div className="call-remote-video">
                    {connecting ? (
                        <div className="call-connecting">
                            <img src={user?.avatar} alt="" className="call-avatar-large pulse" />
                            <h3>Calling {user?.username}...</h3>
                            <div className="call-dots">
                                <span>.</span><span>.</span><span>.</span>
                            </div>
                        </div>
                    ) : (
                        <>
                            <img src={user?.avatar} alt="" className="call-remote-placeholder" />
                            <div className="call-remote-name">{user?.username}</div>
                        </>
                    )}
                </div>

                {/* Local video (PiP) */}
                <div className="call-local-video">
                    <video ref={localVideoRef} autoPlay muted playsInline />
                    {!isVideoOn && (
                        <div className="call-video-off">
                            <VideoOff size={24} />
                        </div>
                    )}
                </div>

                {/* Duration */}
                {!connecting && (
                    <div className="call-duration">
                        {isScreenSharing && <Monitor size={14} />}
                        {formatDuration(callDuration)}
                    </div>
                )}

                {/* Controls */}
                <div className="call-controls">
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
                    <button className="call-btn end-call" onClick={onClose}>
                        <Phone size={22} />
                    </button>
                </div>
            </div>
        </div>
    );
}
