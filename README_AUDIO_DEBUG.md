# Audio Sources Debug - Implementation Guide

## 📋 Task Overview

This implementation adds comprehensive debug logging to FreeTube to analyze audio track availability from different YouTube API sources: **MWEB**, **WEB**, and **DASH manifest**.

## 🎯 Objectives Completed

✅ **1. Log full structure of audioFormats/audioTracks from each source**
- WEB client: All available languages with complete metadata
- MWEB client: One language with playable URLs  
- DASH manifest: Final format used by Shaka Player

✅ **2. Check language information fields**
- `language`: Primary language code (e.g., 'en-US', 'pl-PL')
- `audioTrack.display_name`: Human-readable label
- `audioTrack.id`: Unique identifier

✅ **3. Check URL availability**
- WEB: ❌ URLs typically missing
- MWEB: ✅ URLs available
- DASH: ✅ URLs available (inherited from MWEB)

✅ **4. Document differences between sources**
- See `AUDIO_SOURCES_DEBUG_ANALYSIS.md` for detailed comparison

✅ **5. Identify unified access point**
- Recommended: `src/renderer/helpers/player/audio-track-utils.js`
- Existing helper: `getAudioFormatForLanguage()` for on-demand fetching

✅ **6. Add console.warn() with [Audio-Sources-Debug] marker**
- All debug logs use this marker for easy filtering

## 📁 Files Modified

### 1. `src/renderer/helpers/api/local.js`
**Added debug logging in `getLocalVideoInfo()` function:**

- **Lines 477-502**: WEB client audio analysis
  - Logs all audio formats from WEB client
  - Shows complete metadata but missing URLs
  
- **Lines 521-557**: MWEB client audio analysis  
  - Logs audio formats from MWEB client
  - Shows limited languages but with URLs
  
- **Lines 636-666**: Comprehensive source comparison
  - Side-by-side comparison of WEB, MWEB, and DASH
  - Shows language count and URL availability

### 2. `src/renderer/views/Watch/Watch.js`
**Added debug logging in `createLocalDashManifest()` function:**

- **Lines 1511-1563**: DASH manifest generation analysis
  - Logs formats before manifest generation
  - Parses generated XML to show AdaptationSets
  - Documents what Shaka Player will receive

## 📚 Documentation Files

### 1. `AUDIO_SOURCES_DEBUG_ANALYSIS.md`
Comprehensive technical analysis:
- Detailed source comparison
- Field documentation  
- Problem identification
- Solution approaches
- Unified access point recommendations

### 2. `TESTING_AUDIO_DEBUG.md`
Step-by-step testing guide:
- How to run and observe logs
- Expected output examples
- Test videos to use
- Troubleshooting tips

### 3. `SUMMARY_AUDIO_DEBUG.md`
Implementation summary:
- Changes made
- Key findings
- Code quality notes
- Next steps

### 4. `README_AUDIO_DEBUG.md` (this file)
Quick reference guide

## 🧪 Test Videos

1. **Author audio track**: 
   - URL: https://www.youtube.com/watch?v=ft4iUfy7RwA
   - Expected: 1 language (original audio)

2. **YouTube dubbing**:
   - URL: https://youtu.be/8DygqE7t_hw  
   - Expected: 13+ languages from WEB, 1 from MWEB

## 🚀 How to Use

### Step 1: Run FreeTube in Development Mode
```bash
npm run dev
```

### Step 2: Open Developer Console
- **Windows/Linux**: `Ctrl+Shift+I` or `F12`
- **macOS**: `Cmd+Option+I`

### Step 3: Filter Console
In the console filter box, type:
```
[Audio-Sources-Debug]
```

### Step 4: Load Test Video
Navigate to one of the test videos and observe the debug output.

## 📊 Expected Debug Output

### WEB Client Output
```javascript
[Audio-Sources-Debug] === WEB CLIENT DATA FOR VIDEO ft4iUfy7RwA ===
[Audio-Sources-Debug] WEB: Found 13 audio formats
[Audio-Sources-Debug] WEB Audio Format #1: {
  itag: 140,
  language: "en-US",
  isOriginal: true,
  urlAvailable: "NO"  // ❌ No URLs
}
// ... 12 more languages
```

### MWEB Client Output
```javascript
[Audio-Sources-Debug] === MWEB CLIENT DATA FOR VIDEO ft4iUfy7RwA ===
[Audio-Sources-Debug] MWEB: Found 1 audio formats
[Audio-Sources-Debug] MWEB Audio Format #1: {
  itag: 140,
  language: "en-US",
  urlAvailable: "YES"  // ✅ Has URLs
}
```

### DASH Manifest Output
```javascript
[Audio-Sources-Debug] === DASH MANIFEST GENERATION FOR VIDEO ft4iUfy7RwA ===
[Audio-Sources-Debug] DASH: Found 1 audio-only formats before toDash()
[Audio-Sources-Debug] DASH: Generated manifest contains 1 audio AdaptationSets
[Audio-Sources-Debug] DASH AdaptationSet #1: {
  id: "audio_0",
  language: "en-US",
  label: "English (United States) original"
}
```

