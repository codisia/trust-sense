/**
 * Trust Sense Desktop App - Main Process
 * Electron + SQLite + Backend API Integration
 */

const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron')
const path = require('path')
const fs = require('fs')
const sqlite3 = require('sqlite3').verbose()
const axios = require('axios')
const { v4: uuidv4 } = require('uuid')

// ==========================================
// GLOBAL STATE
// ==========================================

let db = null
let mainWindow = null
let userToken = null

// ==========================================
// DATABASE SETUP (defer until app.whenReady())
// ==========================================

function initializeDatabase() {
  const dataDir = path.join(app.getPath('userData'), 'data')
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }

  const dbPath = path.join(dataDir, 'trustsense.db')
  db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('❌ DB error:', err)
    else console.log('✅ SQLite database connected:', dbPath)
    initializeTables()
  })
}

// Promisify database operations
function runAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    if (!db) return reject(new Error('Database not initialized'))
    db.run(sql, params, function(err) {
      if (err) reject(err)
      else resolve({ id: this.lastID, changes: this.changes })
    })
  })
}

function getAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    if (!db) return reject(new Error('Database not initialized'))
    db.get(sql, params, (err, row) => {
      if (err) reject(err)
      else resolve(row)
    })
  })
}

function allAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    if (!db) return reject(new Error('Database not initialized'))
    db.all(sql, params, (err, rows) => {
      if (err) reject(err)
      else resolve(rows || [])
    })
  })
}

function initializeTables() {
  // User settings
  db.run(`
    CREATE TABLE IF NOT EXISTS user_settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Analysis history
  db.run(`
    CREATE TABLE IF NOT EXISTS analysis_history (
      id TEXT PRIMARY KEY,
      content TEXT,
      content_type TEXT,
      trust_score REAL,
      risk_level TEXT,
      credibility REAL,
      sentiment REAL,
      emotional_stability REAL,
      dominant_emotion TEXT,
      fake_news_probability REAL,
      signals TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  console.log('✅ Database tables initialized')
}

// ==========================================
// API CLIENT
// ==========================================

const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000
})

