import { useState } from 'react'
import { Card, CardTitle, Badge, Button } from '../components/UI'
import { useLanguage } from '../context/LanguageContext'
import AnimatedBackground3D from '../components/AnimatedBackground3D'
import { theme } from '../theme'
import { useAuth } from '../context/AuthContext'

const MODULES = [
  { name: 'NLP Engine', status: 'Operational', color: '#10b981' },
  { name: 'Trust Score Engine', status: 'Operational', color: '#10b981' },
  { name: 'Vision Module', status: 'Standby', color: '#f59e0b' },
  { name: 'Audio Module', status: 'Standby', color: '#f59e0b' },
  { name: 'Video Module', status: 'Offline — Coming Soon', color: '#ef4444' },
  { name: 'SQLite Database', status: 'Connected', color: '#10b981' },
  { name: 'FastAPI Backend', status: 'Running', color: '#10b981' },
]

const WEIGHTS = [
  { label: 'Credibility Weight', value: '0.30', color: '#00d4ff' },
  { label: 'Emotional Stability', value: '0.20', color: '#10b981' },
  { label: 'Linguistic Neutrality', value: '0.20', color: '#7c3aed' },
  { label: 'Content Reliability', value: '0.30', color: '#f59e0b' },
]

export default function AdminPage() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [users] = useState([
    { id: 1, username: 'admin', email: 'admin@trustsense.ai', role: 'admin', analyses: 0, active: true },
    { id: 2, username: 'analyst_1', email: 'analyst@corp.com', role: 'analyst', analyses: 0, active: true },
  ])

  return (
    <div style={{
      background: theme.bg,
      position: 'relative',
      padding: '48px',
    }}>
      <AnimatedBackground3D />
      
      {/* Content wrapper */}
      <div style={{ position: 'relative', zIndex: 1 }}>
      <div style={{ marginBottom: '32px' }}>
        <div style={{ fontFamily: theme.fontDisplay, fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '4px' }}>Admin Panel</div>
        <div style={{ color: theme.muted, fontSize: '12px', letterSpacing: '0.1em' }}>SYSTEM CONFIGURATION & MANAGEMENT</div>
      </div>

      {user?.role !== 'admin' && (
        <div style={{ padding: '16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', color: theme.danger, fontSize: '13px', marginBottom: '24px' }}>
          {t('warning')} Admin access required. Some features may be restricted.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        {/* System Status */}
        <Card>
          <CardTitle>Module Status</CardTitle>
          {MODULES.map(m => (
            <div key={m.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 0', borderBottom: `1px solid ${theme.border}` }}>
              <span style={{ fontSize: '12px', color: theme.text }}>{m.name}</span>
              <Badge color={m.color}>{m.status}</Badge>
            </div>
          ))}
        </Card>

        {/* Trust Score Weights */}
        <Card>
          <CardTitle>Trust Score Weights</CardTitle>
          {WEIGHTS.map(w => (
            <div key={w.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: `1px solid ${theme.border}` }}>
              <span style={{ color: theme.muted, fontSize: '12px' }}>{w.label}</span>
              <span style={{ fontFamily: theme.fontDisplay, fontWeight: 900, color: w.color, fontSize: '18px' }}>{w.value}</span>
            </div>
          ))}
          <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(0,212,255,0.05)', borderRadius: '8px', border: `1px solid rgba(0,212,255,0.15)`, fontSize: '11px', color: theme.muted, lineHeight: '1.6', fontFamily: "'Space Mono', monospace" }}>
            Total: 0.30 + 0.20 + 0.20 + 0.30 = 1.00 ✓
          </div>

          <div style={{ marginTop: '16px' }}>
            <CardTitle>Stack Info</CardTitle>
            {[
              ['Backend', 'Python 3.11 + FastAPI'],
              ['Database', 'SQLite (local) / PostgreSQL (prod)'],
              ['AI Engine', 'Anthropic Claude API+hugging face offline'],
              ['Frontend', 'React 18 + Vite'],
              ['Auth', 'JWT / bcrypt'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${theme.border}`, fontSize: '11px' }}>
                <span style={{ color: theme.muted }}>{k}</span>
                <span style={{ color: theme.accent }}>{v}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Environment */}
      <Card style={{ marginBottom: '20px' }}>
        <CardTitle>Environment Configuration</CardTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {[
            { key: 'DATABASE_URL', value: 'sqlite:///./trust_sense.db', safe: true },
            { key: 'ANTHROPIC_API_KEY', value: '••••••••••••••••••••••', safe: false },
            { key: 'SECRET_KEY', value: '••••••••••••••••', safe: false },
            { key: 'ALGORITHM', value: 'HS256', safe: true },
          ].map(env => (
            <div key={env.key} style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: `1px solid ${theme.border}` }}>
              <div style={{ fontSize: '10px', letterSpacing: '0.12em', color: theme.muted, marginBottom: '6px' }}>{env.key}</div>
              <div style={{ fontSize: '12px', color: env.safe ? theme.accent3 : theme.warn, fontFamily: "'Space Mono', monospace" }}>{env.value}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: '12px', fontSize: '11px', color: theme.muted }}>
          Edit <code style={{ color: theme.accent }}>backend/.env</code> to configure environment variables.
        </div>
      </Card>

      {/* API Endpoints */}
      <Card>
        <CardTitle>API Endpoints</CardTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { method: 'POST', path: '/auth/register', desc: 'Register new user' },
            { method: 'POST', path: '/auth/login', desc: 'Login, get JWT token' },
            { method: 'POST', path: '/api/analyze-text', desc: 'Analyze text, compute Trust Score' },
            { method: 'GET', path: '/api/analysis-history', desc: 'Fetch analysis history' },
            { method: 'GET', path: '/api/analysis/{id}', desc: 'Get single analysis by ID' },
            { method: 'GET', path: '/api/stats', desc: 'Get platform statistics' },
            { method: 'GET', path: '/health', desc: 'Health check' },
            { method: 'GET', path: '/docs', desc: 'Interactive Swagger UI' },
          ].map(ep => (
            <div key={ep.path} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: `1px solid ${theme.border}` }}>
              <Badge color={ep.method === 'POST' ? theme.accent2 : theme.accent}>{ep.method}</Badge>
              <code style={{ color: theme.accent, fontSize: '12px', flex: 1 }}>{ep.path}</code>
              <span style={{ color: theme.muted, fontSize: '11px' }}>{ep.desc}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: '16px' }}>
          <Button variant="outline" onClick={() => window.open('http://localhost:8000/docs', '_blank')}>
            → OPEN SWAGGER UI
          </Button>
        </div>
      </Card>
      </div>
    </div>
  )
}
