import React from 'react';
import type { Quest } from '../../types';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import QuestItem from './QuestItem';
import BossQuest from './BossQuest';

type QuestTab = 'active' | 'completed' | 'failed';

interface QuestListProps {
  quests: Quest[];
  activeTab: QuestTab;
  onComplete: (id: number) => void;
  onDelete: (id: number) => void;
  onEdit: (quest: Quest) => void;
  onAddSubtask: (questId: number, title: string) => void;
  onCompleteSubtask: (questId: number, subtaskId: number) => void;
}

const QuestList: React.FC<QuestListProps> = ({
  quests,
  activeTab,
  onComplete,
  onDelete,
  onEdit,
  onAddSubtask,
  onCompleteSubtask
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  const isExpired = (q: Quest): boolean =>
    q.deadline ? new Date(q.deadline) < new Date() && !q.completed : false;

  const visualActiveQuests = quests.filter((q) => !q.completed && !isExpired(q));
  const visualCompletedQuests = quests.filter((q) => q.completed);
  const visualFailedQuests = quests.filter((q) => !q.completed && isExpired(q));

  const handleDragEnd = (event: {
    active: { id: unknown };
    over: { id: unknown } | null;
  }) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      // Drag logic handled by parent via callback if needed
      console.log('Drag ended:', active.id, over.id);
    }
  };

  const renderQuest = (quest: Quest) => {
    if (quest.type === 'boss') {
      return (
        <BossQuest
          key={quest.id}
          quest={quest}
          onAddSubtask={onAddSubtask}
          onCompleteSubtask={onCompleteSubtask}
          onComplete={onComplete}
          onDelete={onDelete}
        />
      );
    }

    return (
      <QuestItem
        key={quest.id}
        quest={quest}
        onComplete={onComplete}
        onDelete={onDelete}
        onEdit={onEdit}
      />
    );
  };

  if (activeTab === 'active') {
    if (visualActiveQuests.length === 0) {
      return (
        <div className="text-center text-gray-500 italic mt-8 text-base">
          The Quest Board is empty.
          <br />
          The realm is safe... for now.
        </div>
      );
    }

    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={visualActiveQuests.map((q) => q.id)}
          strategy={verticalListSortingStrategy}
        >
          {visualActiveQuests.map(renderQuest)}
        </SortableContext>
      </DndContext>
    );
  }

  if (activeTab === 'completed') {
    if (visualCompletedQuests.length === 0) {
      return (
        <div className="text-center text-gray-600 italic mt-8 text-sm">
          No victories yet. Go slay some tasks!
        </div>
      );
    }

    return (
      <div className="animate-in fade-in">
        {visualCompletedQuests.map((quest) => (
          <div
            key={quest.id}
            className="bg-[#1a181a] border border-[#333] rounded p-3 mb-2 opacity-80 hover:opacity-100 transition-all"
          >
            <div className="flex justify-between items-center">
              <div>
                <div className="line-through text-gray-500 text-sm font-bold">
                  {quest.title}
                </div>
                <div className="text-xs text-green-700 font-mono">
                  Completed • +{quest.xpReward} XP
                </div>
              </div>
              <button
                onClick={() => onDelete(quest.id)}
                className="text-gray-700 hover:text-red-500 text-sm"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Failed tab
  if (visualFailedQuests.length === 0) {
    return (
      <div className="text-center text-gray-600 italic mt-8 text-sm">
        Great job! No overdue quests.
      </div>
    );
  }

  return (
    <div className="animate-in fade-in">
      {visualFailedQuests.map((quest) => (
        <div
          key={quest.id}
          className="bg-[#1a0f0f] border border-red-900/30 rounded p-3 mb-2 relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cracked-ground.png')] opacity-10 pointer-events-none"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <div className="text-red-800 font-bold text-sm tracking-widest uppercase">
                FAILED
              </div>
              <div className="text-gray-400 text-base font-serif italic mb-1">
                {quest.title}
              </div>
              <div className="text-red-500 text-xs font-mono">
                Expired:{' '}
                {quest.deadline &&
                  new Date(quest.deadline).toLocaleString()}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => onComplete(quest.id)}
                className="text-xs bg-[#1e1e1e] border border-gray-700 text-gray-500 hover:text-green-500 hover:border-green-500 px-2 py-1 rounded transition-colors"
              >
                Late Finish
              </button>
              <button
                onClick={() => onDelete(quest.id)}
                className="text-xs bg-[#1e1e1e] border border-red-900 text-red-800 hover:bg-red-900 hover:text-white px-2 py-1 rounded transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default QuestList;
