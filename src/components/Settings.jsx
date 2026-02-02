import React from 'react';

const Settings = ({ updateProfile, profile }) => {

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

        <div className="h-full flex flex-col p-4 overflow-y-auto">
            <h2 className="text-xl font-bold text-[#e0e0e0] border-b border-[#333] pb-3 mb-5 flex items-center gap-2">
                <span className="text-2xl">⚙️</span> System Menu
                <span className="ml-auto text-xs font-mono text-gray-600 bg-[#111] px-2 py-1 rounded">v1.6.0</span>
            </h2>

            <div className="grid grid-cols-1 gap-4">
                {/* Data Management (World State) */}
                <div className="bg-[#1a181a] rounded-lg border border-[#333] shadow-lg relative overflow-hidden group hover:border-[#555] transition-colors">
                    {/* Header */}
                    <div className="bg-[#0f0f10] px-4 py-3 border-b border-[#333] flex items-center justify-between">
                        <h3 className="text-[#d4af37] font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                            💾 World State
                        </h3>
                        <div className="w-2 h-2 rounded-full bg-[#d4af37] animate-pulse"></div>
                    </div>

                    <div className="p-4 grid grid-cols-1 gap-4">
                        {/* Export & Import Row */}
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between bg-[#151515] p-3 rounded border border-[#2a2a2a]">
                                <div>
                                    <div className="text-sm font-bold text-gray-300">Backup Protocol</div>
                                    <div className="text-[10px] text-gray-500 font-mono">Save your current timeline.</div>
                                </div>
                                <button
                                    onClick={handleExport}
                                    className="bg-[#2a2a2a] hover:bg-[#d4af37] hover:text-black text-[#d4af37] px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wide transition-all border border-[#444] hover:border-[#d4af37]"
                                    title="Export Data"
                                >
                                    📥 Export
                                </button>
                            </div>

                            <div className="flex items-center justify-between bg-[#151515] p-3 rounded border border-[#2a2a2a]">
                                <div>
                                    <div className="text-sm font-bold text-gray-300">Timeline Restore</div>
                                    <div className="text-[10px] text-gray-500 font-mono">Overwrite with external data.</div>
                                </div>
                                <label className="bg-[#2a2a2a] hover:bg-blue-500 hover:text-white text-blue-400 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wide transition-all border border-[#444] hover:border-blue-400 cursor-pointer" title="Import Data">
                                    📤 Import
                                    <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Danger Zone */}
                <div className="mt-8 bg-[#1a0505] rounded-lg border border-red-900/30 shadow-none relative overflow-hidden hover:border-red-600/50 transition-colors">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-10 pointer-events-none"></div>

                    <div className="p-4 flex items-center justify-between relative z-10">
                        <div>
                            <h3 className="text-red-500 font-bold text-sm uppercase tracking-wider flex items-center gap-2 mb-1">
                                💀 Cataclysm
                            </h3>
                            <div className="text-[10px] text-red-900/60 font-mono max-w-[150px] leading-tight">
                                Execute total system purge. Irreversible status reset.
                            </div>
                        </div>
                        <button
                            onClick={handleReset}
                            className="bg-red-950/50 hover:bg-red-600 text-red-600 hover:text-white border border-red-900/50 px-3 py-2 rounded text-xs font-bold uppercase tracking-widest transition-all shadow-sm hover:shadow-[0_0_15px_rgba(220,20,60,0.5)]"
                        >
                            Reset
                        </button>
                    </div>
                </div>
            </div>

            <div className="mt-auto pt-6 pb-2 text-center">
                <div className="text-[10px] text-gray-700 font-mono opacity-40 hover:opacity-100 transition-opacity select-none cursor-default">
                    ID: {profile?.id || 'UNKNOWN_USER'} • SYNC: {chrome?.storage?.sync ? 'ACTIVE' : 'OFFLINE'}
                </div>
            </div>
        </div>
    );
};

export default Settings;
