import React, { useState, useEffect } from 'react';
import { Phone, PhoneOff, Video } from 'lucide-react';
import { onCallEvent, getActiveCall, acceptCall, declineCall } from '../lib/callSignaling';
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

        const cleanup = onCallEvent((event) => {
            if (event.action === 'incoming' && event.call && event.call.to === currentUser.id) {
                const caller = usersStore.getById(event.call.from);
                setCallerUser(caller);
                setIncomingCall(event.call);
            } else if (event.action === 'ended' || event.action === 'declined') {
                setIncomingCall(null);
                setShowCallUI(false);
            }
        });

        // Also poll for incoming calls (cross-tab fallback)
        const pollInterval = setInterval(() => {
            const call = getActiveCall();
            if (call && call.to === currentUser.id && call.status === 'ringing' && !incomingCall) {
                const caller = usersStore.getById(call.from);
                setCallerUser(caller);
                setIncomingCall(call);
            }
            // Clean up if call was ended/declined
            if (incomingCall && (!call || call.status === 'ended' || call.status === 'declined')) {
                if (!showCallUI) {
                    setIncomingCall(null);
                }
            }
        }, 500);

        return () => {
            cleanup();
            clearInterval(pollInterval);
        };
    }, [currentUser, incomingCall, showCallUI]);

    const handleAccept = () => {
        setShowCallUI(true);
    };

    const handleDecline = () => {
        declineCall();
        setIncomingCall(null);
    };

    const handleCallClose = () => {
        setShowCallUI(false);
        setIncomingCall(null);
    };

    // Show the full call UI after accepting
    if (showCallUI && incomingCall && callerUser) {
        if (incomingCall.type === 'video') {
            return <VideoCall user={callerUser} onClose={handleCallClose} isIncoming={true} />;
        }
        return <AudioCall user={callerUser} onClose={handleCallClose} isIncoming={true} />;
    }

    // Show incoming call notification banner
    if (!incomingCall || !callerUser) return null;

    return (
        <div className="incoming-call-banner">
            <div className="incoming-call-info">
                <img src={callerUser.avatar} alt="" className="avatar avatar-md" />
                <div>
                    <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>{callerUser.username}</div>
                    <div style={{ fontSize: '0.8rem', color: '#c9a96e' }}>
                        {incomingCall.type === 'video' ? '📹 Incoming video call...' : '📞 Incoming audio call...'}
                    </div>
                </div>
            </div>
            <div className="incoming-call-actions">
                <button className="call-btn accept-call" onClick={handleAccept} title="Accept">
                    {incomingCall.type === 'video' ? <Video size={18} /> : <Phone size={18} />}
                </button>
                <button className="call-btn end-call" onClick={handleDecline} title="Decline">
                    <PhoneOff size={18} />
                </button>
            </div>
        </div>
    );
}
