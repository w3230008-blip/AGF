# YouTubei.js LockupView Patch

## Problem
When loading channel "Videos" tab, YouTubei.js parser throws: "Type mismatch, got LockupView expected VideoAttributeView | SearchRefinementCard | MacroMarkersListItem | GameCard | VideoCard" in HorizontalCardList → ItemSection parsing.

## Root Cause
YouTube API returns LockupView items for channel videos, but youtubei.js parser schema doesn't recognize LockupView as a valid item type in HorizontalCardList context.

## Solution
This patch adds LockupView to the accepted types in HorizontalCardList parser:

### Files Modified
1. `node_modules/youtubei.js/dist/src/parser/classes/HorizontalCardList.js`
   - Added import: `import LockupView from './LockupView.js';`
   - Added LockupView to parser array: `[VideoAttributeView, SearchRefinementCard, MacroMarkersListItem, GameCard, VideoCard, LockupView]`

2. `node_modules/youtubei.js/dist/src/parser/classes/HorizontalCardList.d.ts`
   - Added import: `import LockupView from './LockupView.js';`
   - Added LockupView to type union: `ObservedArray<VideoAttributeView | SearchRefinementCard | MacroMarkersListItem | GameCard | VideoCard | LockupView>`

### Integration
- Added patch script: `_scripts/patchYoutubei.mjs`
- Updated `package.json` to run the patch during postinstall and build processes
- Patch is automatically applied when running `npm install`, `npm run dev`, `npm run build`, etc.

## LockupView Compatibility
The FreeTube codebase already has full support for LockupView items:
- `parseLockupView()` function in `src/renderer/helpers/api/local.js` properly extracts videoId, title, author, etc.
- `parseListItem()` function already handles LockupView case
- Title language restoration will work correctly as LockupView provides the same `videoId` property

## Testing
To verify the fix works:
1. Navigate to any channel page
2. Click on the "Videos" tab
3. Verify no parsing errors in console
4. Verify videos load and display correctly
5. Title language restoration should work on the extracted videos

## Patch Persistence
This patch is automatically applied via npm scripts and will survive package updates. The patch script checks if changes are already applied before making modifications, so running it multiple times is safe.