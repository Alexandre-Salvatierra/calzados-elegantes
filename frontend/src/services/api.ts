import axios from 'axios'

// En desarrollo: Vite hace proxy de /api → localhost:3000
// En producción (Electron/Railway): usa la URL del backend desplegado
const BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api'

const api = axios.create({ baseURL: BASE_URL })

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('ce_token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('ce_token')
      localStorage.removeItem('ce_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
