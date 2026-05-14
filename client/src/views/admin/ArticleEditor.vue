<template>
  <div class="editor-page">
    <!-- Top Toolbar -->
    <div class="editor-topbar">
      <div class="topbar-left">
        <nav class="topbar-breadcrumb">
          <router-link to="/admin/articles">文章</router-link>
          <Icon name="chevron_right" class="bc-sep" />
          <span>{{ isEdit ? '编辑文章' : '新建文章' }}</span>
        </nav>
      </div>
      <div class="topbar-right">
        <button class="tb-btn tb-draft" @click="save(0)" :disabled="saving">保存草稿</button>
        <button class="tb-btn tb-publish" @click="save(1)" :disabled="saving">
          <Icon name="public" class="tb-pub-icon" />
          发布文章
        </button>
      </div>
    </div>

    <div class="editor-layout">
      <!-- Main Content -->
      <div class="editor-main">
        <!-- Title Input -->
        <textarea
          v-model="form.title"
          class="title-input"
          placeholder="请输入文章标题..."
          rows="1"
          @input="autoResize"
        ></textarea>

        <!-- Formatting Toolbar -->
        <div class="format-bar">
          <div class="fmt-group">
            <button class="fmt-btn" @click="chain().toggleBold().run()" :class="{ 'fmt-active': editor?.isActive('bold') }" title="加粗">
              <Icon name="format_bold" />
            </button>
            <button class="fmt-btn" @click="chain().toggleItalic().run()" :class="{ 'fmt-active': editor?.isActive('italic') }" title="斜体">
              <Icon name="format_italic" />
            </button>
            <button class="fmt-btn" @click="chain().toggleStrike().run()" :class="{ 'fmt-active': editor?.isActive('strike') }" title="删除线">
              <Icon name="format_strikethrough" />
            </button>
          </div>
          <span class="fmt-divider"></span>
          <div class="fmt-group">
            <button class="fmt-btn" @click="chain().toggleHeading({ level: 1 }).run()" :class="{ 'fmt-active': editor?.isActive('heading', { level: 1 }) }" title="标题1">
              <Icon name="format_h1" />
            </button>
            <button class="fmt-btn" @click="chain().toggleHeading({ level: 2 }).run()" :class="{ 'fmt-active': editor?.isActive('heading', { level: 2 }) }" title="标题2">
              <Icon name="format_h2" />
            </button>
            <button class="fmt-btn" @click="chain().toggleBlockquote().run()" :class="{ 'fmt-active': editor?.isActive('blockquote') }" title="引用">
              <Icon name="format_quote" />
            </button>
          </div>
          <span class="fmt-divider"></span>
          <div class="fmt-group">
            <button class="fmt-btn" @click="chain().toggleBulletList().run()" :class="{ 'fmt-active': editor?.isActive('bulletList') }" title="无序列表">
              <Icon name="format_list_bulleted" />
            </button>
            <button class="fmt-btn" @click="chain().toggleOrderedList().run()" :class="{ 'fmt-active': editor?.isActive('orderedList') }" title="有序列表">
              <Icon name="format_list_numbered" />
            </button>
          </div>
          <span class="fmt-divider"></span>
          <div class="fmt-group">
            <button class="fmt-btn" @click="addLink" title="链接">
              <Icon name="link" />
            </button>
            <button class="fmt-btn" @click="insertImage" title="图片">
              <Icon name="image" />
            </button>
            <button class="fmt-btn" @click="chain().toggleCodeBlock().run()" :class="{ 'fmt-active': editor?.isActive('codeBlock') }" title="代码">
              <Icon name="code" />
            </button>
          </div>
        </div>

        <!-- Editor Content -->
        <div class="editor-area" v-loading="loading">
          <div class="editor-wrapper">
            <editor-content :editor="editor" class="editor-content" />
            <div v-if="!editor?.getText()?.trim() && !loading" class="editor-placeholder">从这里开始编写您的内容...</div>
          </div>
        </div>
      </div>

      <!-- Right Metadata Panel -->
      <aside class="meta-panel">
        <div class="meta-section">
          <h3 class="meta-section-title">发布设置</h3>
          <div class="meta-row">
            <span class="meta-label">状态</span>
            <span class="meta-value">
              <span class="status-badge status-draft">
                <span class="status-dot dot-orange"></span>
                {{ form.status === 1 ? '已发布' : '草稿' }}
              </span>
            </span>
          </div>
          <div class="meta-row">
            <span class="meta-label">公开性</span>
            <span class="meta-value">所有人可见</span>
          </div>
        </div>

        <div class="meta-section">
          <h3 class="meta-section-title">分类</h3>
          <select v-model="form.category_id" class="meta-select">
            <option :value="null">选择分类...</option>
            <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.title }}</option>
          </select>
        </div>

        <div class="meta-section">
          <h3 class="meta-section-title">标签</h3>
          <div class="tag-input-area">
            <div class="tag-list" v-if="form.tags.length > 0">
              <span v-for="(tag, i) in form.tags" :key="i" class="meta-tag">
                {{ tag }}
                <span class="meta-tag-close" @click="form.tags.splice(i, 1)">
                  <Icon name="close" />
                </span>
              </span>
            </div>
            <div class="tag-add-row">
              <input
                v-model="tagInput"
                class="tag-input"
                placeholder="添加标签..."
                @keyup.enter="addTag"
              />
            </div>
          </div>
        </div>

        <div class="meta-section">
          <h3 class="meta-section-title">封面图片</h3>
          <div class="cover-upload" @click="triggerCoverUpload">
            <div v-if="!form.cover_image" class="cover-placeholder">
              <Icon name="add_photo_alternate" class="cover-icon" />
              <span class="cover-text">点击上传图片</span>
            </div>
            <img v-else :src="form.cover_image" class="cover-preview" />
          </div>
          <input type="file" ref="coverInput" accept="image/*" style="display:none" @change="onCoverUpload" />
        </div>

        <div class="meta-section">
          <h3 class="meta-section-title">SEO 摘要</h3>
          <textarea
            v-model="form.summary"
            class="seo-input"
            rows="3"
            placeholder="输入搜索结果中显示的简短描述..."
          ></textarea>
        </div>
      </aside>
    </div>

    <!-- File input for images in editor -->
    <input type="file" ref="fileInput" accept="image/*" style="display:none" @change="onFileSelected" />

    <!-- Mobile Bottom Nav -->
    <div class="mobile-nav">
      <button class="mn-btn mn-active">
        <Icon name="edit_note" />
        <span class="mn-label">编辑</span>
      </button>
      <button class="mn-btn">
        <Icon name="settings_suggest" />
        <span class="mn-label">设置</span>
      </button>
      <button class="mn-btn">
        <Icon name="visibility" />
        <span class="mn-label">预览</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import ImageExt from '@tiptap/extension-image'
