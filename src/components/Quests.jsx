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
import QuickDateSelector from './QuickDateSelector';

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

const Quests = ({ profile, updateProfile, avatar, confettiStyle, soundEnabled, inventory, updateInventory }) => {
    // profile is now a prop
    const [quests, setQuests] = useState([]);
    const [newQuestTitle, setNewQuestTitle] = useState('');
    const [newQuestDeadline, setNewQuestDeadline] = useState('');
    const [isBossMode, setIsBossMode] = useState(false);
    const [streak, setStreak] = useState(0);
    const [questTab, setQuestTab] = useState('active'); // 'active' | 'completed' | 'failed'
    const [editingQuest, setEditingQuest] = useState(null); // { id, title, deadline } for modal

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
            deadline: newQuestDeadline ? new Date(newQuestDeadline).toISOString() : null,
            subtasks: [],
            completed: false
        };

        const updatedQuests = [newQuest, ...quests];
        setQuests(updatedQuests);
        saveState(null, updatedQuests);
        setNewQuestTitle('');
        setNewQuestDeadline('');
        setIsBossMode(false);
    };

    const addSubtask = (questId, taskTitle) => {
        if (!taskTitle.trim()) return;
        const updatedQuests = quests.map(q => {
            if (q.id === questId) {
                const newSubtasks = [...(q.subtasks || []), { id: Date.now(), title: taskTitle, completed: false }];
                // Recalculate HP if it's a boss
                let newHp = q.hp;
                if (q.type === 'boss') {
                    const total = newSubtasks.length;
                    const completedCount = newSubtasks.filter(t => t.completed).length;
                    newHp = Math.floor(((total - completedCount) / total) * 100);
                }
                return {
                    ...q,
                    hp: newHp,
                    subtasks: newSubtasks
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

        // Update Subtasks First
        const updatedSubtasks = quest.subtasks.map(t =>
            t.id === subtaskId ? { ...t, completed: true } : t
        );

        // Recalculate Boss HP (Percentage based)
        let newHp = quest.hp;
        let isBossDeath = false;

        if (quest.type === 'boss') {
            const total = updatedSubtasks.length;
            const completedCount = updatedSubtasks.filter(t => t.completed).length;
            // HP is percentage of remaining tasks
            // If total is 5, completed 1. Remaining 4. HP = 80%.
            newHp = total > 0 ? Math.floor(((total - completedCount) / total) * 100) : 0;

            if (soundEnabled) playSound.bossHit();

            if (newHp === 0 && !quest.completed) {
                isBossDeath = true;
            }
        } else {
            // Normal quest subtask logic (if any)
            // Currently normal quests don't really use HP/subtasks prominently, but safe to keep basic
        }

        if (isBossDeath) {
            // Trigger Boss Defeat Logic (Complete Quest)
            // We pass the updated subtasks to ensure they are saved as completed
            completeQuest(questId, true, updatedSubtasks);
        } else {
            const updatedQuests = quests.map(q =>
                q.id === questId ? { ...q, hp: newHp, subtasks: updatedSubtasks } : q
            );
            setQuests(updatedQuests);
            saveState(null, updatedQuests);
        }
    };

    const completeQuest = (id, isBossKill = false, forcedSubtasks = null) => {
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

        // --- ITEM DROP LOGIC ---
        const dropChance = isBossMode ? 0.6 : 0.15; // 60% for Boss, 15% for Normal
        if (Math.random() < dropChance) {
            // Drop Table
            const items = [
                { id: 'potion_focus', name: 'Potion of Focus', type: 'consumable', description: '25m Focus Music + Blocker' },
                { id: 'scroll_reschedule', name: 'Scroll of Reschedule', type: 'consumable', description: 'change deadline w/o penalty' },
                // Rare
                { id: 'mystery_key', name: 'Mystery Key', type: 'artifact', description: 'Opens future dungeons', weight: 0.1 }
            ];

            // Simple random pick for now
            const roll = Math.random();
            let droppedItem;
            if (roll > 0.9) droppedItem = items[2]; // Key (Rare)
            else if (roll > 0.5) droppedItem = items[1]; // Scroll
            else droppedItem = items[0]; // Potion

            // Add to Inventory
            const currentInv = inventory || [];
            const existingItemIndex = currentInv.findIndex(i => i.id === droppedItem.id);
            let newInventory;

            if (existingItemIndex >= 0) {
                newInventory = [...currentInv];
                newInventory[existingItemIndex].count += 1;
            } else {
                newInventory = [...currentInv, { ...droppedItem, count: 1 }];
            }

            updateInventory(newInventory);

            // Toast Notification
            setTimeout(() => {
                toast.success(
                    <div className="flex flex-col">
                        <span className="font-bold text-[#ffd700]">🎁 ITEM DROP!</span>
                        <span>You found: {droppedItem.name}</span>
                    </div>,
                    { duration: 4000 }
                );
            }, 1000);
        }

        // Calculate Bonuses from Class
        let xpBonusMult = 1;
        let goldBonusMult = 1;
        const userClass = profile.userClass || 'Novice';

        if (userClass === 'Code Warrior') xpBonusMult = 1.1;
        if (userClass === 'Pixel Rogue') goldBonusMult = 1.2;
        if (userClass === 'Logic Wizard') { xpBonusMult = 1.05; goldBonusMult = 1.05; }

        // --- PASSIVE SKILL BONUSES ---
        const unlockedSkills = new Set(profile.unlockedSkills || []);
        if (unlockedSkills.has('novice_looter')) goldBonusMult += 0.05;
        if (unlockedSkills.has('midas_touch')) goldBonusMult += 0.15;
        if (unlockedSkills.has('fast_learner')) xpBonusMult += 0.05;

        // --- CRITICAL MIND (Double Rewards) ---
        let isCritical = false;
        if (unlockedSkills.has('critical_mind') && Math.random() < 0.1) {
            isCritical = true;
            xpBonusMult *= 2;
            goldBonusMult *= 2;

            // Critical Toast
            setTimeout(() => {
                toast.success("⚡ CRITICAL REWARD! x2 XP & GOLD! ⚡");
                playSound.bossHit(); // Impact sound
            }, 1500);
        }

        // Calculate new XP & Gold
        const baseGold = isBossKill ? 100 : (Math.floor(Math.random() * 15) + 5);
        const earnedGold = Math.ceil(baseGold * goldBonusMult);
        const earnedXp = Math.ceil(quest.xpReward * xpBonusMult);

        let newXp = profile.xp + earnedXp;
        let newGold = (profile.gold || 0) + earnedGold;
        let newLevel = profile.level;
        let newMaxXp = profile.maxXp;
        let newSkillPoints = profile.skillPoints || 0;

        // Level Up Logic
        if (newXp >= profile.maxXp) {
            newLevel += 1;
            newSkillPoints += 1; // Award 1 SP per level
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

            toast.success(`Leveled Up! +1 Skill Point!`);
        }

        // --- STATS UPDATE ---
        const currentStats = profile.stats || {};
        const newStats = {
            ...currentStats,
            questsCompleted: (currentStats.questsCompleted || 0) + 1,
            bossesDefeated: isBossKill ? (currentStats.bossesDefeated || 0) + 1 : (currentStats.bossesDefeated || 0),
            totalGoldEarned: (currentStats.totalGoldEarned || 0) + earnedGold
        };

        // --- HISTORY UPDATE ---
        const today = new Date().toDateString();
        const history = profile.history || [];
        const todayEntry = history.find(h => h.date === today) || { date: today, xp: 0, gold: 0, quests: 0, focusMinutes: 0 };

        const updatedHistoryEntry = {
            ...todayEntry,
            xp: (todayEntry.xp || 0) + earnedXp,
            gold: (todayEntry.gold || 0) + earnedGold,
            quests: (todayEntry.quests || 0) + 1
        };

        let newHistory;
        const entryIndex = history.findIndex(h => h.date === today);
        if (entryIndex >= 0) {
            newHistory = [...history];
            newHistory[entryIndex] = updatedHistoryEntry;
        } else {
            newHistory = [...history, updatedHistoryEntry];
        }

        const updatedProfile = {
            level: newLevel,
            xp: newXp,
            maxXp: newMaxXp,
            gold: newGold,
            userClass: profile.userClass,
            skillPoints: newSkillPoints,
            unlockedSkills: profile.unlockedSkills || [],
            stats: newStats,
            unlockedAchievements: profile.unlockedAchievements || [],
            history: newHistory
        };

        // Update Quest Status
        // If Boss, ensure HP is 0 and subtasks marked? 
        // For simplicity, just mark completed.
        const updatedQuests = quests.map(q =>
            q.id === id ? {
                ...q,
                completed: true,
                hp: 0,
                subtasks: forcedSubtasks || (q.subtasks ? q.subtasks.map(t => ({ ...t, completed: true })) : [])
            } : q
        );

        // Remove completed quest after short delay (optional, or keep in "Completed" tab)
        // For now, let's keep them but visually dimmed

        saveState(updatedProfile, updatedQuests);
    };

    const deleteQuest = (id) => {
        if (window.confirm("Are you sure you want to abandon this quest?")) {
            const updatedQuests = quests.filter(q => q.id !== id);
            setQuests(updatedQuests);
            saveState(null, updatedQuests);
        }
    };

    const startEditing = (quest) => {
        setEditingQuest({ ...quest });
    };

    const saveEditedQuest = (e) => {
        e.preventDefault();
        if (!editingQuest) return;

        const originalQuest = quests.find(q => q.id === editingQuest.id);
        const deadlineChanged = originalQuest.deadline !== editingQuest.deadline;

        let scrollUsed = false;

        // Logic: If deadline is extended (later than original), require scroll? 
        // For now, simpler logic based on user request: "Use Scroll of Reschedule" check
        if (deadlineChanged && originalQuest.deadline) {
            const hasScroll = inventory?.find(i => i.id === 'scroll_reschedule' && i.count > 0);
            if (hasScroll) {
                if (window.confirm("Use 'Scroll of Reschedule' to change the deadline without penalty?")) {
                    // Consume Scroll
                    const newInventory = inventory.map(i =>
                        i.id === 'scroll_reschedule' ? { ...i, count: i.count - 1 } : i
                    ).filter(i => i.count > 0);
                    updateInventory(newInventory);
                    scrollUsed = true;
                    toast.success("Scroll used! Deadline updated peacefully. 📜");
                }
                // If cancel, we allow change but maybe warn about streak or just allow it for now.
            } else {
                if (!window.confirm("You don't have a Scroll of Reschedule! Changing the deadline might upset the time gods (no actual penalty yet). Proceed?")) {
                    return;
                }
            }
        }

        const updatedQuests = quests.map(q =>
            q.id === editingQuest.id ? { ...q, title: editingQuest.title, deadline: editingQuest.deadline } : q
        );
        setQuests(updatedQuests);
        saveState(null, updatedQuests);
        setEditingQuest(null);
    };

    // Helper: Is Expired?
    const isExpired = (q) => q.deadline && new Date(q.deadline) < new Date() && !q.completed;

    // Filter active quests for DnD (and display logic)
    // "Active" tab now excludes expired quests
    const visualActiveQuests = quests.filter(q => !q.completed && !isExpired(q));
    const visualCompletedQuests = quests.filter(q => q.completed);
    const visualFailedQuests = quests.filter(q => !q.completed && isExpired(q));

    // For DnD, we only allow dragging in the Active tab for now to avoid complexity
    const dndItems = questTab === 'active' ? visualActiveQuests : [];

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
            {editingQuest ? (
                <form onSubmit={saveEditedQuest} className="relative mb-4 bg-[#2a282a] p-3 rounded-lg border border-[#d4af37] animate-in fade-in slide-in-from-top-2">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-[#d4af37] font-bold text-sm">Editing Scroll 📜</span>
                        <button type="button" onClick={() => setEditingQuest(null)} className="text-gray-500 hover:text-white">✕</button>
                    </div>
                    <div className="flex flex-col gap-2">
                        <input
                            type="text"
                            value={editingQuest.title}
                            onChange={(e) => setEditingQuest({ ...editingQuest, title: e.target.value })}
                            className="bg-[#1e1e1e] border border-[#444] text-[#e0e0e0] rounded p-2 focus:border-[#d4af37] outline-none"
                        />
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">Deadline:</span>
                            <QuickDateSelector
                                value={editingQuest.deadline}
                                onChange={(val) => setEditingQuest({ ...editingQuest, deadline: val })}
                                className="flex-1"
                            />
                        </div>
                        <button type="submit" className="bg-[#d4af37] text-black font-bold py-1 rounded hover:opacity-90 mt-1">Save Changes</button>
                    </div>
                </form>
            ) : (
                <form onSubmit={addQuest} className="relative mb-4 bg-[#1e1e1e] p-2 rounded-lg border border-[#333]">
                    {/* ... Existing Add Form Content ... */}
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
                    <div className="relative flex gap-2">
                        <input
                            type="text"
                            id="newQuestInput"
                            placeholder={isBossMode ? "Name of the Ancient Evil..." : "New Quest (e.g., Slay the Bug)..."}
                            value={newQuestTitle}
                            onChange={(e) => setNewQuestTitle(e.target.value)}
                            className={`flex-1 bg-[#2a282a] border ${isBossMode ? 'border-red-500 text-red-100' : 'border-[#444] text-[#e0e0e0]'} text-base rounded-lg py-3 px-4 focus:outline-none focus:border-[#d4af37] placeholder-gray-600`}
                        />
                        <QuickDateSelector
                            value={newQuestDeadline}
                            onChange={setNewQuestDeadline}
                            className="w-auto"
                        />
                        <button
                            type="submit"
                            className="bg-[#2a282a] border border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37] hover:text-black transition-colors rounded-lg px-4 flex items-center justify-center font-bold"
                        >
                            ➕
                        </button>
                    </div>
                </form>
            )}



            {/* Quest Tabs */}
            <div className="flex gap-1 mb-2">
                <button
                    onClick={() => setQuestTab('active')}
                    className={`flex-1 py-1 text-xs font-bold rounded-t ${questTab === 'active' ? 'bg-[#d4af37] text-black' : 'bg-[#1e1e1e] text-gray-500 hover:bg-[#333]'}`}
                >
                    ⚔️ Active
                </button>
                <button
                    onClick={() => setQuestTab('completed')}
                    className={`flex-1 py-1 text-xs font-bold rounded-t ${questTab === 'completed' ? 'bg-[#d4af37] text-black' : 'bg-[#1e1e1e] text-gray-500 hover:bg-[#333]'}`}
                >
                    🏆 Completed ({visualCompletedQuests.length})
                </button>
                <button
                    onClick={() => setQuestTab('failed')}
                    className={`flex-1 py-1 text-xs font-bold rounded-t ${questTab === 'failed' ? 'bg-red-900 text-red-100' : 'bg-[#1e1e1e] text-gray-500 hover:bg-[#333]'}`}
                >
                    💀 Failed ({visualFailedQuests.length})
                </button>
            </div>

            {/* Quest Board Board with Drag & Drop */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 bg-[#151515] p-2 rounded-b rounded-tr border border-[#333] min-h-0">

                {/* ACTIVE TAB */}
                {questTab === 'active' && (
                    <>
                        {visualActiveQuests.length === 0 && (
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
                                items={visualActiveQuests.map(q => q.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                {visualActiveQuests.map(quest => (
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
                                            /* Standard Quest Card (Active) */
                                            <div className="bg-[#1a181a] border border-[#444] border-l-4 border-l-[#d4af37] rounded-r-lg p-4 transition-all relative mb-3 group shadow-[0_2px_5px_rgba(0,0,0,0.3)] hover:shadow-[0_0_15px_rgba(212,175,55,0.1)] overflow-hidden">
                                                {/* Card Texture */}
                                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-leather.png')] opacity-30 pointer-events-none"></div>


                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1 cursor-grab active:cursor-grabbing">
                                                        <div className="font-bold text-base text-[#e0e0e0]">
                                                            {quest.title}
                                                        </div>
                                                        <div className="text-xs text-[#d4af37] mt-1 flex items-center gap-2">
                                                            <span>Reward: {quest.xpReward} XP</span>
                                                            {quest.deadline && (
                                                                <span className={`flex items-center gap-1 ${new Date(quest.deadline) < new Date() ? 'text-red-500 font-bold animate-pulse' : 'text-gray-400'}`}>
                                                                    ⏰ {new Date(quest.deadline).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                                    {new Date(quest.deadline) < new Date() && ' (OVERDUE!)'}
                                                                </span>
                                                            )}
                                                        </div>
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
                                                        <div className="flex flex-col gap-1">
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); startEditing(quest); }}
                                                                onPointerDown={(e) => e.stopPropagation()}
                                                                className="text-gray-500 hover:text-[#d4af37] text-xs px-2"
                                                                title="Edit Quest"
                                                            >
                                                                ✏️
                                                            </button>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); deleteQuest(quest.id); }}
                                                                onPointerDown={(e) => e.stopPropagation()}
                                                                className="text-gray-500 hover:text-red-400 text-xs px-2"
                                                                title="Abandon Quest"
                                                            >
                                                                ✕
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </SortableQuestItem>
                                ))}
                            </SortableContext>
                        </DndContext>
                    </>
                )}

                {/* COMPLETED TAB */}
                {questTab === 'completed' && (
                    <div className="animate-in fade-in">
                        {visualCompletedQuests.length === 0 && (
                            <div className="text-center text-gray-600 italic mt-8 text-sm">
                                No victories yet. Go slay some tasks!
                            </div>
                        )}
                        {visualCompletedQuests.map(quest => (
                            <div key={quest.id} className="bg-[#1a181a] border border-[#333] rounded p-3 mb-2 opacity-80 hover:opacity-100 transition-all">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <div className="line-through text-gray-500 text-sm font-bold">{quest.title}</div>
                                        <div className="text-xs text-green-700 font-mono">Completed • +{quest.xpReward} XP</div>
                                    </div>
                                    <button onClick={() => deleteQuest(quest.id)} className="text-gray-700 hover:text-red-500 text-sm">✕</button>
                                </div>
                                {quest.type === 'boss' && (
                                    <div className="mt-2 pl-4 border-l-2 border-[#333]">
                                        {quest.subtasks?.map(sub => (
                                            <div key={sub.id} className="text-[10px] text-gray-600 line-through">
                                                • {sub.title}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* FAILED TAB */}
                {questTab === 'failed' && (
                    <div className="animate-in fade-in">
                        {visualFailedQuests.length === 0 && (
                            <div className="text-center text-gray-600 italic mt-8 text-sm">
                                Great job! No overdue quests.
                            </div>
                        )}
                        {visualFailedQuests.map(quest => (
                            <div key={quest.id} className="bg-[#1a0f0f] border border-red-900/30 rounded p-3 mb-2 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cracked-ground.png')] opacity-10 pointer-events-none"></div>
                                <div className="flex justify-between items-start relative z-10">
                                    <div>
                                        <div className="text-red-800 font-bold text-sm tracking-widest uppercase">FAILED</div>
                                        <div className="text-gray-400 text-base font-serif italic mb-1">{quest.title}</div>
                                        <div className="text-red-500 text-xs font-mono">
                                            Expired: {new Date(quest.deadline).toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <button
                                            onClick={() => completeQuest(quest.id)}
                                            className="text-xs bg-[#1e1e1e] border border-gray-700 text-gray-500 hover:text-green-500 hover:border-green-500 px-2 py-1 rounded transition-colors"
                                            title="Late Completion (Half Rewards?)"
                                        >
                                            Late Finish
                                        </button>
                                        <button
                                            onClick={() => deleteQuest(quest.id)}
                                            className="text-xs bg-[#1e1e1e] border border-red-900 text-red-800 hover:bg-red-900 hover:text-white px-2 py-1 rounded transition-colors"
                                        >
                                            Dismiss
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Quests;
