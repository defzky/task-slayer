import React from 'react';

type QuestTab = 'active' | 'completed' | 'failed';

interface QuestTabsProps {
  activeTab: QuestTab;
  onTabChange: (tab: QuestTab) => void;
  completedCount: number;
  failedCount: number;
}

const QuestTabs: React.FC<QuestTabsProps> = ({
  activeTab,
  onTabChange,
  completedCount,
  failedCount
}) => {
  const baseClasses = 'flex-1 py-1 text-xs font-bold rounded-t transition-colors';
  const activeClasses = 'bg-[#d4af37] text-black';
  const inactiveClasses = 'bg-[#1e1e1e] text-gray-500 hover:bg-[#333]';
  const failedActiveClasses = 'bg-red-900 text-red-100';

  return (
    <div className="flex gap-1 mb-2">
      <button
        onClick={() => onTabChange('active')}
        className={`${baseClasses} ${
          activeTab === 'active' ? activeClasses : inactiveClasses
        }`}
      >
        ⚔️ Active
      </button>
      <button
        onClick={() => onTabChange('completed')}
        className={`${baseClasses} ${
          activeTab === 'completed' ? activeClasses : inactiveClasses
        }`}
      >
        🏆 Completed ({completedCount})
      </button>
      <button
        onClick={() => onTabChange('failed')}
        className={`${baseClasses} ${
          activeTab === 'failed' ? failedActiveClasses : inactiveClasses
        }`}
      >
        💀 Failed ({failedCount})
      </button>
    </div>
  );
};

export default QuestTabs;
