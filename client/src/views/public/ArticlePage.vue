<template>
  <div class="page">
    <GlobalNav />
    <main class="main">
      <div class="container-max">
        <Breadcrumb :items="breadcrumbItems" />
        <div v-if="loading" class="loading">加载中...</div>
        <template v-else-if="article">
          <div class="article-layout">
            <!-- Main Article Column -->
            <div class="article-column">
              <article class="article-card">
                <!-- Article Header -->
                <header class="article-header">
                  <div class="article-meta-row">
                    <span class="article-category">{{ article.category_name || '未分类' }}</span>
                    <span class="meta-sep">·</span>
                    <span class="meta-text">{{ formatDate(article.created_at) }}</span>
                    <Icon name="schedule" class="meta-icon" />
                    <span class="meta-text">阅读时间 {{ readingTime }} 分钟</span>
                  </div>
                  <h1 class="article-title">{{ article.title }}</h1>
                  <p class="article-subtitle" v-if="article.summary">{{ article.summary }}</p>
                </header>

                <!-- Tags -->
                <div class="article-tags" v-if="article.tags?.length">
                  <span class="tag" v-for="tag in article.tags" :key="tag">{{ tag }}</span>
                </div>

                <!-- Featured Image -->
                <div class="article-image" v-if="article.cover_image">
                  <img :src="article.cover_image" :alt="article.title" />
                </div>

                <!-- Article Body -->
                <div class="article-body">
                  <!-- 2FA Callout -->
                  <div class="callout-box">
                    <Icon name="info" class="callout-icon" />
                    <div class="callout-content">
                      <strong class="callout-title">重要提醒</strong>
                      <p class="callout-desc">
                        从 2.4 版本开始，我们增强了账户安全性。所有正式使用的账户必须开启两步验证。旧版的登录方式将仅作为备用选项保留。
                      </p>
                    </div>
                  </div>

                  <ArticleContent :content="article.content_html" />
                </div>

                <!-- Prev/Next Navigation -->
                <nav class="article-nav">
                  <router-link v-if="prevArticle" :to="`/article/${prevArticle.id}`" class="nav-link prev">
                    <span class="nav-label">← 上一篇文章</span>
                    <span class="nav-title">{{ prevArticle.title }}</span>
                  </router-link>
                  <div v-else></div>
                  <router-link v-if="nextArticle" :to="`/article/${nextArticle.id}`" class="nav-link next">
                    <span class="nav-label">下一篇文章 →</span>
                    <span class="nav-title">{{ nextArticle.title }}</span>
                  </router-link>
                </nav>
              </article>
            </div>

            <!-- Sidebar -->
            <aside class="article-sidebar">
              <!-- Table of Contents -->
              <div class="sidebar-card">
                <h3 class="sidebar-title">目录</h3>
                <nav class="toc-list">
                  <a
                    v-for="heading in tocItems"
                    :key="heading.id"
                    :href="`#${heading.id}`"
                    :class="['toc-item', { 'toc-active': heading.active }]"
                  >{{ heading.text }}</a>
                </nav>
              </div>

              <!-- Related Articles -->
              <div class="sidebar-card" v-if="relatedArticles.length > 0">
                <h3 class="sidebar-title">相关文章</h3>
                <div class="related-list">
                  <router-link
                    v-for="item in relatedArticles"
                    :key="item.id"
                    :to="`/article/${item.id}`"
                    class="related-item"
                  >
                    <span class="related-cat">{{ item.category_name || '文章' }}</span>
                    <span class="related-title">{{ item.title }}</span>
                  </router-link>
                </div>
              </div>
            </aside>
          </div>
        </template>
        <div v-else class="empty">文章不存在</div>
      </div>
    </main>
    <FooterBar />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import GlobalNav from '../../components/GlobalNav.vue'
import FooterBar from '../../components/FooterBar.vue'
import Breadcrumb from '../../components/Breadcrumb.vue'
import ArticleContent from '../../components/ArticleContent.vue'
import { getArticleById, getArticles } from '../../api/public.js'

const route = useRoute()
const article = ref(null)
const loading = ref(true)
const prevArticle = ref(null)
const nextArticle = ref(null)
const relatedArticles = ref([])
const tocItems = ref([])

