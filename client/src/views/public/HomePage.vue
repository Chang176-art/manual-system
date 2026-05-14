<template>
  <div class="page">
    <GlobalNav />
    <main class="main">
      <!-- Hero Section -->
      <section class="hero-section">
        <div class="hero-pattern-bg"></div>
        <div class="hero-gradient"></div>
        <div class="hero-blob"></div>
        <div class="hero-content">
          <h1 class="hero-title">我们能为您提供什么帮助？</h1>
          <p class="hero-desc">搜索我们全面的教程、使用指南和平台基础资源，助您轻松上手。</p>
          <div class="search-box">
            <div class="search-glow"></div>
            <div class="search-bar">
              <Icon name="search" class="search-icon" />
              <input
                v-model="searchKeyword"
                class="search-input"
                type="text"
                placeholder="搜索教程、文章或常见问题..."
                @keyup.enter="doSearch"
              />
              <button class="search-btn" @click="doSearch">
                搜索
                <Icon name="arrow_forward" class="search-btn-icon" />
              </button>
            </div>
          </div>
          <div class="hot-search">
            <span class="hot-label">热门搜索：</span>
            <button v-for="kw in hotKeywords" :key="kw" class="hot-keyword" @click="searchKeyword = kw; doSearch()">{{ kw }}</button>
          </div>
        </div>
      </section>

      <!-- Categories Section -->
      <section class="categories-section" v-if="!selectedCatId">
        <div class="section-header">
          <div>
            <h2 class="section-title">探索分类</h2>
            <p class="section-subtitle">{{ categories.length }} 个分类，管理账户、优化设置和提升效率所需的一切。</p>
          </div>
          <router-link to="/?cat=all" class="section-all">查看所有指南 →</router-link>
        </div>
        <div class="bento-grid">
          <template v-for="(cat, index) in categories.slice(0, 5)" :key="cat.id">
            <!-- Large card (index 0): col-span-2, row-span-2 -->
            <router-link
              v-if="index === 0"
              :to="`/?cat=${cat.id}`"
              class="bento-card bento-large"
            >
              <div class="bento-large-bg"></div>
              <div class="bento-large-content">
                <span class="bento-badge">{{ cat.icon || '入门' }}</span>
                <h3 class="bento-large-title">{{ cat.title }}</h3>
                <p class="bento-large-desc">{{ cat.description }}</p>
                <div class="bento-large-meta">
                  <div>
                    <span class="bento-count-num">{{ cat.article_count || 0 }}</span>
                    <span class="bento-count-label">篇指南</span>
                  </div>
                  <span class="bento-cta">立即开始 →</span>
                </div>
              </div>
            </router-link>

            <!-- Medium card (index 1): col-span-2 -->
            <router-link
              v-else-if="index === 1"
              :to="`/?cat=${cat.id}`"
              class="bento-card bento-medium"
            >
              <div class="bento-icon-box bento-icon-yellow">
                <Icon name="manage_accounts" />
              </div>
              <h3 class="bento-card-title">{{ cat.title }}</h3>
              <p class="bento-card-desc">{{ cat.description }}</p>
              <div class="bento-card-footer">
                <span class="bento-count">{{ cat.article_count || 0 }} 篇指南</span>
                <div class="bento-quick-links">
                  <span class="quick-link">成员权限</span>
                  <span class="quick-link">账单订阅</span>
                </div>
              </div>
            </router-link>

            <!-- Small icon card 1 (index 2): col-span-1 -->
            <router-link
              v-else-if="index === 2"
              :to="`/?cat=${cat.id}`"
              class="bento-card bento-small-icon"
            >
              <div class="bento-icon-box bento-icon-pink">
                <Icon name="person" />
              </div>
              <h3 class="bento-card-title">{{ cat.title }}</h3>
              <p class="bento-card-desc">{{ cat.description }}</p>
              <div class="bento-card-footer-row">
                <span class="bento-micro-count">{{ cat.article_count || 0 }} 篇指南</span>
                <Icon name="arrow_forward" class="bento-arrow" />
              </div>
            </router-link>

            <!-- Small dark card (index 3): col-span-1 -->
            <router-link
              v-else-if="index === 3"
              :to="`/?cat=${cat.id}`"
              class="bento-card bento-dark"
            >
              <div class="bento-icon-box bento-icon-white">
                <Icon name="quiz" />
              </div>
              <h3 class="bento-dark-title">{{ cat.title }}</h3>
              <p class="bento-dark-desc">{{ cat.description }}</p>
              <div class="bento-card-footer-row">
                <span class="bento-micro-count-dark">{{ cat.article_count || 0 }} 篇解答</span>
                <Icon name="arrow_forward" class="bento-arrow-blue" />
              </div>
            </router-link>

            <!-- Small icon card 2 (index 4): col-span-1 -->
            <router-link
              v-else
              :to="`/?cat=${cat.id}`"
              class="bento-card bento-small-icon"
            >
              <div class="bento-icon-box bento-icon-green">
                <Icon name="code" />
              </div>
              <h3 class="bento-card-title">{{ cat.title }}</h3>
              <p class="bento-card-desc">{{ cat.description }}</p>
              <div class="bento-card-footer-row">
                <span class="bento-micro-count">{{ cat.article_count || 0 }} 篇文档</span>
                <Icon name="arrow_forward" class="bento-arrow" />
              </div>
            </router-link>
          </template>
        </div>
      </section>

      <!-- Category Articles View -->
      <div class="container" v-if="selectedCatId">
        <div class="back-bar">
          <router-link to="/" class="back-link">← 全部分类</router-link>
          <h2 class="cat-title">{{ selectedCat?.title }}</h2>
          <p class="cat-desc" v-if="selectedCat?.description">{{ selectedCat.description }}</p>
        </div>
        <div v-if="loading" class="loading">加载中...</div>
        <div v-else-if="catArticles.length === 0" class="empty">该分类暂无文章</div>
        <div v-else class="article-list">
          <router-link
            v-for="a in catArticles"
            :key="a.id"
            :to="`/article/${a.id}`"
            class="article-item"
          >
            <h3 class="article-item-title">{{ a.title }}</h3>
            <span class="article-item-date">{{ a.created_at?.slice(0, 10) }}</span>
          </router-link>
        </div>
      </div>
    </main>
    <FooterBar />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import GlobalNav from '../../components/GlobalNav.vue'
