<template>
  <header class="global-nav">
    <div class="nav-inner">
      <router-link to="/" class="nav-logo">用户手册</router-link>
      <nav class="nav-links">
        <router-link to="/" class="nav-link active">文档</router-link>
        <router-link to="/?cat=all" class="nav-link">分类</router-link>
        <router-link to="/" class="nav-link">支持</router-link>
      </nav>
      <div class="nav-right">
        <SearchInput />
        <router-link to="/admin/login" class="login-btn">登录</router-link>
      </div>
    </div>
  </header>
</template>

<script setup>
import SearchInput from './SearchInput.vue'
</script>

<style scoped>
.global-nav {
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border-gray);
  position: sticky;
  top: 0;
  z-index: 100;
}
.nav-inner {
  max-width: var(--content-max);
  margin: 0 auto;
  padding: 0 var(--margin-desktop);
  height: 64px;
  display: flex;
  align-items: center;
  gap: var(--space-px-24);
}
.nav-logo {
  font-family: var(--font-display);
  font-size: var(--text-feature-title);
  font-weight: var(--weight-semibold);
  color: var(--color-ink);
  white-space: nowrap;
  text-decoration: none;
}
.nav-logo:hover {
  color: var(--color-primary);
}
.nav-links {
  display: flex;
  gap: var(--space-px-24);
  margin-left: var(--space-px-16);
}
.nav-link {
  font-size: var(--text-body);
  color: var(--color-on-surface-variant);
  text-decoration: none;
  transition: color 0.2s;
}
.nav-link:hover {
  color: var(--color-primary);
}
.nav-link.active {
  color: var(--color-primary);
  font-weight: var(--weight-semibold);
}
.nav-right {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: var(--space-px-16);
}
.login-btn {
  background: var(--color-primary);
  color: var(--color-on-primary);
  padding: 8px 16px;
  font-size: var(--text-button);
  font-weight: var(--weight-medium);
  border-radius: var(--radius-md);
  text-decoration: none;
  transition: background 0.2s, transform 0.2s;
  box-shadow: var(--shadow-stack-1);
  white-space: nowrap;
}
.login-btn:hover {
  background: var(--color-button-hover-blue);
  color: var(--color-on-primary);
  transform: translateY(-1px);
}

@media (max-width: 768px) {
  .nav-inner {
    padding: 0 var(--margin-mobile);
    height: 56px;
  }
  .nav-links {
    display: none;
  }
  .login-btn {
    display: none;
  }
}
</style>
