# Changelog

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
