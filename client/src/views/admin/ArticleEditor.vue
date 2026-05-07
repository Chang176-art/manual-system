<template>
  <div>
    <h2>{{ isEdit ? '编辑文章' : '新建文章' }}</h2>
    <el-form label-position="top" style="max-width:900px;">
      <el-form-item label="标题">
        <el-input v-model="form.title" placeholder="文章标题" />
      </el-form-item>
      <el-form-item label="分类">
        <el-select v-model="form.category_id" placeholder="选择分类">
          <el-option v-for="c in categories" :key="c.id" :label="c.title" :value="c.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="内容">
        <RichEditor v-model="form.content_html" />
      </el-form-item>
      <el-form-item label="标签（逗号分隔）">
        <el-input v-model="form.tagInput" placeholder="标签1, 标签2" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="save(1)" :loading="saving">发布</el-button>
        <el-button @click="save(0)" :loading="saving">存草稿</el-button>
        <el-button @click="$router.push('/admin/articles')">取消</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import RichEditor from '../../components/admin/RichEditor.vue'
import { getAdminCategories, getAdminArticleById, createArticle, updateArticle } from '../../api/admin.js'

const route = useRoute()
const router = useRouter()
const isEdit = computed(() => !!route.params.id)
const categories = ref([])
const saving = ref(false)

const form = ref({ title: '', category_id: null, content_html: '', tagInput: '' })

onMounted(async () => {
  try { categories.value = (await getAdminCategories()).data } catch {}
  if (isEdit.value) {
    try {
      const res = await getAdminArticleById(route.params.id)
      const a = res.data
      form.value = { title: a.title, category_id: a.category_id, content_html: a.content_html, tagInput: (a.tags || []).join(', ') }
    } catch { ElMessage.error('加载文章失败') }
  }
})

async function save(status) {
  saving.value = true
  const data = {
    title: form.value.title,
    category_id: form.value.category_id,
    content_html: form.value.content_html,
    tags: form.value.tagInput ? form.value.tagInput.split(/[,，]/).map(s => s.trim()).filter(Boolean) : [],
    status
  }
  try {
    if (isEdit.value) { await updateArticle(route.params.id, data) }
    else { await createArticle(data) }
    ElMessage.success('保存成功')
    router.push('/admin/articles')
  } catch { ElMessage.error('保存失败') }
  finally { saving.value = false }
}
</script>
