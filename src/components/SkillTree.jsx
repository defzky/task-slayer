import React, { useState } from 'react';
import { toast } from 'sonner';
import { playSound } from '../utils/soundfx';

// Vertical Layout Coordinates (0-100% relative to container)
const SKILLS = [
    // --- ROOTS (Top) ---
    {
        id: 'fast_learner',
        name: 'Fast Learner',
        icon: '🧠',
        description: '+5% XP from Quests',
        cost: 1,
        x: 25, y: 15,
        req: null
    },
    {
        id: 'novice_looter',
        name: 'Novice Looter',
        icon: '💰',
        description: '+5% Gold from Quests',
        cost: 1,
        x: 75, y: 15,
        req: null
    },

    // --- TIER 2 (Middle) ---
    {
        id: 'critical_mind',
        name: 'Critical Mind',
        icon: '⚡',
        description: '10% Chance for DOUBLE Rewards',
        cost: 3,
        x: 25, y: 45,
        req: 'fast_learner'
    },
    {
        id: 'goblin_negotiator',
        name: 'Goblin Negotiator',
        icon: '🤝',
        description: '10% Discount in Shop',
        cost: 2,
        x: 75, y: 45,
        req: 'novice_looter'
    },
    {
        id: 'time_wizard',
        name: 'Time Wizard',
        icon: '⏳',
        description: 'Scrolls cost 50% less',
        cost: 2,
        x: 50, y: 30, // Center between roots? Or maybe off to side
        req: 'novice_looter'
    },

    // --- TIER 3 (Bottom) ---
    {
        id: 'midas_touch',
        name: 'Midas Touch',
        icon: '👑',
        description: '+15% Gold (Stacks)',
        cost: 3,
        x: 75, y: 75,
        req: 'goblin_negotiator'
    },
];

const SkillTree = ({ profile, updateProfile, soundEnabled }) => {
    const unlockedSkills = new Set(profile.unlockedSkills || []);
    const skillPoints = profile.skillPoints || 0;

    const handleUnlock = (skill) => {
        if (unlockedSkills.has(skill.id)) return;

        // Check Logic
        if (skillPoints < skill.cost) {
            toast.error("Not enough Skill Points! Level up to earn more.");
            return;
        }
        if (skill.req && !unlockedSkills.has(skill.req)) {
            toast.error("Prerequisite skill not learned directly!");
            return;
        }

        if (confirm(`Learn ${skill.name} for ${skill.cost} SP?`)) {
            if (soundEnabled) playSound.levelUp();

            const newProfile = {
                ...profile,
                skillPoints: skillPoints - skill.cost,
                unlockedSkills: [...unlockedSkills, skill.id]
            };
            updateProfile(newProfile);
            toast.success(`Learned ${skill.name}!`);
        }
    };

    return (
        <div className="h-full flex flex-col relative overflow-hidden bg-[#0f0f1a]">
            {/* Background */}
            <div className="absolute inset-0 bg-[#0f0f1a] z-0">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 animate-pulse"></div>
            </div>

            {/* Header */}
            <div className="relative z-10 p-4 border-b border-blue-900/50 flex justify-between items-center bg-[#0f0f1a]/80 backdrop-blur-sm">
                <h2 className="text-xl font-bold text-blue-100 font-serif flex items-center gap-2">
                    <span className="text-2xl animate-float">🌌</span> Constellation
                </h2>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-blue-400 uppercase tracking-widest">SP:</span>
                    <span className="text-xl font-bold text-[#00f7ff] shadow-[0_0_10px_rgba(0,247,255,0.4)] px-2 py-0.5 bg-blue-950/50 rounded border border-blue-500/30">
                        {skillPoints}
                    </span>
                </div>
            </div>

            {/* Tree Container */}
            <div className="flex-1 relative z-10 overflow-y-auto overflow-x-hidden custom-scrollbar">
                {/* 
                    We use a container with min-height to allow scrolling if screen is short.
                    The SVG overlay must match this container size.
                 */}
                <div className="relative w-full min-h-[500px] h-full">

                    {/* SVG Connector Layer */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                        {SKILLS.map(skill => {
                            if (!skill.req) return null;
                            const parent = SKILLS.find(s => s.id === skill.req);
                            if (!parent) return null;

                            const isUnlocked = unlockedSkills.has(skill.id);
                            const isParentUnlocked = unlockedSkills.has(parent.id);

                            return (
                                <line
                                    key={`line-${skill.id}`}
                                    x1={`${parent.x}%`} y1={`${parent.y}%`}
                                    x2={`${skill.x}%`} y2={`${skill.y}%`}
                                    stroke={isUnlocked ? '#00f7ff' : (isParentUnlocked ? '#444' : '#222')}
                                    strokeWidth="1.5"
                                    strokeDasharray={isUnlocked ? "0" : "4,4"}
                                    className="transition-all duration-1000 opacity-60"
                                />
                            );
                        })}
                    </svg>

                    {/* Nodes Layer */}
                    {SKILLS.map((skill, index) => {
                        const isUnlocked = unlockedSkills.has(skill.id);
                        const canUnlock = !isUnlocked && (skillPoints >= skill.cost) && (!skill.req || unlockedSkills.has(skill.req));

                        // Animation Logic: Node is static, ICON floats.
                        const animClass = index % 2 === 0 ? 'animate-float' : 'animate-float-delayed';

                        return (
                            <div
                                key={skill.id}
                                className={`absolute transform -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center group transition-all duration-500`}
                                style={{ left: `${skill.x}%`, top: `${skill.y}%` }}
                            >
                                <button
                                    onClick={() => handleUnlock(skill)}
                                    className={`w-14 h-14 rounded-full border-2 flex items-center justify-center transition-all duration-300 relative
                                        ${isUnlocked
                                            ? 'bg-blue-950 border-[#00f7ff] shadow-[0_0_20px_rgba(0,247,255,0.5)] scale-110'
                                            : (canUnlock
                                                ? 'bg-gray-800 border-yellow-500 cursor-pointer hover:bg-gray-700 hover:scale-105'
                                                : 'bg-black border-gray-800 opacity-50 cursor-not-allowed grayscale')
                                        }
                                    `}
                                    title={skill.description}
                                >
                                    <span className={`text-2xl drop-shadow-md ${animClass}`}>{skill.icon}</span>

                                    {/* Cost Badge for locked items */}
                                    {!isUnlocked && (
                                        <div className="absolute -top-2 -right-2 bg-black border border-gray-600 rounded-full w-5 h-5 flex items-center justify-center text-[9px] font-bold text-gray-300">
                                            {skill.cost}
                                        </div>
                                    )}
                                </button>

                                {/* Label */}
                                <div className={`mt-2 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider text-center transition-colors max-w-[100px]
                                    ${isUnlocked ? 'bg-[#00f7ff]/10 text-[#00f7ff] border border-[#00f7ff]/30' : 'text-gray-500 bg-black/50'}
                                `}>
                                    {skill.name}
                                </div>

                                {/* Hover Tooltip (Positioned smartly) */}
                                <div className="absolute top-full mt-2 bg-black/95 text-left p-3 rounded-lg border border-blue-500/30 w-40 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl backdrop-blur-md">
                                    <div className="text-xs text-blue-100/90 leading-tight">{skill.description}</div>
                                    {!isUnlocked && <div className="text-[9px] text-yellow-500 mt-1 font-mono">Requires: {skill.cost} SP</div>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default SkillTree;
