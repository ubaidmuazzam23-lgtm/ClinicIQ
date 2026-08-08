// ─────────────────────────────────────────────────────────────
// FILE: clinicaliq/frontend/src/lib/axios.ts
// ─────────────────────────────────────────────────────────────

import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
})

// ── Auto-attach JWT token to every request ────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ciq_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Auto-redirect on 401 ──────────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('ciq_token')
      localStorage.removeItem('ciq_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api