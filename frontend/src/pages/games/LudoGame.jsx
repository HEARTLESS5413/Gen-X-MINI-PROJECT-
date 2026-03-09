import React, { useState, useCallback } from 'react';
import { ArrowLeft, RotateCcw, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const BOARD_SIZE = 15;
const COLORS = {
    red: { bg: '#ff6b6b', light: '#ff8787', home: [[1, 1], [1, 4], [4, 1], [4, 4]], path: [] },
    blue: { bg: '#4dabf7', light: '#74c0fc', home: [[1, 10], [1, 13], [4, 10], [4, 13]], path: [] },
    green: { bg: '#51cf66', light: '#69db7c', home: [[10, 1], [10, 4], [13, 1], [13, 4]], path: [] },
    yellow: { bg: '#fcc419', light: '#ffd43b', home: [[10, 10], [10, 13], [13, 10], [13, 13]], path: [] },
};

const PLAYER_COLORS_2P = ['red', 'blue'];
const PLAYER_COLORS_4P = ['red', 'blue', 'green', 'yellow'];

function DiceRoll({ value, rolling, onRoll, disabled }) {
    const dots = {
        1: [[1, 1]],
        2: [[0, 2], [2, 0]],
        3: [[0, 2], [1, 1], [2, 0]],
        4: [[0, 0], [0, 2], [2, 0], [2, 2]],
        5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
        6: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]],
    };

    return (
        <button className={`ludo-dice ${rolling ? 'rolling' : ''}`} onClick={onRoll} disabled={disabled}>
            <div className="dice-face">
                {(dots[value] || dots[1]).map(([r, c], i) => (
                    <div key={i} className="dice-dot" style={{ gridRow: r + 1, gridColumn: c + 1 }} />
                ))}
            </div>
        </button>
    );
}

