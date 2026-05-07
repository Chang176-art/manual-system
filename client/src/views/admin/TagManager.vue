<template>
  <div>
    <h2 style="margin-bottom:20px;">标签管理</h2>
    <el-table :data="tags" v-loading="loading">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="标签名称" />
      <el-table-column label="操作" width="100">
        <template #default="{ row }">
          <el-popconfirm title="确定删除？" @confirm="doDelete(row.id)">
            <template #reference><el-button size="small" type="danger">删除</el-button></template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getTags, deleteTag } from '../../api/admin.js'

const tags = ref([])
const loading = ref(false)

async function load() {
  loading.value = true
  try { tags.value = (await getTags()).data }
  catch { ElMessage.error('加载失败') }
  finally { loading.value = false }
}

async function doDelete(id) {
  try { await deleteTag(id); ElMessage.success('已删除'); load() }
  catch { ElMessage.error('删除失败') }
}
onMounted(load)
</script>
