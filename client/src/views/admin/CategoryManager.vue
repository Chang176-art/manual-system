<template>
  <div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
      <h2>分类管理</h2>
      <el-button type="primary" @click="showDialog()">新建分类</el-button>
    </div>
    <el-table :data="categories" v-loading="loading" stripe row-key="id">
      <el-table-column prop="icon" label="图标" width="60" />
      <el-table-column prop="title" label="名称" />
      <el-table-column prop="description" label="描述" />
      <el-table-column prop="sort" label="排序" width="80" />
      <el-table-column label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.status ? 'success' : 'info'" size="small">{{ row.status ? '显示' : '隐藏' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="160">
        <template #default="{ row }">
          <el-button size="small" @click="showDialog(row)">编辑</el-button>
          <el-popconfirm title="确定删除？" @confirm="doDelete(row.id)">
            <template #reference><el-button size="small" type="danger">删除</el-button></template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>
    <el-dialog v-model="dialog.visible" :title="dialog.isEdit ? '编辑分类' : '新建分类'" width="500px">
      <el-form label-position="top">
        <el-form-item label="名称"><el-input v-model="dialog.form.title" /></el-form-item>
        <el-form-item label="图标"><el-input v-model="dialog.form.icon" placeholder="📁" style="width:100px" /></el-form-item>
        <el-form-item label="描述"><el-input v-model="dialog.form.description" type="textarea" :rows="2" /></el-form-item>
        <el-form-item label="排序"><el-input-number v-model="dialog.form.sort" :min="0" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialog.visible = false">取消</el-button>
        <el-button type="primary" @click="saveCategory" :loading="dialog.loading">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getAdminCategories, createCategory, updateCategory, deleteCategory } from '../../api/admin.js'

const categories = ref([])
const loading = ref(false)
const dialog = reactive({
  visible: false, isEdit: false, loading: false,
  form: { title: '', icon: '📁', description: '', sort: 0 }
})

async function load() {
  loading.value = true
  try { categories.value = (await getAdminCategories()).data }
  catch { ElMessage.error('加载失败') }
  finally { loading.value = false }
}

function showDialog(row) {
  if (row) { dialog.isEdit = true; dialog.form = { ...row } }
  else { dialog.isEdit = false; dialog.form = { title: '', icon: '📁', description: '', sort: 0 } }
  dialog.visible = true
}

async function saveCategory() {
  dialog.loading = true
  try {
    if (dialog.isEdit) { await updateCategory(dialog.form.id, dialog.form) }
    else { await createCategory(dialog.form) }
    ElMessage.success('保存成功'); dialog.visible = false; load()
  } catch { ElMessage.error('保存失败') }
  finally { dialog.loading = false }
}

async function doDelete(id) {
  try { await deleteCategory(id); ElMessage.success('已删除'); load() }
  catch { ElMessage.error('删除失败') }
}
onMounted(load)
</script>
