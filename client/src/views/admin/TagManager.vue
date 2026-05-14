<template>
  <div class="tag-manager">
    <h2 class="page-title">标签管理</h2>
    <p class="page-desc">管理系统内所有的元数据标签，以优化内容搜索和分类。</p>

    <!-- Quick Add Bar -->
    <div class="quick-add">
      <input
        v-model="newTagName"
        class="quick-add-input"
        placeholder="输入新标签名称..."
        @keyup.enter="openCreateDrawer"
      />
      <button class="quick-add-btn" @click="openCreateDrawer">新增标签</button>
    </div>

    <!-- Tags Grid -->
    <div class="tags-grid" v-loading="loading">
      <div
        v-for="tag in tags"
        :key="tag.id"
        class="tag-card group"
        @click="openEditDrawer(tag)"
      >
        <div class="tag-card-left">
          <span class="tag-dot" :style="{ background: tag.color || '#3b89ff' }"></span>
          <span class="tag-name">{{ tag.name }}</span>
        </div>
        <button
          class="tag-delete"
          @click.stop="confirmDelete(tag)"
          title="删除标签"
        >
          <Icon name="delete" />
        </button>
      </div>

      <div v-if="!loading && tags.length === 0" class="tag-empty">暂无标签，请创建第一个标签</div>
    </div>

    <!-- Stat Cards -->
    <div class="stat-grid">
      <div class="stat-card">
        <Icon name="sell" class="stat-icon stat-icon-blue" />
        <div class="stat-number">{{ tags.length }}</div>
        <div class="stat-label">总标签数量</div>
      </div>
      <div class="stat-card">
        <Icon name="trending_up" class="stat-icon stat-icon-green" />
        <div class="stat-number">{{ recentTags }}</div>
        <div class="stat-label">本月新增标签</div>
      </div>
      <div class="stat-card">
        <Icon name="auto_awesome" class="stat-icon stat-icon-orange" />
        <div class="stat-number">智能推荐</div>
        <div class="stat-label">基于内容自动分析生成的推荐标签</div>
      </div>
    </div>

    <!-- Create/Edit Tag Drawer -->
    <transition name="drawer">
      <div v-if="drawer.visible" class="drawer-overlay" @click.self="closeDrawer">
        <div class="drawer-panel">
          <div class="drawer-header">
            <div>
              <h3 class="drawer-title">{{ drawer.isEdit ? '编辑标签' : '新增标签' }}</h3>
              <p class="drawer-desc">{{ drawer.isEdit ? '修改标签属性' : '创建一个新的全局分类标签' }}</p>
            </div>
            <button class="drawer-close" @click="closeDrawer">
              <Icon name="close" />
            </button>
          </div>

          <div class="drawer-body">
            <div class="form-group">
              <label class="form-label">标签名称</label>
              <input
                v-model="drawer.form.name"
                class="form-input"
                placeholder="输入标签名称，例如：产品特性"
              />
            </div>

            <div class="form-group">
              <label class="form-label">标签颜色</label>
              <div class="color-grid">
                <button
                  v-for="c in presetColors"
                  :key="c"
                  :class="['color-dot', { 'color-active': drawer.form.color === c }]"
                  :style="{ background: c }"
                  @click="drawer.form.color = c"
                ></button>
              </div>
              <div class="color-divider">
                <span class="color-divider-text">或者自定义</span>
              </div>
              <div class="color-custom">
                <div class="color-preview" :style="{ background: drawer.form.color }"></div>
                <input
                  v-model="drawer.form.color"
                  class="color-input"
                  placeholder="#146EF5"
                />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">标签描述</label>
              <textarea
                v-model="drawer.form.description"
                class="form-textarea"
                rows="4"
                placeholder="描述此标签的使用场景，帮助团队更好地进行内容分类..."
              ></textarea>
            </div>

            <!-- Preview -->
            <div class="preview-box">
              <label class="form-label">预览效果</label>
              <div class="preview-content">
                <span class="preview-tag" :style="{ background: drawer.form.color, color: '#fff' }">
                  {{ drawer.form.name || '示例标签' }}
                </span>
                <span class="preview-note">这是标签在文档列表中的呈现方式</span>
              </div>
            </div>
          </div>

          <div class="drawer-footer">
            <button class="btn btn-cancel" @click="closeDrawer">取消</button>
            <button class="btn btn-save" @click="saveTag" :disabled="saving">
              {{ saving ? '保存中...' : (drawer.isEdit ? '更新标签' : '保存标签') }}
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Delete Confirm Modal -->
    <transition name="modal">
      <div v-if="deleteModal.visible" class="modal-overlay" @click.self="deleteModal.visible = false">
        <div class="modal-box">
          <div class="modal-icon-box">
            <Icon name="warning" class="modal-icon" />
          </div>
          <h3 class="modal-title">确定要删除「{{ deleteModal.tag?.name }}」标签吗？</h3>
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
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { getTags, createTag, deleteTag } from '../../api/admin.js'

const tags = ref([])
const loading = ref(false)
const saving = ref(false)
const newTagName = ref('')

