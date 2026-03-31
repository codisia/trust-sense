const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    analyzeText: (content) => ipcRenderer.invoke('analyze-text', content),
    analyzeUrl: (url) => ipcRenderer.invoke('analyze-url', url),
    analyzeMedia: (filePath) => ipcRenderer.invoke('analyze-media', filePath),
    getAnalysisHistory: () => ipcRenderer.invoke('get-analysis-history'),
    checkServerStatus: () => ipcRenderer.invoke('check-server-status'),

    // Event listeners
    onAnalysisResult: (callback) => ipcRenderer.on('analysis-result', callback),
    onServerStatus: (callback) => ipcRenderer.on('server-status', callback),

    // Remove listeners
    removeAllListeners: (event) => ipcRenderer.removeAllListeners(event)
});

// Also expose as 'api' for backward compatibility
contextBridge.exposeInMainWorld('api', {
    analyzeText: (content) => ipcRenderer.invoke('analyze-text', content),
    analyzeUrl: (url) => ipcRenderer.invoke('analyze-url', url),
    getHistory: () => ipcRenderer.invoke('get-analysis-history'),
    getDashboard: (period) => ipcRenderer.invoke('get-dashboard', period),
    onAnalysisResult: (callback) => ipcRenderer.on('analysis-result', callback)
});
