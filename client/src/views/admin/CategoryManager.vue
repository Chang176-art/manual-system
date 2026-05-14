<template>
  <div class="category-manager">
    <!-- Breadcrumb -->
    <nav class="breadcrumb">
      <router-link to="/admin/articles" class="bc-link">控制台</router-link>
      <Icon name="chevron_right" class="bc-sep" />
      <span class="bc-current">分类管理</span>
    </nav>

    <!-- Header -->
    <div class="page-header">
      <div>
        <h2 class="page-title">分类目录管理</h2>
      </div>
      <div class="header-actions">
        <div class="header-search">
          <Icon name="search" class="hs-icon" />
          <input v-model="searchQuery" class="hs-input" placeholder="搜索分类..." />
        </div>
        <button class="btn btn-primary" @click="openCreatePanel">
          <Icon name="add_circle" class="btn-icon" />
          新建分类
        </button>
      </div>
    </div>

    <!-- Stat Cards -->
    <div class="stat-grid">
      <div class="stat-card">
        <Icon name="category" class="stat-icon stat-icon-primary" />
        <div class="stat-body">
          <div class="stat-number">{{ categories.length }}</div>
          <div class="stat-label">总分类数量</div>
          <div class="stat-trend">
            <Icon name="trending_up" class="trend-icon" />
            较上月 +3
          </div>
        </div>
      </div>
      <div class="stat-card">
        <Icon name="dynamic_feed" class="stat-icon stat-icon-orange" />
        <div class="stat-body">
          <div class="stat-number">{{ activeCount }}</div>
          <div class="stat-label">活跃分类</div>
          <div class="stat-sub">{{ emptyCount }}个分类暂无文章</div>
        </div>
      </div>
      <div class="stat-card">
        <Icon name="local_fire_department" class="stat-icon stat-icon-pink" />
        <div class="stat-body">
          <div class="stat-number stat-hot">{{ hottest?.title || '--' }}</div>
          <div class="stat-label">最热门分类</div>
          <div class="stat-sub">本月浏览量 12.4k</div>
        </div>
      </div>
    </div>

    <!-- Categories Table -->
    <div class="table-container" v-loading="loading">
      <div class="table-header">
        <span class="th-cell">分类名称</span>
        <span class="th-cell">描述内容</span>
        <span class="th-cell th-count">文章数量</span>
        <span class="th-cell th-actions">操作</span>
      </div>

      <div v-for="cat in filteredCategories" :key="cat.id" class="table-row">
        <div class="td-cell td-name">
          <div class="cat-icon-box" :style="getIconStyle(cat)">
            <Icon :name="cat.icon || 'folder'" />
          </div>
          <span class="cat-name">{{ cat.title }}</span>
        </div>
        <div class="td-cell td-desc">{{ cat.description || '--' }}</div>
        <div class="td-cell td-count">{{ cat.article_count || 0 }}</div>
        <div class="td-cell td-actions">
          <button class="action-btn action-edit" @click="openEditPanel(cat)" title="编辑">
            <Icon name="edit" />
          </button>
          <button class="action-btn action-delete" @click="confirmDelete(cat)" title="删除">
            <Icon name="delete" />
          </button>
        </div>
      </div>

      <div v-if="filteredCategories.length === 0 && !loading" class="table-empty">
        暂无分类
      </div>
    </div>

    <!-- Create/Edit Side Panel -->
    <transition name="panel">
      <div v-if="panel.visible" class="panel-overlay" @click.self="closePanel">
        <div class="side-panel">
          <div class="panel-header">
            <h3 class="panel-title">{{ panel.isEdit ? '编辑分类' : '新建分类' }}</h3>
            <button class="panel-close" @click="closePanel">
              <Icon name="close" />
            </button>
          </div>

          <div class="panel-body">
            <div class="form-group">
              <label class="form-label">分类名称</label>
              <input v-model="panel.form.title" class="form-input" placeholder="例如：API 参考" />
            </div>

            <div class="form-group">
              <label class="form-label">分类图标</label>
              <div class="icon-grid">
                <button
                  v-for="icon in iconOptions"
                  :key="icon"
                  :class="['icon-option', { 'icon-active': panel.form.icon === icon }]"
                  @click="panel.form.icon = icon"
                >
                  <Icon :name="icon" />
                </button>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">分类描述</label>
              <textarea
                v-model="panel.form.description"
                class="form-textarea"
                rows="4"
                placeholder="描述该分类包含的内容范围..."
              ></textarea>
            </div>

            <div class="form-group">
              <label class="form-label">父级分类</label>
              <select v-model="panel.form.parent_id" class="form-select">
                <option :value="null">无 (顶级分类)</option>
                <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                  {{ cat.title }}
                </option>
              </select>
            </div>
          </div>

          <div class="panel-footer">
            <button class="btn btn-cancel" @click="closePanel">取消</button>
            <button class="btn btn-primary" @click="saveCategory" :disabled="saving">
              {{ saving ? '保存中...' : (panel.isEdit ? '更新分类' : '创建分类') }}
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Delete Confirm -->
    <transition name="modal">
      <div v-if="deleteModal.visible" class="modal-overlay" @click.self="deleteModal.visible = false">
        <div class="modal-box">
          <div class="modal-icon-box">
            <Icon name="warning" class="modal-icon" />
          </div>
          <h3 class="modal-title">确定要删除「{{ deleteModal.cat?.title }}」分类吗？</h3>
          <p class="modal-desc">删除后该分类下的文章将无法归类，该操作无法撤销。</p>
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
import { getAdminCategories, createCategory, updateCategory, deleteCategory } from '../../api/admin.js'

