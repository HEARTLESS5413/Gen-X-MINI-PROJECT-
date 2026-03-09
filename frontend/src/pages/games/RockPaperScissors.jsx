import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, RotateCcw, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CHOICES = [
    { id: 'rock', emoji: '🪨', label: 'Rock', beats: 'scissors' },
    { id: 'paper', emoji: '📄', label: 'Paper', beats: 'rock' },
    { id: 'scissors', emoji: '✂️', label: 'Scissors', beats: 'paper' },
];

function getResult(p1, p2) {
    if (p1 === p2) return 'draw';
    const choice = CHOICES.find(c => c.id === p1);
    return choice.beats === p2 ? 'p1' : 'p2';
}

export default function RockPaperScissors() {
    const navigate = useNavigate();
    const [phase, setPhase] = useState('p1'); // p1, countdown, p2, countdown2, reveal, roundEnd
    const [p1Choice, setP1Choice] = useState(null);
    const [p2Choice, setP2Choice] = useState(null);
    const [countdown, setCountdown] = useState(3);
    const [scores, setScores] = useState({ p1: 0, p2: 0 });
    const [round, setRound] = useState(1);
    const [result, setResult] = useState(null);
    const [gameOver, setGameOver] = useState(false);

    const BEST_OF = 3;

    useEffect(() => {
        if (phase !== 'countdown' && phase !== 'countdown2') return;
        if (countdown <= 0) {
            if (phase === 'countdown') {
                setPhase('p2');
                setCountdown(3);
            } else {
                setPhase('reveal');
                const r = getResult(p1Choice, p2Choice);
                setResult(r);
                if (r === 'p1') setScores(prev => ({ ...prev, p1: prev.p1 + 1 }));
                if (r === 'p2') setScores(prev => ({ ...prev, p2: prev.p2 + 1 }));

                setTimeout(() => setPhase('roundEnd'), 2000);
            }
            return;
        }
        const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [countdown, phase]);

    useEffect(() => {
        if (phase === 'roundEnd') {
            const newScores = { ...scores };
            if (result === 'p1') newScores.p1 = scores.p1;
            if (result === 'p2') newScores.p2 = scores.p2;

            if (newScores.p1 >= BEST_OF || newScores.p2 >= BEST_OF) {
                setGameOver(true);
            }
        }
    }, [phase]);

    const handleP1Select = (choice) => {
        setP1Choice(choice);
        setPhase('countdown');
        setCountdown(3);
    };

    const handleP2Select = (choice) => {
        setP2Choice(choice);
        setPhase('countdown2');
        setCountdown(3);
    };

    const nextRound = () => {
        setRound(r => r + 1);
        setP1Choice(null);
        setP2Choice(null);
        setResult(null);
        setPhase('p1');
    };

    const fullReset = () => {
        setP1Choice(null);
        setP2Choice(null);
        setResult(null);
        setPhase('p1');
        setScores({ p1: 0, p2: 0 });
        setRound(1);
        setGameOver(false);
        setCountdown(3);
    };

    const resultText = result === 'p1' ? 'Player 1 wins!' : result === 'p2' ? 'Player 2 wins!' : "It's a draw!";
    const winner = scores.p1 >= BEST_OF ? 'Player 1' : 'Player 2';

    return (
        <div className="game-play-page">
            <div className="game-play-header">
                <button className="btn-ghost" onClick={() => navigate('/games')}>
                    <ArrowLeft size={22} />
                </button>
                <h2>✊ Rock Paper Scissors</h2>
                <button className="btn-ghost" onClick={fullReset}>
                    <RotateCcw size={20} />
                </button>
            </div>

            <div className="rps-container">
                {/* Scoreboard */}
                <div className="rps-scoreboard">
                    <div className="rps-player-score" style={{ color: '#ff6b6b' }}>
                        <span>P1</span>
                        <strong>{scores.p1}</strong>
                    </div>
                    <div className="rps-round">Round {round}</div>
                    <div className="rps-player-score" style={{ color: '#4dabf7' }}>
                        <span>P2</span>
                        <strong>{scores.p2}</strong>
                    </div>
                </div>

                {/* Game Over */}
                {gameOver && (
                    <div className="game-winner-overlay">
                        <div className="game-winner-card">
                            <Trophy size={48} color="#ffd43b" />
                            <h2>{winner} Wins the Match! 🎉</h2>
                            <p>{scores.p1} - {scores.p2}</p>
                            <button className="btn btn-primary" onClick={fullReset}>Play Again</button>
                        </div>
                    </div>
                )}

                {/* P1 Selection */}
                {phase === 'p1' && (
                    <div className="rps-selection">
                        <h3 className="rps-title" style={{ color: '#ff6b6b' }}>Player 1 — Choose!</h3>
                        <p className="rps-subtitle">Player 2, look away! 👀</p>
                        <div className="rps-choices">
                            {CHOICES.map(choice => (
                                <button key={choice.id} className="rps-choice-btn" onClick={() => handleP1Select(choice.id)}>
                                    <span className="rps-emoji">{choice.emoji}</span>
                                    <span>{choice.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Countdown */}
                {(phase === 'countdown' || phase === 'countdown2') && (
                    <div className="rps-countdown">
                        <div className="rps-countdown-number">{countdown || '🔥'}</div>
                        <p>{phase === 'countdown' ? 'Pass to Player 2...' : 'Revealing...'}</p>
                    </div>
                )}

                {/* P2 Selection */}
                {phase === 'p2' && (
                    <div className="rps-selection">
                        <h3 className="rps-title" style={{ color: '#4dabf7' }}>Player 2 — Choose!</h3>
                        <p className="rps-subtitle">Player 1, no peeking! 🙈</p>
                        <div className="rps-choices">
                            {CHOICES.map(choice => (
                                <button key={choice.id} className="rps-choice-btn" onClick={() => handleP2Select(choice.id)}>
                                    <span className="rps-emoji">{choice.emoji}</span>
                                    <span>{choice.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Reveal */}
                {(phase === 'reveal' || phase === 'roundEnd') && (
                    <div className="rps-reveal">
                        <div className="rps-reveal-choices">
                            <div className="rps-reveal-card p1">
                                <span className="rps-reveal-emoji">{CHOICES.find(c => c.id === p1Choice)?.emoji}</span>
                                <span>Player 1</span>
                            </div>
                            <div className="rps-vs">VS</div>
                            <div className="rps-reveal-card p2">
                                <span className="rps-reveal-emoji">{CHOICES.find(c => c.id === p2Choice)?.emoji}</span>
                                <span>Player 2</span>
                            </div>
                        </div>
                        <h3 className="rps-result-text">{resultText}</h3>
                        {phase === 'roundEnd' && !gameOver && (
                            <button className="btn btn-primary" onClick={nextRound}>Next Round</button>
                        )}
                    </div>
                )}

                <div className="rps-best-of">Best of {BEST_OF}</div>
            </div>
        </div>
    );
}
