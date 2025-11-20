<template>
  <FtSettingsSection
    :title="t('Settings.Caption Settings.Caption Settings')"
  >
    <div class="modeToggleContainer">
      <div class="modeToggle">
        <button
          :class="{ active: settingsMode === 'normal' }"
          @click="settingsMode = 'normal'"
        >
          {{ t('Settings.Caption Settings.Normal Mode') }}
        </button>
        <button
          :class="{ active: settingsMode === 'fullscreen' }"
          @click="settingsMode = 'fullscreen'"
        >
          {{ t('Settings.Caption Settings.Fullscreen Mode') }}
        </button>
      </div>
      <p class="modeDescription">
        {{ settingsMode === 'normal' ? t('Settings.Caption Settings.Normal Mode Description') : t('Settings.Caption Settings.Fullscreen Mode Description') }}
      </p>
    </div>

    <FtFlexBox>
      <FtSlider
        :label="t('Settings.Caption Settings.Font Size')"
        :default-value="currentFontSize"
        :min-value="12"
        :max-value="48"
        :step="2"
        value-extension="px"
        @change="updateFontSize"
      />
      <FtSelect
        :placeholder="t('Settings.Caption Settings.Font Family')"
        :value="currentFontFamily"
        :select-names="CAPTION_FONT_FAMILY_NAMES"
        :select-values="CAPTION_FONT_FAMILY_VALUES"
        :icon="['fas', 'closed-captioning']"
        @change="updateFontFamily"
      />
    </FtFlexBox>
    <FtFlexBox class="captionColorContainer">
      <div class="colorSetting">
        <label :for="'captionFontColorPicker' + settingsMode">{{ t('Settings.Caption Settings.Font Color') }}</label>
        <input
          :id="'captionFontColorPicker' + settingsMode"
          type="color"
          :value="currentFontColor"
          @input="updateFontColor($event.target.value)"
        >
        <span>{{ currentFontColor }}</span>
      </div>
      <div class="colorSetting">
        <label :for="'captionBackgroundColorPicker' + settingsMode">{{ t('Settings.Caption Settings.Background Color') }}</label>
        <input
          :id="'captionBackgroundColorPicker' + settingsMode"
          type="color"
          :value="currentBackgroundColorHex"
          @input="updateBackgroundColorFromPicker($event.target.value)"
        >
        <span>{{ currentBackgroundColor }}</span>
      </div>
    </FtFlexBox>
    <FtFlexBox>
      <FtSlider
        :label="t('Settings.Caption Settings.Background Opacity')"
        :default-value="currentBackgroundOpacity"
        :min-value="0"
        :max-value="100"
        :step="5"
        value-extension="%"
        @change="updateBackgroundOpacity"
      />
      <div class="bottomOffsetSetting">
        <label :for="'captionBottomOffsetInput' + settingsMode">{{ t('Settings.Caption Settings.Bottom Offset') }}</label>
        <div class="bottomOffsetInputContainer">
          <input
            :id="'captionBottomOffsetInput' + settingsMode"
            type="number"
            :value="currentBottomOffset"
            min="0"
            max="500"
            step="1"
            @input="updateBottomOffset"
          >
          <span class="unit">
            {{ t('Settings.Caption Settings.Pixels Unit') }}
          </span>
        </div>
      </div>
    </FtFlexBox>
    <div class="captionPreviewContainer">
      <p class="captionPreviewTitle">
        {{ t('Settings.Caption Settings.Preview') }}
      </p>
      <div class="captionPreviewBox">
        <div
          class="captionPreviewText"
          :style="captionPreviewStyle"
        >
          {{ t('Settings.Caption Settings.Preview Text') }}
        </div>
      </div>
    </div>
  </FtSettingsSection>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from '../../composables/use-i18n-polyfill'

import FtSettingsSection from '../FtSettingsSection/FtSettingsSection.vue'
import FtSelect from '../FtSelect/FtSelect.vue'
import FtSlider from '../FtSlider/FtSlider.vue'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'

import store from '../../store/index'
import { hexToRgba } from '../../helpers/colors'

const { t } = useI18n()

const settingsMode = ref('normal')

const CAPTION_FONT_FAMILY_VALUES = [
  'Arial',
  'Calibri',
  'Cambria',
  'Comic Sans MS',
  'Consolas',
  'Courier New',
  'Georgia',
  'Impact',
  'Lucida Console',
  'Segoe UI',
  'Tahoma',
  'Times New Roman',
  'Trebuchet MS',
  'Verdana'
]

const CAPTION_FONT_FAMILY_NAMES = CAPTION_FONT_FAMILY_VALUES

