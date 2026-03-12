import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { submitMove, clearMoves, updatePlayerScore, updateRound, finishGame, pollGameState, updateGameState } from '../lib/gameEngine';

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
    const pollRef = useRef(null);

    const opponent = players.find(p => p.user_id !== currentUser?.id);
    const me = players.find(p => p.user_id === currentUser?.id);

    useEffect(() => {
        // Init scores
        const s = {};
        players.forEach(p => { s[p.user_id] = p.score || 0; });
        setScores(s);

        // Poll for opponent moves
        pollRef.current = pollGameState(sessionId, ({ session: sess, players: plrs }) => {
            if (sess) {
                setCurrentRound(sess.current_round || 1);
                if (sess.status === 'finished') {
                    onClose(); // will show results in lobby
                }
                // Check round result
                if (sess.game_state?.lastRound === sess.current_round && sess.game_state?.result) {
                    setRoundResult(sess.game_state.result);
                    const om = plrs.find(p => p.user_id !== currentUser?.id);
                    if (om?.move) setOpponentMove(om.move);
                    setShowResult(true);
                    plrs.forEach(p => { setScores(prev => ({ ...prev, [p.user_id]: p.score })); });
                }
            }
        }, 800);

        return () => { if (pollRef.current) pollRef.current(); };
    }, [sessionId]);

    const handleMove = async (choice) => {
        if (myMove || waiting) return;
        setMyMove(choice);
        setWaiting(true);
        await submitMove(sessionId, currentUser.id, choice);

        // Check if opponent also moved — poll faster
        const check = setInterval(async () => {
            const { players: plrs } = await import('../lib/gameEngine').then(m => Promise.all([m.getGamePlayers(sessionId)]).then(([p]) => ({ players: p })));
            const opp = plrs.find(p => p.user_id !== currentUser?.id);
            const mee = plrs.find(p => p.user_id === currentUser?.id);

            if (opp?.move && mee?.move) {
                clearInterval(check);
                // Evaluate round
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

                // Update scores in DB
                for (const p of plrs) {
                    await updatePlayerScore(sessionId, p.user_id, newScores[p.user_id] || 0);
                }

                // Save round result
                await updateGameState(sessionId, {
                    lastRound: currentRound,
                    result: result === 'p1' ? `${currentUser.username} wins` : result === 'p2' ? `${playerUsers[opp.user_id]?.username} wins` : 'Draw',
                });

                // Next round or finish
                setTimeout(async () => {
                    if (currentRound >= TOTAL_ROUNDS) {
                        // Determine overall winner
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
                }, 2500);
            }
        }, 600);
    };

    return (
        <div className="game-overlay">
            <div className="game-modal game-rps">
                <div className="game-header">
                    <h2>Rock Paper Scissors</h2>
                    <span className="game-round-badge">Round {currentRound}/{TOTAL_ROUNDS}</span>
                </div>

                {/* Scoreboard */}
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

                {/* Round result */}
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

                {/* Choice buttons */}
                {!showResult && (
                    <div className="rps-choices">
                        <p className="rps-instruction">{waiting ? 'Waiting for opponent...' : 'Make your choice!'}</p>
                        <div className="rps-buttons">
                            {CHOICES.map(c => (
                                <button
                                    key={c}
                                    className={`rps-choice-btn ${myMove === c ? 'selected' : ''} ${waiting ? 'disabled' : ''}`}
                                    onClick={() => handleMove(c)}
                                    disabled={waiting}
                                >
                                    <span className="rps-choice-emoji">{EMOJI[c]}</span>
                                    <span className="rps-choice-name">{c}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
