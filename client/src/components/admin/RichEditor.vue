<template>
  <div class="rich-editor">
    <div class="editor-toolbar">
      <el-button-group size="small">
        <el-button @click="chain().toggleBold().run()" :type="editor?.isActive('bold') ? 'primary' : ''">B</el-button>
        <el-button @click="chain().toggleItalic().run()" :type="editor?.isActive('italic') ? 'primary' : ''">I</el-button>
        <el-button @click="chain().toggleHeading({ level: 2 }).run()" :type="editor?.isActive('heading', { level: 2 }) ? 'primary' : ''">H2</el-button>
        <el-button @click="chain().toggleHeading({ level: 3 }).run()" :type="editor?.isActive('heading', { level: 3 }) ? 'primary' : ''">H3</el-button>
        <el-button @click="chain().toggleBulletList().run()" :type="editor?.isActive('bulletList') ? 'primary' : ''">列表</el-button>
        <el-button @click="chain().toggleOrderedList().run()" :type="editor?.isActive('orderedList') ? 'primary' : ''">编号</el-button>
        <el-button @click="chain().toggleCodeBlock().run()" :type="editor?.isActive('codeBlock') ? 'primary' : ''">代码</el-button>
        <el-button @click="chain().toggleBlockquote().run()" :type="editor?.isActive('blockquote') ? 'primary' : ''">引用</el-button>
      </el-button-group>
      <el-button-group size="small" style="margin-left:8px;">
        <el-button @click="insertTable">表格</el-button>
        <el-button @click="insertImage">图片</el-button>
      </el-button-group>
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
.rich-editor { border: 1px solid var(--color-hairline); border-radius: var(--radius-sm); }
.editor-toolbar {
  padding: 8px;
  border-bottom: 1px solid var(--color-hairline);
  background: var(--color-canvas-parchment);
}
.editor-content { padding: 16px; min-height: 400px; }
.editor-content :deep(.ProseMirror) {
  outline: none;
  min-height: 400px;
  font-size: var(--text-body);
  line-height: 1.47;
}
.editor-content :deep(.ProseMirror h2) { font-size: var(--text-display); font-weight: var(--weight-strong); margin: 16px 0 8px; }
.editor-content :deep(.ProseMirror h3) { font-size: var(--text-tagline); font-weight: var(--weight-strong); margin: 12px 0 6px; }
.editor-content :deep(.ProseMirror p) { margin-bottom: 12px; }
.editor-content :deep(.ProseMirror img) { max-width: 100%; border-radius: var(--radius-sm); }
.editor-content :deep(.ProseMirror pre) { background: var(--color-canvas-parchment); padding: 12px; border-radius: var(--radius-sm); }
.editor-content :deep(.ProseMirror table) { width: 100%; border-collapse: collapse; }
.editor-content :deep(.ProseMirror th), .editor-content :deep(.ProseMirror td) { border: 1px solid var(--color-hairline); padding: 8px; }
.editor-content :deep(.ProseMirror blockquote) { border-left: 3px solid var(--color-primary); padding-left: 16px; margin: 12px 0; }
</style>
