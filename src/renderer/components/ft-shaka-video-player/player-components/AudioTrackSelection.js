import shaka from 'shaka-player'

import i18n from '../../../i18n/index'
import { deduplicateAudioTracks } from '../../../helpers/player/utils'
import {
  getLanguageCodeShort,
  getLanguageName,
  saveAudioTrackPreference,
  getSystemLanguage
} from '../../../helpers/player/audio-track-utils'
import { PlayerIcons } from '../../../../constants'
import store from '../../../store/index'

export class AudioTrackSelection extends shaka.ui.SettingsMenu {
  /**
   * @param {EventTarget} events
   * @param {!HTMLElement} parent
   * @param {!shaka.ui.Controls} controls
   * @param {string} videoId - YouTube video ID for preference storage
   * @param {string[]} availableAudioLanguages - List of all available audio languages
   */
  constructor(events, parent, controls, videoId = null, availableAudioLanguages = []) {
    super(parent, controls, PlayerIcons.RECORD_VOICE_OVER_FILLED)

    this.button.classList.add('audio-track-button', 'shaka-tooltip-status')
    this.menu.classList.add('audio-tracks')

    /** @private */
    this._videoId = videoId

    /** @private */
    this._availableAudioLanguages = availableAudioLanguages

    /** @private */
    this._events = events

    console.warn('[Audio-Debug-Init] AudioTrackSelection initialized:', {
      videoId,
      availableLanguagesCount: availableAudioLanguages?.length || 0,
      availableLanguages: availableAudioLanguages
    })

    /** @type {SVGElement} */
    const checkmarkIcon = new shaka.ui.MaterialSVGIcon(null, PlayerIcons.DONE_FILLED).getSvgElement()
    checkmarkIcon.classList.add('shaka-chosen-item')
    checkmarkIcon.ariaHidden = 'true'

    /** @private */
    this._checkmarkIcon = checkmarkIcon

    // Create language code display element
    /** @private */
    this._languageCodeSpan = document.createElement('span')
    this._languageCodeSpan.classList.add('audio-track-language-code')
    this._languageCodeSpan.textContent = '??'

    // Replace icon with language code
    const iconElement = this.button.querySelector('.material-icons-round')
    if (iconElement) {
      iconElement.replaceWith(this._languageCodeSpan)
    }

    this.eventManager.listen(events, 'localeChanged', () => {
      this.updateLocalisedStrings_()
    })

    this.eventManager.listen(this.player, 'loading', () => {
      this.updateAudioTracks_()
    })

    this.eventManager.listen(this.player, 'trackschanged', () => {
      this.updateAudioTracks_()
    })

    this.eventManager.listen(this.player, 'variantchanged', () => {
      this.updateAudioTracks_()
    })

    this.eventManager.listen(this.player, 'adaptation', () => {
      this.updateAudioTracks_()
    })

    this.updateLocalisedStrings_()

    this.updateAudioTracks_()
  }

