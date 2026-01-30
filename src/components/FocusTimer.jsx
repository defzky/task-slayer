import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { playSound } from '../utils/soundfx';

const FocusTimer = ({ profile, updateProfile, onClose }) => {
    const DEFAULT_TIME = 25 * 60; // 25 minutes
    const [timeLeft, setTimeLeft] = useState(DEFAULT_TIME);
    const [isActive, setIsActive] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [sessionCount, setSessionCount] = useState(0);
    const timerRef = useRef(null);

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

                // Reward 1 XP every minute (optional, or just lump sum at end)
                // Let's do lump sum to prevent spamming updates, but maybe track minutes?
            }, 1000);
        } else if (timeLeft === 0) {
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
            setTimeLeft(DEFAULT_TIME);
            onClose(); // Exit mode
        }
    };

    const handleComplete = () => {
        setIsActive(false);
        clearInterval(timerRef.current);
        playSound.levelUp(); // Victory sound
        confetti({ particleCount: 300, spread: 150, colors: ['#00ff00', '#00ffff'] });

        // Calculate Rewards
        const xpReward = 50 + (profile.unlockedSkills?.includes('deep_work') ? 25 : 0);
        const goldReward = 10;
        const minutes = DEFAULT_TIME / 60;

        // Update Stats & History
        const currentStats = profile.stats || {};
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

        setSessionCount(c => c + 1);
        setTimeLeft(DEFAULT_TIME);
        // Don't close immediately, let them bask or start another
    };

    return (
        <div className="fixed inset-0 z-[100] bg-[#050505] flex flex-col items-center justify-center animate-in fade-in duration-500">
            {/* Ambient Background Animation */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className={`absolute inset-0 bg-gradient-to-b from-purple-900/10 to-blue-900/10 ${isActive && !isPaused ? 'animate-pulse-slow' : ''}`}></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-3xl"></div>
            </div>

            {/* Main Timer UI */}
            <div className="relative z-10 flex flex-col items-center">
                <div className="text-[#00f7ff] text-9xl font-mono font-bold tracking-widest drop-shadow-[0_0_30px_rgba(0,247,255,0.4)] mb-8 tabular-nums">
                    {formatTime(timeLeft)}
                </div>

                <div className="flex items-center gap-6">
                    {!isActive ? (
                        <button
                            onClick={handleStart}
                            className="bg-[#00f7ff] hover:bg-[#00c4cc] text-black font-bold text-xl py-3 px-10 rounded-full shadow-[0_0_20px_rgba(0,247,255,0.4)] transition-all hover:scale-105"
                        >
                            START FOCUS
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={handlePause}
                                className={`font-bold text-xl py-3 px-8 rounded-full border-2 transition-all ${isPaused
                                        ? 'bg-[#d4af37] border-[#d4af37] text-black hover:bg-[#b09030]'
                                        : 'border-[#00f7ff] text-[#00f7ff] hover:bg-[#00f7ff]/10'
                                    }`}
                            >
                                {isPaused ? 'RESUME' : 'PAUSE'}
                            </button>
                            <button
                                onClick={handleStop}
                                className="text-red-500 hover:text-red-400 font-bold text-lg px-6 py-3 hover:bg-red-500/10 rounded-full transition-colors"
                            >
                                GIVE UP
                            </button>
                        </>
                    )}
                </div>

                {!isActive && (
                    <button
                        onClick={onClose}
                        className="mt-12 text-gray-500 hover:text-white transition-colors text-sm uppercase tracking-widest"
                    >
                        Exit Focus Mode
                    </button>
                )}

                {/* Session Info */}
                <div className="mt-8 text-gray-400 font-mono text-sm">
                    Session Goal: 25 Minutes | Reward: 50 XP
                </div>

                {/* Breathing Text Guide */}
                {isActive && !isPaused && (
                    <div className="mt-12 text-purple-300/50 text-xl font-serif animate-pulse italic">
                        "Focus on the task..."
                    </div>
                )}
            </div>
        </div>
    );
};

export default FocusTimer;
