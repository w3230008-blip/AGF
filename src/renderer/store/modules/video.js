import { showToast } from '../../helpers/utils'

const state = {
  audioTracks: [],
  currentVideoId: null,
  selectedAudioTrackId: null
}

const getters = {
  getAudioTracks(state) {
    return state.audioTracks
  },

  getCurrentVideoId(state) {
    return state.currentVideoId
  },

  getSelectedAudioTrack(state) {
    if (!state.selectedAudioTrackId) {
      return null
    }

    return state.audioTracks.find(track => track.id === state.selectedAudioTrackId) || null
  }
}

const actions = {
  /**
   * Fetch and process audio tracks from MWEB, WEB, and DASH sources
   * @param {object} param0 - Vuex context
   * @param {Function} param0.commit - Vuex commit function
   * @param {object} param1 - Payload object
   * @param {string} param1.videoId - YouTube video ID
   * @param {object} param1.audioMetadata - Audio metadata object with MWEB, WEB, DASH arrays
   * @param {string} param1.systemLanguage - System/preferred language code
   */
  async fetchAudioTracks({ commit }, { videoId, audioMetadata, systemLanguage = 'en' }) {
    console.warn('[Audio-Metadata-Fetch] Starting audio track collection for video:', videoId)
    console.warn('[Audio-Metadata-Fetch] System language:', systemLanguage)

    if (!audioMetadata) {
      console.warn('[Audio-Metadata-Fetch] No audio metadata provided, setting empty array')
      commit('setAudioTracks', [])
      commit('setCurrentVideoId', videoId)
      return
    }

    // Step 1: Collect all audio tracks from all sources
    console.warn('[Audio-Metadata-Fetch] Step 1: Collecting audio tracks from all sources')

    const allTracks = []

    // Process MWEB tracks
    if (audioMetadata.mweb && Array.isArray(audioMetadata.mweb)) {
      console.warn('[Audio-Metadata-Fetch] Processing MWEB tracks:', audioMetadata.mweb.length)
      audioMetadata.mweb.forEach((track, index) => {
        console.warn(`[Audio-Metadata-Fetch] MWEB track #${index + 1}:`, {
          language: track.languageCode,
          formatId: track.formatId,
          hasUrl: !!track.url
        })
        allTracks.push({
          ...track,
          source: 'MWEB'
        })
      })
    }

    // Process WEB tracks
    if (audioMetadata.web && Array.isArray(audioMetadata.web)) {
      console.warn('[Audio-Metadata-Fetch] Processing WEB tracks:', audioMetadata.web.length)
      audioMetadata.web.forEach((track, index) => {
        console.warn(`[Audio-Metadata-Fetch] WEB track #${index + 1}:`, {
          language: track.languageCode,
          formatId: track.formatId,
          hasUrl: !!track.url
        })
        allTracks.push({
          ...track,
          source: 'WEB'
        })
      })
    }

    // Process DASH tracks
    if (audioMetadata.dash && Array.isArray(audioMetadata.dash)) {
      console.warn('[Audio-Metadata-Fetch] Processing DASH tracks:', audioMetadata.dash.length)
      audioMetadata.dash.forEach((track, index) => {
        console.warn(`[Audio-Metadata-Fetch] DASH track #${index + 1}:`, {
          language: track.languageCode,
          formatId: track.formatId,
          hasUrl: !!track.url
        })
        allTracks.push({
          ...track,
          source: 'DASH'
        })
      })
    }

    console.warn('[Audio-Metadata-Fetch] Total tracks collected:', allTracks.length)

    // Step 2: Deduplicate by languageCode, prefer tracks with URLs
    console.warn('[Audio-Metadata-Fetch] Step 2: Deduplicating by languageCode')

    const tracksByLanguage = new Map()

    allTracks.forEach(track => {
      const langCode = track.languageCode

      if (!tracksByLanguage.has(langCode)) {
        tracksByLanguage.set(langCode, track)
        console.warn(`[Audio-Metadata-Fetch] Added track for language: ${langCode} from ${track.source}`)
      } else {
        const existing = tracksByLanguage.get(langCode)
        // Prefer track with URL
        if (track.url && !existing.url) {
          tracksByLanguage.set(langCode, track)
          console.warn(`[Audio-Metadata-Fetch] Replaced ${langCode} track (${existing.source} -> ${track.source}) - has URL`)
        } else {
          console.warn(`[Audio-Metadata-Fetch] Skipped duplicate ${langCode} track from ${track.source}`)
        }
      }
    })

    const deduplicated = Array.from(tracksByLanguage.values())
    console.warn('[Audio-Metadata-Fetch] Tracks after deduplication:', deduplicated.length)

    // Step 3: Sort tracks by priority
    console.warn('[Audio-Metadata-Fetch] Step 3: Sorting tracks by priority')
    console.warn('[Audio-Metadata-Fetch] Sort priority: 1) Original, 2) System language (' + systemLanguage + '), 3) Alphabetically')

    const originalTracks = []
    const systemLanguageTracks = []
    const otherTracks = []

    const systemLangCode = systemLanguage ? systemLanguage.split('-')[0].toLowerCase() : 'en'

    deduplicated.forEach(track => {
      const trackLangCode = track.languageCode ? track.languageCode.split('-')[0].toLowerCase() : 'und'

      if (track.isOriginal) {
        console.warn(`[Audio-Metadata-Fetch] Original track: ${track.languageCode} (${track.languageName})`)
        originalTracks.push(track)
      } else if (trackLangCode === systemLangCode) {
        console.warn(`[Audio-Metadata-Fetch] System language track: ${track.languageCode} (${track.languageName})`)
        systemLanguageTracks.push(track)
      } else {
        otherTracks.push(track)
      }
    })

    // Sort "other" tracks alphabetically by language name
    otherTracks.sort((a, b) => {
      const nameA = a.languageName || ''
      const nameB = b.languageName || ''
      return nameA.localeCompare(nameB)
    })

    const sortedTracks = [...originalTracks, ...systemLanguageTracks, ...otherTracks]

    console.warn('[Audio-Metadata-Fetch] Final sorted track order:', sortedTracks.map((t, index) => ({
      position: index + 1,
      language: t.languageCode,
      name: t.languageName,
      isOriginal: t.isOriginal,
      source: t.source
    })))

    console.warn('[Audio-Metadata-Fetch] Step 4: Committing to store')
    commit('setAudioTracks', sortedTracks)
    commit('setSelectedAudioTrackId', null)
    commit('setCurrentVideoId', videoId)

    console.warn('[Audio-Metadata-Fetch] Audio track collection complete')
  },

  /**
   * Clear audio tracks from the store
   * @param {object} param0 - Vuex context
   * @param {Function} param0.commit - Vuex commit function
   */
  clearAudioTracks({ commit }) {
    console.warn('[Audio-Metadata-Fetch] Clearing audio tracks')
    commit('setAudioTracks', [])
    commit('setCurrentVideoId', null)
    commit('setSelectedAudioTrackId', null)
  },

  async switchAudioTrack({ state, commit }, audioTrackId) {
    console.warn('[Audio-Switch-Request] Requested audio track switch:', {
      audioTrackId,
      currentVideoId: state.currentVideoId,
      availableTracks: state.audioTracks.length
    })

    if (!audioTrackId) {
      console.warn('[Audio-Switch-Invalid] Missing audioTrackId payload')
      return { success: false, reason: 'missing-id' }
    }

    if (!Array.isArray(state.audioTracks) || state.audioTracks.length === 0) {
      console.warn('[Audio-Switch-Empty] No audio tracks available in store')
      return { success: false, reason: 'no-tracks' }
    }

    const targetTrack = state.audioTracks.find(track => track.id === audioTrackId)

    if (!targetTrack) {
      console.warn('[Audio-Switch-MissingTrack] Track not found for id:', audioTrackId)
      return { success: false, reason: 'track-not-found' }
    }

    if (!targetTrack.url) {
      const lang = targetTrack.languageName || targetTrack.languageCode || audioTrackId
      console.warn(`[Audio-Switch-NoURL] Cannot switch to ${lang}: no URL available`)
      showToast('This audio track cannot be played (no URL available)')
      return { success: false, reason: 'no-url', track: targetTrack }
    }

    if (state.selectedAudioTrackId === audioTrackId) {
      console.warn('[Audio-Switch-Noop] Track already selected, skipping switch')
      return { success: false, reason: 'already-selected', track: targetTrack }
    }

    commit('setSelectedAudioTrackId', audioTrackId)

    console.warn('[Audio-Switch-WithURL] Ready to switch audio track:', {
      language: targetTrack.languageCode,
      source: targetTrack.source,
      bitrate: targetTrack.bitrate
    })

    return { success: true, track: targetTrack }
  }
}

const mutations = {
  setAudioTracks(state, tracks) {
    state.audioTracks = tracks
  },

  setCurrentVideoId(state, videoId) {
    state.currentVideoId = videoId
  },

  setSelectedAudioTrackId(state, audioTrackId) {
    state.selectedAudioTrackId = audioTrackId
  }
}

export default {
  state,
  getters,
  actions,
  mutations
}
