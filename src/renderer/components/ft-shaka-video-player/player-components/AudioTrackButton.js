import shaka from 'shaka-player'

import { getLanguageCodeShort, getLanguageName } from '../../../helpers/player/audio-track-utils'

export class AudioTrackButton extends shaka.ui.Element {
  /**
   * @param {Array} audioTracks - Array of audio track objects
   * @param {object} currentAudioTrack - Currently active audio track
   * @param {Function} onAudioTrackChange - Callback for audio track change
   * @param {HTMLElement} parent
   * @param {shaka.ui.Controls} controls
   * @param {Array} availableAudioLanguages - Array of all available language codes (13 languages)
   */
  constructor(audioTracks, currentAudioTrack, onAudioTrackChange, parent, controls, availableAudioLanguages = []) {
    super(parent, controls)

    /** @private */
    this.audioTracks_ = audioTracks || []
    /** @private */
    this.currentAudioTrack_ = currentAudioTrack
    /** @private */
    this.onAudioTrackChange_ = onAudioTrackChange
    /** @private */
    this.availableAudioLanguages_ = availableAudioLanguages || []

    /** @private */
    this.container_ = document.createElement('div')
    this.container_.classList.add('audio-track-button-container')

    /** @private */
    this.button_ = document.createElement('button')
    this.button_.classList.add('audio-track-button', 'shaka-tooltip')
    this.button_.title = 'Audio tracks (Alt+A)'
    this.button_.ariaLabel = 'Audio tracks'

    // Create icon and language code span
    this.iconSpan_ = document.createElement('span')
    this.iconSpan_.classList.add('audio-track-icon')
    this.iconSpan_.textContent = '🔊'

    this.languageCodeSpan_ = document.createElement('span')
    this.languageCodeSpan_.classList.add('audio-track-language-code')

    this.button_.appendChild(this.iconSpan_)
    this.button_.appendChild(this.languageCodeSpan_)

    // Create dropdown menu
    this.dropdown_ = document.createElement('div')
    this.dropdown_.classList.add('audio-track-dropdown')
    this.dropdown_.style.display = 'none'

    this.eventManager.listen(this.button_, 'click', () => {
      console.warn('[Audio-Button-Click] Audio track button clicked')
      this.toggleDropdown_()
    })

    // Close dropdown when clicking outside
    this.eventManager.listen(document, 'click', (event) => {
      if (!this.container_.contains(event.target)) {
        this.closeDropdown_()
      }
    })

    // Listen for player track changes
    if (controls && controls.getPlayer) {
      const player = controls.getPlayer()
      if (player) {
        this.eventManager.listen(player, 'trackschanged', () => {
          this.updateFromPlayer_()
        })
        this.eventManager.listen(player, 'variantchanged', () => {
          this.updateFromPlayer_()
        })
      }
    }

    this.container_.appendChild(this.button_)
    this.container_.appendChild(this.dropdown_)
    this.parent.appendChild(this.container_)

    this.updateButton_()
    this.updateDropdown_()
  }

  /**
   * Update audio tracks data
   * @param {Array} audioTracks - New audio tracks array
   * @param {object} currentAudioTrack - New current audio track
   * @param {Array} availableAudioLanguages - New available audio languages array
   */
  updateAudioTracks(audioTracks, currentAudioTrack, availableAudioLanguages = null) {
    this.audioTracks_ = audioTracks || []
    this.currentAudioTrack_ = currentAudioTrack
    if (availableAudioLanguages !== null) {
      this.availableAudioLanguages_ = availableAudioLanguages
    }
    this.updateButton_()
    this.updateDropdown_()
  }

  /**
   * @private
   * Update audio tracks from player
   */
  updateFromPlayer_() {
    if (this.controls && this.controls.getPlayer) {
      const player = this.controls.getPlayer()
      if (player) {
        const audioTracks = player.getAudioTracks()
        const currentAudioTrack = audioTracks.find(track => track.active) || null
        this.updateAudioTracks(audioTracks, currentAudioTrack)
      }
    }
  }

  /**
   * @private
   */
  updateButton_() {
    // Show button if there are multiple audio tracks OR multiple available languages
    const totalLanguages = Math.max(this.audioTracks_.length, this.availableAudioLanguages_.length)
    if (totalLanguages <= 1) {
      this.container_.style.display = 'none'
      return
    }

    this.container_.style.display = 'flex'

    // Update language code display
    if (this.currentAudioTrack_) {
      const langCode = getLanguageCodeShort(this.currentAudioTrack_.language)
      this.languageCodeSpan_.textContent = langCode
    } else {
      this.languageCodeSpan_.textContent = '??'
    }
  }

