/**
 * Title Language Detection and Restoration
 * Detects original language of video titles and replaces translated titles with original uploader titles.
 */

// Simple LRU cache for oEmbed results
class LRUCache {
  constructor(maxSize = 200) {
    this.maxSize = maxSize
    this.cache = new Map()
  }

  get(key) {
    if (!this.cache.has(key)) {
      return undefined
    }
    // Move to end (most recently used)
    const value = this.cache.get(key)
    this.cache.delete(key)
    this.cache.set(key, value)
    return value
  }

  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key)
    } else if (this.cache.size >= this.maxSize) {
      // Remove oldest (first) item
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
    this.cache.set(key, value)
  }

  delete(key) {
    this.cache.delete(key)
  }

  has(key) {
    return this.cache.has(key)
  }
}

const oEmbedCache = new LRUCache(200)
const NEGATIVE_CACHE_TTL_MS = 10 * 60 * 1000
const oEmbedNegativeCache = new Map()

// Known multi-audio videos list
const KNOWN_MULTI_AUDIO_VIDEOS = new Set()

// Probe IDs for testing/debugging
const PROBE_VIDEO_IDS = new Set([
  'dCefyTyit_o', 'oCPyYV7HA18', 'B55XdBXymHM', // Subs
  'wj3cp4sgLUU', 'LoanNIwQZWY', 'XbkVw1Yb2BI'  // Search
])

/**
 * @typedef {object} OEmbedFetchResult
 * @property {boolean} ok
 * @property {string | null} title
 * @property {number | null} status
 * @property {boolean} blocked
 * @property {boolean} fromCache
 * @property {'cache' | 'main' | 'renderer'} path
 * @property {string | null} error
 */

function getNegativeCacheEntry(videoId) {
  const entry = oEmbedNegativeCache.get(videoId)

  if (!entry) {
    return null
  }

  if (entry.expiresAt <= Date.now()) {
    oEmbedNegativeCache.delete(videoId)
    return null
  }

  return entry
}

function setNegativeCacheEntry(videoId, data) {
  oEmbedNegativeCache.set(videoId, {
    status: data.status ?? null,
    error: data.error ?? null,
    expiresAt: Date.now() + NEGATIVE_CACHE_TTL_MS
  })
}

/**
 * Detect language of text using simple heuristics
 * @param {string} text - Text to analyze
 * @returns {{lang: string|null, confidence: number}} Language code (ISO-639-1 or null) and confidence (0-1)
 */
export function detectLanguage(text) {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return { lang: null, confidence: 0 }
  }

  const trimmed = text.trim()

  // Simple script-based detection
  const hasLatin = /[A-Za-z]/.test(trimmed)
  const hasCyrillic = /[\u0400-\u04FF]/.test(trimmed)
  const hasArabic = /[\u0600-\u06FF]/.test(trimmed)
  const hasHebrew = /[\u0590-\u05FF]/.test(trimmed)
  const hasCJK = /[\u3040-\u30FF\u4E00-\u9FFF\uAC00-\uD7AF]/.test(trimmed)
  const hasDevanagari = /[\u0900-\u097F]/.test(trimmed)
  const hasThai = /[\u0E00-\u0E7F]/.test(trimmed)
  const hasGreek = /[\u0370-\u03FF]/.test(trimmed)

  // Count script occurrences
  let scriptCount = 0
  let dominantScript = null

  if (hasCyrillic) {
    scriptCount++
    dominantScript = 'ru' // Russian as proxy for Cyrillic
  }
  if (hasArabic) {
    scriptCount++
    dominantScript = 'ar'
  }
  if (hasHebrew) {
    scriptCount++
    dominantScript = 'he'
  }
  if (hasCJK) {
    scriptCount++
    dominantScript = 'ja' // Japanese as proxy for CJK
  }
  if (hasDevanagari) {
    scriptCount++
    dominantScript = 'hi'
  }
  if (hasThai) {
    scriptCount++
    dominantScript = 'th'
  }
  if (hasGreek) {
    scriptCount++
    dominantScript = 'el'
  }

  // If only non-Latin script, return with high confidence
  if (scriptCount === 1 && dominantScript) {
    return { lang: dominantScript, confidence: 0.9 }
  }

  // If mixed scripts, return with lower confidence
  if (scriptCount > 1) {
    return { lang: dominantScript, confidence: 0.5 }
  }

  // If only Latin or no clear script, try basic keyword detection
  if (hasLatin || scriptCount === 0) {
    const lower = trimmed.toLowerCase()

    // Polish indicators
    if (/[óąćęłńśźż]/.test(lower) || /\b(jest|nie|tak|dla|się|ale)\b/.test(lower)) {
      return { lang: 'pl', confidence: 0.7 }
    }

    // German indicators
    if (/[ßäöü]/.test(lower) || /\b(und|der|die|das|ist|nicht)\b/.test(lower)) {
      return { lang: 'de', confidence: 0.7 }
    }

    // French indicators
    if (/\b(le|la|les|un|une|des|est|dans|pour)\b/.test(lower)) {
      return { lang: 'fr', confidence: 0.6 }
    }

    // Spanish indicators
    if (/[áéíñóú]/.test(lower) || /\b(el|la|los|las|es|un|una|del)\b/.test(lower)) {
      return { lang: 'es', confidence: 0.6 }
    }

    // Italian indicators
    if (/\b(il|lo|la|gli|le|un|uno|una|è|di|per)\b/.test(lower)) {
      return { lang: 'it', confidence: 0.6 }
    }

    // Portuguese indicators
    if (/[ãõ]/.test(lower) || /\b(o|a|os|as|um|uma|é|de|para|não)\b/.test(lower)) {
      return { lang: 'pt', confidence: 0.6 }
    }

    // Default to English for Latin text
    return { lang: 'en', confidence: 0.5 }
  }

  return { lang: null, confidence: 0 }
}

