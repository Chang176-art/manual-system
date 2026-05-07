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
