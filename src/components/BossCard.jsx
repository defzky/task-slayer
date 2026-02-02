import React from 'react';
import { playSound } from '../utils/soundfx';

const BossCard = ({ quest, onDelete, onAddSubtask, onCompleteSubtask, soundEnabled }) => {
    return (
        <div className="relative group mb-3">
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
                    <div className="text-red-500 cursor-pointer hover:text-red-300" onClick={(e) => { e.stopPropagation(); onDelete(quest.id); }}>
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
                                        onClick={(e) => { e.stopPropagation(); onCompleteSubtask(quest.id, sub.id); }}
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
                                    onAddSubtask(quest.id, e.currentTarget.value);
                                    e.currentTarget.value = '';
                                }
                            }}
                            onPointerDown={(e) => e.stopPropagation()}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BossCard;
