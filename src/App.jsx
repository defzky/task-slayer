import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import Notes from './components/Notes';
import Freezer from './components/Freezer';
import Quests from './components/Quests';
import Shop from './components/Shop';
import SkillTree from './components/SkillTree';
import Achievements, { ACHIEVEMENTS } from './components/Achievements';
import RaidBoss from './components/RaidBoss';
import ClassSelector from './components/ClassSelector';
import Settings from './components/Settings';
import Analytics from './components/Analytics';
import TopBar from './components/TopBar';
import FocusTimer from './components/FocusTimer';
import { Sword, Scroll, ShoppingBag, Brain, BarChart2, Skull, Snowflake, Grid } from 'lucide-react';
import { playSound } from './utils/soundfx';

function App() {
  const [activeTab, setActiveTab] = useState('notes');
  const [theme, setTheme] = useState('default');
  const [avatar, setAvatar] = useState('🧙‍♂️');
  const [confettiStyle, setConfettiStyle] = useState('default');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [profile, setProfile] = useState({
    level: 1,
    xp: 0,
    maxXp: 100,
    gold: 0,
    userClass: 'Novice',
    skillPoints: 0,
    unlockedSkills: [],
    stats: { questsCompleted: 0, bossesDefeated: 0, totalGoldEarned: 0, notesCreated: 0, itemsBought: 0 },
    unlockedAchievements: []
  });
  const [inventory, setInventory] = useState([]); // [{id, count, name, type, description}]
  const [activeRaid, setActiveRaid] = useState(null); // { id, name, bossId, maxHp, currentHp, tasks: [] }
  const [showClassSelector, setShowClassSelector] = useState(false);
  const [showFocusMode, setShowFocusMode] = useState(false);

  // Load Profile & Theme on mount
  useEffect(() => {
    const loadData = (result) => {
      // 1. Determine Profile (Loaded or Default)
      let currentProfile = result.rpgProfile || {
        level: 1,
        xp: 0,
        maxXp: 100,
        gold: 0,
        userClass: 'Novice',
        skillPoints: 0,
        unlockedSkills: [],
        stats: { questsCompleted: 0, bossesDefeated: 0, totalGoldEarned: 0, notesCreated: 0, itemsBought: 0 },
        unlockedAchievements: [],
        history: [] // [{ date, xp, gold, quests, focusMinutes }]
      };

      // 2. Check Daily Login Reward
      // We need to check if checkDailyLogin is available yet.
      // Since effect runs after mount, it should be capable of calling the function defined in body.
      try {
        currentProfile = checkDailyLogin(currentProfile);
      } catch (e) {
        console.error("Daily Login Error", e);
      }

      // 3. Update State
      setProfile(currentProfile);

      // 4. Save Immediately (to persist lastLoginDate)
      if (chrome?.storage?.sync) {
        chrome.storage.sync.set({ rpgProfile: currentProfile });
      } else {
        localStorage.setItem('rpgProfile', JSON.stringify(currentProfile));
      }

      // 5. Handle Other Settings
      if (!currentProfile.userClass || currentProfile.userClass === 'Novice') {
        setShowClassSelector(true);
      }

      if (result.userTheme) setTheme(result.userTheme);
      if (result.userAvatar) setAvatar(result.userAvatar);
      if (result.userConfetti) setConfettiStyle(result.userConfetti);
      if (result.soundEnabled !== undefined) setSoundEnabled(result.soundEnabled);
      if (result.inventory) setInventory(result.inventory);
      if (result.activeRaid) setActiveRaid(result.activeRaid);
    };

    if (chrome?.storage?.sync) {
      // Try to load from SYNC first
      chrome.storage.sync.get(['rpgProfile', 'userTheme', 'userAvatar', 'userConfetti', 'soundEnabled', 'inventory', 'activeRaid'], (syncResult) => {
        if (Object.keys(syncResult).length > 0) {
          // Found data in sync
          loadData(syncResult);
        } else {
          // No data in sync, check LOCAL (Migration)
          chrome.storage.local.get(['rpgProfile', 'userTheme', 'userAvatar', 'userConfetti', 'soundEnabled', 'inventory', 'activeRaid'], (localResult) => {
            if (Object.keys(localResult).length > 0) {
              console.log("Migrating data from Local to Cloud Sync...");
              loadData(localResult);
              // Save to Sync
              chrome.storage.sync.set(localResult);
            } else {
              // Brand new user
              loadData({});
            }
          });
        }
      });
    } else {
      // Dev mode fallback
      const savedProfile = localStorage.getItem('rpgProfile');
      const savedTheme = localStorage.getItem('userTheme');
      const savedAvatar = localStorage.getItem('userAvatar');
      const savedConfetti = localStorage.getItem('userConfetti');
      const savedSound = localStorage.getItem('soundEnabled');
      const savedInventory = localStorage.getItem('inventory');
      const savedRaid = localStorage.getItem('activeRaid');

      if (savedProfile) setProfile(JSON.parse(savedProfile));
      if (savedTheme) setTheme(savedTheme);
      if (savedAvatar) setAvatar(savedAvatar);
      if (savedConfetti) setConfettiStyle(savedConfetti);
      if (savedSound !== null) setSoundEnabled(JSON.parse(savedSound));
      if (savedInventory) setInventory(JSON.parse(savedInventory));
      if (savedRaid) setActiveRaid(JSON.parse(savedRaid));
    }
  }, []);

  const handleUpdateRaid = (newRaid) => {
    setActiveRaid(newRaid);
    if (chrome?.storage?.sync) {
      chrome.storage.sync.set({ activeRaid: newRaid });
    } else {
      localStorage.setItem('activeRaid', JSON.stringify(newRaid));
    }
  };

  const calculateLevelUp = (currentProfile) => {
    let { level, xp, maxXp, skillPoints } = currentProfile;
    let leveledUp = false;
    let iterations = 0;

    // Safety: Max 100 level jumps to prevent hangs
    while (xp >= maxXp && iterations < 100) {
      xp -= maxXp;
      level += 1;
      skillPoints += 1;
      maxXp = Math.floor(maxXp * 1.2);
      leveledUp = true;
      iterations++;
    }

    return {
      ...currentProfile,
      level, xp, maxXp, skillPoints,
      _leveledUp: leveledUp
    };
  };

  const handleUpdateProfile = (profileToUpdate) => {
    // 1. Calculate new stats safely
    const processedProfile = calculateLevelUp(profileToUpdate);
    const leveledUp = processedProfile._leveledUp;
    delete processedProfile._leveledUp; // Clean up internal flag

    // 2. Handle Side Effects (Visual/Audio)
    if (leveledUp) {
      playSound.levelUp();
      toast.custom((t) => (
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 rounded-xl shadow-[0_0_30px_rgba(124,58,237,0.6)] flex items-center gap-4 animate-bounce-slow" onClick={() => setActiveTab('skills')}>
          <div className="text-4xl">🆙</div>
          <div>
            <div className="font-bold text-xl uppercase tracking-widest">Level Up!</div>
            <div className="text-purple-200">You reached Level {processedProfile.level}! (+1 Skill Point)</div>
          </div>
        </div>
      ), { duration: 6000 });
    }

    // 3. Check for Achievements
    const currentStats = processedProfile.stats || {};
    const unlocked = new Set(processedProfile.unlockedAchievements || []);
    let achievementUnlocked = false;

    ACHIEVEMENTS.forEach(ach => {
      if (!unlocked.has(ach.id) && ach.condition({ ...currentStats, level: processedProfile.level })) {
        unlocked.add(ach.id);
        achievementUnlocked = true;

        // Notification
        toast.custom((t) => (
          <div className="bg-[#1a0f0f] border-2 border-[#d4af37] text-[#d4af37] p-4 rounded-lg shadow-[0_0_20px_rgba(212,175,55,0.5)] flex items-center gap-4 animate-bounce-slow cursor-pointer" onClick={() => setActiveTab('achievements')}>
            <div className="text-4xl">{ach.icon}</div>
            <div>
              <div className="font-bold text-lg">🏆 Achievement Unlocked!</div>
              <div className="text-white font-serif">{ach.name}</div>
            </div>
          </div>
        ), { duration: 5000 });

        // Don't play duplicate sound if level up just happened
        if (!leveledUp) playSound.levelUp();
      }
    });

    if (achievementUnlocked) {
      processedProfile.unlockedAchievements = Array.from(unlocked);
    }

    // 4. Update State & Storage
    setProfile(processedProfile);
    if (chrome?.storage?.sync) {
      chrome.storage.sync.set({ rpgProfile: processedProfile });
    } else {
      localStorage.setItem('rpgProfile', JSON.stringify(processedProfile));
    }
  };

  // --- GAME ENGINE: CENTRALIZED LOGIC ---
  const handleQuestComplete = (difficulty) => {
    const rewards = {
      'easy': { xp: 10, gold: 5 },
      'medium': { xp: 20, gold: 12 },
      'hard': { xp: 40, gold: 25 },
      'boss': { xp: 100, gold: 100 } // Safety fallback
    };

    let { xp, gold } = rewards[difficulty] || rewards['easy'];

    // Class Bonuses
    if (profile.userClass === 'Swordsman') {
      xp = Math.floor(xp * 1.15); // +15% XP
    } else if (profile.userClass === 'Rogue') {
      gold = Math.floor(gold * 1.15); // +15% Gold
    }

    // Skill Bonuses
    if (profile.unlockedSkills.includes('negotiator')) {
      gold = Math.floor(gold * 1.2); // +20% Gold
    }
    if (profile.unlockedSkills.includes('wisdom')) {
      xp = Math.floor(xp * 1.2); // +20% XP
    }

    // Sound Effect
    if (difficulty === 'boss') {
      // Boss sound handled in component, or we can add a specific reward sound
      playSound.coin();
    } else {
      playSound.coin();
    }

    // Create Toast
    toast.custom((t) => (
      <div className="bg-[#1a0f0f] border border-[#d4af37] text-white px-4 py-3 rounded-lg shadow-[0_0_15px_rgba(212,175,55,0.3)] flex items-center gap-3 animate-fade-in-up">
        <div className="text-2xl">✨</div>
        <div>
          <div className="font-bold text-[#d4af37] text-sm uppercase tracking-wider">Quest Complete</div>
          <div className="text-xs text-gray-400">
            Received <span className="text-[#ffd700] font-bold">+{gold} Gold</span> & <span className="text-purple-400 font-bold">+{xp} XP</span>
          </div>
        </div>
      </div>
    ), { duration: 3000 });

    // Update Profile
    const newStats = { ...(profile.stats || {}) };
    newStats.questsCompleted = (newStats.questsCompleted || 0) + 1;
    newStats.totalGoldEarned = (newStats.totalGoldEarned || 0) + gold;

    // Daily History Update
    const today = new Date().toDateString();
    let history = [...(profile.history || [])];
    let todayEntry = history.find(h => h.date === today);

    if (todayEntry) {
      todayEntry = {
        ...todayEntry,
        xp: (todayEntry.xp || 0) + xp,
        gold: (todayEntry.gold || 0) + gold,
        quests: (todayEntry.quests || 0) + 1
      };
      const idx = history.findIndex(h => h.date === today);
      history[idx] = todayEntry;
    } else {
      history.push({ date: today, xp, gold, quests: 1, focusMinutes: 0 });
    }

    handleUpdateProfile({
      ...profile,
      xp: profile.xp + xp,
      gold: profile.gold + gold,
      stats: newStats,
      history
    });
  };

  const handleUpdateInventory = (newInventory) => {
    setInventory(newInventory);
    if (chrome?.storage?.sync) {
      chrome.storage.sync.set({ inventory: newInventory });
    } else {
      localStorage.setItem('inventory', JSON.stringify(newInventory));
    }
  };

  const saveSetting = (key, value) => {
    if (chrome?.storage?.sync) {
      chrome.storage.sync.set({ [key]: value });
    } else {
      localStorage.setItem(key, value);
    }
  };

  const handleToggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    saveSetting('soundEnabled', newState);
  };

  const handleSetTheme = (newTheme) => {
    setTheme(newTheme);
    saveSetting('userTheme', newTheme);
  };

  const handleSetAvatar = (newAvatar) => {
    setAvatar(newAvatar);
    saveSetting('userAvatar', newAvatar);
  };

  const handleSetConfetti = (newStyle) => {
    setConfettiStyle(newStyle);
    saveSetting('userConfetti', newStyle);
  };

  // Theme Classes - ACCENTS ONLY
  const getThemeColors = () => {
    switch (theme) {
      case 'cyber': return 'text-[#00f7ff] font-mono selection:bg-[#ff0099] selection:text-white';
      case 'forest': return 'text-[#a7f3d0] font-serif';
      case 'royal': return 'text-[#f0e68c] font-serif';
      default: return 'text-[#e0e0e0] font-mono'; // Default Dark
    }
  };

  const getThemeAccent = () => {
    switch (theme) {
      case 'cyber': return 'border-[#00f7ff] shadow-[0_0_15px_rgba(0,247,255,0.3)]';
      case 'forest': return 'border-[#2e8b57] shadow-[0_0_15px_rgba(46,139,87,0.3)]';
      case 'royal': return 'border-[#8a4baf] shadow-[0_0_15px_rgba(138,75,175,0.3)]';
      default: return 'border-[#d4af37] shadow-[0_0_15px_rgba(212,175,55,0.3)]';
    }
  };

  const getSideNavColors = () => {
    // Returns border color for the right side
    switch (theme) {
      case 'cyber': return 'border-[#00f7ff]';
      case 'forest': return 'border-[#2e8b57]';
      case 'royal': return 'border-[#8a4baf]';
      default: return 'border-[#444]';
    }
  };

  const handleSelectClass = (className) => {
    const newProfile = { ...profile, userClass: className };
    handleUpdateProfile(newProfile);
    setShowClassSelector(false);
  };

  // --- DAILY LOGIN LOGIC ---
  const checkDailyLogin = (currentProfile) => {
    const today = new Date().toDateString();
    const lastLogin = currentProfile.lastLoginDate;

    if (lastLogin === today) return currentProfile; // Already claimed

    let newStreak = (currentProfile.streak || 0);

    if (lastLogin) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      if (lastLogin === yesterday.toDateString()) {
        newStreak += 1;
      } else {
        newStreak = 1; // Reset
      }
    } else {
      newStreak = 1; // First time
    }

    // Update History for Today
    let history = currentProfile.history || [];
    let todayEntry = history.find(h => h.date === today) || { date: today, xp: 0, gold: 0, quests: 0, focusMinutes: 0 };

    // Calculate Rewards
    const baseGold = 50;
    const baseXp = 100;
    const multiplier = Math.min(2.5, 1 + (newStreak * 0.1));

    const rewardGold = Math.floor(baseGold * multiplier);
    const rewardXp = Math.floor(baseXp * multiplier);

    // Update Today's History
    const entryIndex = history.findIndex(h => h.date === today);
    const updatedHistoryEntry = {
      ...todayEntry,
      xp: (todayEntry.xp || 0) + rewardXp,
      gold: (todayEntry.gold || 0) + rewardGold
    };

    let newHistory;
    if (entryIndex >= 0) {
      newHistory = [...history];
      newHistory[entryIndex] = updatedHistoryEntry;
    } else {
      newHistory = [...history, updatedHistoryEntry];
    }

    // Toast Notification
    setTimeout(() => {
      toast.custom((t) => (
        <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-4 rounded-xl shadow-[0_0_20px_rgba(255,69,0,0.6)] flex items-center gap-4 animate-bounce-slow" onClick={() => setActiveTab('quests')}>
          <div className="text-4xl">🔥</div>
          <div>
            <div className="font-bold text-xl uppercase tracking-widest">Daily Streak: {newStreak}!</div>
            <div className="text-orange-200">+{rewardGold} Gold | +{rewardXp} XP</div>
          </div>
        </div>
      ), { duration: 6000 });
      playSound.levelUp(); // Reuse positive sound
    }, 1500); // Delay slightly for app load

    return {
      ...currentProfile,
      lastLoginDate: today,
      streak: newStreak,
      gold: (currentProfile.gold || 0) + rewardGold,
      xp: (currentProfile.xp || 0) + rewardXp,
      history: newHistory
    };
  };

  // Sidebar Icon Helper
  const SidebarBtn = ({ icon, active, onClick, color, label }) => (
    <button
      onClick={onClick}
      className={`group relative w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${active
        ? `bg-[#2a282a] text-white shadow-[0_0_15px_rgba(255,255,255,0.1)] border border-${color.split('-')[1]}-500`
        : 'text-gray-500 hover:text-white hover:bg-[#1a1a1a]'
        }`}
      title={label}
    >
      <div className={`transition-transform duration-300 group-hover:scale-110 ${active ? color : ''}`}>
        {icon}
      </div>

      {/* Tooltip */}
      <div className={`absolute left-14 bg-[#151515] text-white text-xs font-bold py-1.5 px-3 rounded border border-[#333] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl flex items-center gap-2`}>
        {label}
      </div>

      {/* Active Indicator */}
      {active && (
        <div className={`absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-current ${color}`} />
      )}
    </button>
  );

  return (
    <div className={`w-full h-screen flex overflow-hidden bg-[#0a0a0a] font-sans selection:bg-[#d4af37] selection:text-black`}>
      <Toaster position="bottom-right" theme="dark" richColors />

      {/* Overlays */}
      {showClassSelector && <ClassSelector currentClass={profile.userClass} onSelect={handleSelectClass} />}

      {/* 1. Slim Sidebar (Navigation) */}
      <nav className="w-20 flex flex-col items-center py-6 shrink-0 bg-[#0f0f10] border-r border-[#222] z-20">
        {/* Logo */}
        <div className="mb-8 text-3xl filter drop-shadow-[0_0_10px_rgba(255,215,0,0.4)] hover:scale-110 transition-transform cursor-pointer" onClick={() => setActiveTab('quests')}>
          🗡️
        </div>

        {/* Navigation Items */}
        <div className="flex flex-col gap-4 w-full px-2 items-center">
          <SidebarBtn
            icon={<Sword size={22} />}
            label="Adventure"
            active={activeTab === 'quests'}
            onClick={() => setActiveTab('quests')}
            color="text-yellow-500"
          />
          <SidebarBtn
            icon={<Skull size={22} />}
            label="Raids"
            active={activeTab === 'raids'}
            onClick={() => setActiveTab('raids')}
            color="text-red-500"
          />
          <SidebarBtn
            icon={<ShoppingBag size={22} />}
            label="Shop"
            active={activeTab === 'shop'}
            onClick={() => setActiveTab('shop')}
            color="text-green-500"
          />

          <div className="w-8 h-px bg-[#222] my-2" />

          <SidebarBtn
            icon={<Scroll size={22} />}
            label="Grimoire"
            active={activeTab === 'notes'}
            onClick={() => setActiveTab('notes')}
            color="text-purple-400"
          />
          <SidebarBtn
            icon={<Brain size={22} />}
            label="Focus Mode"
            active={false}
            onClick={() => setShowFocusMode(true)}
            color="text-blue-400"
          />
          <SidebarBtn
            icon={<Snowflake size={22} />}
            label="Stasis"
            active={activeTab === 'freezer'}
            onClick={() => setActiveTab('freezer')}
            color="text-cyan-400"
          />

          <div className="w-8 h-px bg-[#222] my-2" />

          <SidebarBtn
            icon={<BarChart2 size={22} />}
            label="Analytics"
            active={activeTab === 'analytics'}
            onClick={() => setActiveTab('analytics')}
            color="text-teal-400"
          />
        </div>
      </nav>

      {/* 2. Main Content Wrapper */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-[#050505]">
        {/* Top Bar (Status) */}
        <TopBar
          profile={profile}
          avatar={avatar}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          soundEnabled={soundEnabled}
          toggleSound={handleToggleSound}
          setShowClassSelector={setShowClassSelector}
        />

        {/* Content Area */}
        <main className={`flex-1 overflow-y-auto p-6 relative ${getThemeColors()}`}>
          {/* Background Texture Overlay */}
          <div className="absolute inset-0 opacity-5 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>

          <div className="max-w-7xl mx-auto h-full">
            {activeTab === 'notes' && <Notes profile={profile} updateProfile={handleUpdateProfile} />}
            {activeTab === 'freezer' && <Freezer profile={profile} updateProfile={handleUpdateProfile} />}
            {activeTab === 'quests' && <Quests
              profile={profile}
              updateProfile={handleUpdateProfile}
              onQuestComplete={handleQuestComplete}
              avatar={avatar}
              confettiStyle={confettiStyle}
              soundEnabled={soundEnabled}
              inventory={inventory}
              updateInventory={handleUpdateInventory}
            />}
            {activeTab === 'shop' && <Shop
              profile={profile}
              updateProfile={handleUpdateProfile}
              setTheme={handleSetTheme}
              setAvatar={handleSetAvatar}
              setConfetti={handleSetConfetti}
              soundEnabled={soundEnabled}
              inventory={inventory}
              updateInventory={handleUpdateInventory}
              setActiveRaid={handleUpdateRaid}
              setActiveTab={setActiveTab}
              currentTheme={theme}
              currentAvatar={avatar}
              currentConfetti={confettiStyle}
            />}
            {activeTab === 'skills' && <SkillTree
              profile={profile}
              updateProfile={handleUpdateProfile}
              soundEnabled={soundEnabled}
            />}
            {activeTab === 'raids' && <RaidBoss profile={profile} updateProfile={handleUpdateProfile} activeRaid={activeRaid} setActiveRaid={handleUpdateRaid} />}
            {activeTab === 'achievements' && <Achievements profile={profile} />}
            {activeTab === 'analytics' && <Analytics profile={profile} />}
            {activeTab === 'settings' && <Settings updateProfile={handleUpdateProfile} profile={profile} />}
          </div>
        </main>
      </div>

      {/* Focus Timer Overlay */}
      {showFocusMode && <FocusTimer profile={profile} updateProfile={handleUpdateProfile} onClose={() => setShowFocusMode(false)} />}
    </div>
  );
}

export default App;
