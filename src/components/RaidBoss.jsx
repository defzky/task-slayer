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
    useSensors
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Boss Presets
const BOSSES = [
    { id: 'dragon', name: 'The Code Dragon', hpMultiplier: 1, icon: '🐲', color: '#10b981', bg: 'bg-green-900/20' }, // Easy
    { id: 'demon', name: 'Deadline Demon', hpMultiplier: 1.5, icon: '👹', color: '#ef4444', bg: 'bg-red-900/20' },   // Medium
    { id: 'void', name: 'Void Construct', hpMultiplier: 2, icon: '👾', color: '#8b5cf6', bg: 'bg-purple-900/20' },   // Hard
    { id: 'dragon_gold', name: 'The Golden Dragon', hpMultiplier: 3, icon: '🐲', color: '#ffd700', bg: 'bg-yellow-900/20' } // Special
];

// Sortable Item
const SortableTask = ({ task, onComplete, onDelete }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id });
    const style = { transform: CSS.Transform.toString(transform), transition };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="touch-none mb-2">
            <div className="flex items-center gap-3 bg-[#1e293b] p-3 rounded border border-slate-700 hover:border-slate-500 group transition-all">
                <button
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => { e.stopPropagation(); onComplete(task.id); }}
                    className="w-6 h-6 rounded border border-slate-500 hover:bg-red-500 hover:border-red-500 flex items-center justify-center transition-colors cursor-pointer relative z-50"
                >
                    ⚔️
                </button>
                <div className="flex-1 text-sm text-slate-200 font-medium">
                    {task.title}
                </div>
                <button
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
                    className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 cursor-pointer relative z-50"
                >
                    🗑️
                </button>
            </div>
        </div>
    );
};

