import { api } from './index'

export const productApi = {
  listCategories() {
    return api.get('/store/categories')
  },
  createCategory(payload) {
    return api.post('/store/categories', payload)
  },
  listProducts() {
    return api.get('/store/products')
  },
  createProduct(payload) {
    return api.post('/store/products', payload)
  }
}
