import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, RotateCcw, Trophy, Lightbulb } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const WORDS = [
    { word: 'JAVASCRIPT', hint: 'Programming language of the web' },
    { word: 'INSTAGRAM', hint: 'Photo sharing social media' },
    { word: 'BUTTERFLY', hint: 'Beautiful insect with wings' },
    { word: 'ASTRONAUT', hint: 'Person who travels to space' },
    { word: 'CHOCOLATE', hint: 'Sweet brown treat' },
    { word: 'FIREWORKS', hint: 'Colorful explosions in the sky' },
    { word: 'ADVENTURE', hint: 'An exciting experience' },
    { word: 'KEYBOARD', hint: 'You type on this' },
    { word: 'DINOSAUR', hint: 'Extinct giant reptile' },
    { word: 'MOUNTAIN', hint: 'Tall natural land formation' },
    { word: 'ELEPHANT', hint: 'Largest land animal' },
    { word: 'UNICORN', hint: 'Mythical horse with a horn' },
    { word: 'TREASURE', hint: 'Valuable hidden items' },
    { word: 'SANDWICH', hint: 'Bread with fillings' },
    { word: 'PAINTING', hint: 'Art created with brush and colors' },
];

const KEYBOARD_ROWS = [
    'QWERTYUIOP'.split(''),
    'ASDFGHJKL'.split(''),
    'ZXCVBNM'.split(''),
];

