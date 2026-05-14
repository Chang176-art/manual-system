<template>
  <div class="rich-editor">
    <div class="editor-toolbar">
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
        <button class="fmt-btn" @click="chain().toggleHeading({ level: 2 }).run()" :class="{ 'fmt-active': editor?.isActive('heading', { level: 2 }) }" title="标题2">
          <Icon name="format_h2" />
        </button>
        <button class="fmt-btn" @click="chain().toggleHeading({ level: 3 }).run()" :class="{ 'fmt-active': editor?.isActive('heading', { level: 3 }) }" title="标题3">
          <Icon name="format_h3" />
        </button>
        <button class="fmt-btn" @click="chain().toggleBlockquote().run()" :class="{ 'fmt-active': editor?.isActive('blockquote') }" title="引用">
          <Icon name="format_quote" />
        </button>
      </div>
      <span class="fmt-divider"></span>
      <div class="fmt-group">
        <button class="fmt-btn" @click="chain().toggleBulletList().run()" :class="{ 'fmt-active': editor?.isActive('bulletList') }" title="列表">
          <Icon name="format_list_bulleted" />
        </button>
        <button class="fmt-btn" @click="chain().toggleOrderedList().run()" :class="{ 'fmt-active': editor?.isActive('orderedList') }" title="编号">
          <Icon name="format_list_numbered" />
        </button>
      </div>
      <span class="fmt-divider"></span>
      <div class="fmt-group">
        <button class="fmt-btn" @click="chain().toggleCodeBlock().run()" :class="{ 'fmt-active': editor?.isActive('codeBlock') }" title="代码">
          <Icon name="code" />
        </button>
        <button class="fmt-btn" @click="insertTable" title="表格">
          <Icon name="table" />
        </button>
        <button class="fmt-btn" @click="insertImage" title="图片">
          <Icon name="image" />
        </button>
      </div>
    </div>
    <editor-content :editor="editor" class="editor-content" />
    <input type="file" ref="fileInput" accept="image/*" style="display:none" @change="onFileSelected" />
  </div>
</template>

<script setup>
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import Link from '@tiptap/extension-link'
import { watch, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { uploadImage } from '../../api/admin.js'

const props = defineProps({ modelValue: { type: String, default: '' } })
const emit = defineEmits(['update:modelValue'])
const fileInput = ref(null)

const editor = useEditor({
  content: props.modelValue,
  extensions: [
    StarterKit,
    Image,
    Table.configure({ resizable: true }),
    TableRow, TableCell, TableHeader,
    Link.configure({ openOnClick: false })
  ],
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.getHTML())
  }
})

watch(() => props.modelValue, (val) => {
  if (editor.value && val !== editor.value.getHTML()) {
    editor.value.commands.setContent(val, false)
  }
})

function chain() { return editor.value?.chain().focus() }

function insertTable() {
  chain()?.insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
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
</script>

<style scoped>
.rich-editor {
  border: 1px solid var(--color-border-gray);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.editor-toolbar {
  display: flex;
  align-items: center;
  gap: var(--space-px-4);
  padding: var(--space-px-8);
  border-bottom: 1px solid var(--color-border-gray);
  background: var(--color-surface-container-low);
  flex-wrap: wrap;
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
  background: var(--color-surface-container-lowest);
  border-color: var(--color-border-hover);
}

.fmt-btn .svg-icon {
  font-size: 18px;
}

.fmt-active {
  background: var(--color-primary-fixed);
  color: var(--color-primary);
}

.editor-content {
  min-height: 400px;
}

.editor-content :deep(.ProseMirror) {
  outline: none;
  min-height: 400px;
  padding: var(--space-px-16);
  font-size: var(--text-body);
  line-height: var(--leading-relaxed);
}

.editor-content :deep(.ProseMirror h2) {
  font-size: var(--text-feature-title);
  font-weight: var(--weight-semibold);
  margin: var(--space-px-16) 0 var(--space-px-8);
}

.editor-content :deep(.ProseMirror h3) {
  font-size: var(--text-body-large);
  font-weight: var(--weight-semibold);
  margin: var(--space-px-12) 0 var(--space-px-6);
}

.editor-content :deep(.ProseMirror p) {
  margin-bottom: var(--space-px-12);
}

.editor-content :deep(.ProseMirror img) {
  max-width: 100%;
  border-radius: var(--radius-md);
}

.editor-content :deep(.ProseMirror pre) {
  background: var(--color-surface-container-low);
  padding: var(--space-px-12);
  border-radius: var(--radius-md);
  font-family: var(--font-mono);
  font-size: var(--text-caption);
}

.editor-content :deep(.ProseMirror table) {
  width: 100%;
  border-collapse: collapse;
  margin: var(--space-px-12) 0;
}

.editor-content :deep(.ProseMirror th),
.editor-content :deep(.ProseMirror td) {
  border: 1px solid var(--color-border-gray);
  padding: var(--space-px-8);
}

.editor-content :deep(.ProseMirror th) {
  background: var(--color-surface-container-low);
  font-weight: var(--weight-semibold);
}

.editor-content :deep(.ProseMirror blockquote) {
  border-left: 3px solid var(--color-primary);
  padding-left: var(--space-px-16);
  margin: var(--space-px-12) 0;
  color: var(--color-on-surface-variant);
  font-style: italic;
}

.editor-content :deep(.ProseMirror ul),
.editor-content :deep(.ProseMirror ol) {
  padding-left: var(--space-px-24);
  margin-bottom: var(--space-px-12);
}
</style>
