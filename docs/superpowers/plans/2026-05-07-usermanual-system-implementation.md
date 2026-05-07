# 用户手册系统实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个独立部署的用户手册系统，包含用户端阅览、管理后台编辑、AI知识库API三大模块

**Architecture:** 单一 Node.js + Express 后端提供统一 API，Vue 3 前端分两个入口（用户站点和管理后台），MySQL 存储。三部分可独立部署但共享数据库。

**Tech Stack:** Vue 3 + Vite + Element Plus / Node.js + Express / MySQL / Tiptap / Docker

---

## 文件结构

```
e:/学习中心/
├── server/                        # Node.js 后端
│   ├── package.json
│   ├── src/
│   │   ├── index.js               # 入口
│   │   ├── config.js              # 配置
│   │   ├── db.js                  # 数据库连接
│   │   ├── schema.sql             # 数据库建表语句
│   │   ├── seed.sql               # 初始数据
│   │   ├── middleware/
│   │   │   ├── auth.js            # JWT 认证
│   │   │   └── errorHandler.js    # 全局错误处理
│   │   ├── routes/
│   │   │   ├── public.js          # 公开 API
│   │   │   ├── admin.js           # 管理 API
│   │   │   └── ai.js              # AI 知识库 API
│   │   ├── controllers/
│   │   │   ├── category.js
│   │   │   ├── article.js
│   │   │   └── upload.js
│   │   └── utils/
│   │       ├── htmlToText.js      # HTML → 纯文本
│   │       └── response.js        # 统一响应格式
│   └── uploads/                   # 上传文件存储
├── client/                        # Vue 3 前端
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   ├── src/
│   │   ├── main.js
│   │   ├── App.vue
│   │   ├── router/
│   │   │   └── index.js
│   │   ├── styles/
│   │   │   ├── variables.css      # 设计 Token
│   │   │   └── global.css         # 全局样式
│   │   ├── api/
│   │   │   ├── request.js         # Axios 实例
│   │   │   ├── public.js          # 公开 API 调用
│   │   │   └── admin.js           # 管理 API 调用
│   │   ├── views/
│   │   │   ├── public/
│   │   │   │   ├── HomePage.vue
│   │   │   │   ├── ArticlePage.vue
│   │   │   │   └── SearchResults.vue
│   │   │   └── admin/
│   │   │       ├── LoginPage.vue
│   │   │       ├── DashboardPage.vue
│   │   │       ├── ArticleList.vue
│   │   │       ├── ArticleEditor.vue
│   │   │       ├── CategoryManager.vue
│   │   │       └── TagManager.vue
│   │   └── components/
│   │       ├── GlobalNav.vue
│   │       ├── FooterBar.vue
│   │       ├── CategoryCard.vue
│   │       ├── Breadcrumb.vue
│   │       ├── ArticleContent.vue
│   │       ├── SearchInput.vue
│   │       └── admin/
│   │           └── RichEditor.vue
│   └── public/
├── docker-compose.yml
└── Dockerfile
```

---

## Phase 1: 项目脚手架

### Task 1: 初始化后端项目

**Files:**
- Create: `server/package.json`
- Create: `server/src/config.js`
- Create: `server/src/db.js`
- Create: `server/src/schema.sql`
- Create: `server/src/index.js`
- Create: `server/src/utils/response.js`
- Create: `server/src/middleware/errorHandler.js`

- [ ] **Step 1: 创建 server/package.json**

```json
{
  "name": "usermanual-server",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "node --watch src/index.js",
    "start": "node src/index.js",
    "db:init": "node src/db.js --init"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mysql2": "^3.9.0",
    "cors": "^2.8.5",
    "jsonwebtoken": "^9.0.2",
    "multer": "^1.4.5-lts.1",
    "bcryptjs": "^2.4.3",
    "cheerio": "^1.0.0-rc.12"
  }
}
```

- [ ] **Step 2: 创建 server/src/config.js**

```js
export default {
  port: process.env.PORT || 3001,
  jwtSecret: process.env.JWT_SECRET || 'usermanual-admin-secret-key',
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'usermanual'
  },
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  maxFileSize: 10 * 1024 * 1024 // 10MB
}
```

- [ ] **Step 3: 创建 server/src/db.js**

```js
import mysql from 'mysql2/promise'
import config from './config.js'

const pool = mysql.createPool({
  ...config.db,
  waitForConnections: true,
  connectionLimit: 10
})

export async function query(sql, params) {
  const [rows] = await pool.execute(sql, params)
  return rows
}

export default pool
```

- [ ] **Step 4: 创建 server/src/schema.sql**

```sql
CREATE DATABASE IF NOT EXISTS usermanual DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE usermanual;

CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  icon VARCHAR(50) DEFAULT '📁',
  description VARCHAR(500) DEFAULT '',
  sort INT DEFAULT 0,
  parent_id INT DEFAULT NULL,
  status TINYINT DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS articles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  content_html TEXT,
  content_text LONGTEXT,
  cover_image VARCHAR(500) DEFAULT '',
  sort INT DEFAULT 0,
  status TINYINT DEFAULT 0,
  version INT DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS tags (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS article_tags (
  article_id INT NOT NULL,
  tag_id INT NOT NULL,
  PRIMARY KEY (article_id, tag_id),
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS admin_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 默认管理员密码: admin123
INSERT INTO admin_users (username, password) VALUES ('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy');
```

- [ ] **Step 5: 创建 server/src/utils/response.js**

```js
export function success(res, data = null, message = 'ok') {
  return res.json({ code: 0, message, data })
}

export function fail(res, message = 'error', code = -1, status = 400) {
  return res.status(status).json({ code, message, data: null })
}
```

- [ ] **Step 6: 创建 server/src/middleware/errorHandler.js**

```js
import { fail } from '../utils/response.js'

export default function errorHandler(err, req, res, next) {
  console.error('[Error]', err.message)
  if (err.name === 'MulterError') {
    return fail(res, '文件上传失败: ' + err.message, -1, 400)
  }
  return fail(res, '服务器内部错误', -1, 500)
}
```

- [ ] **Step 7: 创建 server/src/index.js**

