import React, { useState } from 'react';
import type { Quest } from '../../types';
import QuickDateSelector from './QuickDateSelector';

interface QuestFormProps {
  onAddQuest: (title: string, deadline: string | null, isBoss: boolean) => void;
  onEditQuest: (quest: Quest) => void;
  editingQuest: Quest | null;
  cancelEdit: () => void;
}

const QuestForm: React.FC<QuestFormProps> = ({
  onAddQuest,
  onEditQuest,
  editingQuest,
  cancelEdit
}) => {
  const [title, setTitle] = useState('');
  const [deadline, setDeadline] = useState<string | null>('');
  const [isBossMode, setIsBossMode] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (editingQuest) {
      onEditQuest({ ...editingQuest, title, deadline });
    } else {
      onAddQuest(title, deadline, isBossMode);
      setTitle('');
      setDeadline('');
      setIsBossMode(false);
    }
  };

  if (editingQuest) {
    return (
      <form onSubmit={handleSubmit} className="relative mb-4 bg-[#2a282a] p-3 rounded-lg border border-[#d4af37] animate-in fade-in slide-in-from-top-2">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[#d4af37] font-bold text-sm">Editing Scroll 📜</span>
          <button
            type="button"
            onClick={cancelEdit}
            className="text-gray-500 hover:text-white"
          >
            ✕
          </button>
        </div>
        <div className="flex flex-col gap-2">
          <input
            type="text"
            value={editingQuest.title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-[#1e1e1e] border border-[#444] text-[#e0e0e0] rounded p-2 focus:border-[#d4af37] outline-none"
          />
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Deadline:</span>
            <QuickDateSelector
              value={editingQuest.deadline}
              onChange={setDeadline}
              className="flex-1"
            />
          </div>
          <button
            type="submit"
            className="bg-[#d4af37] text-black font-bold py-1 rounded hover:opacity-90 mt-1"
          >
            Save Changes
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="relative mb-4 bg-[#1e1e1e] p-2 rounded-lg border border-[#333]">
      <div className="flex gap-2 items-center mb-2">
        <input
          type="checkbox"
          id="bossToggle"
          checked={isBossMode}
          onChange={(e) => setIsBossMode(e.target.value)}
          className="accent-[#d4af37]"
        />
        <label
          htmlFor="bossToggle"
          className={`text-xs font-bold ${
            isBossMode ? 'text-red-500 animate-pulse' : 'text-gray-400'
          }`}
        >
          {isBossMode ? '👹 BOSS BATTLE Mode' : 'Normal Quest'}
        </label>
      </div>
      <div className="relative flex gap-2">
        <input
          type="text"
          id="newQuestInput"
          placeholder={
            isBossMode
              ? 'Name of the Ancient Evil...'
              : 'New Quest (e.g., Slay the Bug)...'
          }
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={`flex-1 bg-[#2a282a] border ${
            isBossMode ? 'border-red-500 text-red-100' : 'border-[#444] text-[#e0e0e0]'
          } text-base rounded-lg py-3 px-4 focus:outline-none focus:border-[#d4af37] placeholder-gray-600`}
        />
        <QuickDateSelector
          value={deadline}
          onChange={setDeadline}
          className="w-auto"
        />
        <button
          type="submit"
          className="bg-[#2a282a] border border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37] hover:text-black transition-colors rounded-lg px-4 flex items-center justify-center font-bold"
        >
          ➕
        </button>
      </div>
    </form>
  );
};

export default QuestForm;
