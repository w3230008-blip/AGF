import { defineComponent } from 'vue'
import { hexToRgba } from '../../helpers/colors'

export default defineComponent({
  name: 'FtCustomProgressBar',
  props: {
    currentTime: {
      type: Number,
      default: 0
    },
    duration: {
      type: Number,
      default: 0
    },
    bufferedTime: {
      type: Number,
      default: 0
    },
    chapters: {
      type: Array,
      default: () => []
    },
    enabled: {
      type: Boolean,
      default: true
    }
  },
  emits: ['seek'],
  data() {
    return {
      isHovering: false,
      hoverPosition: 0,
      hoverTime: 0
    }
  },
  computed: {
    // Settings
    mainColor() {
      return this.$store.getters.getCustomProgressBarMainColor || '#e74c3c'
    },
    hoverColor() {
      return this.$store.getters.getCustomProgressBarHoverColor || '#c0392b'
    },
    backgroundColor() {
      return this.$store.getters.getCustomProgressBarBackgroundColor || 'rgba(255, 255, 255, 0.2)'
    },
    bufferedColor() {
      return this.$store.getters.getCustomProgressBarBufferedColor || 'rgba(255, 255, 255, 0.4)'
    },
    opacity() {
      return this.$store.getters.getCustomProgressBarOpacity ?? 0.9
    },
    height() {
      return this.$store.getters.getCustomProgressBarHeight || 6
    },
    showChapterMarkers() {
      return this.$store.getters.getCustomProgressBarShowChapterMarkers ?? true
    },
    progressOpacity() {
      return (this.$store.getters.getCustomProgressBarProgressOpacity ?? 100) / 100
    },
    bufferOpacity() {
      return (this.$store.getters.getCustomProgressBarBufferOpacity ?? 100) / 100
    },
    unbufferedOpacity() {
      return (this.$store.getters.getCustomProgressBarUnbufferedOpacity ?? 100) / 100
    },
    position() {
      return this.$store.getters.getCustomProgressBarPosition ?? 0
    },

    // Calculated values
    progressPercentage() {
      if (this.duration === 0) return 0
      return Math.min(100, (this.currentTime / this.duration) * 100)
    },
    bufferedPercentage() {
      if (this.duration === 0) return 0
      return Math.min(100, (this.bufferedTime / this.duration) * 100)
    },
    hoverPercentage() {
      return this.hoverPosition * 100
    },

    // Styles
    containerStyle() {
      return {
        opacity: this.opacity,
        height: `${this.height + 4}px`,
        padding: '2px 0',
        bottom: `${this.position}px`
      }
    },
    trackStyle() {
      const bgColor = this.applyOpacityToColor(this.backgroundColor, this.unbufferedOpacity)
      return {
        backgroundColor: bgColor,
        height: `${this.height}px`
      }
    },
    progressStyle() {
      return {
        width: `${this.progressPercentage}%`,
        backgroundColor: this.mainColor,
        height: '100%',
        opacity: this.progressOpacity
      }
    },
    bufferedStyle() {
      return {
        width: `${this.bufferedPercentage}%`,
        backgroundColor: this.bufferedColor,
        height: '100%',
        opacity: this.bufferOpacity
      }
    },
    hoverStyle() {
      return {
        width: `${this.hoverPercentage}%`,
        backgroundColor: this.hoverColor,
        height: '100%',
        opacity: 0.5
      }
    },
    handleStyle() {
      return {
        left: `${this.progressPercentage}%`,
        backgroundColor: this.mainColor,
        width: '12px',
        height: '12px'
      }
    },
    tooltipStyle() {
      const left = this.hoverPosition * 100
      return {
        left: `${left}%`,
        transform: 'translateX(-50%)',
        bottom: `${this.height + 10}px`
      }
    },
    tooltipText() {
      if (!this.isHovering) return ''

      const time = this.formatTime(this.hoverTime)

      // Find chapter at hover position
      const chapter = this.getChapterAtTime(this.hoverTime)
      if (chapter && chapter.title) {
        return `${time} - ${chapter.title}`
      }

      return time
    }
  },
  methods: {
    handleMouseEnter() {
      this.isHovering = true
    },
    handleMouseLeave() {
      this.isHovering = false
    },
    handleMouseMove(event) {
      if (!this.$refs.progressBarContainer) return

      const rect = this.$refs.progressBarContainer.getBoundingClientRect()
      const x = event.clientX - rect.left
      const position = Math.max(0, Math.min(1, x / rect.width))

      this.hoverPosition = position
      this.hoverTime = position * this.duration
    },
    handleClick(event) {
      if (!this.$refs.progressBarContainer) return

      const rect = this.$refs.progressBarContainer.getBoundingClientRect()
      const x = event.clientX - rect.left
      const position = Math.max(0, Math.min(1, x / rect.width))
      const seekTime = position * this.duration

      this.$emit('seek', seekTime)
    },
    formatTime(seconds) {
      if (isNaN(seconds) || seconds === Infinity) {
        return '0:00'
      }

      const hours = Math.floor(seconds / 3600)
      const minutes = Math.floor((seconds % 3600) / 60)
      const secs = Math.floor(seconds % 60)

      if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      }
      return `${minutes}:${secs.toString().padStart(2, '0')}`
    },
    getChapterAtTime(time) {
      if (!this.chapters || this.chapters.length === 0) return null

      // Find the chapter that contains this time
      for (let i = this.chapters.length - 1; i >= 0; i--) {
        const chapterStartTime = this.chapters[i].startTime ?? this.chapters[i].startSeconds ?? 0
        if (time >= chapterStartTime) {
          return this.chapters[i]
        }
      }

      return this.chapters[0]
    },
    getChapterMarkerStyle(chapter) {
      const chapterStartTime = chapter.startTime ?? chapter.startSeconds ?? 0
      const percentage = (chapterStartTime / this.duration) * 100
      return {
        left: `${percentage}%`,
        backgroundColor: this.hoverColor
      }
    },
    handleKeyLeft() {
      // Seek backward 5 seconds
      const newTime = Math.max(0, this.currentTime - 5)
      this.$emit('seek', newTime)
    },
    handleKeyRight() {
      // Seek forward 5 seconds
      const newTime = Math.min(this.duration, this.currentTime + 5)
      this.$emit('seek', newTime)
    },
    applyOpacityToColor(color, opacity) {
      if (color.startsWith('rgba')) {
        const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/)
        if (match) {
          return `rgba(${match[1]}, ${match[2]}, ${match[3]}, ${opacity})`
        }
      } else if (color.startsWith('rgb')) {
        const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
        if (match) {
          return `rgba(${match[1]}, ${match[2]}, ${match[3]}, ${opacity})`
        }
      } else if (color.startsWith('#')) {
        return hexToRgba(color, opacity)
      }
      return color
    }
  }
})
