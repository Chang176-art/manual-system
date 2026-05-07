# 用户手册系统设计文档

## 概述

为出租屋管理系统构建一个独立部署的用户手册系统，具备：
- 用户端：扫码/访问网页查看手册内容
- 管理端：后台对手册内容进行富文本编辑、新增、管理
- AI 知识库：内容结构化输出，供后续智能客服使用

## 系统架构

```
管理后台 (Vue + Node.js)  ──→  数据库 (SQL)
                                      │
                     ┌────────────────┼────────────────┐
                     │                │                │
               用户手册网站         AI 知识库        静态资源
              (扫码/直接访问)      (结构化 API)    (图片/附件)
```

三部分独立部署：
- **管理后台**：Vue 前端 + Node.js API，用于编辑管理手册内容
- **用户手册网站**：Vue 前端，响应式设计，展示手册内容给最终用户
- **AI 知识库接口**：RESTful API，输出结构化纯文本内容供智能客服消费

## 数据库设计

### 分类表 (categories)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT PK | 自增主键 |
| title | VARCHAR(100) | 分类名称，如"房源管理" |
| icon | VARCHAR(50) | 图标标识 |
| description | VARCHAR(500) | 分类简介 |
| sort | INT | 排序权重 |
| parent_id | INT NULL | 父分类 ID，支持无限层级 |
| status | TINYINT | 0-隐藏 1-显示 |
| created_at | DATETIME | |
| updated_at | DATETIME | |

### 文章表 (articles)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT PK | 自增主键 |
| category_id | INT FK | 所属分类 |
| title | VARCHAR(200) | 文章标题 |
| content_html | TEXT | 富文本 HTML 内容（前端展示用） |
| content_text | LONGTEXT | 纯文本内容（AI 知识库用） |
| cover_image | VARCHAR(500) | 封面图 URL |
| sort | INT | 排序权重 |
| status | TINYINT | 0-草稿 1-已发布 |
| version | INT | 版本号 |
| created_at | DATETIME | |
| updated_at | DATETIME | |

### 标签表 (tags)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT PK | 自增主键 |
| name | VARCHAR(50) | 标签名称 |

### 文章标签关联表 (article_tags)

| 字段 | 类型 | 说明 |
|------|------|------|
| article_id | INT FK | 文章 ID |
| tag_id | INT FK | 标签 ID |

## 视觉设计语言（基于 Apple 设计规范）

沿用 [DESIGN.md](../DESIGN.md) 定义的 Apple 风格设计语言，针对文档阅读场景做适配：

### 色彩系统

| Token | 色值 | 文档场景用途 |
|-------|------|-------------|
| `primary` | #0066cc | 链接、导航高亮、按钮、焦点指示 |
| `primary-focus` | #0071e3 | 按钮悬停/聚焦态 |
| `primary-on-dark` | #2997ff | 深色背景上的链接 |
| `ink` / `body` | #1d1d1f | 正文文字 |
| `body-muted` | #cccccc | 深色背景上的辅助文字 |
| `ink-muted-48` | #7a7a7a | 禁用文字、脚注 |
| `canvas` | #ffffff | 页面主背景 |
| `canvas-parchment` | #f5f5f7 | 卡片背景、代码块背景、侧边栏背景 |
| `surface-pearl` | #fafafc | 搜索框背景、次级按钮背景 |
| `hairline` | #e0e0e0 | 分割线、表格边框 |
| `surface-black` | #000000 | 页脚深色背景 |

### 字体系统

| Token | 尺寸 | 字重 | 行高 | 文档用途 |
|-------|------|------|------|---------|
| hero-display | 40px | 600 | 1.1 | 文章标题（H1） |
| display-md | 28px | 600 | 1.47 | 章节标题（H2） |
| tagline | 21px | 600 | 1.19 | 小节标题（H3） |
| body | 17px | 400 | 1.47 | 正文（Apple 标志性的 17px 阅读字号） |
| body-strong | 17px | 600 | 1.24 | 强调文本 |
| caption | 14px | 400 | 1.43 | 图片说明、元信息 |
| caption-strong | 14px | 600 | 1.29 | 分类卡片标题 |
| fine-print | 12px | 400 | 1.0 | 页脚文字 |
| button-utility | 14px | 400 | 1.29 | 按钮文字 |
| nav-link | 12px | 400 | 1.0 | 导航菜单项 |

替代字体：非 Apple 平台使用 **Inter**（Google Fonts 可获取），display 尺寸下调 letter-spacing -0.01em。

### 间距系统

- **基础单位**：8px
- 页面内容区最大宽度：~980px（保证阅读体验）
- 分类卡片内边距：24px
- 文章段落间距：17px（与正文行高一致）
- 大区块间距：48px

### 圆角系统

| Token | 值 | 用途 |
|-------|-----|------|
| `rounded.none` | 0 | 全幅元素 |
| `rounded.sm` | 8px | 分类卡片、代码块 |
| `rounded.md` | 11px | 搜索框、次级按钮 |
| `rounded.lg` | 18px | 图片容器 |
| `rounded.pill` | 9999px | 主按钮 |

### 组件适配

原文 Apple 组件 → 文档场景映射：