import LinkExt from '@tiptap/extension-link'
import { getAdminCategories, getAdminArticleById, createArticle, updateArticle, uploadImage } from '../../api/admin.js'

const route = useRoute()
const router = useRouter()
const isEdit = computed(() => !!route.params.id)
const categories = ref([])
const saving = ref(false)
const loading = ref(false)
const tagInput = ref('')

const form = ref({
  title: '',
  category_id: null,
  content_html: '',
  tags: [],
  cover_image: '',
  summary: '',
  status: 0
})

const fileInput = ref(null)
const coverInput = ref(null)

const editor = useEditor({
  content: '',
  extensions: [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] }
    }),
    ImageExt,
    LinkExt.configure({ openOnClick: false })
  ],
  onUpdate: ({ editor }) => {
    form.value.content_html = editor.getHTML()
  }
})

function chain() {
  return editor.value?.chain().focus()
}

function autoResize(e) {
  const el = e.target
  el.style.height = 'auto'
  el.style.height = el.scrollHeight + 'px'
}

function addTag() {
  const tag = tagInput.value.trim()
  if (tag && !form.value.tags.includes(tag)) {
    form.value.tags.push(tag)
  }
  tagInput.value = ''
}

async function save(status) {
  if (!form.value.title.trim()) {
    ElMessage.warning('请输入文章标题')
    return
  }
  saving.value = true
  const data = {
    title: form.value.title,
    category_id: form.value.category_id,
    content_html: form.value.content_html,
    cover_image: form.value.cover_image,
    tags: form.value.tags,
    status
  }
  try {
    if (isEdit.value) {
      await updateArticle(route.params.id, data)
    } else {
      await createArticle(data)
    }
    ElMessage.success(status === 1 ? '已发布' : '草稿已保存')
    router.push('/admin/articles')
  } catch {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

function addLink() {
  const url = window.prompt('输入链接 URL:')
  if (url) {
    chain()?.setLink({ href: url }).run()
  }
}

function insertImage() {
  fileInput.value?.click()
}

async function onFileSelected(e) {
  const file = e.target.files?.[0]
  if (!file) return
  const formData = new FormData()
  formData.append('file', file)
  try {
    const res = await uploadImage(formData)
    chain()?.setImage({ src: res.data.url }).run()
  } catch { ElMessage.error('上传失败') }
  fileInput.value.value = ''
}

function triggerCoverUpload() {
  coverInput.value?.click()
}

async function onCoverUpload(e) {
  const file = e.target.files?.[0]
  if (!file) return
  const formData = new FormData()
  formData.append('file', file)
  try {
    const res = await uploadImage(formData)
    form.value.cover_image = res.data.url
  } catch { ElMessage.error('上传失败') }
  coverInput.value.value = ''
}

onMounted(async () => {
  try {
    categories.value = (await getAdminCategories()).data || []
  } catch {}

  if (isEdit.value) {
    loading.value = true
    try {
      const res = await getAdminArticleById(route.params.id)
      const a = res.data
      form.value = {
        title: a.title || '',
        category_id: a.category_id,
        content_html: a.content_html || '',
        tags: a.tags || [],
        cover_image: a.cover_image || '',
        summary: a.summary || '',
        status: a.status || 0
      }
      if (editor.value && a.content_html) {
        editor.value.commands.setContent(a.content_html)
      }
    } catch {
      ElMessage.error('加载文章失败')
    } finally {
      loading.value = false
    }
  }
})
</script>

<style scoped>
.editor-page {
  min-height: calc(100vh - 56px - 48px); /* minus header and padding */
  display: flex;
  flex-direction: column;
}

/* ===== Top Toolbar ===== */
.editor-topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-px-12) 0;
  margin-bottom: var(--space-px-16);
  flex-wrap: wrap;
  gap: var(--space-px-12);
}

