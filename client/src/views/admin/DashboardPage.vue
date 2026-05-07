<template>
  <el-container style="height:100vh;">
    <el-aside width="200px" style="background:#1d1d1f;color:#fff;">
      <h3 style="padding:20px;color:#fff;">📖 手册管理</h3>
      <el-menu
        :default-active="route.path"
        background-color="#1d1d1f"
        text-color="#fff"
        active-text-color="#2997ff"
        router
      >
        <el-menu-item index="/admin/articles">文章管理</el-menu-item>
        <el-menu-item index="/admin/categories">分类管理</el-menu-item>
        <el-menu-item index="/admin/tags">标签管理</el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header style="border-bottom:1px solid var(--color-hairline);display:flex;align-items:center;justify-content:flex-end;">
        <el-button type="text" @click="logout">退出登录</el-button>
      </el-header>
      <el-main>
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { useRouter, useRoute } from 'vue-router'
const router = useRouter()
const route = useRoute()
function logout() {
  localStorage.removeItem('token')
  router.push('/admin/login')
}
</script>
