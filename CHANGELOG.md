# Changelog

## [1.11.0] - 2026-04-15
### Added
- **Code Splitting**: Lazy loading for heavy components (SkillTree, RaidBoss)
  - Separate chunks: SkillTree (~4.5 KB), RaidBoss (~7.6 KB)
  - Loading component with spinner for async loading states
- **Performance Optimizations**: React.memo for pure components
  - QuestStats, QuestTabs, QuestItem, BossQuest wrapped with memo
  - Prevents unnecessary re-renders during parent updates

### Changed
- **Bundle Size Optimization**: Main bundle reduced through code splitting
- **Loading States**: Added visual feedback when loading lazy components

### Technical
- Code splitting verified: separate chunks for lazy components
- All 8 tests still passing

## [1.10.0] - 2026-04-15
### Added
- **Error Boundary**: Global error handling component with custom fallback UI
- **Test Infrastructure**: Vitest + React Testing Library setup
  - Unit tests for ErrorBoundary and Quests components
  - Test scripts: `npm test`, `npm run test:run`, `npm run test:coverage`
- **Component Documentation**: Updated README with project structure and testing guide

### Changed
- **Quests Component Refactoring**: Split 782-line monolith into 7 focused components
  - `Quests/index.tsx` - Main container (orchestrates sub-components)
  - `QuestStats.tsx` - Profile/stats display
  - `QuestForm.tsx` - Add/edit quest form
  - `QuestTabs.tsx` - Tab navigation
  - `QuestList.tsx` - Quest list rendering
  - `QuestItem.tsx` - Normal quest item with drag-drop
  - `BossQuest.tsx` - Boss battle UI with HP bar and subtasks
- **File Organization**: Moved QuickDateSelector into Quests folder

### Technical
- Reduced Quests.tsx from 782 lines → 140 lines (82% reduction)
- Improved code maintainability and testability
- All 8 tests passing

## [1.9.0] - 2026-04-15
### Changed
- **TypeScript Migration**: Full codebase migration from JavaScript (.jsx/.js) to TypeScript (.tsx/.ts)
- **Type Safety**: Added comprehensive type definitions for Profile, Inventory, Raid, Stats, and all components
- **Build System**: Updated Vite configuration to use TypeScript (vite.config.ts)
- **Configuration**: Added tsconfig.json and tsconfig.node.json with strict mode enabled

### Added
- **Type Definitions**: New `src/types/index.ts` with shared interfaces
- **Type Annotations**: All components now have proper prop types and state types
- **Chrome API Types**: Added @types/chrome for extension API type safety

### Technical
- Converted 12 files: App, main, 10 components, 1 utility
- Build verified: production build succeeds without errors
- No breaking changes to functionality

## [1.8.1] - 2026-01-30
### Added
- **Quick Date Selector**: New UI for setting quest deadlines with presets (Today Eve, Tomorrow Night, Next Week).

### Changed
- **Quests UI**: Replaced standard date input with the new custom selector for better UX.
- **Quest Date Logic**: Changed default "Tomorrow Morning" preset to "Today Eve" based on user feedback.

## [1.8.0] - 2026-01-29
### Added
- **Daily Login System**: Added streak tracking and daily rewards (Gold + XP) with visual notifications.
- **Epic Raids**: Introduced "The Golden Dragon" raid boss, summoned via the "Mystery Key".
- **Shop Enhancements**:
  - Added consumable items: Mystery Key, Potion of Focus, Time Scroll.
  - Implemented stackable inventory logic for consumables.
  - Added "Equipped" vs "Equip" status indicators for cosmetics.
- **Raid Boss Mechanics**: Added sub-task system to damage raid bosses.

### Changed
- **Shop UI**: Improved visual feedback for item states (Active, Owned, Buy).
- **Level Up Logic**: Refactored XP calculation to support multi-level jumps and prevent crashes.
- **Sound Effects**: Fixed naming inconsistencies and added new sound triggers.

### Fixed
- **Crash**: Resolved `currentTheme is not defined` error in Shop component.
- **Crash**: Fixed infinite loop issue during massive XP gains.
