# Task Slayer × Obsidian Integration

**Branch:** `feature/obsidian-integration`  
**Created:** 2026-04-15  
**Status:** 🚧 Planning

---

## 🎯 Objectives

Enable Task Slayer Chrome Extension to **read/write Obsidian vault data**:
- ✅ Create quests from Obsidian notes
- ✅ Sync tasks between Task Slayer and Obsidian
- ✅ Link quests to Obsidian notes
- ✅ Daily notes integration
- ✅ Dataview compatibility

---

## 📋 Features

### **Phase 1: Read Obsidian Notes** 📖
- [ ] Access Obsidian vault via local file system
- [ ] Parse markdown files for tasks (`- [ ] task`)
- [ ] Import tasks as quests
- [ ] Link quest to note file path

### **Phase 2: Write to Obsidian** ✍️
- [ ] Create new notes from quests
- [ ] Update task status in notes
- [ ] Add quest metadata to frontmatter
- [ ] Sync completion status

### **Phase 3: Advanced Integration** 🔥
- [ ] Daily notes auto-create quests
- [ ] Dataview queries for quest lists
- [ ] Backlinks between quests and notes
- [ ] Tags synchronization

---

## 🔧 Technical Approach

### **Challenge: Chrome Extension Sandbox**

Chrome extensions **cannot directly access file system** for security reasons.

**Solutions:**

#### **Option 1: Native Messaging Host** (Recommended) ⭐
```
Task Slayer (Chrome) ↔ Native Host ↔ Obsidian Vault (File System)
```

**Pros:**
- ✅ Secure, official Chrome API
- ✅ Full file system access
- ✅ Real-time sync

**Cons:**
- ⚠️ Requires native app installation
- ⚠️ More setup complexity

---

#### **Option 2: Obsidian Plugin** (Best UX) ⭐⭐
```
Task Slayer (Chrome) ↔ MockBase API ↔ Obsidian Plugin ↔ Obsidian Vault
```

**Create Obsidian Plugin that:**
- Runs inside Obsidian
- Has file system access
- Syncs with MockBase API
- Updates notes in real-time

**Pros:**
- ✅ Best user experience
- ✅ No native messaging setup
- ✅ Works within Obsidian ecosystem

**Cons:**
- ⚠️ Need to build Obsidian plugin
- ⚠️ Users must install plugin

---

#### **Option 3: Shared Folder Sync** (Simplest)
```
Task Slayer → Save to ~/TaskSlayer/ → Obsidian reads from same folder
```

**Pros:**
- ✅ Simplest to implement
- ✅ No special permissions needed

**Cons:**
- ⚠️ Manual sync (not automatic)
- ⚠️ File-based, not real-time

---

## 🛠️ Recommended Architecture

### **Hybrid Approach: MockBase + Obsidian Plugin**

```
┌─────────────┐
│ Task Slayer │
│  (Chrome)   │
└──────┬──────┘
       │ HTTP API
       ↓
┌─────────────┐
│  MockBase   │
│ (localhost) │
└──────┬──────┘
       │ HTTP API
       ↓
┌─────────────┐
│  Obsidian   │
│   Plugin    │
└──────┬──────┘
       │ File System
       ↓
┌─────────────┐
│  Obsidian   │
│    Vault    │
└─────────────┘
```

**Components:**
1. **Task Slayer** - Chrome extension (existing)
2. **MockBase** - Local API server (already built)
3. **Obsidian Plugin** - Bridge between MockBase and Obsidian vault

---

## 📁 Data Structure

### **Quest Metadata (Frontmatter)**
```yaml
---
task-slayer:
  questId: 123
  status: active
  xpReward: 50
  type: normal
  createdAt: 2026-04-15
  dueDate: 2026-04-20
---
```

### **Task Format in Notes**
```markdown
## My Tasks

- [ ] Fix login bug #quest/123 #priority/high
- [x] Write documentation #quest/124
- [ ] Review PR #42 #quest/125 #priority/medium
```

### **Daily Note Integration**
```markdown
# 2026-04-15

## Quests
```quest-list
status: active
due: this-week
```

## Notes
- Meeting notes
- Ideas
```

---

## 🔐 Permissions Required

### **Chrome Extension:**
```json
{
  "permissions": [
    "nativeMessaging"
  ],
  "externally_connectable": {
    "matches": ["http://localhost:3000/*"]
  }
}
```

### **Obsidian Plugin:**
- File system access (built-in)
- HTTP requests to localhost

---

## 📊 Sync Strategy

### **Bidirectional Sync:**
```
Task Slayer → MockBase → Obsidian Plugin → Obsidian
     ↑                                        ↓
     └────────────────────────────────────────┘
```

**Conflict Resolution:**
- Latest timestamp wins
- Manual merge for conflicts
- User preference (Obsidian-first or Task Slayer-first)

---

## 🧪 Implementation Plan

### **Week 1: Foundation**
- [ ] Create MockBase endpoints for Obsidian
- [ ] Setup Obsidian plugin scaffold
- [ ] Basic file read/write

### **Week 2: Core Features**
- [ ] Import tasks from Obsidian
- [ ] Export quests to Obsidian
- [ ] Link quests to notes

### **Week 3: Advanced**
- [ ] Daily notes integration
- [ ] Dataview queries
- [ ] Backlinks

### **Week 4: Polish**
- [ ] Sync conflict resolution
- [ ] Settings UI
- [ ] Documentation

---

## 🎯 Success Metrics

- [ ] Can create quest from Obsidian note
- [ ] Can link quest to existing note
- [ ] Task completion syncs both ways
- [ ] Daily notes auto-generate quests
- [ ] Dataview integration works

---

## 📝 Related Branches

- `master` - Current stable (0.3.0)
- `feature/monetization` - Authentication + subscriptions
- `feature/obsidian-integration` - This branch

---

**Last Updated:** 2026-04-15  
**Branch Owner:** @defzky