export default function GuessTheWord() {
    const navigate = useNavigate();
    const [wordData, setWordData] = useState(null);
    const [guessedLetters, setGuessedLetters] = useState(new Set());
    const [currentPlayer, setCurrentPlayer] = useState(1);
    const [scores, setScores] = useState({ p1: 0, p2: 0 });
    const [round, setRound] = useState(1);
    const [phase, setPhase] = useState('playing'); // playing, roundEnd, gameOver
    const [showHint, setShowHint] = useState(false);
    const [wrongGuesses, setWrongGuesses] = useState(0);
    const [timer, setTimer] = useState(60);

    const MAX_ROUNDS = 3;
    const MAX_WRONG = 6;

    const pickWord = useCallback(() => {
        const w = WORDS[Math.floor(Math.random() * WORDS.length)];
        setWordData(w);
        setGuessedLetters(new Set());
        setWrongGuesses(0);
        setShowHint(false);
        setTimer(60);
        setPhase('playing');
    }, []);

    useEffect(() => {
        pickWord();
    }, []);

    // Timer
    useEffect(() => {
        if (phase !== 'playing' || timer <= 0) return;
        const t = setInterval(() => setTimer(prev => {
            if (prev <= 1) {
                clearInterval(t);
                handleLoss();
                return 0;
            }
            return prev - 1;
        }), 1000);
        return () => clearInterval(t);
    }, [phase, timer]);

    const handleGuess = (letter) => {
        if (phase !== 'playing' || guessedLetters.has(letter)) return;

        const newGuessed = new Set(guessedLetters);
        newGuessed.add(letter);
        setGuessedLetters(newGuessed);

        if (!wordData.word.includes(letter)) {
            const newWrong = wrongGuesses + 1;
            setWrongGuesses(newWrong);
            if (newWrong >= MAX_WRONG) {
                handleLoss();
                return;
            }
        }

        // Check win
        const isWon = wordData.word.split('').every(l => newGuessed.has(l));
        if (isWon) {
            handleWin();
        }
    };

    const handleWin = () => {
        const player = `p${currentPlayer}`;
        const timeBonus = Math.floor(timer / 10);
        setScores(prev => ({ ...prev, [player]: prev[player] + 10 + timeBonus }));
        setPhase('roundEnd');
    };

    const handleLoss = () => {
        setPhase('roundEnd');
    };

    const nextRound = () => {
        if (round >= MAX_ROUNDS * 2) {
            setPhase('gameOver');
            return;
        }
        setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
        if (currentPlayer === 2) setRound(r => r + 1);
        pickWord();
    };

    const fullReset = () => {
        setScores({ p1: 0, p2: 0 });
        setRound(1);
        setCurrentPlayer(1);
        pickWord();
    };

    useEffect(() => {
        const handleKeyPress = (e) => {
            const letter = e.key.toUpperCase();
            if (/^[A-Z]$/.test(letter)) handleGuess(letter);
        };
        window.addEventListener('keypress', handleKeyPress);
        return () => window.removeEventListener('keypress', handleKeyPress);
    }, [guessedLetters, phase, wordData]);

    if (!wordData) return null;

    const displayWord = wordData.word.split('').map(letter =>
        guessedLetters.has(letter) || phase === 'roundEnd' ? letter : '_'
    );

    const isWon = wordData.word.split('').every(l => guessedLetters.has(l));
    const winner = scores.p1 > scores.p2 ? 'Player 1' : scores.p2 > scores.p1 ? 'Player 2' : 'Tie';

    return (
        <div className="game-play-page">
            <div className="game-play-header">
                <button className="btn-ghost" onClick={() => navigate('/games')}>
                    <ArrowLeft size={22} />
                </button>
                <h2>🔤 Guess the Word</h2>
                <button className="btn-ghost" onClick={fullReset}>
                    <RotateCcw size={20} />
                </button>
            </div>

            {phase === 'gameOver' && (
                <div className="game-winner-overlay">
                    <div className="game-winner-card">
                        <Trophy size={48} color="#ffd43b" />
                        <h2>{winner === 'Tie' ? "It's a Tie!" : `${winner} Wins!`}</h2>
                        <p>{scores.p1} — {scores.p2}</p>
                        <button className="btn btn-primary" onClick={fullReset}>Play Again</button>
                    </div>
                </div>
            )}

            <div className="word-container">
                {/* Scoreboard */}
                <div className="rps-scoreboard">
                    <div className="rps-player-score" style={{ color: '#ff6b6b' }}>
                        <span>P1</span>
                        <strong>{scores.p1}</strong>
                    </div>
                    <div className="rps-round">Round {round}/{MAX_ROUNDS}</div>
                    <div className="rps-player-score" style={{ color: '#4dabf7' }}>
                        <span>P2</span>
                        <strong>{scores.p2}</strong>
                    </div>
                </div>

                <div className="word-player-indicator" style={{ color: currentPlayer === 1 ? '#ff6b6b' : '#4dabf7' }}>
                    Player {currentPlayer}'s Turn
                </div>

                {/* Timer */}
                <div className="word-timer">
                    <div className="word-timer-bar" style={{ width: `${(timer / 60) * 100}%`, background: timer < 15 ? '#ff4757' : 'var(--accent)' }} />
                    <span>{timer}s</span>
                </div>

                {/* Wrong guesses */}
                <div className="word-lives">
                    {'❤️'.repeat(MAX_WRONG - wrongGuesses)}{'🖤'.repeat(wrongGuesses)}
                </div>

                {/* Word display */}
                <div className="word-display">
                    {displayWord.map((letter, i) => (
                        <span key={i} className={`word-letter ${letter !== '_' ? 'revealed' : ''}`}>
                            {letter}
                        </span>
                    ))}
                </div>

                {/* Hint */}
                <button className="btn btn-secondary word-hint-btn" onClick={() => setShowHint(true)}>
                    <Lightbulb size={16} /> {showHint ? wordData.hint : 'Show Hint (-2 pts)'}
                </button>

                {/* Round end */}
                {phase === 'roundEnd' && (
                    <div className="word-round-result">
                        <h3>{isWon ? '🎉 Correct!' : `😢 The word was: ${wordData.word}`}</h3>
                        <button className="btn btn-primary" onClick={nextRound}>
                            {round >= MAX_ROUNDS && currentPlayer === 2 ? 'See Results' : 'Next Round'}
                        </button>
                    </div>
                )}

                {/* Keyboard */}
                {phase === 'playing' && (
                    <div className="word-keyboard">
                        {KEYBOARD_ROWS.map((row, ri) => (
                            <div key={ri} className="word-keyboard-row">
                                {row.map(letter => (
                                    <button
                                        key={letter}
                                        className={`word-key ${guessedLetters.has(letter) ? (wordData.word.includes(letter) ? 'correct' : 'wrong') : ''}`}
                                        onClick={() => handleGuess(letter)}
                                        disabled={guessedLetters.has(letter)}
                                    >
                                        {letter}
                                    </button>
                                ))}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
