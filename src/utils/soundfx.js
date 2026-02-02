// Retro Sound Effects using Web Audio API
// No mp3 files required!

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

const playTone = (freq, type, duration, release = 0.1) => {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration + release);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + duration + release);
};

export const playSound = {
    coin: () => {
        // "Bling!" - High pitch sine/triangle
        playTone(1200, 'sine', 0.1);
        setTimeout(() => playTone(1600, 'sine', 0.2), 50);
    },

    levelUp: () => {
        // "Da-da-da-DAAA!" - Arpeggio
        const now = audioCtx.currentTime;
        [440, 554, 659, 880].forEach((freq, i) => {
            setTimeout(() => playTone(freq, 'square', 0.1, 0.3), i * 100);
        });
    },

    click: () => {
        // Subtle click
        playTone(800, 'triangle', 0.05, 0.05);
    },

    error: () => {
        // Low buzz
        playTone(150, 'sawtooth', 0.2);
    },

    bossHit: () => {
        // Heavy impact - Low freq square with quick decay
        playTone(100, 'square', 0.1, 0.05);
        setTimeout(() => playTone(80, 'sawtooth', 0.1, 0.1), 50);
    },

    bossDie: () => {
        // Epic Victory - Slower Arpeggio with harmony
        const now = audioCtx.currentTime;
        [220, 330, 440, 554, 659, 880, 1109].forEach((freq, i) => {
            setTimeout(() => playTone(freq, 'sawtooth', 0.2, 0.5), i * 150);
        });
        // Bass drop
        setTimeout(() => playTone(110, 'square', 0.8, 0.5), 1000);
    },

    freeze: () => {
        // "Shatter/Ice" - High freq sine sweep down + noise-like effect
        playTone(3000, 'sine', 0.1, 0.2); // High cling
        setTimeout(() => playTone(2500, 'triangle', 0.1, 0.2), 50);
        setTimeout(() => playTone(500, 'sawtooth', 0.3, 0.1), 100); // Low crack
    }
};