```js
import express from 'express'
import cors from 'cors'
import config from './config.js'
import errorHandler from './middleware/errorHandler.js'
import publicRoutes from './routes/public.js'
import adminRoutes from './routes/admin.js'
import aiRoutes from './routes/ai.js'

const app = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use('/uploads', express.static(config.uploadDir))

app.use('/api/public', publicRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/ai', aiRoutes)

app.use(errorHandler)

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`)
})
```

- [ ] **Step 8: 安装依赖并测试启动**

Run: `cd e:/学习中心/server && npm install`
Expected: 依赖安装成功

### Task 2: 初始化前端项目

**Files:**
- Create: `client/package.json`
- Create: `client/vite.config.js`
- Create: `client/index.html`
- Create: `client/src/main.js`
- Create: `client/src/App.vue`
- Create: `client/src/router/index.js`
- Create: `client/src/api/request.js`

- [ ] **Step 1: 创建 client/package.json**

```json
{
  "name": "usermanual-client",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "vue": "^3.4.0",
    "vue-router": "^4.3.0",
    "axios": "^1.7.0",
    "element-plus": "^2.7.0",
    "@element-plus/icons-vue": "^2.3.1",
    "@tiptap/vue-3": "^2.4.0",
    "@tiptap/starter-kit": "^2.4.0",
    "@tiptap/extension-image": "^2.4.0",
    "@tiptap/extension-table": "^2.4.0",
    "@tiptap/extension-table-row": "^2.4.0",
    "@tiptap/extension-table-cell": "^2.4.0",
    "@tiptap/extension-table-header": "^2.4.0",
    "@tiptap/extension-link": "^2.4.0",
    "@tiptap/extension-code-block-lowlight": "^2.4.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.0.0",
    "vite": "^5.4.0"
  }
}
```

- [ ] **Step 2: 创建 client/vite.config.js**

```js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001'
    }
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
})
```

- [ ] **Step 3: 创建 client/index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>用户手册</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.js"></script>
</body>
</html>
```

- [ ] **Step 4: 创建 client/src/main.js**

```js
import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'
import router from './router'
import './styles/variables.css'
import './styles/global.css'

const app = createApp(App)
app.use(ElementPlus)
app.use(router)
app.mount('#app')
```

- [ ] **Step 5: 创建 client/src/App.vue**

```vue
<template>
  <router-view />
</template>

<script setup>
</script>
```

- [ ] **Step 6: 创建 client/src/router/index.js**

```js
import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  // 用户端
  { path: '/', name: 'Home', component: () => import('../views/public/HomePage.vue') },
  { path: '/article/:id', name: 'Article', component: () => import('../views/public/ArticlePage.vue') },
  { path: '/search', name: 'Search', component: () => import('../views/public/SearchResults.vue') },
  // 管理后台
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
```

- [ ] **Step 7: 创建 client/src/api/request.js**

```js
import axios from 'axios'

const request = axios.create({
  baseURL: '/api',
  timeout: 10000
})

request.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

request.interceptors.response.use(
  response => response.data,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/admin/login'
    }
    return Promise.reject(error)
  }
)

export default request
```

- [ ] **Step 8: 安装前端依赖**

Run: `cd e:/学习中心/client && npm install`
Expected: 依赖安装成功

---

## Phase 2: 设计 Token + 全局样式

### Task 3: 创建设计系统 CSS

**Files:**
- Create: `client/src/styles/variables.css`
- Create: `client/src/styles/global.css`

- [ ] **Step 1: 创建 client/src/styles/variables.css**

```css
:root {
  /* Colors - Apple Design System */
  --color-primary: #0066cc;
  --color-primary-focus: #0071e3;
  --color-primary-on-dark: #2997ff;
  --color-ink: #1d1d1f;
  --color-body: #1d1d1f;
  --color-body-on-dark: #ffffff;
  --color-body-muted: #cccccc;
  --color-ink-muted-48: #7a7a7a;
  --color-canvas: #ffffff;
  --color-canvas-parchment: #f5f5f7;
  --color-surface-pearl: #fafafc;
  --color-hairline: #e0e0e0;
  --color-surface-black: #000000;

  /* Typography */
  --font-display: 'Inter', system-ui, -apple-system, sans-serif;
  --font-body: 'Inter', system-ui, -apple-system, sans-serif;
  --font-mono: 'SF Mono', 'Fira Code', monospace;

  --text-hero: 40px;
  --text-display: 28px;
  --text-tagline: 21px;
  --text-body: 17px;
  --text-caption: 14px;
  --text-fine: 12px;

  --weight-normal: 400;
  --weight-strong: 600;

  /* Spacing */
  --space-xs: 8px;
  --space-sm: 12px;
  --space-md: 17px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-xxl: 48px;
  --space-section: 80px;

  /* Radius */
  --radius-sm: 8px;
  --radius-md: 11px;
  --radius-lg: 18px;
  --radius-pill: 9999px;

  /* Content max-width */
  --content-width: 980px;

  /* Shadows */
  --shadow-card: 0 2px 8px rgba(0, 0, 0, 0.08);
}
```

- [ ] **Step 2: 创建 client/src/styles/global.css**

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600&display=swap');

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: var(--font-body);
  font-size: var(--text-body);
  font-weight: var(--weight-normal);
  line-height: 1.47;
  letter-spacing: -0.374px;
  color: var(--color-body);
  background: var(--color-canvas);
  -webkit-font-smoothing: antialiased;
}

a {
  color: var(--color-primary);
  text-decoration: none;
}
a:hover {
  color: var(--color-primary-focus);
}

h1, h2, h3, h4 {
  font-family: var(--font-display);
  letter-spacing: -0.374px;
}

.container {
  max-width: var(--content-width);
  margin: 0 auto;
  padding: 0 var(--space-lg);
}
```

---

## Phase 3: 后端 API 实现

### Task 4: 认证中间件 + 公开 API

**Files:**
- Create: `server/src/middleware/auth.js`
- Create: `server/src/routes/public.js`
- Create: `server/src/controllers/category.js`
- Create: `server/src/controllers/article.js`

- [ ] **Step 1: 创建 server/src/middleware/auth.js**

```js
import jwt from 'jsonwebtoken'
import config from '../config.js'
import { fail } from '../utils/response.js'

export function requireAuth(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return fail(res, '未登录', -1, 401)
  }
  try {
    req.user = jwt.verify(header.slice(7), config.jwtSecret)
    next()
  } catch {
    return fail(res, '登录已过期', -1, 401)
  }
}

export function generateToken(payload) {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: '7d' })
}
```

- [ ] **Step 2: 创建 server/src/controllers/category.js**

```js
import { query } from '../db.js'
import { success, fail } from '../utils/response.js'

export async function getCategories(req, res, next) {
  try {
    const rows = await query(
      `SELECT c.*, (SELECT COUNT(*) FROM articles a WHERE a.category_id = c.id AND a.status = 1) as article_count
       FROM categories c WHERE c.status = 1 ORDER BY c.sort ASC`
    )
    success(res, rows)
  } catch (err) { next(err) }
}

export async function getCategoryTree(req, res, next) {
  try {
    const rows = await query('SELECT * FROM categories WHERE status = 1 ORDER BY sort ASC')
    const map = {}
    const tree = []
    rows.forEach(r => { map[r.id] = { ...r, children: [] } })
    rows.forEach(r => {
      if (r.parent_id && map[r.parent_id]) {
        map[r.parent_id].children.push(map[r.id])
      } else {
        tree.push(map[r.id])
      }
    })
    success(res, tree)
  } catch (err) { next(err) }
}
```

- [ ] **Step 3: 创建 server/src/controllers/article.js**

```js
import { query } from '../db.js'
import { success, fail } from '../utils/response.js'