| 原组件 | 适配后 | 说明 |
|--------|--------|------|
| `product-tile-light` | **分类卡片** | 首页展示手册分类，保留纯净白底 + 14px caption-strong 标题 |
| `store-utility-card` | **文章卡片** | 搜索结果/相关文章列表，保留 hairline 边框 + lg 圆角 |
| `global-nav` | **站点顶栏** | Logo + 搜索框，纯黑底或白色底 |
| `sub-nav-frosted` | **侧边目录** | 文章左侧层级目录，毛玻璃效果可选 |
| `search-input` | **搜索输入框** | pill 形状，17px 正文大小 |
| `button-primary` | **主按钮** | "编辑此页"、"返回首页"等操作 |
| `button-dark-utility` | **工具按钮** | 深色工具按钮 |
| `footer` | **页脚** | parchment 背景 + dense-link 列 |

### 新增文档专用组件

- **article-content** — 文章正文渲染区
  - H2/H3 标题样式（display-md / tagline 字号）
  - 正文 17px 舒适阅读
  - 图片居中 + caption 说明
  - 表格：hairline 边框，parchment 表头
  - 代码块：parchment 背景，sm 圆角，等宽字体
  - 提示块：蓝色左边框 + parchment 背景

- **breadcrumb** — 面包屑导航，caption 字号，primary 蓝色链接

- **table-of-contents** — 文章内目录导航，悬停跟随阅读位置高亮

- **category-card** — 首页分类卡片
  - canvas 背景，hairline 边框，sm 圆角
  - 图标 + 标题 + 文章数
  - 悬停时轻微上移 + 阴影（唯一使用阴影的组件）

### 视觉原则（文档场景版）

- **内容优先** — UI 退让，让文字和截图成为视觉主体
- **单一蓝色强调** — #0066cc 仅用于交互元素（链接、按钮、导航高亮）
- **无装饰性阴影** — 仅分类卡片悬停时使用单一阴影
- **色彩本身就是分割线** — 白底 ↔ parchment 底交替形成区域分隔
- **正文 17px** — 保持 Apple 独有的阅读节奏

## 前端页面设计

### 用户端 (用户手册网站)

**首页**：卡片式布局，每个分类一张卡片，展示分类图标、名称、文章数量。
- 顶部搜索栏（按标题/标签搜索）
- 卡片网格 2-3 列，响应式
- 扫码直接进入首页
- 页脚显示版权信息

**详情页**：左侧层级目录树（或面包屑），右侧文章内容。
- 支持图文混排渲染
- 标签展示
- 上下篇文章导航
- 目录高亮当前阅读位置
- 文章内锚点导航

### 管理后台

**文章列表页**：表格展示，支持按分类筛选、搜索、排序。
- 批量操作（发布/下架/删除）
- 拖拽排序

**编辑器页**：富文本编辑器，支持：
- 文字格式化（加粗、斜体、标题、列表等）
- 图片上传
- 表格
- 代码块
- 提示块（info/warning/tip）
- 自动生成 content_text（从 HTML 剥离标签供 AI 消费）

**分类管理页**：树形结构管理分类，支持：
- 新增/编辑/删除/排序
- 拖拽调整层级
- 图标选择

## API 设计

### 公开接口（用户手册网站调用）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/public/categories | 获取所有分类（含文章数） |
| GET | /api/public/articles | 获取文章列表（支持分类筛选） |
| GET | /api/public/articles/:id | 获取文章详情 |
| GET | /api/public/search?q= | 搜索文章 |

### 知识库接口（AI 客服消费）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/ai/articles | 获取所有已发布文章纯文本 |
| GET | /api/ai/articles/:id | 获取单篇文章纯文本 |
| GET | /api/ai/categories | 获取分类结构 |

### 管理接口（后台调用，需认证）

| 方法 | 路径 | 说明 |
|------|------|------|
| CRUD | /api/admin/categories | 分类管理 |
| CRUD | /api/admin/articles | 文章管理 |
| CRUD | /api/admin/tags | 标签管理 |
| POST | /api/admin/upload | 图片上传 |

## 技术选型

- **前端框架**：Vue 3 + Vite
- **UI 组件库**：Element Plus（适配 Apple 设计规范）
- **富文本编辑器**：Tiptap（Vue 原生，扩展丰富）
- **后端框架**：Node.js + Express
- **数据库**：MySQL
- **部署**：Docker 容器化

## 内容重构建议

现有 PDF 内容按以下结构重构（Web 端 + 小程序端分离）：

### Web 端模块
1. 房源管理 → 楼宇管理 / 房屋管理 / 二维码
2. 账号管理 → 租户 / 房东 / 到期名单 / 用户账号
3. 门禁管理 → 设备 / 门禁卡
4. 运营管理 → 事件日志 / 套餐 / 监管账号
5. 财务管理 → 流水 / 收款 / 减免 / 退款 / 结算
6. 系统设置 → 部门 / 角色 / 员工 / 企业信息

### 小程序端模块
1. 租户端 → 认证 / 门禁购买 / 退租 / 同住人 / 访客
2. 房东端 → 认证 / 审核租户 / 门禁卡 / 退租 / 访客码
