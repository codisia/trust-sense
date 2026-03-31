import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: false,
})

// Attach JWT token to every request if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ts_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-logout on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('ts_token')
      localStorage.removeItem('ts_user')
    }
    return Promise.reject(err)
  }
)

export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (email, username, password) => api.post('/auth/register', { email, username, password }),
}

export const analysisAPI = {
  analyzeText: (text) => api.post('/api/analyze-text', { text }),
  analyzeTextBatch: (texts) => api.post('/api/analyze-text-batch', { texts }),
  getHistory: (params = {}) => {
    const p = new URLSearchParams()
    if (params.skip != null) p.set('skip', params.skip)
    if (params.limit != null) p.set('limit', params.limit)
    if (params.risk_level) p.set('risk_level', params.risk_level)
    if (params.min_trust_score != null) p.set('min_trust_score', params.min_trust_score)
    if (params.from_date) p.set('from_date', params.from_date)
    if (params.to_date) p.set('to_date', params.to_date)
    return api.get(`/api/analysis-history?${p.toString()}`)
  },
  getHistoryExportCSV: (params = {}) => {
    const p = new URLSearchParams()
    if (params.risk_level) p.set('risk_level', params.risk_level)
    if (params.min_trust_score != null) p.set('min_trust_score', params.min_trust_score)
    if (params.from_date) p.set('from_date', params.from_date)
    if (params.to_date) p.set('to_date', params.to_date)
    return api.get(`/api/export/history?${p.toString()}`, { responseType: 'blob' })
  },
  getAnalysis: (id) => api.get(`/api/analysis/${id}`),
  getStats: () => api.get('/api/stats'),
  getStatsSummary: () => api.get('/api/stats/summary'),
}

export const mediaAPI = {
  analyzeAudio: (file) => {
    const form = new FormData()
    form.append('file', file)
    return api.post('/api/analyze-audio', form, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  analyzeVideo: (file) => {
    const form = new FormData()
    form.append('file', file)
    return api.post('/api/analyze-video', form, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
}

export const chatbotAPI = {
  sendMessage: (message) => api.post('/api/chatbot/chat', { message }),
  analyzeMultiple: (text) => api.post('/api/chatbot/analyze-multi', { message: text }),
  getHealth: () => api.get('/api/chatbot/health'),
}

export const userAPI = {
  getPreferences: () => api.get('/api/user/preferences'),
  updateLanguage: (lang) => api.put('/api/user/preferences', { language: lang }),
}

export const newsAPI = {
  runPipeline: (params) => api.post('/api/news/run', params),
  getLatestArticles: (limit = 20) => api.get(`/api/news/latest?limit=${limit}`),
  getVideos: (limit = 20) => api.get(`/api/news/videos?limit=${limit}`),
}

export const paymentAPI = {
  createLocalPayment: (amount, currency) => api.post('/api/payments/local', { amount, currency }),
  createIntlPayment: (amount, currency) => api.post('/api/payments/international', { amount, currency }),
}

export default api
