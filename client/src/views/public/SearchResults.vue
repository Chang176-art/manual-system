<template>
  <div class="page">
    <GlobalNav />
    <main class="main">
      <div class="container-max">
        <div class="search-layout">
          <!-- Left Filter Sidebar -->
          <aside class="filter-sidebar">
            <div class="filter-card">
              <h3 class="filter-title">按分类筛选</h3>
              <div class="filter-items">
                <button
                  v-for="f in filters"
                  :key="f.key"
                  :class="['filter-item', { 'filter-active': activeFilter === f.key }]"
                  @click="activeFilter = f.key; doFilter()"
                >
                  <Icon :name="f.icon" class="filter-icon" />
                  <span class="filter-label">{{ f.label }}</span>
                  <span class="filter-count">{{ f.count }}</span>
                </button>
              </div>

              <div class="filter-divider"></div>

              <h3 class="filter-title">更新日期</h3>
              <div class="date-options">
                <label v-for="d in dateFilters" :key="d.value" class="date-option">
                  <input
                    type="checkbox"
                    :value="d.value"
                    v-model="selectedDates"
                    class="date-checkbox"
                    @change="doFilter"
                  />
                  <span class="date-label">{{ d.label }}</span>
                </label>
              </div>
            </div>
          </aside>

          <!-- Results Content -->
          <div class="results-content">
            <div class="results-header">
              <h2 class="results-title">搜索结果：{{ keyword ? `"${keyword}"` : '' }}</h2>
              <p class="results-meta">找到约 {{ totalResults }} 条相关结果</p>
            </div>

            <div v-if="loading" class="loading">搜索中...</div>
            <div v-else-if="results.length === 0" class="empty">未找到相关内容</div>
            <div v-else class="results-list">
              <router-link
                v-for="item in results"
                :key="item.id"
                :to="`/article/${item.id}`"
                class="result-card"
              >
                <div class="result-info">
                  <span class="result-category">{{ item.category_name || '文章' }}</span>
                  <span class="result-path">/ {{ item.category_name || '' }}</span>
                  <h3 class="result-title">{{ item.title }}</h3>
                  <p class="result-desc">{{ item.summary || item.content_text?.slice(0, 150) || '' }}</p>
                  <div class="result-footer">
                    <span class="result-date">{{ item.created_at?.slice(0, 10) }}</span>
                    <span class="result-read">阅读详情
                      <Icon name="arrow_forward" class="result-arrow" />
                    </span>
                  </div>
                </div>
              </router-link>
            </div>

            <!-- Pagination -->
            <div class="pagination" v-if="totalPages > 1">
              <button
                class="page-btn"
                :disabled="currentPage <= 1"
                @click="goToPage(currentPage - 1)"
              >
                <Icon name="chevron_left" />
              </button>

              <template v-for="p in displayedPages" :key="p">
                <span v-if="p === '...'" class="page-ellipsis">...</span>
                <button
                  v-else
                  :class="['page-btn', { 'page-active': p === currentPage }]"
                  @click="goToPage(p)"
                >{{ p }}</button>
              </template>

              <button
                class="page-btn"
                :disabled="currentPage >= totalPages"
                @click="goToPage(currentPage + 1)"
              >
                <Icon name="chevron_right" />
              </button>
            </div>
          </div>
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
import { searchArticles, getCategories } from '../../api/public.js'

const route = useRoute()
const router = useRouter()

const keyword = ref('')
const results = ref([])
const loading = ref(true)
const totalResults = ref(0)
const currentPage = ref(1)
const pageSize = 10
const activeFilter = ref('all')
const selectedDates = ref([])

const filters = ref([
  { key: 'all', label: '全部结果', icon: 'category', count: 0 },
  { key: 'guide', label: '指南', icon: 'description', count: 0 },
  { key: 'manual', label: '用户手册', icon: 'menu_book', count: 0 },
  { key: 'tasks', label: '常用任务', icon: 'task_alt', count: 0 },
  { key: 'troubleshoot', label: '故障排除', icon: 'build', count: 0 },
])

const dateFilters = [
  { label: '最近一周', value: 'week' },
  { label: '最近一个月', value: 'month' },
  { label: '半年以内', value: 'halfyear' },
]

const totalPages = computed(() => Math.max(1, Math.ceil(totalResults.value / pageSize)))

