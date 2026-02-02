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
import QuestItem from './QuestItem';
import BossCard from './BossCard';

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

const Quests = ({ profile, updateProfile, onQuestComplete, avatar, confettiStyle, soundEnabled, inventory, updateInventory }) => {
    // profile is now a prop
    const [quests, setQuests] = useState([]);
    const [newQuestTitle, setNewQuestTitle] = useState('');
    const [newQuestDeadline, setNewQuestDeadline] = useState('');
    const [isBossMode, setIsBossMode] = useState(false);
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
        const loadQuests = (result) => {
            if (result.quests) setQuests(result.quests);
        };

        if (chrome?.storage?.sync) {
            chrome.storage.sync.get(['quests'], (syncRes) => {
                if (syncRes.quests) {
                    loadQuests(syncRes);
                } else {
                    chrome.storage.local.get(['quests'], (localRes) => {
                        if (localRes.quests) {
                            loadQuests(localRes);
                            // Optional: Migrate quests to sync if needed, but App.jsx handles main profile
                        }
                    });
                }
            });
        } else if (chrome?.storage?.local) {
            chrome.storage.local.get(['quests'], loadQuests);
        } else {
            // Mock for local dev
            const savedQuests = localStorage.getItem('quests');
            loadQuests({
                quests: savedQuests ? JSON.parse(savedQuests) : null
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
            if (soundEnabled) playSound.bossDie(); // Epic sound for Boss Kill
            confetti({ particleCount: 500, spread: 200, colors: ['#FFD700', '#FF0000'] });
        } else {
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

        // --- ITEM DROP LOGIC (Local for now, could be moved later) ---
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

        // --- CENTRALIZED REWARD LOGIC ---
        // Determine difficulty
        let difficulty = 'easy';
        if (isBossKill) difficulty = 'boss';
        else if (quest.xpReward > 35) difficulty = 'hard';
        else if (quest.xpReward > 15) difficulty = 'medium';

        // Call App.jsx handler
        if (onQuestComplete) {
            onQuestComplete(difficulty);
        }

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

        saveState(null, updatedQuests);
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
                    <div className="relative flex flex-wrap gap-2">
                        <input
                            type="text"
                            id="newQuestInput"
                            placeholder={isBossMode ? "Name of the Ancient Evil..." : "New Quest..."}
                            value={newQuestTitle}
                            onChange={(e) => setNewQuestTitle(e.target.value)}
                            className={`flex-1 min-w-[200px] bg-[#2a282a] border ${isBossMode ? 'border-red-500 text-red-100' : 'border-[#444] text-[#e0e0e0]'} text-base rounded-lg py-3 px-4 focus:outline-none focus:border-[#d4af37] placeholder-gray-600`}
                        />
                        <div className="flex gap-2 shrink-0">
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
                                        {quest.type === 'boss' ? (
                                            <BossCard
                                                quest={quest}
                                                onDelete={deleteQuest}
                                                onAddSubtask={addSubtask}
                                                onCompleteSubtask={completeSubtask}
                                                soundEnabled={soundEnabled}
                                            />
                                        ) : (
                                            <QuestItem
                                                quest={quest}
                                                onComplete={() => completeQuest(quest.id)}
                                                onDelete={deleteQuest}
                                                onEdit={startEditing}
                                            />
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
