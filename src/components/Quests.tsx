import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import type { Profile, Quest, Subtask, InventoryItem } from '../types';
import { playSound } from '../utils/soundfx';
import QuickDateSelector from './QuickDateSelector';
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

interface SortableQuestItemProps {
    quest: Quest;
    children: React.ReactNode;
}

const SortableQuestItem: React.FC<SortableQuestItemProps> = ({ quest, children }) => {
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

interface QuestsProps {
    profile: Profile;
    updateProfile: (profile: Profile) => void;
    avatar: string;
    confettiStyle: string;
    soundEnabled: boolean;
    inventory: InventoryItem[];
    updateInventory: (inventory: InventoryItem[]) => void;
}

const Quests: React.FC<QuestsProps> = ({
    profile,
    updateProfile,
    avatar,
    confettiStyle,
    soundEnabled,
    inventory,
    updateInventory
}) => {
    const [quests, setQuests] = useState<Quest[]>([]);
    const [newQuestTitle, setNewQuestTitle] = useState('');
    const [newQuestDeadline, setNewQuestDeadline] = useState<string | null>('');
    const [isBossMode, setIsBossMode] = useState(false);
    const [streak, setStreak] = useState(0);
    const [questTab, setQuestTab] = useState<'active' | 'completed' | 'failed'>('active');
    const [editingQuest, setEditingQuest] = useState<Quest | null>(null);

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

    useEffect(() => {
        const loadData = (result: Record<string, unknown>) => {
            if (result.quests) setQuests(result.quests as Quest[]);

            const today = new Date().toDateString();
            const lastLogin = result.lastLoginDate as string | undefined;
            let currentStreak = (result.dailyStreak as number) || 0;

            if (lastLogin !== today) {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);

                if (lastLogin === yesterday.toDateString()) {
                    currentStreak += 1;
                } else {
                    currentStreak = 1;
                }

                const updates = { lastLoginDate: today, dailyStreak: currentStreak };
                if (chrome?.storage?.sync) {
                    chrome.storage.sync.set(updates);
                } else if (chrome?.storage?.local) {
                    chrome.storage.local.set(updates);
                } else {
                    localStorage.setItem('lastLoginDate', today);
                    localStorage.setItem('dailyStreak', String(currentStreak));
                }
            }
            setStreak(currentStreak);
        };

        if (chrome?.storage?.sync) {
            chrome.storage.sync.get(['quests', 'dailyStreak', 'lastLoginDate'], (syncRes) => {
                if (Object.keys(syncRes).length > 0) {
                    loadData(syncRes as Record<string, unknown>);
                } else {
                    chrome.storage.local.get(['quests', 'dailyStreak', 'lastLoginDate'], (localRes) => {
                        if (Object.keys(localRes).length > 0) {
                            loadData(localRes as Record<string, unknown>);
                            chrome.storage.sync.set(localRes);
                        } else {
                            loadData({});
                        }
                    });
                }
            });
        } else if (chrome?.storage?.local) {
            chrome.storage.local.get(['rpgProfile', 'quests', 'dailyStreak', 'lastLoginDate'], (localRes) => {
                loadData(localRes as Record<string, unknown>);
            });
        } else {
            const savedQuests = localStorage.getItem('quests');
            const dailyStreak = localStorage.getItem('dailyStreak') ? parseInt(localStorage.getItem('dailyStreak')!) : 0;
            const lastLoginDate = localStorage.getItem('lastLoginDate');

            loadData({
                quests: savedQuests ? JSON.parse(savedQuests) : null,
                dailyStreak,
                lastLoginDate
            });
        }
    }, []);

    const saveState = (newProfile: Profile | null, newQuests: Quest[] | null) => {
        if (newProfile) updateProfile(newProfile);
        if (newQuests) setQuests(newQuests);

        const data: Record<string, unknown> = {};
        if (newQuests) data.quests = newQuests;

        if (chrome?.storage?.sync) {
            chrome.storage.sync.set(data);
        } else if (chrome?.storage?.local) {
            chrome.storage.local.set(data);
        } else {
            if (newQuests) localStorage.setItem('quests', JSON.stringify(newQuests));
        }
    };

    const handleDragEnd = (event: { active: { id: unknown }; over: { id: unknown } | null }) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = quests.findIndex((q) => q.id === active.id);
            const newIndex = quests.findIndex((q) => q.id === over.id);
            const newQuests = arrayMove(quests, oldIndex, newIndex);
            setQuests(newQuests);
            saveState(null, newQuests);
        }
    };

    const addQuest = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newQuestTitle.trim()) return;

        const newQuest: Quest = {
            id: Date.now(),
            title: newQuestTitle,
            type: isBossMode ? 'boss' : 'normal',
            xpReward: isBossMode ? 500 : Math.floor(Math.random() * 30) + 20,
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

    const addSubtask = (questId: number, taskTitle: string) => {
        if (!taskTitle.trim()) return;
        const updatedQuests = quests.map(q => {
            if (q.id === questId) {
                const newSubtasks: Subtask[] = [...(q.subtasks || []), { id: Date.now(), title: taskTitle, completed: false }];
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

    const completeSubtask = (questId: number, subtaskId: number) => {
        const quest = quests.find(q => q.id === questId);
        if (!quest) return;

        const updatedSubtasks = quest.subtasks.map(t =>
            t.id === subtaskId ? { ...t, completed: true } : t
        );

        let newHp = quest.hp;
        let isBossDeath = false;

        if (quest.type === 'boss') {
            const total = updatedSubtasks.length;
            const completedCount = updatedSubtasks.filter(t => t.completed).length;
            newHp = total > 0 ? Math.floor(((total - completedCount) / total) * 100) : 0;

            if (soundEnabled) playSound.bossHit();

            if (newHp === 0 && !quest.completed) {
                isBossDeath = true;
            }
        }

        if (isBossDeath) {
            completeQuest(questId, true, updatedSubtasks);
        } else {
            const updatedQuests = quests.map(q =>
                q.id === questId ? { ...q, hp: newHp, subtasks: updatedSubtasks } : q
            );
            setQuests(updatedQuests);
            saveState(null, updatedQuests);
        }
    };

    const completeQuest = (id: number, isBossKill = false, forcedSubtasks: Subtask[] | null = null) => {
        const quest = quests.find(q => q.id === id);
        if (!quest || quest.completed) return;

        if (isBossKill) {
            if (soundEnabled) playSound.bossDefeat();
            confetti({ particleCount: 500, spread: 200, colors: ['#FFD700', '#FF0000'] });
        } else {
            playSound.coin();
            let confettiColors = ['#d4af37', '#e0e0e0', '#ff0000'];
            let confettiShapes: confetti.Shape[] = ['circle', 'square'];

            if (confettiStyle === 'fire') {
                confettiColors = ['#ff0000', '#ff4500', '#ffa500'];
            } else if (confettiStyle === 'ice') {
                confettiColors = ['#00ffff', '#e0ffff', '#0000ff'];
                confettiShapes = ['circle'];
            }

            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: confettiColors,
                shapes: confettiShapes
            });
        }

        const dropChance = isBossMode ? 0.6 : 0.15;
        if (Math.random() < dropChance) {
            const items = [
                { id: 'potion_focus', name: 'Potion of Focus', type: 'consumable', description: '25m Focus Music + Blocker' },
                { id: 'scroll_reschedule', name: 'Scroll of Reschedule', type: 'consumable', description: 'change deadline w/o penalty' },
                { id: 'mystery_key', name: 'Mystery Key', type: 'artifact', description: 'Opens future dungeons', weight: 0.1 }
            ];

            const roll = Math.random();
            let droppedItem = items[0];
            if (roll > 0.9) droppedItem = items[2];
            else if (roll > 0.5) droppedItem = items[1];
            else droppedItem = items[0];

            const currentInv = inventory || [];
            const existingItemIndex = currentInv.findIndex(i => i.id === droppedItem.id);
            let newInventory: InventoryItem[];

            if (existingItemIndex >= 0) {
                newInventory = [...currentInv];
                newInventory[existingItemIndex].count += 1;
            } else {
                newInventory = [...currentInv, { ...droppedItem, count: 1 } as InventoryItem];
            }

            updateInventory(newInventory);
        }

        let xpBonusMult = 1;
        let goldBonusMult = 1;
        const userClass = profile.userClass || 'Novice';

        if (userClass === 'Code Warrior') xpBonusMult = 1.1;
        if (userClass === 'Pixel Rogue') goldBonusMult = 1.2;
        if (userClass === 'Logic Wizard') { xpBonusMult = 1.05; goldBonusMult = 1.05; }

        const unlockedSkills = new Set(profile.unlockedSkills || []);
        if (unlockedSkills.has('novice_looter')) goldBonusMult += 0.05;
        if (unlockedSkills.has('midas_touch')) goldBonusMult += 0.15;
        if (unlockedSkills.has('fast_learner')) xpBonusMult += 0.05;

        let isCritical = false;
        if (unlockedSkills.has('critical_mind') && Math.random() < 0.1) {
            isCritical = true;
            xpBonusMult *= 2;
            goldBonusMult *= 2;
        }

        const baseGold = isBossKill ? 100 : (Math.floor(Math.random() * 15) + 5);
        const earnedGold = Math.ceil(baseGold * goldBonusMult);
        const earnedXp = Math.ceil(quest.xpReward * xpBonusMult);

        let newXp = profile.xp + earnedXp;
        let newGold = (profile.gold || 0) + earnedGold;
        let newLevel = profile.level;
        let newMaxXp = profile.maxXp;
        let newSkillPoints = profile.skillPoints || 0;

        if (newXp >= profile.maxXp) {
            newLevel += 1;
            newSkillPoints += 1;
            newXp = newXp - profile.maxXp;
            newMaxXp = Math.floor(newMaxXp * 1.5);

            if (soundEnabled) playSound.levelUp();

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

        const currentStats = profile.stats || {};
        const newStats = {
            ...currentStats,
            questsCompleted: (currentStats.questsCompleted || 0) + 1,
            bossesDefeated: isBossKill ? (currentStats.bossesDefeated || 0) + 1 : (currentStats.bossesDefeated || 0),
            totalGoldEarned: (currentStats.totalGoldEarned || 0) + earnedGold
        };

        const updatedProfile: Profile = {
            level: newLevel,
            xp: newXp,
            maxXp: newMaxXp,
            gold: newGold,
            userClass: profile.userClass,
            skillPoints: newSkillPoints,
            unlockedSkills: profile.unlockedSkills || [],
            stats: newStats,
            unlockedAchievements: profile.unlockedAchievements || [],
            streak: profile.streak,
            lastLoginDate: profile.lastLoginDate
        };

        const updatedQuests = quests.map(q =>
            q.id === id ? {
                ...q,
                completed: true,
                hp: 0,
                subtasks: forcedSubtasks || (q.subtasks ? q.subtasks.map(t => ({ ...t, completed: true })) : [])
            } : q
        );

        saveState(updatedProfile, updatedQuests);
    };

    const deleteQuest = (id: number) => {
        if (window.confirm("Are you sure you want to abandon this quest?")) {
            const updatedQuests = quests.filter(q => q.id !== id);
            setQuests(updatedQuests);
            saveState(null, updatedQuests);
        }
    };

    const startEditing = (quest: Quest) => {
        setEditingQuest({ ...quest });
    };

    const saveEditedQuest = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingQuest) return;

        const originalQuest = quests.find(q => q.id === editingQuest.id);
        const deadlineChanged = originalQuest?.deadline !== editingQuest.deadline;

        if (deadlineChanged && originalQuest?.deadline) {
            const hasScroll = inventory?.find(i => i.id === 'scroll_reschedule' && i.count > 0);
            if (hasScroll) {
                if (window.confirm("Use 'Scroll of Reschedule' to change the deadline without penalty?")) {
                    const newInventory = inventory.map(i =>
                        i.id === 'scroll_reschedule' ? { ...i, count: i.count - 1 } : i
                    ).filter(i => i.count > 0);
                    updateInventory(newInventory);
                }
            } else {
                if (!window.confirm("You don't have a Scroll of Reschedule! Proceed?")) {
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

    const isExpired = (q: Quest): boolean => q.deadline ? new Date(q.deadline) < new Date() && !q.completed : false;

    const visualActiveQuests = quests.filter(q => !q.completed && !isExpired(q));
    const visualCompletedQuests = quests.filter(q => q.completed);
    const visualFailedQuests = quests.filter(q => !q.completed && isExpired(q));

    const dndItems = questTab === 'active' ? visualActiveQuests : [];

    return (
        <div className="h-full flex flex-col">
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

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 bg-[#151515] p-2 rounded-b rounded-tr border border-[#333] min-h-0">
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
                                        {quest.type === 'boss' ? (
                                            <div className="relative group">
                                                <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600 to-orange-600 rounded-lg blur opacity-40 group-hover:opacity-75 transition duration-1000 group-hover:duration-200 animate-pulse"></div>

                                                <div className="relative bg-[#1a0f0f] border-2 border-red-900/50 rounded-lg p-4 shadow-[0_0_15px_rgba(220,20,60,0.2)]">
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
                                                        <div className="text-red-500 cursor-pointer hover:text-red-300" onClick={() => deleteQuest(quest.id)}>
                                                            ✕
                                                        </div>
                                                    </div>

                                                    <div className="mb-4">
                                                        <div className="flex justify-between text-[10px] text-red-500 mb-1 font-bold tracking-widest uppercase">
                                                            <span>DANGER LEVEL</span>
                                                            <span>{quest.hp} / {quest.maxHp} HP</span>
                                                        </div>
                                                        <div className="h-4 bg-[#2a1010] rounded border border-red-900 overflow-hidden relative shadow-inner">
                                                            <div
                                                                className="h-full bg-gradient-to-r from-red-900 via-red-600 to-orange-600 transition-all duration-300 relative"
                                                                style={{ width: `${(quest.hp / quest.maxHp) * 100}%` }}
                                                            >
                                                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')] opacity-30"></div>
                                                            </div>
                                                            <div className="absolute inset-0 flex">
                                                                {[...Array(10)].map((_, i) => (
                                                                    <div key={i} className="flex-1 border-r border-[#1a0f0f]/30 last:border-0"></div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <div className="text-[10px] text-red-500/50 uppercase font-bold tracking-widest mb-1">Minions (Subtasks)</div>
                                                        <div className="grid grid-cols-1 gap-2">
                                                            {quest.subtasks?.map(sub => (
                                                                !sub.completed && (
                                                                    <div key={sub.id} className="group/minion flex items-center gap-3 bg-[#2a1010]/50 border border-red-900/30 p-2 rounded hover:bg-red-900/20 transition-all relative overflow-hidden">
                                                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-600 opacity-0 group-hover/minion:opacity-100 transition-opacity"></div>

                                                                        <button
                                                                            onClick={() => completeSubtask(quest.id, sub.id)}
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

                                                        <div className="mt-2 relative">
                                                            <input
                                                                type="text"
                                                                placeholder="+ SUMMON MINION..."
                                                                className="w-full bg-[#1a0f0f] border border-red-900/30 text-xs py-2 px-3 rounded text-red-200 placeholder-red-900/50 focus:outline-none focus:border-red-600 focus:shadow-[0_0_10px_rgba(220,20,60,0.2)] transition-all font-mono"
                                                                onKeyDown={(e) => {
                                                                    if (e.key === ' ') { e.stopPropagation(); }
                                                                    if (e.key === 'Enter' && e.currentTarget.value) {
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
                                            <div className="bg-[#1a181a] border border-[#444] border-l-4 border-l-[#d4af37] rounded-r-lg p-4 transition-all relative mb-3 group shadow-[0_2px_5px_rgba(0,0,0,0.3)] hover:shadow-[0_0_15px_rgba(212,175,55,0.1)] overflow-hidden">
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
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-3 pl-2">
                                                        <button
                                                            onClick={() => completeQuest(quest.id)}
                                                            onPointerDown={(e) => e.stopPropagation()}
                                                            className="bg-[#1e1e1e] hover:bg-[#d4af37] hover:text-black border border-[#d4af37] text-[#d4af37] rounded-full w-10 h-10 flex items-center justify-center transition-all shadow-[0_0_5px_rgba(212,175,55,0.2)] text-lg"
                                                        >
                                                            ✔
                                                        </button>
                                                        <div className="flex flex-col gap-1">
                                                            <button
                                                                onClick={() => startEditing(quest)}
                                                                onPointerDown={(e) => e.stopPropagation()}
                                                                className="text-gray-500 hover:text-[#d4af37] text-xs px-2"
                                                            >
                                                                ✏️
                                                            </button>
                                                            <button
                                                                onClick={() => deleteQuest(quest.id)}
                                                                onPointerDown={(e) => e.stopPropagation()}
                                                                className="text-gray-500 hover:text-red-400 text-xs px-2"
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
                            </div>
                        ))}
                    </div>
                )}

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
                                            Expired: {quest.deadline && new Date(quest.deadline).toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <button
                                            onClick={() => completeQuest(quest.id)}
                                            className="text-xs bg-[#1e1e1e] border border-gray-700 text-gray-500 hover:text-green-500 hover:border-green-500 px-2 py-1 rounded transition-colors"
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
