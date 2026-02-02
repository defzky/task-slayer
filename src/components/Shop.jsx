import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { playSound } from '../utils/soundfx';
import { ShoppingBag, Backpack, Sparkles, User, Palette, Key, Scroll } from 'lucide-react';

const Shop = ({ profile, updateProfile, setTheme, setAvatar, setConfetti, soundEnabled, inventory, updateInventory, setActiveRaid, setActiveTab, currentTheme, currentAvatar, currentConfetti }) => {
    const [shopTab, setShopTab] = useState('merchant'); // 'merchant' | 'inventory'
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

        // Consumables
        { id: 'mystery_key', name: 'Mystery Key', price: 500, type: 'consumable', value: 'key', description: 'Unlocks Ancient Gates', purchased: false },
        { id: 'potion_focus', name: 'Potion of Focus', price: 50, type: 'consumable', value: 'potion', description: 'Boosts concentration music', purchased: false },
        { id: 'scroll_reschedule', name: 'Time Scroll', price: 100, type: 'consumable', value: 'scroll', description: 'Manipulate quest time', purchased: false },
    ]);

    useEffect(() => {
        // Load purchased items from storage
        if (chrome?.storage?.local) {
            chrome.storage.local.get(['purchasedItems'], (res) => {
                if (res.purchasedItems) {
                    const purchasedIds = new Set(res.purchasedItems);
                    setItems(prev => prev.map(item => ({
                        ...item,
                        purchased: item.type !== 'consumable' && (item.price === 0 || purchasedIds.has(item.id))
                    })));
                }
            });
        } else {
            const saved = localStorage.getItem('purchasedItems');
            if (saved) {
                const purchasedIds = new Set(JSON.parse(saved));
                setItems(prev => prev.map(item => ({
                    ...item,
                    purchased: item.type !== 'consumable' && (item.price === 0 || purchasedIds.has(item.id))
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
        // Cosmetic Equip Logic
        if (item.type !== 'consumable' && item.purchased) {
            if (item.type === 'theme') setTheme(item.value);
            if (item.type === 'avatar') setAvatar(item.value);
            if (item.type === 'confetti') setConfetti(item.value);
            playSound.click();
            return;
        }

        const finalPrice = getPrice(item.price);

        if ((profile.gold || 0) >= finalPrice) {
            if (confirm(`Purchase ${item.name} for ${finalPrice} Gold?`)) {
                playSound.coin();

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

                // Handle Item Type
                if (item.type === 'consumable') {
                    // Update Inventory
                    const currentInventory = inventory || [];
                    const existingItem = currentInventory.find(i => i.id === item.id);
                    let newInventory;

                    if (existingItem) {
                        newInventory = currentInventory.map(i =>
                            i.id === item.id ? { ...i, count: i.count + 1 } : i
                        );
                    } else {
                        newInventory = [...currentInventory, {
                            id: item.id,
                            name: item.name,
                            type: item.type,
                            description: item.description,
                            count: 1
                        }];
                    }
                    updateInventory(newInventory);
                    toast.success(`Purchased ${item.name}! Added to Backpack.`);
                } else {
                    // Purchase Cosmetic
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
            if (confirm("The key vibrates violently... Do you trigger the Ancient Portal? (Starts Special Raid)")) {
                consumed = true;

                // Create Special Raid
                const specialRaid = {
                    id: Date.now(),
                    name: "The Golden Dragon",
                    bossId: "dragon_gold", // Need to handle this visual in RaidBoss
                    maxHp: 100, // Epik
                    currentHp: 100,
                    tasks: [],
                    rewards: { gold: 1000, xp: 500 },
                    isSpecial: true
                };

                setActiveRaid(specialRaid);
                toast.custom((t) => (
                    <div className="bg-[#1a0f0f] border-2 border-[#d4af37] text-[#ffd700] p-4 rounded-lg flex items-center gap-4 animate-bounce-slow" onClick={() => setActiveTab('raids')}>
                        <div className="text-4xl">🐲</div>
                        <div>
                            <div className="font-bold text-lg uppercase tracking-widest">GATE OPENED!</div>
                            <div className="text-yellow-200 text-sm">The Golden Dragon awaits...</div>
                        </div>
                    </div>
                ), { duration: 5000 });

                if (soundEnabled) playSound.bossDie(); // Epic sound
                setActiveTab('raids');
            }
        }

        if (consumed) {
            const newInventory = inventory.map(i =>
                i.id === item.id ? { ...i, count: i.count - 1 } : i
            ).filter(i => i.count > 0);
            updateInventory(newInventory);
        }
    };

    const isEquipped = (item) => {
        if (item.type === 'theme') return currentTheme === item.value;
        if (item.type === 'avatar') return currentAvatar === item.value;
        if (item.type === 'confetti') return currentConfetti === item.value;
        return false;
    };

    const getItemIcon = (type, value) => {
        if (type === 'theme') return <Palette size={20} />;
        if (type === 'avatar') return <User size={20} />;
        if (type === 'confetti') return <Sparkles size={20} />;
        return <ShoppingBag size={20} />;
    };

    return (
        <div className="h-full flex flex-col p-4 bg-[#111] overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <div className="bg-[#1e1e1e] p-2.5 rounded-xl border border-[#333]">
                        <ShoppingBag className="text-[#d4af37]" size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Goblin Market</h2>
                        <p className="text-xs text-gray-500">Spend your hard-earned gold</p>
                    </div>
                </div>
                <div className="bg-[#1a1410] px-4 py-2 rounded-xl border border-[#5c4033] flex items-center gap-2">
                    <span className="text-lg">💰</span>
                    <span className="text-[#ffd700] font-bold font-mono">{profile.gold || 0}</span>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-4 bg-[#1a1a1a] p-1 rounded-xl border border-[#333]">
                <button
                    onClick={() => setShopTab('merchant')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${shopTab === 'merchant'
                        ? 'bg-[#d4af37] text-black shadow-lg'
                        : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]'
                        }`}
                >
                    <ShoppingBag size={14} /> Merchant
                </button>
                <button
                    onClick={() => setShopTab('inventory')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${shopTab === 'inventory'
                        ? 'bg-[#d4af37] text-black shadow-lg'
                        : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]'
                        }`}
                >
                    <Backpack size={14} /> Inventory ({inventory ? inventory.length : 0})
                </button>
            </div>

            {/* Content Area */}
            {shopTab === 'merchant' ? (
                <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {items.map(item => {
                        const equipped = isEquipped(item);
                        return (
                            <div key={item.id} className={`group relative bg-[#1a1a1a] border rounded-xl p-4 transition-all hover:border-[#d4af37]/50 hover:shadow-[0_0_20px_rgba(0,0,0,0.5)] ${equipped ? 'border-green-800' : 'border-[#333]'}`}>
                                <div className="flex justify-between items-start mb-3">
                                    <div className="w-10 h-10 rounded-lg bg-[#111] border border-[#333] flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                                        {item.type === 'avatar' ? item.value : getItemIcon(item.type, item.value)}
                                    </div>
                                    <div className="bg-[#0f0f0f] px-2 py-1 rounded text-[10px] font-mono text-gray-500 uppercase tracking-widest border border-[#222]">
                                        {item.type}
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <h3 className="font-bold text-gray-200 text-sm">{item.name}</h3>
                                    {item.description && <p className="text-[10px] text-gray-500 mt-1">{item.description}</p>}
                                </div>

                                <button
                                    onClick={() => buyItem(item)}
                                    disabled={equipped}
                                    className={`w-full py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${equipped
                                        ? 'bg-green-900/20 text-green-500 border border-green-900/50 cursor-default'
                                        : (item.purchased && item.type !== 'consumable')
                                            ? 'bg-[#2a2a2a] text-gray-300 hover:bg-[#333] hover:text-white border border-[#444]'
                                            : 'bg-[#d4af37] text-black hover:bg-[#c5a028] shadow-[0_2px_10px_rgba(212,175,55,0.2)]'
                                        }`}
                                >
                                    {equipped ? (
                                        <><span>✔</span> Equipped</>
                                    ) : (item.purchased && item.type !== 'consumable') ? (
                                        'Equip'
                                    ) : (
                                        <>
                                            {item.price !== getPrice(item.price) && <span className="line-through opacity-50 text-[10px]">{item.price}</span>}
                                            {getPrice(item.price)} G
                                        </>
                                    )}
                                </button>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto pr-2">
                    {(!inventory || inventory.length === 0) ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-600">
                            <Backpack size={48} className="mb-4 opacity-20" />
                            <p className="text-sm">Your backpack is empty.</p>
                            <p className="text-xs mt-2">Complete quests to earn loot!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-2">
                            {inventory.map(item => (
                                <div key={item.id} className="bg-[#1a1a1a] border border-[#333] rounded-xl p-3 flex items-center gap-4 hover:border-[#d4af37]/30 transition-colors group">
                                    <div className="w-12 h-12 bg-[#111] rounded-lg border border-[#333] flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
                                        {item.id.includes('potion') && '🧪'}
                                        {item.id.includes('scroll') && <Scroll size={20} className="text-blue-400" />}
                                        {item.id.includes('key') && <Key size={20} className="text-yellow-400" />}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between">
                                            <h3 className="font-bold text-gray-200 text-sm">{item.name}</h3>
                                            <span className="text-xs text-gray-500 bg-[#111] px-2 py-0.5 rounded border border-[#222]">x{item.count}</span>
                                        </div>
                                        <p className="text-[10px] text-gray-500 mt-1">{item.description}</p>
                                    </div>
                                    <button
                                        onClick={() => useItem(item)}
                                        className="bg-[#2a2a2a] hover:bg-[#d4af37] hover:text-black text-gray-400 px-4 py-2 rounded-lg text-xs font-bold transition-all border border-[#333] hover:border-[#d4af37]"
                                    >
                                        Use
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Shop;
