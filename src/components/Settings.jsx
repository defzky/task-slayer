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
        <div className="h-full flex flex-col p-2 space-y-6">
            <h2 className="text-xl font-bold text-[#e0e0e0] border-b border-[#444] pb-2">System Settings</h2>

            {/* Data Management */}
            <div className="bg-[#2a282a] p-4 rounded-lg border border-[#444]">
                <h3 className="text-[#d4af37] font-bold mb-4 flex items-center gap-2">
                    💾 Data Management
                </h3>

                <div className="space-y-4">
                    {/* Export */}
                    <div className="flex justify-between items-center border-b border-[#333] pb-3">
                        <div>
                            <div className="text-sm font-bold text-gray-200">Export Save Data</div>
                            <div className="text-xs text-gray-500">Backup your progress to a JSON file.</div>
                        </div>
                        <button
                            onClick={handleExport}
                            className="bg-[#1e1e1e] hover:bg-[#333] border border-[#d4af37] text-[#d4af37] px-3 py-1 rounded text-sm transition-colors"
                        >
                            📤 Backup
                        </button>
                    </div>

                    {/* Import */}
                    <div className="flex justify-between items-center border-b border-[#333] pb-3">
                        <div>
                            <div className="text-sm font-bold text-gray-200">Import Save Data</div>
                            <div className="text-xs text-gray-500">Restore progress from a file.</div>
                        </div>
                        <label className="bg-[#1e1e1e] hover:bg-[#333] border border-gray-500 text-gray-300 px-3 py-1 rounded text-sm transition-colors cursor-pointer">
                            📥 Restore
                            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                        </label>
                    </div>

                    {/* Reset */}
                    <div className="flex justify-between items-center pt-2">
                        <div>
                            <div className="text-sm font-bold text-red-500">Hard Reset</div>
                            <div className="text-xs text-gray-600">Wipe everything and start fresh.</div>
                        </div>
                        <button
                            onClick={handleReset}
                            className="bg-red-900/20 hover:bg-red-900/50 border border-red-800 text-red-500 px-3 py-1 rounded text-sm transition-colors"
                        >
                            💣 Reset
                        </button>
                    </div>
                </div>
            </div>

            <div className="text-center text-xs text-gray-600 mt-auto">
                Zky's RPG Sidekick v1.0.0
            </div>
        </div>
    );
};

export default Settings;
