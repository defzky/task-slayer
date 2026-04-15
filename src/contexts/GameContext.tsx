import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import type { Profile, InventoryItem, Quest } from '../types';
import { saveToTable, getFromTable, updateInTable, deleteFromTable } from '../utils/databaseToki';

interface GameContextType {
  // Profile state
  profile: Profile;
  updateProfile: (profile: Profile) => void;
  
  // Inventory state
  inventory: InventoryItem[];
  updateInventory: (inventory: InventoryItem[]) => void;
  
  // Quests state
  quests: Quest[];
  setQuests: (quests: Quest[] | ((prev: Quest[]) => Quest[])) => void;
  
  // Settings state
  avatar: string;
  setAvatar: (avatar: string) => void;
  theme: string;
  setTheme: (theme: string) => void;
  confettiStyle: string;
  setConfettiStyle: (style: string) => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  
  // Raid state
  activeRaid: Quest | null;
  setActiveRaid: (raid: Quest | null) => void;
  
  // Streak
  streak: number;
  
  // Helper functions
  saveSetting: (key: string, value: any) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

interface GameProviderProps {
  children: ReactNode;
}

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  // Profile state
  const [profile, setProfileState] = useState<Profile>({
    level: 1,
    xp: 0,
    maxXp: 100,
    gold: 0,
    userClass: 'Novice',
    skillPoints: 0,
    unlockedSkills: [],
    stats: {
      questsCompleted: 0,
      bossesDefeated: 0,
      totalGoldEarned: 0,
      notesCreated: 0,
      itemsBought: 0
    },
    unlockedAchievements: []
  });
  
  // Inventory state
  const [inventory, setInventoryState] = useState<InventoryItem[]>([]);
  
  // Quests state
  const [quests, setQuests] = useState<Quest[]>([]);
  
  // Settings state
  const [avatar, setAvatar] = useState<string>('🧙‍♂️');
  const [theme, setTheme] = useState<string>('default');
  const [confettiStyle, setConfettiStyle] = useState<string>('default');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  
  // Raid state
  const [activeRaid, setActiveRaid] = useState<Quest | null>(null);
  
  // Streak
  const [streak, setStreak] = useState<number>(0);
  
  // Load all data on mount
  useEffect(() => {
    const loadData = async (result: Record<string, unknown>) => {
      // Load profile
      if (result.rpgProfile) {
        setProfileState(result.rpgProfile as Profile);
      }
      
      // Load inventory
      if (result.inventory) {
        setInventoryState(result.inventory as InventoryItem[]);
      }
      
      // Load quests
      if (result.quests) {
        setQuests(result.quests as Quest[]);
      }
      
      // Load settings
      if (result.userAvatar) setAvatar(result.userAvatar as string);
      if (result.userTheme) setTheme(result.userTheme as string);
      if (result.userConfetti) setConfettiStyle(result.userConfetti as string);
      if (result.soundEnabled !== undefined) setSoundEnabled(result.soundEnabled as boolean);
      if (result.activeRaid) setActiveRaid(result.activeRaid as Quest);
      
      // Load streak
      const today = new Date().toDateString();
      const lastLogin = result.lastLoginDate as string | undefined;
      let currentStreak = (result.dailyStreak as number) || 0;
      
      if (lastLogin !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (lastLogin === yesterday.toDateString()) {
          currentStreak += 1;
        } else {
          currentStreak = 1;
        }
        
        const updates = { lastLoginDate: today, dailyStreak: currentStreak };
        saveToStorage(updates);
      }
      setStreak(currentStreak);
    };
    
    // Try DatabaseToki first (production)
    const loadFromDatabaseToki = async () => {
      try {
        // Load profile from DatabaseToki
        const profiles = await getFromTable('profiles');
        const savedQuests = await getFromTable('quests');
        
        if (profiles.length > 0 && profiles[0].rpgProfile) {
          setProfileState(profiles[0].rpgProfile as Profile);
        }
        
        if (savedQuests.length > 0) {
          setQuests(savedQuests as Quest[]);
        }
        
        // Load settings from DatabaseToki
        const settings = await getFromTable('settings');
        if (settings.length > 0) {
          const lastSettings = settings[0];
          if (lastSettings.userAvatar) setAvatar(lastSettings.userAvatar);
          if (lastSettings.userTheme) setTheme(lastSettings.userTheme);
          if (lastSettings.userConfetti) setConfettiStyle(lastSettings.userConfetti);
          if (lastSettings.soundEnabled !== undefined) setSoundEnabled(lastSettings.soundEnabled);
        }
        
        // Load inventory from DatabaseToki
        const inventory = await getFromTable('inventory');
        if (inventory.length > 0) {
          setInventoryState(inventory as InventoryItem[]);
        }
        
        return true;
      } catch (error) {
        console.log('DatabaseToki not available, falling back to localStorage');
        return false;
      }
    };
    
    // Fallback to localStorage
    const loadFromLocalStorage = () => {
      const savedProfile = localStorage.getItem('rpgProfile');
      const savedInventory = localStorage.getItem('inventory');
      const savedQuests = localStorage.getItem('quests');
      const savedAvatar = localStorage.getItem('userAvatar');
      const savedTheme = localStorage.getItem('userTheme');
      const savedConfetti = localStorage.getItem('userConfetti');
      const savedSound = localStorage.getItem('soundEnabled');
      const savedRaid = localStorage.getItem('activeRaid');
      const savedStreak = localStorage.getItem('dailyStreak');
      const lastLoginDate = localStorage.getItem('lastLoginDate');
      
      return {
        rpgProfile: savedProfile ? JSON.parse(savedProfile) : null,
        inventory: savedInventory ? JSON.parse(savedInventory) : null,
        quests: savedQuests ? JSON.parse(savedQuests) : null,
        userAvatar: savedAvatar || null,
        userTheme: savedTheme || null,
        userConfetti: savedConfetti || null,
        soundEnabled: savedSound !== null ? JSON.parse(savedSound) : undefined,
        activeRaid: savedRaid ? JSON.parse(savedRaid) : null,
        dailyStreak: savedStreak ? parseInt(savedStreak) : 0,
        lastLoginDate
      };
    };
    
    // Try DatabaseToki first, fallback to localStorage
    loadFromDatabaseToki().then((success) => {
      if (!success) {
        loadData(loadFromLocalStorage());
      }
    });
  }, []);
  
