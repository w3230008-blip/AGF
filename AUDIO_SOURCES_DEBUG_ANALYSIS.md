# Audio Sources Debug Analysis

## Overview

This document provides a comprehensive analysis of audio track availability from different YouTube API sources: MWEB, WEB, and DASH manifest generation.

## Debug Markers

Debug logs are tagged with `[Audio-Sources-Debug]` and can be found in:
- `src/renderer/helpers/api/local.js` - Lines 477-556 (WEB and MWEB client analysis)
- `src/renderer/views/Watch/Watch.js` - Lines 1511-1563 (DASH manifest generation analysis)

## Test Videos

1. **Author audio track**: https://www.youtube.com/watch?v=ft4iUfy7RwA
2. **YouTube dubbing**: https://youtu.be/8DygqE7t_hw

## Data Sources Comparison

### 1. WEB Client (youtubei.js with ClientType.WEB)

**Location**: `src/renderer/helpers/api/local.js` - `getLocalVideoInfo()` function

**Characteristics**:
- ✅ **Contains ALL audio language metadata** (13+ languages for dubbed videos)
- ❌ **NO direct playback URLs** (URLs are missing or require additional deciphering)
- ✅ **Complete language information**

**Key Fields Available**:
```javascript
{
  itag: number,                    // Format identifier
  language: string,                // Language code (e.g., 'en-US', 'pl-PL')
  audioQuality: string,            // Quality indicator
  hasAudio: boolean,
  hasVideo: boolean,
  isOriginal: boolean,             // Is this the original audio track?
  isDubbed: boolean,               // Is this a dubbed track?
  isDescriptive: boolean,          // Is this descriptive audio?
  isSecondary: boolean,            // Is this secondary audio?
  isAutoDubbed: boolean,           // Is this auto-dubbed?
  audioTrack: {                    // Audio track metadata
    audio_is_default: boolean,
    id: string,
    display_name: string
  },
  mimeType: string,
  bitrate: number,
  url: string | undefined,         // ❌ Usually MISSING
  freeTubeUrl: string | undefined  // ❌ Usually MISSING
}
```

**Purpose**: 
- Metadata discovery - used to show users what audio languages are available
- UI display of available audio tracks

### 2. MWEB Client (Mobile Web)

**Location**: `src/renderer/helpers/api/local.js` - `getLocalVideoInfo()` function (fallback)

**Characteristics**:
- ✅ **Contains playable URLs** ready to use
- ❌ **Only ONE audio language** (selected by server based on request language/context)
- ✅ **Direct playback capability**

**Key Fields Available**:
```javascript
{
  itag: number,
  language: string,               // Usually ONE language only
  audioQuality: string,
  hasAudio: boolean,
  hasVideo: boolean,
  isOriginal: boolean,
  isDubbed: boolean,
  isDescriptive: boolean,
  isSecondary: boolean,
  isAutoDubbed: boolean,
  audioTrack: object,
  mimeType: string,
  bitrate: number,
  url: string,                    // ✅ AVAILABLE
  freeTubeUrl: string             // ✅ AVAILABLE (deciphered URL)
}
```

**Purpose**:
- Actual playback - provides working streaming URLs
- Currently used as the primary playback source

### 3. DASH Manifest (Generated from streaming data)

**Location**: `src/renderer/views/Watch/Watch.js` - `createLocalDashManifest()` function

**Characteristics**:
- Based on the streaming data available after WEB/MWEB selection
- Contains audio tracks that have **both metadata AND URLs**
- Generated XML manifest that Shaka Player can parse

**Fields in Manifest**:
```xml
<AdaptationSet 
  id="audio_track_id"
  lang="language-code"
  mimeType="audio/mp4">
  <Label>Language Name (original/dubbed)</Label>
  <Representation 
    id="itag" 
    bandwidth="bitrate">
    <!-- Segment information with URLs -->
  </Representation>
</AdaptationSet>
```

**Purpose**:
- Final playback format consumed by Shaka Player
- Contains only tracks with valid URLs

## Current Implementation Flow

1. **WEB client** fetches video info → Gets ALL language metadata but NO URLs
2. **MWEB client** fetches same video → Gets ONE language with URLs
3. **DASH manifest** is generated from MWEB data → Contains only 1-2 audio tracks
4. **Shaka Player** plays the DASH manifest → User sees limited audio options

## The Problem

```
WEB (13 languages, no URLs) → MWEB (1 language, URLs) → DASH (1-2 tracks) → User sees only 1-2 options
```

**Root cause**: MWEB doesn't support audio track selection, so it only returns one audio language.

## Solution Approaches

### Option 1: Store WEB metadata + Fetch URLs on-demand
- Keep WEB metadata for all languages
- When user switches audio track, fetch that specific language from MWEB
- Implemented in: `getAudioFormatForLanguage()` function (lines 673-721 in local.js)

### Option 2: Use DASH manifest URL from YouTube directly
- Use `streaming_data.dash_manifest_url` from YouTube
- Let YouTube handle multi-audio tracks
- Cons: May not work with all videos, requires valid po_token

