import React, { useState, useEffect, useCallback } from 'react';
import { obsidianSync } from '../../background/obsidianSync';

interface ObsidianSyncProps {
  onSyncComplete?: (tasks: any[]) => void;
}

const MOCKBASE_URL = 'http://localhost:3000';

const ObsidianSync: React.FC<ObsidianSyncProps> = ({ onSyncComplete }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [taskCount, setTaskCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const checkConnection = useCallback(async () => {
    try {
      const response = await fetch(`${MOCKBASE_URL}/health`);
      if (response.ok) {
        setIsConnected(true);
        setError(null);
      } else {
        setIsConnected(false);
        setError('MockBase not responding');
      }
    } catch (err) {
      setIsConnected(false);
      setError('Cannot connect to MockBase. Is it running?');
    }
  }, []);

  const syncTasks = useCallback(async () => {
    setIsSyncing(true);
    setError(null);

    try {
      const response = await fetch(`${MOCKBASE_URL}/obsidian/tasks`);
      const data = await response.json();

      if (data.success) {
        setTaskCount(data.count);
        setLastSync(new Date());
        onSyncComplete?.(data.tasks);
      } else {
        setError('Failed to fetch tasks from Obsidian');
      }
    } catch (err) {
      setError('Sync failed. Check console for details.');
      console.error('Sync error:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [onSyncComplete]);

  const createQuestInObsidian = useCallback(async (title: string, questId?: number) => {
    try {
      const response = await fetch(`${MOCKBASE_URL}/obsidian/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, questId })
      });

      const data = await response.json();

      if (data.success) {
        new Notification('Quest created in Obsidian!', {
          body: title
        });
        syncTasks();
      } else {
        setError('Failed to create quest in Obsidian');
      }
    } catch (err) {
      setError('Failed to connect to MockBase');
      console.error('Create quest error:', err);
    }
  }, [syncTasks]);

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, [checkConnection]);

  return (
    <div className="bg-[#2a282a] border border-[#444] rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[#d4af37] font-bold flex items-center gap-2">
          <span className="text-xl">📓</span>
          Obsidian Sync
        </h3>
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${
              isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
            }`}
            title={isConnected ? 'Connected' : 'Disconnected'}
          />
          <span className="text-xs text-gray-400">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-800 text-red-300 text-xs p-2 rounded mb-3">
          ⚠️ {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 mb-3">
        <button
          onClick={syncTasks}
          disabled={!isConnected || isSyncing}
          className={`px-3 py-2 rounded text-xs font-bold transition-all ${
            !isConnected || isSyncing
              ? 'bg-[#444] text-gray-500 cursor-not-allowed'
              : 'bg-[#d4af37] text-black hover:opacity-90'
          }`}
        >
          {isSyncing ? '⏳ Syncing...' : '🔄 Sync Now'}
        </button>

        <button
          onClick={() => {
            const title = prompt('Enter quest title:');
            if (title) createQuestInObsidian(title);
          }}
          disabled={!isConnected}
          className={`px-3 py-2 rounded text-xs font-bold transition-all ${
            !isConnected
              ? 'bg-[#444] text-gray-500 cursor-not-allowed'
              : 'bg-[#2a282a] border border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37] hover:text-black'
          }`}
        >
          ➕ Create Quest
        </button>
      </div>

      <div className="text-xs text-gray-400 flex justify-between">
        <span>
          {taskCount} task{taskCount !== 1 ? 's' : ''} in Obsidian
        </span>
        {lastSync && (
          <span>
            Last sync: {lastSync.toLocaleTimeString()}
          </span>
        )}
      </div>
    </div>
  );
};

export default ObsidianSync;
