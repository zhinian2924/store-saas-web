import axios from 'axios'
import { ElMessage } from 'element-plus'

export const TOKEN_KEY = 'store_saas_token'
export const USERNAME_KEY = 'store_saas_username'
export const ACCOUNT_TYPE_KEY = 'store_saas_account_type'

export const api = axios.create({
  baseURL: '/api',
  timeout: 10000
})

// 请求拦截器
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    const body = response.data
    if (body && body.code !== 0) {
      return Promise.reject(new Error(body.message || '请求失败'))
    }
    return body?.data
  },
  (error) => {
    const message = error.response?.data?.message || error.message || '网络异常'
    return Promise.reject(new Error(message))
  }
)

export function showApiError(error) {
  ElMessage.error(error?.message || '操作失败')
}

export { authApi } from './auth'
export { platformApi } from './platform'
export { productApi } from './product'
export { inventoryApi } from './inventory'
export { orderApi } from './order'
export { paymentApi } from './payment'
