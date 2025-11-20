<template>
  <ft-settings-section
    :title="$t('Settings.Custom Progress Bar Settings.Custom Progress Bar Settings')"
  >
    <div class="switchColumn">
      <ft-toggle-switch
        :label="$t('Settings.Custom Progress Bar Settings.Enable Custom Progress Bar')"
        :compact="true"
        :default-value="customProgressBarEnabled"
        @change="handleCustomProgressBarEnabledChange"
      />
      <ft-toggle-switch
        :label="$t('Settings.Custom Progress Bar Settings.Show Chapter Markers')"
        :compact="true"
        :default-value="customProgressBarShowChapterMarkers"
        :disabled="!customProgressBarEnabled"
        @change="handleShowChapterMarkersChange"
      />
    </div>

    <div class="colorSettings">
      <h3>{{ $t('Settings.Custom Progress Bar Settings.Colors') }}</h3>

      <div class="colorInputGroup">
        <label for="customProgressBarMainColor">
          {{ $t('Settings.Custom Progress Bar Settings.Main Color') }}
        </label>
        <input
          id="customProgressBarMainColor"
          type="color"
          :value="customProgressBarMainColor"
          :disabled="!customProgressBarEnabled"
          @input="handleMainColorChange"
        >
        <label for="customProgressBarMainColorText">
          <input
            id="customProgressBarMainColorText"
            type="text"
            :value="customProgressBarMainColor"
            :disabled="!customProgressBarEnabled"
            @input="handleMainColorTextChange"
          >
        </label>
      </div>

      <div class="colorInputGroup">
        <label for="customProgressBarHoverColor">
          {{ $t('Settings.Custom Progress Bar Settings.Hover Color') }}
        </label>
        <input
          id="customProgressBarHoverColor"
          type="color"
          :value="customProgressBarHoverColor"
          :disabled="!customProgressBarEnabled"
          @input="handleHoverColorChange"
        >
        <label for="customProgressBarHoverColorText">
          <input
            id="customProgressBarHoverColorText"
            type="text"
            :value="customProgressBarHoverColor"
            :disabled="!customProgressBarEnabled"
            @input="handleHoverColorTextChange"
          >
        </label>
      </div>

      <div class="colorInputGroup">
        <label for="customProgressBarBackgroundColor">
          {{ $t('Settings.Custom Progress Bar Settings.Background Color') }}
        </label>
        <input
          id="customProgressBarBackgroundColor"
          type="color"
          :value="extractColorFromRgba(customProgressBarBackgroundColor)"
          :disabled="!customProgressBarEnabled"
          @input="handleBackgroundColorChange"
        >
        <label for="customProgressBarBackgroundColorText">
          <input
            id="customProgressBarBackgroundColorText"
            type="text"
            :value="customProgressBarBackgroundColor"
            :disabled="!customProgressBarEnabled"
            @input="handleBackgroundColorTextChange"
          >
        </label>
      </div>

      <div class="colorInputGroup">
        <label for="customProgressBarBufferedColor">
          {{ $t('Settings.Custom Progress Bar Settings.Buffered Color') }}
        </label>
        <input
          id="customProgressBarBufferedColor"
          type="color"
          :value="extractColorFromRgba(customProgressBarBufferedColor)"
          :disabled="!customProgressBarEnabled"
          @input="handleBufferedColorChange"
        >
        <label for="customProgressBarBufferedColorText">
          <input
            id="customProgressBarBufferedColorText"
            type="text"
            :value="customProgressBarBufferedColor"
            :disabled="!customProgressBarEnabled"
            @input="handleBufferedColorTextChange"
          >
        </label>
      </div>
    </div>

    <div class="sliderSettings">
      <h3>{{ $t('Settings.Custom Progress Bar Settings.Appearance') }}</h3>

      <ft-slider
        :label="$t('Settings.Custom Progress Bar Settings.Opacity')"
        :min-value="0"
        :max-value="1"
        :step="0.1"
        :default-value="customProgressBarOpacity"
        :disabled="!customProgressBarEnabled"
        @change="handleOpacityChange"
      />

      <ft-slider
        :label="$t('Settings.Custom Progress Bar Settings.Progress Bar Opacity')"
        :min-value="0"
        :max-value="100"
        :step="1"
        :default-value="customProgressBarProgressOpacity"
        value-extension="%"
        :disabled="!customProgressBarEnabled"
        @change="handleProgressOpacityChange"
      />

      <ft-slider
        :label="$t('Settings.Custom Progress Bar Settings.Buffer Bar Opacity')"
        :min-value="0"
        :max-value="100"
        :step="1"
        :default-value="customProgressBarBufferOpacity"
        value-extension="%"
        :disabled="!customProgressBarEnabled"
        @change="handleBufferOpacityChange"
      />

      <ft-slider
        :label="$t('Settings.Custom Progress Bar Settings.Unbuffered Bar Opacity')"
        :min-value="0"
        :max-value="100"
        :step="1"
        :default-value="customProgressBarUnbufferedOpacity"
        value-extension="%"
        :disabled="!customProgressBarEnabled"
        @change="handleUnbufferedOpacityChange"
      />

      <ft-slider
        :label="$t('Settings.Custom Progress Bar Settings.Height')"
        :min-value="2"
        :max-value="20"
        :step="1"
        :default-value="customProgressBarHeight"
        value-extension="px"
        :disabled="!customProgressBarEnabled"
        @change="handleHeightChange"
      />

      <div class="positionInputGroup">
        <label for="customProgressBarPosition">
          {{ progressBarPositionLabel }}
        </label>
        <input
          id="customProgressBarPosition"
          type="number"
          :value="customProgressBarPosition"
          :disabled="!customProgressBarEnabled"
          @input="handlePositionChange"
        >
      </div>
    </div>
  </ft-settings-section>
</template>

<script src="./CustomProgressBarSettings.js" />
<style scoped src="./CustomProgressBarSettings.css" />
