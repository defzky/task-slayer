export interface ProfileStats {
  questsCompleted: number;
  bossesDefeated: number;
  totalGoldEarned: number;
  notesCreated: number;
  itemsBought: number;
  tabsRestored?: number;
  level?: number;
}

export interface Profile {
  level: number;
  xp: number;
  maxXp: number;
  gold: number;
  userClass: string;
  skillPoints: number;
  unlockedSkills: string[];
  stats: ProfileStats;
  unlockedAchievements: string[];
  streak?: number;
  lastLoginDate?: string;
}

export interface Subtask {
  id: number;
  title: string;
  completed: boolean;
}

export interface Quest {
  id: number;
  title: string;
  type: 'boss' | 'normal';
  xpReward: number;
  hp: number;
  maxHp: number;
  deadline: string | null;
  subtasks: Subtask[];
  completed: boolean;
}

export interface Note {
  id: number;
  content: string;
  updatedAt: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  type: string;
  description: string;
  count: number;
}

export interface RaidTask {
  id: number;
  title: string;
  completed: boolean;
}

export interface RaidRewards {
  gold: number;
  xp: number;
}

export interface ActiveRaid {
  id: number;
  name: string;
  bossId: string;
  maxHp: number;
  currentHp: number;
  tasks: RaidTask[];
  status?: string;
  rewards?: RaidRewards;
  isSpecial?: boolean;
}

export interface ShopItem {
  id: string;
  name: string;
  price: number;
  type: 'theme' | 'avatar' | 'confetti' | 'consumable';
  value: string;
  purchased: boolean;
  description?: string;
}

export interface Skill {
  id: string;
  name: string;
  icon: string;
  description: string;
  cost: number;
  x: number;
  y: number;
  req: string | null;
}

export interface Achievement {
  id: string;
  name: string;
  icon: string;
  description: string;
  condition: (stats: ProfileStats) => boolean;
}

export interface Boss {
  id: string;
  name: string;
  hpMultiplier: number;
  icon: string;
  color: string;
  bg: string;
}

export interface TabInfo {
  url: string;
  title: string;
  favIconUrl?: string;
}

export interface FrozenSession {
  id: number;
  name: string;
  date: string;
  tabs: TabInfo[];
}

export interface ClassInfo {
  id: string;
  name: string;
  icon: string;
  desc: string;
  bonus: string;
}

export type ThemeType = 'default' | 'cyber' | 'forest' | 'royal';
export type ConfettiStyle = 'default' | 'fire' | 'ice';
export type ActiveTab = 'notes' | 'freezer' | 'quests' | 'shop' | 'skills' | 'raids' | 'achievements' | 'settings';
