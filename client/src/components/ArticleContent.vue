<template>
  <div class="article-content" v-html="content"></div>
</template>

<script setup>
defineProps({ content: { type: String, default: '' } })
</script>

<style scoped>
.article-content {
  font-size: var(--text-body);
  line-height: 1.47;
  color: var(--color-body);
}
.article-content :deep(h2) {
  font-size: var(--text-display);
  font-weight: var(--weight-strong);
  margin: var(--space-xl) 0 var(--space-sm);
  padding-bottom: var(--space-xs);
  border-bottom: 1px solid var(--color-hairline);
}
.article-content :deep(h3) {
  font-size: var(--text-tagline);
  font-weight: var(--weight-strong);
  margin: var(--space-lg) 0 var(--space-sm);
}
.article-content :deep(p) { margin-bottom: var(--space-md); }
.article-content :deep(img) {
  max-width: 100%;
  border-radius: var(--radius-sm);
  margin: var(--space-md) auto;
  display: block;
}
.article-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: var(--space-md) 0;
  font-size: var(--text-caption);
}
.article-content :deep(th) {
  background: var(--color-canvas-parchment);
  padding: 8px 12px;
  text-align: left;
  border: 1px solid var(--color-hairline);
  font-weight: var(--weight-strong);
}
.article-content :deep(td) {
  padding: 8px 12px;
  border: 1px solid var(--color-hairline);
}
.article-content :deep(pre) {
  background: var(--color-canvas-parchment);
  border-radius: var(--radius-sm);
  padding: var(--space-md);
  overflow-x: auto;
  font-family: var(--font-mono);
  font-size: var(--text-caption);
  line-height: 1.5;
  margin: var(--space-md) 0;
}
.article-content :deep(code) {
  font-family: var(--font-mono);
  font-size: 0.9em;
  background: var(--color-canvas-parchment);
  padding: 2px 6px;
  border-radius: 4px;
}
.article-content :deep(ul), .article-content :deep(ol) {
  padding-left: var(--space-lg);
  margin-bottom: var(--space-md);
}
.article-content :deep(li) { margin-bottom: 4px; }
.article-content :deep(blockquote) {
  border-left: 3px solid var(--color-primary);
  background: var(--color-canvas-parchment);
  padding: var(--space-sm) var(--space-md);
  margin: var(--space-md) 0;
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  font-size: var(--text-caption);
}
</style>
