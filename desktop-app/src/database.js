/**
 * Local SQLite Database for Desktop App
 * Stores analysis history, user preferences, offline cache
 */

const sqlite3 = require('sqlite3').verbose()
const path = require('path')
const fs = require('fs')
const { app } = require('electron')

// Get app data directory
const dataDir = path.join(app?.getPath('userData') || '.', 'data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const dbPath = path.join(dataDir, 'trustsense.db')

// Initialize database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database error:', err)
  } else {
    console.log('Connected to SQLite database:', dbPath)
    initializeTables()
  }
})

/**
 * Run a database query (Promise wrapper)
 */
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err)
      else resolve({ id: this.lastID, changes: this.changes })
    })
  })
}

/**
 * Get a single row from database
 */
function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err)
      else resolve(row)
    })
  })
}

/**
 * Get all rows from database
 */
function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err)
      else resolve(rows || [])
    })
  })
}

/**
 * Initialize database tables
 */
function initializeTables() {
  // User settings table
  db.run(`
    CREATE TABLE IF NOT EXISTS user_settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Analysis history table
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
      linguistic_neutrality REAL,
      content_reliability REAL,
      dominant_emotion TEXT,
      fake_news_probability REAL,
      manipulation_score REAL,
      signals TEXT,
      api_response TEXT,
      status TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Analysis tags table
  db.run(`
    CREATE TABLE IF NOT EXISTS analysis_tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      analysis_id TEXT,
      tag TEXT,
      FOREIGN KEY(analysis_id) REFERENCES analysis_history(id)
    )
  `)

  // Offline cache table
  db.run(`
    CREATE TABLE IF NOT EXISTS offline_cache (
      key TEXT PRIMARY KEY,
      value TEXT,
      expires_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  console.log('Database tables initialized')
}

/**
 * User Settings Management
 */
export const settingsDB = {
  get: (key) => get('SELECT value FROM user_settings WHERE key = ?', [key]),
  
  set: async (key, value) => {
    const existing = await get('SELECT 1 FROM user_settings WHERE key = ?', [key])
    if (existing) {
      return run('UPDATE user_settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?', 
        [JSON.stringify(value), key])
    } else {
      return run('INSERT INTO user_settings (key, value) VALUES (?, ?)', 
        [key, JSON.stringify(value)])
    }
  },
  
  getAll: () => all('SELECT key, value FROM user_settings'),
  
  delete: (key) => run('DELETE FROM user_settings WHERE key = ?', [key]),
  
  clear: () => run('DELETE FROM user_settings')
}

/**
 * Analysis History Management
 */
export const historyDB = {
  add: (analysis) => {
    const {
      id, content, content_type, trust_score, risk_level, credibility, sentiment,
      emotional_stability, linguistic_neutrality, content_reliability, dominant_emotion,
      fake_news_probability, manipulation_score, signals, api_response, status = 'completed'
    } = analysis
    
    return run(`
      INSERT INTO analysis_history (
        id, content, content_type, trust_score, risk_level, credibility, sentiment,
        emotional_stability, linguistic_neutrality, content_reliability, dominant_emotion,
        fake_news_probability, manipulation_score, signals, api_response, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id, content, content_type, trust_score, risk_level, credibility, sentiment,
      emotional_stability, linguistic_neutrality, content_reliability, dominant_emotion,
      fake_news_probability, manipulation_score, JSON.stringify(signals), 
      JSON.stringify(api_response), status
    ])
  },
  
  get: (id) => get('SELECT * FROM analysis_history WHERE id = ?', [id]),
  
  getAll: async (options = {}) => {
    const { limit = 100, offset = 0, risk_level, min_trust_score } = options
    let sql = 'SELECT * FROM analysis_history WHERE 1=1'
    let params = []
    
    if (risk_level) {
      sql += ' AND risk_level = ?'
      params.push(risk_level)
    }
    if (min_trust_score != null) {
      sql += ' AND trust_score >= ?'
      params.push(min_trust_score)
    }
    
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    params.push(limit, offset)
    
    const rows = await all(sql, params)
    return rows.map(row => ({
      ...row,
      signals: row.signals ? JSON.parse(row.signals) : [],
      api_response: row.api_response ? JSON.parse(row.api_response) : null
    }))
  },
  
  delete: (id) => run('DELETE FROM analysis_history WHERE id = ?', [id]),
  
  deleteAll: () => run('DELETE FROM analysis_history'),
  
  count: async () => {
    const result = await get('SELECT COUNT(*) as count FROM analysis_history')
    return result?.count || 0
  },
  
  getStats: async () => {
    const stats = await get(`
      SELECT 
        COUNT(*) as total,
        AVG(trust_score) as avg_trust_score,
        SUM(CASE WHEN risk_level = 'HIGH' THEN 1 ELSE 0 END) as high_risk,
        SUM(CASE WHEN risk_level = 'MEDIUM' THEN 1 ELSE 0 END) as medium_risk,
        SUM(CASE WHEN risk_level = 'LOW' THEN 1 ELSE 0 END) as low_risk,
        SUM(CASE WHEN fake_news_probability > 0.5 THEN 1 ELSE 0 END) as suspicious
      FROM analysis_history
    `)
    return stats || {}
  }
}

/**
 * Tags Management
 */
export const tagsDB = {
  add: (analysis_id, tag) => 
    run('INSERT INTO analysis_tags (analysis_id, tag) VALUES (?, ?)', [analysis_id, tag]),
  
  getTags: (analysis_id) => 
    all('SELECT tag FROM analysis_tags WHERE analysis_id = ?', [analysis_id]),
  
  delete: (analysis_id) => 
    run('DELETE FROM analysis_tags WHERE analysis_id = ?', [analysis_id])
}

/**
 * Offline Cache Management
 */
export const cacheDB = {
  set: (key, value, expirationMinutes = 60) => {
    const expires_at = new Date(Date.now() + expirationMinutes * 60000)
    return run(`
      INSERT OR REPLACE INTO offline_cache (key, value, expires_at) 
      VALUES (?, ?, ?)
    `, [key, JSON.stringify(value), expires_at])
  },
  
  get: async (key) => {
    const row = await get(`
      SELECT value FROM offline_cache 
      WHERE key = ? AND expires_at > CURRENT_TIMESTAMP
    `, [key])
    return row ? JSON.parse(row.value) : null
  },
  
  delete: (key) => 
    run('DELETE FROM offline_cache WHERE key = ?', [key]),
  
  clear: () => 
    run('DELETE FROM offline_cache WHERE expires_at <= CURRENT_TIMESTAMP')
}

export default {
  settingsDB,
  historyDB,
  tagsDB,
  cacheDB,
  close: () => db.close()
}
