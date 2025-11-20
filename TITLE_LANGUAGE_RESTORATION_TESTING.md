# Title Language Restoration - Testing Guide

## Overview
This feature automatically detects and restores original video titles in list views when YouTube's API returns translated titles.

## How It Works
1. **Detection**: Analyzes video titles using script-based language detection
2. **Fetching**: Retrieves original titles from YouTube's oEmbed API
3. **Replacement**: Replaces translated titles with original uploader titles when languages differ
4. **Caching**: Maintains an LRU cache (200 entries) to minimize network requests

## Where It Applies
✅ **List Views** (Feature is active):
- Subscriptions feed
- Trending/Popular pages
- Search results
- Playlists (including playlist view page)
- Channel video lists
- Channel live streams

❌ **Watch Page** (Feature is NOT active):
- Watch page itself
- Up Next / Related videos sidebar

## Testing the Feature

### Prerequisites
- Open browser DevTools console to see [TitleLangFix] logs
- Ensure you're using Local API backend (not Invidious)

### Test Cases

#### 1. Trending Page
1. Navigate to Trending
2. Check console for `[TitleLangFix]` logs
3. Look for videos with non-English titles that may have been auto-translated
4. Verify titles appear in their original language

#### 2. Search Results
1. Search for videos in a non-English language (e.g., search for Polish gaming content)
2. Check console logs for processing
3. Verify search results show original titles, not English translations

#### 3. Channel Videos
1. Visit a channel that posts in a non-English language
2. Navigate to Videos tab
3. Check console for batch processing logs
4. Verify video titles match the original language

#### 4. Playlists
1. Open a playlist with mixed-language content
2. Check console for title processing
3. Verify titles are in their original languages
4. Load more videos (continuation) and verify processing continues

#### 5. Subscriptions Feed
1. Go to Subscriptions > Videos
2. If you have channels in different languages, verify titles are original
3. Check console for batch processing across multiple channels

### Console Logs to Expect

Successful processing:
```
[TitleLangFix] Batch processing 20 videos
[TitleLangFix] Processing VIDEO_ID: "Original Title"
[TitleLangFix] oEmbed fetched for VIDEO_ID: "Original Title"
[TitleLangFix] VIDEO_ID languages: current=en(0.70), oEmbed=pl(0.90)
[TitleLangFix] VIDEO_ID decision: REPLACE (language mismatch: en vs pl)
[TitleLangFix] VIDEO_ID title changed: "English Translation" -> "Oryginalny Tytuł"
[TitleLangFix] Batch complete: 5/20 titles restored
```

Cache hit:
```
[TitleLangFix] oEmbed cache hit for VIDEO_ID
```

No change needed:
```
[TitleLangFix] VIDEO_ID decision: KEEP (titles identical)
```

Error handling:
```
[TitleLangFix] oEmbed fetch timeout for VIDEO_ID
[TitleLangFix] oEmbed fetch failed for VIDEO_ID: 404 Not Found
```

### Known Limitations
1. **Language Detection**: Uses simple heuristics, not perfect for all languages
2. **oEmbed API**: May fail or timeout (2s timeout per request)
3. **Batch Processing**: Processes 10 videos at a time with 100ms delays
4. **Cache Size**: Limited to 200 most recent videos
5. **MT Fallback**: Not implemented yet (default disabled)

### Performance Considerations
- First load of a list may take slightly longer due to oEmbed fetches
- Cached results load instantly
- Network failures gracefully degrade (keeps original title from API)

### Debugging
If titles aren't being restored:
1. Check console for [TitleLangFix] logs
2. Verify backend is set to "Local API"
3. Check if oEmbed requests are succeeding (network tab)
4. Verify language detection is working (check log confidence scores)

### Configuration (Future)
Currently no UI settings. Future versions may include:
- Enable/disable feature toggle
- MT fallback provider configuration
- Cache size adjustment
- Timeout customization
