import { api } from './index'

export const authApi = {
  login(payload) {
    return api.post('/auth/store/login', payload)
  },
  register(payload) {
    return api.post('/auth/tenant/register', payload)
  },
  logout() {
    return api.post('/auth/logout')
  }
}
