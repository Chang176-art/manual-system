<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-brand">
        <div class="brand-icon">
          <Icon name="shield_person" class="brand-icon-symbol" />
        </div>
        <h1 class="brand-title">用户手册 管理后台</h1>
        <p class="brand-desc">请登录您的账户以管理文档内容</p>
      </div>

      <div class="login-card">
        <el-form @submit.prevent="handleLogin" label-position="top">
          <el-form-item label="用户名 / 邮箱">
            <div class="input-wrapper">
              <Icon name="mail" class="input-icon" />
              <el-input
                v-model="form.username"
                placeholder="输入您的用户名或邮箱"
                class="login-input"
              />
            </div>
          </el-form-item>

          <el-form-item label="密码">
            <div class="input-wrapper">
              <Icon name="lock" class="input-icon" />
              <el-input
                v-model="form.password"
                type="password"
                placeholder="......"
                class="login-input"
              />
              <router-link to="/admin/login" class="forgot-link">忘记密码？</router-link>
            </div>
          </el-form-item>

          <el-form-item>
            <label class="remember-me">
              <input type="checkbox" v-model="remember" class="remember-checkbox" />
              <span class="remember-label">记住登录状态</span>
            </label>
          </el-form-item>

          <el-button
            type="primary"
            native-type="submit"
            :loading="loading"
            class="login-btn"
          >
            进入控制台
            <Icon name="arrow_forward" class="login-btn-icon" />
          </el-button>
        </el-form>

        <div class="login-footer">
          <p>还没有账户？<router-link to="/admin/login" class="contact-link">联系系统管理员</router-link></p>
        </div>
      </div>

      <div class="login-page-footer">
        <a href="#">文档说明</a>
        <a href="#">隐私政策</a>
        <a href="#">服务条款</a>
      </div>
      <p class="login-copyright">© {{ year }} 用户手册</p>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { login } from '../../api/admin.js'

const year = new Date().getFullYear()
const router = useRouter()
const loading = ref(false)
const remember = ref(false)
const form = reactive({ username: '', password: '' })

async function handleLogin() {
  if (!form.username || !form.password) {
    ElMessage.warning('请输入用户名和密码')
    return
  }
  loading.value = true
  try {
    const res = await login(form)
    localStorage.setItem('token', res.data.token)
    if (remember.value) {
      localStorage.setItem('remembered_user', form.username)
    }
    router.push('/admin/articles')
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '登录失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #faf8ff 0%, #f2f3fe 100%);
  padding: var(--margin-mobile);
}

.login-container {
  width: 100%;
  max-width: 28rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* Brand Section */
.login-brand {
  text-align: center;
  margin-bottom: var(--space-px-24);
}

.brand-icon {
  width: 64px;
  height: 64px;
  background: var(--color-primary-light);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto var(--space-px-16);
  box-shadow: var(--shadow-md);
}

.brand-icon-symbol {
  font-size: 36px;
  color: var(--color-on-primary);
}

.brand-title {
  font-size: var(--text-feature-title);
  font-weight: var(--weight-semibold);
  color: var(--color-ink);
  margin-bottom: var(--space-px-4);
}

.brand-desc {
  font-size: var(--text-caption);
  color: var(--color-on-surface-variant);
}

/* Login Card */
.login-card {
  width: 100%;
  background: var(--color-surface-container-lowest);
  border: 1px solid var(--color-border-gray);
  border-radius: var(--radius-lg);
  padding: var(--space-px-24);
  box-shadow: var(--shadow-stack-1);
}

/* Input wrapper with icon */
.input-wrapper {
  position: relative;
  width: 100%;
}

.input-icon {
  position: absolute;
  left: var(--space-px-12);
  top: 50%;
  transform: translateY(-50%);
  font-size: 20px;
  color: var(--color-on-surface-variant);
  z-index: 1;
  pointer-events: none;
}

:deep(.login-input .el-input__wrapper) {
  padding-left: 42px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-gray);
  box-shadow: none;
}

:deep(.login-input .el-input__wrapper:hover) {
  border-color: var(--color-primary);
}

:deep(.login-input .el-input__wrapper.is-focus) {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 1px var(--color-primary);
}

:deep(.login-input .el-input__inner) {
  height: 44px;
  font-family: var(--font-body);
  font-size: var(--text-body);
}

.forgot-link {
  position: absolute;
  right: 12px;
  top: -28px;
  font-size: var(--text-caption);
  color: var(--color-primary);
  text-decoration: none;
}

.forgot-link:hover {
  text-decoration: underline;
}

/* Remember me */
.remember-me {
  display: flex;
  align-items: center;
  gap: var(--space-px-8);
  cursor: pointer;
}

.remember-checkbox {
  width: 16px;
  height: 16px;
  border: 1px solid var(--color-border-gray);
  border-radius: 3px;
  accent-color: var(--color-primary);
  cursor: pointer;
}

.remember-label {
  font-size: var(--text-caption);
  color: var(--color-on-surface-variant);
}

/* Login Button */
.login-btn {
  width: 100%;
  height: 48px;
  background: var(--color-primary-light) !important;
  border: none !important;
  border-radius: var(--radius-md) !important;
  font-size: var(--text-button) !important;
  font-weight: var(--weight-semibold) !important;
  color: var(--color-on-primary) !important;
  transition: transform 0.2s !important;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-px-8);
}

.login-btn:hover {
  transform: translateY(-2px) !important;
  background: var(--color-primary) !important;
}

.login-btn-icon {
  font-size: 20px;
}

/* Footer */
.login-footer {
  margin-top: var(--space-px-16);
  padding-top: var(--space-px-16);
  border-top: 1px solid var(--color-border-gray);
  text-align: center;
}

.login-footer p {
  font-size: var(--text-caption);
  color: var(--color-on-surface-variant);
}

.contact-link {
  color: var(--color-primary);
  font-weight: var(--weight-semibold);
  text-decoration: none;
}

.contact-link:hover {
  text-decoration: underline;
}

/* Page Footer */
.login-page-footer {
  display: flex;
  gap: var(--space-px-24);
  margin-top: var(--space-px-24);
}

.login-page-footer a {
  font-size: var(--text-caption);
  color: var(--color-on-surface-variant);
  text-decoration: none;
}

.login-page-footer a:hover {
  color: var(--color-primary);
}

.login-copyright {
  margin-top: var(--space-px-8);
  font-size: var(--text-fine);
  color: var(--color-on-surface-variant);
}

:deep(.el-form-item) {
  margin-bottom: var(--space-px-20) !important;
}

:deep(.el-form-item__label) {
  font-size: var(--text-label-uppercase) !important;
  font-weight: var(--weight-semibold) !important;
  color: var(--color-ink) !important;
  padding-bottom: var(--space-px-8) !important;
}
</style>
