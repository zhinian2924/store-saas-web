import { api } from './index'

export const storeApi = {
  profile() {
    return api.get('/store/profile')
  },
  updateProfile(payload) {
    return api.put('/store/profile', payload)
  }
}
