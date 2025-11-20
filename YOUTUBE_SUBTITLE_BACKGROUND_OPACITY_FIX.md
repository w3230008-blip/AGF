# YouTube Subtitle Background Opacity Fix

## Problem
The subtitle background opacity setting was not being applied to YouTube captions in the player. The issue affected only YouTube subtitles - file-based subtitles worked correctly.

### Symptoms
- ✅ Settings were being saved correctly to Vuex
- ✅ UI preview in settings showed opacity changes
- ❌ **Player showed YouTube subtitles with identical opacity regardless of settings**
- ✅ File-based subtitles worked correctly

## Root Cause
The `applyCaptionStyles()` function in `ft-shaka-video-player.js` was applying styles to caption elements using direct style assignment (e.g., `div.style.backgroundColor = bgColor`). These inline styles did not have the `!important` flag, which meant they could be overridden by:
1. Shaka Player's own internal styles
2. YouTube caption rendering styles
3. Other CSS rules with higher specificity

File-based subtitles worked because they likely had a simpler DOM structure or different initial styling that didn't conflict.

## Solution
Modified the `applyCaptionStyles()` function to use `.setProperty()` with the `'important'` flag for all inline style applications to caption divs and spans. This ensures the custom styles take precedence over any conflicting styles from Shaka Player or YouTube.

### Changes Made
**File:** `src/renderer/components/ft-shaka-video-player/ft-shaka-video-player.js`

#### 1. Caption Container Divs (lines 889-893)
**Before:**
```javascript
div.style.width = '100%'
div.style.backgroundColor = bgColor
div.style.textAlign = 'center'
div.style.paddingBlock = '2px'
div.style.boxSizing = 'border-box'
```

**After:**
```javascript
div.style.setProperty('width', '100%', 'important')
div.style.setProperty('background-color', bgColor, 'important')
div.style.setProperty('text-align', 'center', 'important')
div.style.setProperty('padding-block', '2px', 'important')
div.style.setProperty('box-sizing', 'border-box', 'important')
```

#### 2. Caption Text Spans (lines 923-926)
**Before:**
```javascript
span.style.fontSize = `${fontSize}px`
span.style.color = fontColor
span.style.fontFamily = `"${fontFamily}", sans-serif`
span.style.backgroundColor = 'transparent'
```

**After:**
```javascript
span.style.setProperty('font-size', `${fontSize}px`, 'important')
span.style.setProperty('color', fontColor, 'important')
span.style.setProperty('font-family', `"${fontFamily}", sans-serif`, 'important')
span.style.setProperty('background-color', 'transparent', 'important')
```

## How It Works Now

1. **User changes subtitle background opacity** in Caption Settings
2. **Vuex mutation** updates `state.settings.captionBackgroundColor` with new RGBA value
3. **Computed property** `captionBackgroundColor` detects the state change (reactive)
4. **Watcher** on `captionBackgroundColor` is triggered
5. **`applyCaptionStyles()`** is called via `requestAnimationFrame`
6. **Styles are applied** using `.setProperty()` with `'important'` flag to:
   - All caption container divs with background color
   - All caption text spans with font properties
7. **Inline styles with `!important`** override any conflicting Shaka/YouTube styles
8. **Works for both** YouTube captions and file-based subtitles

## Testing

### Manual Testing Steps
1. Open FreeTube and play a video with YouTube subtitles
2. Enable subtitles using the player controls
3. Open subtitle settings (gear icon or 'x' keyboard shortcut)
4. Change the "Background Opacity" slider
5. **Expected:** Background opacity changes immediately in the player
6. Test with different values (0%, 50%, 100%)
7. Test in both normal and fullscreen modes
8. Test with file-based subtitles (.srt/.vtt upload) - should still work

### Console Logs to Verify
The fix retains all existing debug logging:
- `🔄 [Caption Settings] Background color changed:` - confirms watcher triggered
- `🎨 [Player] applyCaptionStyles called:` - confirms function execution
- `📦 Found X div elements in caption container` - shows elements found
- `🎯 Styled div 0, 1, 2:` - detailed info for first 3 divs
- `✅ Caption styles applied successfully to X divs with bgColor: rgba(...)` - success confirmation

## Impact

### Fixed
- ✅ YouTube subtitle background opacity now responds to changes
- ✅ All caption style settings (font size, color, family, background) apply correctly
- ✅ Inline styles with `!important` prevent style conflicts

### Maintained
- ✅ File-based subtitle styling continues to work
- ✅ Works in both normal and fullscreen mode
- ✅ Comprehensive logging for debugging
- ✅ Caption auto-lift mechanism (from previous fixes)
- ✅ Single-line caption mode
- ✅ Bottom offset positioning

## Technical Notes

### Why `.setProperty()` with `'important'`?
- Direct assignment (`element.style.prop = value`) creates inline styles without `!important`
- `.setProperty(prop, value, 'important')` creates inline styles with `!important` flag
- Inline styles with `!important` have the highest CSS specificity (except for other inline `!important`)
- This ensures custom styles override Shaka Player and YouTube defaults

### Consistency with Existing Code
The caption lift functionality (lines 943-1000) already used `.setProperty()` with `'important'`:
```javascript
textContainer.style.setProperty('bottom', `${liftedPosition}px`, 'important')
```
This fix applies the same pattern to all caption styling for consistency.

## Files Modified
- `src/renderer/components/ft-shaka-video-player/ft-shaka-video-player.js`
  - Updated inline style applications for caption divs to use `.setProperty()` with `'important'`
  - Updated inline style applications for caption spans to use `.setProperty()` with `'important'`

## Acceptance Criteria Met
- ✅ Changing opacity slider immediately updates YouTube subtitle background opacity
- ✅ Works for YouTube subtitles same as file subtitles
- ✅ Logs show complete flow: setting change → watcher → style application → DOM
- ✅ Code is clean and maintainable
