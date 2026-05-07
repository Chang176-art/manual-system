<template>
  <div class="login-page">
    <div class="login-card">
      <h2>管理后台</h2>
      <el-form @submit.prevent="handleLogin" label-position="top">
        <el-form-item label="用户名">
          <el-input v-model="form.username" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="form.password" type="password" />
        </el-form-item>
        <el-button type="primary" native-type="submit" :loading="loading" style="width:100%">
          登录
        </el-button>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { login } from '../../api/admin.js'

const router = useRouter()
const loading = ref(false)
const form = reactive({ username: '', password: '' })

async function handleLogin() {
  loading.value = true
  try {
    const res = await login(form)
    localStorage.setItem('token', res.data.token)
    router.push('/admin')
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '登录失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-canvas-parchment);
}
.login-card {
  width: 360px;
  padding: var(--space-xl);
  background: var(--color-canvas);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-card);
}
.login-card h2 {
  text-align: center;
  margin-bottom: var(--space-lg);
  font-size: var(--text-display);
}
</style>
