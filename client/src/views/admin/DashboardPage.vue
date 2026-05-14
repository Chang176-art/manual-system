<template>
  <div class="admin-layout">
    <!-- Sidebar -->
    <aside class="admin-sidebar">
      <div class="sidebar-header">
        <router-link to="/" class="sidebar-logo">
          <Icon name="menu_book" class="logo-icon" />
          <span class="logo-text">手册管理</span>
        </router-link>
      </div>

      <nav class="sidebar-nav">
        <router-link
          to="/admin/articles"
          :class="['nav-item', { 'nav-active': route.path.startsWith('/admin/articles') }]"
        >
          <Icon name="description" class="nav-icon" />
          <span class="nav-text">文章管理</span>
        </router-link>

        <router-link
          to="/admin/categories"
          :class="['nav-item', { 'nav-active': route.path.startsWith('/admin/categories') }]"
        >
          <Icon name="folder" class="nav-icon" />
          <span class="nav-text">分类管理</span>
        </router-link>

        <router-link
          to="/admin/tags"
          :class="['nav-item', { 'nav-active': route.path.startsWith('/admin/tags') }]"
        >
          <Icon name="sell" class="nav-icon" />
          <span class="nav-text">标签管理</span>
        </router-link>
      </nav>

      <div class="sidebar-footer">
        <router-link to="/" class="nav-item">
          <Icon name="home" class="nav-icon" />
          <span class="nav-text">返回首页</span>
        </router-link>
      </div>
    </aside>

    <!-- Main Content -->
    <div class="admin-main">
      <header class="admin-header">
        <div class="header-search">
          <Icon name="search" class="header-search-icon" />
          <input type="text" placeholder="搜索..." class="header-search-input" />
        </div>
        <div class="header-actions">
          <button class="header-btn" @click="logout">
            <Icon name="logout" />
            <span class="header-btn-text">退出登录</span>
          </button>
        </div>
      </header>

      <main class="admin-content">
        <router-view />
      </main>
    </div>
  </div>
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

<style scoped>
.admin-layout {
  display: flex;
  height: 100vh;
  background: var(--color-canvas);
}

/* ===== Sidebar ===== */
.admin-sidebar {
  width: 220px;
  background: var(--color-surface-pearl);
  border-right: 1px solid var(--color-border-gray);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.sidebar-header {
  padding: var(--space-px-20) var(--space-px-20);
  border-bottom: 1px solid var(--color-border-gray);
}

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: var(--space-px-8);
  text-decoration: none;
  color: var(--color-ink);
}

.logo-icon {
  font-size: 28px;
  color: var(--color-primary);
}

.logo-text {
  font-size: var(--text-tagline);
  font-weight: var(--weight-semibold);
  font-family: var(--font-display);
}

/* Navigation */
.sidebar-nav {
  flex: 1;
  padding: var(--space-px-12) var(--space-px-8);
  display: flex;
  flex-direction: column;
  gap: var(--space-px-4);
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--space-px-12);
  padding: var(--space-px-12) var(--space-px-16);
  border-radius: var(--radius-md);
  text-decoration: none;
  color: var(--color-on-surface-variant);
  transition: all 0.15s;
  font-size: var(--text-body);
}

.nav-item:hover {
  background: var(--color-surface-container-low);
  color: var(--color-ink);
}

.nav-active {
  background: rgba(0, 86, 200, 0.08);
  color: var(--color-primary);
  font-weight: var(--weight-semibold);
  border-left: 3px solid var(--color-primary);
}

.nav-icon {
  font-size: 20px;
}

.sidebar-footer {
  padding: var(--space-px-8);
  border-top: 1px solid var(--color-border-gray);
}

/* ===== Main Content ===== */
.admin-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

/* Header */
.admin-header {
  height: 56px;
  border-bottom: 1px solid var(--color-hairline);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-px-24);
  background: var(--color-surface-pearl);
  flex-shrink: 0;
}

.header-search {
  position: relative;
  max-width: 240px;
  width: 100%;
}

.header-search-icon {
  position: absolute;
  left: var(--space-px-12);
  top: 50%;
  transform: translateY(-50%);
  font-size: 18px;
  color: var(--color-on-surface-variant);
  pointer-events: none;
}

.header-search-input {
  width: 100%;
  padding: 6px 12px 6px 40px;
  font-size: var(--text-caption);
  font-family: var(--font-body);
  border: 1px solid var(--color-border-gray);
  border-radius: var(--radius-md);
  background: var(--color-surface-container-low);
  color: var(--color-ink);
  outline: none;
  transition: border-color 0.2s;
}

.header-search-input:focus {
  border-color: var(--color-primary);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-px-8);
}

.header-btn {
  display: flex;
  align-items: center;
  gap: var(--space-px-4);
  padding: var(--space-px-8) var(--space-px-12);
  background: none;
  border: none;
  cursor: pointer;
  font-family: var(--font-body);
  font-size: var(--text-caption);
  color: var(--color-on-surface-variant);
  border-radius: var(--radius-sm);
  transition: background 0.15s;
}

.header-btn:hover {
  background: var(--color-surface-container-low);
  color: var(--color-ink);
}

.header-btn .svg-icon {
  font-size: 18px;
}

/* Content Area */
.admin-content {
  flex: 1;
  padding: var(--space-px-24);
  overflow-y: auto;
  background: var(--color-canvas);
}
</style>
