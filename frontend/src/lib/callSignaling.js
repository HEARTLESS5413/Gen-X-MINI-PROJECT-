// ===== CALL SIGNALING via localStorage + BroadcastChannel =====
// This enables call signaling between two browser tabs on the same device.

const CALL_KEY = 'genx_active_call';
const CALL_CHANNEL_NAME = 'genx_call_channel';

let channel = null;
try {
    channel = new BroadcastChannel(CALL_CHANNEL_NAME);
} catch (e) {
    console.log('BroadcastChannel not supported, falling back to storage events');
}

// Call states: 'ringing' | 'accepted' | 'declined' | 'ended' | 'busy'
export function getActiveCall() {
    try {
        return JSON.parse(localStorage.getItem(CALL_KEY)) || null;
    } catch { return null; }
}

export function initiateCall(fromUserId, toUserId, callType = 'audio') {
    const callData = {
        id: 'call_' + Date.now(),
        from: fromUserId,
        to: toUserId,
        type: callType,       // 'audio' or 'video'
        status: 'ringing',
        startedAt: Date.now(),
    };
    localStorage.setItem(CALL_KEY, JSON.stringify(callData));
    broadcastCallEvent({ action: 'incoming', call: callData });
    return callData;
}

export function acceptCall() {
    const call = getActiveCall();
    if (!call) return null;
    call.status = 'accepted';
    call.acceptedAt = Date.now();
    localStorage.setItem(CALL_KEY, JSON.stringify(call));
    broadcastCallEvent({ action: 'accepted', call });
    return call;
}

export function declineCall() {
    const call = getActiveCall();
    if (!call) return;
    call.status = 'declined';
    localStorage.setItem(CALL_KEY, JSON.stringify(call));
    broadcastCallEvent({ action: 'declined', call });
    // Clean up after a short delay
    setTimeout(() => {
        const current = getActiveCall();
        if (current && current.status === 'declined') {
            localStorage.removeItem(CALL_KEY);
        }
    }, 3000);
}

export function endCall() {
    const call = getActiveCall();
    if (call) {
        call.status = 'ended';
        localStorage.setItem(CALL_KEY, JSON.stringify(call));
        broadcastCallEvent({ action: 'ended', call });
    }
    setTimeout(() => {
        localStorage.removeItem(CALL_KEY);
    }, 500);
}

function broadcastCallEvent(event) {
    if (channel) {
        channel.postMessage(event);
    }
}

// Listen for call events — returns a cleanup function
export function onCallEvent(callback) {
    const handleBroadcast = (e) => callback(e.data);
    const handleStorage = (e) => {
        if (e.key === CALL_KEY) {
            const call = e.newValue ? JSON.parse(e.newValue) : null;
            if (call) {
                callback({ action: call.status === 'ringing' ? 'incoming' : call.status, call });
            } else {
                callback({ action: 'ended', call: null });
            }
        }
    };

    if (channel) {
        channel.addEventListener('message', handleBroadcast);
    }
    // Also listen to storage events for cross-tab support
    window.addEventListener('storage', handleStorage);

    return () => {
        if (channel) channel.removeEventListener('message', handleBroadcast);
        window.removeEventListener('storage', handleStorage);
    };
}
