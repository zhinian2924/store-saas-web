import { api } from './index'

export const authApi = {
  login(payload) {
    return api.post('/auth/store/login', payload)
  },
  platformLogin(payload) {
    return api.post('/auth/platform/login', payload)
  },
  sendStoreSmsCode(payload) {
    return api.post('/auth/store/sms-code', payload)
  },
  register(payload) {
    return api.post('/auth/tenant/register', payload)
  },
  logout() {
    return api.post('/auth/logout')
  }
}
