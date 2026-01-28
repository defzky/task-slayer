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

    // Helper: Calculate Price with Discount
    const getPrice = (basePrice) => {
        const unlockedSkills = new Set(profile.unlockedSkills || []);
        if (unlockedSkills.has('goblin_negotiator') && basePrice > 0) {
            return Math.floor(basePrice * 0.9);
        }
        return basePrice;
    };

    const buyItem = (item) => {
        if (item.purchased) {
            // Equip
            if (item.type === 'theme') setTheme(item.value);
            if (item.type === 'avatar') setAvatar(item.value);
            if (item.type === 'confetti') setConfetti(item.value);
            playSound.click();
            return;
        }

        const finalPrice = getPrice(item.price);

        if ((profile.gold || 0) >= finalPrice) {
            if (confirm(`Purchase ${item.name} for ${finalPrice} Gold?`)) {
                playSound.coin(); // Should be a "Cha-ching" but coin works

                // Deduct Gold & Update Stats
                const newGold = profile.gold - finalPrice;
                const currentStats = profile.stats || {};
                updateProfile({
                    ...profile,
                    gold: newGold,
                    stats: {
                        ...currentStats,
                        itemsBought: (currentStats.itemsBought || 0) + 1
                    }
                });

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
            <h2 className="text-2xl font-bold text-[#ffd700] font-serif border-b-2 border-[#5c4033] pb-3 mb-4 flex justify-between items-end bg-[#1a0f0f] p-4 rounded-t-lg shadow-inner relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] opacity-20 pointer-events-none"></div>
                <div className="relative z-10 flex items-center gap-2">
                    <span className="text-3xl filter drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">🏺</span>
                    <span className="drop-shadow-[0_2px_0_rgba(0,0,0,1)] text-[#e0c090]">Goblin Market</span>
                </div>
                <div className="relative z-10 flex flex-col items-end">
                    <span className="text-xs text-[#8a6d1f] font-bold uppercase tracking-widest">Your Purse</span>
                    <div className="text-xl font-mono text-[#ffd700] font-bold bg-[#000]/50 px-3 py-1 rounded border border-[#8a6d1f] flex items-center gap-2 shadow-[inset_0_0_10px_rgba(0,0,0,0.8)]">
                        <span>💰</span> {profile.gold || 0}
                    </div>
                </div>
            </h2>

            {/* Shop Tabs */}
            <div className="flex gap-2 mb-4 bg-[#0f0a0a] p-1 rounded-lg border border-[#333]">
                <button
                    onClick={() => setActiveTab('merchant')}
                    className={`flex-1 py-2 text-sm font-bold rounded flex items-center justify-center gap-2 transition-all ${activeTab === 'merchant' ? 'bg-[#5c4033] text-[#e0d0b0] border border-[#d4af37] shadow-[0_0_10px_rgba(212,175,55,0.2)]' : 'text-gray-500 hover:text-[#d4af37] hover:bg-[#1a1111]'}`}
                >
                    ⚖️ Wares
                </button>
                <button
                    onClick={() => setActiveTab('inventory')}
                    className={`flex-1 py-2 text-sm font-bold rounded flex items-center justify-center gap-2 transition-all ${activeTab === 'inventory' ? 'bg-[#1e293b] text-blue-200 border border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.2)]' : 'text-gray-500 hover:text-blue-300 hover:bg-[#0f172a]'}`}
                >
                    🎒 Backpack ({inventory ? inventory.length : 0})
                </button>
            </div>

            {activeTab === 'merchant' ? (
                <div className="grid grid-cols-2 gap-3 overflow-y-auto pr-1">
                    {items.map(item => (
                        <div key={item.id} className="bg-[#1a0f0f] border-2 border-[#5c4033] rounded-sm p-3 flex flex-col items-center text-center hover:border-[#d4af37] transition-all relative group shadow-[0_4px_6px_rgba(0,0,0,0.3)]">
                            {/* Card Texture */}
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-wood.png')] opacity-10 pointer-events-none"></div>

                            <div className="relative z-10 text-3xl mb-2 filter drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)] group-hover:scale-110 transition-transform">
                                {item.type === 'avatar' ? item.value : (item.type === 'theme' ? '🎨' : '✨')}
                            </div>
                            <div className="relative z-10 font-bold text-[#e0c090] text-sm font-serif">{item.name}</div>
                            <div className="relative z-10 text-[10px] text-[#8a6d1f] mb-3 uppercase tracking-wider">{item.type}</div>

                            <button
                                onClick={() => buyItem(item)}
                                className={`relative z-10 w-full text-xs py-1.5 rounded font-bold uppercase tracking-wide transition-colors ${item.purchased
                                    ? 'bg-[#2a282a] border border-[#444] text-gray-500 cursor-default'
                                    : 'bg-[#0f2a0f] border border-[#2e8b57] text-[#50c878] hover:bg-[#1a3a1a] hover:text-white shadow-[0_0_5px_rgba(46,139,87,0.3)]'
                                    }`}
                            >
                                {item.purchased ? 'Owned' : (
                                    <span>
                                        {item.price !== getPrice(item.price) && <span className="line-through opacity-50 mr-1">{item.price}</span>}
                                        {getPrice(item.price)} G
                                    </span>
                                )}
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto">
                    {(!inventory || inventory.length === 0) && (
                        <div className="text-center text-gray-500 italic mt-8">Your backpack is empty.<br />Complete quests to find loot!</div>
                    )}
                    <div className="space-y-2 pr-1">
                        {inventory && inventory.map(item => (
                            <div key={item.id} className="bg-[#0f172a] border border-blue-900/50 rounded-lg p-3 flex items-center justify-between shadow-[0_4px_6px_rgba(0,0,0,0.3)] hover:shadow-[0_0_15px_rgba(0,0,255,0.1)] transition-all group">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-[#1e293b] rounded border border-blue-800 flex items-center justify-center text-2xl shadow-inner group-hover:scale-105 transition-transform">
                                        {item.id.includes('potion') && '🧪'}
                                        {item.id.includes('scroll') && '📜'}
                                        {item.id.includes('key') && '🗝️'}
                                    </div>
                                    <div>
                                        <div className="font-bold text-blue-100 text-sm flex items-center gap-2">
                                            {item.name}
                                            <span className="bg-blue-900/50 text-blue-300 text-[10px] px-1.5 rounded py-0.5 border border-blue-800/50">x{item.count}</span>
                                        </div>
                                        <div className="text-[10px] text-blue-400/70 italic max-w-[150px] leading-tight mt-0.5">{item.description}</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => useItem(item)}
                                    className="bg-[#1e293b] hover:bg-[#2563eb] text-blue-300 hover:text-white border border-blue-700 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wide transition-all shadow-[0_2px_5px_rgba(0,0,0,0.2)] active:scale-95"
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
