<template>
  <nav class="breadcrumb">
    <router-link to="/">首页</router-link>
    <span v-for="(item, i) in items" :key="i">
      <span class="sep">/</span>
      <span v-if="i === items.length - 1" class="current">{{ item }}</span>
      <router-link v-else :to="item.path">{{ item.name }}</router-link>
    </span>
  </nav>
</template>

<script setup>
defineProps({ items: { type: Array, default: () => [] } })
</script>

<style scoped>
.breadcrumb {
  font-size: var(--text-caption);
  padding: var(--space-sm) 0;
  color: var(--color-ink-muted-48);
}
.breadcrumb a { color: var(--color-primary); }
.sep { margin: 0 6px; color: var(--color-hairline); }
.current { color: var(--color-ink-muted-48); }
</style>
