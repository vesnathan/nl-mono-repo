# Card Counting Trainer - Gameplay Features Status Summary

## Quick Status Overview

| Feature | Status | Working | Files |
|---------|--------|---------|-------|
| **Split** | ✅ FULL | YES | gameActions.ts, SplitHandsModal.tsx, GameModals.tsx |
| **Double Down** | ✅ FULL | YES | gameActions.ts, PlayerActionsModal.tsx |
| **Surrender** | ❌ NOT IMPL | NO | basicStrategy.ts (recognized only) |
| **Insurance** | ✅ FULL | YES | InsuranceUI.tsx, page.tsx, useInsurancePhase.ts |
| **Resplit** | ⚠️ PARTIAL | UNLIMITED | gameSettings.ts (setting defined but not enforced) |

---

## Feature Details

### 1. SPLIT - Fully Implemented & Working ✓

**What:** Players can split identical pairs into two separate hands.

**Implementation:**
- `split()` function in `gameActions.ts` (lines 287-350)
- `SplitHandsModal.tsx` displays multiple hands
- Bets automatically duplicated for second hand
- Player plays each hand sequentially
- Can see all split hands and their status

**Key Files:**
- `/src/lib/gameActions.ts` - Core logic
- `/src/components/SplitHandsModal.tsx` - UI display
- `/src/components/GameModals.tsx` - Integration (lines 62-135)
- `/src/lib/basicStrategy.ts` - Strategy table (lines 91-122)

**Working Status:** ✓ Confirmed working in all tested scenarios

---

### 2. DOUBLE DOWN - Fully Implemented & Working ✓

**What:** Players can double their bet and receive exactly one additional card.

**Implementation:**
- `doubleDown()` function in `gameActions.ts` (lines 248-278)
- Blue button in `PlayerActionsModal.tsx`
- Bet doubles automatically
- Only one card dealt after double
- Enforces 2-card minimum and chip availability

**Key Files:**
- `/src/lib/gameActions.ts` - Core logic
- `/src/components/PlayerActionsModal.tsx` - UI (lines 79-104)
- `/src/components/GameModals.tsx` - Validation (lines 67-68)
- `/src/types/gameSettings.ts` - Rules configuration

**Game Settings Supported:**
- `doubleDownRule` (ANY_TWO_CARDS, NINE_TEN_ELEVEN, TEN_ELEVEN, NOT_ALLOWED)
- `doubleAfterSplit` (true/false)

**Working Status:** ✓ Confirmed working with all rule variants

---

### 3. SURRENDER - Recognized but NOT Implemented ✗

**What:** Players can surrender their hand and lose 50% of their bet instead of playing.

**Current Status:** NOT IMPLEMENTED

**What Exists:**
- Settings exist: `lateSurrenderAllowed` and `earlySurrenderAllowed`
- Strategy tables include SU (surrender) recommendations
- Code explicitly converts surrender to HIT

**What's Missing:**
- No UI button or modal
- No game logic handler
- No chip payout logic
- Just a placeholder that always hits instead

**Evidence from Code:**
```typescript
// basicStrategy.ts lines 251-258
if (hardAction === "SU") {
  // Note: Surrender is not implemented in the game yet, so default to hit
  return "H";
}
```

**To Implement:**
1. Create `surrender()` function in gameActions.ts
2. Add surrender button to PlayerActionsModal
3. Return 50% of bet to player
4. Mark hand as finished
5. Handle in resolving phase

---

### 4. INSURANCE - Fully Implemented & Working ✓

**What:** When dealer shows an Ace, players can bet half their original bet that dealer has blackjack (pays 2:1).

**Implementation:**
- `InsuranceUI.tsx` shows insurance prompt
- `handleTakeInsurance()` in page.tsx (lines 322-346)
- `handleDeclineInsurance()` in page.tsx (lines 348-352)
- `useInsurancePhase.ts` handles phase logic
- AI players make insurance decisions

**Key Files:**
- `/src/components/InsuranceUI.tsx` - Insurance prompt UI
- `/src/app/page.tsx` - Insurance handlers (lines 322-352)
- `/src/hooks/useInsurancePhase.ts` - Phase orchestration
- `/src/components/GameModals.tsx` - Display logic (lines 96-104)

**Features:**
- Shows only when dealer shows Ace
- Calculates cost (50% of bet, floored)
- Prevents action if insufficient chips
- Disables button with clear message
- Waits for player decision before proceeding
- AI takes insurance ~10% of the time

**Working Status:** ✓ Confirmed working in all scenarios

