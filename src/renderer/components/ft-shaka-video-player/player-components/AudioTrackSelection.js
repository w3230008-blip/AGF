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

    console.warn('[AudioTrackSelection] Initialized with available languages:', availableAudioLanguages)

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

    console.warn('[AudioTrackSelection] Loaded tracks from player:', loadedTracks.map(t => ({
      language: t.language,
      label: t.label,
      active: t.active
    })))

    // If we have available languages from metadata, use those; otherwise fall back to loaded tracks
    const languagesToDisplay = this._availableAudioLanguages && this._availableAudioLanguages.length > 0
      ? this._availableAudioLanguages
      : loadedTracks.map(t => t.language)

    console.warn('[AudioTrackSelection] Languages to display:', languagesToDisplay)

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

    let count = 0

    // Create menu items for each language
    for (const language of sortedLanguages) {
      // Check if this language is currently loaded and active
      const loadedTrack = loadedTracks.find(t => t.language === language)
      const isActive = loadedTrack?.active || false

      const button = document.createElement('button')
      button.addEventListener('click', () => {
        if (loadedTrack) {
          // Language is already loaded, just switch to it
          this.onAudioTrackSelected_(loadedTrack)
        } else {
          // Language not loaded yet - need to fetch it dynamically
          console.warn(`[AudioTrackSelection] User selected unloaded language: ${language}`)
          // TODO: Implement dynamic audio fetching
          // For now, just log a message
          console.warn('[AudioTrackSelection] Dynamic audio fetching not yet implemented')
        }
      })

      const span = document.createElement('span')
      button.appendChild(span)

      // Get full language name
      const languageName = loadedTrack?.label || getLanguageName(language)
      span.textContent = languageName

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

    menu.querySelector('.shaka-chosen-item')?.parentElement.focus()

    this.button.setAttribute('shaka-status', this.currentSelection.innerText)

    // Show button when multiple tracks are available
    if (count > 1) {
      this.button.classList.remove('shaka-hidden')
      console.warn(`[AudioTrackSelection] Showing audio track button (${count} languages available)`)
    } else {
      this.button.classList.add('shaka-hidden')
      console.warn('[AudioTrackSelection] Hiding audio track button (only 1 language)')
    }
  }

  /**
   * @param {shaka.extern.AudioTrack} track
   * @private
   */
  onAudioTrackSelected_(track) {
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

    // Update language code display
    const langCode = getLanguageCodeShort(track.language)
    this._languageCodeSpan.textContent = langCode

    console.warn('[AudioTrackSelection] Audio track switched successfully')
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
