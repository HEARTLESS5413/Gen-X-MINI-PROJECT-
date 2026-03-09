import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, RotateCcw, Trophy, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CANVAS_W = 400;
const CANVAS_H = 600;
const BIRD_SIZE = 28;
const PIPE_W = 52;
const PIPE_GAP = 160;
const GRAVITY = 0.45;
const JUMP = -7;
const PIPE_SPEED = 2.5;

export default function FlappyBird() {
    const navigate = useNavigate();
    const canvasRef = useRef(null);
    const [gameState, setGameState] = useState('idle'); // idle, playing, p1done, p2playing, done
    const [scores, setScores] = useState({ p1: 0, p2: 0 });
    const [currentPlayer, setCurrentPlayer] = useState(1);
    const gameRef = useRef({ bird: { y: 250, vy: 0 }, pipes: [], score: 0, frame: 0 });

    const resetBird = () => {
        gameRef.current = {
            bird: { y: 250, vy: 0 },
            pipes: [],
            score: 0,
            frame: 0,
        };
    };

    const startGame = () => {
        resetBird();
        if (gameState === 'idle') {
            setCurrentPlayer(1);
            setScores({ p1: 0, p2: 0 });
        }
        setGameState(currentPlayer === 1 ? 'playing' : 'p2playing');
    };

    const jump = useCallback(() => {
        if (gameState === 'playing' || gameState === 'p2playing') {
            gameRef.current.bird.vy = JUMP;
        } else if (gameState === 'idle' || gameState === 'p1done') {
            startGame();
        }
    }, [gameState]);

    useEffect(() => {
        const handleKey = (e) => {
            if (e.code === 'Space' || e.code === 'ArrowUp') {
                e.preventDefault();
                jump();
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [jump]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let animId;

        const draw = () => {
            const g = gameRef.current;
            ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

            // Background gradient
            const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
            grad.addColorStop(0, '#0a0a2e');
            grad.addColorStop(0.5, '#16163a');
            grad.addColorStop(1, '#1a1a4e');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

            // Stars
            for (let i = 0; i < 30; i++) {
                const x = (i * 47 + g.frame * 0.2) % CANVAS_W;
                const y = (i * 31) % (CANVAS_H * 0.6);
                ctx.fillStyle = `rgba(255,255,255,${0.3 + Math.sin(g.frame * 0.05 + i) * 0.3})`;
                ctx.fillRect(x, y, 2, 2);
            }

            if (gameState === 'playing' || gameState === 'p2playing') {
                // Physics
                g.bird.vy += GRAVITY;
                g.bird.y += g.bird.vy;
                g.frame++;

                // Spawn pipes
                if (g.frame % 90 === 0) {
                    const gap = 100 + Math.random() * (CANVAS_H - 300);
                    g.pipes.push({ x: CANVAS_W, gapY: gap });
                }

                // Move pipes and check collision
                let hitPipe = false;
                g.pipes = g.pipes.filter(pipe => {
                    pipe.x -= PIPE_SPEED;

                    // Score
                    if (pipe.x + PIPE_W < CANVAS_W / 2 - 15 && !pipe.scored) {
                        pipe.scored = true;
                        g.score++;
                    }

                    // Collision
                    const birdL = CANVAS_W / 2 - BIRD_SIZE / 2;
                    const birdR = birdL + BIRD_SIZE;
                    const birdT = g.bird.y - BIRD_SIZE / 2;
                    const birdB = birdT + BIRD_SIZE;
                    if (birdR > pipe.x && birdL < pipe.x + PIPE_W) {
                        if (birdT < pipe.gapY || birdB > pipe.gapY + PIPE_GAP) hitPipe = true;
                    }

                    return pipe.x > -PIPE_W;
                });

                // Ground/ceiling
                if (g.bird.y < 0 || g.bird.y > CANVAS_H) hitPipe = true;

                if (hitPipe) {
                    if (currentPlayer === 1) {
                        setScores(prev => ({ ...prev, p1: g.score }));
                        setCurrentPlayer(2);
                        setGameState('p1done');
                    } else {
                        setScores(prev => ({ ...prev, p2: g.score }));
                        setGameState('done');
                    }
                }

                // Draw pipes (neon style)
                g.pipes.forEach(pipe => {
                    // Top pipe
                    ctx.fillStyle = '#00ff88';
                    ctx.shadowColor = '#00ff88';
                    ctx.shadowBlur = 15;
                    ctx.fillRect(pipe.x, 0, PIPE_W, pipe.gapY);
                    ctx.fillRect(pipe.x - 4, pipe.gapY - 20, PIPE_W + 8, 20);
                    // Bottom pipe
                    ctx.fillRect(pipe.x, pipe.gapY + PIPE_GAP, PIPE_W, CANVAS_H - pipe.gapY - PIPE_GAP);
                    ctx.fillRect(pipe.x - 4, pipe.gapY + PIPE_GAP, PIPE_W + 8, 20);
                    ctx.shadowBlur = 0;
                });
            }

            // Draw bird (neon circle)
            const birdX = CANVAS_W / 2;
            const birdY = gameState === 'idle' || gameState === 'p1done' ? 250 + Math.sin(Date.now() / 300) * 20 : g.bird.y;
            ctx.beginPath();
            ctx.arc(birdX, birdY, BIRD_SIZE / 2, 0, Math.PI * 2);
            ctx.fillStyle = currentPlayer === 1 ? '#ff6b6b' : '#4dabf7';
            ctx.shadowColor = currentPlayer === 1 ? '#ff6b6b' : '#4dabf7';
            ctx.shadowBlur = 20;
            ctx.fill();
            ctx.shadowBlur = 0;
            // Eye
            ctx.beginPath();
            ctx.arc(birdX + 6, birdY - 4, 4, 0, Math.PI * 2);
            ctx.fillStyle = 'white';
            ctx.fill();
            ctx.beginPath();
            ctx.arc(birdX + 7, birdY - 4, 2, 0, Math.PI * 2);
            ctx.fillStyle = '#000';
            ctx.fill();

            // Score display
            ctx.fillStyle = 'white';
            ctx.font = 'bold 48px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowBlur = 10;
            ctx.fillText(g.score, CANVAS_W / 2, 80);
            ctx.shadowBlur = 0;

            // Player indicator
            ctx.font = '16px Inter, sans-serif';
            ctx.fillStyle = currentPlayer === 1 ? '#ff6b6b' : '#4dabf7';
            ctx.fillText(`Player ${currentPlayer}`, CANVAS_W / 2, 110);

            animId = requestAnimationFrame(draw);
        };

        draw();
        return () => cancelAnimationFrame(animId);
    }, [gameState, currentPlayer]);

    const fullReset = () => {
        setGameState('idle');
        setCurrentPlayer(1);
        setScores({ p1: 0, p2: 0 });
        resetBird();
    };

    const winner = scores.p1 > scores.p2 ? 'Player 1' : scores.p2 > scores.p1 ? 'Player 2' : 'Tie';

    return (
        <div className="game-play-page">
            <div className="game-play-header">
                <button className="btn-ghost" onClick={() => navigate('/games')}>
                    <ArrowLeft size={22} />
                </button>
                <h2>🐦 Flappy Bird</h2>
                <button className="btn-ghost" onClick={fullReset}>
                    <RotateCcw size={20} />
                </button>
            </div>

            <div className="flappy-container" onClick={jump}>
                <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} className="flappy-canvas" />

                {(gameState === 'idle') && (
                    <div className="flappy-overlay">
                        <h3>🐦 Flappy Bird</h3>
                        <p>2-Player Challenge</p>
                        <p className="flappy-hint">Tap or press Space to start!</p>
                        <p className="flappy-hint" style={{ color: '#ff6b6b' }}>Player 1 goes first</p>
                    </div>
                )}

                {gameState === 'p1done' && (
                    <div className="flappy-overlay">
                        <h3 style={{ color: '#ff6b6b' }}>Player 1 Score: {scores.p1}</h3>
                        <p style={{ color: '#4dabf7' }}>Player 2's turn!</p>
                        <p className="flappy-hint">Tap to start</p>
                    </div>
                )}

                {gameState === 'done' && (
                    <div className="flappy-overlay">
                        <Trophy size={48} color="#ffd43b" />
                        <h3>Results</h3>
                        <div className="flappy-results">
                            <span style={{ color: '#ff6b6b' }}>P1: {scores.p1}</span>
                            <span>vs</span>
                            <span style={{ color: '#4dabf7' }}>P2: {scores.p2}</span>
                        </div>
                        <h2 className="flappy-winner">{winner}!</h2>
                        <button className="btn btn-primary" onClick={(e) => { e.stopPropagation(); fullReset(); }}>Play Again</button>
                    </div>
                )}
            </div>
        </div>
    );
}
