<template>
  <div>
    <!-- Header -->
    <div class="page-head">
      <div>
        <h2 class="page-title">文章列表</h2>
        <p class="page-desc">查看、编辑和发布手册文章</p>
      </div>
      <div class="head-actions">
        <button class="btn btn-outline">
          <Icon name="filter_list" class="btn-icon" />
          筛选
        </button>
        <button class="btn btn-primary" @click="$router.push('/admin/articles/create')">
          <Icon name="add" class="btn-icon" />
          新建文章
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="filter-bar">
      <el-select v-model="filterCat" placeholder="筛选分类" clearable @change="load" class="filter-select">
        <el-option v-for="c in cats" :key="c.id" :label="c.title" :value="c.id" />
      </el-select>
      <el-select v-model="filterStatus" placeholder="筛选状态" clearable @change="load" class="filter-select">
        <el-option label="草稿" :value="0" />
        <el-option label="已发布" :value="1" />
      </el-select>
    </div>

    <!-- Content Grid -->
    <div class="content-grid">
      <!-- Main Table -->
      <div class="table-section">
        <div class="table-container" v-loading="loading">
          <!-- Table Header -->
          <div class="t-header">
            <span class="t-h-cell t-h-title">标题</span>
            <span class="t-h-cell t-h-cat">分类</span>
            <span class="t-h-cell t-h-status">状态</span>
            <span class="t-h-cell t-h-date">最后修改</span>
            <span class="t-h-cell t-h-actions">操作</span>
          </div>

          <!-- Table Rows -->
          <div
            v-for="row in list"
            :key="row.id"
            class="t-row"
          >
            <span class="t-cell t-cell-title">
              <router-link :to="`/admin/articles/${row.id}/edit`" class="t-title-link">{{ row.title }}</router-link>
            </span>
            <span class="t-cell t-cell-cat">
              <span class="cat-badge">{{ row.category_name || '未分类' }}</span>
            </span>
            <span class="t-cell t-cell-status">
              <span :class="['status-badge', row.status ? 'status-published' : 'status-draft']">
                <span class="status-dot" :class="row.status ? 'dot-green' : 'dot-orange'"></span>
                {{ row.status ? '已发布' : '草稿' }}
              </span>
            </span>
            <span class="t-cell t-cell-date">{{ formatTime(row.updated_at || row.created_at) }}</span>
            <span class="t-cell t-cell-actions">
              <button class="t-action" @click="$router.push(`/admin/articles/${row.id}/edit`)" title="编辑">
                <Icon name="edit" />
              </button>
              <button class="t-action t-action-del" @click="confirmDelete(row)" title="删除">
                <Icon name="delete" />
              </button>
            </span>
          </div>

          <div v-if="list.length === 0 && !loading" class="t-empty">暂无文章</div>
        </div>

        <!-- Pagination -->
        <div class="pagination-bar">
          <span class="page-info">显示第 1 到 {{ list.length }} 篇，共 {{ total }} 篇文章</span>
          <div class="page-controls">
            <button class="page-btn" :disabled="page <= 1" @click="page--; load()">
              <Icon name="chevron_left" />
              上一页
            </button>
            <button
              v-for="p in pageButtons"
              :key="p"
              :class="['page-num', { 'page-num-active': p === page }]"
              @click="page = p; load()"
            >{{ p }}</button>
            <button class="page-btn" :disabled="page >= totalPages" @click="page++; load()">
              下一页
              <Icon name="chevron_right" />
            </button>
          </div>
        </div>
      </div>

      <!-- Sidebar -->
      <div class="sidebar-section">
        <!-- Recent Activity -->
        <div class="sidebar-card">
          <h3 class="sidebar-card-title">近期编辑活动</h3>
          <div class="timeline">
            <div v-for="(item, i) in recentActivity" :key="i" class="timeline-item">
              <div class="timeline-dot" :class="item.status ? 'dot-primary' : 'dot-yellow'"></div>
              <div class="timeline-content">
                <span class="timeline-text">
                  <strong>{{ item.title }}</strong>
                  {{ item.status ? '已发布' : '保存为草稿' }}
                </span>
                <span class="timeline-time">{{ item.timeAgo }}</span>
              </div>
            </div>
            <div v-if="recentActivity.length === 0" class="timeline-empty">暂无编辑活动</div>
          </div>
        </div>

        <!-- Quick Management -->
        <div class="sidebar-card">
          <h3 class="sidebar-card-title">快速管理选项</h3>
          <div class="quick-grid">
            <router-link to="/admin/categories" class="quick-card">
              <Icon name="folder_shared" class="quick-icon" />
              <span class="quick-text">管理分类目录</span>
            </router-link>
            <router-link to="/" class="quick-card">
              <Icon name="help_center" class="quick-icon" />
              <span class="quick-text">查看使用手册</span>
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirm -->
    <transition name="modal">
      <div v-if="deleteModal.visible" class="modal-overlay" @click.self="deleteModal.visible = false">
        <div class="modal-box">
          <div class="modal-icon-box">
            <Icon name="warning" class="modal-icon" />
          </div>
          <h3 class="modal-title">确定要删除这篇文章吗？</h3>
          <p class="modal-desc">删除后内容将无法恢复，该操作无法撤销。</p>
          <div class="modal-actions">
            <button class="btn btn-cancel" @click="deleteModal.visible = false">取消</button>
            <button class="btn btn-danger" @click="doDelete">
              <Icon name="delete_forever" class="btn-icon" />
              确认删除
            </button>
          </div>
          <div class="modal-bar"></div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getAdminArticles, deleteArticle, getAdminCategories } from '../../api/admin.js'

