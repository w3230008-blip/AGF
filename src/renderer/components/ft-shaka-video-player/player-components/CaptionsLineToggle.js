import shaka from 'shaka-player'

import i18n from '../../../i18n/index'
import { PlayerIcons } from '../../../../constants'

export class CaptionsLineToggle extends shaka.ui.Element {
  /**
   * @param {string} captionLineMode
   * @param {EventTarget} events
   * @param {HTMLElement} parent
   * @param {shaka.ui.Controls} controls
   */
  constructor(captionLineMode, events, parent, controls) {
    super(parent, controls)

    try {
      /** @private */
      this.events_ = events

      /** @private */
      this.button_ = document.createElement('button')
      this.button_.classList.add('captions-line-toggle', 'shaka-tooltip')

      /** @private */
      this.icon_ = new shaka.ui.MaterialSVGIcon(this.button_, PlayerIcons.TUNE_FILLED)

      const label = document.createElement('label')
      label.classList.add(
        'shaka-overflow-button-label',
        'shaka-overflow-menu-only',
        'shaka-simple-overflow-button-label-inline'
      )

      /** @private */
      this.nameSpan_ = document.createElement('span')
      label.appendChild(this.nameSpan_)

      /** @private */
      this.currentState_ = document.createElement('span')
      this.currentState_.classList.add('shaka-current-selection-span')
      label.appendChild(this.currentState_)

      this.button_.appendChild(label)

      this.parent.appendChild(this.button_)

      /** @private */
      this.captionLineMode_ = captionLineMode

      this.eventManager.listen(this.button_, 'click', () => {
        const newMode = this.captionLineMode_ === '1' ? '2' : '1'

        events.dispatchEvent(new CustomEvent('setCaptionLineMode', {
          detail: newMode
        }))
      })

      const handleCaptionLineModeChange = (/** @type {CustomEvent} */ event) => {
        this.captionLineMode_ = event.detail
        this.updateLocalisedStrings_()
      }

      this.eventManager.listen(events, 'setCaptionLineMode', handleCaptionLineModeChange)

      this.eventManager.listen(events, 'localeChanged', () => {
        this.updateLocalisedStrings_()
      })

      this.updateLocalisedStrings_()
    } catch (error) {
      console.error('CaptionsLineToggle init error:', error)
    }
  }

  /** @private */
  updateLocalisedStrings_() {
    this.nameSpan_.textContent = i18n.t('Video.Player.Caption Line Mode')

    const stateText = this.captionLineMode_ === '1'
      ? i18n.t('Video.Player.1 Line')
      : i18n.t('Video.Player.2 Lines')

    this.currentState_.textContent = stateText

    const ariaLabel = this.captionLineMode_ === '1'
      ? i18n.t('Video.Player.Caption line mode is set to 1 line')
      : i18n.t('Video.Player.Caption line mode is set to 2 lines')

    this.button_.ariaLabel = ariaLabel
  }
}
