import { api } from './index'

export const staffApi = {
  list() {
    return api.get('/store/staff')
  },
  create(payload) {
    return api.post('/store/staff', payload)
  },
  update(id, payload) {
    return api.put(`/store/staff/${id}`, payload)
  },
  setStatus(id, status) {
    return api.put(`/store/staff/${id}/status`, { status })
  }
}
