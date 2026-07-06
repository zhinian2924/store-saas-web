import { api } from './index'

export const platformApi = {
  listTenants(params = {}) {
    return api.get('/platform/tenants', { params })
  },
  approveTenant(id) {
    return api.post(`/platform/tenants/${id}/approve`)
  },
  rejectTenant(id) {
    return api.post(`/platform/tenants/${id}/reject`)
  }
}