  /**
   * @private
   */
  updateAudioTracks_() {
    // Get currently loaded tracks from Shaka Player
    const loadedTracks = Array.from(deduplicateAudioTracks(this.player.getAudioTracks()).values())

    console.warn('[Audio-Debug-Tracks] Loaded tracks from player:', loadedTracks.map(t => ({
      language: t.language,
      label: t.label,
      active: t.active
    })))

    // Log all tracks available in the store
    const storeAudioTracks = store.getters.getAudioTracks || []
    console.warn('[Audio-Debug-Tracks] Audio tracks in Vuex store:', {
      count: storeAudioTracks.length,
      tracks: storeAudioTracks.map(t => ({
        id: t.id,
        languageCode: t.languageCode,
        hasUrl: !!t.url,
        source: t.source,
        bitrate: t.bitrate
      }))
    })

    // If we have available languages from metadata, use those; otherwise fall back to loaded tracks
    const languagesToDisplay = this._availableAudioLanguages && this._availableAudioLanguages.length > 0
      ? this._availableAudioLanguages
      : loadedTracks.map(t => t.language)

    console.warn('[Audio-Debug-Languages] Languages to display:', languagesToDisplay)
    console.warn('[Audio-Debug-Languages] Source:', this._availableAudioLanguages && this._availableAudioLanguages.length > 0 ? 'availableAudioLanguages prop (metadata)' : 'loaded tracks from player')
    console.warn('[Audio-Debug-Languages] Count:', languagesToDisplay.length)

    const menu = this.menu
    const backButton = menu.querySelector('.shaka-back-to-overflow-button')

    // Clear menu
    while (menu.firstChild) {
      menu.removeChild(menu.firstChild)
    }

    menu.appendChild(backButton)

    // Sort languages by priority
    const systemLanguage = getSystemLanguage()
    const sortedLanguages = [...languagesToDisplay].sort((a, b) => {
      // Original language first (if we can detect it)
      // Then system language
      // Then alphabetically
      if (a === systemLanguage) return -1
      if (b === systemLanguage) return 1
      return a.localeCompare(b)
    })

    console.warn('[Audio-Debug-Filter] Checking for unexpected filtering:', {
      languagesToDisplayCount: languagesToDisplay.length,
      sortedLanguagesCount: sortedLanguages.length,
      filtering: languagesToDisplay.length !== sortedLanguages.length ? 'YES - FOUND FILTER!' : 'NO'
    })

    let count = 0

    console.warn('[Audio-Debug-Mapping] Starting menu item creation for', sortedLanguages.length, 'languages')

    // Create menu items for each language
    for (const language of sortedLanguages) {
      // Check if this language is currently loaded and active
      const loadedTrack = loadedTracks.find(t => t.language === language)
      const isActive = loadedTrack?.active || false
      const trackMetadata = this.getTrackMetadataForLanguage_(language)

      console.warn(`[Audio-Debug-Mapping] Language: ${language}`, {
        hasLoadedTrack: !!loadedTrack,
        loadedTrackLabel: loadedTrack?.label || null,
        isActive: isActive,
        hasMetadata: !!trackMetadata,
        metadataHasUrl: !!trackMetadata?.url,
        metadataSource: trackMetadata?.source || null
      })

      const button = document.createElement('button')
      button.addEventListener('click', () => {
        console.warn(`[Audio-Debug-Click] User clicked language: ${language}`, {
          hasLoadedTrack: !!loadedTrack,
          hasMetadata: !!trackMetadata,
          metadataHasUrl: !!trackMetadata?.url
        })

        if (loadedTrack) {
          // Language is already loaded, just switch to it
          this.onAudioTrackSelected_(loadedTrack, trackMetadata)
        } else if (trackMetadata) {
          console.warn(`[Audio-Debug-Click] User selected unloaded language: ${language}, requesting dynamic audio track`)
          this.requestDynamicAudioTrack_(trackMetadata)
        } else {
          console.warn(`[Audio-Debug-Click] No metadata is available for language ${language}, cannot switch audio track.`)
        }
      })

      const span = document.createElement('span')
      button.appendChild(span)

      // Get full language name
      const languageName = loadedTrack?.label || getLanguageName(language)

      // Add visual indicator for track availability
      let displayName = languageName
      if (!loadedTrack) {
        if (trackMetadata && trackMetadata.url) {
          displayName = `${languageName} [will load]`
        } else {
          displayName = `${languageName} [unavailable]`
        }
      }

      span.textContent = displayName

      // Mark active track
      if (isActive) {
        button.appendChild(this._checkmarkIcon)
        span.classList.add('shaka-chosen-item')
        button.ariaSelected = 'true'
        this.currentSelection.textContent = languageName

        // Update language code on button
        const langCode = getLanguageCodeShort(language)
        this._languageCodeSpan.textContent = langCode
        console.warn('[AudioTrackSelection] Active track:', {
          language,
          languageCode: langCode,
          label: languageName
        })
      }

      menu.appendChild(button)
      count++
    }

    console.warn('[Audio-Debug-Render] Menu rendering complete:', {
      totalLanguagesProcessed: sortedLanguages.length,
      menuItemsCreated: count,
      menuItemsInDOM: menu.querySelectorAll('button:not(.shaka-back-to-overflow-button)').length
    })

    // Summary analysis
    const languagesWithLoadedTrack = sortedLanguages.filter(lang => loadedTracks.find(t => t.language === lang))
    const languagesWithMetadata = sortedLanguages.filter(lang => this.getTrackMetadataForLanguage_(lang))
    const languagesWithUrl = sortedLanguages.filter(lang => {
      const metadata = store.getters.getAudioTracks?.find(t => (t.languageCode || '').toLowerCase() === lang.toLowerCase())
      return metadata && metadata.url
    })

    console.warn('[Audio-Debug-Summary] ========================================')
    console.warn('[Audio-Debug-Summary] AUDIO TRACK DISCREPANCY ANALYSIS')
    console.warn('[Audio-Debug-Summary] ========================================')
    console.warn('[Audio-Debug-Summary] Languages from metadata (availableAudioLanguages):', this._availableAudioLanguages.length)
    console.warn('[Audio-Debug-Summary] Languages list:', this._availableAudioLanguages)
    console.warn('[Audio-Debug-Summary] Tracks loaded in Shaka player:', loadedTracks.length)
    console.warn('[Audio-Debug-Summary] Tracks in Vuex store:', storeAudioTracks.length)
    console.warn('[Audio-Debug-Summary] Languages with loaded track:', languagesWithLoadedTrack.length, languagesWithLoadedTrack)
    console.warn('[Audio-Debug-Summary] Languages with metadata:', languagesWithMetadata.length, languagesWithMetadata)
    console.warn('[Audio-Debug-Summary] Languages with URL:', languagesWithUrl.length, languagesWithUrl)
    console.warn('[Audio-Debug-Summary] Languages WITHOUT loaded track:',
      sortedLanguages.filter(lang => !loadedTracks.find(t => t.language === lang)))
    console.warn('[Audio-Debug-Summary] Languages WITHOUT metadata:',
      sortedLanguages.filter(lang => !this.getTrackMetadataForLanguage_(lang)))
    console.warn('[Audio-Debug-Summary] Languages WITHOUT URL:',
      sortedLanguages.filter(lang => {
        const metadata = store.getters.getAudioTracks?.find(t => (t.languageCode || '').toLowerCase() === lang.toLowerCase())
        return !metadata || !metadata.url
      }))
    console.warn('[Audio-Debug-Summary] ========================================')

    menu.querySelector('.shaka-chosen-item')?.parentElement.focus()

    this.button.setAttribute('shaka-status', this.currentSelection.innerText)

    // Show button when multiple tracks are available
    if (count > 1) {
      this.button.classList.remove('shaka-hidden')
      console.warn(`[Audio-Debug-UI] Showing audio track button (${count} languages available)`)
    } else {
      this.button.classList.add('shaka-hidden')
      console.warn('[Audio-Debug-UI] Hiding audio track button (only 1 language)')
    }
  }

