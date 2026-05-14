<template>
  <div class="search-wrapper">
    <Icon name="search" class="search-icon" />
    <input
      v-model="keyword"
      class="search-input"
      type="text"
      placeholder="搜索指南..."
      @keyup.enter="doSearch"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
const keyword = ref('')
const router = useRouter()
function doSearch() {
  if (keyword.value.trim()) {
    router.push({ path: '/search', query: { q: keyword.value.trim() } })
  }
}
</script>

<style scoped>
.search-wrapper {
  position: relative;
  flex: 1;
  max-width: 280px;
}
.search-icon {
  position: absolute;
  left: var(--space-px-12);
  top: 50%;
  transform: translateY(-50%);
  font-size: 18px;
  color: var(--color-on-surface-variant);
  pointer-events: none;
}
.search-input {
  width: 100%;
  padding: 6px 16px 6px 40px;
  font-size: var(--text-body);
  font-family: var(--font-body);
  border: 1px solid var(--color-border-gray);
  border-radius: var(--radius-md);
  background: var(--color-surface-container-low);
  color: var(--color-ink);
  outline: none;
  transition: border-color 0.2s;
}
.search-input:focus {
  border-color: var(--color-primary);
}
.search-input::placeholder {
  color: var(--color-gray-300);
}

@media (max-width: 768px) {
  .search-wrapper {
    max-width: 100%;
  }
}
</style>
