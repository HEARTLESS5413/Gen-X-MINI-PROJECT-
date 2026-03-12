// ===== CALL SIGNALING via Supabase Realtime =====
// Cross-device call signaling using Supabase call_signals table

import { supabase } from './store';

let callSubscription = null;

// Initiate a call — inserts into call_signals table
export async function initiateCall(fromUserId, toUserId, callType = 'audio') {
    // Clean up any old calls first
    await supabase.from('call_signals')
        .delete()
        .or(`from_id.eq.${fromUserId},to_id.eq.${fromUserId}`)
        .in('status', ['ringing', 'ended', 'declined']);

    const { data, error } = await supabase.from('call_signals').insert({
        from_id: fromUserId,
        to_id: toUserId,
        call_type: callType,
        status: 'ringing',
    }).select().single();

    if (error) { console.error('Failed to initiate call:', error); return null; }
    return data;
}

// Accept a call
export async function acceptCall(callId) {
    const { data, error } = await supabase.from('call_signals')
        .update({ status: 'accepted' })
        .eq('id', callId)
        .select().single();
    return data;
}

// Decline a call
export async function declineCall(callId) {
    await supabase.from('call_signals')
        .update({ status: 'declined' })
        .eq('id', callId);
}

// End a call
export async function endCall(callId) {
    if (!callId) return;
    await supabase.from('call_signals')
        .update({ status: 'ended', ended_at: new Date().toISOString() })
        .eq('id', callId);
}

// Send SDP offer to the callee
export async function sendOffer(callId, offer) {
    await supabase.from('call_signals')
        .update({ sdp_offer: JSON.stringify(offer) })
        .eq('id', callId);
}

// Send SDP answer back to the caller
export async function sendAnswer(callId, answer) {
    await supabase.from('call_signals')
        .update({ sdp_answer: JSON.stringify(answer) })
        .eq('id', callId);
}

// Send ICE candidate
export async function sendIceCandidate(callId, candidate, fromSide) {
    // Append candidate to the existing array
    const { data: current } = await supabase.from('call_signals')
        .select('ice_candidates').eq('id', callId).single();

    const existing = current?.ice_candidates || [];
    existing.push({ ...candidate, side: fromSide });

    await supabase.from('call_signals')
        .update({ ice_candidates: existing })
        .eq('id', callId);
}

// Get active call for a user
export async function getActiveCall(userId) {
    const { data } = await supabase.from('call_signals')
        .select('*')
        .or(`from_id.eq.${userId},to_id.eq.${userId}`)
        .in('status', ['ringing', 'accepted'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
    return data;
}

// Get call by ID
export async function getCallById(callId) {
    const { data } = await supabase.from('call_signals')
        .select('*').eq('id', callId).single();
    return data;
}

// Subscribe to incoming calls for a user — returns unsubscribe function
export function subscribeToCallSignals(userId, onCallEvent) {
    // Clean up existing subscription
    if (callSubscription) {
        callSubscription.unsubscribe();
        callSubscription = null;
    }

    callSubscription = supabase
        .channel(`call_signals_${userId}`)
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'call_signals',
        }, (payload) => {
            const record = payload.new;
            if (!record) return;

            // Only care about calls involving this user
            if (record.to_id === userId || record.from_id === userId) {
                if (payload.eventType === 'INSERT' && record.to_id === userId && record.status === 'ringing') {
                    onCallEvent({ action: 'incoming', call: record });
                } else if (payload.eventType === 'UPDATE') {
                    onCallEvent({ action: record.status, call: record });
                }
            }
        })
        .subscribe();

    return {
        unsubscribe: () => {
            if (callSubscription) {
                callSubscription.unsubscribe();
                callSubscription = null;
            }
        }
    };
}

// Poll for call updates (fallback + SDP/ICE exchange)
export function pollCallUpdates(callId, callback, interval = 1500) {
    const timer = setInterval(async () => {
        const call = await getCallById(callId);
        if (call) callback(call);
    }, interval);
    return () => clearInterval(timer);
}
