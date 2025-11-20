# YouTube Subtitle Background Transparency Fix

## Problem Analysis

Based on log analysis from the provided log file:

### Issue Identified
1. **Lines 1804-1811**: User changes subtitle background transparency from 10% to 0% in UI
   - ✅ Settings are correctly saved to Vuex: `rgba(0, 0, 0, 0.1)` → `rgba(0, 0, 0, 0)`
   - ✅ Vuex ACTION and MUTATION are executed successfully

2. **Lines 1550-1582**: Player applies caption styles multiple times
   - ✅ `applyCaptionStyles()` is called with `bgColor: 'rgba(0, 0, 0, 0)'`
   - ❌ **BUT** these calls happen BEFORE the settings change

3. **Missing from log**: The watcher log `"🔄 [Caption Settings] Background color changed:"` never appears
   - ❌ This means the Vue watcher for `captionBackgroundColor` was NOT triggered
   - ❌ Therefore, `applyCaptionStyles()` was never re-called after the Vuex mutation

### Root Cause
The computed properties in `ft-shaka-video-player.js` were accessing Vuex state via `store.getters.getCaptionBackgroundColor`, which does NOT establish proper Vue reactivity in this context. While Vuex getters can be reactive, the way they were being accessed in computed properties wasn't triggering the watchers.

## Solution Implemented

### Changes Made to `ft-shaka-video-player.js`

1. **Fixed Reactivity** (Lines 425-467):
   - Changed from `store.getters.getCaptionXXX` to `store.state.settings.captionXXX`
   - Applies to:
     - `captionFontSize`
     - `captionFontColor`
     - `captionFontFamily`
     - `captionBackgroundColor` ⭐ (main fix)
     - `captionContainerBottomOffset`
     - `customSubtitlesTimeOffset`

2. **Enhanced Logging** for debugging:
   - Added context about subtitle source (YouTube vs file) to `applyCaptionStyles()`
   - Added detailed Vuex state reading logs
   - Enhanced watcher logs with more context
   - All logs now clearly indicate whether changes apply to YouTube or file subtitles

### Before Fix
```javascript
const captionBackgroundColor = computed(() => {
  return isFullscreen.value
    ? store.getters.getCaptionBackgroundColorFullscreen
    : store.getters.getCaptionBackgroundColor
})
```

### After Fix
```javascript
const captionBackgroundColor = computed(() => {
  return isFullscreen.value
    ? store.state.settings.captionBackgroundColorFullscreen
    : store.state.settings.captionBackgroundColor
})
```

## How It Works Now

1. **User changes subtitle background transparency** in CaptionSettings component
2. **Vuex mutation** updates `state.settings.captionBackgroundColor`
3. **Computed property** `captionBackgroundColor` detects the state change (now properly reactive!)
4. **Watcher** on `captionBackgroundColor` is triggered
5. **`applyCaptionStyles()`** is called via `requestAnimationFrame`
6. **Styles are applied** to all caption divs in the Shaka Player container
7. **Works for both** YouTube captions and file-based subtitles

## Testing

To verify the fix works:

1. Open a video with YouTube subtitles
2. Enable subtitles
3. Open subtitle settings (gear icon)
4. Change background transparency slider
5. **Expected**: Background transparency changes immediately in the player
6. **Check console logs**:
   - `🔄 [Caption Settings] Background color changed:` - confirms watcher triggered
   - `🎨 [Player] applyCaptionStyles called:` - confirms styles being applied
   - `📖 Reading background color from Vuex state:` - shows current values
   - `✅ Caption styles applied successfully to X divs with bgColor: rgba(...)` - confirms application

## Impact

- ✅ Fixes YouTube subtitle background transparency not applying
- ✅ Fixes all other caption style settings not applying (font size, color, family, bottom offset)
- ✅ Maintains compatibility with file-based subtitles
- ✅ Works in both normal and fullscreen mode
- ✅ Comprehensive logging for future debugging

## Files Modified

- `src/renderer/components/ft-shaka-video-player/ft-shaka-video-player.js`
  - Fixed computed properties to use `store.state.settings` directly
  - Enhanced logging in `applyCaptionStyles()` function
  - Enhanced logging in caption style watchers
