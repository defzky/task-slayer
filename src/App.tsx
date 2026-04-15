import React, { Suspense, useCallback, useState, useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import { useGame } from './contexts';
import Notes from './components/Notes';
import Freezer from './components/Freezer';
import Quests from './components/Quests';
import Shop from './components/Shop';
import Achievements, { ACHIEVEMENTS } from './components/Achievements';
import ClassSelector from './components/ClassSelector';
import Settings from './components/Settings';
import Onboarding from './components/Onboarding/Onboarding';
import { playSound } from './utils/soundfx';
import Loading from './components/Loading';
import type { Profile } from './types';

// Lazy-loaded components for code splitting
const SkillTree = lazy(() => import('./components/SkillTree'));
const RaidBoss = lazy(() => import('./components/RaidBoss'));

type ActiveTab = 'notes' | 'freezer' | 'quests' | 'shop' | 'skills' | 'raids' | 'achievements' | 'settings';

function App() {
  const {
    profile,
    updateProfile,
    inventory,
    updateInventory,
    avatar,
    theme,
    confettiStyle,
    soundEnabled,
    setSoundEnabled,
    activeRaid,
    setActiveRaid,
    streak
  } = useGame();

  const [activeTab, setActiveTab] = React.useState<ActiveTab>('notes');
  const [showClassSelector, setShowClassSelector] = React.useState<boolean>(
    !profile.userClass || profile.userClass === 'Novice'
  );
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [onboardingComplete, setOnboardingComplete] = useState<boolean>(false);

  // Level up calculation
  const calculateLevelUp = useCallback((currentProfile: Profile): Profile & { _leveledUp?: boolean } => {
    let { level, xp, maxXp, skillPoints } = currentProfile;
    let leveledUp = false;
    let iterations = 0;

    while (xp >= maxXp && iterations < 100) {
      xp -= maxXp;
      level += 1;
      skillPoints += 1;
      maxXp = Math.floor(maxXp * 1.2);
      leveledUp = true;
      iterations++;
    }

    return { ...currentProfile, level, xp, maxXp, skillPoints, _leveledUp: leveledUp };
  }, []);

  const handleUpdateProfile = useCallback((profileToUpdate: Profile) => {
    const processedProfile = calculateLevelUp(profileToUpdate);
    const leveledUp = processedProfile._leveledUp;
    delete processedProfile._leveledUp;

    if (leveledUp) {
      playSound.levelUp();
      toast.custom((t) => (
        <div
          className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 rounded-xl shadow-[0_0_30px_rgba(124,58,237,0.6)] flex items-center gap-4 animate-bounce-slow"
          onClick={() => setActiveTab('skills')}
        >
          <div className="text-4xl">🆙</div>
          <div>
            <div className="font-bold text-xl uppercase tracking-widest">Level Up!</div>
            <div className="text-purple-200">You reached Level {processedProfile.level}! (+1 Skill Point)</div>
          </div>
        </div>
      ), { duration: 6000 });
    }

    // Check for achievements
    const currentStats = processedProfile.stats || {};
    const unlocked = new Set(processedProfile.unlockedAchievements || []);
    let achievementUnlocked = false;

    ACHIEVEMENTS.forEach(ach => {
      if (!unlocked.has(ach.id) && ach.condition({ ...currentStats, level: processedProfile.level })) {
        unlocked.add(ach.id);
        achievementUnlocked = true;

        toast.custom((t) => (
          <div
            className="bg-[#1a0f0f] border-2 border-[#d4af37] text-[#d4af37] p-4 rounded-lg shadow-[0_0_20px_rgba(212,175,55,0.5)] flex items-center gap-4 animate-bounce-slow cursor-pointer"
            onClick={() => setActiveTab('achievements')}
          >
            <div className="text-4xl">{ach.icon}</div>
            <div>
              <div className="font-bold text-lg">🏆 Achievement Unlocked!</div>
              <div className="text-white font-serif">{ach.name}</div>
            </div>
          </div>
        ), { duration: 5000 });

        if (!leveledUp) playSound.levelUp();
      }
    });

    if (achievementUnlocked) {
      processedProfile.unlockedAchievements = Array.from(unlocked);
    }

    updateProfile(processedProfile as Profile);
  }, [calculateLevelUp, updateProfile]);

  // Daily login logic
  const checkDailyLogin = useCallback((currentProfile: Profile): Profile => {
    const today = new Date().toDateString();
    const lastLogin = currentProfile.lastLoginDate;

    if (lastLogin === today) return currentProfile;

    let newStreak = (currentProfile.streak || 0);

    if (lastLogin) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      if (lastLogin === yesterday.toDateString()) {
        newStreak += 1;
      } else {
        newStreak = 1;
      }
    } else {
      newStreak = 1;
    }

    const baseGold = 50;
    const baseXp = 100;
    const multiplier = Math.min(2.5, 1 + (newStreak * 0.1));
    const rewardGold = Math.floor(baseGold * multiplier);
    const rewardXp = Math.floor(baseXp * multiplier);

    setTimeout(() => {
      toast.custom((t) => (
        <div
          className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-4 rounded-xl shadow-[0_0_20px_rgba(255,69,0,0.6)] flex items-center gap-4 animate-bounce-slow"
          onClick={() => setActiveTab('quests')}
        >
          <div className="text-4xl">🔥</div>
          <div>
            <div className="font-bold text-xl uppercase tracking-widest">Daily Streak: {newStreak}!</div>
            <div className="text-orange-200">+{rewardGold} Gold | +{rewardXp} XP</div>
          </div>
        </div>
      ), { duration: 6000 });
      playSound.levelUp();
    }, 1500);

    return {
      ...currentProfile,
      lastLoginDate: today,
      streak: newStreak,
      gold: (currentProfile.gold || 0) + rewardGold,
      xp: (currentProfile.xp || 0) + rewardXp
    };
  }, []);

  // Check daily login on mount
  React.useEffect(() => {
    try {
      const updatedProfile = checkDailyLogin(profile);
      if (updatedProfile !== profile) {
        updateProfile(updatedProfile);
      }
    } catch (e) {
      console.error('Daily Login Error', e);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Check onboarding status on mount
  React.useEffect(() => {
    const checkOnboarding = () => {
      if (chrome?.storage?.sync) {
        chrome.storage.sync.get(['onboardingComplete'], (result) => {
          if (!result.onboardingComplete) {
            setShowOnboarding(true);
          } else {
            setOnboardingComplete(true);
          }
        });
      } else {
        const saved = localStorage.getItem('onboardingComplete');
        if (saved !== 'true') {
          setShowOnboarding(true);
        } else {
          setOnboardingComplete(true);
        }
      }
    };

    checkOnboarding();
  }, []);

  const handleOnboardingComplete = useCallback(() => {
    setShowOnboarding(false);
    setOnboardingComplete(true);

    if (chrome?.storage?.sync) {
      chrome.storage.sync.set({ onboardingComplete: true });
    } else {
      localStorage.setItem('onboardingComplete', 'true');
    }

    toast.success('Tutorial complete! Good luck, adventurer! 🎉', {
      duration: 4000
    });
  }, []);

  const handleOnboardingSkip = useCallback(() => {
    setShowOnboarding(false);
    setOnboardingComplete(true);

    if (chrome?.storage?.sync) {
      chrome.storage.sync.set({ onboardingComplete: true });
    } else {
      localStorage.setItem('onboardingComplete', 'true');
    }
  }, []);

  // Theme classes
  const getThemeColors = useCallback(() => {
    switch (theme) {
      case 'cyber': return 'text-[#00f7ff] font-mono selection:bg-[#ff0099] selection:text-white';
      case 'forest': return 'text-[#a7f3d0] font-serif';
      case 'royal': return 'text-[#f0e68c] font-serif';
      default: return 'text-[#e0e0e0] font-mono';
    }
  }, [theme]);

  const getSideNavColors = useCallback(() => {
    switch (theme) {
      case 'cyber': return 'border-[#00f7ff]';
      case 'forest': return 'border-[#2e8b57]';
      case 'royal': return 'border-[#8a4baf]';
      default: return 'border-[#444]';
    }
  }, [theme]);

  const handleSelectClass = useCallback((className: string) => {
    const newProfile = { ...profile, userClass: className };
    handleUpdateProfile(newProfile);
    setShowClassSelector(false);
  }, [profile, handleUpdateProfile]);

  return (
    <div
      className={`w-full h-screen flex overflow-hidden transition-colors duration-300 bg-[#0f0f10] ${getThemeColors()}`}
      role="application"
      aria-label="Task Slayer RPG Productivity App"
    >
      <Toaster position="bottom-right" theme="dark" richColors />

      {/* Onboarding Tutorial */}
      {showOnboarding && (
        <Onboarding
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
        />
      )}

      {/* Class Selector Modal */}
      {showClassSelector && (
        <ClassSelector
          currentClass={profile.userClass}
          onSelect={handleSelectClass}
        />
      )}

      {/* Sidebar (Runestone Menu) */}
      <nav
        className={`w-20 flex flex-col items-center py-6 shrink-0 ${getSideNavColors()} border-r-2 shadow-[4px_0_24px_rgba(0,0,0,0.5)] z-20 relative bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]`}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* App Logo */}
        <div
          className="mb-2 text-2xl animate-pulse filter drop-shadow-[0_0_8px_rgba(212,175,55,0.6)]"
          aria-hidden="true"
        >
          🗡️
        </div>

        {/* Streak Counter */}
        {streak && streak > 0 && (
          <div
            className="mb-6 flex flex-col items-center group cursor-help"
            title={`Daily Streak: ${streak} Days`}
            role="status"
            aria-label={`${streak} day streak`}
          >
            <span className="text-xl animate-fire" aria-hidden="true">🔥</span>
            <span className="text-[10px] font-bold text-orange-500 font-mono">{streak}</span>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex flex-col gap-6 w-full px-2" role="menubar" aria-label="Main menu">
          <NavButton
            icon="⚔️"
            label="Adventure Board"
            active={activeTab === 'quests'}
            onClick={() => setActiveTab('quests')}
            theme={theme}
          />
          <NavButton
            icon="📜"
            label="Nalan's Grimoire"
            active={activeTab === 'notes'}
            onClick={() => setActiveTab('notes')}
            theme={theme}
          />
          <NavButton
            icon="❄️"
            label="Stasis Chamber"
            active={activeTab === 'freezer'}
            onClick={() => setActiveTab('freezer')}
            theme={theme}
            activeColor="cyan"
          />
          <NavButton
            icon="🛒"
            label="Goblin Market"
            active={activeTab === 'shop'}
            onClick={() => setActiveTab('shop')}
            theme={theme}
          />
          <NavButton
            icon="🌌"
            label="Talents"
            active={activeTab === 'skills'}
            onClick={() => setActiveTab('skills')}
            theme={theme}
            activeColor="purple"
          />
          <NavButton
            icon="🏆"
            label="Trophies"
            active={activeTab === 'achievements'}
            onClick={() => setActiveTab('achievements')}
            theme={theme}
          />
        </div>

        {/* Bottom Actions */}
        <div className="mt-auto flex flex-col items-center gap-4 w-full px-2" role="group" aria-label="Actions">
          <NavButton
            icon="🐲"
            label="Raids"
            active={activeTab === 'raids'}
            onClick={() => setActiveTab('raids')}
            theme={theme}
            activeColor="red"
          />
          <button
            onClick={() => setActiveTab('settings')}
            className={`group relative w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              activeTab === 'settings' ? 'bg-white/20 text-white' : 'hover:bg-white/10 text-gray-500 hover:text-white'
            }`}
            aria-label="Open settings"
            aria-pressed={activeTab === 'settings'}
          >
            <span className="text-lg" aria-hidden="true">⚙️</span>
          </button>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="group relative w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 text-gray-500 hover:text-white transition-all"
            aria-label={soundEnabled ? 'Mute sound effects' : 'Enable sound effects'}
            aria-pressed={soundEnabled}
          >
            <span className="text-lg" aria-hidden="true">{soundEnabled ? '🔊' : '🔕'}</span>
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 p-4 relative" role="main" aria-label="Main content">
        {activeTab === 'notes' && <Notes profile={profile} updateProfile={handleUpdateProfile} />}
        {activeTab === 'freezer' && <Freezer profile={profile} updateProfile={handleUpdateProfile} />}
        {activeTab === 'quests' && (
          <Quests
            profile={profile}
            updateProfile={handleUpdateProfile}
            avatar={avatar}
            confettiStyle={confettiStyle}
            soundEnabled={soundEnabled}
            inventory={inventory}
            updateInventory={updateInventory}
          />
        )}
        {activeTab === 'shop' && (
          <Shop
            profile={profile}
            updateProfile={handleUpdateProfile}
            setTheme={(val) => updateProfile({ ...profile })}
            setAvatar={() => {}}
            setConfetti={() => {}}
            soundEnabled={soundEnabled}
            inventory={inventory}
            updateInventory={updateInventory}
            setActiveRaid={setActiveRaid}
            setActiveTab={setActiveTab}
            currentTheme={theme}
            currentAvatar={avatar}
            currentConfetti={confettiStyle}
          />
        )}
        {activeTab === 'skills' && (
          <Suspense fallback={<Loading message="Loading Skill Tree..." />}>
            <SkillTree profile={profile} updateProfile={handleUpdateProfile} soundEnabled={soundEnabled} />
          </Suspense>
        )}
        {activeTab === 'raids' && (
          <Suspense fallback={<Loading message="Loading Raid Boss..." />}>
            <RaidBoss profile={profile} updateProfile={handleUpdateProfile} activeRaid={activeRaid} setActiveRaid={setActiveRaid} />
          </Suspense>
        )}
        {activeTab === 'achievements' && <Achievements profile={profile} />}
        {activeTab === 'settings' && <Settings updateProfile={handleUpdateProfile} />}
      </main>
    </div>
  );
}

// NavButton component for accessibility
interface NavButtonProps {
  icon: string;
  label: string;
  active: boolean;
  onClick: () => void;
  theme: string;
  activeColor?: string;
}

const NavButton: React.FC<NavButtonProps> = React.memo(({ icon, label, active, onClick, theme, activeColor = 'gold' }) => {
  const getActiveClasses = () => {
    const colors: Record<string, string> = {
      gold: 'from-[#d4af37] to-[#8a6d1f] text-black shadow-[0_0_15px_rgba(212,175,55,0.5)]',
      cyan: 'from-cyan-400 to-blue-600 text-black shadow-[0_0_15px_rgba(0,255,255,0.5)]',
      purple: 'from-purple-500 to-indigo-600 text-white shadow-[0_0_15px_rgba(139,92,246,0.5)]',
      red: 'from-red-600 to-red-900 text-white shadow-[0_0_15px_rgba(220,38,38,0.5)]'
    };
    return colors[activeColor] || colors.gold;
  };

  return (
    <button
      onClick={onClick}
      className={`group relative w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
        active
          ? `bg-gradient-to-br ${getActiveClasses()} scale-110`
          : 'bg-[#2a282a] border-2 border-[#444] text-gray-400 hover:border-[#d4af37] hover:text-[#d4af37]'
      }`}
      role="menuitem"
      aria-label={label}
      aria-pressed={active}
      title={label}
    >
      <span className="text-xl group-hover:scale-110 transition-transform" aria-hidden="true">{icon}</span>
      <div className="absolute left-14 bg-[#1a0f0f] text-[#d4af37] text-xs font-bold py-1 px-3 rounded border border-[#d4af37] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl">
        {label}
      </div>
    </button>
  );
});

export default App;
