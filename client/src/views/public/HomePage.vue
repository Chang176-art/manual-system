<template>
  <div class="page">
    <GlobalNav />
    <main class="main">
      <div class="container">
        <div class="hero">
          <h1 class="hero-title">📖 用户手册</h1>
          <p class="hero-desc">出租屋管理系统使用指南</p>
        </div>
        <div v-if="loading" class="loading">加载中...</div>
        <div v-else class="card-grid">
          <CategoryCard v-for="cat in categories" :key="cat.id" :category="cat" />
        </div>
      </div>
    </main>
    <FooterBar />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import GlobalNav from '../../components/GlobalNav.vue'
import FooterBar from '../../components/FooterBar.vue'
import CategoryCard from '../../components/CategoryCard.vue'
import { getCategories } from '../../api/public.js'

const categories = ref([])
const loading = ref(true)

onMounted(async () => {
  try {
    const res = await getCategories()
    categories.value = res.data
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.hero {
  text-align: center;
  padding: var(--space-xxl) 0 var(--space-xl);
}
.hero-title {
  font-size: var(--text-hero);
  font-weight: var(--weight-strong);
  letter-spacing: -0.28px;
  margin-bottom: var(--space-xs);
}
.hero-desc {
  font-size: var(--text-tagline);
  color: var(--color-ink-muted-48);
}
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-lg);
}
.loading {
  text-align: center;
  padding: var(--space-xxl);
  color: var(--color-ink-muted-48);
}
</style>
