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
    <div
      className="bg-[#2a282a] p-4 rounded-lg border border-[#444] mb-4 flex items-center justify-between shadow-sm"
      role="region"
      aria-label="Player stats"
    >
      <div className="flex items-center gap-4">
        <div
          className="w-12 h-12 bg-[#444] rounded-full flex items-center justify-center text-2xl border border-[#d4af37]"
          aria-label={`Player avatar: ${avatar || 'Wizard'}`}
          role="img"
        >
          {avatar || '🧙‍♂️'}
        </div>
        <div>
          <div className="text-sm text-[#d4af37] font-bold">
            Lvl {profile.level} {profile.userClass || 'Adventurer'}
          </div>
          <div
            className="w-40 h-3 bg-[#111] rounded-full mt-1 relative overflow-hidden"
            role="progressbar"
            aria-valuenow={profile.xp}
            aria-valuemin={0}
            aria-valuemax={profile.maxXp}
            aria-label="Experience progress"
          >
            <div
              className="h-full bg-[#d4af37] transition-all duration-500 ease-out"
              style={{ width: `${(profile.xp / profile.maxXp) * 100}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 text-right mt-1 flex justify-between">
            <span className="text-[#ffd700] font-bold" aria-label={`${profile.gold || 0} gold`}>
              🪙 {profile.gold || 0} G
            </span>
            <span aria-label={`${profile.xp} of ${profile.maxXp} experience`}>
              {profile.xp} / {profile.maxXp} XP
            </span>
          </div>
        </div>
      </div>
      <div className="text-right">
        <div
          className="flex items-center justify-end gap-1 mb-1"
          title="Daily Streak"
          role="status"
          aria-label={`${streak} day streak`}
        >
          <span className="text-xl" aria-hidden="true">🔥</span>
          <span className="font-bold text-[#ffae42] text-base">{streak} Day Streak</span>
        </div>
        <div className="text-sm text-gray-400">
          Quests Completed:{' '}
          <span className="font-bold text-[#e0e0e0]" aria-label={`${completedCount} quests completed`}>
            {completedCount}
          </span>
        </div>
      </div>
    </div>
  );
});

export default QuestStats;
