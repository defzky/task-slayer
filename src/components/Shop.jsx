import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { playSound } from '../utils/soundfx';

const Shop = ({ profile, updateProfile, setTheme, setAvatar, setConfetti, soundEnabled, inventory, updateInventory }) => {
    const [activeTab, setActiveTab] = useState('merchant'); // 'merchant' | 'inventory'
    const [items, setItems] = useState([
        { id: 'theme_default', name: 'Standard Gear', price: 0, type: 'theme', value: 'default', purchased: true },
        { id: 'theme_cyber', name: 'Cyberpunk Neon', price: 100, type: 'theme', value: 'cyber', purchased: false },
        { id: 'theme_forest', name: 'Elven Forest', price: 150, type: 'theme', value: 'forest', purchased: false },
        { id: 'theme_royal', name: 'Royal Guard', price: 300, type: 'theme', value: 'royal', purchased: false },

        // Avatars
        { id: 'av_wizard', name: 'Wizard', price: 0, type: 'avatar', value: '🧙‍♂️', purchased: true },
        { id: 'av_elf', name: 'Elf', price: 50, type: 'avatar', value: '🧝‍♀️', purchased: false },
        { id: 'av_robot', name: 'Droid', price: 80, type: 'avatar', value: '🤖', purchased: false },
        { id: 'av_skeleton', name: 'Undead', price: 120, type: 'avatar', value: '💀', purchased: false },

        // Confetti
        { id: 'cf_default', name: 'Paper Scraps', price: 0, type: 'confetti', value: 'default', purchased: true },
        { id: 'cf_fire', name: 'Fireball', price: 200, type: 'confetti', value: 'fire', purchased: false },
        { id: 'cf_ice', name: 'Ice Shards', price: 200, type: 'confetti', value: 'ice', purchased: false },
    ]);

    useEffect(() => {
        // Load purchased items from storage
        if (chrome?.storage?.local) {
            chrome.storage.local.get(['purchasedItems'], (res) => {
                if (res.purchasedItems) {
                    const purchasedIds = new Set(res.purchasedItems);
                    setItems(prev => prev.map(item => ({
                        ...item,
                        purchased: item.price === 0 || purchasedIds.has(item.id)
                    })));
                }
            });
        } else {
            const saved = localStorage.getItem('purchasedItems');
            if (saved) {
                const purchasedIds = new Set(JSON.parse(saved));
                setItems(prev => prev.map(item => ({
                    ...item,
                    purchased: item.price === 0 || purchasedIds.has(item.id)
                })));
            }
        }
    }, []);

    const buyItem = (item) => {
        if (item.purchased) {
            // Equip
            if (item.type === 'theme') setTheme(item.value);
            if (item.type === 'avatar') setAvatar(item.value);
            if (item.type === 'confetti') setConfetti(item.value);
            playSound.click();
            return;
        }

        if ((profile.gold || 0) >= item.price) {
            if (confirm(`Purchase ${item.name} for ${item.price} Gold?`)) {
                playSound.coin(); // Should be a "Cha-ching" but coin works

                // Deduct Gold
                const newGold = profile.gold - item.price;
                updateProfile({ ...profile, gold: newGold });

                // Mark as purchased
                const updatedItems = items.map(i => i.id === item.id ? { ...i, purchased: true } : i);
                setItems(updatedItems);

                // Save Purchased State
                const purchasedIds = updatedItems.filter(i => i.purchased).map(i => i.id);
                if (chrome?.storage?.local) {
                    chrome.storage.local.set({ purchasedItems: purchasedIds });
                } else {
                    localStorage.setItem('purchasedItems', JSON.stringify(purchasedIds));
                }

                // Auto-equip
                if (item.type === 'theme') setTheme(item.value);
                if (item.type === 'avatar') setAvatar(item.value);
                if (item.type === 'confetti') setConfetti(item.value);
                toast.success(`Purchased ${item.name}!`);
            }
        } else {
            if (soundEnabled) playSound.error();
            toast.error("Not enough Gold, adventurer!");
        }
    };

    const useItem = (item) => {
        // Basic Consumption Logic
        if (item.count <= 0) return;

        let consumed = false;

        if (item.id === 'potion_focus') {
            if (confirm("Drink Potion of Focus? (Starts 25m Focus Music)")) {
                consumed = true;
                // TODO: Trigger actual Focus Mode / Timer
                toast.success("Potion consumed! Focus Mode Activated! 🧠⚡");
                if (soundEnabled) playSound.heal(); // Reuse heal sound or similar
                window.open('https://www.youtube.com/watch?v=jfKfPfyJRdk', '_blank'); // Lo-fi Beats
            }
        } else if (item.id === 'scroll_reschedule') {
            alert("Scroll of Reschedule usage: Go to Quests -> Edit Quest -> Use Scroll to change date!");
            // Actual implementation would be in Quests component or a global modal context
        } else if (item.id === 'mystery_key') {
            toast("This key hums with potential... but finds no lock yet.");
        }

        if (consumed) {
            const newInventory = inventory.map(i =>
                i.id === item.id ? { ...i, count: i.count - 1 } : i
            ).filter(i => i.count > 0);
            updateInventory(newInventory);
        }
    };

    return (
        <div className="h-full flex flex-col p-2">
            <h2 className="text-xl font-bold text-[#ffd700] font-serif border-b border-[#444] pb-2 mb-4 flex justify-between items-center">
                <span>Goblin Merchant</span>
                <span className="text-sm font-sans bg-[#333] px-2 py-1 rounded">💰 {profile.gold || 0} G</span>
            </h2>

            {/* Shop Tabs */}
            <div className="flex gap-2 mb-4">
                <button
                    onClick={() => setActiveTab('merchant')}
                    className={`flex-1 py-2 text-sm font-bold rounded ${activeTab === 'merchant' ? 'bg-[#d4af37] text-black' : 'bg-[#1e1e1e] text-gray-400 hover:bg-[#333]'}`}
                >
                    🛒 Buy Details
                </button>
                <button
                    onClick={() => setActiveTab('inventory')}
                    className={`flex-1 py-2 text-sm font-bold rounded ${activeTab === 'inventory' ? 'bg-[#d4af37] text-black' : 'bg-[#1e1e1e] text-gray-400 hover:bg-[#333]'}`}
                >
                    🎒 Backpack ({inventory ? inventory.length : 0})
                </button>
            </div>

            {activeTab === 'merchant' ? (
                <div className="grid grid-cols-2 gap-3 overflow-y-auto">
                    {items.map(item => (
                        <div key={item.id} className="bg-[#2a282a] border border-[#d4af37] rounded p-3 flex flex-col items-center text-center hover:bg-[#333] transition-colors relative">
                            <div className="text-2xl mb-2">
                                {item.type === 'avatar' ? item.value : (item.type === 'theme' ? '🎨' : '✨')}
                            </div>
                            <div className="font-bold text-[#e0e0e0] text-sm">{item.name}</div>
                            <div className="text-xs text-gray-500 mb-2 capitalize">{item.type}</div>

                            <button
                                onClick={() => buyItem(item)}
                                className={`w-full text-xs py-1 rounded border ${item.purchased
                                    ? 'bg-[#444] border-gray-600 text-gray-300'
                                    : 'bg-[#1e1e1e] border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37] hover:text-black'
                                    }`}
                            >
                                {item.purchased ? 'Equip' : `${item.price} G`}
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto">
                    {(!inventory || inventory.length === 0) && (
                        <div className="text-center text-gray-500 italic mt-8">Your backpack is empty.<br />Complete quests to find loot!</div>
                    )}
                    <div className="space-y-2">
                        {inventory && inventory.map(item => (
                            <div key={item.id} className="bg-[#1a1111] border border-[#d4af37]/50 rounded p-3 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="text-2xl">
                                        {item.id.includes('potion') && '🧪'}
                                        {item.id.includes('scroll') && '📜'}
                                        {item.id.includes('key') && '🗝️'}
                                    </div>
                                    <div>
                                        <div className="font-bold text-[#e0e0e0] text-sm">{item.name} <span className="text-gray-500 text-xs">x{item.count}</span></div>
                                        <div className="text-xs text-gray-400">{item.description}</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => useItem(item)}
                                    className="bg-[#1e1e1e] border border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37] hover:text-black px-3 py-1 rounded text-xs transition-colors"
                                >
                                    Use
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Shop;