const displayedPages = computed(() => {
  const pages = []
  const total = totalPages.value
  const current = currentPage.value

  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i)
  } else {
    pages.push(1)
    if (current > 3) pages.push('...')
    const start = Math.max(2, current - 1)
    const end = Math.min(total - 1, current + 1)
    for (let i = start; i <= end; i++) pages.push(i)
    if (current < total - 2) pages.push('...')
    pages.push(total)
  }
  return pages
})

async function doSearch(q) {
  keyword.value = q || route.query.q || ''
  if (!keyword.value) {
    results.value = []
    loading.value = false
    return
  }
  loading.value = true
  try {
    const res = await searchArticles(keyword.value)
    results.value = res.data || []
    totalResults.value = results.value.length

    // Update filter counts based on results
    filters.value[0].count = results.value.length

    // Count by category name heuristics
    const counts = { guide: 0, manual: 0, tasks: 0, troubleshoot: 0 }
    results.value.forEach(r => {
      const name = (r.category_name || '').toLowerCase()
      if (name.includes('指南')) counts.guide++
      else if (name.includes('手册')) counts.manual++
      else if (name.includes('任务')) counts.tasks++
      else if (name.includes('故障') || name.includes('排除')) counts.troubleshoot++
    })
    filters.value[1].count = counts.guide
    filters.value[2].count = counts.manual
    filters.value[3].count = counts.tasks
    filters.value[4].count = counts.troubleshoot
  } catch (e) {
    console.error(e)
    results.value = []
    totalResults.value = 0
  } finally {
    loading.value = false
  }
}

function doFilter() {
  currentPage.value = 1
  // Apply filters locally
  let filtered = [...results.value]

  if (activeFilter.value !== 'all') {
    const map = { guide: '指南', manual: '手册', tasks: '任务', troubleshoot: '故障' }
    const keyword = map[activeFilter.value]
    if (keyword) {
      filtered = filtered.filter(r => (r.category_name || '').includes(keyword))
    }
  }

  if (selectedDates.value.length > 0) {
    const now = new Date()
    filtered = filtered.filter(r => {
      if (!r.created_at) return false
      const d = new Date(r.created_at)
      const diff = (now - d) / (1000 * 60 * 60 * 24)
      if (selectedDates.value.includes('week')) return diff <= 7
      if (selectedDates.value.includes('month')) return diff <= 30
      if (selectedDates.value.includes('halfyear')) return diff <= 182
      return true
    })
  }

  totalResults.value = filtered.length
  // For simplicity, just show the filtered count
  // In a real app, we'd re-fetch from API
}

function goToPage(p) {
  if (p < 1 || p > totalPages.value) return
  currentPage.value = p
}

onMounted(() => {
  doSearch(route.query.q)
})

watch(() => route.query.q, (q) => {
  doSearch(q)
})
</script>

<style scoped>
.search-layout {
  display: flex;
  flex-direction: column;
  gap: var(--gutter);
  padding: var(--space-px-24) 0;
}

@media (min-width: 768px) {
  .search-layout {
    flex-direction: row;
  }
}

/* ===== Filter Sidebar ===== */
.filter-sidebar {
  width: 100%;
  flex-shrink: 0;
}

@media (min-width: 768px) {
  .filter-sidebar {
    width: 16rem;
  }
}

.filter-card {
  background: var(--color-surface);
  padding: var(--space-px-16);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border-gray);
  position: sticky;
  top: 80px;
}

.filter-title {
  font-size: var(--text-label-uppercase);
  font-weight: var(--weight-semibold);
  color: var(--color-on-surface-variant);
  margin-bottom: var(--space-px-16);
}

.filter-items {
  display: flex;
  flex-direction: column;
  gap: var(--space-px-4);
}

.filter-item {
  display: flex;
  align-items: center;
  width: 100%;
  padding: var(--space-px-8);
  border-radius: var(--radius-sm);
  border: none;
  background: none;
  cursor: pointer;
  text-align: left;
  font-family: var(--font-body);
  transition: background 0.15s;
}

.filter-item:hover {
  background: var(--color-surface-container-low);
}

.filter-active {
  background: var(--color-surface-container-low);
}

.filter-active .filter-label {
  color: var(--color-primary);
  font-weight: var(--weight-semibold);
}