const categories = ref([])
const loading = ref(false)
const saving = ref(false)
const searchQuery = ref('')

const iconOptions = ['code', 'description', 'help', 'security', 'folder', 'settings_accessibility', 'book', 'school']

const panel = ref({
  visible: false,
  isEdit: false,
  form: { title: '', icon: 'code', description: '', parent_id: null }
})

const deleteModal = ref({
  visible: false,
  cat: null
})

const filteredCategories = computed(() => {
  if (!searchQuery.value) return categories.value
  const q = searchQuery.value.toLowerCase()
  return categories.value.filter(c =>
    c.title.toLowerCase().includes(q) || (c.description || '').toLowerCase().includes(q)
  )
})

const activeCount = computed(() => categories.value.filter(c => c.status !== 0).length)
const emptyCount = computed(() => categories.value.filter(c => !c.article_count || c.article_count === 0).length)
const hottest = computed(() => {
  if (categories.value.length === 0) return null
  return [...categories.value].sort((a, b) => (b.article_count || 0) - (a.article_count || 0))[0]
})

const iconColors = ['#0056c8', '#cb4c00', '#600de6', '#146ef5', '#ed52cb', '#00d722', '#ff6b00', '#3b89ff']

function getIconStyle(cat) {
  const idx = iconOptions.indexOf(cat.icon || 'folder')
  const color = iconColors[Math.max(0, idx % iconColors.length)]
  return {
    background: `${color}12`,
    color: color
  }
}

