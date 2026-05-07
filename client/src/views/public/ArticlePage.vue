<template>
  <div class="page">
    <GlobalNav />
    <main class="main">
      <div class="container">
        <Breadcrumb :items="breadcrumbItems" />
        <div v-if="loading" class="loading">加载中...</div>
        <template v-else-if="article">
          <article class="article">
            <h1 class="article-title">{{ article.title }}</h1>
            <div class="article-meta">
              <span>{{ article.category_name }}</span>
              <span>{{ article.created_at?.slice(0, 10) }}</span>
            </div>
            <div class="tags" v-if="article.tags?.length">
              <span class="tag" v-for="tag in article.tags" :key="tag">{{ tag }}</span>
            </div>
            <ArticleContent :content="article.content_html" />
          </article>
        </template>
        <div v-else class="empty">文章不存在</div>
      </div>
    </main>
    <FooterBar />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import GlobalNav from '../../components/GlobalNav.vue'
import FooterBar from '../../components/FooterBar.vue'
import Breadcrumb from '../../components/Breadcrumb.vue'
import ArticleContent from '../../components/ArticleContent.vue'
import { getArticleById } from '../../api/public.js'

const route = useRoute()
const article = ref(null)
const loading = ref(true)

const breadcrumbItems = computed(() => {
  if (!article.value) return []
  return [
    { name: article.value.category_name || '未分类', path: `/?cat=${article.value.category_id}` },
    article.value.title
  ]
})

onMounted(async () => {
  try {
    const res = await getArticleById(route.params.id)
    article.value = res.data
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.article {
  padding: var(--space-lg) 0 var(--space-xxl);
}
.article-title {
  font-size: var(--text-hero);
  font-weight: var(--weight-strong);
  letter-spacing: -0.28px;
  margin-bottom: var(--space-sm);
}
.article-meta {
  font-size: var(--text-caption);
  color: var(--color-ink-muted-48);
  margin-bottom: var(--space-md);
  display: flex;
  gap: var(--space-md);
}
.tags {
  display: flex;
  gap: var(--space-xs);
  margin-bottom: var(--space-lg);
}
.tag {
  font-size: var(--text-fine);
  background: var(--color-canvas-parchment);
  color: var(--color-primary);
  padding: 2px 10px;
  border-radius: var(--radius-pill);
}
</style>
