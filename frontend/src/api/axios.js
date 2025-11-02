import axios from 'axios'

// 基本 axios 實例，會自動從 localStorage 取 token
const api = axios.create({
  baseURL: 'http://localhost:8000' // <-- CORRECTED: Point to the backend server
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api