.topbar-breadcrumb {
  display: flex;
  align-items: center;
  gap: var(--space-px-4);
  font-size: var(--text-caption);
  color: var(--color-on-surface-variant);
}

.topbar-breadcrumb a {
  color: var(--color-gray-500);
  text-decoration: none;
}

.topbar-breadcrumb a:hover {
  color: var(--color-primary);
}

.bc-sep {
  font-size: 16px;
  color: var(--color-gray-500);
}

.topbar-right {
  display: flex;
  gap: var(--space-px-8);
}

.tb-btn {
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
}

.tb-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tb-draft {
  background: transparent;
  color: var(--color-on-surface-variant);
  border: 1px solid var(--color-border-gray);
}

.tb-draft:hover:not(:disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.tb-publish {
  background: var(--color-primary);
  color: var(--color-on-primary);
}

.tb-publish:hover:not(:disabled) {
  background: var(--color-button-hover-blue);
}

.tb-pub-icon {
  font-size: 18px;
}

/* ===== Editor Layout ===== */
.editor-layout {
  display: flex;
  gap: var(--gutter);
  flex: 1;
  align-items: flex-start;
}

.editor-main {
  flex: 1;
  min-width: 0;
}

.meta-panel {
  width: 280px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-px-20);
  position: sticky;
  top: 80px;
}

@media (max-width: 1023px) {
  .meta-panel {
    display: none;
  }
}

/* ===== Title Input ===== */
.title-input {
  width: 100%;
  font-family: var(--font-display);
  font-size: var(--text-hero-mobile);
  font-weight: var(--weight-semibold);
  line-height: var(--leading-tight);
  color: var(--color-ink);
  border: none;
  outline: none;
  resize: none;
  background: transparent;
  margin-bottom: var(--space-px-16);
  min-height: 60px;
}

.title-input::placeholder {
  color: var(--color-gray-300);
}

