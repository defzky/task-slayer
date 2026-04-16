import React from 'react';
import type { Profile, Achievement, ProfileStats } from '../types';

export const ACHIEVEMENTS: Achievement[] = [
    {
        id: 'novice_slayer',
        name: 'Novice Slayer',
        icon: '🗡️',
        description: 'Complete 10 Quests',
        condition: (stats: ProfileStats) => (stats.questsCompleted || 0) >= 10
    },
    {
        id: 'dungeon_master',
        name: 'Dungeon Master',
        icon: '👹',
        description: 'Defeat 5 Bosses',
        condition: (stats: ProfileStats) => (stats.bossesDefeated || 0) >= 5
    },
    {
        id: 'millionaire',
        name: 'Millionaire',
        icon: '💎',
        description: 'Earn 1000 Gold total',
        condition: (stats: ProfileStats) => (stats.totalGoldEarned || 0) >= 1000
    },
    {
        id: 'scholar',
        name: 'Scholar',
        icon: '📜',
        description: 'Write 20 Notes',
        condition: (stats: ProfileStats) => (stats.notesCreated || 0) >= 20
    },
    {
        id: 'shopaholic',
        name: 'Shopaholic',
        icon: '🛍️',
        description: 'Buy 5 Items',
        condition: (stats: ProfileStats) => (stats.itemsBought || 0) >= 5
    },
    {
        id: 'time_lord',
        name: 'Time Lord',
        icon: '⏳',
        description: 'Restore 50 Tabs',
        condition: (stats: ProfileStats) => (stats.tabsRestored || 0) >= 50
    },
    {
        id: 'legendary_hero',
        name: 'Legendary Hero',
        icon: '👑',
        description: 'Reach Level 10',
        condition: (stats: ProfileStats) => (stats.level || 1) >= 10
    }
];

interface AchievementsProps {
    profile: Profile;
}

const Achievements: React.FC<AchievementsProps> = ({ profile }) => {
    const stats = profile.stats || {};
    const unlocked = new Set(profile.unlockedAchievements || []);

    return (
        <div className="h-full flex flex-col p-4 bg-[#1a0f0f] relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] opacity-20 pointer-events-none"></div>

            <div className="relative z-10 flex justify-between items-center mb-6 border-b border-[#d4af37]/50 pb-4">
                <h2 className="text-2xl font-bold text-[#d4af37] font-serif flex items-center gap-2">
                    <span className="text-3xl">🏆</span> Hall of Trophies
                </h2>
                <div className="text-[#d4af37]/70 text-xs font-mono uppercase tracking-widest">
                    {unlocked.size} / {ACHIEVEMENTS.length} Unlocked
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10 p-2">
                <div className="grid grid-cols-2 gap-4">
                    {ACHIEVEMENTS.map(ach => {
                        const isUnlocked = unlocked.has(ach.id);

                        return (
                            <div
                                key={ach.id}
                                className={`relative p-4 rounded-lg border-2 flex flex-col items-center text-center transition-all duration-500 group
                                    ${isUnlocked
                                        ? 'bg-[#2a1010] border-[#d4af37] shadow-[0_0_15px_rgba(212,175,55,0.2)]'
                                        : 'bg-[#0f0f10] border-[#333] grayscale opacity-60'
                                    }
                                `}
                            >
                                <div className="absolute inset-x-0 bottom-0 h-1 bg-black/50"></div>

                                <div className={`text-4xl mb-3 transition-transform duration-300 ${isUnlocked ? 'group-hover:scale-110 drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]' : 'blur-[1px]'}`}>
                                    {ach.icon}
                                </div>

                                <div className={`font-bold text-sm mb-1 font-serif ${isUnlocked ? 'text-[#e0e0e0]' : 'text-gray-600'}`}>
                                    {ach.name}
                                </div>

                                <div className="text-[10px] text-gray-500 font-mono leading-tight">
                                    {ach.description}
                                </div>

                                {isUnlocked && (
                                    <div className="absolute top-2 right-2 text-[#d4af37] text-[10px]">✔</div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default Achievements;