  /**
   * @private
   */
  updateDropdown_() {
    // Clear existing dropdown content
    while (this.dropdown_.firstChild) {
      this.dropdown_.removeChild(this.dropdown_.firstChild)
    }

    // Determine which languages to show
    let languagesToShow = []
    if (this.availableAudioLanguages_.length > 0) {
      languagesToShow = this.availableAudioLanguages_
    } else {
      // Fallback to loaded tracks if no available languages specified
      languagesToShow = this.audioTracks_.map(track => track.language)
    }

    const totalLanguages = languagesToShow.length
    if (totalLanguages <= 1) {
      return
    }

    console.warn(`[Audio-Menu-Render] Rendering ${totalLanguages} languages in menu`)

    const unavailableLanguages = []
    let renderedCount = 0

    // Create menu items for each language
    languagesToShow.forEach((languageCode, index) => {
      const trackButton = document.createElement('button')
      trackButton.classList.add('audio-track-option')

      // Find if this language has a loaded track
      const loadedTrack = this.audioTracks_.find(track =>
        track.language && track.language.split('-')[0].toLowerCase() === languageCode.split('-')[0].toLowerCase()
      )

      // Check if this is the current track
      const isCurrentTrack = this.currentAudioTrack_ &&
        loadedTrack &&
        this.currentAudioTrack_.language === loadedTrack.language

      // Create language name container
      const trackName = document.createElement('span')
      trackName.classList.add('audio-track-name')

      // Get full language name
      const languageName = getLanguageName(languageCode)
      trackName.textContent = languageName

      // Add language code on the right
      const langCodeSpan = document.createElement('span')
      langCodeSpan.classList.add('audio-track-lang-code')
      langCodeSpan.textContent = ` (${getLanguageCodeShort(languageCode)})`
      trackName.appendChild(langCodeSpan)

      // Add "(Original)" text for original audio track
      if (loadedTrack && loadedTrack.original) {
        const originalSpan = document.createElement('span')
        originalSpan.classList.add('audio-track-original')
        originalSpan.textContent = ' (Original)'
        trackName.appendChild(originalSpan)
      }

      // Add availability indicator
      if (!loadedTrack) {
        const unavailableSpan = document.createElement('span')
        unavailableSpan.classList.add('audio-track-unavailable')
        unavailableSpan.textContent = ' [Unavailable]'
        trackName.appendChild(unavailableSpan)
        trackButton.classList.add('audio-track-disabled')
        trackButton.title = 'Not available (no URL)'
        unavailableLanguages.push(languageCode)
      }

      trackButton.appendChild(trackName)

      // Add checkmark for current track
      if (isCurrentTrack) {
        const checkmark = document.createElement('span')
        checkmark.classList.add('audio-track-checkmark')
        checkmark.textContent = '✓'
        trackButton.appendChild(checkmark)
        trackButton.classList.add('audio-track-active')
      }

      // Add click handler
      this.eventManager.listen(trackButton, 'click', (event) => {
        event.stopPropagation()

        if (!loadedTrack) {
          console.warn(`[Audio-Menu-Click] User clicked unavailable language: ${languageCode}`)
          // Do nothing for unavailable tracks (Option A: disabled)
          return
        }

        console.warn(`[Audio-Menu-Click] User selected available language: ${languageCode}`)
        console.warn(`[Audio-Track-Selected] Selected audio track: ${loadedTrack.language} - ${languageName}`)
        this.onAudioTrackChange_(loadedTrack)
        this.closeDropdown_()
      })

      this.dropdown_.appendChild(trackButton)
      renderedCount++
    })

    console.warn(`[Audio-Menu-Render] Successfully rendered ${renderedCount}/${totalLanguages} languages`)
    if (unavailableLanguages.length > 0) {
      console.warn(`[Audio-Menu-Unavailable] Disabled languages (no URL): [${unavailableLanguages.join(', ')}]`)
    }
  }

  /**
   * @private
   */
  toggleDropdown_() {
    if (this.dropdown_.style.display === 'none') {
      this.openDropdown_()
    } else {
      this.closeDropdown_()
    }
  }

  /**
   * @private
   */
  openDropdown_() {
    this.dropdown_.style.display = 'block'
    this.button_.setAttribute('aria-expanded', 'true')
  }

  /**
   * @private
   */
  closeDropdown_() {
    this.dropdown_.style.display = 'none'
    this.button_.setAttribute('aria-expanded', 'false')
  }

  /**
   * Release event listeners and clean up
   */
  release() {
    super.release()
  }
}