export async function getArticles(req, res, next) {
  try {
    const { category_id, page = 1, page_size = 20 } = req.query
    const offset = (page - 1) * page_size
    let sql = 'SELECT id, category_id, title, cover_image, status, version, created_at, updated_at FROM articles'
    let countSql = 'SELECT COUNT(*) as total FROM articles'
    const params = []
    const where = []
    if (category_id) {
      where.push('category_id = ?')
      params.push(category_id)
    }
    const whereClause = where.length ? ' WHERE ' + where.join(' AND ') : ''
    const total = await query(countSql + whereClause, params)
    const rows = await query(sql + whereClause + ' ORDER BY sort ASC, id DESC LIMIT ? OFFSET ?', [...params, Number(page_size), offset])
    success(res, { list: rows, total: total[0].total, page: Number(page), page_size: Number(page_size) })
  } catch (err) { next(err) }
}

export async function getArticleById(req, res, next) {
  try {
    const [article] = await query(
      `SELECT a.*, c.title as category_name FROM articles a
       LEFT JOIN categories c ON a.category_id = c.id
       WHERE a.id = ?`, [req.params.id]
    )
    if (!article) return fail(res, '文章不存在', 404, 404)

    const tags = await query(
      `SELECT t.id, t.name FROM tags t
       JOIN article_tags at ON t.id = at.tag_id
       WHERE at.article_id = ?`, [req.params.id]
    )
    article.tags = tags.map(t => t.name)
    success(res, article)
  } catch (err) { next(err) }
}

export async function searchArticles(req, res, next) {
  try {
    const { q } = req.query
    if (!q) return fail(res, '请输入搜索关键词', -1)
    const rows = await query(
      `SELECT id, title, category_id, created_at FROM articles
       WHERE status = 1 AND (title LIKE ? OR content_text LIKE ?)
       ORDER BY sort ASC LIMIT 20`,
      [`%${q}%`, `%${q}%`]
    )
    success(res, rows)
  } catch (err) { next(err) }
}
```

- [ ] **Step 4: 创建 server/src/routes/public.js**

```js
import { Router } from 'express'
import { getCategories, getCategoryTree } from '../controllers/category.js'
import { getArticles, getArticleById, searchArticles } from '../controllers/article.js'

const router = Router()
router.get('/categories', getCategories)
router.get('/category-tree', getCategoryTree)
router.get('/articles', getArticles)
router.get('/articles/:id', getArticleById)
router.get('/search', searchArticles)

export default router
```

### Task 5: 管理端 API

**Files:**
- Create: `server/src/utils/htmlToText.js`
- Create: `server/src/controllers/upload.js`
- Create: `server/src/routes/admin.js`

- [ ] **Step 1: 创建 server/src/utils/htmlToText.js**

```js
import * as cheerio from 'cheerio'

export function htmlToText(html) {
  const $ = cheerio.load(html)
  $('script, style').remove()
  let text = $.root().text()
  text = text.replace(/\s+/g, ' ').trim()
  return text
}
```

- [ ] **Step 2: 创建 server/src/controllers/upload.js**

```js
import multer from 'multer'
import path from 'path'
import config from '../config.js'
import { success, fail } from '../utils/response.js'
import fs from 'fs'

if (!fs.existsSync(config.uploadDir)) {
  fs.mkdirSync(config.uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: config.uploadDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, Date.now() + '-' + Math.random().toString(36).slice(2) + ext)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: config.maxFileSize },
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
    const ext = path.extname(file.originalname).toLowerCase()
    if (allowed.includes(ext)) {
      cb(null, true)
    } else {
      cb(new Error('不支持的文件格式'))
    }
  }
})

export function uploadImage(req, res, next) {
  upload.single('file')(req, res, err => {
    if (err) return next(err)
    if (!req.file) return fail(res, '请选择文件', -1)
    success(res, { url: '/uploads/' + req.file.filename })
  })
}
```

- [ ] **Step 3: 创建 server/src/routes/admin.js**

```js
import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { query } from '../db.js'
import { success, fail } from '../utils/response.js'
import { requireAuth, generateToken } from '../middleware/auth.js'
import { htmlToText } from '../utils/htmlToText.js'
import { uploadImage } from '../controllers/upload.js'

const router = Router()

// 登录
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body
    const [user] = await query('SELECT * FROM admin_users WHERE username = ?', [username])
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return fail(res, '用户名或密码错误', -1, 401)
    }
    const token = generateToken({ id: user.id, username: user.username })
    success(res, { token, username: user.username })
  } catch (err) { next(err) }
})

// 以下路由需要登录
router.use(requireAuth)

// 分类 CRUD
router.get('/categories', async (req, res, next) => {
  try {
    const rows = await query('SELECT * FROM categories ORDER BY sort ASC')
    success(res, rows)
  } catch (err) { next(err) }
})

router.post('/categories', async (req, res, next) => {
  try {
    const { title, icon, description, parent_id, sort } = req.body
    const r = await query(
      'INSERT INTO categories (title, icon, description, parent_id, sort) VALUES (?, ?, ?, ?, ?)',
      [title, icon || '📁', description || '', parent_id || null, sort || 0]
    )
    success(res, { id: r.insertId })
  } catch (err) { next(err) }
})

router.put('/categories/:id', async (req, res, next) => {
  try {
    const { title, icon, description, parent_id, sort, status } = req.body
    await query(
      'UPDATE categories SET title=?, icon=?, description=?, parent_id=?, sort=?, status=? WHERE id=?',
      [title, icon, description, parent_id || null, sort, status, req.params.id]
    )
    success(res)
  } catch (err) { next(err) }
})

router.delete('/categories/:id', async (req, res, next) => {
  try {
    await query('DELETE FROM categories WHERE id = ?', [req.params.id])
    success(res)
  } catch (err) { next(err) }
})

// 文章详情（含草稿）
router.get('/articles/:id', async (req, res, next) => {
  try {
    const [article] = await query(
      `SELECT a.*, c.title as category_name FROM articles a
       LEFT JOIN categories c ON a.category_id = c.id
       WHERE a.id = ?`, [req.params.id]
    )
    if (!article) return fail(res, '文章不存在', 404, 404)
    const tags = await query(
      `SELECT t.name FROM tags t JOIN article_tags at ON t.id = at.tag_id WHERE at.article_id = ?`,
      [req.params.id]
    )
    article.tags = tags.map(t => t.name)
    success(res, article)
  } catch (err) { next(err) }
})

// 文章 CRUD
router.get('/articles', async (req, res, next) => {
  try {
    const { category_id, status, page = 1, page_size = 20 } = req.query
    const offset = (page - 1) * page_size
    const where = []
    const params = []
    if (category_id) { where.push('a.category_id = ?'); params.push(category_id) }
    if (status !== undefined && status !== '') { where.push('a.status = ?'); params.push(Number(status)) }
    const whereClause = where.length ? ' WHERE ' + where.join(' AND ') : ''
    const [{ total }] = await query('SELECT COUNT(*) as total FROM articles a' + whereClause, params)
    const rows = await query(
      `SELECT a.id, a.title, a.category_id, c.title as category_name, a.status, a.sort, a.version, a.created_at, a.updated_at
       FROM articles a LEFT JOIN categories c ON a.category_id = c.id` + whereClause +
      ' ORDER BY a.sort ASC, a.id DESC LIMIT ? OFFSET ?',
      [...params, Number(page_size), offset]
    )
    success(res, { list: rows, total, page: Number(page), page_size: Number(page_size) })
  } catch (err) { next(err) }
})

