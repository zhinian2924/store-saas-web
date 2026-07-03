import { api } from './index'

export const orderApi = {
  listOrders() {
    return api.get('/store/orders')
  },
  createOrder(payload) {
    return api.post('/store/orders', payload)
  },
  listItems(orderId) {
    return api.get(`/store/orders/${orderId}/items`)
  }
}
