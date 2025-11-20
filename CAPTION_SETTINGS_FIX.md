# Caption Settings Navigation Fix

## Problem
Clicking "Captions" in the player menu was not navigating to the caption settings section. Instead, users would see the general settings section.

## Root Causes Identified

### 1. Missing Route Query Watcher (PRIMARY ISSUE)
The Settings component only checked the `section` query parameter during the initial mount. If a user was already on the Settings page and clicked the "Captions" button, the component would not respond to the query parameter change.

**Impact**: When navigating from `/settings` to `/settings?section=caption-settings`, the Settings component would not scroll to the caption settings section.

### 2. Router.push Override Bug (SECONDARY ISSUE)
The custom `router.push` override in `src/renderer/router/index.js` did not properly handle location objects that used the `name` property instead of `path`. When the location object had `{ name: 'settings', query: { section: 'caption-settings' } }`, the code would try to access `location.path` which was undefined.

**Impact**: The navigation comparison logic could fail, potentially preventing navigation in some edge cases.

## Solutions Implemented

### 1. Added Route Query Watcher to Settings Component
**File**: `src/renderer/views/Settings/Settings.js`

Added a Vue watcher that monitors changes to `$route.query.section`:

```javascript
watch: {
  '$route.query.section': function(newSection) {
    if (newSection && this.unlocked) {
      // Verify the section exists before navigating to it
      const sectionExists = this.settingsSectionComponents.some(
        section => section.type === newSection
      )
      if (sectionExists) {
        nextTick(() => {
          this.navigateToSection(newSection)
        })
      }
    }
  }
}
```

This ensures that whenever the `section` query parameter changes (whether the component is being mounted fresh or already mounted), it will navigate to the requested section.

### 2. Fixed Router.push Override
**File**: `src/renderer/router/index.js`

Modified the router.push override to properly handle location objects with the `name` property:

```javascript
router.push = (location) => {
  // ... existing code ...
  
  if (typeof location === 'string') {
    // ... existing string handling ...
  } else {
    // Handle location objects with 'name' property
    if (location.name && !location.path) {
      // If using route name, we need to resolve the path first
      const resolved = router.resolve(location)
      newPath = resolved.route.path
      newQueryUSP = new URLSearchParams(resolved.route.query)
    } else {
      newPath = location.path
      newQueryUSP = new URLSearchParams(location.query)
    }
  }
  
  // ... rest of the function ...
}
```

This ensures that navigation using route names (as used by CaptionSettingsButton) works correctly.

## Navigation Flow (Fixed)

1. User clicks "Captions" button in video player
2. `CaptionSettingsButton.openCaptionSettings_()` calls:
   ```javascript
   router.push({
     name: 'settings',
     query: { section: 'caption-settings' }
   })
   ```
3. Router navigates to `/settings?section=caption-settings`
4. Settings component responds:
   - **If freshly mounted**: `navigateToInitialSection()` reads the query parameter and scrolls to caption settings
   - **If already mounted**: The route query watcher fires and calls `navigateToSection('caption-settings')`
5. The caption settings section is scrolled into view and focused

## Testing Recommendations

1. **Fresh navigation**: Navigate from any page (e.g., /watch) → Click Captions → Should go to caption settings
2. **Already on settings**: Be on Settings page → Click Captions from any video page → Should scroll to caption settings
3. **Multiple clicks**: Click Captions, then Player Settings, then Captions again → Should navigate correctly each time
4. **Mobile view**: Test on mobile/narrow viewport where settings use tabs instead of scrolling
5. **With password**: Test with settings password enabled to ensure unlocked state is respected

## Files Modified

1. `src/renderer/router/index.js` - Fixed router.push override
2. `src/renderer/views/Settings/Settings.js` - Added route query watcher
3. `src/renderer/components/ft-shaka-video-player/player-components/CaptionSettingsButton.js` - No functional changes (original implementation was correct)
4. `src/renderer/components/CaptionSettings/CaptionSettings.vue` - No functional changes (component was correct)

## No Changes Needed

- The CaptionSettings component itself was already properly implemented
- The component registration in Settings.js was correct (`'caption-settings': CaptionSettings`)
- The section configuration in settingsComponentsData was correct
- The `navigateToSection()` function logic was correct

The issue was purely about missing reactivity to route query changes, not about incorrect component setup or registration.
