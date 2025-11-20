import { defineComponent, computed, ref } from 'vue'
import { useI18n } from '../../composables/use-i18n-polyfill'

import FtSettingsSection from '../FtSettingsSection/FtSettingsSection.vue'
import FtToggleSwitch from '../FtToggleSwitch/FtToggleSwitch.vue'
import FtSlider from '../FtSlider/FtSlider.vue'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'

import store from '../../store/index'
import { hexToRgba } from '../../helpers/colors'

export default defineComponent({
  name: 'CustomSubtitleSettings',
  components: {
    FtSettingsSection,
    FtToggleSwitch,
    FtSlider,
    FtFlexBox
  },
  setup() {
    const { t } = useI18n()
    const settingsMode = ref('normal')

    const customSubtitlesEnabled = computed(() => store.getters.getCustomSubtitlesEnabled)

    const currentFontSize = computed(() => {
      return settingsMode.value === 'fullscreen'
        ? store.getters.getCustomSubtitlesFontSizeFullscreen
        : store.getters.getCustomSubtitlesFontSize
    })

    const currentColor = computed(() => {
      return settingsMode.value === 'fullscreen'
        ? store.getters.getCustomSubtitlesColorFullscreen
        : store.getters.getCustomSubtitlesColor
    })

    const currentBackgroundColor = computed(() => {
      return settingsMode.value === 'fullscreen'
        ? store.getters.getCustomSubtitlesBackgroundColorFullscreen
        : store.getters.getCustomSubtitlesBackgroundColor
    })

    const currentBackgroundOpacity = computed(() => {
      const opacity = settingsMode.value === 'fullscreen'
        ? store.getters.getCustomSubtitlesBackgroundOpacityFullscreen
        : store.getters.getCustomSubtitlesBackgroundOpacity
      return Math.round(opacity * 100)
    })

    const currentVerticalPosition = computed(() => {
      return settingsMode.value === 'fullscreen'
        ? store.getters.getCustomSubtitlesVerticalPositionFullscreen
        : store.getters.getCustomSubtitlesVerticalPosition
    })

    const currentTimeOffset = computed(() => {
      return settingsMode.value === 'fullscreen'
        ? store.getters.getCustomSubtitlesTimeOffsetFullscreen
        : store.getters.getCustomSubtitlesTimeOffset
    })

    const currentContainerWidth = computed(() => {
      return settingsMode.value === 'fullscreen'
        ? store.getters.getCustomSubtitlesContainerWidthFullscreen
        : store.getters.getCustomSubtitlesContainerWidth
    })

    const subtitlePreviewStyle = computed(() => {
      const bgColor = hexToRgba(
        currentBackgroundColor.value,
        currentBackgroundOpacity.value / 100
      )

      return {
        fontSize: `${currentFontSize.value}px`,
        color: currentColor.value,
        backgroundColor: bgColor,
        padding: '8px 16px',
        borderRadius: '4px',
        display: 'inline-block',
        maxInlineSize: `${currentContainerWidth.value}%`
      }
    })

    function updateCustomSubtitlesEnabled(value) {
      store.dispatch('updateCustomSubtitlesEnabled', value)
    }

    function updateFontSize(value) {
      if (settingsMode.value === 'fullscreen') {
        store.dispatch('updateCustomSubtitlesFontSizeFullscreen', value)
      } else {
        store.dispatch('updateCustomSubtitlesFontSize', value)
      }
    }

    function updateColor(value) {
      if (settingsMode.value === 'fullscreen') {
        store.dispatch('updateCustomSubtitlesColorFullscreen', value)
      } else {
        store.dispatch('updateCustomSubtitlesColor', value)
      }
    }

    function updateBackgroundColor(value) {
      if (settingsMode.value === 'fullscreen') {
        store.dispatch('updateCustomSubtitlesBackgroundColorFullscreen', value)
      } else {
        store.dispatch('updateCustomSubtitlesBackgroundColor', value)
      }
    }

    function updateBackgroundOpacity(opacityPercent) {
      const opacity = opacityPercent / 100
      if (settingsMode.value === 'fullscreen') {
        store.dispatch('updateCustomSubtitlesBackgroundOpacityFullscreen', opacity)
      } else {
        store.dispatch('updateCustomSubtitlesBackgroundOpacity', opacity)
      }
    }

    function updateVerticalPosition(event) {
      const value = parseInt(event.target.value, 10)
      if (!isNaN(value)) {
        if (settingsMode.value === 'fullscreen') {
          store.dispatch('updateCustomSubtitlesVerticalPositionFullscreen', value)
        } else {
          store.dispatch('updateCustomSubtitlesVerticalPosition', value)
        }
      }
    }

    function updateTimeOffset(event) {
      const value = parseInt(event.target.value, 10)
      if (!isNaN(value)) {
        if (settingsMode.value === 'fullscreen') {
          store.dispatch('updateCustomSubtitlesTimeOffsetFullscreen', value)
        } else {
          store.dispatch('updateCustomSubtitlesTimeOffset', value)
        }
      }
    }

    function updateContainerWidth(value) {
      if (settingsMode.value === 'fullscreen') {
        store.dispatch('updateCustomSubtitlesContainerWidthFullscreen', value)
      } else {
        store.dispatch('updateCustomSubtitlesContainerWidth', value)
      }
    }

    return {
      t,
      settingsMode,
      customSubtitlesEnabled,
      currentFontSize,
      currentColor,
      currentBackgroundColor,
      currentBackgroundOpacity,
      currentVerticalPosition,
      currentTimeOffset,
      currentContainerWidth,
      subtitlePreviewStyle,
      updateCustomSubtitlesEnabled,
      updateFontSize,
      updateColor,
      updateBackgroundColor,
      updateBackgroundOpacity,
      updateVerticalPosition,
      updateTimeOffset,
      updateContainerWidth
    }
  }
})
