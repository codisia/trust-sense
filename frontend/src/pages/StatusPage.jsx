import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { useTheme } from '../context/ThemeContext'

export default function StatusPage() {
  const { theme } = useTheme()
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/health').then(r => setStatus(r.data)).catch(() => setStatus({ status: 'error' })).finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ minHeight: '60vh', padding: '48px 24px', maxWidth: '560px', margin: '0 auto' }}>
      <Link to="/" style={{ color: theme.accent, fontSize: '14px', marginBottom: '24px', display: 'inline-block' }}>← Back to Home</Link>
      <h1 style={{ fontFamily: theme.fontDisplay, fontSize: '24px', fontWeight: 800, marginBottom: '16px', color: theme.text }}>System Status</h1>
      {loading && <p style={{ color: theme.muted }}>Checking…</p>}
      {!loading && status && (
        <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: '12px', padding: '20px' }}>
          <p style={{ color: status.status === 'healthy' ? theme.accent3 : theme.danger, fontWeight: 600 }}>{status.status === 'healthy' ? '✓ All systems operational' : '✗ Degraded'}</p>
          {status.database && <p style={{ color: theme.muted, fontSize: '13px', marginTop: '8px' }}>Database: {status.database}</p>}
        </div>
      )}
    </div>
  )
}
