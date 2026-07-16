import { api } from "./index";

export const platformApi = {
  listTenants(params = {}) {
    return api.get("/platform/tenants", { params });
  },
  updateTenant(id, payload) {
    return api.put(`/platform/tenants/${id}`, payload);
  },
  setTenantStatus(id, status) {
    return api.put(`/platform/tenants/${id}/status`, { status });
  },
  deleteTenant(id) {
    return api.delete(`/platform/tenants/${id}`);
  },
  approveTenant(id) {
    return api.post(`/platform/tenants/${id}/approve`);
  },
  rejectTenant(id) {
    return api.post(`/platform/tenants/${id}/reject`);
  },
  miniappConfig(id) {
    return api.get(`/platform/tenants/${id}/miniapp-config`);
  },
  saveMiniappConfig(id, payload) {
    return api.put(`/platform/tenants/${id}/miniapp-config`, payload);
  },
  setMiniappConfigStatus(id, status) {
    return api.put(`/platform/tenants/${id}/miniapp-config/status`, { status });
  },
};
