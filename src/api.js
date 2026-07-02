import axios from 'axios'

export const api = axios.create({
  baseURL: '/api',
  timeout: 10000
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('store_saas_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use((response) => {
  const body = response.data
  if (body.code !== 0) {
    return Promise.reject(new Error(body.message || '请求失败'))
  }
  return body.data
})
