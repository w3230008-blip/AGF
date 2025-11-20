<template>
  <FtSettingsSection
    :title="t('Settings.Subtitle Settings.Subtitle Settings')"
  >
    <div class="modeToggleContainer">
      <div class="modeToggle">
        <button
          :class="{ active: settingsMode === 'normal' }"
          @click="settingsMode = 'normal'"
        >
          {{ t('Settings.Subtitle Settings.Normal Mode') }}
        </button>
        <button
          :class="{ active: settingsMode === 'fullscreen' }"
          @click="settingsMode = 'fullscreen'"
        >
          {{ t('Settings.Subtitle Settings.Fullscreen Mode') }}
        </button>
      </div>
      <p class="modeDescription">
        {{ settingsMode === 'normal' ? t('Settings.Subtitle Settings.Normal Mode Description') : t('Settings.Subtitle Settings.Fullscreen Mode Description') }}
      </p>
    </div>

    <FtToggleSwitch
      :label="t('Settings.Subtitle Settings.Enable Custom Subtitles')"
      :default-value="customSubtitlesEnabled"
      @change="updateCustomSubtitlesEnabled"
    />

    <FtFlexBox>
      <FtSlider
        :label="t('Settings.Subtitle Settings.Subtitle Font Size')"
        :default-value="currentFontSize"
        :min-value="12"
        :max-value="72"
        :step="2"
        value-extension="px"
        @change="updateFontSize"
      />
      <div class="colorSetting">
        <label :for="'customSubtitleColorPicker' + settingsMode">{{ t('Settings.Subtitle Settings.Subtitle Color') }}</label>
        <input
          :id="'customSubtitleColorPicker' + settingsMode"
          type="color"
          :value="currentColor"
          @input="updateColor($event.target.value)"
        >
        <span>{{ currentColor }}</span>
      </div>
    </FtFlexBox>

    <FtFlexBox class="backgroundSettingsContainer">
      <div class="colorSetting">
        <label :for="'customSubtitleBackgroundColorPicker' + settingsMode">{{ t('Settings.Subtitle Settings.Subtitle Background Color') }}</label>
        <input
          :id="'customSubtitleBackgroundColorPicker' + settingsMode"
          type="color"
          :value="currentBackgroundColor"
          @input="updateBackgroundColor($event.target.value)"
        >
        <span>{{ currentBackgroundColor }}</span>
      </div>
      <FtSlider
        :label="t('Settings.Subtitle Settings.Subtitle Background Opacity')"
        :default-value="currentBackgroundOpacity"
        :min-value="0"
        :max-value="100"
        :step="5"
        value-extension="%"
        @change="updateBackgroundOpacity"
      />
    </FtFlexBox>

    <FtFlexBox>
      <div class="numericInputSetting">
        <label :for="'customSubtitleVerticalPosition' + settingsMode">{{ t('Settings.Subtitle Settings.Subtitle Vertical Position') }}</label>
        <div class="numericInputContainer">
          <input
            :id="'customSubtitleVerticalPosition' + settingsMode"
            type="number"
            :value="currentVerticalPosition"
            min="0"
            max="500"
            step="1"
            @input="updateVerticalPosition"
          >
          <span class="unit">
            {{ t('Settings.Subtitle Settings.Pixels Unit') }}
          </span>
        </div>
      </div>
      <FtSlider
        :label="t('Settings.Subtitle Settings.Subtitle Container Width')"
        :default-value="currentContainerWidth"
        :min-value="20"
        :max-value="100"
        :step="5"
        value-extension="%"
        @change="updateContainerWidth"
      />
    </FtFlexBox>

    <FtFlexBox>
      <div class="numericInputSetting">
        <label :for="'customSubtitleTimeOffset' + settingsMode">{{ t('Settings.Subtitle Settings.Subtitle Time Offset') }}</label>
        <div class="numericInputContainer">
          <input
            :id="'customSubtitleTimeOffset' + settingsMode"
            type="number"
            :value="currentTimeOffset"
            min="-10000"
            max="10000"
            step="100"
            @input="updateTimeOffset"
          >
          <span class="unit">
            {{ t('Settings.Subtitle Settings.Milliseconds Unit') }}
          </span>
        </div>
      </div>
    </FtFlexBox>

    <div class="subtitlePreviewContainer">
      <p class="subtitlePreviewTitle">
        {{ t('Settings.Caption Settings.Preview') }}
      </p>
      <div class="subtitlePreviewBox">
        <div
          class="subtitlePreviewText"
          :style="subtitlePreviewStyle"
        >
          {{ t('Settings.Caption Settings.Preview Text') }}
        </div>
      </div>
    </div>
  </FtSettingsSection>
</template>

<script src="./CustomSubtitleSettings.js" />
<style scoped src="./CustomSubtitleSettings.css" />