@media (min-width: 768px) {
  .title-input {
    font-size: var(--text-hero);
  }
}

/* ===== Format Bar ===== */
.format-bar {
  display: flex;
  align-items: center;
  gap: var(--space-px-4);
  background: var(--color-surface);
  border: 1px solid var(--color-border-gray);
  border-radius: var(--radius-md);
  padding: var(--space-px-4);
  margin-bottom: var(--space-px-16);
  flex-wrap: wrap;
  position: sticky;
  top: 0;
  z-index: 10;
}

.fmt-group {
  display: flex;
  align-items: center;
  gap: var(--space-px-2);
}

.fmt-divider {
  width: 1px;
  height: 24px;
  background: var(--color-border-gray);
  margin: 0 var(--space-px-4);
}

.fmt-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  color: var(--color-on-surface-variant);
  transition: all 0.15s;
}

.fmt-btn:hover {
  background: var(--color-surface-container-low);
  border-color: var(--color-border-hover);
}

.fmt-btn .svg-icon {
  font-size: 18px;
}

.fmt-active {
  background: var(--color-surface-container-low);
  color: var(--color-primary);
}

/* ===== Editor Area ===== */
.editor-area {
  background: var(--color-surface-pearl);
  border: 1px solid var(--color-border-gray);
  border-radius: var(--radius-md);
  min-height: 500px;
}

.editor-wrapper {
  position: relative;
}

.editor-content {
  padding: var(--space-px-24);
  min-height: 500px;
}

.editor-content :deep(.ProseMirror) {
  outline: none;
  min-height: 500px;
  font-size: var(--text-body-large);
  font-weight: var(--weight-medium);
  line-height: var(--leading-relaxed);
  color: var(--color-ink);
}

.editor-content :deep(.ProseMirror p) {
  margin-bottom: var(--space-px-16);
}

.editor-content :deep(.ProseMirror h1) {
  font-size: var(--text-sub-heading);
  font-weight: var(--weight-bold);
  margin: var(--space-px-24) 0 var(--space-px-12);
}

.editor-content :deep(.ProseMirror h2) {
  font-size: var(--text-feature-title);
  font-weight: var(--weight-bold);
  margin: var(--space-px-20) 0 var(--space-px-8);
}

.editor-content :deep(.ProseMirror h3) {
  font-size: var(--text-body-large);
  font-weight: var(--weight-bold);
  margin: var(--space-px-16) 0 var(--space-px-8);
}

.editor-content :deep(.ProseMirror img) {
  max-width: 100%;
  border-radius: var(--radius-md);
  margin: var(--space-px-16) 0;
}

.editor-content :deep(.ProseMirror blockquote) {
  border-left: 3px solid var(--color-primary);
  padding-left: var(--space-px-16);
  margin: var(--space-px-16) 0;
  color: var(--color-on-surface-variant);
  font-style: italic;
}

.editor-content :deep(.ProseMirror pre) {
  background: var(--color-surface-container-low);
  padding: var(--space-px-16);
  border-radius: var(--radius-md);
  font-family: var(--font-mono);
  font-size: var(--text-caption);
}

.editor-content :deep(.ProseMirror ul),
.editor-content :deep(.ProseMirror ol) {
  padding-left: var(--space-px-24);
  margin-bottom: var(--space-px-16);
}

.editor-content :deep(.ProseMirror li) {
  margin-bottom: var(--space-px-4);
}

.editor-content :deep(.ProseMirror a) {
  color: var(--color-primary);
  text-decoration: underline;
}

.editor-placeholder {
  position: absolute;
  top: var(--space-px-24);
  left: var(--space-px-24);
  font-size: var(--text-body-large);
  color: var(--color-gray-300);
  pointer-events: none;
  font-weight: var(--weight-medium);
}

/* ===== Metadata Panel ===== */
.meta-section {
  background: var(--color-surface-pearl);
  border: 1px solid var(--color-border-gray);
  border-radius: var(--radius-md);
  padding: var(--space-px-16);
}

.meta-section-title {
  font-size: var(--text-caption);
  font-weight: var(--weight-semibold);
  color: var(--color-on-surface-variant);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: var(--space-px-12);
  padding-bottom: var(--space-px-8);
  border-bottom: 1px solid var(--color-hairline);
}