const breadcrumbItems = computed(() => {
  if (!article.value) return []
  return [
    { name: article.value.category_name || '未分类', path: `/?cat=${article.value.category_id}` },
    article.value.title
  ]
})

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

const readingTime = computed(() => {
  if (!article.value?.content_html) return 6
  const text = article.value.content_html.replace(/<[^>]+>/g, '')
  const words = text.length
  return Math.max(1, Math.ceil(words / 500))
})

async function fetchArticle(id) {
  loading.value = true
  article.value = null
  try {
    const res = await getArticleById(id)
    article.value = res.data
    await nextTick()
    generateTOC()
    await loadRelated()
    await loadNav(id)
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function generateTOC() {
  const items = []
  if (!article.value?.content_html) return
  const div = document.createElement('div')
  div.innerHTML = article.value.content_html
  const headings = div.querySelectorAll('h2, h3')
  headings.forEach((h, i) => {
    const id = `heading-${i}`
    h.id = id
    items.push({
      id,
      text: h.textContent,
      tag: h.tagName,
      active: i === 0
    })
  })
  // Update the article content HTML with IDs
  if (article.value) {
    article.value.content_html = div.innerHTML
  }
  tocItems.value = items
}

async function loadRelated() {
  if (!article.value?.category_id) return
  try {
    const res = await getArticles({ category_id: article.value.category_id, page_size: 5 })
    relatedArticles.value = (res.data.list || []).filter(a => String(a.id) !== String(route.params.id)).slice(0, 3)
  } catch (e) {
    relatedArticles.value = []
  }
}

async function loadNav(id) {
  prevArticle.value = null
  nextArticle.value = null
  try {
    const res = await getArticles({ page_size: 100 })
    const all = res.data.list || []
    const idx = all.findIndex(a => String(a.id) === String(id))
    if (idx > 0) prevArticle.value = all[idx - 1]
    if (idx < all.length - 1) nextArticle.value = all[idx + 1]
  } catch (e) {}
}

// Scroll-based TOC active state
function onScroll() {
  const headings = document.querySelectorAll('[id^="heading-"]')
  let currentId = ''
  headings.forEach(h => {
    const rect = h.getBoundingClientRect()
    if (rect.top <= 120) currentId = h.id
  })
  tocItems.value.forEach(item => {
    item.active = item.id === currentId
  })
}

onMounted(() => {
  fetchArticle(route.params.id)
  window.addEventListener('scroll', onScroll, { passive: true })
})

watch(() => route.params.id, (id) => {
  fetchArticle(id)
})
</script>

<style scoped>
.article-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--gutter);
  padding-bottom: var(--space-xxl);
}

@media (min-width: 1024px) {
  .article-layout {
    grid-template-columns: 9fr 3fr;
  }
}

/* ===== Article Card ===== */
.article-card {
  background: var(--color-surface-container-lowest);
  padding: var(--margin-desktop);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-gray);
  box-shadow: var(--shadow-stack-1);
}

/* Article Header */
.article-header {
  margin-bottom: var(--margin-desktop);
  border-bottom: 1px solid var(--color-border-gray);
  padding-bottom: var(--space-px-24);
}
.article-meta-row {
  display: flex;
  align-items: center;
  gap: var(--space-px-8);
  margin-bottom: var(--space-px-12);
  flex-wrap: wrap;
}
.article-category {
  font-size: var(--text-badge-uppercase);
  font-weight: var(--weight-semibold);
  background: rgba(0, 86, 200, 0.08);
  color: var(--color-primary);
  padding: var(--space-px-4) var(--space-px-8);
  border-radius: var(--radius-sm);
}
.meta-sep {
  color: var(--color-on-surface-variant);
  font-size: var(--text-caption);
}
.meta-text {
  font-size: var(--text-caption);
  color: var(--color-on-surface-variant);
}
.meta-icon {
  font-size: 18px;
  color: var(--color-on-surface-variant);
}
.article-title {
  font-size: var(--text-section-heading-mobile);
  font-weight: var(--weight-semibold);
  line-height: var(--leading-tight);
  color: var(--color-ink);
  margin-bottom: var(--space-px-16);
}
.article-subtitle {
  font-size: var(--text-body-large);
  font-weight: var(--weight-medium);
  color: var(--color-on-surface-variant);
  max-width: 42rem;
}

