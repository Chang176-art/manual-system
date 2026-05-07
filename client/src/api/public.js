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
