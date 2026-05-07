<template>
  <div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
      <h2>文章管理</h2>
      <el-button type="primary" @click="$router.push('/admin/articles/create')">新建文章</el-button>
    </div>
    <div style="margin-bottom:16px;display:flex;gap:12px;">
      <el-select v-model="filterCat" placeholder="筛选分类" clearable @change="load">
        <el-option v-for="c in cats" :key="c.id" :label="c.title" :value="c.id" />
      </el-select>
      <el-select v-model="filterStatus" placeholder="筛选状态" clearable @change="load">
        <el-option label="草稿" :value="0" />
        <el-option label="已发布" :value="1" />
      </el-select>
    </div>
    <el-table :data="list" v-loading="loading" stripe>
      <el-table-column prop="title" label="标题" min-width="200" />
      <el-table-column prop="category_name" label="分类" width="120" />
      <el-table-column label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.status ? 'success' : 'info'" size="small">
            {{ row.status ? '已发布' : '草稿' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="version" label="版本" width="60" />
      <el-table-column prop="created_at" label="创建时间" width="160" />
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="$router.push(`/admin/articles/${row.id}/edit`)">编辑</el-button>
          <el-popconfirm title="确定删除？" @confirm="doDelete(row.id)">
            <template #reference>
              <el-button size="small" type="danger">删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>
    <div style="margin-top:16px;display:flex;justify-content:center;">
      <el-pagination
        v-model:current-page="page"
        :page-size="20"
        :total="total"
        layout="prev, pager, next"
        @current-change="load"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getAdminArticles, deleteArticle, getAdminCategories } from '../../api/admin.js'

const list = ref([])
const cats = ref([])
const loading = ref(false)
const total = ref(0)
const page = ref(1)
const filterCat = ref(null)
const filterStatus = ref(null)

async function load() {
  loading.value = true
  try {
    const params = { page: page.value, page_size: 20 }
    if (filterCat.value) params.category_id = filterCat.value
    if (filterStatus.value !== null && filterStatus.value !== '') params.status = filterStatus.value
    const res = await getAdminArticles(params)
    list.value = res.data.list
    total.value = res.data.total
  } catch (e) { ElMessage.error('加载失败') }
  finally { loading.value = false }
}

async function doDelete(id) {
  try { await deleteArticle(id); ElMessage.success('已删除'); load() }
  catch { ElMessage.error('删除失败') }
}

onMounted(async () => {
  try { cats.value = (await getAdminCategories()).data } catch {}
  load()
})
</script>