const list = ref([])
const cats = ref([])
const loading = ref(false)
const total = ref(0)
const page = ref(1)
const pageSize = 20
const filterCat = ref(null)
const filterStatus = ref(null)

const deleteModal = ref({
  visible: false,
  article: null
})

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))

const pageButtons = computed(() => {
  const pages = []
  const total = totalPages.value
  if (total <= 5) {
    for (let i = 1; i <= total; i++) pages.push(i)
  } else {
    pages.push(1)
    const start = Math.max(2, page.value - 1)
    const end = Math.min(total - 1, page.value + 1)
    if (start > 2) pages.push('...')
    for (let i = start; i <= end; i++) pages.push(i)
    if (end < total - 1) pages.push('...')
    pages.push(total)
  }
  return pages
})

// Generate fake recent activity from loaded articles
const recentActivity = computed(() => {
  return list.value.slice(0, 5).map(a => {
    const timeAgo = getTimeAgo(a.updated_at || a.created_at)
    return {
      title: a.title,
      status: a.status,
      timeAgo
    }
  })
})

function getTimeAgo(dateStr) {
  if (!dateStr) return '刚刚'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '刚刚'
  if (mins < 60) return `${mins} 分钟前`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} 小时前`
  const days = Math.floor(hours / 24)
  return `${days} 天前`
}

function formatTime(dateStr) {
  if (!dateStr) return '--'
  return dateStr.slice(0, 16).replace('T', ' ')
}

async function load() {
  loading.value = true
  try {
    const params = { page: page.value, page_size: pageSize }
    if (filterCat.value) params.category_id = filterCat.value
    if (filterStatus.value !== null && filterStatus.value !== '') params.status = filterStatus.value
    const res = await getAdminArticles(params)
    list.value = res.data.list
    total.value = res.data.total
  } catch {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

function confirmDelete(article) {
  deleteModal.value = { visible: true, article }
}

async function doDelete() {
  if (!deleteModal.value.article) return
  try {
    await deleteArticle(deleteModal.value.article.id)
    ElMessage.success('已删除')
    deleteModal.value.visible = false
    load()
  } catch {
    ElMessage.error('删除失败')
  }
}

onMounted(async () => {
  try {
    cats.value = (await getAdminCategories()).data || []
  } catch {}
  load()
})
</script>

<style scoped>
.page-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-px-16);
  flex-wrap: wrap;
  gap: var(--space-px-12);
}

.page-title {
  font-size: var(--text-feature-title);
  font-weight: var(--weight-bold);
  color: var(--color-ink);
}

.page-desc {
  font-size: var(--text-caption);
  color: var(--color-on-surface-variant);
  margin-top: var(--space-px-4);
}

.head-actions {
  display: flex;
  gap: var(--space-px-8);
}

/* Filter Bar */
.filter-bar {
  margin-bottom: var(--space-px-16);
  display: flex;
  gap: var(--space-px-12);
}

.filter-select {
  width: 160px;
}

/* ===== Content Grid ===== */
.content-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--gutter);
}

@media (min-width: 1024px) {
  .content-grid {
    grid-template-columns: 1fr 320px;
  }
}

/* ===== Table ===== */
.table-container {
  background: var(--color-surface-pearl);
  border: 1px solid var(--color-border-gray);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.t-header {
  display: grid;
  grid-template-columns: 2fr 120px 100px 140px 100px;
  background: var(--color-surface-container-low);
  border-bottom: 1px solid var(--color-border-gray);
}

.t-h-cell {
  padding: var(--space-px-12) var(--space-px-16);
  font-size: var(--text-caption);
  font-weight: var(--weight-semibold);
  color: var(--color-on-surface-variant);
}

.t-row {
  display: grid;
  grid-template-columns: 2fr 120px 100px 140px 100px;
  border-bottom: 1px solid var(--color-border-gray);
  transition: background 0.15s;
}

.t-row:last-child {
  border-bottom: none;
}

.t-row:hover {
  background: var(--color-surface-container-lowest);
}

.t-cell {
  padding: var(--space-px-12) var(--space-px-16);
  display: flex;
  align-items: center;
  font-size: var(--text-body);
  color: var(--color-ink);
}

.t-cell-title {
  font-weight: var(--weight-medium);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.t-title-link {
  color: inherit;
  text-decoration: none;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.t-title-link:hover {
  color: var(--color-primary);
}

.t-cell-cat {
  justify-content: center;
}

.cat-badge {
  font-size: var(--text-badge-uppercase);
  font-weight: var(--weight-semibold);
  background: rgba(0, 86, 200, 0.08);
  color: var(--color-primary);
  padding: var(--space-px-4) var(--space-px-8);
  border-radius: var(--radius-sm);
}

.t-cell-status {
  justify-content: center;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-px-4);
  padding: var(--space-px-4) var(--space-px-12);
  border-radius: var(--radius-pill);
  font-size: var(--text-caption);
  font-weight: var(--weight-medium);
}

.status-published {
  color: var(--color-accent-green);
  background: rgba(0, 215, 34, 0.1);
}

.status-draft {
  color: var(--color-accent-orange);
  background: rgba(255, 107, 0, 0.1);
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.dot-green { background: var(--color-accent-green); }
.dot-orange { background: var(--color-accent-orange); }

.t-cell-date {
  color: var(--color-on-surface-variant);
  font-size: var(--text-caption);
  justify-content: center;
}

.t-cell-actions {
  justify-content: center;
  gap: var(--space-px-4);
}

.t-action {
  padding: var(--space-px-6);
  border: none;
  background: none;
  cursor: pointer;
  border-radius: var(--radius-sm);
  color: var(--color-on-surface-variant);
  display: flex;
  align-items: center;
  transition: all 0.15s;
}

.t-action .svg-icon {
  font-size: 18px;
}

.t-action:hover {
  color: var(--color-primary);
  background: var(--color-primary-fixed);
}

.t-action-del:hover {
  color: var(--color-error);
  background: rgba(238, 29, 54, 0.1);
}

.t-empty {
  text-align: center;
  padding: var(--space-xxl);
  color: var(--color-on-surface-variant);
}

/* ===== Pagination ===== */
.pagination-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: var(--space-px-16);
  flex-wrap: wrap;
  gap: var(--space-px-12);
}

.page-info {
  font-size: var(--text-caption);
  color: var(--color-on-surface-variant);
}

.page-controls {
  display: flex;
  align-items: center;
  gap: var(--space-px-4);
}

.page-btn {
  display: flex;
  align-items: center;
  gap: var(--space-px-4);
  padding: var(--space-px-8) var(--space-px-12);
  border: 1px solid var(--color-border-gray);
  border-radius: var(--radius-sm);
  background: transparent;
  cursor: pointer;
  font-family: var(--font-body);
  font-size: var(--text-caption);
  color: var(--color-on-surface-variant);
  transition: all 0.15s;
}

.page-btn:hover:not(:disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-btn .svg-icon {
  font-size: 16px;
}

.page-num {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-border-gray);
  border-radius: var(--radius-sm);
  background: transparent;
  cursor: pointer;
  font-family: var(--font-body);
  font-size: var(--text-caption);
  color: var(--color-on-surface-variant);
  transition: all 0.15s;
}

.page-num:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.page-num-active {
  background: var(--color-primary);
  color: var(--color-on-primary);
  border-color: var(--color-primary);
}

/* ===== Sidebar ===== */
.sidebar-section {
  display: flex;
  flex-direction: column;
  gap: var(--gutter);
}

.sidebar-card {
  background: var(--color-surface-pearl);
  border: 1px solid var(--color-border-gray);
  border-radius: var(--radius-lg);
  padding: var(--space-px-24);
}

.sidebar-card-title {
  font-size: var(--text-feature-title);
  font-weight: var(--weight-semibold);
  color: var(--color-ink);
  margin-bottom: var(--space-px-16);
}

/* Timeline */
.timeline {
  display: flex;
  flex-direction: column;
  gap: var(--space-px-12);
}

.timeline-item {
  display: flex;
  gap: var(--space-px-12);
  border-left: 2px solid var(--color-border-gray);
  padding-left: var(--space-px-12);
  position: relative;
}

.timeline-dot {
  position: absolute;
  left: -5px;
  top: 4px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.dot-primary { background: var(--color-primary); }
.dot-yellow { background: var(--color-accent-yellow); }

.timeline-content {
  flex: 1;
}

.timeline-text {
  font-size: var(--text-caption);
  color: var(--color-on-surface-variant);
  line-height: 1.4;
}

.timeline-text strong {
  color: var(--color-ink);
}

.timeline-time {
  display: block;
  font-size: var(--text-fine);
  color: var(--color-gray-300);
  margin-top: var(--space-px-4);
}

.timeline-empty {
  text-align: center;
  color: var(--color-on-surface-variant);
  font-size: var(--text-caption);
  padding: var(--space-lg) 0;
}

/* Quick Grid */
.quick-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-px-12);
}

.quick-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-px-8);
  padding: var(--space-px-16);
  border: 1px solid var(--color-border-gray);
  border-radius: var(--radius-md);
  text-decoration: none;
  transition: all 0.15s;
  text-align: center;
}

.quick-card:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.quick-icon {
  font-size: 28px;
  color: var(--color-on-surface-variant);
}

.quick-card:hover .quick-icon {
  color: var(--color-primary);
}

.quick-text {
  font-size: var(--text-caption);
  color: var(--color-on-surface-variant);
  font-weight: var(--weight-medium);
}

.quick-card:hover .quick-text {
  color: var(--color-primary);
}

/* Buttons */
.btn {
  padding: var(--space-px-8) var(--space-px-16);
  border-radius: var(--radius-md);
  font-family: var(--font-body);
  font-size: var(--text-button);
  font-weight: var(--weight-medium);
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  gap: var(--space-px-4);
  border: none;
  text-decoration: none;
}

.btn-primary {
  background: var(--color-primary);
  color: var(--color-on-primary);
}

.btn-primary:hover {
  background: var(--color-button-hover-blue);
}

.btn-outline {
  background: transparent;
  border: 1px solid var(--color-border-gray);
  color: var(--color-on-surface-variant);
}

.btn-outline:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.btn-icon {
  font-size: 18px;
}

/* Buttons in modal */
.btn-cancel {
  background: var(--color-surface-container-high);
  color: var(--color-on-surface-variant);
  border: 1px solid var(--color-border-gray);
  padding: var(--space-px-12) var(--space-px-24);
  border-radius: var(--radius-md);
  font-family: var(--font-body);
  font-size: var(--text-button);
  font-weight: var(--weight-medium);
  cursor: pointer;
}

.btn-cancel:hover {
  background: var(--color-surface-container-highest);
}

.btn-danger {
  background: var(--color-accent-red);
  color: #fff;
  padding: var(--space-px-12) var(--space-px-24);
  border-radius: var(--radius-md);
  border: none;
  font-family: var(--font-body);
  font-size: var(--text-button);
  font-weight: var(--weight-medium);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-px-4);
}

.btn-danger:hover {
  background: var(--color-on-error-container);
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1001;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(2px);
}

.modal-box {
  width: 100%;
  max-width: 400px;
  background: var(--color-surface);
  border: 1px solid var(--color-border-gray);
  border-radius: var(--radius-md);
  padding: var(--space-px-24);
  text-align: center;
  box-shadow: var(--shadow-stack-high);
}

.modal-icon-box {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(238, 29, 54, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto var(--space-px-16);
}

.modal-icon {
  font-size: 36px;
  color: var(--color-accent-red);
}

.modal-title {
  font-size: var(--text-feature-title);
  font-weight: var(--weight-bold);
  color: var(--color-ink);
  margin-bottom: var(--space-px-8);
}

.modal-desc {
  font-size: var(--text-body);
  color: var(--color-on-surface-variant);
  margin-bottom: var(--space-px-24);
}

.modal-actions {
  display: flex;
  gap: var(--space-px-12);
}

.modal-actions .btn {
  flex: 1;
}

.modal-bar {
  height: 4px;
  background: var(--color-accent-red);
  margin: var(--space-px-24) calc(-1 * var(--space-px-24)) calc(-1 * var(--space-px-24));
  border-radius: 0 0 var(--radius-md) var(--radius-md);
}

.modal-enter-active { transition: opacity 0.15s; }
.modal-leave-active { transition: opacity 0.1s; }
.modal-enter-from,
.modal-leave-to { opacity: 0; }
</style>