import FooterBar from '../../components/FooterBar.vue'
import { getCategories, getArticles } from '../../api/public.js'

const route = useRoute()
const router = useRouter()
const categories = ref([])
const loading = ref(true)
const catArticles = ref([])
const searchKeyword = ref('')

const hotKeywords = ['个人中心', '账单管理', '用户权限']

const selectedCatId = computed(() => route.query.cat || null)
const selectedCat = computed(() => categories.value.find(c => String(c.id) === selectedCatId.value))

function doSearch() {
  if (searchKeyword.value.trim()) {
    router.push({ path: '/search', query: { q: searchKeyword.value.trim() } })
  }
}

async function loadCategories() {
  try {
    const res = await getCategories()
    categories.value = res.data
  } catch (e) {
    console.error(e)
  }
}

async function loadArticlesByCat(catId) {
  loading.value = true
  try {
    const res = await getArticles({ category_id: catId })
    catArticles.value = res.data.list
  } catch (e) {
    console.error(e)
    catArticles.value = []
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await loadCategories()
  if (selectedCatId.value) {
    await loadArticlesByCat(selectedCatId.value)
  } else {
    loading.value = false
  }
})

watch(selectedCatId, async (val) => {
  if (val) {
    await loadArticlesByCat(val)
  } else {
    catArticles.value = []
    loading.value = false
  }
})
</script>