### Option 3: Hybrid approach (Current development)
- Store available languages from WEB client
- Use MWEB for initial playback
- Fetch additional languages when user selects them
- Rebuild DASH manifest dynamically

## Unified Access Point

The most logical place to unify audio track access would be:

**`src/renderer/helpers/player/audio-track-utils.js`**

This file already contains utilities for:
- Language code normalization
- Language name display
- Audio track preference storage
- Track sorting and selection

**Proposed addition**:
```javascript
/**
 * Get unified audio track information for a video
 * Combines WEB metadata with MWEB playback URLs
 */
export async function getUnifiedAudioTracks(videoId) {
  // 1. Get WEB metadata (all languages)
  const webInfo = await getVideoInfo(videoId, { client: 'WEB' })
  
  // 2. Get MWEB URLs (current language)
  const mwebInfo = await getVideoInfo(videoId, { client: 'MWEB' })
  
  // 3. Merge and return unified structure
  return mergeAudioTrackData(webInfo, mwebInfo)
}

/**
 * Fetch specific audio track URL on-demand
 */
export async function fetchAudioTrackUrl(videoId, languageCode) {
  // Use existing getAudioFormatForLanguage() function
  return await getAudioFormatForLanguage(videoId, languageCode)
}
```

## Debug Log Output Format

When you run FreeTube with these debug logs, you'll see:

```
[Audio-Sources-Debug] === WEB CLIENT DATA FOR VIDEO ft4iUfy7RwA ===
[Audio-Sources-Debug] WEB: Found 13 audio formats
[Audio-Sources-Debug] WEB Audio Format #1: { itag: 140, language: 'en-US', ... urlAvailable: 'NO' }
[Audio-Sources-Debug] WEB Audio Format #2: { itag: 140, language: 'pl-PL', ... urlAvailable: 'NO' }
...

[Audio-Sources-Debug] === MWEB CLIENT DATA FOR VIDEO ft4iUfy7RwA ===
[Audio-Sources-Debug] MWEB: Found 1 audio formats
[Audio-Sources-Debug] MWEB Audio Format #1: { itag: 140, language: 'en-US', ... urlAvailable: 'YES' }

[Audio-Sources-Debug] === DASH MANIFEST GENERATION FOR VIDEO ft4iUfy7RwA ===
[Audio-Sources-Debug] DASH: Found 1 audio-only formats before toDash()
[Audio-Sources-Debug] DASH Audio Format #1: { itag: 140, language: 'en-US', ... urlAvailable: 'YES' }
[Audio-Sources-Debug] DASH: Generated manifest contains 1 audio AdaptationSets
[Audio-Sources-Debug] DASH AdaptationSet #1: { id: 'audio_0', language: 'en-US', label: 'English (United States) original' }
[Audio-Sources-Debug] === END DASH MANIFEST ANALYSIS ===
```

## Field Documentation

### Language-related fields:

- **`language`**: Primary language identifier (e.g., 'en-US', 'pl-PL', 'de-DE')
- **`languageCode`**: In youtubei.js, this is the same as `language` field
- **`audio_track.display_name`**: Human-readable label (e.g., "English (United States) original", "Polish dubbed")
- **`audio_track.id`**: Unique identifier for the track (format: `{language}.{type_id}`)

### Track type fields:

- **`is_original`**: Original author's audio (value: `true` for original content)
- **`is_dubbed`**: Professional dubbing (value: `true` for dubbed tracks)
- **`is_auto_dubbed`**: YouTube's automatic dubbing (value: `true` for AI-generated)
- **`is_descriptive`**: Audio description for accessibility (value: `true` for descriptive)
- **`is_secondary`**: Secondary audio track (value: `true` for alternative tracks)

### URL fields:

- **`url`**: Direct streaming URL (may need deciphering)
- **`freeTubeUrl`**: Deciphered and ready-to-use URL (FreeTube-specific field)
- **`signature_cipher`**: Encrypted URL that needs deciphering
- **`cipher`**: Alternative encryption field

## Next Steps

1. ✅ **Debug logging added** - Logs now track all audio data through the pipeline
2. ⏳ **Test with sample videos** - Run FreeTube and observe console output
3. ⏳ **Analyze differences** - Compare WEB vs MWEB vs DASH output
4. ⏳ **Implement unified access** - Create helper functions in audio-track-utils.js
5. ⏳ **Update DASH generation** - Modify manifest creation to include all available languages
6. ⏳ **Implement on-demand fetching** - Fetch URLs when user switches audio tracks

## How to Test

1. Run FreeTube in development mode
2. Open browser console (Ctrl+Shift+I or Cmd+Option+I)
3. Navigate to one of the test videos
4. Filter console by `[Audio-Sources-Debug]`
5. Observe the logged structure for each source
6. Compare available fields and URL availability

## Summary

| Source | Languages | URLs | Use Case |
|--------|-----------|------|----------|
| WEB    | ✅ All (13+) | ❌ No | Metadata discovery |
| MWEB   | ❌ One | ✅ Yes | Current playback |
| DASH   | ⚠️ Limited | ✅ Yes | Player manifest |

**Goal**: Combine WEB metadata with MWEB URL fetching to give users access to all audio tracks.
