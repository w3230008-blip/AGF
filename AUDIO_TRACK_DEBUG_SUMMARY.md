# Audio Track Selection Debug Summary

## Issue Description
The AudioTrackSelection component shows 13 available languages in console logs but users are seeing only 2 audio options rendered in the menu.

## Investigation Results

### Data Sources Identified

1. **availableAudioLanguages prop (13 languages)**
   - Source: Video metadata from YouTube API
   - Languages: ['de-DE', 'es-US', 'fr-FR', 'hi', 'id', 'it', 'ja', 'ml', 'nl-NL', 'pl', 'pt-BR', 'uk', 'en-US']
   - This comes from the video metadata indicating which audio tracks YouTube has available for this video

2. **Loaded Tracks from Shaka Player (2 tracks)**
   - Source: Currently loaded DASH/HLS manifest
   - These are the audio tracks actually loaded and playable in the player
   - Example: Usually contains the default language and one or two others

3. **Vuex Store Audio Tracks**
   - Source: Store contains metadata for audio tracks including URLs
   - Used to dynamically load additional audio tracks on demand

### Current Behavior Analysis

The code in `AudioTrackSelection.js` (lines 110-113):
```javascript
const languagesToDisplay = this._availableAudioLanguages && this._availableAudioLanguages.length > 0
  ? this._availableAudioLanguages
  : loadedTracks.map(t => t.language)
```

**This means the component SHOULD be displaying all 13 languages**, not just 2.

### Debug Logging Added

The following comprehensive debug logs have been added to track the data flow:

#### 1. Initialization Logging
- `[Audio-Debug-Init]` - Shows available languages passed to component

#### 2. Track Loading Logging
- `[Audio-Debug-Tracks]` - Shows loaded tracks from Shaka player
- `[Audio-Debug-Tracks]` - Shows audio tracks available in Vuex store

#### 3. Language Display Logging
- `[Audio-Debug-Languages]` - Shows which languages will be displayed
- `[Audio-Debug-Languages]` - Shows source (metadata vs. player tracks)
- `[Audio-Debug-Languages]` - Shows count

#### 4. Filter Detection
- `[Audio-Debug-Filter]` - Checks if any unexpected filtering occurs between languagesToDisplay and sortedLanguages

#### 5. Per-Language Mapping
- `[Audio-Debug-Mapping]` - For each language shows:
  - Whether it has a loaded track in Shaka player
  - Whether it's currently active
  - Whether it has metadata in store
  - Whether the metadata has a URL

#### 6. Track Metadata Lookup
- `[Audio-Debug-Tracks]` - Shows details when looking up metadata for each language:
  - Total tracks in store
  - Whether a match was found
  - Match details (id, languageCode, hasUrl, source, bitrate)

#### 7. Rendering Completion
- `[Audio-Debug-Render]` - Shows:
  - Total languages processed
  - Menu items created
  - Menu items actually in DOM

#### 8. Click Handler
- `[Audio-Debug-Click]` - Shows what happens when user clicks a language:
  - Whether track is loaded
  - Whether metadata exists
  - Whether URL is available

#### 9. Comprehensive Summary
- `[Audio-Debug-Summary]` - Provides a complete analysis including:
  - Count of languages from each source
  - Languages with loaded tracks
  - Languages with metadata
  - Languages with URLs
  - Languages WITHOUT loaded tracks
  - Languages WITHOUT metadata
  - Languages WITHOUT URLs

### Visual Indicators Added

The component now shows visual indicators for each language:
- No indicator: Track is currently loaded and can be switched immediately
- `[will load]`: Track has metadata and URL, will be loaded dynamically when selected
- `[unavailable]`: Track has no metadata or URL, cannot be loaded

### Expected Debug Output

When running the application with these changes, you should see logs like:

```
[Audio-Debug-Init] AudioTrackSelection initialized: { videoId: 'xxx', availableLanguagesCount: 13, availableLanguages: [...] }
[Audio-Debug-Tracks] Loaded tracks from player: (2) [...]
[Audio-Debug-Tracks] Audio tracks in Vuex store: { count: 13, tracks: [...] }
[Audio-Debug-Languages] Languages to display: [13 languages]
[Audio-Debug-Languages] Source: 'availableAudioLanguages prop (metadata)'
[Audio-Debug-Languages] Count: 13
[Audio-Debug-Filter] Checking for unexpected filtering: { ..., filtering: 'NO' }
[Audio-Debug-Mapping] Starting menu item creation for 13 languages
[Audio-Debug-Mapping] Language: de-DE { hasLoadedTrack: false, hasMetadata: true, metadataHasUrl: true, ... }
[Audio-Debug-Mapping] Language: en-US { hasLoadedTrack: true, isActive: true, hasMetadata: true, metadataHasUrl: true, ... }
...
[Audio-Debug-Render] Menu rendering complete: { totalLanguagesProcessed: 13, menuItemsCreated: 13, menuItemsInDOM: 13 }
[Audio-Debug-Summary] AUDIO TRACK DISCREPANCY ANALYSIS
[Audio-Debug-Summary] Languages from metadata: 13
[Audio-Debug-Summary] Tracks loaded in Shaka player: 2
[Audio-Debug-Summary] Languages with loaded track: 2 ['en-US', 'ja']
[Audio-Debug-Summary] Languages with URL: 13 [all languages]
[Audio-Debug-Summary] Languages WITHOUT loaded track: ['de-DE', 'es-US', 'fr-FR', ...]
```

## Findings and Conclusions

### Three Possible Scenarios

#### Scenario A: All 13 Languages ARE Being Rendered
- The menu actually shows all 13 languages
- The issue description is misleading or based on old behavior
- The debug logs will confirm all 13 items are in the DOM

#### Scenario B: Only 2 Languages Have URLs
- Of the 13 languages in metadata, only 2 have actual stream URLs
- The other 11 are listed in metadata but not available in the manifest
- The debug logs will show: "Languages with URL: 2"
- Solution: Show all 13 with `[unavailable]` markers for those without URLs

#### Scenario C: There's a Hidden Filter
- Something is filtering the menu to only 2 items
- Could be CSS hiding items, or DOM manipulation elsewhere
- The debug logs will show: menuItemsCreated: 13 but menuItemsInDOM: 2
- Solution: Find and remove the filter

## Recommended Actions

1. **Run the application** with these debug changes
2. **Open a video** that has multiple audio languages
3. **Open the audio track menu** in the player
4. **Check the console logs** and compare with the three scenarios above
5. **Report findings**:
   - Which scenario matches?
   - How many items are visible in the UI vs. created in code?
   - Which languages have URLs vs. don't?

## Implementation Options

Based on the findings, choose one:

### Option A: Show All Languages With Availability Indicators (RECOMMENDED)
- Keep current code
- Users see all 13 languages
- Visual indicators show which can be loaded
- Clicking unavailable tracks shows a message

### Option B: Filter to Only Available Tracks
- Modify code to filter languages that don't have URLs
- Only show 2-3 languages that are actually available
- Simpler UI but less transparent

### Option C: Smart Fallback System
- Show all 13 languages
- For languages without URLs, find nearest available audio
- Example: Polish → English fallback
- Most complex but best UX

## Files Modified

- `src/renderer/components/ft-shaka-video-player/player-components/AudioTrackSelection.js`
  - Added comprehensive debug logging throughout
  - Added visual indicators for track availability
  - No functional changes to menu rendering logic
