import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Video as VideoIcon, VideoOff, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { submitMove, updateGameState, finishGame, pollGameState, updatePlayerScore, leaveGame } from '../lib/gameEngine';

const EMPTY_BOARD = Array(9).fill(null);

function checkWinner(board) {
    const lines = [
        [0,1,2],[3,4,5],[6,7,8],
        [0,3,6],[1,4,7],[2,5,8],
        [0,4,8],[2,4,6],
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
    const [playerLeft, setPlayerLeft] = useState(false);
    const [isMicOn, setIsMicOn] = useState(false);
    const [isCamOn, setIsCamOn] = useState(false);
    const localStreamRef = useRef(null);
    const localVideoRef = useRef(null);
    const floatingCamRef = useRef(null);
    const pollRef = useRef(null);

    const opponent = players.find(p => p.user_id !== currentUser?.id);

    useEffect(() => {
        const isFirstPlayer = players[0]?.user_id === currentUser?.id;
        setMySymbol(isFirstPlayer ? 'X' : 'O');

        if (session?.game_state?.board) {
            setBoard(session.game_state.board);
            setCurrentTurn(session.game_state.currentTurn || 'X');
        }

        pollRef.current = pollGameState(sessionId, ({ session: sess }) => {
            if (!sess) return;

            // Check if opponent left
            if (sess.game_state?.playerLeft && sess.game_state.playerLeft !== currentUser?.id) {
                setPlayerLeft(true);
                return;
            }

            if (sess?.game_state?.board) {
                setBoard(sess.game_state.board);
                setCurrentTurn(sess.game_state.currentTurn || 'X');

                const result = checkWinner(sess.game_state.board);
                if (result && !gameResult) {
                    setGameResult(result);
                    setWinLine(result.line);
                }
            }
            if (sess?.status === 'finished' && !playerLeft) {
                if (sess.game_state?.playerLeft && sess.game_state.playerLeft !== currentUser?.id) {
                    setPlayerLeft(true);
                } else if (!gameResult) {
                    onClose();
                }
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

    const handleCellClick = async (index) => {
        if (board[index] || gameResult) return;
        if (currentTurn !== mySymbol) return;

        const newBoard = [...board];
        newBoard[index] = mySymbol;
        const nextTurn = mySymbol === 'X' ? 'O' : 'X';

        setBoard(newBoard);
        setCurrentTurn(nextTurn);

        await updateGameState(sessionId, { board: newBoard, currentTurn: nextTurn });

        const result = checkWinner(newBoard);
        if (result) {
            setGameResult(result);
            setWinLine(result.line);

            setTimeout(async () => {
                if (result.winner === 'draw') {
                    await finishGame(sessionId, null);
                } else {
                    const isFirst = players[0]?.user_id === currentUser?.id;
                    const winnerId = (result.winner === 'X') === isFirst ? currentUser.id : opponent.user_id;
                    await updatePlayerScore(sessionId, winnerId, 1);
                    await finishGame(sessionId, winnerId);
                }
            }, 2000);
        }

        await submitMove(sessionId, currentUser.id, `${mySymbol}:${index}`);
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

    const isMyTurn = currentTurn === mySymbol;

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
            <div className="game-modal game-ttt">
                <div className="game-header">
                    <h2>Tic Tac Toe</h2>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span className="game-round-badge">You are {mySymbol}</span>
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

                <div className="ttt-turn-indicator">
                    {gameResult ? (
                        gameResult.winner === 'draw' ? '🤝 Draw!' :
                        gameResult.winner === mySymbol ? '🎉 You Win!' : '😤 Opponent Wins!'
                    ) : (
                        isMyTurn ? '🟢 Your turn' : '⏳ Opponent\'s turn'
                    )}
                </div>

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

            {/* Floating camera */}
            {isCamOn && (
                <div className="game-floating-cam" ref={floatingCamRef} onMouseDown={handleCamDrag} onTouchStart={handleCamDrag}>
                    <video ref={localVideoRef} autoPlay muted playsInline />
                </div>
            )}
        </div>
    );
}
