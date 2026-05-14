<template>
  <nav class="breadcrumb">
    <router-link to="/" class="breadcrumb-link">首页</router-link>
    <span v-for="(item, i) in items" :key="i">
      <Icon name="chevron_right" class="breadcrumb-sep" />
      <span v-if="i === items.length - 1" class="breadcrumb-current">{{ item }}</span>
      <router-link v-else :to="item.path" class="breadcrumb-link">{{ item.name }}</router-link>
    </span>
  </nav>
</template>

<script setup>
defineProps({ items: { type: Array, default: () => [] } })
</script>

<style scoped>
.breadcrumb {
  display: flex;
  align-items: center;
  gap: var(--space-px-8);
  font-size: var(--text-caption);
  margin-bottom: var(--space-px-24);
  color: var(--color-on-surface-variant);
}
.breadcrumb-link {
  color: var(--color-gray-500);
  text-decoration: none;
  transition: color 0.2s;
}
.breadcrumb-link:hover {
  color: var(--color-primary-light);
}
.breadcrumb-sep {
  font-size: 16px;
  color: var(--color-gray-500);
  vertical-align: middle;
  margin-left: var(--space-px-4);
}
.breadcrumb-current {
  color: var(--color-near-black);
  font-weight: var(--weight-semibold);
}
</style>