<style scoped>
/* ========== Hero Section ========== */
.hero-section {
  position: relative;
  padding: var(--space-px-24) 0;
  overflow: hidden;
}
.hero-pattern-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  background-color: var(--color-canvas);
  background-image: radial-gradient(circle, var(--color-primary) 0.5px, transparent 0.5px);
  background-size: 20px 20px;
  background-position: 10px 10px;
  opacity: 0.03;
}
.hero-gradient {
  position: absolute;
  inset: 0;
  z-index: 0;
  background: linear-gradient(to bottom right, rgba(0,86,200,0.08), transparent 60%);
  opacity: 0.6;
}
.hero-blob {
  position: absolute;
  top: 0;
  right: 0;
  width: 800px;
  height: 800px;
  background: var(--color-primary);
  border-radius: 50%;
  filter: blur(120px);
  margin-right: -24rem;
  margin-top: -24rem;
  opacity: 0.08;
  z-index: 0;
}
.hero-content {
  position: relative;
  z-index: 1;
  max-width: var(--content-max);
  margin: 0 auto;
  padding: 4rem var(--margin-desktop) 0;
  text-align: center;
}
.hero-title {
  font-size: var(--text-hero-mobile);
  font-weight: var(--weight-semibold);
  line-height: var(--leading-hero);
  letter-spacing: -0.8px;
  color: var(--color-ink);
  margin-bottom: var(--space-px-24);
  max-width: 56rem;
  margin-left: auto;
  margin-right: auto;
}
.hero-desc {
  font-size: var(--text-body-large);
  font-weight: var(--weight-medium);
  line-height: var(--leading-relaxed);
  color: var(--color-on-surface-variant);
  margin-bottom: var(--space-px-24);
  max-width: 36rem;
  margin-left: auto;
  margin-right: auto;
}

/* Search Box */
.search-box {
  max-width: 42rem;
  margin: 0 auto;
  position: relative;
}
.search-glow {
  position: absolute;
  inset: -1px;
  background: var(--color-primary);
  opacity: 0.15;
  filter: blur(12px);
  border-radius: var(--radius-md);
  transition: opacity 0.3s;
}
.search-box:focus-within .search-glow {
  opacity: 0.3;
}
.search-bar {
  position: relative;
  display: flex;
  align-items: center;
  background: var(--color-surface-pearl);
  border: 1px solid var(--color-border-gray);
  padding: var(--space-px-8);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-webflow);
  transition: box-shadow 0.2s, border-color 0.2s;
}
.search-bar:focus-within {
  box-shadow: 0 0 0 2px rgba(0, 86, 200, 0.15);
  border-color: var(--color-primary);
}
.search-icon {
  margin-left: var(--space-px-16);
  color: var(--color-on-surface-variant);
  font-size: 24px;
}
.search-input {
  width: 100%;
  border: none;
  background: transparent;
  padding: var(--space-px-16);
  font-family: var(--font-body);
  font-size: var(--text-body);
  font-weight: var(--weight-medium);
  color: var(--color-ink);
  outline: none;
}
.search-input::placeholder {
  color: var(--color-gray-300);
}
.search-btn {
  display: flex;
  align-items: center;
  gap: var(--space-px-8);
  background: var(--color-primary);
  color: var(--color-on-primary);
  padding: var(--space-px-16) var(--space-px-24);
  border-radius: var(--radius-md);
  border: none;
  font-family: var(--font-body);
  font-size: var(--text-button);
  font-weight: var(--weight-medium);
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.2s;
}
.search-btn:hover {
  background: var(--color-button-hover-blue);
}
.search-btn-icon {
  font-size: 18px;
}

/* Hot Search */
.hot-search {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-px-16);
  margin-top: var(--space-px-24);
  padding-bottom: var(--space-px-24);
}
.hot-label {
  font-size: var(--text-caption);
  color: var(--color-on-surface-variant);
  line-height: 1.6;
}
.hot-keyword {
  font-size: var(--text-caption);
  color: var(--color-primary);
  font-weight: var(--weight-semibold);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  line-height: 1.6;
  font-family: var(--font-body);
}
.hot-keyword:hover {
  text-decoration: underline;
}

/* ========== Categories Section ========== */
.categories-section {
  max-width: var(--content-max);
  margin: 0 auto;
  padding: var(--space-px-24) var(--margin-desktop);
}

/* Section Header */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: var(--space-px-24);
}
.section-title {
  font-size: var(--text-section-heading-mobile);
  font-weight: var(--weight-semibold);
  line-height: var(--leading-section);
  color: var(--color-ink);
}
.section-subtitle {
  font-size: var(--text-body);
  color: var(--color-on-surface-variant);
  margin-top: var(--space-px-8);
}
.section-all {
  display: none;
  align-items: center;
  gap: var(--space-px-8);
  font-size: var(--text-button);
  font-weight: var(--weight-medium);
  color: var(--color-primary);
  text-decoration: none;
}
.section-all:hover {
  color: var(--color-primary-light);
}

