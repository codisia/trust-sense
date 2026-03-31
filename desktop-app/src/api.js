/**
 * API Client for Desktop App
 * Handles all communication with backend API
 */

import axios from 'axios'

// API Configuration
const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:8000'

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: false,
  timeout: 30000,
})

// Store for token management
let authToken = null

// Request interceptor - attach token
api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`
  }
  return config
})

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      authToken = null
      // Notify of logout
      if (window.electronAPI?.onUnauthorized) {
        window.electronAPI.onUnauthorized()
      }
    }
    return Promise.reject(error)
  }
)

/**
 * Set authentication token
 */
export function setAuthToken(token) {
  authToken = token
  if (token) {
    api.defaults.headers.Authorization = `Bearer ${token}`
  }
}

/**
 * Get current auth token
 */
export function getAuthToken() {
  return authToken
}

/**
 * Clear authentication
 */
export function clearAuth() {
  authToken = null
  delete api.defaults.headers.Authorization
}

// ==========================================
// Authentication APIs
// ==========================================
export const authAPI = {
  login: (email, password) => 
    api.post('/auth/login', { email, password }),
  
  register: (email, username, password) => 
    api.post('/auth/register', { email, username, password }),
  
  logout: () => {
    clearAuth()
    return Promise.resolve()
  }
}

// ==========================================
// Text Analysis APIs
// ==========================================
export const analysisAPI = {
  analyzeText: (text) => 
    api.post('/api/analyze-text', { text }),
  
  analyzeUrl: (url) => 
    api.post('/api/analyze-url', { url }),
  
  analyzeTextBatch: (texts) => 
    api.post('/api/analyze-text-batch', { texts }),
  
  getHistory: (params = {}) => {
    const urlParams = new URLSearchParams()
    if (params.skip != null) urlParams.set('skip', params.skip)
    if (params.limit != null) urlParams.set('limit', params.limit)
    if (params.risk_level) urlParams.set('risk_level', params.risk_level)
    if (params.min_trust_score != null) urlParams.set('min_trust_score', params.min_trust_score)
    if (params.from_date) urlParams.set('from_date', params.from_date)
    if (params.to_date) urlParams.set('to_date', params.to_date)
    return api.get(`/api/analysis-history?${urlParams.toString()}`)
  },
  
  getAnalysis: (id) => 
    api.get(`/api/analysis/${id}`),
  
  getStats: () => 
    api.get('/api/stats'),
  
  getStatsSummary: () => 
    api.get('/api/stats/summary'),
  
  deleteAnalysis: (id) => 
    api.delete(`/api/analysis/${id}`),
  
  exportHistoryCSV: (params = {}) => {
    const urlParams = new URLSearchParams()
    if (params.risk_level) urlParams.set('risk_level', params.risk_level)
    if (params.min_trust_score != null) urlParams.set('min_trust_score', params.min_trust_score)
    if (params.from_date) urlParams.set('from_date', params.from_date)
    if (params.to_date) urlParams.set('to_date', params.to_date)
    return api.get(`/api/export/history?${urlParams.toString()}`, { responseType: 'blob' })
  }
}

// ==========================================
// Media Analysis APIs
// ==========================================
export const mediaAPI = {
  analyzeAudio: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/api/analyze-audio', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  
  analyzeVideo: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/api/analyze-video', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  }
}

// ==========================================
// User APIs
// ==========================================
export const userAPI = {
  getProfile: () => 
    api.get('/api/user/profile'),
  
  getPreferences: () => 
    api.get('/api/user/preferences'),
  
  updatePreferences: (prefs) => 
    api.put('/api/user/preferences', prefs),
  
  updateLanguage: (lang) => 
    api.put('/api/user/preferences', { language: lang })
}

// ==========================================
// News APIs
// ==========================================
export const newsAPI = {
  getLatestArticles: (limit = 20) => 
    api.get(`/api/news/latest?limit=${limit}`),
  
  getVideos: (limit = 20) => 
    api.get(`/api/news/videos?limit=${limit}`),
  
  runPipeline: (params) => 
    api.post('/api/news/run', params)
}

// ==========================================
// Chatbot APIs
// ==========================================
export const chatbotAPI = {
  sendMessage: (message) => 
    api.post('/api/chatbot/chat', { message }),
  
  analyzeMultiple: (text) => 
    api.post('/api/chatbot/analyze-multi', { message: text }),
  
  getHealth: () => 
    api.get('/api/chatbot/health')
}

export default api
