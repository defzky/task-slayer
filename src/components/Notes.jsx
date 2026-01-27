import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { playSound } from '../utils/soundfx';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Sortable Note Item Component
const SortableNoteItem = ({ note, isActive, onClick, onDelete, children }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: note.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            {children}
        </div>
    );
};

const Notes = () => {
    // Data Structure: [{ id: 123, content: "...", updatedAt: "..." }]
    const [notes, setNotes] = useState([]);
    const [activeNoteId, setActiveNoteId] = useState(null);
    const [isPreview, setIsPreview] = useState(false);
    const [statusMsg, setStatusMsg] = useState('');

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Load notes on mount
    useEffect(() => {
        const loadData = (result) => {
            let loadedNotes = [];
            if (result.notesList && Array.isArray(result.notesList)) {
                loadedNotes = result.notesList;
            } else if (result.quickNote) {
                // Migrate old single note
                loadedNotes = [{ id: Date.now(), content: result.quickNote, updatedAt: new Date().toISOString() }];
            }

            setNotes(loadedNotes);
            if (loadedNotes.length > 0) {
                setActiveNoteId(loadedNotes[0].id);
            }
        };

        if (chrome?.storage?.sync) {
            chrome.storage.sync.get(['notesList', 'quickNote'], (syncRes) => {
                if (syncRes.notesList || syncRes.quickNote) {
                    loadData(syncRes);
                } else {
                    // Check Local
                    chrome.storage.local.get(['notesList', 'quickNote'], (localRes) => {
                        if (localRes.notesList || localRes.quickNote) {
                            loadData(localRes);
                            chrome.storage.sync.set(localRes); // Migrate
                        }
                    });
                }
            });
        } else if (chrome?.storage?.local) {
            chrome.storage.local.get(['notesList', 'quickNote'], loadData);
        } else {
            const savedList = localStorage.getItem('notesList');
            const savedOld = localStorage.getItem('quickNote');
            let loadedNotes = [];
            if (savedList) loadedNotes = JSON.parse(savedList);
            else if (savedOld) loadedNotes = [{ id: Date.now(), content: savedOld, updatedAt: new Date().toISOString() }];

            setNotes(loadedNotes);
            if (loadedNotes.length > 0) setActiveNoteId(loadedNotes[0].id);
        }
    }, []);

    const saveNotes = (updatedNotes) => {
        setNotes(updatedNotes);
        if (chrome?.storage?.sync) {
            chrome.storage.sync.set({ notesList: updatedNotes });
        } else if (chrome?.storage?.local) {
            chrome.storage.local.set({ notesList: updatedNotes });
        } else {
            localStorage.setItem('notesList', JSON.stringify(updatedNotes));
        }
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            const oldIndex = notes.findIndex((n) => n.id === active.id);
            const newIndex = notes.findIndex((n) => n.id === over.id);
            const newNotes = arrayMove(notes, oldIndex, newIndex);
            saveNotes(newNotes);
        }
    };

    const createNote = () => {
        playSound.click();
        const newNote = {
            id: Date.now(),
            content: '# New Scroll\n',
            updatedAt: new Date().toISOString()
        };
        const updated = [newNote, ...notes];
        saveNotes(updated);
        setActiveNoteId(newNote.id);
    };

    const deleteNote = (e, id) => {
        e.stopPropagation();
        if (confirm('Burn this scroll forever?')) {
            playSound.error(); // Using error sound as "destruction"
            const updated = notes.filter(n => n.id !== id);
            saveNotes(updated);
            if (activeNoteId === id) {
                setActiveNoteId(updated.length > 0 ? updated[0].id : null);
            }
        }
    };

    const updateActiveNote = (content) => {
        const updated = notes.map(n =>
            n.id === activeNoteId ? { ...n, content, updatedAt: new Date().toISOString() } : n
        );
        saveNotes(updated);
    };

    const handleDownload = () => {
        const currentNote = notes.find(n => n.id === activeNoteId);
        if (!currentNote) return;

        const blob = new Blob([currentNote.content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `scroll-${currentNote.id}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleManualSave = () => {
        setStatusMsg('Saved!');
        playSound.coin();
        setTimeout(() => setStatusMsg(''), 2000);
        // Notes are technically auto-saved on change, but this gives feedback
    };

    const activeNote = notes.find(n => n.id === activeNoteId);

    // Helper to get title from first line
    const getTitle = (content) => {
        const lines = content.split('\n');
        const firstLine = lines.find(l => l.trim().length > 0);
        return firstLine ? firstLine.replace(/^#+\s*/, '').substring(0, 30) : 'Untitled Scroll';
    };

    return (
        <div className="h-full flex flex-col gap-2">
            {/* TOP: Notes List (Saved Scrolls) */}
            <div className="h-1/3 bg-[#232123] border border-[#444] rounded-lg flex flex-col">
                <div className="flex justify-between items-center p-2 border-b border-[#333] bg-[#2a282a] rounded-t-lg">
                    <span className="text-xs font-bold text-[#d4af37]">📜 Saved Scrolls</span>
                    <button
                        onClick={createNote}
                        className="text-xs bg-[#1e1e1e] hover:bg-[#d4af37] hover:text-black border border-[#d4af37] text-[#d4af37] px-2 py-1 rounded transition-colors"
                    >
                        + New
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-1 space-y-1">
                    {notes.length === 0 && (
                        <div className="text-center text-gray-500 text-xs mt-4">No scrolls found.</div>
                    )}

                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={notes.map(n => n.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            {notes.map(note => (
                                <SortableNoteItem key={note.id} note={note}>
                                    <div
                                        onClick={() => { playSound.click(); setActiveNoteId(note.id); }}
                                        className={`p-2 rounded cursor-pointer flex justify-between items-center group touch-none relative ${activeNoteId === note.id ? 'bg-[#333] border-l-2 border-[#d4af37]' : 'hover:bg-[#2a282a]'}`}
                                    >
                                        <div className="truncate text-sm text-[#e0e0e0] w-3/4">
                                            {getTitle(note.content)}
                                        </div>
                                        <button
                                            onClick={(e) => deleteNote(e, note.id)}
                                            onPointerDown={(e) => e.stopPropagation()}
                                            className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 text-xs px-1"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </SortableNoteItem>
                            ))}
                        </SortableContext>
                    </DndContext>
                </div>
            </div>

            {/* BOTTOM: Editor */}
            <div className="flex-1 bg-[#232123] border border-[#444] rounded-lg flex flex-col overflow-hidden">
                {activeNote ? (
                    <>
                        {/* Editor Toolbar */}
                        <div className="flex justify-between items-center p-2 border-b border-[#333] bg-[#2a282a]">
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">Editing...</span>
                                {statusMsg && <span className="text-xs text-green-400 animate-pulse">{statusMsg}</span>}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleManualSave}
                                    className="text-xs bg-[#1e1e1e] hover:bg-[#d4af37] text-[#d4af37] hover:text-black border border-[#d4af37] px-2 py-1 rounded transition-colors"
                                >
                                    💾 Save
                                </button>
                                <button
                                    onClick={handleDownload}
                                    className="text-xs bg-[#1e3a8a] hover:bg-[#2563eb] text-blue-100 px-2 py-1 rounded transition-colors"
                                >
                                    📥 Export
                                </button>
                                <button
                                    onClick={() => setIsPreview(!isPreview)}
                                    className="text-xs bg-[#444] hover:bg-[#555] px-2 py-1 rounded text-[#ccc] transition-colors"
                                >
                                    {isPreview ? '✏️ Edit' : '👁️ Preview'}
                                </button>
                            </div>
                        </div>

                        {/* Textarea or Preview */}
                        <div className="flex-1 relative overflow-hidden">
                            {!isPreview ? (
                                <textarea
                                    className="w-full h-full bg-[#2a282a] p-3 text-[#dcdcdc] resize-none focus:outline-none focus:bg-[#2e2c2e] transition-colors"
                                    value={activeNote.content}
                                    onChange={(e) => updateActiveNote(e.target.value)}
                                    placeholder="Write your runes here..."
                                    style={{ fontFamily: 'monospace' }}
                                />
                            ) : (
                                <div className="w-full h-full bg-[#2a282a] p-4 text-[#dcdcdc] overflow-y-auto prose prose-invert prose-sm max-w-none">
                                    <ReactMarkdown>{activeNote.content}</ReactMarkdown>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                        <div className="text-4xl mb-2">📜</div>
                        <div>Select a scroll from the list</div>
                        <div className="text-xs">or create a new one</div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Notes;
