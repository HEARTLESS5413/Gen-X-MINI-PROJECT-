import React, { useState, useCallback } from 'react';
import { ArrowLeft, RotateCcw, Trophy, Flag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const INITIAL_BOARD = [
    ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
    ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
    ['.', '.', '.', '.', '.', '.', '.', '.'],
    ['.', '.', '.', '.', '.', '.', '.', '.'],
    ['.', '.', '.', '.', '.', '.', '.', '.'],
    ['.', '.', '.', '.', '.', '.', '.', '.'],
    ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
    ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'],
];

const PIECE_SYMBOLS = {
    'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
    'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟',
};

function isWhite(piece) { return piece === piece.toUpperCase() && piece !== '.'; }
function isBlack(piece) { return piece === piece.toLowerCase() && piece !== '.'; }
function isPiece(piece) { return piece !== '.'; }

function getValidMoves(board, row, col) {
    const piece = board[row][col];
    if (piece === '.') return [];
    const moves = [];
    const white = isWhite(piece);
    const type = piece.toLowerCase();

    const inBounds = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;
    const isEnemy = (r, c) => inBounds(r, c) && isPiece(board[r][c]) && (white ? isBlack(board[r][c]) : isWhite(board[r][c]));
    const isEmpty = (r, c) => inBounds(r, c) && board[r][c] === '.';
    const canMoveTo = (r, c) => isEmpty(r, c) || isEnemy(r, c);

    if (type === 'p') {
        const dir = white ? -1 : 1;
        const startRow = white ? 6 : 1;
        if (isEmpty(row + dir, col)) {
            moves.push([row + dir, col]);
            if (row === startRow && isEmpty(row + 2 * dir, col)) moves.push([row + 2 * dir, col]);
        }
        if (isEnemy(row + dir, col - 1)) moves.push([row + dir, col - 1]);
        if (isEnemy(row + dir, col + 1)) moves.push([row + dir, col + 1]);
    }

    if (type === 'r' || type === 'q') {
        for (const [dr, dc] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
            for (let i = 1; i < 8; i++) {
                const nr = row + dr * i, nc = col + dc * i;
                if (!inBounds(nr, nc)) break;
                if (isEmpty(nr, nc)) moves.push([nr, nc]);
                else if (isEnemy(nr, nc)) { moves.push([nr, nc]); break; }
                else break;
            }
        }
    }

    if (type === 'b' || type === 'q') {
        for (const [dr, dc] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
            for (let i = 1; i < 8; i++) {
                const nr = row + dr * i, nc = col + dc * i;
                if (!inBounds(nr, nc)) break;
                if (isEmpty(nr, nc)) moves.push([nr, nc]);
                else if (isEnemy(nr, nc)) { moves.push([nr, nc]); break; }
                else break;
            }
        }
    }

    if (type === 'n') {
        for (const [dr, dc] of [[2, 1], [2, -1], [-2, 1], [-2, -1], [1, 2], [1, -2], [-1, 2], [-1, -2]]) {
            if (canMoveTo(row + dr, col + dc)) moves.push([row + dr, col + dc]);
        }
    }

    if (type === 'k') {
        for (const [dr, dc] of [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
            if (canMoveTo(row + dr, col + dc)) moves.push([row + dr, col + dc]);
        }
    }

    return moves;
}

export default function ChessGame() {
    const navigate = useNavigate();
    const [board, setBoard] = useState(INITIAL_BOARD.map(r => [...r]));
    const [selected, setSelected] = useState(null);
    const [validMoves, setValidMoves] = useState([]);
    const [turn, setTurn] = useState('white');
    const [captured, setCaptured] = useState({ white: [], black: [] });
    const [moveHistory, setMoveHistory] = useState([]);
    const [gameOver, setGameOver] = useState(null);

    const handleCellClick = useCallback((row, col) => {
        if (gameOver) return;
        const piece = board[row][col];

        if (selected) {
            const isValid = validMoves.some(([r, c]) => r === row && c === col);
            if (isValid) {
                const newBoard = board.map(r => [...r]);
                const capturedPiece = newBoard[row][col];

                // Capture
                if (isPiece(capturedPiece)) {
                    const side = isWhite(capturedPiece) ? 'white' : 'black';
                    setCaptured(prev => ({ ...prev, [side]: [...prev[side], capturedPiece] }));

                    if (capturedPiece.toLowerCase() === 'k') {
                        setGameOver(turn === 'white' ? 'White' : 'Black');
                    }
                }

                newBoard[row][col] = newBoard[selected[0]][selected[1]];
                newBoard[selected[0]][selected[1]] = '.';

                // Pawn promotion
                if (newBoard[row][col].toLowerCase() === 'p' && (row === 0 || row === 7)) {
                    newBoard[row][col] = turn === 'white' ? 'Q' : 'q';
                }

                setBoard(newBoard);
                setMoveHistory(prev => [...prev, {
                    piece: newBoard[row][col],
                    from: selected,
                    to: [row, col],
                    captured: capturedPiece !== '.' ? capturedPiece : null
                }]);
                setTurn(turn === 'white' ? 'black' : 'white');
                setSelected(null);
                setValidMoves([]);
            } else if (isPiece(piece) && ((turn === 'white' && isWhite(piece)) || (turn === 'black' && isBlack(piece)))) {
                setSelected([row, col]);
                setValidMoves(getValidMoves(board, row, col));
            } else {
                setSelected(null);
                setValidMoves([]);
            }
        } else {
            if (isPiece(piece) && ((turn === 'white' && isWhite(piece)) || (turn === 'black' && isBlack(piece)))) {
                setSelected([row, col]);
                setValidMoves(getValidMoves(board, row, col));
            }
        }
    }, [board, selected, validMoves, turn, gameOver]);

    const resetGame = () => {
        setBoard(INITIAL_BOARD.map(r => [...r]));
        setSelected(null);
        setValidMoves([]);
        setTurn('white');
        setCaptured({ white: [], black: [] });
        setMoveHistory([]);
        setGameOver(null);
    };

    return (
        <div className="game-play-page">
            <div className="game-play-header">
                <button className="btn-ghost" onClick={() => navigate('/games')}>
                    <ArrowLeft size={22} />
                </button>
                <h2>♟️ Chess</h2>
                <button className="btn-ghost" onClick={resetGame}>
                    <RotateCcw size={20} />
                </button>
            </div>

            {gameOver && (
                <div className="game-winner-overlay">
                    <div className="game-winner-card">
                        <Trophy size={48} />
                        <h2>{gameOver} Wins!</h2>
                        <button className="btn btn-primary" onClick={resetGame}>Play Again</button>
                    </div>
                </div>
            )}

            <div className="chess-container">
                {/* Captured pieces - Black */}
                <div className="chess-captured">
                    <span className="chess-captured-label">Black captured:</span>
                    {captured.black.map((p, i) => <span key={i} className="chess-captured-piece">{PIECE_SYMBOLS[p]}</span>)}
                </div>

                <div className="chess-turn-indicator">
                    <div className={`chess-turn-dot ${turn}`} />
                    {turn === 'white' ? '⬜ White' : '⬛ Black'}'s Turn
                </div>

                <div className="chess-board">
                    {board.map((row, r) =>
                        row.map((cell, c) => {
                            const isDark = (r + c) % 2 === 1;
                            const isSelected = selected && selected[0] === r && selected[1] === c;
                            const isValidMove = validMoves.some(([vr, vc]) => vr === r && vc === c);
                            const isCapture = isValidMove && isPiece(cell);

                            return (
                                <div
                                    key={`${r}-${c}`}
                                    className={`chess-cell ${isDark ? 'dark' : 'light'} ${isSelected ? 'selected' : ''} ${isValidMove ? 'valid-move' : ''} ${isCapture ? 'capture' : ''}`}
                                    onClick={() => handleCellClick(r, c)}
                                >
                                    {isPiece(cell) && (
                                        <span className={`chess-piece ${isWhite(cell) ? 'white-piece' : 'black-piece'}`}>
                                            {PIECE_SYMBOLS[cell]}
                                        </span>
                                    )}
                                    {isValidMove && !isCapture && <div className="chess-dot" />}
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Captured pieces - White */}
                <div className="chess-captured">
                    <span className="chess-captured-label">White captured:</span>
                    {captured.white.map((p, i) => <span key={i} className="chess-captured-piece">{PIECE_SYMBOLS[p]}</span>)}
                </div>

                {/* Move history */}
                <div className="chess-history">
                    {moveHistory.slice(-6).map((move, i) => (
                        <span key={i} className="chess-move">
                            {PIECE_SYMBOLS[move.piece]} {String.fromCharCode(97 + move.to[1])}{8 - move.to[0]}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}
