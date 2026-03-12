// ===== Multiplayer Game Engine via Supabase Realtime =====

import { supabase } from './store';

// Create a game session (host)
export async function createGameSession(hostId, gameType, invitedUserId) {
    // Clean up old sessions from this host
    await supabase.from('game_sessions')
        .delete()
        .eq('host_id', hostId)
        .in('status', ['waiting', 'finished']);

    const { data, error } = await supabase.from('game_sessions').insert({
        game_type: gameType,
        host_id: hostId,
        status: 'waiting',
        max_players: 2,
        current_round: 1,
        game_state: { invited: invitedUserId },
    }).select().single();

    if (error) { console.error('Create game error:', error); return null; }

    // Host auto-joins
    await joinGameSession(data.id, hostId);
    return data;
}

// Join a game session
export async function joinGameSession(sessionId, userId) {
    const { data, error } = await supabase.from('game_players').insert({
        session_id: sessionId,
        user_id: userId,
        score: 0,
        ready: false,
    }).select().single();

    if (error && error.code !== '23505') { // ignore duplicate
        console.error('Join game error:', error);
        return null;
    }
    return data;
}

// Get game session
export async function getGameSession(sessionId) {
    const { data } = await supabase.from('game_sessions')
        .select('*').eq('id', sessionId).single();
    return data;
}

// Get players in a session
export async function getGamePlayers(sessionId) {
    const { data } = await supabase.from('game_players')
        .select('*').eq('session_id', sessionId).order('joined_at');
    return data || [];
}

// Start the game (host only)
export async function startGame(sessionId) {
    await supabase.from('game_sessions')
        .update({ status: 'playing' })
        .eq('id', sessionId);
}

// Submit a move
export async function submitMove(sessionId, userId, move) {
    await supabase.from('game_players')
        .update({ move })
        .eq('session_id', sessionId)
        .eq('user_id', userId);
}

// Update game state (round results, board, etc.)
export async function updateGameState(sessionId, gameState) {
    await supabase.from('game_sessions')
        .update({ game_state: gameState })
        .eq('id', sessionId);
}

// Update round
export async function updateRound(sessionId, round) {
    await supabase.from('game_sessions')
        .update({ current_round: round })
        .eq('id', sessionId);
}

// Update player score
export async function updatePlayerScore(sessionId, userId, score) {
    await supabase.from('game_players')
        .update({ score })
        .eq('session_id', sessionId)
        .eq('user_id', userId);
}

// Clear all moves (between rounds)
export async function clearMoves(sessionId) {
    await supabase.from('game_players')
        .update({ move: null })
        .eq('session_id', sessionId);
}

// Finish game with winner
export async function finishGame(sessionId, winnerId) {
    await supabase.from('game_sessions')
        .update({ status: 'finished', winner_id: winnerId })
        .eq('id', sessionId);
}

// Leave game — opponent auto-wins
export async function leaveGame(sessionId, userId) {
    // Remove the player
    await supabase.from('game_players')
        .delete()
        .eq('session_id', sessionId)
        .eq('user_id', userId);

    // Get remaining players
    const remaining = await getGamePlayers(sessionId);
    const winnerId = remaining.length === 1 ? remaining[0].user_id : null;

    // Mark game_state with left info and finish
    await supabase.from('game_sessions')
        .update({
            status: 'finished',
            winner_id: winnerId,
            game_state: { playerLeft: userId, leftAt: new Date().toISOString() },
        })
        .eq('id', sessionId);

    return winnerId;
}

// Subscribe to game session changes
export function subscribeToGame(sessionId, onUpdate) {
    const channel = supabase
        .channel(`game_${sessionId}`)
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'game_sessions',
            filter: `id=eq.${sessionId}`,
        }, (payload) => {
            onUpdate({ type: 'session', data: payload.new });
        })
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'game_players',
            filter: `session_id=eq.${sessionId}`,
        }, (payload) => {
            onUpdate({ type: 'player', data: payload.new, event: payload.eventType });
        })
        .subscribe();

    return { unsubscribe: () => channel.unsubscribe() };
}

// Poll game state (optimized — 600ms)
export function pollGameState(sessionId, callback, interval = 600) {
    const timer = setInterval(async () => {
        const [session, players] = await Promise.all([
            getGameSession(sessionId),
            getGamePlayers(sessionId),
        ]);
        callback({ session, players });
    }, interval);
    return () => clearInterval(timer);
}

// Find active game invite for a user
export async function findGameInvite(userId) {
    const { data } = await supabase.from('game_sessions')
        .select('*')
        .eq('status', 'waiting')
        .order('created_at', { ascending: false })
        .limit(10);

    if (!data) return null;
    return data.find(s => s.game_state?.invited === userId) || null;
}
