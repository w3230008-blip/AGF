<template>
  <div
    v-if="enabled"
    ref="progressBarContainer"
    class="ft-custom-progress-bar-container"
    role="slider"
    tabindex="0"
    :aria-label="$t('Video.Player.Progress')"
    :aria-valuemin="0"
    :aria-valuemax="duration"
    :aria-valuenow="currentTime"
    :style="containerStyle"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    @mousemove="handleMouseMove"
    @click="handleClick"
    @focusin="handleMouseEnter"
    @focusout="handleMouseLeave"
    @keydown.left="handleKeyLeft"
    @keydown.right="handleKeyRight"
  >
    <div
      class="ft-custom-progress-bar-track"
      :style="trackStyle"
    >
      <!-- Buffered region -->
      <div
        class="ft-custom-progress-bar-buffered"
        :style="bufferedStyle"
      />

      <!-- Chapter markers -->
      <div
        v-if="showChapterMarkers && chapters.length > 0"
        class="ft-custom-progress-bar-chapters"
      >
        <div
          v-for="(chapter, index) in chapters"
          :key="index"
          class="ft-custom-progress-bar-chapter-marker"
          :style="getChapterMarkerStyle(chapter)"
          :title="chapter.title"
        />
      </div>

      <!-- Progress -->
      <div
        class="ft-custom-progress-bar-progress"
        :style="progressStyle"
      />

      <!-- Hover preview -->
      <div
        v-if="isHovering"
        class="ft-custom-progress-bar-hover"
        :style="hoverStyle"
      />

      <!-- Scrubber handle -->
      <div
        class="ft-custom-progress-bar-handle"
        :style="handleStyle"
      />
    </div>

    <!-- Tooltip -->
    <div
      v-if="isHovering && tooltipText"
      class="ft-custom-progress-bar-tooltip"
      :style="tooltipStyle"
    >
      {{ tooltipText }}
    </div>
  </div>
</template>

<script src="./FtCustomProgressBar.js" />
<style scoped src="./FtCustomProgressBar.css" />
