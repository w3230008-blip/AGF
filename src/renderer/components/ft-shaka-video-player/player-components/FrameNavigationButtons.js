import shaka from 'shaka-player'

export class FrameNavigationButtons extends shaka.ui.Element {
  /**
   * @param {Function} onFrameBack - Callback for frame back
   * @param {Function} onFrameForward - Callback for frame forward
   * @param {HTMLElement} parent
   * @param {shaka.ui.Controls} controls
   */
  constructor(onFrameBack, onFrameForward, parent, controls) {
    super(parent, controls)

    /** @private */
    this.onFrameBack_ = onFrameBack

    /** @private */
    this.onFrameForward_ = onFrameForward

    /** @private */
    this.container_ = document.createElement('div')
    this.container_.classList.add('frame-navigation-buttons-container')

    // Frame back button
    const frameBackButton = document.createElement('button')
    frameBackButton.classList.add('frame-navigation-button', 'shaka-tooltip')
    frameBackButton.textContent = '⏮'
    frameBackButton.title = 'Previous frame (,)'
    frameBackButton.ariaLabel = 'Previous frame'

    this.eventManager.listen(frameBackButton, 'click', () => {
      this.onFrameBack_()
    })

    // Frame forward button
    const frameForwardButton = document.createElement('button')
    frameForwardButton.classList.add('frame-navigation-button', 'shaka-tooltip')
    frameForwardButton.textContent = '⏭'
    frameForwardButton.title = 'Next frame (.)'
    frameForwardButton.ariaLabel = 'Next frame'

    this.eventManager.listen(frameForwardButton, 'click', () => {
      this.onFrameForward_()
    })

    this.container_.appendChild(frameBackButton)
    this.container_.appendChild(frameForwardButton)
    this.parent.appendChild(this.container_)
  }
}