async function load() {
  loading.value = true
  try {
    const res = await getAdminCategories()
    categories.value = res.data || []
  } catch {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

function openCreatePanel() {
  panel.value = {
    visible: true,
    isEdit: false,
    form: { title: '', icon: 'code', description: '', parent_id: null }
  }
}

function openEditPanel(cat) {
  panel.value = {
    visible: true,
    isEdit: true,
    form: { title: cat.title, icon: cat.icon || 'folder', description: cat.description || '', parent_id: cat.parent_id },
    id: cat.id
  }
}

function closePanel() {
  panel.value.visible = false
}

async function saveCategory() {
  if (!panel.value.form.title.trim()) {
    ElMessage.warning('请输入分类名称')
    return
  }
  saving.value = true
  try {
    if (panel.value.isEdit) {
      await updateCategory(panel.value.id, panel.value.form)
    } else {
      await createCategory(panel.value.form)
    }
    ElMessage.success('保存成功')
    closePanel()
    load()
  } catch {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

function confirmDelete(cat) {
  deleteModal.value = { visible: true, cat }
}

async function doDelete() {
  if (!deleteModal.value.cat) return
  try {
    await deleteCategory(deleteModal.value.cat.id)
    ElMessage.success('已删除')
    deleteModal.value.visible = false
    load()
  } catch {
    ElMessage.error('删除失败')
  }
}

onMounted(load)
</script>

<style scoped>
.category-manager {
  max-width: 100%;
}

/* Breadcrumb */
.breadcrumb {
  display: flex;
  align-items: center;
  gap: var(--space-px-4);
  margin-bottom: var(--space-px-16);
  font-size: var(--text-caption);
}

.bc-link {
  color: var(--color-gray-500);
  text-decoration: none;
}

.bc-link:hover { color: var(--color-primary); }

.bc-sep {
  font-size: 16px;
  color: var(--color-gray-500);
}

.bc-current {
  color: var(--color-ink);
  font-weight: var(--weight-semibold);
}

/* Page Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-px-24);
  flex-wrap: wrap;
  gap: var(--space-px-12);
}

.page-title {
  font-size: var(--text-sub-heading);
  font-weight: var(--weight-bold);
  color: var(--color-ink);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-px-12);
}

.header-search {
  position: relative;
}

.hs-icon {
  position: absolute;
  left: var(--space-px-12);
  top: 50%;
  transform: translateY(-50%);
  font-size: 18px;
  color: var(--color-on-surface-variant);
  pointer-events: none;
}

.hs-input {
  padding: 8px 12px 8px 40px;
  border: 1px solid var(--color-border-gray);
  border-radius: var(--radius-md);
  font-family: var(--font-body);
  font-size: var(--text-caption);
  color: var(--color-ink);
  outline: none;
  width: 200px;
}

.hs-input:focus {
  border-color: var(--color-primary);
}

/* ===== Stat Cards ===== */
.stat-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-px-24);
  margin-bottom: var(--space-px-24);
}

.stat-card {
  background: var(--color-surface-pearl);
  border: 1px solid var(--color-border-gray);
  border-radius: var(--radius-lg);
  padding: var(--space-px-24);
  display: flex;
  gap: var(--space-px-16);
  align-items: flex-start;
}

.stat-icon {
  font-size: 32px;
  flex-shrink: 0;
}

.stat-icon-primary { color: var(--color-primary); }
.stat-icon-orange { color: var(--color-accent-orange); }
.stat-icon-pink { color: var(--color-accent-pink); }

.stat-body { flex: 1; }

.stat-number {
  font-size: 32px;
  font-weight: var(--weight-bold);
  color: var(--color-ink);
  line-height: 1.1;
}

.stat-hot {
  font-size: var(--text-feature-title);
  color: var(--color-primary);
  word-break: break-all;
}

.stat-label {
  font-size: var(--text-caption);
  color: var(--color-on-surface-variant);
  margin-top: var(--space-px-4);
}

.stat-trend {
  display: flex;
  align-items: center;
  gap: var(--space-px-4);
  font-size: var(--text-fine);
  color: var(--color-accent-green);
  margin-top: var(--space-px-8);
}

.trend-icon {
  font-size: 16px;
}

.stat-sub {
  font-size: var(--text-fine);
  color: var(--color-on-surface-variant);
  margin-top: var(--space-px-4);
}

/* ===== Table ===== */
.table-container {
  background: var(--color-surface-pearl);
  border: 1px solid var(--color-border-gray);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.table-header {
  display: grid;
  grid-template-columns: 1.5fr 2.5fr 120px 140px;
  background: var(--color-surface-container-low);
  border-bottom: 1px solid var(--color-border-gray);
}

.th-cell {
  padding: var(--space-px-12) var(--space-px-16);
  font-size: var(--text-caption);
  font-weight: var(--weight-semibold);
  color: var(--color-on-surface-variant);
}

.th-count, .th-actions {
  text-align: center;
}

.table-row {
  display: grid;
  grid-template-columns: 1.5fr 2.5fr 120px 140px;
  border-bottom: 1px solid var(--color-border-gray);
  transition: background 0.15s;
}

.table-row:last-child {
  border-bottom: none;
}

.table-row:hover {
  background: var(--color-surface-container-lowest);
}

.td-cell {
  padding: var(--space-px-12) var(--space-px-16);
  display: flex;
  align-items: center;
  font-size: var(--text-body);
  color: var(--color-ink);
}

.td-desc {
  color: var(--color-on-surface-variant);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.td-count {
  justify-content: center;
}

.td-actions {
  justify-content: center;
  gap: var(--space-px-4);
}

/* Icon */
.cat-icon-box {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: var(--space-px-12);
  flex-shrink: 0;
}

.cat-icon-box .svg-icon {
  font-size: 20px;
}

.cat-name {
  font-weight: var(--weight-medium);
}

/* Action Buttons */
.action-btn {
  padding: var(--space-px-8);
  border-radius: var(--radius-md);
  border: none;
  background: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-on-surface-variant);
  transition: all 0.15s;
}

.action-btn .svg-icon {
  font-size: 20px;
}

.action-edit:hover {
  color: var(--color-primary);
  background: var(--color-primary-fixed);
}

.action-delete:hover {
  color: var(--color-error);
  background: var(--color-accent-red-bg);
}

.table-empty {
  text-align: center;
  padding: var(--space-xxl);
  color: var(--color-on-surface-variant);
}

/* ===== Side Panel ===== */
.panel-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 1000;
  display: flex;
  justify-content: flex-end;
}

.side-panel {
  width: 420px;
  background: var(--color-surface-pearl);
  height: 100%;
  display: flex;
  flex-direction: column;
  border-left: 1px solid var(--color-border-gray);
  box-shadow: var(--shadow-stack-high);
}

.panel-header {
  padding: var(--space-px-24);
  border-bottom: 1px solid var(--color-border-gray);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-title {
  font-size: var(--text-feature-title);
  font-weight: var(--weight-bold);
  color: var(--color-ink);
}

.panel-close {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-on-surface-variant);
}

.panel-close:hover {
  background: var(--color-surface-container-low);
}

.panel-body {
  flex: 1;
  padding: var(--space-px-24);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-px-20);
}

.panel-footer {
  padding: var(--space-px-24);
  border-top: 1px solid var(--color-border-gray);
  display: flex;
  gap: var(--space-px-12);
}

.panel-footer .btn {
  flex: 1;
}

/* Icon Grid */
.icon-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-px-8);
}

