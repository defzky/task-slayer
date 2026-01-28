import React from 'react';

const Settings = ({ updateProfile }) => {

    const handleExport = () => {
        if (chrome?.storage?.sync) {
            chrome.storage.sync.get(null, (items) => {
                const blob = new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `zky-sidekick-backup-${new Date().toISOString().slice(0, 10)}.json`;
                a.click();
            });
        } else if (chrome?.storage?.local) {
            chrome.storage.local.get(null, (items) => {
                const blob = new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `zky-sidekick-backup-${new Date().toISOString().slice(0, 10)}.json`;
                a.click();
            });
        } else {
            // LocalStorage fallback for dev
            const data = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                data[key] = localStorage.getItem(key);
                try {
                    data[key] = JSON.parse(data[key]);
                } catch (e) {
                    // keep string
                }
            }
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `zky-sidekick-dev-backup.json`;
            a.click();
        }
    };

    const handleImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                if (confirm('⚠️ WARNING: This will overwrite your CURRENT progress. Are you sure?')) {
                    if (chrome?.storage?.sync) {
                        chrome.storage.sync.clear(() => {
                            chrome.storage.sync.set(data, () => {
                                alert('Import successful! Reloading...');
                                window.location.reload();
                            });
                        });
                    } else if (chrome?.storage?.local) {
                        chrome.storage.local.clear(() => {
                            chrome.storage.local.set(data, () => {
                                alert('Import successful! Reloading...');
                                window.location.reload();
                            });
                        });
                    } else {
                        localStorage.clear();
                        Object.keys(data).forEach(key => {
                            const val = typeof data[key] === 'object' ? JSON.stringify(data[key]) : data[key];
                            localStorage.setItem(key, val);
                        });
                        alert('Import successful! Reloading...');
                        window.location.reload();
                    }
                }
            } catch (err) {
                alert('Invalid Save File!');
                console.error(err);
            }
        };
        reader.readAsText(file);
    };

    const handleReset = () => {
        if (confirm('🚨 DANGER: This will WIPE ALL DATA (Quests, Notes, Gold, XP). There is no turning back.\n\nType "DELETE" to confirm.')) {
            const input = prompt('Type "DELETE" to confirm hard reset:');
            if (input === 'DELETE') {
                if (chrome?.storage?.sync) {
                    chrome.storage.sync.clear(() => {
                        window.location.reload();
                    });
                } else if (chrome?.storage?.local) {
                    chrome.storage.local.clear(() => {
                        window.location.reload();
                    });
                } else {
                    localStorage.clear();
                    window.location.reload();
                }
            }
        }
    };

    return (

        <div className="h-full flex flex-col p-4">
            <h2 className="text-2xl font-bold text-[#e0e0e0] border-b-2 border-[#555] pb-2 mb-6 flex items-center gap-3">
                <span className="text-3xl">⚙️</span> System Menu
            </h2>

            {/* Data Management (World State) */}
            <div className="bg-[#1a181a] p-6 rounded-lg border-2 border-[#444] shadow-[0_0_20px_rgba(0,0,0,0.5)] relative overflow-hidden mb-6">
                {/* Decorative Texture */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none"></div>

                <h3 className="text-[#d4af37] font-bold mb-6 flex items-center gap-2 text-lg uppercase tracking-wider border-b border-[#333] pb-2 relative z-10">
                    💾 World State
                </h3>

                <div className="space-y-6 relative z-10">
                    {/* Export */}
                    <div className="flex justify-between items-center group">
                        <div>
                            <div className="text-base font-bold text-gray-200 group-hover:text-[#d4af37] transition-colors">Chronicle Record (Export)</div>
                            <div className="text-xs text-gray-500 font-mono">Create a backup scroll of your journey.</div>
                        </div>
                        <button
                            onClick={handleExport}
                            className="bg-[#1e1e1e] hover:bg-[#d4af37] hover:text-black border border-[#d4af37] text-[#d4af37] px-4 py-2 rounded font-bold uppercase tracking-wide transition-all shadow-lg active:scale-95"
                        >
                            📤 Create Backup
                        </button>
                    </div>

                    {/* Import */}
                    <div className="flex justify-between items-center group">
                        <div>
                            <div className="text-base font-bold text-gray-200 group-hover:text-[#d4af37] transition-colors">Rewrite History (Import)</div>
                            <div className="text-xs text-gray-500 font-mono">Load a past timeline from a scroll.</div>
                        </div>
                        <label className="bg-[#1e1e1e] hover:bg-[#d4af37] hover:text-black border border-[#d4af37] text-[#d4af37] px-4 py-2 rounded font-bold uppercase tracking-wide transition-all shadow-lg cursor-pointer active:scale-95">
                            📥 Load Data
                            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                        </label>
                    </div>
                </div>
            </div>

            {/* Danger Zone (Cataclysm) */}
            <div className="bg-[#1a0505] p-6 rounded-lg border-2 border-red-900/50 shadow-[0_0_20px_rgba(255,0,0,0.1)] relative overflow-hidden mt-auto">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-5 pointer-events-none"></div>
                <h3 className="text-red-500 font-bold mb-4 flex items-center gap-2 uppercase tracking-wider relative z-10">
                    💀 Cataclysm Protocol
                </h3>
                <div className="flex justify-between items-center relative z-10">
                    <div>
                        <div className="text-sm font-bold text-red-400">Total Reset</div>
                        <div className="text-xs text-red-900/70">The world ends. Nothing survives.</div>
                    </div>
                    <button
                        onClick={handleReset}
                        className="bg-red-950 hover:bg-red-600 text-red-500 hover:text-white border border-red-800 px-4 py-2 rounded font-bold uppercase tracking-widest transition-all shadow-[0_0_10px_rgba(255,0,0,0.2)] hover:shadow-[0_0_20px_rgba(255,0,0,0.6)]"
                    >
                        💣 ALL DELETE
                    </button>
                </div>
            </div>

            <div className="text-center text-[10px] text-gray-600 font-mono mt-4 opacity-50">
                System: Zky's RPG Sidekick v1.6.0 (Stable)
            </div>
        </div>
    );
};

export default Settings;
