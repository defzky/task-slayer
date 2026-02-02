import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { playSound } from '../utils/soundfx';

const FocusTimer = ({ profile, updateProfile, onClose }) => {
    // Presets Configuration
    const PRESETS = [
        { label: 'Quick Focus', minutes: 15, xp: 30, color: 'from-blue-400 to-cyan-400' },
        { label: 'Pomodoro', minutes: 25, xp: 50, color: 'from-purple-400 to-indigo-400' },
        { label: 'Deep Work', minutes: 45, xp: 100, color: 'from-orange-400 to-red-400' },
        { label: 'Zen Mode', minutes: 60, xp: 150, color: 'from-emerald-400 to-green-600' }
    ];

    const [selectedPreset, setSelectedPreset] = useState(PRESETS[1]); // Default 25m
    const [timeLeft, setTimeLeft] = useState(PRESETS[1].minutes * 60);
    const [initialTime, setInitialTime] = useState(PRESETS[1].minutes * 60);
    const [isActive, setIsActive] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const timerRef = useRef(null);

    // Update time when preset changes (only if not active)
    useEffect(() => {
        if (!isActive) {
            setTimeLeft(selectedPreset.minutes * 60);
            setInitialTime(selectedPreset.minutes * 60);
        }
    }, [selectedPreset, isActive]);

    // Format Time: MM:SS
    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    // Timer Logic
    useEffect(() => {
        if (isActive && !isPaused && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0 && isActive) {
            handleComplete();
        }

        return () => clearInterval(timerRef.current);
    }, [isActive, isPaused, timeLeft]);

    const handleStart = () => {
        setIsActive(true);
        setIsPaused(false);
        playSound.click();
    };

    const handlePause = () => {
        setIsPaused(!isPaused);
        playSound.click();
    };

    const handleStop = () => {
        if (window.confirm("Abandon your focus session? No rewards will be given.")) {
            setIsActive(false);
            setIsPaused(false);
            setTimeLeft(selectedPreset.minutes * 60);
            onClose();
        }
    };

    const handleComplete = () => {
        setIsActive(false);
        clearInterval(timerRef.current);
        playSound.levelUp(); // Victory sound
        confetti({ particleCount: 300, spread: 150, colors: ['#00ff00', '#00ffff'] });

        // Calculate Rewards
        const baseXp = selectedPreset.xp;
        const xpReward = baseXp + (profile.unlockedSkills?.includes('deep_work') ? 25 : 0);
        const goldReward = Math.floor(baseXp / 3);
        const minutes = selectedPreset.minutes;

        // Update Stats & History
        const today = new Date().toDateString();
        const history = profile.history || [];
        const todayEntry = history.find(h => h.date === today) || { date: today, xp: 0, gold: 0, quests: 0, focusMinutes: 0 };

        const updatedHistoryEntry = {
            ...todayEntry,
            xp: (todayEntry.xp || 0) + xpReward,
            gold: (todayEntry.gold || 0) + goldReward,
            focusMinutes: (todayEntry.focusMinutes || 0) + minutes
        };

        let newHistory;
        const entryIndex = history.findIndex(h => h.date === today);
        if (entryIndex >= 0) {
            newHistory = [...history];
            newHistory[entryIndex] = updatedHistoryEntry;
        } else {
            newHistory = [...history, updatedHistoryEntry];
        }

        const newProfile = {
            ...profile,
            xp: profile.xp + xpReward,
            gold: (profile.gold || 0) + goldReward,
            history: newHistory
        };

        updateProfile(newProfile);

        toast.success(
            <div className="flex flex-col">
                <span className="font-bold text-lg">🧠 Focus Session Complete!</span>
                <span>+{xpReward} XP | +{goldReward} Gold</span>
            </div>,
            { duration: 5000 }
        );

        setTimeLeft(selectedPreset.minutes * 60);
        // Reset to allow new session
        setIsActive(false);
    };

    // Helper for Progress Ring
    const radius = 120;
    const circumference = 2 * Math.PI * radius;
    const progress = isActive ? ((initialTime - timeLeft) / initialTime) * circumference : 0;
    // We want it to "empty" or "fill"? Let's make it fill.
    // Actually typically timers empty. Let's make it empty.
    const dashOffset = isActive ? ((initialTime - timeLeft) / initialTime) * circumference : 0;

    return (
        <div className="fixed inset-0 z-[100] bg-[#050505] flex flex-col items-center justify-center animate-in fade-in duration-500 font-sans">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className={`absolute inset-0 bg-gradient-to-b ${selectedPreset.color} opacity-5 transition-colors duration-1000`}></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 rounded-full blur-[100px] opacity-20 animate-pulse-slow"></div>
            </div>

            <div className="relative z-10 flex flex-col items-center w-full max-w-md px-4">

                {/* Timer Display (Ring) */}
                <div className="relative w-80 h-80 flex items-center justify-center mb-10">
                    {/* SVG Progress Ring */}
                    <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
                        <circle
                            cx="160" cy="160" r={radius}
                            className="stroke-[#333] stroke-[8px] fill-transparent"
                        />
                        <circle
                            cx="160" cy="160" r={radius}
                            className={`stroke-current text-white stroke-[8px] fill-transparent transition-all duration-1000 ease-linear ${isActive ? 'opacity-100' : 'opacity-30'}`}
                            strokeDasharray={circumference}
                            strokeDashoffset={dashOffset}
                            strokeLinecap="round"
                        />
                    </svg>

                    {/* Time Text */}
                    <div className="flex flex-col items-center">
                        <div className={`text-7xl font-bold tracking-tighter tabular-nums text-transparent bg-clip-text bg-gradient-to-br ${selectedPreset.color} drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-all duration-300`}>
                            {formatTime(timeLeft)}
                        </div>
                        <div className="text-gray-500 font-mono mt-2 text-sm uppercase tracking-widest">
                            {isActive ? (isPaused ? 'PAUSED' : 'FOCUSING') : 'READY'}
                        </div>
                    </div>
                </div>

                {/* Mode Selection (Only when not active) */}
                {!isActive && (
                    <div className="grid grid-cols-2 gap-3 w-full mb-10 animate-in slide-in-from-bottom-4 fade-in">
                        {PRESETS.map((p) => (
                            <button
                                key={p.label}
                                onClick={() => setSelectedPreset(p)}
                                className={`p-4 rounded-xl border border-[#333] transition-all flex flex-col items-center gap-1 group
                                    ${selectedPreset.label === p.label
                                        ? `bg-gradient-to-br ${p.color} border-transparent text-white shadow-lg scale-105`
                                        : 'bg-[#151515] hover:bg-[#222] text-gray-400 hover:text-white hover:border-[#555]'
                                    }`}
                            >
                                <span className="font-bold text-lg">{p.minutes}m</span>
                                <span className={`text-[10px] uppercase tracking-wider font-bold ${selectedPreset.label === p.label ? 'text-white/80' : 'text-gray-600'}`}>{p.label}</span>
                                <span className="text-xs bg-black/20 px-2 py-0.5 rounded-full mt-1">+{p.xp} XP</span>
                            </button>
                        ))}
                    </div>
                )}

                {/* Controls */}
                <div className="flex gap-4 w-full">
                    {!isActive ? (
                        <button
                            onClick={handleStart}
                            className={`flex-1 bg-gradient-to-r ${selectedPreset.color} text-black font-bold text-xl py-4 rounded-2xl shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] transition-all active:scale-95`}
                        >
                            Start Session
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={handlePause}
                                className="flex-1 bg-[#222] border border-[#444] text-white font-bold text-lg py-4 rounded-2xl hover:bg-[#333] transition-colors"
                            >
                                {isPaused ? 'Resume' : 'Pause'}
                            </button>
                            <button
                                onClick={handleStop}
                                className="flex-1 bg-red-500/10 border border-red-500/50 text-red-500 font-bold text-lg py-4 rounded-2xl hover:bg-red-500/20 transition-colors"
                            >
                                Give Up
                            </button>
                        </>
                    )}
                </div>

                {!isActive && (
                    <button onClick={onClose} className="mt-8 text-gray-600 hover:text-gray-400 text-sm">Cancel</button>
                )}
            </div>
        </div>
    );
};

export default FocusTimer;
