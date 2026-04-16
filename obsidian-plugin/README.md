# Task Slayer Obsidian Plugin

**Status:** 🚧 Planned  
**Location:** `/Users/taki/Dev/task-slayer/obsidian-plugin/`

---

## 🎯 Purpose

Obsidian plugin that bridges **Task Slayer** (Chrome extension) with **Obsidian Vault** (file system).

---

## 🏗️ Architecture

```
Task Slayer (Chrome)
       ↓
MockBase API (localhost:3000)
       ↓
Obsidian Plugin (HTTP Client)
       ↓
Obsidian Vault (File System)
```

---

## 📦 Features

### **MVP (v0.1.0)**
- [ ] Connect to MockBase API
- [ ] Read tasks from MockBase
- [ ] Create markdown files in vault
- [ ] Parse tasks from notes

### **v0.2.0**
- [ ] Two-way sync (Obsidian ↔ Task Slayer)
- [ ] Task status updates
- [ ] Quest metadata in frontmatter

### **v0.3.0**
- [ ] Daily notes integration
- [ ] Dataview queries
- [ ] Backlinks

---

## 🛠️ Tech Stack

- **TypeScript**
- **Obsidian Plugin API**
- **HTTP client** (fetch)
- **Moment.js** (dates)

---

## 📁 Project Structure

```
obsidian-plugin/
├── src/
│   ├── main.ts          # Plugin entry point
│   ├── settings.ts      # Settings UI
│   ├── sync.ts          # Sync logic
│   └── parser.ts        # Markdown task parser
├── manifest.json
├── package.json
└── README.md
```

---

## 🔧 Setup

```bash
cd obsidian-plugin
npm install
npm run dev

# Plugin builds to:
# ~/.obsidian/plugins/task-slayer/
```

---

## 📝 Task Format

Tasks in Obsidian notes:

```markdown
- [ ] Fix login bug #quest/123 #priority/high
- [x] Write docs #quest/124
```

Frontmatter:

```yaml
---
task-slayer:
  questId: 123
  status: active
  xpReward: 50
---
```

---

## 🚀 Development

See `OBSIDIAN_INTEGRATION.md` in parent directory for full plan.