router.post('/articles', async (req, res, next) => {
  try {
    const { category_id, title, content_html, cover_image, status, tags } = req.body
    const content_text = htmlToText(content_html || '')
    const r = await query(
      'INSERT INTO articles (category_id, title, content_html, content_text, cover_image, status) VALUES (?, ?, ?, ?, ?, ?)',
      [category_id, title, content_html, content_text, cover_image || '', status || 0]
    )
    const articleId = r.insertId
    if (tags && tags.length) {
      for (const name of tags) {
        const [existing] = await query('SELECT id FROM tags WHERE name = ?', [name])
        let tagId
        if (existing) {
          tagId = existing.id
        } else {
          const t = await query('INSERT INTO tags (name) VALUES (?)', [name])
          tagId = t.insertId
        }
        await query('INSERT INTO article_tags (article_id, tag_id) VALUES (?, ?)', [articleId, tagId])
      }
    }
    success(res, { id: articleId })
  } catch (err) { next(err) }
})

router.put('/articles/:id', async (req, res, next) => {
  try {
    const { category_id, title, content_html, cover_image, status, tags } = req.body
    const content_text = htmlToText(content_html || '')
    await query(
      'UPDATE articles SET category_id=?, title=?, content_html=?, content_text=?, cover_image=?, status=?, version=version+1 WHERE id=?',
      [category_id, title, content_html, content_text, cover_image || '', status, req.params.id]
    )
    if (tags) {
      await query('DELETE FROM article_tags WHERE article_id = ?', [req.params.id])
      for (const name of tags) {
        let tag = await query('SELECT id FROM tags WHERE name = ?', [name])
        let tagId
        if (tag.length) {
          tagId = tag[0].id
        } else {
          const t = await query('INSERT INTO tags (name) VALUES (?)', [name])
          tagId = t.insertId
        }
        await query('INSERT INTO article_tags (article_id, tag_id) VALUES (?, ?)', [req.params.id, tagId])
      }
    }
    success(res)
  } catch (err) { next(err) }
})

router.delete('/articles/:id', async (req, res, next) => {
  try {
    await query('DELETE FROM articles WHERE id = ?', [req.params.id])
    success(res)
  } catch (err) { next(err) }
})

// 标签
router.get('/tags', async (req, res, next) => {
  try {
    const rows = await query('SELECT * FROM tags ORDER BY id DESC')
    success(res, rows)
  } catch (err) { next(err) }
})

router.delete('/tags/:id', async (req, res, next) => {
  try {
    await query('DELETE FROM tags WHERE id = ?', [req.params.id])
    success(res)
  } catch (err) { next(err) }
})

// 图片上传
router.post('/upload', uploadImage)

export default router
```

### Task 6: AI 知识库 API

**Files:**
- Create: `server/src/routes/ai.js`

- [ ] **Step 1: 创建 server/src/routes/ai.js**

```js
import { Router } from 'express'
import { query } from '../db.js'
import { success } from '../utils/response.js'

const router = Router()

// 获取所有已发布文章（纯文本 + 元信息）
router.get('/articles', async (req, res, next) => {
  try {
    const rows = await query(
      `SELECT a.id, a.title, a.content_text, c.title as category_name, a.created_at, a.updated_at
       FROM articles a LEFT JOIN categories c ON a.category_id = c.id
       WHERE a.status = 1 ORDER BY c.sort ASC, a.sort ASC`
    )
    success(res, rows)
  } catch (err) { next(err) }
})

// 获取单篇文章纯文本
router.get('/articles/:id', async (req, res, next) => {
  try {
    const [article] = await query(
      `SELECT a.id, a.title, a.content_text, c.title as category_name, a.created_at, a.updated_at
       FROM articles a LEFT JOIN categories c ON a.category_id = c.id
       WHERE a.id = ? AND a.status = 1`, [req.params.id]
    )
    success(res, article || null)
  } catch (err) { next(err) }
})

// 获取分类结构（含文章列表）
router.get('/categories', async (req, res, next) => {
  try {
    const categories = await query('SELECT id, title, icon, description FROM categories WHERE status = 1 ORDER BY sort ASC')
    const result = []
    for (const cat of categories) {
      const articles = await query(
        `SELECT id, title FROM articles WHERE category_id = ? AND status = 1 ORDER BY sort ASC`,
        [cat.id]
      )
      result.push({ ...cat, articles })
    }
    success(res, result)
  } catch (err) { next(err) }
})

export default router
```

---

## Phase 4: 用户端前端

### Task 7: 公共组件

**Files:**
- Create: `client/src/components/GlobalNav.vue`
- Create: `client/src/components/FooterBar.vue`
- Create: `client/src/components/CategoryCard.vue`
- Create: `client/src/components/SearchInput.vue`
- Create: `client/src/components/Breadcrumb.vue`
- Create: `client/src/components/ArticleContent.vue`
- Create: `client/src/api/public.js`

- [ ] **Step 1: 创建 client/src/api/public.js**

```js
import request from './request.js'

export function getCategories() {
  return request.get('/public/categories')
}

export function getCategoryTree() {
  return request.get('/public/category-tree')
}

export function getArticles(params) {
  return request.get('/public/articles', { params })
}

export function getArticleById(id) {
  return request.get(`/public/articles/${id}`)
}

export function searchArticles(q) {
  return request.get('/public/search', { params: { q } })
}
```

- [ ] **Step 2: 创建 client/src/components/GlobalNav.vue**

```vue
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
```

- [ ] **Step 3: 创建 client/src/components/SearchInput.vue**

```vue
<template>
  <div class="search-wrapper">
    <input
      v-model="keyword"
      class="search-input"
      type="text"
      placeholder="搜索..."
      @keyup.enter="doSearch"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
const keyword = ref('')
const router = useRouter()
function doSearch() {
  if (keyword.value.trim()) {
    router.push({ path: '/search', query: { q: keyword.value.trim() } })
  }
}
</script>

<style scoped>
.search-wrapper { flex: 1; max-width: 300px; }
.search-input {
  width: 100%;
  padding: 6px 16px;
  font-size: var(--text-caption);
  font-family: var(--font-body);
  border: 1px solid var(--color-hairline);
  border-radius: var(--radius-pill);
  background: var(--color-surface-pearl);
  color: var(--color-ink);
  outline: none;
  transition: border-color 0.2s;
}
.search-input:focus { border-color: var(--color-primary); }
</style>
```

- [ ] **Step 4: 创建 client/src/components/CategoryCard.vue**

```vue
<template>
  <router-link :to="`/?cat=${category.id}`" class="category-card">
    <span class="card-icon">{{ category.icon }}</span>
    <h3 class="card-title">{{ category.title }}</h3>
    <p class="card-desc">{{ category.description }}</p>
    <span class="card-count">{{ category.article_count }} 篇文章</span>
  </router-link>
</template>

<script setup>
defineProps({ category: { type: Object, required: true } })
</script>