@media (min-width: 768px) {
  .hero-title {
    font-size: var(--text-hero);
  }
  .section-title {
    font-size: var(--text-section-heading);
  }
  .section-all {
    display: flex;
  }
}

/* Bento Grid */
.bento-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--gutter);
}

@media (min-width: 768px) {
  .bento-grid {
    grid-template-columns: repeat(4, 1fr);
    grid-template-rows: auto auto;
  }
}

/* All bento cards base */
.bento-card {
  display: flex;
  flex-direction: column;
  border-radius: var(--radius-md);
  text-decoration: none;
  transition: all 0.3s;
  overflow: hidden;
}

/* ===== Large Card (col-span-2, row-span-2) ===== */
.bento-large {
  grid-column: 1 / -1;
  background: var(--color-surface-pearl);
  border: 1px solid var(--color-border-gray);
  position: relative;
  min-height: 400px;
}
.bento-large:hover {
  border-color: rgba(0, 86, 200, 0.4);
  box-shadow: var(--shadow-webflow);
}
.bento-large-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(0,86,200,0.03) 0%, transparent 50%);
}
.bento-large-content {
  position: relative;
  padding: var(--space-px-24);
  display: flex;
  flex-direction: column;
  height: 100%;
  justify-content: space-between;
}
.bento-badge {
  display: inline-block;
  font-size: var(--text-badge-uppercase);
  font-weight: var(--weight-semibold);
  background: rgba(0, 86, 200, 0.08);
  color: var(--color-primary);
  padding: var(--space-px-8) var(--space-px-16);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-px-16);
  align-self: flex-start;
}
.bento-large-title {
  font-size: var(--text-sub-heading);
  font-weight: var(--weight-semibold);
  color: var(--color-ink);
  margin-bottom: var(--space-px-16);
}
.bento-large-desc {
  font-size: var(--text-body);
  color: var(--color-on-surface-variant);
  margin-bottom: var(--space-px-24);
  max-width: 24rem;
  line-height: var(--leading-relaxed);
}
.bento-large-meta {
  display: flex;
  align-items: center;
  gap: var(--space-px-24);
  margin-top: auto;
}
.bento-count-num {
  font-size: var(--text-feature-title);
  font-weight: var(--weight-semibold);
  color: var(--color-ink);
}
.bento-count-label {
  font-size: var(--text-caption);
  color: var(--color-on-surface-variant);
  margin-left: var(--space-px-4);
}
.bento-cta {
  font-size: var(--text-button);
  font-weight: var(--weight-semibold);
  color: var(--color-primary);
}

@media (min-width: 768px) {
  .bento-large {
    grid-column: span 2;
    grid-row: span 2;
  }
}

/* ===== Medium Card (col-span-2) ===== */
.bento-medium {
  grid-column: 1 / -1;
  background: var(--color-surface-pearl);
  border: 1px solid var(--color-border-gray);
  padding: var(--space-px-24);
}
.bento-medium:hover {
  border-color: rgba(0, 86, 200, 0.4);
  box-shadow: var(--shadow-webflow);
}

@media (min-width: 768px) {
  .bento-medium {
    grid-column: span 2;
  }
}

/* ===== Small Icon Card (col-span-1) ===== */
.bento-small-icon {
  background: var(--color-surface-pearl);
  border: 1px solid var(--color-border-gray);
  padding: var(--space-px-24);
}
.bento-small-icon:hover {
  border-color: rgba(0, 86, 200, 0.4);
  box-shadow: var(--shadow-webflow);
}

/* ===== Dark Card (col-span-1) ===== */
.bento-dark {
  background: var(--color-near-black);
  border: 1px solid var(--color-border-gray);
  padding: var(--space-px-24);
}
.bento-dark:hover {
  box-shadow: var(--shadow-webflow);
}

