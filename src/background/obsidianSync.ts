/**
 * Obsidian Sync Service
 * Handles communication between Task Slayer and Obsidian vault
 */

import { MOCKBASE_URL } from '../config';

export interface ObsidianTask {
  id: string;
  title: string;
  completed: boolean;
  filePath: string;
  lineNumber: number;
  tags: string[];
  priority?: 'high' | 'medium' | 'low';
}

export interface ObsidianNote {
  path: string;
  title: string;
  content: string;
  tasks: ObsidianTask[];
  frontmatter?: Record<string, any>;
}

export class ObsidianSyncService {
  private syncInterval: number = 30000; // 30 seconds
  private intervalId?: NodeJS.Timeout;

  /**
   * Fetch all tasks from Obsidian vault via MockBase
   */
  async fetchObsidianTasks(): Promise<ObsidianTask[]> {
    try {
      const response = await fetch(`${MOCKBASE_URL}/obsidian/tasks`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.tasks || [];
    } catch (error) {
      console.error('Failed to fetch Obsidian tasks:', error);
      return [];
    }
  }

  /**
   * Push quest to Obsidian as a task
   */
  async pushQuestToObsidian(quest: {
    id: number;
    title: string;
    filePath?: string;
  }): Promise<boolean> {
    try {
      const response = await fetch(`${MOCKBASE_URL}/obsidian/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: quest.title,
          questId: quest.id,
          filePath: quest.filePath || '/Inbox.md'
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to push quest to Obsidian:', error);
      return false;
    }
  }

  /**
   * Sync task completion status
   */
  async syncTaskStatus(
    taskId: string,
    completed: boolean
  ): Promise<boolean> {
    try {
      const response = await fetch(
        `${MOCKBASE_URL}/obsidian/tasks/${taskId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ completed })
        }
      );

      return response.ok;
    } catch (error) {
      console.error('Failed to sync task status:', error);
      return false;
    }
  }

  /**
   * Create new note with quest metadata
   */
  async createQuestNote(quest: {
    id: number;
    title: string;
    description?: string;
  }): Promise<string | null> {
    try {
      const response = await fetch(`${MOCKBASE_URL}/obsidian/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: quest.title,
          content: quest.description || '',
          frontmatter: {
            'task-slayer': {
              questId: quest.id,
              createdAt: new Date().toISOString()
            }
          }
        })
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.path;
    } catch (error) {
      console.error('Failed to create quest note:', error);
      return null;
    }
  }

  /**
   * Start auto-sync
   */
  startAutoSync(callback: () => void): void {
    this.intervalId = setInterval(() => {
      callback();
    }, this.syncInterval);
  }

  /**
   * Stop auto-sync
   */
  stopAutoSync(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }
}

// Export singleton instance
export const obsidianSync = new ObsidianSyncService();
