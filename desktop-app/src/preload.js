/**
 * Preload Script - IPC Bridge
 * Exposes safe API to renderer process
 */

const { contextBridge, ipcRenderer } = require('electron')

// Expose secure API to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // ==========================================
  // Analysis Functions
  // ==========================================
  analyzeText: (text) => ipcRenderer.invoke('analyze-text', { text }),
  analyzeUrl: (url) => ipcRenderer.invoke('analyze-url', { url }),
  analyzeAudio: (filePath, fileName) => ipcRenderer.invoke('analyze-audio', { filePath, fileName }),
  analyzeVideo: (filePath, fileName) => ipcRenderer.invoke('analyze-video', { filePath, fileName }),
  analyzeImage: (base64, description) => ipcRenderer.invoke('analyze-image', { base64, description }),
  
  // ==========================================
  // History Functions
  // ==========================================
  getHistory: () => ipcRenderer.invoke('get-history'),
  getHistoryWithFilters: (filters) => ipcRenderer.invoke('get-history-filters', filters),
  deleteHistoryItem: (id) => ipcRenderer.invoke('delete-history', { id }),
  clearAllHistory: () => ipcRenderer.invoke('clear-history'),
  exportHistoryCSV: () => ipcRenderer.invoke('export-history-csv'),
  
  // ==========================================
  // Dashboard Functions
  // ==========================================
  getDashboard: () => ipcRenderer.invoke('get-dashboard'),
  getTrendData: (days) => ipcRenderer.invoke('get-trend-data', { days }),
  getTypeDistribution: () => ipcRenderer.invoke('get-type-distribution'),
  
  // ==========================================
  // Chatbot Functions
  // ==========================================
  chatbotMessage: (message, context) => ipcRenderer.invoke('chatbot-message', { message, context }),
  voiceChat: (audioBase64) => ipcRenderer.invoke('voice-chat', { audioBase64 }),
  
  // ==========================================
  // File Upload Functions
  // ==========================================
  uploadFile: (filePath, fileType) => ipcRenderer.invoke('upload-file', { filePath, fileType }),
  
  // ==========================================
  // Settings Functions
  // ==========================================
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  
  // ==========================================
  // Authentication Functions
  // ==========================================
  login: (email, password) => ipcRenderer.invoke('login', { email, password }),
  logout: () => ipcRenderer.invoke('logout'),
  isAuthenticated: () => ipcRenderer.invoke('is-authenticated'),
  
  // ==========================================
  // Window Functions
  // ==========================================
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  maximizeWindow: () => ipcRenderer.send('maximize-window'),
  closeWindow: () => ipcRenderer.send('close-window'),
  toggleTheme: () => ipcRenderer.invoke('toggle-theme'),
  
  // ==========================================
  // System Functions
  // ==========================================
  openExternal: (url) => ipcRenderer.invoke('open-external', { url }),
  showOpenDialog: () => ipcRenderer.invoke('show-open-dialog'),
  saveFile: (content, filename) => ipcRenderer.invoke('save-file', { content, filename }),
  
  // ==========================================
  // Event Listeners
  // ==========================================
  onOnline: (callback) => ipcRenderer.on('online', callback),
  onOffline: (callback) => ipcRenderer.on('offline', callback),
  onUnauthorized: (callback) => ipcRenderer.on('unauthorized', callback),
  onAnalysisComplete: (callback) => ipcRenderer.on('analysis-complete', callback),
})

// Log that preload is loaded
console.log('✅ Preload script loaded - electronAPI exposed with full functionality')
