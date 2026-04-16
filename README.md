# Task Slayer: RPG Productivity 🧙‍♂️⚔️

A productivity extension for developers disguised as a cozy RPG. Gamify your coding tasks, manage your work context, and keep your thoughts organized.

## ✨ Features

### 1. ⚔️ Quest Board (Adventure)
- **Gamified Tasks**: Turn to-do items into "Quests" that accept XP and Gold.
- **RPG Progression**: Level up from Novice to Code Wizard.
- **Boss Battles**: Tackle big projects by creating "Boss Quests" with HP bars and sub-tasks (Minions).
- **Class System**: Choose your path:
  - **Code Warrior**: +10% XP Bonus.
  - **Logic Wizard**: +5% XP & Gold Bonus.
  - **Pixel Rogue**: +20% Gold Bonus.
- **Streaks**: Daily login streaks to keep you consistent.

### 2. 🛒 Goblin Shop
- Spend your hard-earned Gold!
- **Themes**: Unlock "Cyberpunk Neon", "Elven Forest", or "Royal Guard" skins.
- **Avatars**: Upgrade your profile icon (Wizard, Elf, Droid, Skeleton).
- **Confetti**: Change your victory effects (Fireballs, Ice Shards).

### 3. 📝 Inventory (Notes)
- **Saved Scrolls**: Create and manage multiple markdown notes.
- **Split View**: List of notes on top, editor on bottom.
- **Export**: Download notes as `.md` files.
- **Auto-save**: Never lose your ideas.

### 4. ❄️ Stasis (Context Freezer)
- **Tab Management**: Save all current tabs into a "Session" to declutter your browser.
- **Restore**: Bring back a context window with one click.
- **Focus**: Free up RAM and mental space.

## 🛠️ Tech Stack
- **React 19** (with TypeScript)
- **Vite**
- **TailwindCSS**
- **Chrome Extension API** (Storage, Tabs)
- **Vitest** + **Testing Library** (Testing)
- **dnd-kit** (Drag & Drop)

## 🚀 Installation

1. Clone this repo.
2. Run `npm install`.
3. Run `npm run build`.
4. Open Chrome -> `chrome://extensions`.
5. Enable **Developer Mode**.
6. Click **Load Unpacked**.
7. Select the `dist` folder.

## 🧪 Testing

```bash
# Run tests in watch mode
npm test

# Run tests once
npm run test:run

# Run tests with coverage
npm run test:coverage
```

Test files are located in `src/__tests__/` and follow the pattern `*.test.tsx`.

## 📁 Project Structure

```
src/
├── components/
│   ├── Quests/          # Quest board (split into smaller components)
│   │   ├── index.tsx    # Main container
│   │   ├── QuestStats.tsx
│   │   ├── QuestForm.tsx
│   │   ├── QuestTabs.tsx
│   │   ├── QuestList.tsx
│   │   ├── QuestItem.tsx
│   │   ├── BossQuest.tsx
│   │   └── QuickDateSelector.tsx
│   ├── ErrorBoundary/   # Error handling
│   └── *.tsx            # Other components
├── types/               # TypeScript type definitions
├── utils/               # Utility functions
└── __tests__/           # Test files
```

## 🎮 How to Play
1. **Login Daily** to build your streak.
2. **Add Quests** for your coding tasks.
3. **Draft Notes** for ideas or snippets.
4. **Freeze Tabs** when switching contexts.
5. **Kill Bosses** to get massive XP and level up!

## 📋 Development Workflow

### Commit & Push Guidelines

Before committing, always:

1. **Update CHANGELOG.md**
   - Add entry under new version section
   - Follow format: `## [X.Y.Z] - YYYY-MM-DD`
   - Use categories: `Added`, `Changed`, `Fixed`, `Removed`, `Technical`
   - Be specific about what changed and why

2. **Update README.md** (if applicable)
   - Update Features section for new functionality
   - Update Tech Stack if dependencies changed
   - Update Installation/Usage if steps changed
   - Keep version badge current (if added)

3. **Version Numbering** (SemVer)
   - `MAJOR.MINOR.PATCH` (e.g., 1.9.0)
   - **MAJOR**: Breaking changes
   - **MINOR**: New features (backward compatible)
   - **PATCH**: Bug fixes only

4. **Commit Messages**
   - Use conventional commits format
   - Format: `type: subject` + optional body
   - Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
   - Example: `feat: add TypeScript migration`

5. **Push**
   - Ensure build passes: `npm run build`
   - Push to main branch: `git push origin master`
   - Tag releases: `git tag -a v1.9.0 -m "Release v1.9.0"`

### Quick Checklist
```bash
# Before commit
npm run build          # Verify build passes
git status             # Review changes

# Update docs
# - Edit CHANGELOG.md
# - Edit README.md (if needed)

# Commit & push
git add -A
git commit -m "type: description"
git push origin master
```

---
*Built with ❤️ by Zky*
