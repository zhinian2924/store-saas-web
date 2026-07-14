import { api } from './index'

export const productApi = {
  listCategories() {
    return api.get('/store/categories')
  },
  createCategory(payload) {
    return api.post('/store/categories', payload)
  },
  setCategoryStatus(id, status) {
    return api.put(`/store/categories/${id}/status`, { status })
  },
  listProducts() {
    return api.get('/store/products')
  },
  createProduct(payload) {
    return api.post('/store/products', payload)
  },
  updateProduct(id, payload) {
    return api.put(`/store/products/${id}`, payload)
  },
  uploadImage(file) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('scene', 'product')
    return api.post('/store/media/images', formData)
  },
  setProductStatus(id, status) {
    return api.put(`/store/products/${id}/status`, { status })
  },
  deleteProduct(id) {
    return api.delete(`/store/products/${id}`)
  }
}
