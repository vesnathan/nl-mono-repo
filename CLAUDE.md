# Card Counting Trainer - Current Status

## Important Notes
- **DO NOT start dev servers** - They are already running in the background
- **NEVER BUILD** - DO NOT run `npm run build`, `yarn build`, or any build commands. Builds take too long and background builds are already running.
- **Type checking**: ALWAYS use `yarn workspace cctfrontend tsc --noEmit` to check for TypeScript errors. This is fast and sufficient.
- **Testing changes**: The dev server is already running, just check with tsc and test in browser

## Fixed Issues

### 1. Syntax Error in Dealer Turn useEffect (FIXED)
- **Location**: [page.tsx:1865](packages/card-counting-trainer/frontend/src/app/page.tsx#L1865)
- **Problem**: Extra closing brace after `registerTimeout` callback
- **Fix**: Removed the extra `}` at line 1865
- **Status**: ✅ Fixed - build now compiles successfully

### 2. TypeScript Error in useBlackjackGame.ts (FIXED)
- **Location**: [useBlackjackGame.ts:123](packages/card-counting-trainer/frontend/src/hooks/useBlackjackGame.ts#L123)
- **Error**: `Argument of type 'boolean' is not assignable to parameter of type 'GameSettings'`
- **Problem**: `getBasicStrategyAction` expects `GameSettings` as third parameter
- **Fix**:
  - Added import for `DEFAULT_GAME_SETTINGS`
  - Updated function call: `getBasicStrategyAction(hand.cards, dealerUpCard, DEFAULT_GAME_SETTINGS, canSplitHand, canDoubleHand)`
- **Status**: ✅ Fixed

### 3. Card Animation Position Mismatch (FIXED)
- **Problem**: Flying card animations go to different positions than where the actual cards render
- **Root Cause**: Flying cards used simple offsets while rendered cards use grid layout (3 cards per row)
- **Fix**: Updated `getCardPosition()` function to calculate exact grid positions:
  - **AI/Player cards**: Cards in 230px centered container, positioned at `col * 74px`, `row * 102px`
  - **Dealer cards**: Cards in 370px centered container at top, positioned at `idx * 74px`
  - Animation now targets exact final positions accounting for container centering
- **Locations Fixed**:
  - [page.tsx:329-340](packages/card-counting-trainer/frontend/src/app/page.tsx#L329-L340) - Dealer positions
  - [page.tsx:345-360](packages/card-counting-trainer/frontend/src/app/page.tsx#L345-L360) - Player positions
  - [page.tsx:363-377](packages/card-counting-trainer/frontend/src/app/page.tsx#L363-L377) - AI player positions
- **Status**: ✅ Fixed - cards now animate to their exact final positions

## Recent Changes

### Training Modes Removed (Latest)
- **What**: Removed all training mode functionality (Practice, Test, Timed Challenge)
- **Why**: User requested to keep only the default mode (always showing running count)
- **Changed files**:
  - [gameSettings.ts](packages/card-counting-trainer/frontend/src/types/gameSettings.ts) - Removed TrainingMode enum and related fields
  - [StatsBar.tsx](packages/card-counting-trainer/frontend/src/components/StatsBar.tsx) - Simplified to always show COUNT, removed timeRemaining
  - [BlackjackGameUI.tsx](packages/card-counting-trainer/frontend/src/components/BlackjackGameUI.tsx) - Removed timeRemaining prop
  - [GameSettingsModal.tsx](packages/card-counting-trainer/frontend/src/components/GameSettingsModal.tsx) - Removed training mode selector UI
  - [page.tsx](packages/card-counting-trainer/frontend/src/app/page.tsx) - Removed useTimedChallenge hook and timeRemaining state
- **Note**: useTimedChallenge.ts still exists but is unused

### Bet Minimum Display Added
- **What**: Added "$25 MINIMUM" text to the table rules display
- **Location**: [TableRules.tsx](packages/card-counting-trainer/frontend/src/components/TableRules.tsx)
- **Implementation**: Added third curved arc below the existing table rules text

### AI Player Reactions to Dealer Blackjack (Latest)
- **What**: AI players now react when dealer peeks and reveals blackjack
- **Problem**: When dealer peeked for blackjack and won, AI players remained silent
- **Fix**: Added `showEndOfHandReactions()` call when dealer reveals blackjack after peeking
- **Changes**:
  - [useGameActions.ts](packages/card-counting-trainer/frontend/src/hooks/useGameActions.ts#L372-L374) - Call showEndOfHandReactions() with 500ms delay
  - [page.tsx](packages/card-counting-trainer/frontend/src/app/page.tsx#L199) - Pass showEndOfHandReactions to useGameActions
- **Result**: AI players now show appropriate loss reactions when dealer gets blackjack

## Recent Commits

- `ae162a6` - Add processing guards, fix table positions, update card sizes
- `4710ca1` - Fix: use fixed positions for cards to prevent movement
- `ac19b0f` - Fix: prevent duplicate cards by avoiding mutation in state updates
- `e3337c0` - Debug: add comprehensive logging to card dealing
- `9cb4d61` - Fix: correct card dealing order to right-to-left
- `60b2a68` - Fix: resolve card dealing bug - each player now gets unique cards

## Constants

Animation and layout constants are now centralized in:
- [animations.ts](packages/card-counting-trainer/frontend/src/constants/animations.ts)
  - `CARD_ANIMATION_DURATION = 1500ms` (slowed for testing)
  - `CARD_WIDTH = 70px`
  - `CARD_HEIGHT = 98px`
  - `CARD_SPACING = 15px`
  - `TABLE_POSITIONS` - 8 seat positions as `[left%, top%]` arrays

## Implementation Details

### Card Position Calculations
The `getCardPosition()` function now correctly calculates positions for flying card animations:

**AI and Player Cards:**
- Cards render in a 230px wide container, centered on the player position
- Grid layout: 3 cards per row
- Column positions: `col * 74px` (0px, 74px, 148px)
- Row positions: `row * 102px` (0px, 102px, ...)
- Container offset: `-115px` to account for centering (230px / 2)
- Vertical: `204px - row * 102px` below player position (150px avatar + 54px gap - row offset)

**Dealer Cards:**
- Cards render in a 370px wide container, centered at top of screen
- Linear layout (no rows)
- Positions: `idx * 74px` (0px, 74px, 148px, ...)
- Container offset: `-185px` to account for centering (370px / 2)
- Vertical: `3% + 162px + 4px` (dealer section top + avatar height + gap)
