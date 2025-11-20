# Caption Single-Line Filter Fix

## Problem
The caption filter for "1 line" mode was not working properly - the top line of multi-line captions was still showing instead of being hidden.

## Root Causes Identified

### 1. **Incorrect BR Tag Detection**
The previous implementation only checked for BR tags at the direct child level. When captions were structured as `<span>Line 1<br>Line 2</span>`, the BR tag was nested inside the span and wasn't being detected.

### 2. **Original Content Loss**
When the mutation observer triggered after applying the filter, the code would detect that the current HTML (filtered) didn't match the original, and would overwrite the original with the filtered version. This caused the original multi-line content to be lost.

### 3. **Inadequate Multi-Line Detection**
The function tried several strategies but didn't handle all common caption structures used by Shaka Player.

## Solutions Implemented

### 1. **Multi-Strategy Caption Filtering**

The new `getSingleLineRepresentation()` function uses 4 progressive strategies:

**Strategy 1: Top-Level BR Tags**
- Detects BR tags at the top level (not nested)
- Uses fast string splitting for simple cases like "Line 1<br>Line 2"
- Checks tag balance to avoid breaking nested structures

**Strategy 2: Nested BR Tags (DOM Parsing)**
- Parses the HTML as DOM and searches for BR tags anywhere in the tree
- Recursively processes nodes, splitting on BR tags
- Preserves styling and element structure while extracting the last line

**Strategy 3: Multiple Child Elements**
- Handles cases where each line is a separate element
- Example: `<div><span>Line 1</span><span>Line 2</span></div>`

**Strategy 4: Newline Characters**
- Handles plain text with newline characters
- Fallback for simple text-based captions

### 2. **Original Content Preservation**

Fixed the cache update logic to distinguish between:
- **Our own changes**: When current HTML matches our lastApplied filter (don't update original)
- **New caption content**: When current HTML is different from both original and lastApplied (update original)

```javascript
if (cached.lastApplied && currentHtml === cached.lastApplied.value) {
  // This is our filtered version, don't update the original
} else {
  // This is actually new content from Shaka Player
  cached.original = currentHtml
  cached.lastApplied = null
}
```

### 3. **Better Logging**

Added clear, prefixed console logs to help debug issues:
- `[Caption Filter]` prefix for all caption-related logs
- Logs which strategy successfully filtered the content
- Logs when hiding multiple cues
- Logs when new caption content is detected

## How It Works

1. **Mutation Observer** watches the `.shaka-text-container` for any changes
2. When captions change, `applySingleLineCaptionMode()` is called
3. For each `.shaka-text-wrapper` element:
   - Cache the original content if not already cached
   - If there are multiple cue elements, hide all except the last
   - For the last cue element, apply `getSingleLineRepresentation()`
   - The function tries each strategy until one successfully extracts the last line
   - Apply the filtered content while preserving the original

4. **Multi-Cue Scenario**: If Shaka renders multiple `.shaka-text-wrapper` elements (one per line), all except the last are hidden with `display: none`

5. **Single-Cue Scenario**: If Shaka renders one `.shaka-text-wrapper` with multiple lines inside (via BR tags or child elements), the content is filtered to show only the last line

## Testing Scenarios Covered

- ✅ Top-level BR: `Line 1<br>Line 2`
- ✅ Nested BR in span: `<span>Line 1<br>Line 2</span>`
- ✅ Styled nested BR: `<span style="color:red">Line 1<br>Line 2</span>`
- ✅ Mixed structure: `Top line<br><span style="color:yellow">Bottom line</span>`
- ✅ Multiple child elements: `<div><span>Line 1</span><span>Line 2</span></div>`
- ✅ Newline characters: `Line 1\nLine 2`
- ✅ Multiple cue elements (Shaka renders each line separately)
- ✅ Single-line captions (no filtering applied, content unchanged)
- ✅ Real-time caption changes (mutation observer triggers filter on each change)

## Code Changes

- Modified: `src/renderer/components/ft-shaka-video-player/ft-shaka-video-player.js`
  - Enhanced `getSingleLineRepresentation()` function with 4 strategies
  - Fixed cache update logic in `applySingleLineCaptionMode()`
  - Added descriptive console logging for debugging