<style scoped>
.category-card {
  display: flex;
  flex-direction: column;
  padding: var(--space-lg);
  background: var(--color-canvas);
  border: 1px solid var(--color-hairline);
  border-radius: var(--radius-sm);
  text-decoration: none;
  color: var(--color-ink);
  transition: transform 0.2s, box-shadow 0.2s;
}
.category-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-card);
}
.card-icon { font-size: 32px; margin-bottom: var(--space-sm); }
.card-title {
  font-size: var(--text-tagline);
  font-weight: var(--weight-strong);
  margin-bottom: 4px;
}
.card-desc {
  font-size: var(--text-caption);
  color: var(--color-ink-muted-48);
  flex: 1;
  margin-bottom: var(--space-xs);
}
.card-count {
  font-size: var(--text-fine);
  color: var(--color-primary);
}
</style>
```

- [ ] **Step 5: 创建 client/src/components/Breadcrumb.vue**

```vue
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
```

- [ ] **Step 6: 创建 client/src/components/FooterBar.vue**

```vue
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
```

- [ ] **Step 7: 创建 client/src/components/ArticleContent.vue**

```vue
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
.article-content :deep(p) {
  margin-bottom: var(--space-md);
}
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
```

### Task 8: 用户端页面

**Files:**
- Create: `client/src/views/public/HomePage.vue`
- Create: `client/src/views/public/ArticlePage.vue`
- Create: `client/src/views/public/SearchResults.vue`

- [ ] **Step 1: 创建 client/src/views/public/HomePage.vue**

```vue
<template>
  <div class="page">
    <GlobalNav />
    <main class="main">
      <div class="container">
        <div class="hero">
          <h1 class="hero-title">📖 用户手册</h1>
          <p class="hero-desc">出租屋管理系统使用指南</p>
        </div>
        <div v-if="loading" class="loading">加载中...</div>
        <div v-else class="card-grid">
          <CategoryCard v-for="cat in categories" :key="cat.id" :category="cat" />
        </div>
        <div v-if="!loading && categories.length === 0" class="empty">
          暂无内容
        </div>
      </div>
    </main>
    <FooterBar />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import GlobalNav from '../../components/GlobalNav.vue'
import FooterBar from '../../components/FooterBar.vue'
import CategoryCard from '../../components/CategoryCard.vue'
import { getCategories } from '../../api/public.js'

const categories = ref([])
const loading = ref(true)

