import { defineComponent } from 'vue'
import { mapActions } from 'vuex'
import FtSettingsSection from '../../../components/FtSettingsSection/FtSettingsSection.vue'
import FtToggleSwitch from '../../../components/FtToggleSwitch/FtToggleSwitch.vue'
import FtSlider from '../../../components/FtSlider/FtSlider.vue'
import { hexToRgba } from '../../../helpers/colors'

export default defineComponent({
  name: 'CustomProgressBarSettings',
  components: {
    'ft-settings-section': FtSettingsSection,
    'ft-toggle-switch': FtToggleSwitch,
    'ft-slider': FtSlider
  },
  computed: {
    customProgressBarEnabled() {
      return this.$store.getters.getCustomProgressBarEnabled
    },
    customProgressBarMainColor() {
      return this.$store.getters.getCustomProgressBarMainColor
    },
    customProgressBarHoverColor() {
      return this.$store.getters.getCustomProgressBarHoverColor
    },
    customProgressBarBackgroundColor() {
      return this.$store.getters.getCustomProgressBarBackgroundColor
    },
    customProgressBarBufferedColor() {
      return this.$store.getters.getCustomProgressBarBufferedColor
    },
    customProgressBarOpacity() {
      return this.$store.getters.getCustomProgressBarOpacity
    },
    customProgressBarHeight() {
      return this.$store.getters.getCustomProgressBarHeight
    },
    customProgressBarShowChapterMarkers() {
      return this.$store.getters.getCustomProgressBarShowChapterMarkers
    },
    customProgressBarProgressOpacity() {
      return this.$store.getters.getCustomProgressBarProgressOpacity
    },
    customProgressBarBufferOpacity() {
      return this.$store.getters.getCustomProgressBarBufferOpacity
    },
    customProgressBarUnbufferedOpacity() {
      return this.$store.getters.getCustomProgressBarUnbufferedOpacity
    },
    customProgressBarPosition() {
      return this.$store.getters.getCustomProgressBarPosition
    },
    progressBarPositionLabel() {
      const position = this.$t('Settings.Custom Progress Bar Settings.Progress Bar Position')
      const unit = this.$t('Settings.Custom Progress Bar Settings.Pixels Unit')
      return `${position} (${unit})`
    }
  },
  methods: {
    handleCustomProgressBarEnabledChange(value) {
      this.updateCustomProgressBarEnabled(value)
    },
    handleShowChapterMarkersChange(value) {
      this.updateCustomProgressBarShowChapterMarkers(value)
    },
    handleMainColorChange(event) {
      this.updateCustomProgressBarMainColor(event.target.value)
    },
    handleMainColorTextChange(event) {
      this.updateCustomProgressBarMainColor(event.target.value)
    },
    handleHoverColorChange(event) {
      this.updateCustomProgressBarHoverColor(event.target.value)
    },
    handleHoverColorTextChange(event) {
      this.updateCustomProgressBarHoverColor(event.target.value)
    },
    handleBackgroundColorChange(event) {
      // Convert hex to rgba, preserving existing alpha
      const hex = event.target.value
      const alpha = this.extractAlphaFromRgba(this.customProgressBarBackgroundColor)
      const rgba = hexToRgba(hex, alpha)
      this.updateCustomProgressBarBackgroundColor(rgba)
    },
    handleBackgroundColorTextChange(event) {
      this.updateCustomProgressBarBackgroundColor(event.target.value)
    },
    handleBufferedColorChange(event) {
      // Convert hex to rgba, preserving existing alpha
      const hex = event.target.value
      const alpha = this.extractAlphaFromRgba(this.customProgressBarBufferedColor)
      const rgba = hexToRgba(hex, alpha)
      this.updateCustomProgressBarBufferedColor(rgba)
    },
    handleBufferedColorTextChange(event) {
      this.updateCustomProgressBarBufferedColor(event.target.value)
    },
    handleOpacityChange(value) {
      this.updateCustomProgressBarOpacity(value)
    },
    handleProgressOpacityChange(value) {
      this.updateCustomProgressBarProgressOpacity(value)
    },
    handleBufferOpacityChange(value) {
      this.updateCustomProgressBarBufferOpacity(value)
    },
    handleUnbufferedOpacityChange(value) {
      this.updateCustomProgressBarUnbufferedOpacity(value)
    },
    handleHeightChange(value) {
      this.updateCustomProgressBarHeight(value)
    },
    handlePositionChange(event) {
      const value = parseFloat(event.target.value)
      if (!isNaN(value)) {
        this.updateCustomProgressBarPosition(value)
      }
    },

    // Helper methods
    extractColorFromRgba(rgba) {
      // Extract RGB values from rgba(r, g, b, a) and convert to hex
      const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/)
      if (match) {
        const r = parseInt(match[1]).toString(16).padStart(2, '0')
        const g = parseInt(match[2]).toString(16).padStart(2, '0')
        const b = parseInt(match[3]).toString(16).padStart(2, '0')
        return `#${r}${g}${b}`
      }
      // If it's already a hex color, return it
      if (rgba.startsWith('#')) {
        return rgba.substring(0, 7) // Return just the color part without alpha
      }
      return '#ffffff'
    },
    extractAlphaFromRgba(rgba) {
      // Extract alpha value from rgba(r, g, b, a)
      const match = rgba.match(/rgba?\((?:\d+,\s*){2}\d+(?:,\s*([\d.]+))?\)/)
      if (match && match[1]) {
        return parseFloat(match[1])
      }
      return 1.0
    },

    ...mapActions([
      'updateCustomProgressBarEnabled',
      'updateCustomProgressBarMainColor',
      'updateCustomProgressBarHoverColor',
      'updateCustomProgressBarBackgroundColor',
      'updateCustomProgressBarBufferedColor',
      'updateCustomProgressBarOpacity',
      'updateCustomProgressBarHeight',
      'updateCustomProgressBarShowChapterMarkers',
      'updateCustomProgressBarProgressOpacity',
      'updateCustomProgressBarBufferOpacity',
      'updateCustomProgressBarUnbufferedOpacity',
      'updateCustomProgressBarPosition'
    ])
  }
})
