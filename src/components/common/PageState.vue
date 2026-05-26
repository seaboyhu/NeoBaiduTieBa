<template>
  <div v-if="loading || error || empty || end" class="page-state">
    <Loading v-if="loading" class="state-loading" />
    <template v-else>
      <span class="material-symbols-outlined">{{ icon }}</span>
      <div class="state-title">{{ title }}</div>
      <div v-if="message" class="state-message">{{ message }}</div>
      <RippleButton v-if="error && retry" class="retry-button" @click="retry">
        重试
      </RippleButton>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{
  loading?: boolean;
  error?: string;
  empty?: boolean;
  end?: boolean;
  retry?: () => void;
}>(), {
  loading: false,
  error: '',
  empty: false,
  end: false,
  retry: undefined,
});

const icon = computed(() => {
  if (props.error) return 'error';
  if (props.empty) return 'inbox';
  return 'check_circle';
});

const title = computed(() => {
  if (props.error) return '加载失败';
  if (props.empty) return '暂无内容';
  return '到底了';
});

const message = computed(() => props.error || '');
</script>

<style scoped>
.page-state {
  width: 100%;
  min-height: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: rgba(var(--text-color), 0.5);
}

.state-loading {
  position: static;
}

.material-symbols-outlined {
  font-size: 32px;
}

.state-title {
  font-weight: 600;
}

.state-message {
  max-width: 520px;
  font-size: 13px;
  text-align: center;
}

.retry-button {
  margin-top: 4px;
  padding: 6px 14px;
  box-shadow: none;
  background: rgba(var(--text-color), 0.06);
}
</style>