onMounted(async () => {
  try {
    const res = await getCategories()
    categories.value = res.data
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.hero {
  text-align: center;
  padding: var(--space-xxl) 0 var(--space-xl);
}
.hero-title {
  font-size: var(--text-hero);
  font-weight: var(--weight-strong);
  letter-spacing: -0.28px;
  margin-bottom: var(--space-xs);
}
.hero-desc {
  font-size: var(--text-tagline);
  color: var(--color-ink-muted-48);
}
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-lg);
}
.loading, .empty {
  text-align: center;
  padding: var(--space-xxl);
  color: var(--color-ink-muted-48);
}
</style>
```

- [ ] **Step 2: 创建 client/src/views/public/ArticlePage.vue**

```vue
<template>
  <div class="page">
    <GlobalNav />
    <main class="main">
      <div class="container">
        <Breadcrumb :items="breadcrumbItems" />
        <div v-if="loading" class="loading">加载中...</div>
        <template v-else-if="article">
          <article class="article">
            <h1 class="article-title">{{ article.title }}</h1>
            <div class="article-meta">
              <span>{{ article.category_name }}</span>
              <span>{{ article.created_at?.slice(0, 10) }}</span>
            </div>
            <div class="tags" v-if="article.tags?.length">
              <span class="tag" v-for="tag in article.tags" :key="tag">{{ tag }}</span>
            </div>
            <ArticleContent :content="article.content_html" />
          </article>
        </template>
        <div v-else class="empty">文章不存在</div>
      </div>
    </main>
    <FooterBar />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import GlobalNav from '../../components/GlobalNav.vue'
import FooterBar from '../../components/FooterBar.vue'
import Breadcrumb from '../../components/Breadcrumb.vue'
import ArticleContent from '../../components/ArticleContent.vue'
import { getArticleById } from '../../api/public.js'

const route = useRoute()
const article = ref(null)
const loading = ref(true)

const breadcrumbItems = computed(() => {
  if (!article.value) return []
  return [
    { name: article.value.category_name || '未分类', path: `/?cat=${article.value.category_id}` },
    article.value.title
  ]
})

onMounted(async () => {
  try {
    const res = await getArticleById(route.params.id)
    article.value = res.data
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.article {
  padding: var(--space-lg) 0 var(--space-xxl);
}
.article-title {
  font-size: var(--text-hero);
  font-weight: var(--weight-strong);
  letter-spacing: -0.28px;
  margin-bottom: var(--space-sm);
}
.article-meta {
  font-size: var(--text-caption);
  color: var(--color-ink-muted-48);
  margin-bottom: var(--space-md);
  display: flex;
  gap: var(--space-md);
}
.tags {
  display: flex;
  gap: var(--space-xs);
  margin-bottom: var(--space-lg);
}
.tag {
  font-size: var(--text-fine);
  background: var(--color-canvas-parchment);
  color: var(--color-primary);
  padding: 2px 10px;
  border-radius: var(--radius-pill);
}
</style>
```

- [ ] **Step 3: 创建 client/src/views/public/SearchResults.vue**

```vue
<template>
  <div class="page">
    <GlobalNav />
    <main class="main">
      <div class="container">
        <h2 class="search-title">搜索: "{{ keyword }}"</h2>
        <div v-if="loading" class="loading">搜索中...</div>
        <div v-else-if="results.length === 0" class="empty">未找到相关内容</div>
        <div v-else class="results-list">
          <router-link
            v-for="item in results"
            :key="item.id"
            :to="`/article/${item.id}`"
            class="result-item"
          >
            <h3>{{ item.title }}</h3>
            <p class="result-meta">{{ item.created_at?.slice(0, 10) }}</p>
          </router-link>
        </div>
      </div>
    </main>
    <FooterBar />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import GlobalNav from '../../components/GlobalNav.vue'
import FooterBar from '../../components/FooterBar.vue'
import { searchArticles } from '../../api/public.js'

const route = useRoute()
const keyword = ref('')
const results = ref([])
const loading = ref(true)

onMounted(async () => {
  keyword.value = route.query.q || ''
  if (!keyword.value) { loading.value = false; return }
  try {
    const res = await searchArticles(keyword.value)
    results.value = res.data
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.search-title {
  font-size: var(--text-display);
  padding: var(--space-lg) 0;
}
.results-list { display: flex; flex-direction: column; gap: var(--space-sm); }
.result-item {
  display: block;
  padding: var(--space-md);
  border: 1px solid var(--color-hairline);
  border-radius: var(--radius-sm);
  text-decoration: none;
  color: var(--color-ink);
  transition: border-color 0.2s;
}
.result-item:hover { border-color: var(--color-primary); }
.result-item h3 { font-size: var(--text-body); font-weight: var(--weight-strong); }
.result-meta { font-size: var(--text-caption); color: var(--color-ink-muted-48); margin-top: 4px; }
.loading, .empty { text-align: center; padding: var(--space-xxl); color: var(--color-ink-muted-48); }
</style>
```

---

## Phase 5: 管理后台前端

### Task 9: 管理后台页面

**Files:**
- Create: `client/src/api/admin.js`
- Create: `client/src/views/admin/LoginPage.vue`
- Create: `client/src/views/admin/DashboardPage.vue`
- Create: `client/src/views/admin/ArticleList.vue`
- Create: `client/src/components/admin/RichEditor.vue`
- Create: `client/src/views/admin/ArticleEditor.vue`
- Create: `client/src/views/admin/CategoryManager.vue`
- Create: `client/src/views/admin/TagManager.vue`

- [ ] **Step 1: 创建 client/src/api/admin.js**

```js
import request from './request.js'

export function login(data) {
  return request.post('/admin/login', data)
}

export function getAdminCategories() {
  return request.get('/admin/categories')
}

export function createCategory(data) {
  return request.post('/admin/categories', data)
}

export function updateCategory(id, data) {
  return request.put(`/admin/categories/${id}`, data)
}

export function deleteCategory(id) {
  return request.delete(`/admin/categories/${id}`)
}

export function getAdminArticles(params) {
  return request.get('/admin/articles', { params })
}

export function getAdminArticleById(id) {
  return request.get(`/admin/articles/${id}`)
}

export function createArticle(data) {
  return request.post('/admin/articles', data)
}

export function updateArticle(id, data) {
  return request.put(`/admin/articles/${id}`, data)
}

export function deleteArticle(id) {
  return request.delete(`/admin/articles/${id}`)
}

export function getTags() {
  return request.get('/admin/tags')
}

export function deleteTag(id) {
  return request.delete(`/admin/tags/${id}`)
}

export function uploadImage(formData) {
  return request.post('/admin/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}
```

- [ ] **Step 2: 创建 client/src/views/admin/LoginPage.vue**

```vue
<template>
  <div class="login-page">
    <div class="login-card">
      <h2>管理后台</h2>
      <el-form @submit.prevent="handleLogin" label-position="top">
        <el-form-item label="用户名">
          <el-input v-model="form.username" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="form.password" type="password" />
        </el-form-item>
        <el-button type="primary" native-type="submit" :loading="loading" style="width:100%">
          登录
        </el-button>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { login } from '../../api/admin.js'

const router = useRouter()
const loading = ref(false)
const form = reactive({ username: '', password: '' })

async function handleLogin() {
  loading.value = true
  try {
    const res = await login(form)
    localStorage.setItem('token', res.data.token)
    router.push('/admin')
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '登录失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-canvas-parchment);
}
.login-card {
  width: 360px;
  padding: var(--space-xl);
  background: var(--color-canvas);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-card);
}
.login-card h2 {
  text-align: center;
  margin-bottom: var(--space-lg);
  font-size: var(--text-display);
}
</style>
```

- [ ] **Step 3: 创建 client/src/views/admin/DashboardPage.vue**

```vue
<template>
  <el-container style="height:100vh;">
    <el-aside width="200px" style="background:#1d1d1f;color:#fff;">
      <h3 style="padding:20px;color:#fff;">📖 手册管理</h3>
      <el-menu
        :default-active="route.path"
        background-color="#1d1d1f"
        text-color="#fff"
        active-text-color="#2997ff"
        router
      >
        <el-menu-item index="/admin/articles">文章管理</el-menu-item>
        <el-menu-item index="/admin/categories">分类管理</el-menu-item>
        <el-menu-item index="/admin/tags">标签管理</el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header style="border-bottom:1px solid var(--color-hairline);display:flex;align-items:center;justify-content:flex-end;">
        <el-button type="text" @click="logout">退出登录</el-button>
      </el-header>
      <el-main>
        <router-view />
      </el-main>
    </el-container>
  </el-container>
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
```

- [ ] **Step 4: 创建 client/src/views/admin/ArticleList.vue**

```vue
<template>
  <div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
      <h2>文章管理</h2>
      <el-button type="primary" @click="$router.push('/admin/articles/create')">新建文章</el-button>
    </div>

    <div style="margin-bottom:16px;display:flex;gap:12px;">
      <el-select v-model="filterCat" placeholder="筛选分类" clearable @change="load">
        <el-option v-for="c in cats" :key="c.id" :label="c.title" :value="c.id" />
      </el-select>
      <el-select v-model="filterStatus" placeholder="筛选状态" clearable @change="load">
        <el-option label="草稿" :value="0" />
        <el-option label="已发布" :value="1" />
      </el-select>
    </div>

    <el-table :data="list" v-loading="loading" stripe>
      <el-table-column prop="title" label="标题" min-width="200" />
      <el-table-column prop="category_name" label="分类" width="120" />
      <el-table-column label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.status ? 'success' : 'info'" size="small">
            {{ row.status ? '已发布' : '草稿' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="version" label="版本" width="60" />
      <el-table-column prop="created_at" label="创建时间" width="160" />
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="$router.push(`/admin/articles/${row.id}/edit`)">编辑</el-button>
          <el-popconfirm title="确定删除？" @confirm="doDelete(row.id)">
            <template #reference>
              <el-button size="small" type="danger">删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <div style="margin-top:16px;display:flex;justify-content:center;">
      <el-pagination
        v-model:current-page="page"
        :page-size="pageSize"
        :total="total"
        layout="prev, pager, next"
        @current-change="load"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getAdminArticles, deleteArticle, getAdminCategories } from '../../api/admin.js'

const list = ref([])
const cats = ref([])
const loading = ref(false)
const total = ref(0)
const page = ref(1)
const pageSize = 20
const filterCat = ref(null)
const filterStatus = ref(null)

async function load() {
  loading.value = true
  try {
    const params = { page: page.value, page_size: pageSize }
    if (filterCat.value) params.category_id = filterCat.value
    if (filterStatus.value !== null && filterStatus.value !== '') params.status = filterStatus.value
    const res = await getAdminArticles(params)
    list.value = res.data.list
    total.value = res.data.total
  } catch (e) {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

async function doDelete(id) {
  try {
    await deleteArticle(id)
    ElMessage.success('已删除')
    load()
  } catch { ElMessage.error('删除失败') }
}

onMounted(async () => {
  try { cats.value = (await getAdminCategories()).data } catch {}
  load()
})
</script>
```

- [ ] **Step 5: 创建 client/src/components/admin/RichEditor.vue**

```vue
<template>
  <div class="rich-editor">
    <div class="editor-toolbar">
      <el-button-group size="small">
        <el-button @click="chain().toggleBold().run()" :type="editor?.isActive('bold') ? 'primary' : ''">B</el-button>
        <el-button @click="chain().toggleItalic().run()" :type="editor?.isActive('italic') ? 'primary' : ''">I</el-button>
        <el-button @click="chain().toggleHeading({ level: 2 }).run()" :type="editor?.isActive('heading', { level: 2 }) ? 'primary' : ''">H2</el-button>
        <el-button @click="chain().toggleHeading({ level: 3 }).run()" :type="editor?.isActive('heading', { level: 3 }) ? 'primary' : ''">H3</el-button>
        <el-button @click="chain().toggleBulletList().run()" :type="editor?.isActive('bulletList') ? 'primary' : ''">列表</el-button>
        <el-button @click="chain().toggleOrderedList().run()" :type="editor?.isActive('orderedList') ? 'primary' : ''">编号</el-button>
        <el-button @click="chain().toggleCodeBlock().run()" :type="editor?.isActive('codeBlock') ? 'primary' : ''">代码</el-button>
        <el-button @click="chain().toggleBlockquote().run()" :type="editor?.isActive('blockquote') ? 'primary' : ''">引用</el-button>
      </el-button-group>
      <el-button-group size="small" style="margin-left:8px;">
        <el-button @click="insertTable">表格</el-button>
        <el-button @click="insertImage">图片</el-button>
      </el-button-group>
    </div>
    <editor-content :editor="editor" class="editor-content" />
    <input type="file" ref="fileInput" accept="image/*" style="display:none" @change="onFileSelected" />
  </div>
</template>

<script setup>
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import Link from '@tiptap/extension-link'
import { watch, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { uploadImage } from '../../api/admin.js'

const props = defineProps({ modelValue: { type: String, default: '' } })
const emit = defineEmits(['update:modelValue'])
const fileInput = ref(null)

const editor = useEditor({
  content: props.modelValue,
  extensions: [
    StarterKit,
    Image,
    Table.configure({ resizable: true }),
    TableRow, TableCell, TableHeader,
    Link.configure({ openOnClick: false })
  ],
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.getHTML())
  }
})

watch(() => props.modelValue, (val) => {
  if (editor.value && val !== editor.value.getHTML()) {
    editor.value.commands.setContent(val, false)
  }
})

function chain() { return editor.value?.chain().focus() }

function insertTable() {
  chain()?.insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
}

function insertImage() {
  fileInput.value?.click()
}

async function onFileSelected(e) {
  const file = e.target.files?.[0]
  if (!file) return
  const formData = new FormData()
  formData.append('file', file)
  try {
    const res = await uploadImage(formData)
    chain()?.setImage({ src: res.data.url }).run()
  } catch {
    ElMessage.error('上传失败')
  }
  fileInput.value.value = ''
}
</script>

<style scoped>
.rich-editor { border: 1px solid var(--color-hairline); border-radius: var(--radius-sm); }
.editor-toolbar {
  padding: 8px;
  border-bottom: 1px solid var(--color-hairline);
  background: var(--color-canvas-parchment);
}
.editor-content {
  padding: 16px;
  min-height: 400px;
}
.editor-content :deep(.ProseMirror) {
  outline: none;
  min-height: 400px;
  font-size: var(--text-body);
  line-height: 1.47;
}
.editor-content :deep(.ProseMirror h2) { font-size: var(--text-display); font-weight: var(--weight-strong); margin: 16px 0 8px; }
.editor-content :deep(.ProseMirror h3) { font-size: var(--text-tagline); font-weight: var(--weight-strong); margin: 12px 0 6px; }
.editor-content :deep(.ProseMirror p) { margin-bottom: 12px; }
.editor-content :deep(.ProseMirror img) { max-width: 100%; border-radius: var(--radius-sm); }
.editor-content :deep(.ProseMirror pre) { background: var(--color-canvas-parchment); padding: 12px; border-radius: var(--radius-sm); }
.editor-content :deep(.ProseMirror table) { width: 100%; border-collapse: collapse; }
.editor-content :deep(.ProseMirror th), .editor-content :deep(.ProseMirror td) { border: 1px solid var(--color-hairline); padding: 8px; }
.editor-content :deep(.ProseMirror blockquote) { border-left: 3px solid var(--color-primary); padding-left: 16px; margin: 12px 0; }
</style>
```

- [ ] **Step 6: 创建 client/src/views/admin/ArticleEditor.vue**

```vue
<template>
  <div>
    <h2>{{ isEdit ? '编辑文章' : '新建文章' }}</h2>
    <el-form label-position="top" style="max-width:900px;">
      <el-form-item label="标题">
        <el-input v-model="form.title" placeholder="文章标题" />
      </el-form-item>
      <el-form-item label="分类">
        <el-select v-model="form.category_id" placeholder="选择分类">
          <el-option v-for="c in categories" :key="c.id" :label="c.title" :value="c.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="内容">
        <RichEditor v-model="form.content_html" />
      </el-form-item>
      <el-form-item label="标签（逗号分隔）">
        <el-input v-model="form.tagInput" placeholder="标签1, 标签2" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="save(1)" :loading="saving">发布</el-button>
        <el-button @click="save(0)" :loading="saving">存草稿</el-button>
        <el-button @click="$router.push('/admin/articles')">取消</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import RichEditor from '../../components/admin/RichEditor.vue'
import { getAdminCategories, getAdminArticleById, createArticle, updateArticle } from '../../api/admin.js'

const route = useRoute()
const router = useRouter()
const isEdit = computed(() => !!route.params.id)
const categories = ref([])
const saving = ref(false)

const form = ref({ title: '', category_id: null, content_html: '', tagInput: '' })

onMounted(async () => {
  try {
    categories.value = (await getAdminCategories()).data
  } catch {}
  if (isEdit.value) {
    try {
      const res = await getAdminArticleById(route.params.id)
      const a = res.data
      form.value = { title: a.title, category_id: a.category_id, content_html: a.content_html, tagInput: (a.tags || []).join(', ') }
    } catch { ElMessage.error('加载文章失败') }
  }
})

async function save(status) {
  saving.value = true
  const data = {
    title: form.value.title,
    category_id: form.value.category_id,
    content_html: form.value.content_html,
    tags: form.value.tagInput ? form.value.tagInput.split(/[,，]/).map(s => s.trim()).filter(Boolean) : [],
    status
  }
  try {
    if (isEdit.value) {
      await updateArticle(route.params.id, data)
    } else {
      await createArticle(data)
    }
    ElMessage.success('保存成功')
    router.push('/admin/articles')
  } catch {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}
</script>
```

- [ ] **Step 7: 创建 client/src/views/admin/CategoryManager.vue**

```vue
<template>
  <div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
      <h2>分类管理</h2>
      <el-button type="primary" @click="showDialog()">新建分类</el-button>
    </div>

    <el-table :data="categories" v-loading="loading" stripe row-key="id">
      <el-table-column prop="icon" label="图标" width="60" />
      <el-table-column prop="title" label="名称" />
      <el-table-column prop="description" label="描述" />
      <el-table-column prop="sort" label="排序" width="80" />
      <el-table-column label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.status ? 'success' : 'info'" size="small">
            {{ row.status ? '显示' : '隐藏' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="160">
        <template #default="{ row }">
          <el-button size="small" @click="showDialog(row)">编辑</el-button>
          <el-popconfirm title="确定删除？" @confirm="doDelete(row.id)">
            <template #reference>
              <el-button size="small" type="danger">删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialog.visible" :title="dialog.isEdit ? '编辑分类' : '新建分类'" width="500px">
      <el-form label-position="top">
        <el-form-item label="名称">
          <el-input v-model="dialog.form.title" />
        </el-form-item>
        <el-form-item label="图标">
          <el-input v-model="dialog.form.icon" placeholder="📁" style="width:100px" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="dialog.form.description" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="dialog.form.sort" :min="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialog.visible = false">取消</el-button>
        <el-button type="primary" @click="saveCategory" :loading="dialog.loading">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getAdminCategories, createCategory, updateCategory, deleteCategory } from '../../api/admin.js'

const categories = ref([])
const loading = ref(false)

const dialog = reactive({
  visible: false,
  isEdit: false,
  loading: false,
  form: { title: '', icon: '📁', description: '', sort: 0 }
})

async function load() {
  loading.value = true
  try {
    categories.value = (await getAdminCategories()).data
  } catch { ElMessage.error('加载失败') }
  finally { loading.value = false }
}

function showDialog(row) {
  if (row) {
    dialog.isEdit = true
    dialog.form = { ...row }
  } else {
    dialog.isEdit = false
    dialog.form = { title: '', icon: '📁', description: '', sort: 0 }
  }
  dialog.visible = true
}

async function saveCategory() {
  dialog.loading = true
  try {
    if (dialog.isEdit) {
      await updateCategory(dialog.form.id, dialog.form)
    } else {
      await createCategory(dialog.form)
    }
    ElMessage.success('保存成功')
    dialog.visible = false
    load()
  } catch { ElMessage.error('保存失败') }
  finally { dialog.loading = false }
}

async function doDelete(id) {
  try {
    await deleteCategory(id)
    ElMessage.success('已删除')
    load()
  } catch { ElMessage.error('删除失败') }
}

onMounted(load)
</script>
```

- [ ] **Step 8: 创建 client/src/views/admin/TagManager.vue**

```vue
<template>
  <div>
    <h2 style="margin-bottom:20px;">标签管理</h2>
    <el-table :data="tags" v-loading="loading">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="标签名称" />
      <el-table-column label="操作" width="100">
        <template #default="{ row }">
          <el-popconfirm title="确定删除？" @confirm="doDelete(row.id)">
            <template #reference>
              <el-button size="small" type="danger">删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getTags, deleteTag } from '../../api/admin.js'

const tags = ref([])
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    tags.value = (await getTags()).data
  } catch { ElMessage.error('加载失败') }
  finally { loading.value = false }
}

async function doDelete(id) {
  try {
    await deleteTag(id)
    ElMessage.success('已删除')
    load()
  } catch { ElMessage.error('删除失败') }
}

onMounted(load)
</script>
```

---

## Phase 6: 内容迁移

### Task 10: 种子数据 + 内容重构

**Files:**
- Create: `server/src/seed.sql`

- [ ] **Step 1: 创建 server/src/seed.sql**

```sql
-- Web 端模块
INSERT INTO categories (id, title, icon, description, sort, status) VALUES
(1, '房源管理', '🏘️', '楼宇管理、房屋管理、二维码管理', 1, 1),
(2, '账号管理', '👤', '租户信息、房东信息、到期名单、用户账号', 2, 1),
(3, '门禁管理', '🔐', '门禁设备、门禁卡管理', 3, 1),
(4, '运营管理', '📊', '事件日志、门禁套餐、监管账号', 4, 1),
(5, '财务管理', '💰', '资金流水、收款信息、退款记录、结算记录', 5, 1),
(6, '系统设置', '⚙️', '部门管理、角色管理、员工账号、企业信息', 6, 1),
(7, '小程序端', '📱', '租户端和房东端的小程序操作指南', 7, 1);

-- 子分类
INSERT INTO categories (title, icon, description, sort, parent_id, status) VALUES
('楼宇管理', '🏢', '楼宇的新增、删除、编辑', 1, 1, 1),
('房屋管理', '🏠', '房源管理', 2, 1, 1),
('租户信息', '👥', '租户信息管理', 1, 2, 1),
('房东信息', '👤', '房东信息管理', 2, 2, 1),
('门禁设备', '📡', '门禁设备管理', 1, 3, 1),
('门禁卡', '💳', '门禁卡管理', 2, 3, 1),
('租户端', '👤', '租户小程序操作', 1, 7, 1),
('房东端', '👤', '房东小程序操作', 2, 7, 1);
```

---

## Phase 7: Docker + 部署

### Task 11: Docker 配置

**Files:**
- Create: `docker-compose.yml`
- Create: `Dockerfile`
- Create: `server/.dockerignore`
- Create: `client/.dockerignore`

- [ ] **Step 1: 创建 docker-compose.yml**

```yaml
version: '3.8'
services:
  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: root123
      MYSQL_DATABASE: usermanual
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
      - ./server/src/schema.sql:/docker-entrypoint-initdb.d/01-schema.sql
      - ./server/src/seed.sql:/docker-entrypoint-initdb.d/02-seed.sql
    command: --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci

  server:
    build:
      context: .
      dockerfile: Dockerfile
      target: server
    ports:
      - "3001:3001"
    depends_on:
      - db
    environment:
      DB_HOST: db
      DB_PASSWORD: root123
    volumes:
      - uploads:/app/server/uploads

  client:
    build:
      context: .
      dockerfile: Dockerfile
      target: client
    ports:
      - "80:80"
    depends_on:
      - server

volumes:
  mysql_data:
  uploads:
```

- [ ] **Step 2: 创建 Dockerfile**

```dockerfile
# Server stage
FROM node:20-alpine AS server
WORKDIR /app/server
COPY server/package.json ./
RUN npm install --production
COPY server/src ./src
EXPOSE 3001
CMD ["node", "src/index.js"]

# Client build stage
FROM node:20-alpine AS client-build
WORKDIR /app/client
COPY client/package.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Client nginx stage
FROM nginx:alpine AS client
COPY --from=client-build /app/client/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

- [ ] **Step 3: 创建 nginx.conf**

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://server:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 范围检查

对照 spec 逐项确认：

| Spec 要求 | 对应任务 |
|-----------|---------|
| 数据库分类表、文章表、标签表 | Task 1 Step 4 |
| Apple 设计规范适配（色彩/字体/间距/圆角） | Task 3 |
| 用户端首页卡片式布局 | Task 8 Step 1 |
| 用户端详情页 + 图文混排 | Task 8 Step 2 |
| 用户端搜索 | Task 8 Step 3 |
| 管理后台文章列表 CRUD | Task 9 Step 4 |
| 管理后台富文本编辑器（Tiptap） | Task 9 Step 5-6 |
| 管理后台分类管理 | Task 9 Step 7 |
| 管理后台标签管理 | Task 9 Step 8 |
| 管理后台登录认证 | Task 9 Step 2 |
| 公开 API | Task 4 |
| 管理 API | Task 5 |
| AI 知识库 API | Task 6 |
| 图片上传 | Task 5 Step 2 |
| 内容重构（分类结构） | Task 10 |
| Docker 部署 | Task 11 |
