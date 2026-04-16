import { Plugin, Notice, addIcon } from 'obsidian';

interface TaskSlayerSettings {
  mockbaseUrl: string;
  autoSync: boolean;
  syncInterval: number;
  vaultPath: string;
}

const DEFAULT_SETTINGS: TaskSlayerSettings = {
  mockbaseUrl: 'http://localhost:3000',
  autoSync: true,
  syncInterval: 30,
  vaultPath: ''
};

export default class TaskSlayerPlugin extends Plugin {
  settings: TaskSlayerSettings;
  syncIntervalId?: number;

  async onload() {
    await this.loadSettings();

    // Add ribbon icon
    addIcon('task-slayer', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9L12 15L18 9"/></svg>`);

    this.addRibbonIcon('task-slayer', 'Task Slayer', () => {
      this.syncTasks();
    });

    // Add command
    this.addCommand({
      id: 'sync-tasks',
      name: 'Sync tasks with Task Slayer',
      callback: () => this.syncTasks()
    });

    this.addCommand({
      id: 'create-quest',
      name: 'Create quest from selected text',
      editorCallback: (editor) => {
        const selectedText = editor.getSelection();
        if (selectedText) {
          this.createQuest(selectedText);
        }
      }
    });

    // Add settings tab
    this.addSettingTab(new TaskSlayerSettingTab(this.app, this));

    // Start auto-sync if enabled
    if (this.settings.autoSync) {
      this.startAutoSync();
    }

    new Notice('Task Slayer plugin loaded');
  }

  onunload() {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
    }
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  async syncTasks() {
    try {
      const response = await fetch(`${this.settings.mockbaseUrl}/obsidian/tasks`);
      const data = await response.json();

      if (data.success) {
        new Notice(`Synced ${data.count} tasks from Task Slayer`);
        console.log('Task Slayer sync:', data);
      } else {
        new Notice('Failed to sync with Task Slayer');
      }
    } catch (error) {
      console.error('Task Slayer sync error:', error);
      new Notice('Cannot connect to Task Slayer. Is MockBase running?');
    }
  }

  async createQuest(title: string) {
    try {
      const response = await fetch(`${this.settings.mockbaseUrl}/obsidian/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title })
      });

      const data = await response.json();

      if (data.success) {
        new Notice(`Quest created: ${title}`);
      } else {
        new Notice('Failed to create quest');
      }
    } catch (error) {
      console.error('Quest creation error:', error);
      new Notice('Cannot connect to Task Slayer');
    }
  }

  startAutoSync() {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
    }

    this.syncIntervalId = window.setInterval(() => {
      this.syncTasks();
    }, this.settings.syncInterval * 1000);

    new Notice(`Auto-sync enabled: every ${this.settings.syncInterval}s`);
  }

  stopAutoSync() {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
      this.syncIntervalId = undefined;
      new Notice('Auto-sync disabled');
    }
  }
}

// Settings Tab
import { App, PluginSettingTab, Setting } from 'obsidian';

class TaskSlayerSettingTab extends PluginSettingTab {
  plugin: TaskSlayerPlugin;

  constructor(app: App, plugin: TaskSlayerPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName('MockBase URL')
      .setDesc('URL of the MockBase server')
      .addText(text => text
        .setPlaceholder('http://localhost:3000')
        .setValue(this.plugin.settings.mockbaseUrl)
        .onChange(async (value) => {
          this.plugin.settings.mockbaseUrl = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Auto-sync')
      .setDesc('Automatically sync tasks periodically')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.autoSync)
        .onChange(async (value) => {
          this.plugin.settings.autoSync = value;
          if (value) {
            this.plugin.startAutoSync();
          } else {
            this.plugin.stopAutoSync();
          }
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Sync Interval')
      .setDesc('How often to sync (in seconds)')
      .addSlider(slider => slider
        .setLimits(10, 300, 10)
        .setValue(this.plugin.settings.syncInterval)
        .setDynamicTooltip()
        .onChange(async (value) => {
          this.plugin.settings.syncInterval = value;
          await this.plugin.saveSettings();
          if (this.plugin.settings.autoSync) {
            this.plugin.startAutoSync();
          }
        }));
  }
}
