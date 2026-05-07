<template>
  <router-link :to="`/?cat=${category.id}`" class="category-card">
    <span class="card-icon">{{ category.icon }}</span>
    <h3 class="card-title">{{ category.title }}</h3>
    <p class="card-desc">{{ category.description }}</p>
    <span class="card-count">{{ category.article_count }} 篇文章</span>
  </router-link>
</template>

<script setup>
defineProps({ category: { type: Object, required: true } })
</script>

<style scoped>
.category-card {
  display: flex;
  flex-direction: column;
  padding: var(--space-lg);
  background: var(--color-canvas);
  border: 1px solid var(--color-hairline);
  border-radius: var(--radius-sm);
  text-decoration: none;
  color: var(--color-ink);
  transition: transform 0.2s, box-shadow 0.2s;
}
.category-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-card);
}
.card-icon { font-size: 32px; margin-bottom: var(--space-sm); }
.card-title {
  font-size: var(--text-tagline);
  font-weight: var(--weight-strong);
  margin-bottom: 4px;
}
.card-desc {
  font-size: var(--text-caption);
  color: var(--color-ink-muted-48);
  flex: 1;
  margin-bottom: var(--space-xs);
}
.card-count {
  font-size: var(--text-fine);
  color: var(--color-primary);
}
</style>
