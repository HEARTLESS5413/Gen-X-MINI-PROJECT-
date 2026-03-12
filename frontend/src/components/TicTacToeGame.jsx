import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { submitMove, updateGameState, finishGame, pollGameState, updatePlayerScore } from '../lib/gameEngine';

const EMPTY_BOARD = Array(9).fill(null);

function checkWinner(board) {
    const lines = [
        [0,1,2],[3,4,5],[6,7,8], // rows
        [0,3,6],[1,4,7],[2,5,8], // cols
        [0,4,8],[2,4,6],          // diags
    ];
    for (const [a,b,c] of lines) {
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return { winner: board[a], line: [a,b,c] };
        }
    }
    if (board.every(cell => cell !== null)) return { winner: 'draw', line: [] };
    return null;
}

export default function TicTacToeGame({ sessionId, session, players, playerUsers, onClose }) {
    const { user: currentUser } = useAuth();
    const [board, setBoard] = useState(EMPTY_BOARD);
    const [mySymbol, setMySymbol] = useState(null);
    const [currentTurn, setCurrentTurn] = useState('X');
    const [gameResult, setGameResult] = useState(null);
    const [winLine, setWinLine] = useState([]);
    const pollRef = useRef(null);

    const opponent = players.find(p => p.user_id !== currentUser?.id);

    useEffect(() => {
        // Assign symbols based on join order
        const isFirstPlayer = players[0]?.user_id === currentUser?.id;
        setMySymbol(isFirstPlayer ? 'X' : 'O');

        // Load initial game state
        if (session?.game_state?.board) {
            setBoard(session.game_state.board);
            setCurrentTurn(session.game_state.currentTurn || 'X');
        }

        // Poll for game state
        pollRef.current = pollGameState(sessionId, ({ session: sess }) => {
            if (sess?.game_state?.board) {
                setBoard(sess.game_state.board);
                setCurrentTurn(sess.game_state.currentTurn || 'X');

                // Check winner
                const result = checkWinner(sess.game_state.board);
                if (result && !gameResult) {
                    setGameResult(result);
                    setWinLine(result.line);
                }
            }
            if (sess?.status === 'finished') {
                onClose();
            }
        }, 800);

        return () => { if (pollRef.current) pollRef.current(); };
    }, [sessionId]);

    const handleCellClick = async (index) => {
        if (board[index] || gameResult) return;
        if (currentTurn !== mySymbol) return; // not my turn

        const newBoard = [...board];
        newBoard[index] = mySymbol;
        const nextTurn = mySymbol === 'X' ? 'O' : 'X';

        setBoard(newBoard);
        setCurrentTurn(nextTurn);

        // Update in DB
        await updateGameState(sessionId, {
            board: newBoard,
            currentTurn: nextTurn,
        });

        // Check for winner
        const result = checkWinner(newBoard);
        if (result) {
            setGameResult(result);
            setWinLine(result.line);

            // Determine winner
            setTimeout(async () => {
                if (result.winner === 'draw') {
                    await finishGame(sessionId, null);
                } else {
                    const winnerSymbol = result.winner;
                    const isFirst = players[0]?.user_id === currentUser?.id;
                    const winnerId = (winnerSymbol === 'X') === isFirst ? currentUser.id : opponent.user_id;
                    await updatePlayerScore(sessionId, winnerId, 1);
                    await finishGame(sessionId, winnerId);
                }
            }, 2000);
        }

        // Also submit move for tracking
        await submitMove(sessionId, currentUser.id, `${mySymbol}:${index}`);
    };

    const isMyTurn = currentTurn === mySymbol;

    return (
        <div className="game-overlay">
            <div className="game-modal game-ttt">
                <div className="game-header">
                    <h2>Tic Tac Toe</h2>
                    <span className="game-round-badge">You are {mySymbol}</span>
                </div>

                {/* Players */}
                <div className="game-rps-score">
                    <div className={`rps-player ${isMyTurn ? 'active-turn' : ''}`}>
                        <img src={currentUser?.avatar} alt="" className="rps-avatar" />
                        <span className="rps-name">You ({mySymbol})</span>
                    </div>
                    <span className="rps-vs">VS</span>
                    <div className={`rps-player ${!isMyTurn ? 'active-turn' : ''}`}>
                        <img src={playerUsers[opponent?.user_id]?.avatar} alt="" className="rps-avatar" />
                        <span className="rps-name">{playerUsers[opponent?.user_id]?.username} ({mySymbol === 'X' ? 'O' : 'X'})</span>
                    </div>
                </div>

                {/* Turn indicator */}
                <div className="ttt-turn-indicator">
                    {gameResult ? (
                        gameResult.winner === 'draw' ? '🤝 Draw!' :
                        gameResult.winner === mySymbol ? '🎉 You Win!' : '😤 Opponent Wins!'
                    ) : (
                        isMyTurn ? '🟢 Your turn' : '⏳ Opponent\'s turn'
                    )}
                </div>

                {/* Board */}
                <div className="ttt-board">
                    {board.map((cell, i) => (
                        <button
                            key={i}
                            className={`ttt-cell ${cell ? 'filled' : ''} ${cell === 'X' ? 'x' : cell === 'O' ? 'o' : ''} ${winLine.includes(i) ? 'win' : ''} ${!cell && isMyTurn && !gameResult ? 'clickable' : ''}`}
                            onClick={() => handleCellClick(i)}
                            disabled={!!cell || !isMyTurn || !!gameResult}
                        >
                            {cell && <span className="ttt-symbol">{cell}</span>}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
