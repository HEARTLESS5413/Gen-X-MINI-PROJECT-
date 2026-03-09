import React, { useEffect, useCallback } from 'react';

export default function CursorEffects() {
    const createSparkle = useCallback((x, y) => {
        const sparkle = document.createElement('div');
        sparkle.className = 'sparkle';
        const size = Math.random() * 8 + 4;
        const hue = Math.random() * 60 + 300; // pink-purple range
        sparkle.style.cssText = `
      position: fixed;
      pointer-events: none;
      z-index: 99999;
      left: ${x - size / 2}px;
      top: ${y - size / 2}px;
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      background: radial-gradient(circle, hsl(${hue}, 100%, 80%), hsl(${hue}, 100%, 50%));
      box-shadow: 0 0 ${size * 2}px hsl(${hue}, 100%, 60%), 0 0 ${size * 4}px hsl(${hue}, 100%, 40%);
      animation: sparkle-fade 0.6s ease-out forwards;
    `;
        document.body.appendChild(sparkle);
        setTimeout(() => sparkle.remove(), 600);
    }, []);

    const createClickRipple = useCallback((x, y) => {
        // Ring burst
        const ring = document.createElement('div');
        ring.className = 'click-ring';
        ring.style.cssText = `
      position: fixed;
      pointer-events: none;
      z-index: 99998;
      left: ${x}px;
      top: ${y}px;
      width: 0;
      height: 0;
      border-radius: 50%;
      border: 2px solid rgba(255, 0, 127, 0.8);
      transform: translate(-50%, -50%);
      animation: click-ring-expand 0.5s ease-out forwards;
    `;
        document.body.appendChild(ring);
        setTimeout(() => ring.remove(), 500);

        // Particle burst
        for (let i = 0; i < 8; i++) {
            const particle = document.createElement('div');
            const angle = (i / 8) * Math.PI * 2;
            const distance = 30 + Math.random() * 20;
            const hue = 320 + Math.random() * 40;
            particle.style.cssText = `
        position: fixed;
        pointer-events: none;
        z-index: 99998;
        left: ${x}px;
        top: ${y}px;
        width: 4px;
        height: 4px;
        border-radius: 50%;
        background: hsl(${hue}, 100%, 70%);
        box-shadow: 0 0 6px hsl(${hue}, 100%, 60%);
        transform: translate(-50%, -50%);
        animation: particle-burst 0.5s ease-out forwards;
        --dx: ${Math.cos(angle) * distance}px;
        --dy: ${Math.sin(angle) * distance}px;
      `;
            document.body.appendChild(particle);
            setTimeout(() => particle.remove(), 500);
        }
    }, []);

    useEffect(() => {
        let throttle = 0;
        const handleMouseMove = (e) => {
            const now = Date.now();
            if (now - throttle < 30) return;
            throttle = now;
            createSparkle(e.clientX + (Math.random() - 0.5) * 10, e.clientY + (Math.random() - 0.5) * 10);
        };

        const handleClick = (e) => {
            createClickRipple(e.clientX, e.clientY);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('click', handleClick);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('click', handleClick);
        };
    }, [createSparkle, createClickRipple]);

    return null;
}