const presetColors = ['#146ef5', '#00d722', '#ed52cb', '#ffae13', '#ee1d36', '#600de6']

const drawer = ref({
  visible: false,
  isEdit: false,
  form: { name: '', color: '#146ef5', description: '' }
})

const deleteModal = ref({
  visible: false,
  tag: null
})

const recentTags = computed(() => {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  return tags.value.filter(t => {
    if (!t.created_at) return false
    return new Date(t.created_at) >= monthStart
  }).length
})

async function load() {
  loading.value = true
  try {
    const res = await getTags()
    tags.value = res.data || []
  } catch {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

function openCreateDrawer() {
  drawer.value = {
    visible: true,
    isEdit: false,
    form: { name: newTagName.value || '', color: '#146ef5', description: '' }
  }
}

function openEditDrawer(tag) {
  drawer.value = {
    visible: true,
    isEdit: true,
    form: { name: tag.name, color: tag.color || '#146ef5', description: tag.description || '' },
    id: tag.id
  }
}

function closeDrawer() {
  drawer.value.visible = false
}

async function saveTag() {
  if (!drawer.value.form.name.trim()) {
    ElMessage.warning('请输入标签名称')
    return
  }
  saving.value = true
  try {
    await createTag(drawer.value.form)
    ElMessage.success(drawer.value.isEdit ? '标签已更新' : '标签已创建')
    closeDrawer()
    newTagName.value = ''
    load()
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '保存失败')
  } finally {
    saving.value = false
  }
}

function confirmDelete(tag) {
  deleteModal.value = { visible: true, tag }
}

async function doDelete() {
  if (!deleteModal.value.tag) return
  try {
    await deleteTag(deleteModal.value.tag.id)
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
.tag-manager {
  max-width: 100%;
}

.page-title {
  font-size: var(--text-sub-heading);
  font-weight: var(--weight-bold);
  color: var(--color-ink);
  margin-bottom: var(--space-px-4);
}

.page-desc {
  font-size: var(--text-caption);
  color: var(--color-on-surface-variant);
  margin-bottom: var(--space-px-24);
}

/* ===== Quick Add ===== */
.quick-add {
  display: flex;
  gap: var(--space-px-12);
  background: var(--color-surface);
  border: 1px solid var(--color-border-gray);
  border-radius: var(--radius-lg);
  padding: var(--space-px-8);
  margin-bottom: var(--space-px-24);
  align-items: center;
}

.quick-add-input {
  flex: 1;
  border: none;
  background: transparent;
  padding: var(--space-px-8) var(--space-px-12);
  font-family: var(--font-body);
  font-size: var(--text-body);
  color: var(--color-ink);
  outline: none;
}

.quick-add-input::placeholder {
  color: var(--color-gray-300);
}

.quick-add-btn {
  background: var(--color-primary);
  color: var(--color-on-primary);
  border: none;
  padding: var(--space-px-12) var(--space-px-20);
  border-radius: var(--radius-md);
  font-family: var(--font-body);
  font-size: var(--text-button);
  font-weight: var(--weight-medium);
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.2s;
}

.quick-add-btn:hover {
  background: var(--color-button-hover-blue);
}

/* ===== Tags Grid ===== */
.tags-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-px-16);
  margin-bottom: var(--space-px-24);
}

@media (min-width: 768px) {
  .tags-grid { grid-template-columns: repeat(4, 1fr); }
}

@media (min-width: 1024px) {
  .tags-grid { grid-template-columns: repeat(6, 1fr); }
}

.tag-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--color-surface-pearl);
  border: 1px solid var(--color-border-gray);
  border-radius: var(--radius-md);
  padding: var(--space-px-16);
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.tag-card:hover {
  border-color: var(--color-border-hover);
  box-shadow: var(--shadow-stack-1);
}

.tag-card-left {
  display: flex;
  align-items: center;
  gap: var(--space-px-8);
  min-width: 0;
}

.tag-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.tag-name {
  font-size: var(--text-body);
  color: var(--color-ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tag-delete {
  opacity: 0;
  background: none;
  border: none;
  cursor: pointer;
  padding: var(--space-px-4);
  border-radius: var(--radius-sm);
  transition: opacity 0.2s, transform 0.2s;
  color: var(--color-error);
}

.tag-card:hover .tag-delete {
  opacity: 1;
}

.tag-delete:hover {
  transform: scale(1.1);
}

.tag-delete .svg-icon {
  font-size: 20px;
}

.tag-empty {
  grid-column: 1 / -1;
  text-align: center;
  padding: var(--space-xxl);
  color: var(--color-on-surface-variant);
}

/* ===== Stat Cards ===== */
.stat-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--gutter);
}

