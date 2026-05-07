import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', name: 'Home', component: () => import('../views/public/HomePage.vue') },
  { path: '/article/:id', name: 'Article', component: () => import('../views/public/ArticlePage.vue') },
  { path: '/search', name: 'Search', component: () => import('../views/public/SearchResults.vue') },
  { path: '/admin/login', name: 'Login', component: () => import('../views/admin/LoginPage.vue') },
  { path: '/admin', name: 'Dashboard', component: () => import('../views/admin/DashboardPage.vue'), meta: { requiresAuth: true } },
  { path: '/admin/articles', name: 'ArticleList', component: () => import('../views/admin/ArticleList.vue'), meta: { requiresAuth: true } },
  { path: '/admin/articles/create', name: 'ArticleCreate', component: () => import('../views/admin/ArticleEditor.vue'), meta: { requiresAuth: true } },
  { path: '/admin/articles/:id/edit', name: 'ArticleEdit', component: () => import('../views/admin/ArticleEditor.vue'), meta: { requiresAuth: true } },
  { path: '/admin/categories', name: 'CategoryManager', component: () => import('../views/admin/CategoryManager.vue'), meta: { requiresAuth: true } },
  { path: '/admin/tags', name: 'TagManager', component: () => import('../views/admin/TagManager.vue'), meta: { requiresAuth: true } },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth && !localStorage.getItem('token')) {
    next('/admin/login')
  } else {
    next()
  }
})

export default router
