<template>
  <header class="global-nav">
    <div class="nav-inner">
      <router-link to="/" class="nav-logo">📖 用户手册</router-link>
      <SearchInput />
    </div>
  </header>
</template>

<script setup>
import SearchInput from './SearchInput.vue'
</script>

<style scoped>
.global-nav {
  background: var(--color-canvas);
  border-bottom: 1px solid var(--color-hairline);
  position: sticky;
  top: 0;
  z-index: 100;
}
.nav-inner {
  max-width: var(--content-width);
  margin: 0 auto;
  padding: 0 var(--space-lg);
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-lg);
}
.nav-logo {
  font-family: var(--font-display);
  font-size: var(--text-tagline);
  font-weight: var(--weight-strong);
  color: var(--color-ink);
  white-space: nowrap;
}
.nav-logo:hover { color: var(--color-primary); }
</style>
