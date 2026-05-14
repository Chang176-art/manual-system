import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { query } from '../db.js'
import { success, fail } from '../utils/response.js'
import { requireAuth, generateToken } from '../middleware/auth.js'
import { htmlToText } from '../utils/htmlToText.js'
import { uploadImage } from '../controllers/upload.js'

const router = Router()

// Login (no auth required)
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

// All routes below require auth
router.use(requireAuth)

// Categories
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

// Article detail (admin, includes drafts)
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

// Articles list
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
        let [existing] = await query('SELECT id FROM tags WHERE name = ?', [name])
        let tagId
        if (existing) { tagId = existing.id }
        else { const t = await query('INSERT INTO tags (name) VALUES (?)', [name]); tagId = t.insertId }
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
        let [tag] = await query('SELECT id FROM tags WHERE name = ?', [name])
        let tagId
        if (tag) { tagId = tag.id }
        else { const t = await query('INSERT INTO tags (name) VALUES (?)', [name]); tagId = t.insertId }
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

// Tags
router.get('/tags', async (req, res, next) => {
  try {
    const rows = await query(
      `SELECT t.*, (SELECT COUNT(*) FROM article_tags at WHERE at.tag_id = t.id) as article_count
       FROM tags t ORDER BY t.id DESC`
    )
    success(res, rows)
  } catch (err) { next(err) }
})

router.post('/tags', async (req, res, next) => {
  try {
    const { name, color, description } = req.body
    if (!name) return fail(res, '标签名称不能为空', -1)
    const r = await query('INSERT INTO tags (name, color, description) VALUES (?, ?, ?)',
      [name, color || '#3b89ff', description || ''])
    success(res, { id: r.insertId })
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return fail(res, '标签已存在', -1)
    next(err)
  }
})

router.delete('/tags/:id', async (req, res, next) => {
  try {
    await query('DELETE FROM tags WHERE id = ?', [req.params.id])
    success(res)
  } catch (err) { next(err) }
})

// Image upload
router.post('/upload', uploadImage)

export default router
