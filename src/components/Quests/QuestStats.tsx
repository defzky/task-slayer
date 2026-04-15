import React, { memo } from 'react';
import type { Profile } from '../../types';

interface QuestStatsProps {
  profile: Profile;
  streak: number;
  avatar: string;
  completedCount: number;
}

const QuestStats = memo<React.FC<QuestStatsProps>>(({
  profile,
  streak,
  avatar,
  completedCount
}) => {
  return (
    <div className="bg-[#2a282a] p-4 rounded-lg border border-[#444] mb-4 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-[#444] rounded-full flex items-center justify-center text-2xl border border-[#d4af37]">
          {avatar || '🧙‍♂️'}
        </div>
        <div>
          <div className="text-sm text-[#d4af37] font-bold">
            Lvl {profile.level} {profile.userClass || 'Adventurer'}
          </div>
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
        <div className="text-sm text-gray-400">
          Quests Completed:{' '}
          <span className="font-bold text-[#e0e0e0]">{completedCount}</span>
        </div>
      </div>
    </div>
  );
});

export default QuestStats;
