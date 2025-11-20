import shaka from 'shaka-player'

export class PlaybackSpeedButtons extends shaka.ui.Element {
  /**
   * @param {number} currentPlaybackRate
   * @param {EventTarget} events
   * @param {HTMLElement} parent
   * @param {shaka.ui.Controls} controls
   */
  constructor(currentPlaybackRate, events, parent, controls) {
    super(parent, controls)

    /** @private */
    this.currentPlaybackRate_ = currentPlaybackRate

    /** @private */
    this.events_ = events

    /** @private */
    this.speedButtons_ = []

    const speeds = [1, 1.5, 2]

    /** @private */
    this.container_ = document.createElement('div')
    this.container_.classList.add('playback-speed-buttons-container')

    speeds.forEach(speed => {
      const button = document.createElement('button')
      button.classList.add('playback-speed-button', 'shaka-tooltip')
      button.setAttribute('data-speed', speed)
      button.textContent = `${speed}×`
      button.ariaLabel = `Set playback speed to ${speed}x`

      this.eventManager.listen(button, 'click', () => {
        this.setPlaybackSpeed_(speed)
      })

      this.container_.appendChild(button)
      this.speedButtons_.push({ button, speed })
    })

    this.parent.appendChild(this.container_)

    this.eventManager.listen(this.video, 'ratechange', () => {
      this.currentPlaybackRate_ = this.video.playbackRate
      this.updateActiveButton_()
      this.events_.dispatchEvent(new CustomEvent('playbackRateChanged', {
        detail: this.currentPlaybackRate_
      }))
    })

    this.updateActiveButton_()
  }

  /**
   * @param {number} speed
   * @private
   */
  setPlaybackSpeed_(speed) {
    const video = this.video
    if (video) {
      video.playbackRate = speed
    }
  }

  /** @private */
  updateActiveButton_() {
    this.speedButtons_.forEach(({ button, speed }) => {
      if (Math.abs(speed - this.currentPlaybackRate_) < 0.01) {
        button.classList.add('active')
        button.setAttribute('aria-pressed', 'true')
      } else {
        button.classList.remove('active')
        button.setAttribute('aria-pressed', 'false')
      }
    })
  }
}
