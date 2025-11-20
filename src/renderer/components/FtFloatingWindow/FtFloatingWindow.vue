<template>
  <div
    ref="floatingWindow"
    class="floatingWindow"
    :class="{ dragging: isDragging }"
    :style="windowStyle"
    @mousedown="startDrag"
    @touchstart="startDrag"
  >
    <div class="floatingWindowHeader">
      <span class="floatingWindowTitle">
        <slot name="title">{{ title }}</slot>
      </span>
      <ft-icon-button
        :title="$t('Close')"
        :icon="['fas', 'times']"
        :size="16"
        :padding="8"
        theme="base"
        @click="handleClose"
      />
    </div>
    <div class="floatingWindowContent">
      <slot />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'
import FtIconButton from '../ft-icon-button/ft-icon-button.vue'

const props = defineProps({
  title: {
    type: String,
    default: ''
  },
  initialX: {
    type: Number,
    default: 50
  },
  initialY: {
    type: Number,
    default: 50
  }
})

const emit = defineEmits(['close'])

const floatingWindow = ref(null)
const isDragging = ref(false)
const position = ref({ x: props.initialX, y: props.initialY })
const dragOffset = ref({ x: 0, y: 0 })

const windowStyle = computed(() => ({
  left: `${position.value.x}px`,
  top: `${position.value.y}px`
}))

function startDrag(event) {
  if (event.target.closest('.floatingWindowHeader') && !event.target.closest('.ftIconButton')) {
    event.preventDefault()
    isDragging.value = true

    const clientX = event.type === 'touchstart' ? event.touches[0].clientX : event.clientX
    const clientY = event.type === 'touchstart' ? event.touches[0].clientY : event.clientY

    dragOffset.value = {
      x: clientX - position.value.x,
      y: clientY - position.value.y
    }

    document.addEventListener('mousemove', handleDrag)
    document.addEventListener('touchmove', handleDrag)
    document.addEventListener('mouseup', stopDrag)
    document.addEventListener('touchend', stopDrag)
  }
}

function handleDrag(event) {
  if (!isDragging.value) return

  const clientX = event.type === 'touchmove' ? event.touches[0].clientX : event.clientX
  const clientY = event.type === 'touchmove' ? event.touches[0].clientY : event.clientY

  position.value = {
    x: clientX - dragOffset.value.x,
    y: clientY - dragOffset.value.y
  }
}

function stopDrag() {
  isDragging.value = false
  document.removeEventListener('mousemove', handleDrag)
  document.removeEventListener('touchmove', handleDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('touchend', stopDrag)
}

function handleClose() {
  emit('close')
}

onBeforeUnmount(() => {
  if (isDragging.value) {
    stopDrag()
  }
})
</script>

<style scoped src="./FtFloatingWindow.css" />