  /**
   * @param {string} language
   * @returns {object|null}
   * @private
   */
  getTrackMetadataForLanguage_(language) {
    if (!language) {
      return null
    }

    const tracks = store.getters.getAudioTracks || []
    const normalizedLanguage = language.toLowerCase()

    const result = tracks.find(track => (track.languageCode || '').toLowerCase() === normalizedLanguage) || null

    console.warn(`[Audio-Debug-Tracks] getTrackMetadataForLanguage_('${language}'):`, {
      normalizedLanguage,
      totalTracksInStore: tracks.length,
      foundMatch: !!result,
      matchDetails: result
        ? {
            id: result.id,
            languageCode: result.languageCode,
            hasUrl: !!result.url,
            source: result.source,
            bitrate: result.bitrate
          }
        : null
    })

    return result
  }

  /**
   * @param {object} trackMetadata
   * @private
   */
  requestDynamicAudioTrack_(trackMetadata) {
    if (!trackMetadata?.id) {
      console.warn('[AudioTrackSelection] Cannot dispatch audio switch request without track metadata id')
      return
    }

    console.warn('[AudioTrackSelection] Dispatching audio track switch request via event bus:', {
      id: trackMetadata.id,
      language: trackMetadata.languageCode,
      hasUrl: !!trackMetadata.url,
      source: trackMetadata.source
    })

    this._events?.dispatchEvent(new CustomEvent('audioTrackSwitchRequested', {
      detail: {
        audioTrackId: trackMetadata.id,
        language: trackMetadata.languageCode
      }
    }))
  }

  /**
   * @param {shaka.extern.AudioTrack} track
   * @param {object|null} trackMetadata
   * @private
   */
  onAudioTrackSelected_(track, trackMetadata = null) {
    console.warn('[AudioTrackSelection] User selected audio track:', {
      language: track.language,
      label: track.label
    })

    track.codecs = null

    this.player.selectAudioTrack(track)

    const config = {
      preferSpatialAudio: track.spatialAudio
    }

    if (track.language !== 'und') {
      config.preferredAudioLanguage = track.language
    }

    if (track.label) {
      config.preferredAudioLabel = track.label
    }

    if (track.channelsCount) {
      config.preferredAudioChannelCount = track.channelsCount
    }

    this.player.configure(config)

    // Save preference
    if (this._videoId && track.language) {
      const langCode = track.language.split('-')[0]
      saveAudioTrackPreference(this._videoId, langCode)
    }

    // Save global last-used audio language preference
    if (track.language && track.language !== 'und') {
      const languageCode = track.language.split('-')[0]
      store.dispatch('updateSelectedAudioLanguageCode', languageCode)
    }

    // Update language code display
    const langCode = getLanguageCodeShort(track.language)
    this._languageCodeSpan.textContent = langCode

    console.warn('[AudioTrackSelection] Audio track switched successfully')

    this.rememberAudioTrackSelection_(track, trackMetadata)
  }

  /**
   * @param {shaka.extern.AudioTrack} track
   * @param {object|null} trackMetadata
   * @private
   */
  rememberAudioTrackSelection_(track, trackMetadata) {
    const metadata = trackMetadata ?? this.getTrackMetadataForLanguage_(track?.language)

    if (!metadata?.id) {
      console.warn('[AudioTrackSelection] Unable to persist audio selection in store - missing metadata')
      return
    }

    store.dispatch('switchAudioTrack', metadata.id)
  }

  /** @private */
  updateLocalisedStrings_() {
    this.backButton.ariaLabel = this.localization.resolve('BACK')

    const audioTracksText = i18n.t('Video.Player.Audio Tracks')

    this.button.ariaLabel = audioTracksText
    this.nameSpan.textContent = audioTracksText
    this.backSpan.textContent = audioTracksText
  }
}