.meta-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-px-4) 0;
  font-size: var(--text-caption);
}

.meta-label {
  color: var(--color-on-surface-variant);
}

.meta-value {
  color: var(--color-ink);
  font-weight: var(--weight-medium);
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-px-4);
  padding: var(--space-px-2) var(--space-px-8);
  border-radius: var(--radius-pill);
  font-size: var(--text-fine);
  font-weight: var(--weight-medium);
}

.status-draft {
  color: var(--color-primary);
  background: rgba(0, 86, 200, 0.08);
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.dot-orange { background: var(--color-accent-orange); }

/* Meta Select */
.meta-select {
  width: 100%;
  padding: var(--space-px-8) var(--space-px-12);
  border: 1px solid var(--color-border-gray);
  border-radius: var(--radius-sm);
  font-family: var(--font-body);
  font-size: var(--text-caption);
  color: var(--color-ink);
  background: var(--color-surface-pearl);
  outline: none;
  cursor: pointer;
}

.meta-select:focus {
  border-color: var(--color-primary);
}

/* Tags */
.tag-input-area {
  display: flex;
  flex-direction: column;
  gap: var(--space-px-8);
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-px-4);
}

.meta-tag {
  display: inline-flex;
  align-items: center;
  gap: var(--space-px-4);
  padding: var(--space-px-4) var(--space-px-8);
  background: var(--color-surface-container-low);
  border: 1px solid var(--color-border-gray);
  border-radius: var(--radius-sm);
  font-size: var(--text-fine);
  color: var(--color-ink);
}

.meta-tag-close {
  display: flex;
  cursor: pointer;
  color: var(--color-on-surface-variant);
}

.meta-tag-close .svg-icon {
  font-size: 14px;
}

.tag-add-row {
  display: flex;
}

.tag-input {
  flex: 1;
  padding: var(--space-px-6) var(--space-px-8);
  border: 1px solid var(--color-border-gray);
  border-radius: var(--radius-sm);
  font-family: var(--font-body);
  font-size: var(--text-caption);
  color: var(--color-ink);
  outline: none;
}

.tag-input:focus {
  border-color: var(--color-primary);
}

.tag-input::placeholder {
  color: var(--color-gray-300);
}

/* Cover Upload */
.cover-upload {
  cursor: pointer;
}

.cover-placeholder {
  aspect-ratio: 16 / 9;
  background: var(--color-surface-container-low);
  border: 2px dashed var(--color-border-gray);
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-px-8);
  transition: border-color 0.2s;
}

.cover-upload:hover .cover-placeholder {
  border-color: var(--color-primary);
}

.cover-icon {
  font-size: 28px;
  color: var(--color-on-surface-variant);
}

.cover-text {
  font-size: var(--text-caption);
  color: var(--color-on-surface-variant);
}

.cover-preview {
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  border-radius: var(--radius-md);
}

/* SEO Input */
.seo-input {
  width: 100%;
  padding: var(--space-px-8) var(--space-px-12);
  border: 1px solid var(--color-border-gray);
  border-radius: var(--radius-sm);
  font-family: var(--font-body);
  font-size: var(--text-caption);
  color: var(--color-ink);
  outline: none;
  resize: vertical;
  line-height: var(--leading-relaxed);
  background: transparent;
}

.seo-input:focus {
  border-color: var(--color-primary);
}

.seo-input::placeholder {
  color: var(--color-gray-300);
}

/* ===== Mobile Bottom Nav ===== */
.mobile-nav {
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 64px;
  background: var(--color-surface);
  border-top: 1px solid var(--color-border-gray);
  z-index: 100;
  justify-content: space-around;
  align-items: center;
}

@media (max-width: 1023px) {
  .mobile-nav {
    display: flex;
  }

  .editor-page {
    padding-bottom: 80px;
  }
}

.mn-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-px-2);
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-on-surface-variant);
  font-family: var(--font-body);
  padding: var(--space-px-8);
}

.mn-btn .svg-icon {
  font-size: 22px;
}

.mn-label {
  font-size: 10px;
}

.mn-active {
  color: var(--color-primary);
}

.mn-active .mn-label {
  font-weight: var(--weight-semibold);
}
</style>
