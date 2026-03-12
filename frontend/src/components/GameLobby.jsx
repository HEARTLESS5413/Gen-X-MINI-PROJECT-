import React, { useState, useEffect, useRef } from 'react';
import { X, Trophy, Users, Loader, Crown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { users as usersStore } from '../lib/store';
import {
    getGameSession, getGamePlayers, startGame, joinGameSession,
    subscribeToGame, pollGameState, finishGame
} from '../lib/gameEngine';
import RPSGame from './RPSGame';
import TicTacToeGame from './TicTacToeGame';

export default function GameLobby({ sessionId, onClose }) {
    const { user: currentUser } = useAuth();
    const [session, setSession] = useState(null);
    const [players, setPlayers] = useState([]);
    const [playerUsers, setPlayerUsers] = useState({});
    const [joined, setJoined] = useState(false);
    const pollRef = useRef(null);

    useEffect(() => {
        if (!sessionId) return;

        // Initial load
        loadState();

        // Subscribe to Realtime
        const sub = subscribeToGame(sessionId, () => loadState());

        // Also poll as fallback
        pollRef.current = pollGameState(sessionId, ({ session: s, players: p }) => {
            if (s) setSession(s);
            if (p) {
                setPlayers(p);
                p.forEach(async (pl) => {
                    if (!playerUsers[pl.user_id]) {
                        const u = await usersStore.getById(pl.user_id);
                        if (u) setPlayerUsers(prev => ({ ...prev, [pl.user_id]: u }));
                    }
                });
            }
        }, 1500);

        return () => {
            sub.unsubscribe();
            if (pollRef.current) pollRef.current();
        };
    }, [sessionId]);

    const loadState = async () => {
        const [s, p] = await Promise.all([
            getGameSession(sessionId),
            getGamePlayers(sessionId),
        ]);
        if (s) setSession(s);
        if (p) {
            setPlayers(p);
            for (const pl of p) {
                if (!playerUsers[pl.user_id]) {
                    const u = await usersStore.getById(pl.user_id);
                    if (u) setPlayerUsers(prev => ({ ...prev, [pl.user_id]: u }));
                }
                if (pl.user_id === currentUser?.id) setJoined(true);
            }
        }
    };

    const handleJoin = async () => {
        await joinGameSession(sessionId, currentUser.id);
        setJoined(true);
        await loadState();
    };

    const handleStart = async () => {
        await startGame(sessionId);
        await loadState();
    };

    const isHost = session?.host_id === currentUser?.id;
    const gameReady = players.length >= (session?.max_players || 2);
    const gameName = { rps: 'Rock Paper Scissors', tictactoe: 'Tic Tac Toe', word: 'Guess the Word' }[session?.game_type] || session?.game_type;

    // If game is playing, render the actual game
    if (session?.status === 'playing') {
        if (session.game_type === 'rps') {
            return <RPSGame sessionId={sessionId} session={session} players={players} playerUsers={playerUsers} onClose={onClose} />;
        }
        if (session.game_type === 'tictactoe') {
            return <TicTacToeGame sessionId={sessionId} session={session} players={players} playerUsers={playerUsers} onClose={onClose} />;
        }
    }

    // If game is finished, show results
    if (session?.status === 'finished') {
        const winner = playerUsers[session.winner_id];
        const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
        return (
            <div className="game-overlay">
                <div className="game-modal game-results">
                    <button className="game-close-btn" onClick={onClose}><X size={20} /></button>
                    <div className="game-results-content">
                        <Trophy size={48} className="game-trophy" />
                        <h2 className="game-results-title">Game Over!</h2>
                        <p className="game-results-game">{gameName}</p>

                        {winner ? (
                            <div className="game-winner-card">
                                <Crown size={24} className="game-crown" />
                                <img src={winner.avatar} alt="" className="game-winner-avatar" />
                                <span className="game-winner-name">{winner.username} wins!</span>
                            </div>
                        ) : (
                            <div className="game-winner-card draw">
                                <span className="game-winner-name">It's a Draw!</span>
                            </div>
                        )}

                        <div className="game-scoreboard">
                            {sortedPlayers.map((p, i) => (
                                <div key={p.user_id} className={`game-score-row ${i === 0 ? 'first' : ''}`}>
                                    <span className="game-score-rank">#{i + 1}</span>
                                    <img src={playerUsers[p.user_id]?.avatar} alt="" className="game-score-avatar" />
                                    <span className="game-score-name">{playerUsers[p.user_id]?.username || '...'}</span>
                                    <span className="game-score-value">{p.score} pts</span>
                                </div>
                            ))}
                        </div>

                        <button className="game-play-again-btn" onClick={onClose}>Close</button>
                    </div>
                </div>
            </div>
        );
    }

    // Lobby / Waiting room
    return (
        <div className="game-overlay">
            <div className="game-modal game-lobby">
                <button className="game-close-btn" onClick={onClose}><X size={20} /></button>

                <div className="game-lobby-content">
                    <div className="game-lobby-icon">🎮</div>
                    <h2 className="game-lobby-title">{gameName}</h2>
                    <p className="game-lobby-subtitle">Waiting for players to join...</p>

                    <div className="game-players-list">
                        {players.map(p => (
                            <div key={p.user_id} className="game-player-card">
                                <img src={playerUsers[p.user_id]?.avatar} alt="" className="game-player-avatar" />
                                <span className="game-player-name">{playerUsers[p.user_id]?.username || 'Loading...'}</span>
                                {p.user_id === session?.host_id && <Crown size={14} className="game-host-badge" />}
                            </div>
                        ))}
                        {players.length < (session?.max_players || 2) && (
                            <div className="game-player-card empty">
                                <div className="game-player-avatar-placeholder"><Users size={20} /></div>
                                <span className="game-player-name">Waiting...</span>
                                <Loader size={14} className="game-waiting-spin" />
                            </div>
                        )}
                    </div>

                    <div className="game-lobby-info">
                        <span>{players.length}/{session?.max_players || 2} players</span>
                    </div>

                    {!joined && (
                        <button className="game-join-btn" onClick={handleJoin}>Join Game</button>
                    )}

                    {isHost && gameReady && (
                        <button className="game-start-btn" onClick={handleStart}>
                            🚀 Start Game
                        </button>
                    )}

                    {joined && !isHost && !gameReady && (
                        <p className="game-waiting-text">Waiting for host to start...</p>
                    )}
                </div>
            </div>
        </div>
    );
}
