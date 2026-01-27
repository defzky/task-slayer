import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { playSound } from '../utils/soundfx';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Sortable Item Component
const SortableQuestItem = ({ quest, children }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: quest.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            {children}
        </div>
    );
};

const Quests = ({ profile, updateProfile, avatar, confettiStyle, soundEnabled }) => {
    // profile is now a prop
    const [quests, setQuests] = useState([]);
    const [newQuestTitle, setNewQuestTitle] = useState('');
    const [isBossMode, setIsBossMode] = useState(false);
    const [streak, setStreak] = useState(0);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Load data on mount
    useEffect(() => {
        const loadData = (result) => {
            // Profile is handled by parent App.jsx
            if (result.quests) setQuests(result.quests);

            // Daily Streak Logic
            const today = new Date().toDateString();
            const lastLogin = result.lastLoginDate;
            let currentStreak = result.dailyStreak || 0;
            let streakBonus = false;

            if (lastLogin !== today) {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);

                if (lastLogin === yesterday.toDateString()) {
                    currentStreak += 1;
                    streakBonus = true; // Flag to show user they kept the streak
                } else {
                    currentStreak = 1; // Reset or Start new
                }

                // Save new streak data
                const updates = { lastLoginDate: today, dailyStreak: currentStreak };
                if (chrome?.storage?.sync) {
                    chrome.storage.sync.set(updates);
                } else if (chrome?.storage?.local) {
                    chrome.storage.local.set(updates);
                } else {
                    localStorage.setItem('lastLoginDate', today);
                    localStorage.setItem('dailyStreak', currentStreak);
                }

                // Bonus XP for logging in (if maintained streak)
                if (streakBonus) {
                    // We'll handle XP update via existing profile state update mechanism if needed, 
                    // but for simplicity let's just show it in UI for now
                    console.log("Streak kept! +10 XP potentially");
                }
            }
            setStreak(currentStreak);
        };

        if (chrome?.storage?.sync) {
            chrome.storage.sync.get(['quests', 'dailyStreak', 'lastLoginDate'], (syncRes) => {
                if (Object.keys(syncRes).length > 0) {
                    loadData(syncRes);
                } else {
                    // Try Local (Migration)
                    chrome.storage.local.get(['quests', 'dailyStreak', 'lastLoginDate'], (localRes) => {
                        if (Object.keys(localRes).length > 0) {
                            loadData(localRes);
                            chrome.storage.sync.set(localRes); // Migrate
                        } else {
                            loadData({});
                        }
                    });
                }
            });
        } else if (chrome?.storage?.local) {
            chrome.storage.local.get(['rpgProfile', 'quests', 'dailyStreak', 'lastLoginDate'], loadData);
        } else {
            // Mock for local dev
            const savedProfile = localStorage.getItem('rpgProfile');
            const savedQuests = localStorage.getItem('quests');
            const dailyStreak = localStorage.getItem('dailyStreak') ? parseInt(localStorage.getItem('dailyStreak')) : 0;
            const lastLoginDate = localStorage.getItem('lastLoginDate');

            loadData({
                rpgProfile: savedProfile ? JSON.parse(savedProfile) : null,
                quests: savedQuests ? JSON.parse(savedQuests) : null,
                dailyStreak,
                lastLoginDate
            });
        }
    }, []);

    const saveState = (newProfile, newQuests) => {
        if (newProfile) updateProfile(newProfile); // Use prop
        if (newQuests) setQuests(newQuests);

        const data = {};
        if (newQuests) data.quests = newQuests;

        if (chrome?.storage?.sync) {
            chrome.storage.sync.set(data);
        } else if (chrome?.storage?.local) {
            chrome.storage.local.set(data);
        } else {
            if (newQuests) localStorage.setItem('quests', JSON.stringify(newQuests));
        }
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (active.id !== over.id) {
            const oldIndex = quests.findIndex((q) => q.id === active.id);
            const newIndex = quests.findIndex((q) => q.id === over.id);
            const newQuests = arrayMove(quests, oldIndex, newIndex);
            // Optimistic update
            setQuests(newQuests);
            saveState(null, newQuests);
        }
    };

    const addQuest = (e) => {
        e.preventDefault();
        if (!newQuestTitle.trim()) return;

        const newQuest = {
            id: Date.now(),
            title: newQuestTitle,
            type: isBossMode ? 'boss' : 'normal',
            xpReward: isBossMode ? 500 : Math.floor(Math.random() * 30) + 20, // Huge XP for Boss
            hp: isBossMode ? 100 : 0,
            maxHp: isBossMode ? 100 : 0,
            subtasks: [],
            completed: false
        };

        const updatedQuests = [newQuest, ...quests];
        setQuests(updatedQuests);
        saveState(null, updatedQuests);
        setNewQuestTitle('');
        setIsBossMode(false);
    };

    const addSubtask = (questId, taskTitle) => {
        if (!taskTitle.trim()) return;
        const updatedQuests = quests.map(q => {
            if (q.id === questId) {
                return {
                    ...q,
                    subtasks: [...(q.subtasks || []), { id: Date.now(), title: taskTitle, completed: false }]
                };
            }
            return q;
        });
        setQuests(updatedQuests);
        saveState(null, updatedQuests);
    };

    const completeSubtask = (questId, subtaskId) => {
        const quest = quests.find(q => q.id === questId);
        if (!quest) return;

        // Damage Boss
        const damage = 20; // Fixed damage per subtask
        let newHp = Math.max(0, quest.hp - damage);

        if (soundEnabled) playSound.bossHit(); // Heavy impact for Boss Damage

        // Update Subtasks
        const updatedSubtasks = quest.subtasks.map(t =>
            t.id === subtaskId ? { ...t, completed: true } : t
        );

        let bossDefeated = false;
        if (newHp === 0 && !quest.completed) {
            bossDefeated = true;
            // Trigger Boss Defeat Logic (Complete Quest)
            completeQuest(questId, true); // Pass flag to skip normal completion logic
        } else {
            const updatedQuests = quests.map(q =>
                q.id === questId ? { ...q, hp: newHp, subtasks: updatedSubtasks } : q
            );
            setQuests(updatedQuests);
            saveState(null, updatedQuests);
        }
    };

    const completeQuest = (id, isBossKill = false) => {
        const quest = quests.find(q => q.id === id);
        if (!quest || quest.completed) return;

        // Trigger Sound & Visuals
        if (isBossKill) {
            if (soundEnabled) playSound.bossDefeat(); // Epic sound for Boss Kill
            confetti({ particleCount: 500, spread: 200, colors: ['#FFD700', '#FF0000'] });
        } else {
            playSound.coin();
            // ... (Existing confetti logic) ...
            let confettiColors = ['#d4af37', '#e0e0e0', '#ff0000'];
            let confettiShapes = ['circle', 'square'];

            if (confettiStyle === 'fire') {
                confettiColors = ['#ff0000', '#ff4500', '#ffa500'];
            } else if (confettiStyle === 'ice') {
                confettiColors = ['#00ffff', '#e0ffff', '#0000ff'];
                confettiShapes = ['circle']; // Snow-ish
            }

            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: confettiColors,
                shapes: confettiShapes
            });
        }

        // Calculate Bonuses
        let xpBonusMult = 1;
        let goldBonusMult = 1;
        const userClass = profile.userClass || 'Novice';

        if (userClass === 'Code Warrior') xpBonusMult = 1.1;
        if (userClass === 'Pixel Rogue') goldBonusMult = 1.2;
        if (userClass === 'Logic Wizard') { xpBonusMult = 1.05; goldBonusMult = 1.05; }

        // Calculate new XP & Gold
        const baseGold = isBossKill ? 100 : (Math.floor(Math.random() * 15) + 5);
        const earnedGold = Math.ceil(baseGold * goldBonusMult);
        const earnedXp = Math.ceil(quest.xpReward * xpBonusMult);

        let newXp = profile.xp + earnedXp;
        let newGold = (profile.gold || 0) + earnedGold;
        let newLevel = profile.level;
        let newMaxXp = profile.maxXp;

        // Level Up Logic
        if (newXp >= profile.maxXp) {
            newLevel += 1;
            newXp = newXp - profile.maxXp; // Carry over excess XP
            newMaxXp = Math.floor(newMaxXp * 1.5); // Increase requirement by 50%

            if (soundEnabled) playSound.levelUp(); // LEVEL UP SOUND

            // Bigger confetti for Level UP (only if not boss kill already did it)
            if (!isBossKill) {
                setTimeout(() => {
                    confetti({
                        particleCount: 200,
                        spread: 120,
                        origin: { y: 0.6 }
                    });
                }, 500);
            }
        }

        const updatedProfile = { level: newLevel, xp: newXp, maxXp: newMaxXp, gold: newGold, userClass: profile.userClass };

        // Update Quest Status
        // If Boss, ensure HP is 0 and subtasks marked? 
        // For simplicity, just mark completed.
        const updatedQuests = quests.map(q =>
            q.id === id ? {
                ...q,
                completed: true,
                hp: 0,
                subtasks: q.subtasks ? q.subtasks.map(t => ({ ...t, completed: true })) : []
            } : q
        );

        // Remove completed quest after short delay (optional, or keep in "Completed" tab)
        // For now, let's keep them but visually dimmed

        saveState(updatedProfile, updatedQuests);
    };

    const deleteQuest = (id) => {
        const updatedQuests = quests.filter(q => q.id !== id);
        setQuests(updatedQuests);
        saveState(null, updatedQuests);
    };

    // Filter active quests for DnD
    const activeQuests = quests.filter(q => !q.completed);
    const completedQuests = quests.filter(q => q.completed);

    return (
        <div className="h-full flex flex-col">
            {/* Adventurer Profile Header */}
            <div className="bg-[#2a282a] p-4 rounded-lg border border-[#444] mb-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#444] rounded-full flex items-center justify-center text-2xl border border-[#d4af37]">
                        {avatar || '🧙‍♂️'}
                    </div>
                    <div>
                        <div className="text-sm text-[#d4af37] font-bold">Lvl {profile.level} {profile.userClass || 'Adventurer'}</div>
                        <div className="w-40 h-3 bg-[#111] rounded-full mt-1 relative overflow-hidden">
                            <div
                                className="h-full bg-[#d4af37] transition-all duration-500 ease-out"
                                style={{ width: `${(profile.xp / profile.maxXp) * 100}%` }}
                            />
                        </div>
                        <div className="text-xs text-gray-500 text-right mt-1 flex justify-between">
                            <span className="text-[#ffd700] font-bold">🪙 {profile.gold || 0} G</span>
                            <span>{profile.xp} / {profile.maxXp} XP</span>
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="flex items-center justify-end gap-1 mb-1" title="Daily Streak">
                        <span className="text-xl">🔥</span>
                        <span className="font-bold text-[#ffae42] text-base">{streak} Day Streak</span>
                    </div>
                    <div className="text-sm text-gray-400">Quests Completed: <span className="font-bold text-[#e0e0e0]">{quests.filter(q => q.completed).length}</span></div>
                </div>
            </div>

            {/* Add New Quest */}
            <form onSubmit={addQuest} className="relative mb-4 bg-[#1e1e1e] p-2 rounded-lg border border-[#333]">
                <div className="flex gap-2 items-center mb-2">
                    <input
                        type="checkbox"
                        id="bossToggle"
                        checked={isBossMode}
                        onChange={(e) => setIsBossMode(e.target.checked)}
                        className="accent-[#d4af37]"
                    />
                    <label htmlFor="bossToggle" className={`text-xs font-bold ${isBossMode ? 'text-red-500 animate-pulse' : 'text-gray-400'}`}>
                        {isBossMode ? '👹 BOSS BATTLE Mode' : 'Normal Quest'}
                    </label>
                </div>
                <div className="relative">
                    <input
                        type="text"
                        id="newQuestInput"
                        placeholder={isBossMode ? "Name of the Ancient Evil..." : "New Quest (e.g., Slay the Bug)..."}
                        value={newQuestTitle}
                        onChange={(e) => setNewQuestTitle(e.target.value)}
                        className={`w-full bg-[#2a282a] border ${isBossMode ? 'border-red-500 text-red-100' : 'border-[#444] text-[#e0e0e0]'} text-base rounded-lg py-3 px-4 pr-10 focus:outline-none focus:border-[#d4af37] placeholder-gray-600`}
                    />
                    <button
                        type="submit"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#d4af37] hover:text-white transition-colors text-lg"
                    >
                        ➕
                    </button>
                </div>
            </form>

            {/* Quest Board Board with Drag & Drop */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {quests.length === 0 && (
                    <div className="text-center text-gray-500 italic mt-8 text-base">
                        The Quest Board is empty.<br />The realm is safe... for now.
                    </div>
                )}

                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={activeQuests.map(q => q.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        {activeQuests.map(quest => (
                            <SortableQuestItem key={quest.id} quest={quest}>
                                {/* Boss Card Design */}
                                {quest.type === 'boss' ? (
                                    <div className="relative group">
                                        {/* Animated Glow Background */}
                                        <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600 to-orange-600 rounded-lg blur opacity-40 group-hover:opacity-75 transition duration-1000 group-hover:duration-200 animate-pulse"></div>

                                        <div className="relative bg-[#1a0f0f] border-2 border-red-900/50 rounded-lg p-4 shadow-[0_0_15px_rgba(220,20,60,0.2)]">
                                            {/* Header */}
                                            <div className="flex items-start justify-between mb-4 border-b border-red-900/30 pb-2">
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-red-950/50 p-2 rounded-lg border border-red-800 text-2xl shadow-[0_0_10px_rgba(220,20,60,0.3)]">
                                                        👹
                                                    </div>
                                                    <div>
                                                        <div className="text-red-100 font-bold text-lg tracking-wider font-serif uppercase drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                                                            {quest.title}
                                                        </div>
                                                        <div className="text-red-400/60 text-xs font-mono uppercase tracking-widest">
                                                            Boss Battle • {quest.xpReward} XP Reward
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-red-500 cursor-pointer hover:text-red-300" onClick={(e) => { e.stopPropagation(); deleteQuest(quest.id); }}>
                                                    ✕
                                                </div>
                                            </div>

                                            {/* HP Bar */}
                                            <div className="mb-4">
                                                <div className="flex justify-between text-[10px] text-red-500 mb-1 font-bold tracking-widest uppercase">
                                                    <span>DANGER LEVEL</span>
                                                    <span>{quest.hp} / {quest.maxHp} HP</span>
                                                </div>
                                                <div className="h-4 bg-[#2a1010] rounded border border-red-900 overflow-hidden relative shadow-inner">
                                                    {/* Health Fill */}
                                                    <div
                                                        className="h-full bg-gradient-to-r from-red-900 via-red-600 to-orange-600 transition-all duration-300 relative"
                                                        style={{ width: `${(quest.hp / quest.maxHp) * 100}%` }}
                                                    >
                                                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')] opacity-30"></div>
                                                    </div>
                                                    {/* Segments (overlay) */}
                                                    <div className="absolute inset-0 flex">
                                                        {[...Array(10)].map((_, i) => (
                                                            <div key={i} className="flex-1 border-r border-[#1a0f0f]/30 last:border-0"></div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Minions (Subtasks) Grid */}
                                            <div className="space-y-2">
                                                <div className="text-[10px] text-red-500/50 uppercase font-bold tracking-widest mb-1">Minions (Subtasks)</div>
                                                <div className="grid grid-cols-1 gap-2">
                                                    {quest.subtasks?.map(sub => (
                                                        !sub.completed && (
                                                            <div key={sub.id} className="group/minion flex items-center gap-3 bg-[#2a1010]/50 border border-red-900/30 p-2 rounded hover:bg-red-900/20 transition-all relative overflow-hidden">
                                                                {/* Selection Indicator */}
                                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-600 opacity-0 group-hover/minion:opacity-100 transition-opacity"></div>

                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); completeSubtask(quest.id, sub.id); }}
                                                                    onPointerDown={(e) => e.stopPropagation()}
                                                                    className="w-5 h-5 rounded border border-red-500 hover:bg-red-600 flex items-center justify-center text-[10px] transition-colors shadow-[0_0_5px_rgba(220,20,60,0.4)]"
                                                                >
                                                                    ⚔️
                                                                </button>
                                                                <span className="text-sm text-red-100/80 font-mono">{sub.title}</span>
                                                            </div>
                                                        )
                                                    ))}
                                                </div>

                                                {/* Add Minion Input */}
                                                <div className="mt-2 relative">
                                                    <input
                                                        type="text"
                                                        placeholder="+ SUMMON MINION..."
                                                        className="w-full bg-[#1a0f0f] border border-red-900/30 text-xs py-2 px-3 rounded text-red-200 placeholder-red-900/50 focus:outline-none focus:border-red-600 focus:shadow-[0_0_10px_rgba(220,20,60,0.2)] transition-all font-mono"
                                                        onKeyDown={(e) => {
                                                            if (e.key === ' ') { e.stopPropagation(); }
                                                            if (e.key === 'Enter') {
                                                                addSubtask(quest.id, e.currentTarget.value);
                                                                e.currentTarget.value = '';
                                                            }
                                                        }}
                                                        onPointerDown={(e) => e.stopPropagation()}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    /* Standard Quest Card (Existing logic preserved, just wrapped in fragment if needed) */
                                    <div className={`bg-[#2a282a] border-l-4 border-l-[#d4af37] rounded-r p-4 transition-colors relative mb-3 group`}>

                                        <div className="flex justify-between items-start">
                                            <div className="flex-1 cursor-grab active:cursor-grabbing">
                                                <div className="font-bold text-base text-[#e0e0e0]">
                                                    {quest.title}
                                                </div>
                                                <div className="text-xs text-[#d4af37] mt-1">Reward: {quest.xpReward} XP</div>
                                            </div>

                                            <div className="flex items-center gap-3 pl-2">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); completeQuest(quest.id); }}
                                                    onPointerDown={(e) => e.stopPropagation()}
                                                    className="bg-[#1e1e1e] hover:bg-[#d4af37] hover:text-black border border-[#d4af37] text-[#d4af37] rounded-full w-10 h-10 flex items-center justify-center transition-all shadow-[0_0_5px_rgba(212,175,55,0.2)] text-lg"
                                                    title="Complete Quest"
                                                >
                                                    ✔
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); deleteQuest(quest.id); }}
                                                    onPointerDown={(e) => e.stopPropagation()}
                                                    className="text-gray-500 hover:text-red-400 text-sm px-2"
                                                    title="Abandon Quest"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </SortableQuestItem>
                        ))}
                    </SortableContext>
                </DndContext>

                {/* Completed Quests (Collapsed or at bottom) */}
                {completedQuests.length > 0 && <div className="border-t border-[#333] my-3"></div>}

                {completedQuests.map(quest => (
                    <div key={quest.id} className="bg-[#1a181a] border border-[#333] rounded p-3 flex justify-between items-center opacity-60 grayscale hover:grayscale-0 transition-all">
                        <div className="line-through text-gray-500 text-sm">
                            {quest.type === 'boss' ? '👹 ' : ''}{quest.title}
                        </div>
                        <div className="text-xs text-gray-600">Completed</div>
                        <button
                            onClick={() => deleteQuest(quest.id)}
                            className="text-gray-600 hover:text-red-400 text-sm px-2"
                        >
                            ✕
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Quests;
