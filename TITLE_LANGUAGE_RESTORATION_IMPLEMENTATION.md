# Title Language Restoration - Implementation Summary

## Overview
Implemented automatic detection and restoration of original video titles in list views when YouTube's API returns translated titles.

## Files Created
1. **src/renderer/helpers/title-language.js** (363 lines)
   - Core implementation of language detection and title restoration
   - LRU cache for oEmbed results
   - Batch processing with rate limiting
   - Comprehensive logging

## Files Modified
1. **src/renderer/helpers/api/local.js**
   - Imported `batchProcessVideoTitles`
   - Modified `getLocalTrending()` - added title restoration
   - Modified `getLocalChannelVideos()` - added title restoration
   - Modified `getLocalChannelLiveStreams()` - added title restoration
   - Modified `handleSearchResponse()` - added title restoration for video items

2. **src/renderer/views/Playlist/Playlist.vue**
   - Imported `batchProcessVideoTitles`
   - Modified `getPlaylistLocal()` - added title restoration
   - Modified `getNextPageLocal()` - added title restoration for continuations

## Architecture

### Core Components

#### 1. Language Detection (`detectLanguage`)
- Simple script-based detection using Unicode ranges
- Detects: Cyrillic, Arabic, Hebrew, CJK, Devanagari, Thai, Greek scripts
- Basic Latin script keyword detection for Polish, German, French, Spanish, Italian, Portuguese
- Returns language code (ISO-639-1) and confidence score (0-1)

#### 2. oEmbed Fetching (`fetchOEmbedTitle`)
- Fetches original title from YouTube's oEmbed API
- 2-second timeout per request
- LRU cache (200 entries) to minimize network traffic
- Graceful error handling (timeouts, 404s, etc.)

#### 3. Title Replacement Decision (`decideReplacement`)
- Compares current title with oEmbed title
- Checks language mismatch
- Handles case-insensitive comparisons
- Returns decision with reason for logging

#### 4. Video Processing (`processVideoTitle`)
- Main processing function for individual videos
- Checks `isListContext` flag (only processes list items)
- Checks `isMultiAudio` flag (skips if set, for future multi-audio fix)
- Validates videoId and title presence
- Applies replacement logic
- Marks restored videos with `_titleRestored` flag

#### 5. Batch Processing (`batchProcessVideoTitles`)
- Processes arrays of videos with rate limiting
- Batch size: 10 videos at a time
- 100ms delay between batches
- Parallel processing within batches
- Comprehensive logging of results

### Integration Pattern

For each list view endpoint in local.js:
```javascript
// After parsing videos
videos = await batchProcessVideoTitles(videos, { isListContext: true })
```

For search results (mixed content):
```javascript
// Filter videos, process them, then replace back
const videoResults = results.filter(item => item.type === 'video')
const processedVideos = await batchProcessVideoTitles(videoResults, { isListContext: true })
// Replace video items with processed ones
```

## Scope

### ✅ Where It Applies (List Views)
- Subscriptions feed (`getLocalChannelVideos` via SubscriptionsVideos.vue)
- Trending page (`getLocalTrending`)
- Search results (`handleSearchResponse`)
- Playlist view page (`Playlist.vue`)
- Channel video lists (`getLocalChannelVideos`)
- Channel live streams (`getLocalChannelLiveStreams`)

### ❌ Where It Does NOT Apply
- Watch page (explicitly excluded per requirements)
- Watch page "Up Next" section (`parseLocalWatchNextVideo` not modified)
- Invidious backend (only applies to Local API)

## Logging Strategy

All actions logged via `console.warn` with `[TitleLangFix]` prefix:

1. **Batch Start**: `[TitleLangFix] Batch processing 20 items`
2. **Processing**: `[TitleLangFix] Processing VIDEO_ID: "Title"`
3. **oEmbed Fetch**: `[TitleLangFix] oEmbed fetched for VIDEO_ID: "Original Title"`
4. **Cache Hit**: `[TitleLangFix] oEmbed cache hit for VIDEO_ID`
5. **Language Detection**: `[TitleLangFix] VIDEO_ID languages: current=en(0.70), oEmbed=pl(0.90)`
6. **Decision**: `[TitleLangFix] VIDEO_ID decision: REPLACE (language mismatch: en vs pl)`
7. **Replacement**: `[TitleLangFix] VIDEO_ID title changed: "Old" -> "New"`
8. **Batch Complete**: `[TitleLangFix] Batch complete: 5/18 video titles restored`
9. **Multi-Audio Skip**: `[TitleLangFix] Skipping VIDEO_ID - flagged as multi-audio`
10. **Errors**: `[TitleLangFix] oEmbed fetch timeout for VIDEO_ID`

## Performance Considerations

### Network Requests
- **First Load**: Each video makes one oEmbed request (if not cached)
- **Cached Load**: Instant, no network requests
- **Rate Limiting**: 10 videos per 100ms = ~100 videos/second max
- **Timeout**: 2 seconds per request (graceful degradation on timeout)

### Memory Usage
- **Cache Size**: 200 entries * ~100 bytes = ~20KB
- **Temporary**: Processed video objects with extra flags

### User Experience
- **First Load**: Slight delay (1-3 seconds for 20 videos)
- **Subsequent Loads**: Instant (cache hits)
- **Degradation**: If oEmbed fails, original title from API is kept

## Future Enhancements

### Settings (Not Yet Implemented)
```javascript
// Future Vuex settings
settings: {
  enableTitleMTFallback: false,      // Enable MT fallback
  translationProviderUrl: '',         // LibreTranslate URL
  translationApiKey: '',              // Optional API key
  titleLangFixEnabled: true,          // Master toggle
  titleLangFixCacheSize: 200          // Cache size
}
```

### Machine Translation Fallback
- Stub exists in `maybeTranslateTitle()`
- Ready for LibreTranslate integration
- POST to `/translate` endpoint
- Privacy-conscious (only if explicitly enabled)

## Edge Cases Handled

1. **Empty Arrays**: Returns immediately
2. **Missing videoId**: Skips processing
3. **Missing title**: Skips processing
4. **oEmbed Failure**: Graceful degradation
5. **Timeout**: 2s limit, graceful degradation
6. **Identical Titles**: Skips replacement
7. **Mixed Content**: Only processes video items
8. **Multi-Audio Videos**: Skips (flag not yet used, but ready)

## Testing

See `TITLE_LANGUAGE_RESTORATION_TESTING.md` for comprehensive testing guide.

## Code Quality

- ✅ ESLint: No errors or warnings
- ✅ Stylelint: N/A (JavaScript only)
- ✅ JSDoc: All functions documented
- ✅ No console.log: All logging via console.warn
- ✅ No trailing spaces
- ✅ Follows existing code conventions

## Compatibility

- **Backend**: Local API only (Invidious not affected)
- **Vue Version**: Compatible with Vue 2.7
- **Browser**: Modern browsers with fetch API
- **Electron**: Compatible with Electron 38

## Security & Privacy

- **No Tracking**: oEmbed API doesn't use cookies or tracking
- **No Personal Data**: Only video IDs sent to oEmbed
- **Same-Origin**: oEmbed API is YouTube's official API
- **Timeouts**: Prevents hanging requests
- **Error Handling**: No sensitive data in logs
