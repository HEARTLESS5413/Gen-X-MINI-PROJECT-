import React, { useState, useEffect } from 'react';
import { Phone, PhoneOff, Video } from 'lucide-react';
import { subscribeToCallSignals, declineCall } from '../lib/callSignaling';
import { users as usersStore } from '../lib/store';
import { useAuth } from '../context/AuthContext';
import AudioCall from './AudioCall';
import VideoCall from './VideoCall';

export default function IncomingCall() {
    const { user: currentUser } = useAuth();
    const [incomingCall, setIncomingCall] = useState(null);
    const [showCallUI, setShowCallUI] = useState(false);
    const [callerUser, setCallerUser] = useState(null);

    useEffect(() => {
        if (!currentUser) return;

        // Subscribe to call signals via Supabase Realtime
        const sub = subscribeToCallSignals(currentUser.id, async (event) => {
            if (event.action === 'incoming' && event.call) {
                const caller = await usersStore.getById(event.call.from_id);
                setCallerUser(caller);
                setIncomingCall(event.call);
            } else if (event.action === 'ended' || event.action === 'declined') {
                if (!showCallUI) {
                    setIncomingCall(null);
                    setCallerUser(null);
                }
            }
        });

        return () => sub.unsubscribe();
    }, [currentUser, showCallUI]);

    const handleAccept = () => {
        setShowCallUI(true);
    };

    const handleDecline = () => {
        if (incomingCall) declineCall(incomingCall.id);
        setIncomingCall(null);
        setCallerUser(null);
    };

    const handleCallClose = () => {
        setShowCallUI(false);
        setIncomingCall(null);
        setCallerUser(null);
    };

    // Show full call UI after accepting
    if (showCallUI && incomingCall && callerUser) {
        if (incomingCall.call_type === 'video') {
            return <VideoCall user={callerUser} callId={incomingCall.id} onClose={handleCallClose} isIncoming={true} />;
        }
        return <AudioCall user={callerUser} callId={incomingCall.id} onClose={handleCallClose} isIncoming={true} />;
    }

    // Show incoming call notification banner
    if (!incomingCall || !callerUser) return null;

    return (
        <div className="incoming-call-overlay">
            <div className="incoming-call-card">
                {/* Animated background */}
                <div className="incoming-call-bg" />

                {/* Pulsating avatar */}
                <div className="incoming-avatar-wrapper">
                    <div className="incoming-avatar-pulse" />
                    <div className="incoming-avatar-pulse delay" />
                    <img src={callerUser.avatar} alt="" className="incoming-avatar" />
                </div>

                {/* Call info */}
                <div className="incoming-call-text">
                    <h3 className="incoming-caller-name">{callerUser.name || callerUser.username}</h3>
                    <p className="incoming-call-type">
                        {incomingCall.call_type === 'video' ? '📹 Incoming Video Call' : '📞 Incoming Audio Call'}
                    </p>
                </div>

                {/* Action buttons */}
                <div className="incoming-call-buttons">
                    <button className="incoming-btn decline" onClick={handleDecline}>
                        <PhoneOff size={20} />
                        <span>Decline</span>
                    </button>
                    <button className="incoming-btn accept" onClick={handleAccept}>
                        {incomingCall.call_type === 'video' ? <Video size={20} /> : <Phone size={20} />}
                        <span>Join Now</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