const RaidBoss = ({ profile, updateProfile, activeRaid, setActiveRaid }) => {
    const [shake, setShake] = useState(false);
    const [flash, setFlash] = useState(false);
    const [newTask, setNewTask] = useState('');

    // Dnd Sensors
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

    // --- CREATE RAID ---
    const [setupMode, setSetupMode] = useState(!activeRaid);
    const [raidName, setRaidName] = useState('');
    const [selectedBoss, setSelectedBoss] = useState(BOSSES[0]);

    const startRaid = () => {
        if (!raidName.trim()) return;

        const newRaid = {
            id: Date.now(),
            name: raidName,
            bossId: selectedBoss.id,
            maxHp: 100, // Percentage based mostly, but let's say 100%
            currentHp: 100,
            tasks: [], // Subtasks
            status: 'active'
        };

        setActiveRaid(newRaid);
        setSetupMode(false);
        playSound.bossHit(); // Start sound
    };

    // --- BATTLE LOGIC ---
    const calculateHp = (tasks) => {
        if (tasks.length === 0) return 100;
        const completed = tasks.filter(t => t.completed).length;
        if (completed === 0) return 100;
        // Simple formula: HP is percentage of REMAINING tasks
        // Or damage per task? Let's use percentage of remaining.
        // Actually, for a visual bar, it's better if HP = (Remaining / Total) * 100
        const remaining = tasks.length - completed;
        return Math.floor((remaining / tasks.length) * 100);
    };

    const addTask = (e) => {
        e.preventDefault();
        if (!newTask.trim()) return;

        const task = { id: Date.now(), title: newTask, completed: false };
        const updatedTasks = [...(activeRaid.tasks || []), task];

        // Updating tasks usually HEALS the boss if we use percentage logic directly?
        // Let's keep logic simple: HP is strictly based on % of UNCOMPLETED tasks.
        // So adding a task adds HP.

        const newHp = calculateHp(updatedTasks);

        setActiveRaid({
            ...activeRaid,
            tasks: updatedTasks,
            currentHp: newHp
        });
        setNewTask('');
    };

    const completeTask = (taskId) => {
        // DAMAGE PHASE
        setShake(true);
        setFlash(true);
        setTimeout(() => { setShake(false); setFlash(false); }, 500);
        playSound.bossHit();

        const updatedTasks = activeRaid.tasks.map(t =>
            t.id === taskId ? { ...t, completed: true } : t
        );

        const newHp = calculateHp(updatedTasks);

        if (newHp === 0) {
            // BOSS DEFEATED
            handleVictory();
        }

        setActiveRaid({
            ...activeRaid,
            tasks: updatedTasks,
            currentHp: newHp
        });
    };

    const handleVictory = () => {
        playSound.bossDie(); // Need to implement or reuse
        confetti({ particleCount: 500, spread: 150 });

        toast.custom((t) => (
            <div className="bg-black border-4 border-yellow-500 p-6 rounded-xl text-center shadow-[0_0_50px_rgba(255,215,0,0.8)] animate-bounce">
                <div className="text-6xl mb-2">💀</div>
                <div className="text-3xl font-bold text-yellow-500 font-serif">LEGENDARY VICTORY!</div>
                <div className="text-white mt-2">Raid Boss Defeated!</div>
                <div className="text-yellow-300 mt-1">+5000 Gold | +10000 XP</div>
            </div>
        ), { duration: 10000 });

        // Update Profile Rewards
        const currentStats = profile.stats || {};
        updateProfile({
            ...profile,
            gold: (profile.gold || 0) + 5000,
            xp: (profile.xp || 0) + 10000, // Massive XP likely levels up multiple times
            stats: {
                ...currentStats,
                bossesDefeated: (currentStats.bossesDefeated || 0) + 1
            }
        });

        // Delay clearing raid
        setTimeout(() => {
            setActiveRaid(null);
            setSetupMode(true);
        }, 8000);
    };

    const deleteTask = (id) => {
        const updatedTasks = activeRaid.tasks.filter(t => t.id !== id);
        setActiveRaid({ ...activeRaid, tasks: updatedTasks, currentHp: calculateHp(updatedTasks) });
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            const oldIndex = activeRaid.tasks.findIndex((t) => t.id === active.id);
            const newIndex = activeRaid.tasks.findIndex((t) => t.id === over.id);
            const newTasks = arrayMove(activeRaid.tasks, oldIndex, newIndex);
            setActiveRaid({ ...activeRaid, tasks: newTasks });
        }
    };

    const handleSurrender = () => {
        if (confirm("Are you sure you want to flee? The boss will heal fully and you will gain nothing!")) {
            playSound.error(); // Defeat sound
            toast.error("You fled the battle... Shameful!");
            setActiveRaid(null);
            setSetupMode(true);
        }
    };

    if (setupMode || !activeRaid) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-6 bg-[#0f172a] text-center">
                <h2 className="text-3xl font-bold text-red-500 font-serif mb-6 flex items-center gap-2">
                    🐲 <span className="drop-shadow-lg">Summon Raid Boss</span>
                </h2>

                <div className="w-full max-w-md space-y-4">
                    <input
                        type="text"
                        placeholder="Raid Name (e.g. Refactor App)"
                        className="w-full bg-[#1e293b] border border-slate-600 rounded p-3 text-white focus:border-red-500 focus:outline-none"
                        value={raidName}
                        onChange={e => setRaidName(e.target.value)}
                    />

                    <div className="grid grid-cols-3 gap-2">
                        {BOSSES.map(boss => (
                            <button
                                key={boss.id}
                                onClick={() => setSelectedBoss(boss)}
                                className={`p-2 rounded border-2 flex flex-col items-center gap-1 transition-all
                                    ${selectedBoss.id === boss.id ? 'border-red-500 bg-red-900/20 scale-105' : 'border-slate-700 bg-[#1e293b] hover:bg-slate-800'}
                                `}
                            >
                                <span className="text-2xl">{boss.icon}</span>
                                <span className="text-[10px] font-bold text-slate-300">{boss.name}</span>
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={startRaid}
                        disabled={!raidName}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded shadow-[0_0_20px_rgba(220,38,38,0.5)] disabled:opacity-50 disabled:cursor-not-allowed transition-all uppercase tracking-widest mt-4"
                    >
                        Begin Raid
                    </button>
                </div>
            </div>
        );
    }

    const bossData = BOSSES.find(b => b.id === activeRaid.bossId) || BOSSES[0];
    const activeTasks = activeRaid.tasks ? activeRaid.tasks.filter(t => !t.completed) : [];

    return (
        <div className={`h-full flex flex-col relative overflow-hidden bg-[#0f0a0a] transition-colors duration-100 ${flash ? 'bg-red-900/50' : ''}`}>
            {/* Environment */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-30 pointer-events-none"></div>

            {/* BOSS VISUALS */}
            <div className={`p-4 flex flex-col items-center justify-center relative min-h-[30%] ${shake ? 'animate-shake' : ''}`}>

                {/* HP BAR */}
                <div className="w-full max-w-lg mb-4 relative z-10">
                    <div className="flex justify-between text-xs font-bold text-red-400 mb-1 uppercase tracking-wider items-end">
                        <div className="flex flex-col">
                            <span>{activeRaid.name}</span>
                            <button
                                onClick={handleSurrender}
                                className="text-[10px] text-zinc-600 hover:text-red-500 underline mt-1 cursor-pointer w-fit"
                            >
                                🏳️ Surrender
                            </button>
                        </div>
                        <span>{activeRaid.currentHp}% HP</span>
                    </div>
                    <div className="h-6 bg-black border-2 border-red-900 rounded-full overflow-hidden relative shadow-[0_0_15px_rgba(220,38,38,0.4)]">
                        <div
                            className="h-full bg-gradient-to-r from-red-600 to-red-500 transition-all duration-500 ease-out"
                            style={{ width: `${activeRaid.currentHp}%` }}
                        ></div>
                        {/* Segments */}
                        <div className="absolute inset-0 grid grid-cols-10 pointer-events-none">
                            {[...Array(9)].map((_, i) => <div key={i} className="border-r border-black/20 h-full"></div>)}
                        </div>
                    </div>
                </div>

                {/* SPRITE */}
                <div className="relative group">
                    <div className={`text-8xl filter drop-shadow-[0_0_30px_rgba(220,38,38,0.6)] transform transition-transform duration-700 ${shake ? 'scale-90 brightness-200 contrast-150 grayscale-0' : 'animate-float'}`}>
                        {bossData.icon}
                    </div>
                    {/* Hit Effect Overlay */}
                    {flash && <div className="absolute inset-0 flex items-center justify-center text-4xl font-bold text-white animate-ping">💥</div>}
                </div>
            </div>

            {/* ACTION PANEL (TASKS) */}
            <div className="flex-1 bg-[#1a1c22] border-t-4 border-red-900/50 rounded-t-3xl relative z-10 shadow-2xl flex flex-col">
                {/* Input */}
                <div className="p-4 border-b border-slate-700 bg-[#14161b]">
                    <form onSubmit={addTask} className="flex gap-2">
                        <input
                            type="text"
                            value={newTask}
                            onChange={e => setNewTask(e.target.value)}
                            placeholder="Add Raid Attack (Subtask)..."
                            className="flex-1 bg-[#0f1115] border border-slate-600 rounded px-3 py-2 text-white focus:border-red-500 focus:outline-none font-mono text-sm"
                        />
                        <button type="submit" className="bg-red-600 hover:bg-red-700 text-white px-4 rounded font-bold shadow-[0_0_10px_rgba(220,38,38,0.3)]">
                            +
                        </button>
                    </form>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {activeTasks.length === 0 ? (
                        <div className="text-center text-slate-600 mt-8 italic">
                            Prepare your attacks...
                        </div>
                    ) : (
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext items={activeTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                                {activeTasks.map(task => (
                                    <SortableTask key={task.id} task={task} onComplete={completeTask} onDelete={deleteTask} />
                                ))}
                            </SortableContext>
                        </DndContext>
                    )}
                </div>

                {/* Footer Status */}
                <div className="p-2 bg-black/50 text-center text-[10px] text-zinc-500 font-mono">
                    RAID IN PROGRESS • {activeTasks.length} TASKS REMAINING
                </div>
            </div>
        </div>
    );
};

export default RaidBoss;