@media (min-width: 768px) {
  .article-title {
    font-size: var(--text-section-heading);
  }
}

/* Tags */
.article-tags {
  display: flex;
  gap: var(--space-px-8);
  margin-bottom: var(--space-lg);
}
.tag {
  font-size: var(--text-fine);
  background: var(--color-canvas-parchment);
  color: var(--color-primary);
  padding: 2px 10px;
  border-radius: var(--radius-pill);
}

/* Featured Image */
.article-image {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1px solid var(--color-border-gray);
  margin-bottom: var(--margin-desktop);
}
.article-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Article Body */
.article-body {
  font-size: var(--text-body);
  line-height: var(--leading-relaxed);
}

/* Callout Box */
.callout-box {
  background: var(--color-surface-container-low);
  border-left: 4px solid var(--color-primary);
  padding: var(--space-px-16);
  display: flex;
  gap: var(--space-px-12);
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
  margin-bottom: var(--space-px-24);
}
.callout-icon {
  color: var(--color-primary);
  font-size: 24px;
  flex-shrink: 0;
  margin-top: 2px;
}
.callout-content {
  flex: 1;
}
.callout-title {
  font-size: var(--text-body);
  color: var(--color-ink);
  display: block;
  margin-bottom: var(--space-px-4);
}
.callout-desc {
  font-size: var(--text-caption);
  color: var(--color-on-surface-variant);
  line-height: var(--leading-relaxed);
}

/* Article Navigation */
.article-nav {
  margin-top: var(--margin-desktop);
  padding-top: var(--space-px-24);
  border-top: 1px solid var(--color-border-gray);
  display: flex;
  justify-content: space-between;
}
.nav-link {
  display: flex;
  flex-direction: column;
  gap: var(--space-px-4);
  text-decoration: none;
  transition: transform 0.2s;
}
.nav-link.prev:hover {
  transform: translateX(-6px);
}
.nav-link.next:hover {
  transform: translateX(6px);
}
.nav-link.next {
  align-items: flex-end;
}
.nav-label {
  font-size: var(--text-caption);
  color: var(--color-on-surface-variant);
}
.nav-title {
  font-size: var(--text-body);
  font-weight: var(--weight-semibold);
  color: var(--color-primary);
}
.nav-title:hover {
  color: var(--color-primary-light);
}

/* ===== Sidebar ===== */
.article-sidebar {
  display: flex;
  flex-direction: column;
  gap: var(--gutter);
}
.sidebar-card {
  background: var(--color-surface);
  padding: var(--space-px-24);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-gray);
}

@media (max-width: 1023px) {
  .article-card {
    padding: var(--space-px-24);
  }
  .sidebar-card {
    display: none;
  }
}

.sidebar-title {
  font-size: var(--text-label-uppercase);
  font-weight: var(--weight-semibold);
  color: var(--color-ink);
  margin-bottom: var(--space-px-16);
}

/* TOC */
.toc-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-px-12);
}
.toc-item {
  font-size: var(--text-body);
  color: var(--color-on-surface-variant);
  text-decoration: none;
  padding-left: var(--space-px-12);
  border-left: 2px solid transparent;
  transition: all 0.2s;
  line-height: 1.4;
}
.toc-item:hover {
  color: var(--color-primary-light);
  border-left-color: var(--color-primary-light);
  transform: translateX(4px);
}
.toc-active {
  color: var(--color-primary-light);
  font-weight: var(--weight-semibold);
  border-left-color: var(--color-primary-light);
}

/* Related Articles */
.related-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-px-16);
}
.related-item {
  display: block;
  border: 1px solid var(--color-border-gray);
  padding: var(--space-px-12);
  border-radius: var(--radius-sm);
  text-decoration: none;
  transition: border-color 0.2s;
}
.related-item:hover {
  border-color: var(--color-primary-light);
}
.related-cat {
  font-size: var(--text-caption);
  color: var(--color-on-surface-variant);
  display: block;
  margin-bottom: var(--space-px-4);
}
.related-title {
  font-size: var(--text-body);
  font-weight: var(--weight-semibold);
  color: var(--color-ink);
  display: block;
}
.related-item:hover .related-title {
  color: var(--color-primary-light);
}

.loading, .empty {
  text-align: center;
  padding: var(--space-xxl);
  color: var(--color-on-surface-variant);
}
</style>
