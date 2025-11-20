import shaka from 'shaka-player'

import i18n from '../../../i18n/index'
import { PlayerIcons } from '../../../../constants'
import router from '../../../router/index'

export class CaptionSettingsButton extends shaka.ui.Element {
  /**
   * @param {EventTarget} events
   * @param {HTMLElement} parent
   * @param {shaka.ui.Controls} controls
   */
  constructor(events, parent, controls) {
    super(parent, controls)

    try {
      /** @private */
      this.events_ = events

      /** @private */
      this.button_ = document.createElement('button')
      this.button_.classList.add('caption-settings-button', 'shaka-tooltip')

      /** @private */
      this.icon_ = new shaka.ui.MaterialSVGIcon(this.button_, PlayerIcons.SETTINGS)

      const label = document.createElement('label')
      label.classList.add(
        'shaka-overflow-button-label',
        'shaka-overflow-menu-only'
      )

      /** @private */
      this.nameSpan_ = document.createElement('span')
      label.appendChild(this.nameSpan_)

      this.button_.appendChild(label)

      this.parent.appendChild(this.button_)

      this.eventManager.listen(this.button_, 'click', () => {
        this.openCaptionSettings_()
      })

      this.eventManager.listen(events, 'localeChanged', () => {
        this.updateLocalisedStrings_()
      })

      this.updateLocalisedStrings_()
    } catch (error) {
      console.error('CaptionSettingsButton init error:', error)
    }
  }

  /** @private */
  openCaptionSettings_() {
    // Navigate to settings page with query parameter indicating which section to open
    router.push({
      name: 'settings',
      query: {
        section: 'caption-settings'
      }
    })
  }

  /** @private */
  updateLocalisedStrings_() {
    this.nameSpan_.textContent = i18n.t('Settings.Caption Settings.Caption Settings')
    this.button_.ariaLabel = i18n.t('Settings.Caption Settings.Caption Settings')
  }
}
