import { api } from './index'

export const inventoryApi = {
  adjust(payload) {
    return api.post('/store/inventory/adjust', payload)
  },
  listFlows() {
    return api.get('/store/inventory/flows')
  }
}
