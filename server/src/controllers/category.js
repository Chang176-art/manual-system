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