.icon-option {
  aspect-ratio: 1;
  border: 1px solid var(--color-border-gray);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  cursor: pointer;
  transition: all 0.15s;
}

.icon-option:hover {
  border-color: var(--color-primary);
  background: var(--color-surface-container-low);
}

.icon-active {
  border: 2px solid var(--color-primary);
  background: var(--color-primary-fixed);
  color: var(--color-primary);
}

.icon-option .svg-icon {
  font-size: 28px;
  color: var(--color-on-surface-variant);
}

.icon-active .svg-icon {
  color: var(--color-primary);
}

/* Form Elements */
.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-px-8);
}

.form-label {
  font-size: var(--text-body);
  font-weight: var(--weight-semibold);
  color: var(--color-ink);
}

.form-input,
.form-select {
  width: 100%;
  padding: var(--space-px-12);
  border: 1px solid var(--color-border-gray);
  border-radius: var(--radius-md);
  font-family: var(--font-body);
  font-size: var(--text-body);
  color: var(--color-ink);
  outline: none;
  background: var(--color-surface-pearl);
}

.form-input:focus,
.form-select:focus {
  box-shadow: 0 0 0 2px rgba(20, 110, 245, 0.2);
  border-color: var(--color-primary-light);
}

.form-textarea {
  width: 100%;
  padding: var(--space-px-12);
  border: 1px solid var(--color-border-gray);
  border-radius: var(--radius-md);
  font-family: var(--font-body);
  font-size: var(--text-body);
  color: var(--color-ink);
  outline: none;
  resize: vertical;
  line-height: var(--leading-relaxed);
}

.form-textarea:focus {
  box-shadow: 0 0 0 2px rgba(20, 110, 245, 0.2);
  border-color: var(--color-primary-light);
}

/* Buttons */
.btn {
  padding: var(--space-px-12) var(--space-px-20);
  border-radius: var(--radius-md);
  font-family: var(--font-body);
  font-size: var(--text-button);
  font-weight: var(--weight-medium);
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-px-4);
  border: none;
}

.btn-primary {
  background: var(--color-primary);
  color: var(--color-on-primary);
}

.btn-primary:hover {
  background: var(--color-button-hover-blue);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-cancel {
  background: var(--color-surface-container-high);
  color: var(--color-on-surface-variant);
  border: 1px solid var(--color-border-gray);
}

.btn-cancel:hover {
  background: var(--color-surface-container-highest);
}

.btn-danger {
  background: var(--color-accent-red);
  color: #fff;
}

.btn-danger:hover {
  background: var(--color-on-error-container);
}

.btn-icon {
  font-size: 18px;
}

/* ===== Modal ===== */
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

/* Transitions */
.panel-enter-active,
.panel-leave-active {
  transition: opacity 0.2s;
}
.panel-enter-active .side-panel,
.panel-leave-active .side-panel {
  transition: transform 0.2s;
}
.panel-enter-from,
.panel-leave-to {
  opacity: 0;
}
.panel-enter-from .side-panel,
.panel-leave-to .side-panel {
  transform: translateX(100%);
}

.modal-enter-active { transition: opacity 0.15s; }
.modal-leave-active { transition: opacity 0.1s; }
.modal-enter-from,
.modal-leave-to { opacity: 0; }

/* Responsive */
@media (max-width: 768px) {
  .stat-grid {
    grid-template-columns: 1fr;
  }
  .table-header,
  .table-row {
    grid-template-columns: 1fr 1fr 80px 80px;
  }
}
</style>
