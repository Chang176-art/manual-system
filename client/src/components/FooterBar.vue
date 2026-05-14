<template>
  <footer class="footer">
    <div class="footer-inner">
      <div class="footer-top">
        <div class="footer-brand">用户手册</div>
        <div class="footer-links">
          <router-link to="/">文档中心</router-link>
          <a href="#">隐私政策</a>
          <a href="#">服务条款</a>
          <a href="#">联系支持</a>
        </div>
      </div>
      <div class="footer-bottom">
        <p>© {{ year }} 用户手册。保留所有权利。</p>
      </div>
    </div>
  </footer>
</template>

<script setup>
const year = new Date().getFullYear()
</script>

<style scoped>
.footer {
  background: var(--color-surface);
  border-top: 1px solid var(--color-border-gray);
  margin-top: var(--space-xxl);
}
.footer-inner {
  max-width: var(--content-max);
  margin: 0 auto;
  padding: var(--space-px-24) var(--margin-desktop);
}
.footer-top {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-px-16);
}
.footer-brand {
  font-family: var(--font-display);
  font-size: var(--text-feature-title);
  font-weight: var(--weight-semibold);
  color: var(--color-ink);
}
.footer-links {
  display: flex;
  gap: var(--space-px-24);
  flex-wrap: wrap;
  justify-content: center;
}
.footer-links a {
  font-size: var(--text-caption);
  color: var(--color-on-surface-variant);
  text-decoration: none;
  font-weight: var(--weight-semibold);
  transition: color 0.2s;
}
.footer-links a:hover {
  color: var(--color-primary);
}
.footer-bottom {
  margin-top: var(--space-px-16);
  text-align: center;
}
.footer-bottom p {
  font-size: var(--text-caption);
  color: var(--color-on-surface-variant);
}

@media (max-width: 768px) {
  .footer-inner {
    padding: var(--space-px-24) var(--margin-mobile);
  }
}
</style>
