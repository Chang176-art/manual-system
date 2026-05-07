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