@media (min-width: 768px) {
  .stat-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.stat-card {
  background: var(--color-surface-pearl);
  border: 1px solid var(--color-border-gray);
  border-radius: var(--radius-lg);
  padding: var(--space-px-24);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  box-shadow: var(--shadow-sm);
}

.stat-icon {
  font-size: 32px;
  margin-bottom: var(--space-px-12);
}

.stat-icon-blue { color: var(--color-primary); }
.stat-icon-green { color: var(--color-accent-green); }
.stat-icon-orange { color: var(--color-accent-orange); }

.stat-number {
  font-size: var(--text-sub-heading);
  font-weight: var(--weight-bold);
  color: var(--color-ink);
  margin-bottom: var(--space-px-4);
}

.stat-label {
  font-size: var(--text-caption);
  color: var(--color-on-surface-variant);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* ===== Drawer ===== */
.drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(2px);
  z-index: 1000;
  display: flex;
  justify-content: flex-end;
}

.drawer-panel {
  width: 100%;
  max-width: 400px;
  background: var(--color-surface);
  height: 100%;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-stack-high);
}

.drawer-header {
  padding: var(--space-px-24);
  border-bottom: 1px solid var(--color-border-gray);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.drawer-title {
  font-size: var(--text-feature-title);
  font-weight: var(--weight-bold);
  color: var(--color-ink);
}

.drawer-desc {
  font-size: var(--text-caption);
  color: var(--color-on-surface-variant);
  margin-top: var(--space-px-4);
}

.drawer-close {
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
  transition: background 0.15s;
}

.drawer-close:hover {
  background: var(--color-surface-container-low);
}

.drawer-body {
  flex: 1;
  padding: var(--space-px-24);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-px-20);
}

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

.form-input {
  width: 100%;
  padding: var(--space-px-12);
  border: 1px solid var(--color-border-gray);
  border-radius: var(--radius-md);
  font-family: var(--font-body);
  font-size: var(--text-body);
  color: var(--color-ink);
  outline: none;
  transition: box-shadow 0.15s;
}

.form-input:focus {
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

/* Color Picker */
.color-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: var(--space-px-8);
}

.color-dot {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: transform 0.15s;
}

.color-dot:hover {
  transform: scale(1.05);
}

.color-active {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4px rgba(0, 86, 200, 0.1);
}

.color-divider {
  display: flex;
  align-items: center;
  gap: var(--space-px-12);
  margin: var(--space-px-12) 0;
}

.color-divider::before,
.color-divider::after {
  content: '';
  flex: 1;
  border-top: 1px solid var(--color-border-gray);
}

.color-divider-text {
  font-size: var(--text-caption);
  color: var(--color-on-surface-variant);
  white-space: nowrap;
}

.color-custom {
  display: flex;
  align-items: center;
  gap: var(--space-px-12);
}

.color-preview {
  width: 40px;
  height: 32px;
  border-radius: var(--radius-sm);
  flex-shrink: 0;
}

.color-input {
  flex: 1;
  padding: var(--space-px-8) var(--space-px-12);
  border: 1px solid var(--color-border-gray);
  border-radius: var(--radius-md);
  font-family: var(--font-mono);
  font-size: var(--text-body);
  text-transform: uppercase;
  color: var(--color-ink);
  outline: none;
}

.color-input:focus {
  box-shadow: 0 0 0 1px var(--color-primary);
}

/* Preview */
.preview-box {
  padding: var(--space-px-20);
  background: var(--color-surface-container-low);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border-gray);
}

.preview-content {
  display: flex;
  align-items: center;
  gap: var(--space-px-12);
  margin-top: var(--space-px-8);
}

.preview-tag {
  padding: var(--space-px-4) var(--space-px-12);
  border-radius: var(--radius-pill);
  font-size: var(--text-caption);
  font-weight: var(--weight-medium);
}

.preview-note {
  font-size: var(--text-caption);
  color: var(--color-on-surface-variant);
}

/* Drawer Footer */
.drawer-footer {
  border-top: 1px solid var(--color-border-gray);
  padding: var(--space-px-24);
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-px-12);
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
  position: relative;
  width: 100%;
  max-width: 400px;
  background: var(--color-surface);
  border: 1px solid var(--color-border-gray);
  border-radius: var(--radius-md);
  padding: var(--space-px-24);
  text-align: center;
  box-shadow: var(--shadow-stack-high);
  animation: modalIn 0.2s ease;
}

@keyframes modalIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
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
  width: 100%;
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

/* ===== Buttons ===== */
.btn {
  padding: var(--space-px-12) var(--space-px-24);
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

.btn-cancel {
  background: var(--color-surface-container-high);
  color: var(--color-on-surface-variant);
  border: 1px solid var(--color-border-gray);
}

.btn-cancel:hover {
  background: var(--color-surface-container-highest);
}

.btn-save {
  background: var(--color-primary);
  color: var(--color-on-primary);
}

.btn-save:hover {
  background: var(--color-button-hover-blue);
}

.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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

/* Transitions */
.drawer-enter-active,
.drawer-leave-active {
  transition: opacity 0.3s;
}
.drawer-enter-active .drawer-panel,
.drawer-leave-active .drawer-panel {
  transition: transform 0.3s;
}
.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
}
.drawer-enter-from .drawer-panel,
.drawer-leave-to .drawer-panel {
  transform: translateX(100%);
}

.modal-enter-active { transition: opacity 0.2s; }
.modal-leave-active { transition: opacity 0.15s; }
.modal-enter-from,
.modal-leave-to { opacity: 0; }
</style>
