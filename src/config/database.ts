/**
 * Database integration settings for Task Slayer
 * Remove Obsidian dependencies and use DatabaseToki for cloud sync
 */

// DatabaseToki configuration - REPLACE WITH YOUR ACTUAL URL
export const DB_URL = 'https://databasetoki.vercel.app';
export const PROJECT_ID = 'task-slayer-6faab9da';
export const API_KEY = 'dbtoki_live_09c447d8706549acb788f4d2636b3ad7';

// Database tables
export const TABLES = {
  QUESTS: 'quests',
  NOTES: 'notes',
  FREEZER: 'freezer',
  INVENTORY: 'inventory',
  PROFILES: 'profiles',
  SETTINGS: 'settings',
  ACHIEVEMENTS: 'achievements'
};