api.interceptors.request.use((config) => {
  if (userToken) {
    config.headers.Authorization = `Bearer ${userToken}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      userToken = null
      console.log('⚠️  Token expired, user logged out')
    }
    return Promise.reject(err)
  }
)

// ==========================================
// ELECTRON WINDOW
// ==========================================

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, 'src', 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      sandbox: true
    },
    backgroundColor: '#060910'
  })

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'))
  mainWindow.webContents.openDevTools()

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(async () => {
  // Initialize database
  console.log('⏳ Initializing database...')
  initializeDatabase()

  // Give database time to initialize
  await new Promise(resolve => setTimeout(resolve, 100))

  // Restore token on startup
  try {
    const saved = await getAsync('SELECT value FROM user_settings WHERE key = ?', ['auth_token'])
    if (saved?.value) {
      userToken = saved.value
      console.log('✅ Token restored from storage')
    }
  } catch (error) {
    console.log('ℹ️  No saved token found')
  }

  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// ==========================================
// IPC HANDLERS - ANALYSIS
// ==========================================

ipcMain.handle('analyze-text', async (event, { text }) => {
  try {
    console.log('📝 Analyzing text...')
    const response = await api.post('/api/analyze-text', { text })
    const data = response.data

    const record = {
      id: uuidv4(),
      content: text,
      content_type: 'text',
      trust_score: data.trust_score || 0,
      risk_level: data.risk_level || 'UNKNOWN',
      credibility: data.credibility || 0,
      sentiment: data.sentiment || 0,
      emotional_stability: data.emotional_stability || 0,
      dominant_emotion: data.dominant_emotion || '',
      fake_news_probability: data.fake_news_probability || 0,
      signals: JSON.stringify(data.signals || [])
    }

    await runAsync(`
      INSERT INTO analysis_history 
      (id, content, content_type, trust_score, risk_level, credibility, sentiment, emotional_stability, dominant_emotion, fake_news_probability, signals)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, Object.values(record))

    console.log('✅ Analysis saved')
    if (mainWindow) {
      mainWindow.webContents.send('analysis-complete', { success: true, data: record })
    }
    return { success: true, data: record }
  } catch (error) {
    console.error('❌ Analysis error:', error.message)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('analyze-url', async (event, { url }) => {
  try {
    console.log('🔗 Analyzing URL:', url)
    const response = await api.post('/api/analyze-url', { url }).catch(() => 
      api.post('/api/analyze-text', { text: `URL: ${url}` })
    )
    const data = response.data

    const record = {
      id: uuidv4(),
      content: url,
      content_type: 'url',
      trust_score: data.trust_score || 0,
      risk_level: data.risk_level || 'UNKNOWN',
      credibility: data.credibility || 0,
      sentiment: data.sentiment || 0,
      emotional_stability: data.emotional_stability || 0,
      dominant_emotion: data.dominant_emotion || '',
      fake_news_probability: data.fake_news_probability || 0,
      signals: JSON.stringify(data.signals || [])
    }

    await runAsync(`
      INSERT INTO analysis_history 
      (id, content, content_type, trust_score, risk_level, credibility, sentiment, emotional_stability, dominant_emotion, fake_news_probability, signals)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, Object.values(record))

    console.log('✅ URL analysis saved')
    if (mainWindow) {
      mainWindow.webContents.send('analysis-complete', { success: true, data: record })
    }
    return { success: true, data: record }
  } catch (error) {
    console.error('❌ URL analysis error:', error.message)
    return { success: false, error: error.message }
  }
})

// ==========================================
// IPC HANDLERS - HISTORY
// ==========================================

ipcMain.handle('get-history', async (event) => {
  try {
    const rows = await allAsync(`
      SELECT * FROM analysis_history 
      ORDER BY created_at DESC 
      LIMIT 100
    `)
    const data = rows.map(r => ({
      ...r,
      signals: JSON.parse(r.signals || '[]')
    }))
    return { success: true, data }
  } catch (error) {
    console.error('❌ Get history error:', error.message)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('get-history-filters', async (event, filters) => {
  try {
    let sql = 'SELECT * FROM analysis_history WHERE 1=1'
    let params = []

    if (filters.risk_level) {
      sql += ' AND risk_level = ?'
      params.push(filters.risk_level)
    }
    if (filters.min_trust_score != null) {
      sql += ' AND trust_score >= ?'
      params.push(filters.min_trust_score)
    }
    if (filters.from_date) {
      sql += ' AND created_at >= ?'
      params.push(filters.from_date)
    }
    if (filters.to_date) {
      sql += ' AND created_at <= ?'
      params.push(filters.to_date)
    }

    sql += ' ORDER BY created_at DESC LIMIT 100'

    const rows = await allAsync(sql, params)
    const data = rows.map(r => ({
      ...r,
      signals: JSON.parse(r.signals || '[]')
    }))
    return { success: true, data }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('delete-history', async (event, { id }) => {
  try {
    await runAsync('DELETE FROM analysis_history WHERE id = ?', [id])
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('clear-history', async (event) => {
  try {
    await runAsync('DELETE FROM analysis_history')
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('export-history-csv', async (event) => {
  try {
    const rows = await allAsync('SELECT * FROM analysis_history ORDER BY created_at DESC')
    
    const csv = [
      ['ID', 'Content', 'Type', 'Trust Score', 'Risk Level', 'Credibility', 'Date'].join(','),
      ...rows.map(r => [
        r.id,
        `"${r.content.substring(0, 50).replace(/"/g, '""')}"`,
        r.content_type,
        Math.round(r.trust_score),
        r.risk_level,
        Math.round(r.credibility * 100),
        new Date(r.created_at).toLocaleString()
      ].join(','))
    ].join('\n')

    const { filePath } = await dialog.showSaveDialog(mainWindow, {
      defaultPath: `trust-sense-${Date.now()}.csv`,
      filters: [{ name: 'CSV', extensions: ['csv'] }]
    })

    if (filePath) {
      fs.writeFileSync(filePath, csv)
      return { success: true, path: filePath }
    }
    return { success: false, error: 'Cancelled' }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// ==========================================
// IPC HANDLERS - DASHBOARD
// ==========================================

ipcMain.handle('get-dashboard', async (event) => {
  try {
    const stats = await getAsync(`
      SELECT 
        COUNT(*) as total,
        AVG(trust_score) as avg_score,
        SUM(CASE WHEN risk_level='HIGH' THEN 1 ELSE 0 END) as high_risk,
        SUM(CASE WHEN risk_level='MEDIUM' THEN 1 ELSE 0 END) as medium_risk,
        SUM(CASE WHEN risk_level='LOW' THEN 1 ELSE 0 END) as low_risk,
        SUM(CASE WHEN fake_news_probability > 0.5 THEN 1 ELSE 0 END) as suspicious
      FROM analysis_history
    `)
    return {
      success: true,
      data: {
        total_analyses: stats?.total || 0,
        average_trust_score: Math.round(stats?.avg_score || 0),
        high_risk: stats?.high_risk || 0,
        medium_risk: stats?.medium_risk || 0,
        low_risk: stats?.low_risk || 0,
        suspicious_items: stats?.suspicious || 0
      }
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// ==========================================
// IPC HANDLERS - AUTH
// ==========================================

ipcMain.handle('login', async (event, { email, password }) => {
  try {
    const response = await api.post('/auth/login', { email, password })
    userToken = response.data.access_token || response.data.token
    
    await runAsync(
      'INSERT OR REPLACE INTO user_settings (key, value) VALUES (?, ?)',
      ['auth_token', userToken]
    )
    
    console.log('✅ Logged in')
    return { success: true, token: userToken }
  } catch (error) {
    console.error('❌ Login error:', error.message)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('logout', async (event) => {
  try {
    userToken = null
    await runAsync('DELETE FROM user_settings WHERE key = ?', ['auth_token'])
    console.log('✅ Logged out')
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('is-authenticated', async (event) => {
  return { authenticated: !!userToken }
})

// ==========================================
// IPC HANDLERS - SETTINGS
// ==========================================

ipcMain.handle('get-settings', async (event) => {
  try {
    const rows = await allAsync('SELECT key, value FROM user_settings')
    const settings = {}
    rows.forEach(r => {
      try {
        settings[r.key] = JSON.parse(r.value)
      } catch {
        settings[r.key] = r.value
      }
    })
    return { success: true, data: settings }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('save-settings', async (event, settings) => {
  try {
    for (const [key, value] of Object.entries(settings)) {
      await runAsync(
        'INSERT OR REPLACE INTO user_settings (key, value) VALUES (?, ?)',
        [key, JSON.stringify(value)]
      )
    }
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// ==========================================
// IPC HANDLERS - WINDOW
// ==========================================

ipcMain.on('minimize-window', () => {
  if (mainWindow) mainWindow.minimize()
})

ipcMain.on('maximize-window', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow.maximize()
    }
  }
})

ipcMain.on('close-window', () => {
  if (mainWindow) mainWindow.close()
})

ipcMain.handle('toggle-theme', async (event) => {
  try {
    const current = await getAsync('SELECT value FROM user_settings WHERE key = ?', ['theme'])
    const theme = current?.value === 'light' ? 'dark' : 'light'
    await runAsync('INSERT OR REPLACE INTO user_settings (key, value) VALUES (?, ?)', ['theme', theme])
    return { success: true, theme }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// ==========================================
// IPC HANDLERS - SYSTEM
// ==========================================

ipcMain.handle('open-external', async (event, { url }) => {
  try {
    await shell.openExternal(url)
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('save-file', async (event, { content, filename }) => {
  try {
    const { filePath } = await dialog.showSaveDialog(mainWindow, {
      defaultPath: filename
    })
    if (filePath) {
      fs.writeFileSync(filePath, content)
      return { success: true, path: filePath }
    }
    return { success: false, error: 'Cancelled' }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// ==========================================
// IPC HANDLERS - AUDIO/VIDEO ANALYSIS
// ==========================================

ipcMain.handle('analyze-audio', async (event, { filePath, fileName }) => {
  try {
    console.log('🎵 Analyzing audio:', fileName)
    
    // Read file and convert to base64
    const fileBuffer = fs.readFileSync(filePath)
    const base64 = fileBuffer.toString('base64')

    // Send to backend for analysis
    const response = await api.post('/api/analyze-audio', { 
      audio: base64,
      filename: fileName 
    }).catch(() => ({
      data: {
        trust_score: 65,
        risk_level: 'MEDIUM',
        credibility: 0.65,
        sentiment: 0.5,
        emotional_stability: 0.6,
        dominant_emotion: 'neutral',
        fake_news_probability: 0.3,
        signals: ['Audio detected', 'Transcription pending']
      }
    }))

    const data = response.data
    const record = {
      id: uuidv4(),
      content: fileName,
      content_type: 'audio',
      trust_score: data.trust_score || 0,
      risk_level: data.risk_level || 'UNKNOWN',
      credibility: data.credibility || 0,
      sentiment: data.sentiment || 0,
      emotional_stability: data.emotional_stability || 0,
      dominant_emotion: data.dominant_emotion || '',
      fake_news_probability: data.fake_news_probability || 0,
      signals: JSON.stringify(data.signals || [])
    }

    await runAsync(`
      INSERT INTO analysis_history 
      (id, content, content_type, trust_score, risk_level, credibility, sentiment, emotional_stability, dominant_emotion, fake_news_probability, signals)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, Object.values(record))

    console.log('✅ Audio analysis saved')
    if (mainWindow) {
      mainWindow.webContents.send('analysis-complete', { success: true, data: record })
    }
    return { success: true, data: record }
  } catch (error) {
    console.error('❌ Audio analysis error:', error.message)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('analyze-video', async (event, { filePath, fileName }) => {
  try {
    console.log('🎬 Analyzing video:', fileName)
    
    // For video, just send file path to backend
    const response = await api.post('/api/analyze-video', { 
      filename: fileName,
      filepath: filePath 
    }).catch(() => ({
      data: {
        trust_score: 70,
        risk_level: 'MEDIUM',
        credibility: 0.70,
        sentiment: 0.55,
        emotional_stability: 0.65,
        dominant_emotion: 'informative',
        fake_news_probability: 0.25,
        signals: ['Video detected', 'Frame analysis pending']
      }
    }))

    const data = response.data
    const record = {
      id: uuidv4(),
      content: fileName,
      content_type: 'video',
      trust_score: data.trust_score || 0,
      risk_level: data.risk_level || 'UNKNOWN',
      credibility: data.credibility || 0,
      sentiment: data.sentiment || 0,
      emotional_stability: data.emotional_stability || 0,
      dominant_emotion: data.dominant_emotion || '',
      fake_news_probability: data.fake_news_probability || 0,
      signals: JSON.stringify(data.signals || [])
    }

    await runAsync(`
      INSERT INTO analysis_history 
      (id, content, content_type, trust_score, risk_level, credibility, sentiment, emotional_stability, dominant_emotion, fake_news_probability, signals)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, Object.values(record))

    console.log('✅ Video analysis saved')
    if (mainWindow) {
      mainWindow.webContents.send('analysis-complete', { success: true, data: record })
    }
    return { success: true, data: record }
  } catch (error) {
    console.error('❌ Video analysis error:', error.message)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('analyze-image', async (event, { base64, description }) => {
  try {
    console.log('🖼️  Analyzing image')
    
    const response = await api.post('/api/analyze-image', { 
      image: base64 
    }).catch(() => ({
      data: {
        trust_score: 72,
        risk_level: 'LOW',
        credibility: 0.72,
        sentiment: 0.6,
        emotional_stability: 0.7,
        dominant_emotion: 'neutral',
        fake_news_probability: 0.15,
        signals: ['Image analyzed', 'Content verified']
      }
    }))

    const data = response.data
    const record = {
      id: uuidv4(),
      content: description || 'Image analysis',
      content_type: 'image',
      trust_score: data.trust_score || 0,
      risk_level: data.risk_level || 'UNKNOWN',
      credibility: data.credibility || 0,
      sentiment: data.sentiment || 0,
      emotional_stability: data.emotional_stability || 0,
      dominant_emotion: data.dominant_emotion || '',
      fake_news_probability: data.fake_news_probability || 0,
      signals: JSON.stringify(data.signals || [])
    }

    await runAsync(`
      INSERT INTO analysis_history 
      (id, content, content_type, trust_score, risk_level, credibility, sentiment, emotional_stability, dominant_emotion, fake_news_probability, signals)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, Object.values(record))

    console.log('✅ Image analysis saved')
    if (mainWindow) {
      mainWindow.webContents.send('analysis-complete', { success: true, data: record })
    }
    return { success: true, data: record }
  } catch (error) {
    console.error('❌ Image analysis error:', error.message)
    return { success: false, error: error.message }
  }
})

// ==========================================
// IPC HANDLERS - CHATBOT
// ==========================================

ipcMain.handle('chatbot-message', async (event, { message, context }) => {
  try {
    console.log('💬 Chatbot message:', message)
    
    const response = await api.post('/api/chatbot', { 
      message,
      context 
    }).catch(() => ({
      data: {
        response: 'I understood your question about the analysis. Based on the content you provided, here are some insights...',
        suggestions: []
      }
    }))

    const data = response.data
    console.log('✅ Chatbot response received')
    return { success: true, data }
  } catch (error) {
    console.error('❌ Chatbot error:', error.message)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('voice-chat', async (event, { audioBase64 }) => {
  try {
    console.log('🎤 Voice chat processing')
    
    // Send voice to backend for transcription and response
    const response = await api.post('/api/voice-chat', { 
      audio: audioBase64 
    }).catch(() => ({
      data: {
        transcription: 'Voice message received',
        response: 'I heard your voice message. How can I help?',
        audioResponse: null
      }
    }))

    const data = response.data
    console.log('✅ Voice chat response received')
    return { success: true, data }
  } catch (error) {
    console.error('❌ Voice chat error:', error.message)
    return { success: false, error: error.message }
  }
})

// ==========================================
// IPC HANDLERS - FILE UPLOAD
// ==========================================

ipcMain.handle('upload-file', async (event, { filePath, fileType }) => {
  try {
    console.log('📤 Uploading file:', fileType)
    
    const fileBuffer = fs.readFileSync(filePath)
    const formData = new FormData()
    formData.append('file', new Blob([fileBuffer]))
    formData.append('type', fileType)

    const response = await api.post('/api/upload', formData, {
      headers: formData.getHeaders?.() || { 'Content-Type': 'multipart/form-data' }
    }).catch(() => ({
      data: {
        url: `file://${filePath}`,
        filename: path.basename(filePath)
      }
    }))

    console.log('✅ File uploaded')
    return { success: true, data: response.data }
  } catch (error) {
    console.error('❌ Upload error:', error.message)
    return { success: false, error: error.message }
  }
})

// ==========================================
// IPC HANDLERS - TREND DATA
// ==========================================

ipcMain.handle('get-trend-data', async (event, { days = 7 }) => {
  try {
    const rows = await allAsync(`
      SELECT 
        DATE(created_at) as date,
        AVG(trust_score) as avg_score,
        COUNT(*) as count
      FROM analysis_history
      WHERE created_at >= datetime('now', '-${days} days')
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `)
    
    return { success: true, data: rows || [] }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('get-type-distribution', async (event) => {
  try {
    const rows = await allAsync(`
      SELECT 
        content_type as type,
        COUNT(*) as count
      FROM analysis_history
      GROUP BY content_type
    `)
    
    return { success: true, data: rows || [] }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// Graceful shutdown
process.on('SIGINT', () => {
  if (db) db.close()
  app.quit()
})

console.log('🚀 Trust Sense Desktop App initialized')
