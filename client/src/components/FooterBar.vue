<template>
  <footer class="footer">
    <div class="footer-inner">
      <p>© {{ year }} 出租屋管理系统 · 用户手册</p>
    </div>
  </footer>
</template>

<script setup>
const year = new Date().getFullYear()
</script>

<style scoped>
.footer {
  background: var(--color-canvas-parchment);
  border-top: 1px solid var(--color-hairline);
  margin-top: var(--space-xxl);
}
.footer-inner {
  max-width: var(--content-width);
  margin: 0 auto;
  padding: var(--space-xl) var(--space-lg);
  text-align: center;
  font-size: var(--text-fine);
  color: var(--color-ink-muted-48);
}
</style>
