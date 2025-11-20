import shaka from 'shaka-player'

import i18n from '../../../i18n/index'
import { PlayerIcons } from '../../../../constants'

export class CustomSubtitleButton extends shaka.ui.SettingsMenu {
  /**
   * @param {EventTarget} events
   * @param {!HTMLElement} parent
   * @param {!shaka.ui.Controls} controls
   */
  constructor(events, parent, controls) {
    super(parent, controls, PlayerIcons.TUNE_FILLED)

    this.button.classList.add('custom-subtitle-button', 'shaka-tooltip')
    this.menu.classList.add('custom-subtitle-menu')

    /** @private */
    this.events_ = events

    // Replace icon with "LS" icon
    const iconElement = this.button.querySelector('.material-icons-round')
    if (iconElement) {
      iconElement.remove()
    }

    /** @private */
    this.labelSpan_ = document.createElement('span')
    this.labelSpan_.classList.add('ft-custom-subtitle-icon')
    this.labelSpan_.textContent = 'LS'
    this.labelSpan_.setAttribute('aria-hidden', 'true')
    this.button.insertBefore(this.labelSpan_, this.button.firstChild)

    // Create menu items
    this.createMenuItems_()

    // listeners

    this.eventManager.listen(events, 'localeChanged', () => {
      this.updateLocalisedStrings_()
    })

    this.updateLocalisedStrings_()
  }

  /** @private */
  createMenuItems_() {
    const menu = this.menu
    const backButton = menu.querySelector('.shaka-back-to-overflow-button')

    // Clear existing items
    while (menu.firstChild) {
      menu.removeChild(menu.firstChild)
    }

    menu.appendChild(backButton)

    // Upload Subtitles button
    const uploadButton = document.createElement('button')
    uploadButton.classList.add('custom-subtitle-upload-button')

    const uploadLabel = document.createElement('label')
    uploadLabel.classList.add('shaka-overflow-button-label')

    /** @private */
    this.uploadSpan_ = document.createElement('span')
    uploadLabel.appendChild(this.uploadSpan_)

    uploadButton.appendChild(uploadLabel)

    this.eventManager.listen(uploadButton, 'click', () => {
      this.onUploadSubtitles_()
    })

    menu.appendChild(uploadButton)

    // Toggle Subtitle Settings button
    const settingsButton = document.createElement('button')
    settingsButton.classList.add('custom-subtitle-settings-button')

    const settingsLabel = document.createElement('label')
    settingsLabel.classList.add('shaka-overflow-button-label')

    /** @private */
    this.settingsSpan_ = document.createElement('span')
    settingsLabel.appendChild(this.settingsSpan_)

    settingsButton.appendChild(settingsLabel)

    this.eventManager.listen(settingsButton, 'click', () => {
      this.onToggleSubtitleSettings_()
    })

    menu.appendChild(settingsButton)
  }

  /** @private */
  onUploadSubtitles_() {
    this.events_.dispatchEvent(new CustomEvent('ft-upload-subtitle'))
  }

  /** @private */
  onToggleSubtitleSettings_() {
    this.events_.dispatchEvent(new CustomEvent('ft-toggle-subtitle-settings'))
  }

  /** @private */
  updateLocalisedStrings_() {
    const customSubtitleText = i18n.t('Video.Player.Upload Subtitles')

    this.button.ariaLabel = customSubtitleText
    this.nameSpan.textContent = customSubtitleText
    this.backButton.ariaLabel = this.localization.resolve('BACK')
    this.backSpan.textContent = customSubtitleText

    if (this.uploadSpan_) {
      this.uploadSpan_.textContent = i18n.t('Video.Player.Upload Subtitles')
    }

    if (this.settingsSpan_) {
      this.settingsSpan_.textContent = i18n.t('Settings.Settings')
    }
  }
}