/**
 * Fetch original title from YouTube oEmbed API
 * @param {string} videoId - YouTube video ID
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<OEmbedFetchResult>}
 */
export async function fetchOEmbedTitle(videoId, timeout = 2000) {
  if (typeof videoId !== 'string') {
    return {
      ok: false,
      title: null,
      status: null,
      blocked: false,
      fromCache: false,
      path: process.env.IS_ELECTRON ? 'main' : 'renderer',
      error: 'invalid-argument'
    }
  }

  const trimmedVideoId = videoId.trim()

  if (trimmedVideoId.length === 0) {
    return {
      ok: false,
      title: null,
      status: null,
      blocked: false,
      fromCache: false,
      path: process.env.IS_ELECTRON ? 'main' : 'renderer',
      error: 'invalid-argument'
    }
  }

  const cachedTitle = oEmbedCache.get(trimmedVideoId)
  if (typeof cachedTitle === 'string') {
    // console.warn(`[TitleLangFix] oEmbed cache hit for ${trimmedVideoId} (positive)`)
    return {
      ok: true,
      title: cachedTitle,
      status: 200,
      blocked: false,
      fromCache: true,
      path: 'cache',
      error: null
    }
  }

  if (cachedTitle !== undefined) {
    oEmbedCache.delete(trimmedVideoId)
  }

  const negativeEntry = getNegativeCacheEntry(trimmedVideoId)
  if (negativeEntry) {
    const status = negativeEntry.status ?? null
    const blocked = status === 401 || status === 403
    // console.warn(`[TitleLangFix] oEmbed negative cache hit for ${trimmedVideoId}: status ${status ?? 'unknown'}`)
    return {
      ok: false,
      title: null,
      status,
      blocked,
      fromCache: true,
      path: 'cache',
      error: negativeEntry.error ?? null
    }
  }

  const hasMainBridge = typeof window !== 'undefined' && typeof window.ftTitleLang?.fetchOEmbed === 'function'
  const fetchPath = hasMainBridge ? 'main' : 'renderer'
  const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${encodeURIComponent(trimmedVideoId)}&format=json`

  if (fetchPath === 'main') {
    try {
      const response = await window.ftTitleLang.fetchOEmbed(trimmedVideoId)
      const status = typeof response?.status === 'number' ? response.status : null
      const blocked = status === 401 || status === 403

      if (response?.ok && typeof response.title === 'string' && response.title.trim().length > 0) {
        const title = response.title
        oEmbedCache.set(trimmedVideoId, title)
        oEmbedNegativeCache.delete(trimmedVideoId)
        // console.warn(`[TitleLangFix] oEmbed fetched via main for ${trimmedVideoId}: "${title}"`)
        return {
          ok: true,
          title,
          status,
          blocked: false,
          fromCache: false,
          path: 'main',
          error: null
        }
      }

      const errorMessage = response?.message ?? response?.error ?? (typeof response?.statusText === 'string' ? response.statusText : null)

      setNegativeCacheEntry(trimmedVideoId, { status, error: errorMessage })

      if (blocked) {
        // console.warn(`[TitleLangFix] oEmbed blocked via main for ${trimmedVideoId}: status ${status ?? 'unknown'}`)
      } else {
        // console.warn(`[TitleLangFix] oEmbed fetch via main failed for ${trimmedVideoId}: status ${status ?? 'unknown'}${errorMessage ? ` (${errorMessage})` : ''}`)
      }

      return {
        ok: false,
        title: null,
        status,
        blocked,
        fromCache: false,
        path: 'main',
        error: errorMessage ?? null
      }
    } catch (error) {
      const message = error?.message ?? 'unknown error'
      setNegativeCacheEntry(trimmedVideoId, { status: null, error: message })
      // console.warn(`[TitleLangFix] oEmbed fetch via main error for ${trimmedVideoId}: ${message}`)
      return {
        ok: false,
        title: null,
        status: null,
        blocked: false,
        fromCache: false,
        path: 'main',
        error: message
      }
    }
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json'
      }
    })

    const status = response.status
    const blocked = status === 401 || status === 403

    if (response.ok) {
      const data = await response.json()
      const title = typeof data?.title === 'string' ? data.title : null

      if (title && title.trim().length > 0) {
        oEmbedCache.set(trimmedVideoId, title)
        oEmbedNegativeCache.delete(trimmedVideoId)
        // console.warn(`[TitleLangFix] oEmbed fetched via renderer for ${trimmedVideoId}: "${title}"`)
        return {
          ok: true,
          title,
          status,
          blocked: false,
          fromCache: false,
          path: 'renderer',
          error: null
        }
      }

      setNegativeCacheEntry(trimmedVideoId, { status, error: 'missing-title' })
      // console.warn(`[TitleLangFix] oEmbed fetch via renderer returned empty title for ${trimmedVideoId}: status ${status}`)
      return {
        ok: false,
        title: null,
        status,
        blocked: false,
        fromCache: false,
        path: 'renderer',
        error: 'missing-title'
      }
    }

    const errorMessage = response.statusText || null
    setNegativeCacheEntry(trimmedVideoId, { status, error: errorMessage })

    if (blocked) {
      // console.warn(`[TitleLangFix] oEmbed blocked via renderer for ${trimmedVideoId}: status ${status}`)
    } else {
      // console.warn(`[TitleLangFix] oEmbed fetch via renderer failed for ${trimmedVideoId}: status ${status}${errorMessage ? ` (${errorMessage})` : ''}`)
    }

    return {
      ok: false,
      title: null,
      status,
      blocked,
      fromCache: false,
      path: 'renderer',
      error: errorMessage
    }
  } catch (error) {
    const isTimeout = error?.name === 'AbortError'
    const message = isTimeout ? 'timeout' : error?.message ?? 'unknown error'

    if (isTimeout) {
      // console.warn(`[TitleLangFix] oEmbed fetch via renderer timeout for ${trimmedVideoId}`)
    } else {
      // console.warn(`[TitleLangFix] oEmbed fetch via renderer error for ${trimmedVideoId}: ${message}`)
    }

    setNegativeCacheEntry(trimmedVideoId, { status: null, error: message })

    return {
      ok: false,
      title: null,
      status: null,
      blocked: false,
      fromCache: false,
      path: 'renderer',
      error: message
    }
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * Optional machine translation fallback (currently not implemented)
 * @param {object} params - MT parameters
 * @param {string} params.text - Text to translate
 * @param {string|null} params.sourceLang - Detected source language (may be null)
 * @param {number} params.sourceLangConfidence - Confidence of source language detection
 * @param {string|null} params.targetLang - Target language code
 * @param {number} params.targetLangConfidence - Confidence of target language detection
 * @param {object} settings - Translation settings from Vuex
 * @returns {Promise<string|null>} Translated text or null
 */
export async function maybeTranslateTitle({
  text,
  sourceLang = null,
  sourceLangConfidence = 0,
  targetLang = null,
  targetLangConfidence = 0
}, settings = {}) {
  // MT fallback is disabled by default for privacy
  if (!settings.enableTitleMTFallback) {
    // console.warn('[TitleLangFix] MT fallback disabled (default), skipping translation')
    return null
  }

  if (!settings.translationProviderUrl) {
    // console.warn('[TitleLangFix] MT fallback enabled but no provider URL configured, skipping')
    return null
  }

  // MT safety checks: require high confidence on both sides and different scripts
  const mtConfidenceThreshold = 0.6
  const langsDiffer = sourceLang && targetLang && sourceLang !== targetLang

  if (!langsDiffer) {
    // console.warn('[TitleLangFix] MT skipped: source and target languages are the same or undetected')
    return null
  }

  if (sourceLangConfidence < mtConfidenceThreshold || targetLangConfidence < mtConfidenceThreshold) {
    // console.warn(`[TitleLangFix] MT skipped: confidence too low (source=${sourceLangConfidence.toFixed(2)}, target=${targetLangConfidence.toFixed(2)}, threshold=${mtConfidenceThreshold})`)
    return null
  }

  // console.warn('[TitleLangFix] MT fallback not yet implemented')
  return null
}

/**
 * Calculate string similarity between two strings (0-1, where 1 is identical)
 * @param {string} str1
 * @param {string} str2
 * @returns {number}
 */
function calculateStringSimilarity(str1, str2) {
  if (!str1 || !str2) return 0
  if (str1 === str2) return 1

  const s1Lower = str1.toLowerCase()
  const s2Lower = str2.toLowerCase()
  if (s1Lower === s2Lower) return 0.99

  // Simple Levenshtein-based similarity
  const longer = s1Lower.length > s2Lower.length ? s1Lower : s2Lower
  const shorter = s1Lower.length > s2Lower.length ? s2Lower : s1Lower

  if (longer.length === 0) return 1
  if (shorter.length === 0) return 0

  const editDistance = levenshteinDistance(longer, shorter)
  return (longer.length - editDistance) / longer.length
}

/**
 * Levenshtein distance algorithm
 * @param {string} s1
 * @param {string} s2
 * @returns {number}
 */
function levenshteinDistance(s1, s2) {
  const arr = []

  for (let i = 0; i <= s2.length; i++) {
    arr[i] = [i]
  }

  for (let j = 0; j <= s1.length; j++) {
    arr[0][j] = j
  }

  for (let i = 1; i <= s2.length; i++) {
    for (let j = 1; j <= s1.length; j++) {
      const marker = s2[i - 1] === s1[j - 1] ? 0 : 1
      arr[i][j] = Math.min(
        arr[i][j - 1] + 1,
        arr[i - 1][j] + 1,
        arr[i - 1][j - 1] + marker
      )
    }
  }

  return arr[s2.length][s1.length]
}

/**
 * Decide whether to replace current title with oEmbed title
 * @param {object} params - Decision parameters
 * @param {string} params.currentTitle - Current title from API
 * @param {string|null} params.oembedTitle - Title from oEmbed
 * @param {string|null} params.currentLang - Detected language of current title
 * @param {number} params.currentLangConfidence - Confidence of current language detection
 * @param {string|null} params.oembedLang - Detected language of oEmbed title
 * @param {number} params.oembedLangConfidence - Confidence of oEmbed language detection
 * @returns {{shouldReplace: boolean, reason: string}} Decision and reason
 */
export function decideReplacement({
  currentTitle,
  oembedTitle,
  currentLang,
  currentLangConfidence = 0,
  oembedLang,
  oembedLangConfidence = 0
}) {
  // If no oEmbed title, can't replace
  if (!oembedTitle) {
    return { shouldReplace: false, reason: 'no oEmbed title' }
  }

  // If titles are identical, no need to replace
  if (currentTitle === oembedTitle) {
    return { shouldReplace: false, reason: 'titles identical' }
  }

  // If oEmbed title is just empty or whitespace, don't replace
  if (!oembedTitle.trim()) {
    return { shouldReplace: false, reason: 'oEmbed title empty' }
  }

  // If titles are already very similar, don't replace (avoid MT-like false positives)
  const similarity = calculateStringSimilarity(currentTitle, oembedTitle)
  if (similarity > 0.9) {
    return { shouldReplace: false, reason: `titles already similar (${(similarity * 100).toFixed(1)}%)` }
  }

  // If both languages detected and they differ, replace
  if (currentLang && oembedLang && currentLang !== oembedLang) {
    return { shouldReplace: true, reason: `language mismatch: ${currentLang} vs ${oembedLang}` }
  }

  // If languages are same but titles differ by more than case, replace
  // (might be auto-generated title variations)
  if (currentTitle.toLowerCase() !== oembedTitle.toLowerCase()) {
    return { shouldReplace: true, reason: 'titles differ (case-insensitive)' }
  }

  return { shouldReplace: false, reason: 'no clear difference' }
}

/**
 * Process and potentially replace video title in list context
 * @param {object} videoData - Video data object with at least videoId and title
 * @param {object} options - Processing options
 * @param {boolean} options.isListContext - Whether this is a list context
 * @param {string} [options.source='unknown'] - Source context (e.g., 'subs', 'search', 'trending')
 * @param {object} [options.translationSettings={}] - Translation settings for MT fallback
 * @returns {Promise<object>} Updated video data
 */
export async function processVideoTitle(videoData, options = {}) {
  const { isListContext = false, source = 'unknown', translationSettings = {} } = options

  // Only apply to list contexts
  if (!isListContext) {
    return videoData
  }

  const currentTitle = videoData.title
  if (!currentTitle) {
    return videoData
  }

  // Ensure we have a valid video ID
  if (!videoData.videoId) {
    return videoData
  }

  const videoId = videoData.videoId
  const isProbe = PROBE_VIDEO_IDS.has(videoId)

  // Guard: prevent double-processing
  if (videoData._titleLangFixed) {
    if (isProbe) {
      // console.warn(`[TitleLangFix][Probe] ${videoId} (${source}): already processed, skipping`)
    }
    return videoData
  }

  // Multi-audio early return: check both the flag and the known list
  const isMultiAudio = videoData._isMultiAudio === true || KNOWN_MULTI_AUDIO_VIDEOS.has(videoId)

  if (isMultiAudio) {
    if (isProbe) {
      // console.warn(`[TitleLangFix][Probe] ${videoId} (${source}): multi-audio detected, using dedicated path`)
    }
    // console.warn(`[TitleLangFix] ${videoId} is multi-audio, applying oEmbed correction directly`)

    // Multi-audio dedicated path: fetch oEmbed and apply directly without MT
    const oembedResult = await fetchOEmbedTitle(videoId)
    const oembedTitle = typeof oembedResult.title === 'string' ? oembedResult.title : null

    if (oembedResult.ok && oembedTitle) {
      // console.warn(`[TitleLangFix] ${videoId} multi-audio: title changed via oEmbed: "${currentTitle}" -> "${oembedTitle}"`)
      return {
        ...videoData,
        title: oembedTitle,
        _originalTitle: currentTitle,
        _titleRestored: true,
        _titleLangFixed: true
      }
    }

    // Even if oEmbed failed, mark as processed to prevent re-processing
    return {
      ...videoData,
      _titleLangFixed: true
    }
  }

  if (isProbe) {
    // console.warn(`[TitleLangFix][Probe] ${videoId} (${source}): starting general pipeline`)
  }

  // console.warn(`[TitleLangFix] Processing ${videoId}: "${currentTitle}"`)

  const currentLangResult = detectLanguage(currentTitle)
  const oembedResult = await fetchOEmbedTitle(videoId)
  const oembedTitle = typeof oembedResult.title === 'string' ? oembedResult.title : null

  if (oembedResult.blocked) {
    // console.warn(`[TitleLangFix] ${videoId} oEmbed blocked via ${oembedResult.path}: status ${oembedResult.status ?? 'unknown'}, attempting MT fallback`)

    const translatedTitle = await maybeTranslateTitle({
      text: currentTitle,
      sourceLang: currentLangResult.lang,
      sourceLangConfidence: currentLangResult.confidence,
      targetLang: null,
      targetLangConfidence: 0
    }, translationSettings)

    if (translatedTitle) {
      // console.warn(`[TitleLangFix] ${videoId} title changed via MT fallback: "${currentTitle}" -> "${translatedTitle}"`)
      if (isProbe) {
        // console.warn(`[TitleLangFix][Probe] ${videoId} (${source}): decision=MT_FALLBACK`)
      }
      return {
        ...videoData,
        title: translatedTitle,
        _originalTitle: currentTitle,
        _titleRestored: true,
        _titleLangFixed: true
      }
    }

    if (isProbe) {
      // console.warn(`[TitleLangFix][Probe] ${videoId} (${source}): decision=oEmbed_blocked_no_MT`)
    }
    return {
      ...videoData,
      _titleLangFixed: true
    }
  }

  const oembedLangResult = oembedTitle ? detectLanguage(oembedTitle) : { lang: null, confidence: 0 }

  // console.warn(`[TitleLangFix] ${videoId} languages: current=${currentLangResult.lang}(${currentLangResult.confidence.toFixed(2)}), oEmbed=${oembedLangResult.lang}(${oembedLangResult.confidence.toFixed(2)})`)

  // Decide replacement
  const decision = decideReplacement({
    currentTitle,
    oembedTitle,
    currentLang: currentLangResult.lang,
    currentLangConfidence: currentLangResult.confidence,
    oembedLang: oembedLangResult.lang,
    oembedLangConfidence: oembedLangResult.confidence
  })

  // console.warn(`[TitleLangFix] ${videoId} decision: ${decision.shouldReplace ? 'REPLACE' : 'KEEP'} (${decision.reason})`)

  // Apply replacement if decided
  if (decision.shouldReplace) {
    // console.warn(`[TitleLangFix] ${videoId} title changed: "${currentTitle}" -> "${oembedTitle}"`)
    if (isProbe) {
      // console.warn(`[TitleLangFix][Probe] ${videoId} (${source}): decision=REPLACE (${decision.reason})`)
    }
    return {
      ...videoData,
      title: oembedTitle,
      _originalTitle: currentTitle,
      _titleRestored: true,
      _titleLangFixed: true
    }
  }

  if (isProbe) {
    // console.warn(`[TitleLangFix][Probe] ${videoId} (${source}): decision=KEEP (${decision.reason})`)
  }
  return {
    ...videoData,
    _titleLangFixed: true
  }
}

/**
 * Batch process multiple videos with rate limiting
 * @param {Array<object>} videos - Array of video objects
 * @param {object} options - Processing options
 * @param {boolean} options.isListContext - Whether this is a list context
 * @param {string} [options.source='unknown'] - Source context (e.g., 'subs', 'search', 'trending')
 * @returns {Promise<Array<object>>} Processed videos
 */
export async function batchProcessVideoTitles(videos, options = {}) {
  if (!Array.isArray(videos) || videos.length === 0) {
    return videos
  }

  const { source = 'unknown' } = options

  const totalCount = videos.length
  const videoCount = videos.filter(v => v.type === 'video' && v.videoId).length
  const channelCount = videos.filter(v => v.type === 'channel').length
  const playlistCount = videos.filter(v => v.type === 'playlist').length

  // console.warn(`[TitleLangFix] Batch start (${source}): ${totalCount} items (${videoCount} videos, ${channelCount} channels, ${playlistCount} playlists)`)

  // Process videos in parallel with a reasonable limit
  const batchSize = 10
  const results = []

  for (let i = 0; i < videos.length; i += batchSize) {
    const batch = videos.slice(i, i + batchSize)
    const batchResults = await Promise.all(
      batch.map(video => processVideoTitle(video, options))
    )
    results.push(...batchResults)

    // Small delay between batches to avoid overwhelming the API
    if (i + batchSize < videos.length) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  const restoredCount = results.filter(v => v._titleRestored).length
  const processedCount = results.filter(v => v.type === 'video' && v.videoId).length
  const skippedCount = results.filter(v => v._titleLangFixed && !v._titleRestored && v.type === 'video').length
  const nonVideoCount = results.filter(v => v.type !== 'video').length

  // console.warn(`[TitleLangFix] Batch complete (${source}): ${restoredCount}/${processedCount} videos restored, ${skippedCount} skipped, ${nonVideoCount} non-videos passed through`)

  return results
}
