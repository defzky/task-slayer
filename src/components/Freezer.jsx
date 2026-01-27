import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';

const Freezer = () => {
    const [sessions, setSessions] = useState([]);

    useEffect(() => {
        loadSessions();
    }, []);

    const loadSessions = () => {
        if (chrome?.storage?.local) {
            chrome.storage.local.get(['frozenSessions'], (result) => {
                if (result.frozenSessions) {
                    setSessions(result.frozenSessions);
                }
            });
        } else {
            const saved = localStorage.getItem('frozenSessions');
            if (saved) setSessions(JSON.parse(saved));
        }
    };

    const saveSessions = (newSessions) => {
        setSessions(newSessions);
        if (chrome?.storage?.local) {
            chrome.storage.local.set({ frozenSessions: newSessions });
        } else {
            localStorage.setItem('frozenSessions', JSON.stringify(newSessions));
        }
    };

    const handleFreeze = async () => {
        // 1. Get current tabs
        let tabs = [];
        if (chrome?.tabs) {
            // Real extension environment
            const currentWindow = await chrome.windows.getCurrent();
            const tabList = await chrome.tabs.query({ windowId: currentWindow.id });
            tabs = tabList.map(t => ({ url: t.url, title: t.title, favIconUrl: t.favIconUrl }));

            // Close window (optional, maybe ask user? for now just save)
            // chrome.windows.remove(currentWindow.id); 
        } else {
            // Mock environment
            tabs = [
                { title: 'Google', url: 'https://google.com' },
                { title: 'Stack Overflow - React Error', url: 'https://stackoverflow.com/questions/123' },
                { title: 'Localhost:5173', url: 'http://localhost:5173' }
            ];
        }

        const newSession = {
            id: Date.now(),
            name: `Quest Log #${sessions.length + 1}`,
            date: new Date().toLocaleString(),
            tabs: tabs
        };

        saveSessions([newSession, ...sessions]);
        toast.success("Time frozen! Context saved.");
    };

    const handleRestore = (session) => {
        if (chrome?.windows) {
            const urls = session.tabs.map(t => t.url);
            chrome.windows.create({ url: urls });
        } else {
            console.log('Restoring session:', session.name);
            toast.info(`Restoring ${session.tabs.length} tabs locally (check console)`);
        }
    };

    const handleDelete = (id) => {
        const newSessions = sessions.filter(s => s.id !== id);
        saveSessions(newSessions);
    };

    return (
        <div className="h-full flex flex-col">
            <h2 className="text-xl font-bold mb-2 text-[#a0c0ff] font-serif border-b border-[#444] pb-1 flex items-center gap-2">
                <span>Stasis Chamber</span>
                <span className="text-xs font-normal text-gray-500">(Context Freezer)</span>
            </h2>

            <div className="mb-4">
                <button
                    onClick={handleFreeze}
                    className="w-full bg-[#1e3a8a] hover:bg-[#2563eb] text-blue-100 py-3 rounded-lg border border-[#3b82f6] shadow-[0_0_10px_rgba(59,130,246,0.3)] transition-all flex items-center justify-center gap-2"
                >
                    <span>❄️</span> Freeze Current Context
                </button>
                <p className="text-xs text-center text-gray-500 mt-1">Saves all open tabs in this window</p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {sessions.length === 0 && (
                    <div className="text-center text-gray-500 italic mt-8">
                        No frozen contexts found.<br />The void is empty.
                    </div>
                )}
                {sessions.map(session => (
                    <div key={session.id} className="bg-[#2a282a] border border-[#444] rounded p-3 hover:border-[#a0c0ff] transition-colors group">
                        <div className="flex justify-between items-start mb-1">
                            <h3 className="font-bold text-[#e0e0e0]">{session.name}</h3>
                            <span className="text-xs text-gray-500">{session.date.split(',')[0]}</span>
                        </div>
                        <div className="text-xs text-gray-400 mb-2">
                            {session.tabs.length} tabs frozen
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => handleRestore(session)}
                                className="flex-1 bg-[#333] hover:bg-[#444] text-xs py-1 rounded border border-[#555] text-green-400"
                            >
                                Restore
                            </button>
                            <button
                                onClick={() => handleDelete(session.id)}
                                className="px-2 bg-[#333] hover:bg-[#441111] text-xs py-1 rounded border border-[#555] text-red-400"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Freezer;
