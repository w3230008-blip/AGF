/**
 * Audio Track Utilities
 * Helper functions for managing multi-language audio tracks
 */

/**
 * Get 2-letter uppercase language code from full language code
 * @param {string} languageCode - e.g., "en-US", "pl-PL", "en"
 * @returns {string} - e.g., "EN", "PL"
 */
export function getLanguageCodeShort(languageCode) {
  if (!languageCode || languageCode === 'und') {
    return '??'
  }

  // Extract first part before hyphen and convert to uppercase
  const shortCode = languageCode.split('-')[0].toUpperCase()
  return shortCode.substring(0, 2)
}

/**
 * Get full language name in the specified display language
 * @param {string} languageCode - ISO 639-1 or BCP 47 language code
 * @param {string} displayLanguage - Language to display name in (default: 'en')
 * @returns {string} - Full language name
 */
export function getLanguageName(languageCode, displayLanguage = 'en') {
  if (!languageCode || languageCode === 'und') {
    return 'Unknown'
  }

  try {
    const displayNames = new Intl.DisplayNames([displayLanguage], {
      type: 'language',
      languageDisplay: 'standard'
    })
    return displayNames.of(languageCode) || languageCode
  } catch (error) {
    console.warn(`Failed to get language name for ${languageCode}:`, error)
    return languageCode
  }
}

/**
 * Sort audio tracks by priority:
 * 1. Original language track
 * 2. System language track (if available and different from original)
 * 3. All other tracks alphabetically by language name
 *
 * @param {Array} tracks - Array of audio track objects
 * @param {string} systemLanguage - System language code (e.g., 'en', 'pl')
 * @returns {Array} Sorted tracks
 */
export function sortAudioTracksByPriority(tracks, systemLanguage = null) {
  if (!tracks || tracks.length === 0) {
    return []
  }

  // Get system language code (first part before hyphen)
  const systemLangCode = systemLanguage ? systemLanguage.split('-')[0].toLowerCase() : null

  console.warn('[AudioTrack] Sorting tracks, system language:', systemLangCode)

  // Separate tracks into categories
  const originalTracks = []
  const systemLangTracks = []
  const otherTracks = []

  for (const track of tracks) {
    const trackLangCode = track.language ? track.language.split('-')[0].toLowerCase() : 'und'

    // Check if this is the original track
    // In Shaka Player, original tracks might have audioIsDefault: true
    // or we can check the label for "original"
    const isOriginal = track.audioIsDefault ||
            track.label?.toLowerCase().includes('original') ||
            track.roles?.includes('main')

    if (isOriginal) {
      originalTracks.push(track)
    } else if (systemLangCode && trackLangCode === systemLangCode) {
      systemLangTracks.push(track)
    } else {
      otherTracks.push(track)
    }
  }

  // Sort "other" tracks alphabetically by language name
  otherTracks.sort((a, b) => {
    const nameA = getLanguageName(a.language)
    const nameB = getLanguageName(b.language)
    return nameA.localeCompare(nameB)
  })

  // Combine: original first, then system language, then others
  const sortedTracks = [...originalTracks, ...systemLangTracks, ...otherTracks]

  console.warn('[AudioTrack] Sorted track order:', sortedTracks.map(t => ({
    language: t.language,
    label: t.label,
    isDefault: t.audioIsDefault
  })))

  return sortedTracks
}

/**
 * Save audio track preference for a specific video
 * @param {string} videoId - YouTube video ID
 * @param {string} languageCode - Selected language code
 */
export function saveAudioTrackPreference(videoId, languageCode) {
  if (!videoId || !languageCode) {
    return
  }

  try {
    const key = `audioTrackPreference_${videoId}`
    localStorage.setItem(key, languageCode)
    console.warn(`[AudioTrack] Saved preference for ${videoId}: ${languageCode}`)
  } catch (error) {
    console.error('[AudioTrack] Failed to save preference:', error)
  }
}

/**
 * Load audio track preference for a specific video
 * @param {string} videoId - YouTube video ID
 * @returns {string|null} - Saved language code or null
 */
export function loadAudioTrackPreference(videoId) {
  if (!videoId) {
    return null
  }

  try {
    const key = `audioTrackPreference_${videoId}`
    const preference = localStorage.getItem(key)

    if (preference) {
      console.warn(`[AudioTrack] Loaded preference for ${videoId}: ${preference}`)
    }

    return preference
  } catch (error) {
    console.error('[AudioTrack] Failed to load preference:', error)
    return null
  }
}

/**
 * Get system language code
 * @returns {string} - System language code (e.g., 'en', 'pl')
 */
export function getSystemLanguage() {
  const language = navigator.language || navigator.userLanguage || 'en'
  return language.split('-')[0].toLowerCase()
}

/**
 * Find best matching audio track based on preference and priority
 * @param {Array} tracks - Available audio tracks
 * @param {string} videoId - Video ID for preference lookup
 * @returns {object | null} - Best matching track or null
 */
export function findBestAudioTrack(tracks, videoId) {
  if (!tracks || tracks.length === 0) {
    return null
  }

  // 1. Check for saved preference
  const savedPreference = loadAudioTrackPreference(videoId)
  if (savedPreference) {
    const preferredTrack = tracks.find(t =>
      t.language && t.language.split('-')[0].toLowerCase() === savedPreference.toLowerCase()
    )
    if (preferredTrack) {
      console.warn('[AudioTrack] Using saved preference:', savedPreference)
      return preferredTrack
    }
  }

  // 2. Try to find original track
  const originalTrack = tracks.find(t =>
    t.audioIsDefault ||
        t.label?.toLowerCase().includes('original') ||
        t.roles?.includes('main')
  )
  if (originalTrack) {
    console.warn('[AudioTrack] Using original track:', originalTrack.language)
    return originalTrack
  }

  // 3. Try system language
  const systemLang = getSystemLanguage()
  const systemLangTrack = tracks.find(t =>
    t.language && t.language.split('-')[0].toLowerCase() === systemLang
  )
  if (systemLangTrack) {
    console.warn('[AudioTrack] Using system language track:', systemLang)
    return systemLangTrack
  }

  // 4. Fall back to first track
  console.warn('[AudioTrack] Using first available track')
  return tracks[0]
}
