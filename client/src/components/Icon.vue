<template>
  <span
    v-if="svgContent"
    class="svg-icon"
    :style="{ fontSize: sizePx + 'px' }"
    v-html="svgContent"
    @click="$emit('click', $event)"
  />
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  name: { type: String, required: true },
  size: { type: [Number, String], default: 24 }
})

defineEmits(['click'])

const iconModules = import.meta.glob('/src/icons/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true
})

const sizePx = computed(() => Number(props.size))

const svgContent = computed(() => {
  return iconModules[`/src/icons/${props.name}.svg`] || ''
})
</script>

<style scoped>
.svg-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 0;
}

.svg-icon:deep(svg) {
  width: 1em;
  height: 1em;
  fill: currentColor;
  stroke: none;
  flex-shrink: 0;
}
</style>