// Computed properties for current mode
const currentFontSize = computed(() => {
  return settingsMode.value === 'fullscreen'
    ? store.getters.getCaptionFontSizeFullscreen
    : store.getters.getCaptionFontSize
})

const currentFontColor = computed(() => {
  return settingsMode.value === 'fullscreen'
    ? store.getters.getCaptionFontColorFullscreen
    : store.getters.getCaptionFontColor
})

const currentFontFamily = computed(() => {
  return settingsMode.value === 'fullscreen'
    ? store.getters.getCaptionFontFamilyFullscreen
    : store.getters.getCaptionFontFamily
})

const currentBackgroundColor = computed(() => {
  return settingsMode.value === 'fullscreen'
    ? store.getters.getCaptionBackgroundColorFullscreen
    : store.getters.getCaptionBackgroundColor
})

const currentBottomOffset = computed(() => {
  return settingsMode.value === 'fullscreen'
    ? store.getters.getCaptionContainerBottomOffsetFullscreen
    : store.getters.getCaptionContainerBottomOffset
})

// Helper functions
function parseRGBA(rgba) {
  const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/)
  if (match) {
    return {
      r: parseInt(match[1]),
      g: parseInt(match[2]),
      b: parseInt(match[3]),
      a: match[4] ? parseFloat(match[4]) : 1
    }
  }
  return { r: 0, g: 0, b: 0, a: 0.8 }
}

const currentBackgroundColorHex = computed(() => {
  const rgba = currentBackgroundColor.value
  const { r, g, b } = parseRGBA(rgba)
  const rHex = r.toString(16).padStart(2, '0')
  const gHex = g.toString(16).padStart(2, '0')
  const bHex = b.toString(16).padStart(2, '0')
  return `#${rHex}${gHex}${bHex}`
})

const currentBackgroundOpacity = computed(() => {
  const rgba = currentBackgroundColor.value
  const { a } = parseRGBA(rgba)
  return Math.round(a * 100)
})

// Update functions
function updateFontSize(value) {
  if (settingsMode.value === 'fullscreen') {
    store.dispatch('updateCaptionFontSizeFullscreen', value)
  } else {
    store.dispatch('updateCaptionFontSize', value)
  }
}

function updateFontColor(value) {
  if (settingsMode.value === 'fullscreen') {
    store.dispatch('updateCaptionFontColorFullscreen', value)
  } else {
    store.dispatch('updateCaptionFontColor', value)
  }
}

function updateFontFamily(value) {
  if (settingsMode.value === 'fullscreen') {
    store.dispatch('updateCaptionFontFamilyFullscreen', value)
  } else {
    store.dispatch('updateCaptionFontFamily', value)
  }
}

function updateBackgroundColorFromPicker(hex) {
  const currentOpacity = parseRGBA(currentBackgroundColor.value).a
  const rgba = hexToRgba(hex, currentOpacity)

  if (settingsMode.value === 'fullscreen') {
    store.dispatch('updateCaptionBackgroundColorFullscreen', rgba)
  } else {
    store.dispatch('updateCaptionBackgroundColor', rgba)
  }
}

function updateBackgroundOpacity(opacityPercent) {
  // eslint-disable-next-line no-console
  // console.log('🎬 [CaptionSettings] updateBackgroundOpacity called with:', opacityPercent)
  const { r, g, b } = parseRGBA(currentBackgroundColor.value)
  const alpha = opacityPercent / 100
  const rgba = `rgba(${r}, ${g}, ${b}, ${alpha})`
  // eslint-disable-next-line no-console
  // console.log('🎬 [CaptionSettings] Dispatching background color update:', { rgba, mode: settingsMode.value })

  if (settingsMode.value === 'fullscreen') {
    store.dispatch('updateCaptionBackgroundColorFullscreen', rgba)
  } else {
    store.dispatch('updateCaptionBackgroundColor', rgba)
  }
}

function updateBottomOffset(event) {
  const value = parseInt(event.target.value, 10)
  if (!isNaN(value)) {
    if (settingsMode.value === 'fullscreen') {
      store.dispatch('updateCaptionContainerBottomOffsetFullscreen', value)
    } else {
      store.dispatch('updateCaptionContainerBottomOffset', value)
    }
  }
}

// Preview style
const captionPreviewStyle = computed(() => {
  return {
    fontSize: `${currentFontSize.value}px`,
    color: currentFontColor.value,
    fontFamily: currentFontFamily.value,
    backgroundColor: currentBackgroundColor.value,
    padding: '8px 12px',
    borderRadius: '4px',
    display: 'inline-block',
    position: 'relative',
    bottom: `${currentBottomOffset.value}px`
  }
})
</script>

<style scoped src="./CaptionSettings.css" />
