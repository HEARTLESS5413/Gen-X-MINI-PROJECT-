// ===== NOTIFICATION SOUNDS (Web Audio API — no external files needed) =====

let audioCtx = null;

function getCtx() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx;
}

function playTone(freq, duration = 0.15, type = 'sine', volume = 0.12) {
    try {
        const ctx = getCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(volume, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
    } catch (e) { /* ignore audio errors */ }
}

export const sounds = {
    // Soft chime for new notification
    notification() {
        playTone(880, 0.1, 'sine', 0.1);
        setTimeout(() => playTone(1100, 0.15, 'sine', 0.08), 100);
        setTimeout(() => playTone(1320, 0.2, 'sine', 0.06), 200);
    },

    // Gentle pop for new message
    message() {
        playTone(660, 0.08, 'sine', 0.1);
        setTimeout(() => playTone(880, 0.12, 'sine', 0.08), 80);
    },

    // Quick click for like
    like() {
        playTone(1200, 0.06, 'sine', 0.06);
    },

    // Soft whoosh for follow
    follow() {
        playTone(440, 0.1, 'triangle', 0.08);
        setTimeout(() => playTone(660, 0.15, 'triangle', 0.06), 100);
    },

    // Send message sound
    send() {
        playTone(500, 0.05, 'sine', 0.06);
        setTimeout(() => playTone(700, 0.08, 'sine', 0.05), 50);
    },
};

export default sounds;
