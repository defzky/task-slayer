// Retro Sound Effects using Web Audio API
// No mp3 files required!

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

const playTone = (freq: number, type: OscillatorType, duration: number, release = 0.1) => {
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
        playTone(1200, 'sine', 0.1);
        setTimeout(() => playTone(1600, 'sine', 0.2), 50);
    },

    levelUp: () => {
        [440, 554, 659, 880].forEach((freq, i) => {
            setTimeout(() => playTone(freq, 'square', 0.1, 0.3), i * 100);
        });
    },

    click: () => {
        playTone(800, 'triangle', 0.05, 0.05);
    },

    error: () => {
        playTone(150, 'sawtooth', 0.2);
    },

    bossHit: () => {
        playTone(100, 'square', 0.1, 0.05);
        setTimeout(() => playTone(80, 'sawtooth', 0.1, 0.1), 50);
    },

    bossDie: () => {
        [220, 330, 440, 554, 659, 880, 1109].forEach((freq, i) => {
            setTimeout(() => playTone(freq, 'sawtooth', 0.2, 0.5), i * 150);
        });
        setTimeout(() => playTone(110, 'square', 0.8, 0.5), 1000);
    },

    heal: () => {
        playTone(600, 'sine', 0.15);
        setTimeout(() => playTone(800, 'sine', 0.15), 100);
        setTimeout(() => playTone(1000, 'sine', 0.2), 200);
    }
};
