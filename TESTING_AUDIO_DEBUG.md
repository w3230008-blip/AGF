# Testing Audio Sources Debug Logs

## Purpose

This document explains how to test and observe the audio track debug logs added to FreeTube for analyzing differences between MWEB, WEB, and DASH audio sources.

## Prerequisites

- FreeTube built and running in development mode
- Access to browser console (DevTools)
- Test videos with multi-language audio

## Test Videos

Use these videos for testing:

1. **Author audio track**: https://www.youtube.com/watch?v=ft4iUfy7RwA
   - Should show original author audio

2. **YouTube dubbing**: https://youtu.be/8DygqE7t_hw
   - Should show multiple dubbed languages (13+ languages expected from WEB client)

## How to Test

### Step 1: Open FreeTube in Development Mode

```bash
cd /home/engine/project
npm run dev
```

### Step 2: Open Developer Console

- **Windows/Linux**: Press `Ctrl+Shift+I` or `F12`
- **macOS**: Press `Cmd+Option+I`
- Go to the "Console" tab

### Step 3: Filter Console Output

In the console filter box, type:
```
[Audio-Sources-Debug]
```

This will show only the debug logs related to audio source analysis.

### Step 4: Load a Test Video

Navigate to one of the test videos listed above. The debug logs will automatically appear in the console.

## Expected Output

You should see three main sections of logs:

### 1. WEB Client Analysis

```
[Audio-Sources-Debug] === WEB CLIENT DATA FOR VIDEO ft4iUfy7RwA ===
[Audio-Sources-Debug] WEB: Found 13 audio formats
[Audio-Sources-Debug] WEB Audio Format #1: {
  itag: 140,
  language: "en-US",
  audioQuality: "AUDIO_QUALITY_MEDIUM",
  hasAudio: true,
  hasVideo: false,
  isOriginal: true,
  isDubbed: false,
  urlAvailable: "NO",
  freeTubeUrlAvailable: "NO"
}
[Audio-Sources-Debug] WEB Audio Format #2: {
  itag: 140,
  language: "pl-PL",
  audioQuality: "AUDIO_QUALITY_MEDIUM",
  hasAudio: true,
  hasVideo: false,
  isOriginal: false,
  isDubbed: true,
  urlAvailable: "NO",
  freeTubeUrlAvailable: "NO"
}
... (11 more formats)
```

**Key observations**:
- WEB client shows **all available audio languages** (13+)
- URLs are **NOT available** (`urlAvailable: "NO"`)
- Contains complete metadata about each audio track

### 2. MWEB Client Analysis

```
[Audio-Sources-Debug] === MWEB CLIENT DATA FOR VIDEO ft4iUfy7RwA ===
[Audio-Sources-Debug] MWEB: Found 1 audio formats
[Audio-Sources-Debug] MWEB Audio Format #1: {
  itag: 140,
  language: "en-US",
  audioQuality: "AUDIO_QUALITY_MEDIUM",
  hasAudio: true,
  hasVideo: false,
  isOriginal: true,
  isDubbed: false,
  urlAvailable: "YES",
  freeTubeUrlAvailable: "YES"
}
```

**Key observations**:
- MWEB client shows **only 1 audio language**
- URLs **ARE available** (`urlAvailable: "YES"`)
- This is the format currently used for playback

### 3. DASH Manifest Generation

```
[Audio-Sources-Debug] === DASH MANIFEST GENERATION FOR VIDEO ft4iUfy7RwA ===
[Audio-Sources-Debug] DASH: Found 1 audio-only formats before toDash()
[Audio-Sources-Debug] DASH Audio Format #1: {
  itag: 140,
  language: "en-US",
  audioQuality: "AUDIO_QUALITY_MEDIUM",
  isOriginal: true,
  isDubbed: false,
  urlAvailable: "YES",
  freeTubeUrlAvailable: "YES"
}
[Audio-Sources-Debug] DASH: Generated manifest contains 1 audio AdaptationSets
[Audio-Sources-Debug] DASH AdaptationSet #1: {
  id: "audio_0",
  language: "en-US",
  label: "English (United States) original",
  representationCount: 2
}
[Audio-Sources-Debug] === END DASH MANIFEST ANALYSIS ===
```

**Key observations**:
- DASH manifest contains **only formats with URLs**
- Typically shows **1-2 audio tracks** (limited by MWEB)
- This is what the Shaka Player actually uses

### 4. Source Comparison Summary

```
[Audio-Sources-Debug] Source comparison for video ft4iUfy7RwA: {
  web: {
    languageCount: 13,
    languages: ["en-US", "pl-PL", "de-DE", "fr-FR", "es-ES", ...],
    urlsAvailable: "NO",
    note: "WEB exposes all metadata but URLs are usually missing"
  },
  mweb: {
    languageCount: 1,
    languages: ["en-US"],
    urlsAvailable: "YES",
    note: "MWEB returns playable URLs but typically only one server-selected language"
  },
  dash: {
    languageCount: 1,
    languages: ["en-US"],
    urlsAvailable: "YES",
    manifestUrlPresent: true,
    note: "DASH manifest inherits whatever streaming_data currently holds"
  }
}
```

## What to Look For

### For Video 1 (ft4iUfy7RwA - Author audio)

- **WEB**: Should show 1 language (original author audio)
- **MWEB**: Should show 1 language with URLs
- **DASH**: Should show 1 audio track

### For Video 2 (8DygqE7t_hw - YouTube dubbing)

- **WEB**: Should show 13+ languages (multiple dubbing options)
- **MWEB**: Should show 1 language with URLs (server-selected based on locale)
- **DASH**: Should show 1-2 audio tracks (limited by MWEB)

## Key Findings to Document

1. **Language Count Discrepancy**:
   - WEB client exposes all available languages
   - MWEB and DASH only show one language
   - This explains why users can't switch audio tracks

2. **URL Availability**:
   - WEB client has metadata but no URLs
   - MWEB client has URLs but limited languages
   - DASH inherits from MWEB, so it's also limited

3. **Field Differences**:
   - All sources use `language` field (not `languageCode`)
   - `audioTrack` object contains `display_name` and `id`
   - Type flags: `isOriginal`, `isDubbed`, `isDescriptive`, etc.

## Logging Code Locations

The debug logs are added in these files:

1. **WEB and MWEB analysis**: `src/renderer/helpers/api/local.js`
   - Lines 477-502: WEB client logging
   - Lines 521-557: MWEB client logging
   - Lines 636-666: Source comparison summary

2. **DASH manifest analysis**: `src/renderer/views/Watch/Watch.js`
   - Lines 1511-1563: DASH manifest generation logging

## Additional Debug Markers

Besides `[Audio-Sources-Debug]`, you may also see:

- `[MultiAudio]`: Existing multi-audio debug logs
- `[AudioTrack]`: Audio track utility functions (from audio-track-utils.js)

## Troubleshooting

### No logs appearing

1. Make sure you've filtered the console by `[Audio-Sources-Debug]`
2. Check that you're using a video that loads correctly
3. Try clearing console and reloading the video

### Different results than expected

1. YouTube may change available audio tracks over time
2. Server location/IP may affect MWEB language selection
3. Video age/type may affect available dubbing options

## Next Steps

After analyzing the logs:

1. Document the exact field names and structures from each source
2. Identify which fields are consistent across sources
3. Plan implementation for unified audio track access
4. Design on-demand URL fetching for WEB client languages

## Related Documentation

See `AUDIO_SOURCES_DEBUG_ANALYSIS.md` for detailed analysis of the findings.
