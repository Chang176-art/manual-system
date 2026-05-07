<template>
  <div class="page">
    <GlobalNav />
    <main class="main">
      <div class="container">
        <h2 class="search-title">搜索: "{{ keyword }}"</h2>
        <div v-if="loading" class="loading">搜索中...</div>
        <div v-else-if="results.length === 0" class="empty">未找到相关内容</div>
        <div v-else class="results-list">
          <router-link
            v-for="item in results"
            :key="item.id"
            :to="`/article/${item.id}`"
            class="result-item"
          >
            <h3>{{ item.title }}</h3>
            <p class="result-meta">{{ item.created_at?.slice(0, 10) }}</p>
          </router-link>
        </div>
      </div>
    </main>
    <FooterBar />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import GlobalNav from '../../components/GlobalNav.vue'
import FooterBar from '../../components/FooterBar.vue'
import { searchArticles } from '../../api/public.js'

const route = useRoute()
const keyword = ref('')
const results = ref([])
const loading = ref(true)

onMounted(async () => {
  keyword.value = route.query.q || ''
  if (!keyword.value) { loading.value = false; return }
  try {
    const res = await searchArticles(keyword.value)
    results.value = res.data
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.search-title {
  font-size: var(--text-display);
  padding: var(--space-lg) 0;
}
.results-list { display: flex; flex-direction: column; gap: var(--space-sm); }
.result-item {
  display: block;
  padding: var(--space-md);
  border: 1px solid var(--color-hairline);
  border-radius: var(--radius-sm);
  text-decoration: none;
  color: var(--color-ink);
  transition: border-color 0.2s;
}
.result-item:hover { border-color: var(--color-primary); }
.result-item h3 { font-size: var(--text-body); font-weight: var(--weight-strong); }
.result-meta { font-size: var(--text-caption); color: var(--color-ink-muted-48); margin-top: 4px; }
.loading, .empty { text-align: center; padding: var(--space-xxl); color: var(--color-ink-muted-48); }
</style>
