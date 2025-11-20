import shaka from 'shaka-player'

import i18n from '../../../i18n/index'
import { KeyboardShortcuts } from '../../../../constants'
import { addKeyboardShortcutToActionTitle } from '../../../helpers/utils'

const CLOSED_CAPTION_FILLED = 'M200-160q-33 0-56.5-23.5T120-240v-480q0-33 23.5-56.5T200-800h560q33 0 56.5 23.5T840-720v480q0 33-23.5 56.5T760-160H200Zm80-200h120q17 0 28.5-11.5T440-400v-20q0-9-6-15t-15-6h-18q-9 0-15 6t-6 15h-80v-120h80q0 9 6 15t15 6h18q9 0 15-6t6-15v-20q0-17-11.5-28.5T400-600H280q-17 0-28.5 11.5T240-560v160q0 17 11.5 28.5T280-360Zm400-240H560q-17 0-28.5 11.5T520-560v160q0 17 11.5 28.5T560-360h120q17 0 28.5-11.5T720-400v-20q0-9-6-15t-15-6h-18q-9 0-15 6t-6 15h-80v-120h80q0 9 6 15t15 6h18q9 0 15-6t6-15v-20q0-17-11.5-28.5T680-600Z'

const CLOSED_CAPTION_DISABLED_FILLED = 'M791-57 687-160H200q-33 0-56.5-23.5T120-240v-487l-65-65q-12-12-12-28.5T55-849q12-12 28.5-12t28.5 12l736 736q12 12 12 28t-12 28q-12 12-28.5 12T791-57ZM280-360h120q17 0 28.5-11.5T440-400v-25q0-8-6-14t-14-6h-20q-8 0-14 6t-6 14v5h-80v-127l-45-45v1q-7 5-11 13t-4 18v160q0 17 11.5 28.5T280-360Zm560-360v388q0 27-24.5 37.5T772-303l-66-66q7-5 10.5-13.5T720-400v-20q0-8-6-14t-14-6h-20q-8 0-14 6t-6 14h-5l-75-75v-45h80v5q0 8 6 14t14 6h20q8 0 14-6t6-14v-25q0-17-11.5-28.5T680-600H560q-17 0-28.5 11.5T520-560v5L343-732q-19-19-8.5-43.5T372-800h388q33 0 56.5 23.5T840-720Z'

export class SubtitleToggleButton extends shaka.ui.Element {
  /**
   * @param {EventTarget} events
   * @param {HTMLElement} parent
   * @param {shaka.ui.Controls} controls
   */
  constructor(events, parent, controls) {
    super(parent, controls)

    /** @private */
    this.button_ = document.createElement('button')
    this.button_.classList.add('subtitle-toggle-button', 'shaka-tooltip')

    /** @private */
    this.icon_ = new shaka.ui.MaterialSVGIcon(this.button_, CLOSED_CAPTION_FILLED)

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

    // listeners

    this.eventManager.listen(this.button_, 'click', () => {
      const player = this.controls.getPlayer()
      if (player.getTextTracks().length > 0) {
        const currentlyVisible = player.isTextTrackVisible()
        player.setTextTrackVisibility(!currentlyVisible)
      }
    })

    this.eventManager.listen(this.player, 'texttrackvisibility', () => {
      this.updateDisplay_()
    })

    this.eventManager.listen(this.player, 'textchanged', () => {
      this.updateDisplay_()
    })

    this.eventManager.listen(events, 'localeChanged', () => {
      this.updateLocalisedStrings_()
    })

    this.updateLocalisedStrings_()
    this.updateDisplay_()
  }

  /** @private */
  updateDisplay_() {
    const player = this.controls.getPlayer()
    const hasTextTracks = player.getTextTracks().length > 0
    const isVisible = player.isTextTrackVisible()

    // Update button enabled/disabled state
    if (!hasTextTracks) {
      this.button_.disabled = true
    } else {
      this.button_.disabled = false
    }

    // Update icon
    this.icon_.use(isVisible ? CLOSED_CAPTION_FILLED : CLOSED_CAPTION_DISABLED_FILLED)

    // Update state text for overflow menu
    this.currentState_.textContent = this.localization.resolve(isVisible ? 'ON' : 'OFF')

    // Update aria label
    this.button_.ariaLabel = isVisible
      ? i18n.t('Video.Player.Subtitles are on')
      : i18n.t('Video.Player.Subtitles are off')
  }

  /** @private */
  updateLocalisedStrings_() {
    const label = addKeyboardShortcutToActionTitle(
      i18n.t('Video.Subtitles'),
      KeyboardShortcuts.VIDEO_PLAYER.GENERAL.CAPTIONS
    )
    this.nameSpan_.textContent = label
    this.updateDisplay_()
  }
}
