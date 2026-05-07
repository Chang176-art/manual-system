import { Router } from 'express'
import { query } from '../db.js'
import { success } from '../utils/response.js'

const router = Router()

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

router.get('/categories', async (req, res, next) => {
  try {
    const categories = await query('SELECT id, title, icon, description FROM categories WHERE status = 1 ORDER BY sort ASC')
    const result = []
    for (const cat of categories) {
      const articles = await query(
        `SELECT id, title FROM articles WHERE category_id = ? AND status = 1 ORDER BY sort ASC`, [cat.id]
      )
      result.push({ ...cat, articles })
    }
    success(res, result)
  } catch (err) { next(err) }
})

export default router
