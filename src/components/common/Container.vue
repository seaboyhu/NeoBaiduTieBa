<script setup lang="ts">
import { computed, onActivated, ref, onMounted } from 'vue';

const props = defineProps<{
  scrollKey?: string;
}>();

const emit = defineEmits(['yscroll'])
const scrollContainer = ref<HTMLElement | null>(null);
const scrollPosition = ref(0);
const storageKey = computed(() => props.scrollKey ? `scrollPosition:${props.scrollKey}` : '');

function handleScroll(event: Event) {
  const target = event.target as HTMLElement;
  scrollPosition.value = target.scrollTop;
  if (storageKey.value) {
    sessionStorage.setItem(storageKey.value, String(scrollPosition.value));
  }
  emit('yscroll', target);
}
const restoreScrollPosition = () => {
  if (scrollContainer.value && scrollPosition.value) {
    scrollContainer.value.scrollTop = scrollPosition.value;
  }
}
onActivated(() => {
  restoreScrollPosition();
});
onMounted(() => {
  if (!storageKey.value) {
    return;
  }

  const savedPosition = sessionStorage.getItem(storageKey.value);
  if (savedPosition) {
    scrollPosition.value = parseInt(savedPosition, 10);
    restoreScrollPosition();
  }
});
</script>
<template>
  <div ref="scrollContainer" class="component-container" @scroll="handleScroll">
    <slot></slot>
  </div>
</template>
<style lang="css" scoped>
.component-container {
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.02);
  overflow-y: auto;
  overflow-x: hidden;
  border-radius: 5px;
}
</style>
