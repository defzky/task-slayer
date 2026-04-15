import React from 'react';
import type { Quest } from '../../types';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface QuestItemProps {
  quest: Quest;
  onComplete: (id: number) => void;
  onDelete: (id: number) => void;
  onEdit: (quest: Quest) => void;
  isSortable?: boolean;
}

const QuestItem: React.FC<QuestItemProps> = ({
  quest,
  onComplete,
  onDelete,
  onEdit,
  isSortable = true
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition
  } = useSortable({
    id: quest.id,
    disabled: !isSortable
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  const isExpired = quest.deadline
    ? new Date(quest.deadline) < new Date() && !quest.completed
    : false;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-[#1a181a] border border-[#444] border-l-4 border-l-[#d4af37] rounded-r-lg p-4 transition-all relative mb-3 group shadow-[0_2px_5px_rgba(0,0,0,0.3)] hover:shadow-[0_0_15px_rgba(212,175,55,0.1)] overflow-hidden"
    >
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-leather.png')] opacity-30 pointer-events-none"></div>

      <div className="flex justify-between items-start">
        <div className="flex-1 cursor-grab active:cursor-grabbing">
          <div className="font-bold text-base text-[#e0e0e0]">{quest.title}</div>
          <div className="text-xs text-[#d4af37] mt-1 flex items-center gap-2">
            <span>Reward: {quest.xpReward} XP</span>
            {quest.deadline && (
              <span
                className={`flex items-center gap-1 ${
                  isExpired
                    ? 'text-red-500 font-bold animate-pulse'
                    : 'text-gray-400'
                }`}
              >
                ⏰{' '}
                {new Date(quest.deadline).toLocaleString([], {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 pl-2">
          <button
            onClick={() => onComplete(quest.id)}
            className="bg-[#1e1e1e] hover:bg-[#d4af37] hover:text-black border border-[#d4af37] text-[#d4af37] rounded-full w-10 h-10 flex items-center justify-center transition-all shadow-[0_0_5px_rgba(212,175,55,0.2)] text-lg"
          >
            ✔
          </button>
          <div className="flex flex-col gap-1">
            <button
              onClick={() => onEdit(quest)}
              className="text-gray-500 hover:text-[#d4af37] text-xs px-2"
            >
              ✏️
            </button>
            <button
              onClick={() => onDelete(quest.id)}
              className="text-gray-500 hover:text-red-400 text-xs px-2"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestItem;
