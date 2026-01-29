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
        unlockedAchievements: []
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

    // Calculate Rewards
    const baseGold = 50;
    const baseXp = 100;
    const multiplier = Math.min(2.5, 1 + (newStreak * 0.1));

    const rewardGold = Math.floor(baseGold * multiplier);
    const rewardXp = Math.floor(baseXp * multiplier);

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
      xp: (currentProfile.xp || 0) + rewardXp
    };
  };

  return (
    <div className={`w-full h-screen flex overflow-hidden transition-colors duration-300 bg-[#0f0f10] ${getThemeColors()}`}>
      <Toaster position="bottom-right" theme="dark" richColors />

      {/* Class Selector Modal */}
      {showClassSelector && (
        <ClassSelector
          currentClass={profile.userClass}
          onSelect={handleSelectClass}
        />
      )}

      {/* Sidebar (Runestone Menu) */}
      <nav className={`w-20 flex flex-col items-center py-6 shrink-0 ${getSideNavColors()} border-r-2 shadow-[4px_0_24px_rgba(0,0,0,0.5)] z-20 relative bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]`}>
        {/* App Logo / Icon */}
        <div className="mb-2 text-2xl animate-pulse filter drop-shadow-[0_0_8px_rgba(212,175,55,0.6)]">
          🗡️
        </div>

        {/* Streak Counter */}
        {profile.streak > 0 && (
          <div className="mb-6 flex flex-col items-center group cursor-help" title={`Daily Streak: ${profile.streak} Days`}>
            <span className="text-xl animate-fire">🔥</span>
            <span className="text-[10px] font-bold text-orange-500 font-mono">{profile.streak}</span>
          </div>
        )}

        <div className="flex flex-col gap-6 w-full px-2">
          <button
            onClick={() => setActiveTab('quests')}
            className={`group relative w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${activeTab === 'quests' ? 'bg-gradient-to-br from-[#d4af37] to-[#8a6d1f] text-black shadow-[0_0_15px_rgba(212,175,55,0.5)] scale-110' : 'bg-[#2a282a] border-2 border-[#444] text-gray-400 hover:border-[#d4af37] hover:text-[#d4af37]'}`}
            title="Adventure (Quests)"
          >
            <span className="text-xl group-hover:scale-110 transition-transform">⚔️</span>
            {/* Tooltip */}
            <div className="absolute left-14 bg-[#1a0f0f] text-[#d4af37] text-xs font-bold py-1 px-3 rounded border border-[#d4af37] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl">
              Adventure Board
            </div>
          </button>

          <button
            onClick={() => setActiveTab('notes')}
            className={`group relative w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${activeTab === 'notes' ? 'bg-gradient-to-br from-[#d4af37] to-[#8a6d1f] text-black shadow-[0_0_15px_rgba(212,175,55,0.5)] scale-110' : 'bg-[#2a282a] border-2 border-[#444] text-gray-400 hover:border-[#d4af37] hover:text-[#d4af37]'}`}
            title="Grimoire (Notes)"
          >
            <span className="text-xl group-hover:scale-110 transition-transform">📜</span>
            <div className="absolute left-14 bg-[#1a0f0f] text-[#d4af37] text-xs font-bold py-1 px-3 rounded border border-[#d4af37] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl">
              Nalan's Grimoire
            </div>
          </button>

          <button
            onClick={() => setActiveTab('freezer')}
            className={`group relative w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${activeTab === 'freezer' ? 'bg-gradient-to-br from-cyan-400 to-blue-600 text-black shadow-[0_0_15px_rgba(0,255,255,0.5)] scale-110' : 'bg-[#2a282a] border-2 border-[#444] text-gray-400 hover:border-cyan-400 hover:text-cyan-400'}`}
            title="Stasis (Freezer)"
          >
            <span className="text-xl group-hover:scale-110 transition-transform">❄️</span>
            <div className="absolute left-14 bg-[#0f172a] text-cyan-300 text-xs font-bold py-1 px-3 rounded border border-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl">
              Stasis Chamber
            </div>
          </button>

          <button
            onClick={() => setActiveTab('shop')}
            className={`group relative w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${activeTab === 'shop' ? 'bg-gradient-to-br from-[#d4af37] to-[#8a6d1f] text-black shadow-[0_0_15px_rgba(212,175,55,0.5)] scale-110' : 'bg-[#2a282a] border-2 border-[#444] text-gray-400 hover:border-[#d4af37] hover:text-[#d4af37]'}`}
            title="Goblin Shop"
          >
            <span className="text-xl group-hover:scale-110 transition-transform">🛒</span>
            <div className="absolute left-14 bg-[#1a0f0f] text-[#d4af37] text-xs font-bold py-1 px-3 rounded border border-[#d4af37] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl">
              Goblin Market
            </div>
          </button>

          <button
            onClick={() => setActiveTab('skills')}
            className={`group relative w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${activeTab === 'skills' ? 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-[0_0_15px_rgba(139,92,246,0.5)] scale-110' : 'bg-[#2a282a] border-2 border-[#444] text-gray-400 hover:border-purple-500 hover:text-purple-500'}`}
            title="Skill Tree"
          >
            <span className="text-xl group-hover:scale-110 transition-transform">🌌</span>
            <div className="absolute left-14 bg-[#0f0f1a] text-[#00f7ff] text-xs font-bold py-1 px-3 rounded border border-blue-500 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl">
              Talents
            </div>
          </button>
          <button
            onClick={() => setActiveTab('achievements')}
            className={`group relative w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${activeTab === 'achievements' ? 'bg-gradient-to-br from-[#d4af37] to-yellow-600 text-black shadow-[0_0_15px_rgba(255,215,0,0.5)] scale-110' : 'bg-[#2a282a] border-2 border-[#444] text-gray-400 hover:border-yellow-500 hover:text-yellow-500'}`}
            title="Hall of Trophies"
          >
            <span className="text-xl group-hover:scale-110 transition-transform">🏆</span>
            <div className="absolute left-14 bg-[#1a0f0f] text-[#d4af37] text-xs font-bold py-1 px-3 rounded border border-[#d4af37] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl">
              Trophies
            </div>
          </button>
        </div>

        <div className="mt-auto flex flex-col items-center gap-4 w-full px-2">
          <button
            onClick={() => setActiveTab('raids')}
            className={`group relative w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${activeTab === 'raids' ? 'bg-gradient-to-br from-red-600 to-red-900 text-white shadow-[0_0_15px_rgba(220,38,38,0.5)] scale-110' : 'bg-[#2a282a] border-2 border-[#444] text-gray-400 hover:border-red-500 hover:text-red-500'}`}
            title="Epic Raids"
          >
            <span className="text-xl group-hover:scale-110 transition-transform">🐲</span>
            <div className="absolute left-14 bg-[#1a0f0f] text-red-500 text-xs font-bold py-1 px-3 rounded border border-red-500 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl">
              Raids
            </div>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`group relative w-10 h-10 rounded-full flex items-center justify-center transition-all ${activeTab === 'settings' ? 'bg-white/20 text-white' : 'hover:bg-white/10 text-gray-500 hover:text-white'}`}
          >
            <span className="text-lg">⚙️</span>
          </button>
          <button
            onClick={handleToggleSound}
            className="group relative w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 text-gray-500 hover:text-white transition-all"
          >
            <span className="text-lg">{soundEnabled ? '🔊' : '🔕'}</span>
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 p-4 relative">
        {activeTab === 'notes' && <Notes profile={profile} updateProfile={handleUpdateProfile} />}
        {activeTab === 'freezer' && <Freezer profile={profile} updateProfile={handleUpdateProfile} />}
        {activeTab === 'quests' && <Quests
          profile={profile}
          updateProfile={handleUpdateProfile}
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
        {activeTab === 'settings' && <Settings updateProfile={handleUpdateProfile} />}
      </main>
    </div>
  );
}

export default App;