  // Helper to save to storage (DatabaseToki with localStorage fallback)
  const saveToStorage = useCallback(async (data: Record<string, unknown>) => {
    // Try DatabaseToki first (production)
    try {
      // Save each key-value pair to DatabaseToki
      for (const [key, value] of Object.entries(data)) {
        // Map keys to DatabaseToki tables
        let table = 'settings';
        
        if (key === 'rpgProfile') {
          table = 'profiles';
        } else if (key === 'inventory') {
          table = 'inventory';
        } else if (key === 'quests') {
          table = 'quests';
        }
        
        // If it's inventory or quests, save as array
        if (table === 'inventory' || table === 'quests') {
          await saveToTable(table, value);
        } else {
          // For single-value settings, use settings table
          await saveToTable(table, value);
        }
      }
      
      console.log('Data saved to DatabaseToki');
      return;
    } catch (error) {
      console.log('DatabaseToki not available, using localStorage');
    }
    
    // Fallback to localStorage
    Object.entries(data).forEach(([key, value]) => {
      localStorage.setItem(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
    });
  }, []);
  
  // Update profile with auto-save
  const updateProfile = useCallback(async (newProfile: Profile) => {
    setProfileState(newProfile);
    await saveToStorage({ rpgProfile: newProfile });
  }, [saveToStorage]);
  
  // Update inventory with auto-save
  const updateInventory = useCallback(async (newInventory: InventoryItem[]) => {
    setInventoryState(newInventory);
    await saveToStorage({ inventory: newInventory });
  }, [saveToStorage]);
  
  // Save quests (with DatabaseToki support)
  const saveQuests = useCallback(async (newQuests: Quest[] | ((prev: Quest[]) => Quest[])) => {
    setQuests(newQuests);
    if (Array.isArray(newQuests)) {
      await saveToStorage({ quests: newQuests });
    }
  }, [saveToStorage]);
  
  // Generic setting saver
  const saveSetting = useCallback(async (key: string, value: any) => {
    await saveToStorage({ [key]: value });
  }, [saveToStorage]);
  
  const contextValue = useMemo<GameContextType>(() => ({
    profile,
    updateProfile,
    inventory,
    updateInventory,
    quests,
    setQuests: saveQuests,
    avatar,
    setAvatar: (val) => {
      setAvatar(val);
      saveSetting('userAvatar', val);
    },
    theme,
    setTheme: (val) => {
      setTheme(val);
      saveSetting('userTheme', val);
    },
    confettiStyle,
    setConfettiStyle: (val) => {
      setConfettiStyle(val);
      saveSetting('userConfetti', val);
    },
    soundEnabled,
    setSoundEnabled: (val) => {
      setSoundEnabled(val);
      saveSetting('soundEnabled', val);
    },
    activeRaid,
    setActiveRaid: (val) => {
      setActiveRaid(val);
      saveToStorage({ activeRaid: val });
    },
    streak,
    saveSetting
  }), [profile, inventory, quests, avatar, theme, confettiStyle, soundEnabled, activeRaid, streak, updateProfile, updateInventory, saveQuests, saveSetting, saveToStorage]);
  
  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
