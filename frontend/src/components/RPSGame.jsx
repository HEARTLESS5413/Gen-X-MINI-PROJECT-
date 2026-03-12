import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Mic, MicOff, Video as VideoIcon, VideoOff, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { submitMove, clearMoves, updatePlayerScore, updateRound, finishGame, pollGameState, updateGameState, leaveGame } from '../lib/gameEngine';

const CHOICES = ['rock', 'paper', 'scissors'];
const EMOJI = { rock: '🪨', paper: '📄', scissors: '✂️' };
const TOTAL_ROUNDS = 5;

function getWinner(move1, move2) {
    if (move1 === move2) return 'draw';
    if ((move1 === 'rock' && move2 === 'scissors') || (move1 === 'paper' && move2 === 'rock') || (move1 === 'scissors' && move2 === 'paper')) return 'p1';
    return 'p2';
}

export default function RPSGame({ sessionId, session, players, playerUsers, onClose }) {
    const { user: currentUser } = useAuth();
    const [myMove, setMyMove] = useState(null);
    const [opponentMove, setOpponentMove] = useState(null);
    const [roundResult, setRoundResult] = useState(null);
    const [scores, setScores] = useState({});
    const [currentRound, setCurrentRound] = useState(session?.current_round || 1);
    const [waiting, setWaiting] = useState(false);
    const [showResult, setShowResult] = useState(false);
    const [playerLeft, setPlayerLeft] = useState(false);
    const [isMicOn, setIsMicOn] = useState(false);
    const [isCamOn, setIsCamOn] = useState(false);
    const localStreamRef = useRef(null);
    const localVideoRef = useRef(null);
    const floatingCamRef = useRef(null);
    const pollRef = useRef(null);

    const opponent = players.find(p => p.user_id !== currentUser?.id);

    useEffect(() => {
        const s = {};
        players.forEach(p => { s[p.user_id] = p.score || 0; });
        setScores(s);

        pollRef.current = pollGameState(sessionId, ({ session: sess, players: plrs }) => {
            if (!sess) return;
            setCurrentRound(sess.current_round || 1);

            // Check if opponent left
            if (sess.game_state?.playerLeft && sess.game_state.playerLeft !== currentUser?.id) {
                setPlayerLeft(true);
                return;
            }

            if (sess.status === 'finished') {
                if (sess.game_state?.playerLeft && sess.game_state.playerLeft !== currentUser?.id) {
                    setPlayerLeft(true);
                } else {
                    onClose();
                }
                return;
            }

            if (sess.game_state?.lastRound === sess.current_round && sess.game_state?.result) {
                setRoundResult(sess.game_state.result);
                const om = plrs.find(p => p.user_id !== currentUser?.id);
                if (om?.move) setOpponentMove(om.move);
                setShowResult(true);
                plrs.forEach(p => { setScores(prev => ({ ...prev, [p.user_id]: p.score })); });
            }
        }, 600);

        return () => { if (pollRef.current) pollRef.current(); cleanupMedia(); };
    }, [sessionId]);

    const cleanupMedia = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(t => t.stop());
            localStreamRef.current = null;
        }
    };

    const toggleMic = async () => {
        if (isMicOn) {
            localStreamRef.current?.getAudioTracks().forEach(t => t.stop());
            setIsMicOn(false);
        } else {
            try {
                const stream = localStreamRef.current || await navigator.mediaDevices.getUserMedia({ audio: true, video: isCamOn });
                localStreamRef.current = stream;
                setIsMicOn(true);
            } catch (e) { console.error('Mic error:', e); }
        }
    };

    const toggleCam = async () => {
        if (isCamOn) {
            localStreamRef.current?.getVideoTracks().forEach(t => t.stop());
            if (localVideoRef.current) localVideoRef.current.srcObject = null;
            setIsCamOn(false);
        } else {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: isMicOn, video: true });
                localStreamRef.current = stream;
                if (localVideoRef.current) localVideoRef.current.srcObject = stream;
                setIsCamOn(true);
            } catch (e) { console.error('Camera error:', e); }
        }
    };

    const handleLeave = async () => {
        cleanupMedia();
        await leaveGame(sessionId, currentUser.id);
        onClose();
    };

    const handleMove = async (choice) => {
        if (myMove || waiting) return;
        setMyMove(choice);
        setWaiting(true);
        await submitMove(sessionId, currentUser.id, choice);

        const check = setInterval(async () => {
            const { getGamePlayers } = await import('../lib/gameEngine');
            const plrs = await getGamePlayers(sessionId);
            const opp = plrs.find(p => p.user_id !== currentUser?.id);
            const mee = plrs.find(p => p.user_id === currentUser?.id);

            if (opp?.move && mee?.move) {
                clearInterval(check);
                const result = getWinner(mee.move, opp.move);
                setOpponentMove(opp.move);

                let newScores = { ...scores };
                if (result === 'p1') {
                    newScores[currentUser.id] = (newScores[currentUser.id] || 0) + 1;
                    setRoundResult('You win this round! 🎉');
                } else if (result === 'p2') {
                    newScores[opp.user_id] = (newScores[opp.user_id] || 0) + 1;
                    setRoundResult('Opponent wins this round 😤');
                } else {
                    setRoundResult("It's a draw! 🤝");
                }
                setScores(newScores);
                setShowResult(true);

                for (const p of plrs) {
                    await updatePlayerScore(sessionId, p.user_id, newScores[p.user_id] || 0);
                }

                await updateGameState(sessionId, {
                    lastRound: currentRound,
                    result: result === 'p1' ? `${currentUser.username} wins` : result === 'p2' ? `${playerUsers[opp.user_id]?.username} wins` : 'Draw',
                });

                setTimeout(async () => {
                    if (currentRound >= TOTAL_ROUNDS) {
                        const myScore = newScores[currentUser.id] || 0;
                        const oppScore = newScores[opp.user_id] || 0;
                        const winnerId = myScore > oppScore ? currentUser.id : oppScore > myScore ? opp.user_id : null;
                        await finishGame(sessionId, winnerId);
                    } else {
                        await clearMoves(sessionId);
                        await updateRound(sessionId, currentRound + 1);
                        setCurrentRound(currentRound + 1);
                        setMyMove(null);
                        setOpponentMove(null);
                        setRoundResult(null);
                        setShowResult(false);
                        setWaiting(false);
                    }
                }, 2000);
            }
        }, 500);
    };

    // Draggable floating camera
    const handleCamDrag = (e) => {
        if (!floatingCamRef.current) return;
        const el = floatingCamRef.current;
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

    // Player left notification
    if (playerLeft) {
        return (
            <div className="game-overlay">
                <div className="game-modal game-results">
                    <div className="game-results-content">
                        <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🏆</div>
                        <h2 className="game-results-title">You Win!</h2>
                        <p className="game-results-game" style={{ marginTop: '8px' }}>
                            {playerUsers[opponent?.user_id]?.username || 'Opponent'} left the game
                        </p>
                        <button className="game-play-again-btn" onClick={onClose} style={{ marginTop: '20px' }}>Close</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="game-overlay">
            <div className="game-modal game-rps">
                <div className="game-header">
                    <h2>Rock Paper Scissors</h2>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span className="game-round-badge">Round {currentRound}/{TOTAL_ROUNDS}</span>
                        <button className="game-media-btn" onClick={toggleMic} title={isMicOn ? 'Mute' : 'Unmute'}>
                            {isMicOn ? <Mic size={16} /> : <MicOff size={16} />}
                        </button>
                        <button className="game-media-btn" onClick={toggleCam} title={isCamOn ? 'Camera off' : 'Camera on'}>
                            {isCamOn ? <VideoIcon size={16} /> : <VideoOff size={16} />}
                        </button>
                        <button className="game-leave-btn" onClick={handleLeave} title="Leave Game">
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>

                <div className="game-rps-score">
                    <div className="rps-player">
                        <img src={currentUser?.avatar} alt="" className="rps-avatar" />
                        <span className="rps-name">You</span>
                        <span className="rps-score">{scores[currentUser?.id] || 0}</span>
                    </div>
                    <span className="rps-vs">VS</span>
                    <div className="rps-player">
                        <img src={playerUsers[opponent?.user_id]?.avatar} alt="" className="rps-avatar" />
                        <span className="rps-name">{playerUsers[opponent?.user_id]?.username || '...'}</span>
                        <span className="rps-score">{scores[opponent?.user_id] || 0}</span>
                    </div>
                </div>

                {showResult && (
                    <div className="rps-result">
                        <div className="rps-moves">
                            <span className="rps-move-display">{EMOJI[myMove]}</span>
                            <span className="rps-vs-small">vs</span>
                            <span className="rps-move-display">{EMOJI[opponentMove]}</span>
                        </div>
                        <p className="rps-result-text">{roundResult}</p>
                    </div>
                )}

                {!showResult && (
                    <div className="rps-choices">
                        <p className="rps-instruction">{waiting ? 'Waiting for opponent...' : 'Make your choice!'}</p>
                        <div className="rps-buttons">
                            {CHOICES.map(c => (
                                <button key={c} className={`rps-choice-btn ${myMove === c ? 'selected' : ''} ${waiting ? 'disabled' : ''}`} onClick={() => handleMove(c)} disabled={waiting}>
                                    <span className="rps-choice-emoji">{EMOJI[c]}</span>
                                    <span className="rps-choice-name">{c}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Floating camera */}
            {isCamOn && (
                <div className="game-floating-cam" ref={floatingCamRef} onMouseDown={handleCamDrag} onTouchStart={handleCamDrag}>
                    <video ref={localVideoRef} autoPlay muted playsInline />
                </div>
            )}
        </div>
    );
}
