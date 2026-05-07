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
    const [{ total }] = await query(countSql + whereClause, params)
    const rows = await query(sql + whereClause + ' ORDER BY sort ASC, id DESC LIMIT ? OFFSET ?', [...params, Number(page_size), offset])
    success(res, { list: rows, total, page: Number(page), page_size: Number(page_size) })
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
      `SELECT t.id, t.name FROM tags t JOIN article_tags at ON t.id = at.tag_id WHERE at.article_id = ?`,
      [req.params.id]
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
