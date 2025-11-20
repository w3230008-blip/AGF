<template>
  <div
    v-if="isEnabled && currentSubtitleText"
    class="customSubtitleDisplay"
    :style="subtitleStyle"
  >
    <div
      class="subtitleText"
      :style="textStyle"
    >
      {{ currentSubtitleText }}
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import store from '../../store/index'
import { hexToRgba } from '../../helpers/colors'

const props = defineProps({
  isFullscreen: {
    type: Boolean,
    default: false
  },
  currentSubtitleText: {
    type: String,
    default: ''
  }
})

const isEnabled = computed(() => {
  return store.getters.getCustomSubtitlesEnabled
})

const fontSize = computed(() => {
  return props.isFullscreen
    ? store.getters.getCustomSubtitlesFontSizeFullscreen
    : store.getters.getCustomSubtitlesFontSize
})

const color = computed(() => {
  return props.isFullscreen
    ? store.getters.getCustomSubtitlesColorFullscreen
    : store.getters.getCustomSubtitlesColor
})

const backgroundColor = computed(() => {
  return props.isFullscreen
    ? store.getters.getCustomSubtitlesBackgroundColorFullscreen
    : store.getters.getCustomSubtitlesBackgroundColor
})

const backgroundOpacity = computed(() => {
  return props.isFullscreen
    ? store.getters.getCustomSubtitlesBackgroundOpacityFullscreen
    : store.getters.getCustomSubtitlesBackgroundOpacity
})

const verticalPosition = computed(() => {
  return props.isFullscreen
    ? store.getters.getCustomSubtitlesVerticalPositionFullscreen
    : store.getters.getCustomSubtitlesVerticalPosition
})

const containerWidth = computed(() => {
  return props.isFullscreen
    ? store.getters.getCustomSubtitlesContainerWidthFullscreen
    : store.getters.getCustomSubtitlesContainerWidth
})

const subtitleStyle = computed(() => ({
  bottom: `${verticalPosition.value}px`,
  maxInlineSize: `${containerWidth.value}%`
}))

const textStyle = computed(() => {
  const bgColor = hexToRgba(backgroundColor.value, backgroundOpacity.value)

  return {
    fontSize: `${fontSize.value}px`,
    color: color.value,
    backgroundColor: bgColor
  }
})
</script>

<style scoped src="./FtCustomSubtitleDisplay.css" />
