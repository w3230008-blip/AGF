import shaka from 'shaka-player'

export class ChapterNavigationButtons extends shaka.ui.Element {
  /**
   * @param {Function} onPrevChapter - Callback for previous chapter
   * @param {Function} onNextChapter - Callback for next chapter
   * @param {HTMLElement} parent
   * @param {shaka.ui.Controls} controls
   */
  constructor(onPrevChapter, onNextChapter, parent, controls) {
    super(parent, controls)

    /** @private */
    this.onPrevChapter_ = onPrevChapter

    /** @private */
    this.onNextChapter_ = onNextChapter

    /** @private */
    this.container_ = document.createElement('div')
    this.container_.classList.add('chapter-navigation-buttons-container')

    // Previous chapter button
    const prevChapterButton = document.createElement('button')
    prevChapterButton.classList.add('chapter-navigation-button', 'shaka-tooltip')
    prevChapterButton.textContent = '⟨⟨'
    prevChapterButton.title = 'Previous chapter (Ctrl+←)'
    prevChapterButton.ariaLabel = 'Previous chapter'

    this.eventManager.listen(prevChapterButton, 'click', () => {
      this.onPrevChapter_()
    })

    // Next chapter button
    const nextChapterButton = document.createElement('button')
    nextChapterButton.classList.add('chapter-navigation-button', 'shaka-tooltip')
    nextChapterButton.textContent = '⟩⟩'
    nextChapterButton.title = 'Next chapter (Ctrl+→)'
    nextChapterButton.ariaLabel = 'Next chapter'

    this.eventManager.listen(nextChapterButton, 'click', () => {
      this.onNextChapter_()
    })

    this.container_.appendChild(prevChapterButton)
    this.container_.appendChild(nextChapterButton)
    this.parent.appendChild(this.container_)
  }
}