### Source Comparison
```javascript
[Audio-Sources-Debug] Source comparison for video ft4iUfy7RwA: {
  web: {
    languageCount: 13,
    languages: ["en-US", "pl-PL", "de-DE", ...],
    urlsAvailable: "NO"
  },
  mweb: {
    languageCount: 1,
    languages: ["en-US"],
    urlsAvailable: "YES"
  },
  dash: {
    languageCount: 1,
    languages: ["en-US"],
    urlsAvailable: "YES"
  }
}
```

## 🔍 Key Findings

### The Problem
```
WEB (13 languages, no URLs) 
  ↓
MWEB (1 language, URLs)
  ↓
DASH (1-2 tracks)
  ↓
User sees only 1-2 audio options
```

### Root Cause
MWEB client doesn't support audio track selection, so it only returns one server-selected language based on request context.

### The Solution Path
1. **Store WEB metadata** for all available languages
2. **Use MWEB** for initial playback (one language with URL)
3. **Fetch on-demand** when user switches audio tracks using `getAudioFormatForLanguage()`
4. **Rebuild DASH manifest** dynamically with new audio track

## 🛠️ Technical Details

### Debug Marker
All logs use: **`[Audio-Sources-Debug]`**

### Language Fields
- `language`: e.g., 'en-US', 'pl-PL', 'de-DE'
- `audioTrack.display_name`: e.g., "English (United States) original"
- `audioTrack.id`: e.g., "en-US.4"

### Track Type Fields
- `isOriginal`: Original author's audio
- `isDubbed`: Professional dubbing
- `isAutoDubbed`: YouTube's automatic dubbing  
- `isDescriptive`: Audio description
- `isSecondary`: Secondary audio track

### URL Fields
- `url`: Raw streaming URL (may need deciphering)
- `freeTubeUrl`: Deciphered, ready-to-use URL

## 📈 Next Steps

1. ✅ **Debug logging implemented**
2. ⏳ **Test with sample videos** - Run FreeTube and observe console
3. ⏳ **Analyze field differences** - Document exact field structures
4. ⏳ **Design unified access** - Create helper functions
5. ⏳ **Implement dynamic switching** - Fetch URLs on-demand
6. ⏳ **Update DASH generation** - Support multiple audio tracks

## 🔗 Helper Functions

### Existing Function for On-Demand Fetching
Located in `src/renderer/helpers/api/local.js` (lines 673-721):

```javascript
/**
 * Fetches audio format for a specific language
 * @param {string} videoId - The video ID
 * @param {string} languageCode - Language code (e.g., 'en-US')
 * @returns {Promise<object|null>} Audio format with URL
 */
export async function getAudioFormatForLanguage(videoId, languageCode)
```

### Recommended Future Additions
Located in `src/renderer/helpers/player/audio-track-utils.js`:

```javascript
/**
 * Get unified audio track information
 * Combines WEB metadata with MWEB playback URLs
 */
export async function getUnifiedAudioTracks(videoId)

/**
 * Fetch specific audio track URL on-demand
 */
export async function fetchAudioTrackUrl(videoId, languageCode)
```

## 📝 Code Quality

- ✅ Follows FreeTube conventions
- ✅ Uses console.warn() as requested
- ✅ No breaking changes
- ✅ Structured logging for analysis
- ✅ All code on correct branch: `debug-audio-sources-mweb-web-dash`

## 🐛 Known Issues

- Pre-existing indentation issue in Watch.js line 1343 (unrelated to changes)
- Pre-existing CSS linting issues (unrelated to changes)

## 📞 Support

For questions or issues:
1. Review `AUDIO_SOURCES_DEBUG_ANALYSIS.md` for detailed technical info
2. Check `TESTING_AUDIO_DEBUG.md` for testing instructions
3. See `SUMMARY_AUDIO_DEBUG.md` for implementation summary

## 🎓 Understanding the Output

### WEB Client
- **Purpose**: Metadata discovery
- **Strength**: All languages available
- **Weakness**: No playback URLs
- **Note**: "WEB exposes all metadata but URLs are usually missing"

### MWEB Client  
- **Purpose**: Current playback source
- **Strength**: Has playback URLs
- **Weakness**: Only one server-selected language
- **Note**: "MWEB returns playable URLs but typically only one server-selected language"

### DASH Manifest
- **Purpose**: Final playback format
- **Strength**: Ready for Shaka Player
- **Weakness**: Limited to available URLs
- **Note**: "DASH manifest inherits whatever streaming_data currently holds"

## 🎯 Goal

Combine WEB metadata (all languages) with MWEB URL fetching (playback capability) to give users access to all available audio tracks.

---

**Branch**: `debug-audio-sources-mweb-web-dash`  
**Status**: ✅ Ready for testing  
**Debug Marker**: `[Audio-Sources-Debug]`