.filter-icon {
  font-size: 18px;
  color: var(--color-on-surface-variant);
  margin-right: var(--space-px-8);
}

.filter-active .filter-icon {
  color: var(--color-primary);
}

.filter-label {
  flex: 1;
  font-size: var(--text-body);
  color: var(--color-on-surface-variant);
}

.filter-count {
  font-size: var(--text-caption);
  color: var(--color-on-surface-variant);
}

/* Date filter */
.filter-divider {
  margin: var(--space-px-24) 0 var(--space-px-16);
  padding-top: var(--space-px-16);
  border-top: 1px solid var(--color-border-gray);
}

.date-options {
  display: flex;
  flex-direction: column;
  gap: var(--space-px-8);
}

.date-option {
  display: flex;
  align-items: center;
  gap: var(--space-px-8);
  cursor: pointer;
}

.date-checkbox {
  width: 16px;
  height: 16px;
  border: 1px solid var(--color-border-gray);
  border-radius: 3px;
  accent-color: var(--color-primary);
}

.date-label {
  font-size: var(--text-body);
  color: var(--color-on-surface-variant);
  transition: color 0.2s;
}

.date-option:hover .date-label {
  color: var(--color-primary);
}

/* ===== Results Content ===== */
.results-content {
  flex: 1;
  min-width: 0;
}

.results-header {
  margin-bottom: var(--space-px-24);
}

.results-title {
  font-size: var(--text-sub-heading);
  font-weight: var(--weight-semibold);
  color: var(--color-ink);
}

.results-meta {
  font-size: var(--text-caption);
  color: var(--color-on-surface-variant);
  margin-top: var(--space-px-4);
}

/* Result Cards */
.results-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-px-16);
}

.result-card {
  display: block;
  background: var(--color-surface);
  padding: var(--space-px-24);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border-gray);
  text-decoration: none;
  transition: border-color 0.3s;
}

.result-card:hover {
  border-color: var(--color-border-hover);
}

.result-category {
  display: inline-block;
  font-size: var(--text-badge-uppercase);
  font-weight: var(--weight-semibold);
  background: rgba(0, 86, 200, 0.08);
  color: var(--color-primary);
  padding: var(--space-px-2) var(--space-px-8);
  border-radius: var(--radius-sm);
  margin-bottom: var(--space-px-4);
}

.result-path {
  font-size: var(--text-caption);
  color: var(--color-on-surface-variant);
  margin-left: var(--space-px-8);
}

.result-title {
  font-size: var(--text-feature-title);
  font-weight: var(--weight-semibold);
  color: var(--color-ink);
  margin-top: var(--space-px-4);
  transition: color 0.2s;
}

.result-card:hover .result-title {
  color: var(--color-primary);
}

.result-desc {
  font-size: var(--text-body);
  color: var(--color-on-surface-variant);
  margin-top: var(--space-px-8);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: var(--leading-relaxed);
}

.result-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: var(--space-px-12);
}

.result-date {
  font-size: var(--text-caption);
  color: var(--color-on-surface-variant);
}

.result-read {
  display: flex;
  align-items: center;
  gap: var(--space-px-4);
  font-size: var(--text-button);
  color: var(--color-primary);
  font-weight: var(--weight-medium);
}

.result-read:hover {
  text-decoration: underline;
}

.result-arrow {
  font-size: 18px;
}

/* Pagination */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-px-4);
  padding-top: var(--space-px-24);
  margin-top: var(--space-px-24);
}

.page-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-border-gray);
  border-radius: var(--radius-md);
  background: transparent;
  cursor: pointer;
  font-family: var(--font-body);
  font-size: var(--text-body);
  color: var(--color-on-surface-variant);
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled):not(.page-active) {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-active {
  background: var(--color-primary);
  color: var(--color-on-primary);
  border-color: var(--color-primary);
  font-weight: var(--weight-semibold);
}

.page-ellipsis {
  padding: 0 var(--space-px-8);
  color: var(--color-on-surface-variant);
}

/* States */
.loading, .empty {
  text-align: center;
  padding: var(--space-xxl);
  color: var(--color-on-surface-variant);
}

@media (max-width: 768px) {
  .result-card {
    padding: var(--space-px-16);
  }
}
</style>