/* Icon box */
.bento-icon-box {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--space-px-16);
}
.bento-icon-box .svg-icon {
  font-size: 24px;
}
.bento-icon-yellow {
  width: 48px;
  height: 48px;
  background: var(--color-accent-yellow-bg);
  color: var(--color-accent-yellow);
}
.bento-icon-pink {
  background: var(--color-accent-pink-bg);
  color: var(--color-accent-pink);
}
.bento-icon-green {
  background: var(--color-accent-green-bg);
  color: var(--color-accent-green);
}
.bento-icon-white {
  background: rgba(255,255,255,0.1);
  color: #fff;
}

/* Card text */
.bento-card-title {
  font-size: var(--text-feature-title);
  font-weight: var(--weight-semibold);
  color: var(--color-ink);
  margin-bottom: var(--space-px-8);
}
.bento-card-desc {
  font-size: var(--text-body);
  color: var(--color-on-surface-variant);
  line-height: var(--leading-relaxed);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: var(--space-px-16);
}
.bento-dark-title {
  font-size: var(--text-body-large);
  font-weight: var(--weight-medium);
  color: #fff;
  margin-bottom: var(--space-px-8);
}
.bento-dark-desc {
  font-size: var(--text-caption);
  color: var(--color-gray-300);
  line-height: var(--leading-relaxed);
  margin-bottom: var(--space-px-16);
}

/* Card footer */
.bento-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
}
.bento-count {
  font-size: var(--text-caption);
  color: var(--color-on-surface-variant);
}
.bento-quick-links {
  display: flex;
  gap: var(--space-px-8);
}
.quick-link {
  font-size: var(--text-button);
  font-weight: var(--weight-semibold);
  color: var(--color-primary);
  background: rgba(0, 86, 200, 0.08);
  padding: var(--space-px-8) var(--space-px-16);
  border-radius: var(--radius-md);
}
.quick-link:hover {
  background: rgba(0, 86, 200, 0.15);
}

.bento-card-footer-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
}
.bento-micro-count {
  font-size: var(--text-micro-label);
  font-weight: var(--weight-semibold);
  color: var(--color-on-surface-variant);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.bento-micro-count-dark {
  font-size: var(--text-micro-label);
  font-weight: var(--weight-semibold);
  color: var(--color-gray-300);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.bento-arrow {
  font-size: 20px;
  color: var(--color-primary);
  transition: transform 0.2s;
}
.bento-card:hover .bento-arrow {
  transform: translateX(4px);
}
.bento-arrow-blue {
  font-size: 20px;
  color: var(--color-blue-400);
  transition: transform 0.2s;
}
.bento-card:hover .bento-arrow-blue {
  transform: translateX(4px);
}

/* ========== Category Articles View ========== */
.back-bar {
  padding: var(--space-lg) 0 var(--space-md);
}
.back-link {
  font-size: var(--text-caption);
  color: var(--color-primary);
  text-decoration: none;
}
.back-link:hover { color: var(--color-primary-light); }
.cat-title {
  font-size: var(--text-display-mobile);
  font-weight: var(--weight-strong);
  margin-top: var(--space-sm);
  color: var(--color-ink);
}
.cat-desc {
  font-size: var(--text-caption);
  color: var(--color-on-surface-variant);
  margin-top: var(--space-xs);
}
.article-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  padding-bottom: var(--space-xxl);
}
.article-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-md) var(--space-lg);
  border: 1px solid var(--color-hairline);
  border-radius: var(--radius-sm);
  text-decoration: none;
  color: var(--color-ink);
  transition: border-color 0.2s;
}
.article-item:hover { border-color: var(--color-primary); }
.article-item-title {
  font-size: var(--text-body);
  font-weight: var(--weight-strong);
}
.article-item-date {
  font-size: var(--text-caption);
  color: var(--color-on-surface-variant);
  white-space: nowrap;
  margin-left: var(--space-md);
}
.loading, .empty {
  text-align: center;
  padding: var(--space-xxl);
  color: var(--color-on-surface-variant);
}

@media (max-width: 768px) {
  .hero-content {
    padding: 2rem var(--margin-mobile) 0;
  }
  .categories-section {
    padding: var(--space-px-24) var(--margin-mobile);
  }
}
</style>
