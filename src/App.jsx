import React, { useState, useEffect } from 'react';
import { Toaster } from 'sonner';
import Notes from './components/Notes';
import Freezer from './components/Freezer';
import Quests from './components/Quests';
import Shop from './components/Shop';
import ClassSelector from './components/ClassSelector';
import Settings from './components/Settings';

function App() {
  const [activeTab, setActiveTab] = useState('notes');
  const [theme, setTheme] = useState('default');
  const [avatar, setAvatar] = useState('🧙‍♂️');
  const [confettiStyle, setConfettiStyle] = useState('default');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [profile, setProfile] = useState({ level: 1, xp: 0, maxXp: 100, gold: 0, userClass: 'Novice' });
  const [showClassSelector, setShowClassSelector] = useState(false);

  // Load Profile & Theme on mount
  useEffect(() => {
    const loadData = (result) => {
      if (result.rpgProfile) {
        setProfile(result.rpgProfile);
        // Show selector if class is Novice or missing
        if (!result.rpgProfile.userClass || result.rpgProfile.userClass === 'Novice') {
          setShowClassSelector(true);
        }
      } else {
        // New user
        setShowClassSelector(true);
      }

      if (result.userTheme) setTheme(result.userTheme);
      if (result.userAvatar) setAvatar(result.userAvatar);
      if (result.userConfetti) setConfettiStyle(result.userConfetti);
      if (result.soundEnabled !== undefined) setSoundEnabled(result.soundEnabled);
    };

    if (chrome?.storage?.sync) {
      // Try to load from SYNC first
      chrome.storage.sync.get(['rpgProfile', 'userTheme', 'userAvatar', 'userConfetti', 'soundEnabled'], (syncResult) => {
        if (Object.keys(syncResult).length > 0) {
          // Found data in sync
          loadData(syncResult);
        } else {
          // No data in sync, check LOCAL (Migration)
          chrome.storage.local.get(['rpgProfile', 'userTheme', 'userAvatar', 'userConfetti', 'soundEnabled'], (localResult) => {
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

      if (savedProfile) setProfile(JSON.parse(savedProfile));
      if (savedTheme) setTheme(savedTheme);
      if (savedAvatar) setAvatar(savedAvatar);
      if (savedConfetti) setConfettiStyle(savedConfetti);
      if (savedSound !== null) setSoundEnabled(JSON.parse(savedSound));
    }
  }, []);

  const handleUpdateProfile = (newProfile) => {
    setProfile(newProfile);
    if (chrome?.storage?.sync) {
      chrome.storage.sync.set({ rpgProfile: newProfile });
    } else {
      localStorage.setItem('rpgProfile', JSON.stringify(newProfile));
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

  // Theme Classes
  const getThemeColors = () => {
    switch (theme) {
      case 'cyber': return 'bg-[#0f0f1a] text-[#00f7ff] font-mono selection:bg-[#ff0099] selection:text-white';
      case 'forest': return 'bg-[#1a231a] text-[#e0e0e0] font-serif';
      case 'royal': return 'bg-[#181020] text-[#f0e68c] font-serif';
      default: return 'bg-[#2d2a2e] text-[#e0e0e0] font-mono'; // Default Dark
    }
  };

  const getSideNavColors = () => {
    switch (theme) {
      case 'cyber': return 'bg-[#050510] border-[#00f7ff] border-r';
      case 'forest': return 'bg-[#111a11] border-[#3e4e3e] border-r';
      case 'royal': return 'bg-[#100a18] border-[#8a4baf] border-r';
      default: return 'bg-[#1a181a] border-[#3e3b3e] border-r';
    }
  };

  const handleSelectClass = (className) => {
    const newProfile = { ...profile, userClass: className };
    handleUpdateProfile(newProfile);
    setShowClassSelector(false);
  };

  return (
    <div className={`w-full h-screen flex overflow-hidden transition-colors duration-300 ${getThemeColors()}`}>
      <Toaster position="bottom-right" theme="dark" richColors />

      {/* Class Selector Modal */}
      {showClassSelector && (
        <ClassSelector
          currentClass={profile.userClass}
          onSelect={handleSelectClass}
        />
      )}

      {/* Sidebar */}
      <nav className={`w-16 flex flex-col items-center py-4 shrink-0 ${getSideNavColors()}`}>
        <button
          onClick={() => setActiveTab('notes')}
          className={`p-3 mb-4 rounded-lg transition-all ${activeTab === 'notes' ? 'bg-white/10 shadow-lg scale-110' : 'hover:bg-white/5'}`}
          title="Inventory (Notes)"
        >
          📝
        </button>
        <button
          onClick={() => setActiveTab('freezer')}
          className={`p-3 mb-4 rounded-lg transition-all ${activeTab === 'freezer' ? 'bg-white/10 shadow-lg scale-110' : 'hover:bg-white/5'}`}
          title="Stasis (Context Freezer)"
        >
          ❄️
        </button>
        <button
          onClick={() => setActiveTab('quests')}
          className={`p-3 mb-4 rounded-lg transition-all ${activeTab === 'quests' ? 'bg-white/10 shadow-lg scale-110' : 'hover:bg-white/5'}`}
          title="Adventure (Quests)"
        >
          ⚔️
        </button>
        <button
          onClick={() => setActiveTab('shop')}
          className={`p-3 mb-4 rounded-lg transition-all ${activeTab === 'shop' ? 'bg-white/10 shadow-lg scale-110' : 'hover:bg-white/5'}`}
          title="Goblin Shop"
        >
          🛒
        </button>

        <div className="mt-auto flex flex-col items-center gap-2">
          <button
            onClick={() => setActiveTab('settings')}
            className={`p-3 rounded-lg transition-all ${activeTab === 'settings' ? 'bg-white/10 shadow-lg scale-110 text-white' : 'hover:bg-white/5 text-gray-400 hover:text-white'}`}
            title="Settings"
          >
            ⚙️
          </button>
          <button
            onClick={handleToggleSound}
            className="p-3 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-all"
            title={soundEnabled ? "Mute Sounds" : "Unmute Sounds"}
          >
            {soundEnabled ? '🔊' : '🔕'}
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 p-4 relative">
        {activeTab === 'notes' && <Notes />}
        {activeTab === 'freezer' && <Freezer />}
        {activeTab === 'quests' && <Quests
          profile={profile}
          updateProfile={handleUpdateProfile}
          avatar={avatar}
          confettiStyle={confettiStyle}
          soundEnabled={soundEnabled}
        />}
        {activeTab === 'shop' && <Shop
          profile={profile}
          updateProfile={handleUpdateProfile}
          setTheme={handleSetTheme}
          setAvatar={handleSetAvatar}
          setConfetti={handleSetConfetti}
          soundEnabled={soundEnabled}
        />}
        {activeTab === 'settings' && <Settings updateProfile={handleUpdateProfile} />}
      </main>
    </div>
  );
}

export default App;
