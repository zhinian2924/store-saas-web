import { api } from './index'

export const paymentApi = {
  mockPay(orderId) {
    return api.post(`/store/payments/mock/${orderId}`)
  }
}
