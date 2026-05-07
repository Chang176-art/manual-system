<template>
  <div class="search-wrapper">
    <input
      v-model="keyword"
      class="search-input"
      type="text"
      placeholder="搜索..."
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
.search-wrapper { flex: 1; max-width: 300px; }
.search-input {
  width: 100%;
  padding: 6px 16px;
  font-size: var(--text-caption);
  font-family: var(--font-body);
  border: 1px solid var(--color-hairline);
  border-radius: var(--radius-pill);
  background: var(--color-surface-pearl);
  color: var(--color-ink);
  outline: none;
  transition: border-color 0.2s;
}
.search-input:focus { border-color: var(--color-primary); }
</style>