export default function LudoGame() {
    const navigate = useNavigate();
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode') || '2p';
    const playerColors = mode === '4p' ? PLAYER_COLORS_4P : PLAYER_COLORS_2P;

    const initPieces = () => {
        const pieces = {};
        playerColors.forEach(color => {
            pieces[color] = [
                { id: 0, position: -1, finished: false },
                { id: 1, position: -1, finished: false },
                { id: 2, position: -1, finished: false },
                { id: 3, position: -1, finished: false },
            ];
        });
        return pieces;
    };

    const [pieces, setPieces] = useState(initPieces());
    const [currentPlayer, setCurrentPlayer] = useState(0);
    const [diceValue, setDiceValue] = useState(1);
    const [rolling, setRolling] = useState(false);
    const [rolled, setRolled] = useState(false);
    const [winner, setWinner] = useState(null);
    const [scores, setScores] = useState(playerColors.reduce((acc, c) => ({ ...acc, [c]: 0 }), {}));

    const currentColor = playerColors[currentPlayer];

    const rollDice = useCallback(() => {
        if (rolling || rolled) return;
        setRolling(true);

        let count = 0;
        const interval = setInterval(() => {
            setDiceValue(Math.floor(Math.random() * 6) + 1);
            count++;
            if (count > 8) {
                clearInterval(interval);
                const finalValue = Math.floor(Math.random() * 6) + 1;
                setDiceValue(finalValue);
                setRolling(false);
                setRolled(true);

                // Check if player can move
                const playerPieces = pieces[currentColor];
                const canMove = playerPieces.some(p => {
                    if (p.finished) return false;
                    if (p.position === -1 && finalValue === 6) return true;
                    if (p.position >= 0) return true;
                    return false;
                });

                if (!canMove) {
                    setTimeout(() => nextTurn(finalValue), 800);
                }
            }
        }, 80);
    }, [rolling, rolled, currentPlayer, pieces]);

    const nextTurn = (dice) => {
        if (dice !== 6) {
            setCurrentPlayer(prev => (prev + 1) % playerColors.length);
        }
        setRolled(false);
    };

    const movePiece = (color, pieceId) => {
        if (color !== currentColor || !rolled) return;

        const piece = pieces[color][pieceId];
        if (piece.finished) return;
        if (piece.position === -1 && diceValue !== 6) return;

        const newPieces = { ...pieces };
        const playerPieces = [...newPieces[color]];

        if (piece.position === -1 && diceValue === 6) {
            playerPieces[pieceId] = { ...piece, position: 0 };
        } else if (piece.position >= 0) {
            const newPos = piece.position + diceValue;
            if (newPos >= 56) {
                playerPieces[pieceId] = { ...piece, position: 56, finished: true };
                setScores(prev => ({ ...prev, [color]: prev[color] + 1 }));

                // Check win
                if (playerPieces.filter(p => p.finished).length === 4) {
                    setWinner(color);
                }
            } else {
                playerPieces[pieceId] = { ...piece, position: newPos };
            }
        }

        newPieces[color] = playerPieces;
        setPieces(newPieces);
        nextTurn(diceValue);
    };

    const resetGame = () => {
        setPieces(initPieces());
        setCurrentPlayer(0);
        setDiceValue(1);
        setRolling(false);
        setRolled(false);
        setWinner(null);
        setScores(playerColors.reduce((acc, c) => ({ ...acc, [c]: 0 }), {}));
    };

    const getPositionStyle = (color, position) => {
        if (position === -1) return {};
        const angle = (position / 56) * 360 + (playerColors.indexOf(color) * 90);
        const radius = 120;
        const x = Math.cos((angle * Math.PI) / 180) * radius;
        const y = Math.sin((angle * Math.PI) / 180) * radius;
        return { transform: `translate(${x}px, ${y}px)` };
    };

    return (
        <div className="game-play-page">
            <div className="game-play-header">
                <button className="btn-ghost" onClick={() => navigate('/games')}>
                    <ArrowLeft size={22} />
                </button>
                <h2>🎲 Ludo</h2>
                <button className="btn-ghost" onClick={resetGame}>
                    <RotateCcw size={20} />
                </button>
            </div>

            {winner && (
                <div className="game-winner-overlay">
                    <div className="game-winner-card">
                        <Trophy size={48} color={COLORS[winner]?.bg} />
                        <h2 style={{ color: COLORS[winner]?.bg }}>{winner.toUpperCase()} Wins!</h2>
                        <button className="btn btn-primary" onClick={resetGame}>Play Again</button>
                    </div>
                </div>
            )}

            <div className="ludo-board-container">
                {/* Current player indicator */}
                <div className="ludo-turn-indicator" style={{ background: COLORS[currentColor]?.bg }}>
                    {currentColor.toUpperCase()}'s Turn
                </div>

                {/* Ludo Board */}
                <div className="ludo-board">
                    {/* Home zones */}
                    {playerColors.map(color => (
                        <div key={color} className={`ludo-home ludo-home-${color}`} style={{ background: COLORS[color]?.light + '33' }}>
                            <div className="ludo-home-label">{color}</div>
                            {pieces[color].map(piece => (
                                piece.position === -1 && !piece.finished && (
                                    <div
                                        key={piece.id}
                                        className={`ludo-piece ${color === currentColor && rolled && diceValue === 6 ? 'movable' : ''}`}
                                        style={{ background: COLORS[color]?.bg }}
                                        onClick={() => movePiece(color, piece.id)}
                                    />
                                )
                            ))}
                        </div>
                    ))}

                    {/* Track pieces */}
                    <div className="ludo-track">
                        {playerColors.map(color =>
                            pieces[color].map(piece => (
                                piece.position >= 0 && !piece.finished && (
                                    <div
                                        key={`${color}-${piece.id}`}
                                        className={`ludo-piece ludo-piece-track ${color === currentColor && rolled ? 'movable' : ''}`}
                                        style={{
                                            background: COLORS[color]?.bg,
                                            ...getPositionStyle(color, piece.position)
                                        }}
                                        onClick={() => movePiece(color, piece.id)}
                                    >
                                        {piece.id + 1}
                                    </div>
                                )
                            ))
                        )}
                    </div>

                    {/* Center */}
                    <div className="ludo-center">
                        <DiceRoll value={diceValue} rolling={rolling} onRoll={rollDice} disabled={rolling || rolled} />
                    </div>
                </div>

                {/* Score */}
                <div className="ludo-scores">
                    {playerColors.map(color => (
                        <div key={color} className="ludo-score-item" style={{ borderColor: COLORS[color]?.bg }}>
                            <div className="ludo-score-dot" style={{ background: COLORS[color]?.bg }} />
                            <span>{color}: {scores[color]}/4</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