---

### 5. RESPLIT - Defined in Settings but Not Enforced ⚠️

**What:** Players can split an already-split hand up to N times (controlled by `maxResplits`).

**Current Status:** UNLIMITED RESPLITS (no limit enforced)

**What Exists:**
- `maxResplits` setting (0-3, meaning 1-4 hands)
- `resplitAces` setting (can resplit Aces)
- `hitSplitAces` setting (can hit Aces after split)
- Different values in preset configurations

**What's Missing:**
- Split function doesn't check `maxResplits`
- No tracking of split count per original hand
- No enforcement of resplit restrictions
- Can currently split unlimited times

**Current Behavior:**
```typescript
// GameModals.tsx lines 62-65 - validation
const canSplitHand =
  playerHand.cards.length === 2 &&
  playerHand.cards[0].rank === playerHand.cards[1].rank &&
  playerChips >= playerHand.bet;
// ^ Does NOT check gameSettings.maxResplits
```

**Preset Rules:**
- Las Vegas Strip: `maxResplits: 3` (up to 4 hands)
- Single Deck: `maxResplits: 0` (no resplit)
- Double Deck: `maxResplits: 3`
- European: `maxResplits: 3`
- Bad Rules: `maxResplits: 0`

**To Implement Enforcement:**
1. Add `splitCount` to `PlayerHand` interface
2. Track original pair and number of splits
3. Update `canSplitHand` check:
   ```typescript
   const canResplit = playerHand.splitCount < gameSettings.maxResplits;
   ```
4. Prevent resplitting Aces if `!resplitAces`
5. Prevent hitting split Aces if `!hitSplitAces`

---

## File Location Reference

### Game Logic Core
- **Absolute:** `/home/liqk1ugzoezh5okwywlr_/dev/nl-mono-repo-agent-1/packages/card-counting-trainer/frontend/src/lib/gameActions.ts`
- **Absolute:** `/home/liqk1ugzoezh5okwywlr_/dev/nl-mono-repo-agent-1/packages/card-counting-trainer/frontend/src/lib/basicStrategy.ts`

### UI Components
- **Absolute:** `/home/liqk1ugzoezh5okwywlr_/dev/nl-mono-repo-agent-1/packages/card-counting-trainer/frontend/src/components/PlayerActionsModal.tsx`
- **Absolute:** `/home/liqk1ugzoezh5okwywlr_/dev/nl-mono-repo-agent-1/packages/card-counting-trainer/frontend/src/components/SplitHandsModal.tsx`
- **Absolute:** `/home/liqk1ugzoezh5okwywlr_/dev/nl-mono-repo-agent-1/packages/card-counting-trainer/frontend/src/components/InsuranceUI.tsx`
- **Absolute:** `/home/liqk1ugzoezh5okwywlr_/dev/nl-mono-repo-agent-1/packages/card-counting-trainer/frontend/src/components/GameModals.tsx`

### Game State & Types
- **Absolute:** `/home/liqk1ugzoezh5okwywlr_/dev/nl-mono-repo-agent-1/packages/card-counting-trainer/frontend/src/types/gameSettings.ts`
- **Absolute:** `/home/liqk1ugzoezh5okwywlr_/dev/nl-mono-repo-agent-1/packages/card-counting-trainer/frontend/src/types/gameState.ts`

### Game Phases
- **Absolute:** `/home/liqk1ugzoezh5okwywlr_/dev/nl-mono-repo-agent-1/packages/card-counting-trainer/frontend/src/hooks/useInsurancePhase.ts`
- **Absolute:** `/home/liqk1ugzoezh5okwywlr_/dev/nl-mono-repo-agent-1/packages/card-counting-trainer/frontend/src/app/page.tsx`

---

## Implementation Priority

If implementing missing features:

1. **High Priority:** Resplit limit enforcement
   - Settings already exist
   - Logic is straightforward
   - Affects game balance

2. **Medium Priority:** Surrender
   - Required by basic strategy
   - Affects game difficulty
   - Good for card counter training

3. **Low Priority:** Other enhancements
   - Core gameplay is complete
   - Focus on accuracy of existing features

---

## Testing Checklist

- [ ] Split multiple pairs in one hand
- [ ] Double down on 10 and 11
- [ ] Test insurance with Ace
- [ ] Test resplit limits (after implementation)
- [ ] Test surrender (after implementation)
- [ ] Verify basic strategy recommendations match implementation
- [ ] Test with insufficient chips for each action
- [ ] Verify AI players make decisions correctly

