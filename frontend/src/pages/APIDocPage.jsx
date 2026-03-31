import { useState } from 'react'
import { useTheme } from '../context/ThemeContext'
import AnimatedBackground3D from '../components/AnimatedBackground3D'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/UI'

const ENDPOINTS = [
  {
    path: 'POST /auth/register',
    name: 'User Registration',
    desc: 'Create a new user account',
    body: { email: 'user@example.com', password: 'secure_pass', username: 'john_doe' },
    response: { user_id: '123', email: 'user@example.com', token: 'jwt_token' },
  },
  {
    path: 'POST /auth/login',
    name: 'User Login',
    desc: 'Authenticate and receive JWT token',
    body: { email: 'user@example.com', password: 'secure_pass' },
    response: { token: 'jwt_token', user: { id: '123', email: 'user@example.com', role: 'analyst' } },
  },
  {
    path: 'POST /api/analysis/analyze-text',
    name: 'Analyze Text',
    desc: 'Perform psychological and NLP analysis on text content',
    body: { text: 'Sample content to analyze...', source: 'user_input' },
    response: { sentiment_score: 0.85, credibility: 0.92, aggression_score: 0.2, deception_score: 0.15 },
  },
  {
    path: 'POST /api/analysis/import-social',
    name: 'Import Social Media',
    desc: 'Import and analyze content from social platforms',
    body: { platform: 'twitter', content: 'Tweet content', metadata: { likes: 100 } },
    response: { analysis_id: 'abc123', platform: 'twitter', scores: {} },
  },
  {
    path: 'GET /api/analysis/history',
    name: 'Analysis History',
    desc: 'Get user\'s previous analysis records',
    response: { analyses: [{ id: '1', text: 'content', created_at: '2026-03-02T10:00:00' }] },
  },
  {
    path: 'GET /api/analysis/usage',
    name: 'Usage Statistics',
    desc: 'Get current usage stats and rate limit info',
    response: { today_usage: 2, daily_limit: 100, subscription_tier: 'professional' },
  },
]

export default function APIDocPage() {
  const { theme } = useTheme()
  const navigate = useNavigate()
  const [expandedEndpoint, setExpandedEndpoint] = useState(null)

  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
      <AnimatedBackground3D />
      
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* HEADER */}
        <div style={{
          paddingTop: '80px',
          paddingBottom: '60px',
          textAlign: 'center',
        }}>
          <h1 style={{
            fontSize: '48px',
            fontWeight: 900,
            background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '16px',
          }}>
            API Documentation
          </h1>
          <p style={{
            fontSize: '16px',
            color: theme.muted,
            marginBottom: '24px',
          }}>
            Complete REST API reference for Trust Sense
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Button onClick={() => navigate('/')} variant="ghost" size="sm">
              ← Back
            </Button>
            <Button 
              onClick={() => window.open('/docs', '_blank')}
              size="sm"
              style={{
                background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`,
              }}
            >
              Interactive Swagger Docs →
            </Button>
          </div>
        </div>

        {/* API ENDPOINTS */}
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 48px 120px' }}>
          <div style={{ display: 'grid', gap: '20px' }}>
            {ENDPOINTS.map((endpoint, idx) => (
              <div
                key={idx}
                style={{
                  border: `1px solid ${theme.border}`,
                  borderRadius: '12px',
                  background: theme.card,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                }}
                onClick={() => setExpandedEndpoint(expandedEndpoint === idx ? null : idx)}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = theme.accent
                  e.currentTarget.style.background = `linear-gradient(135deg, ${theme.card}, rgba(0,212,255,0.05))`
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = theme.border
                  e.currentTarget.style.background = theme.card
                }}
              >
                {/* HEADER */}
                <div style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '13px',
                      fontWeight: 700,
                      letterSpacing: '1px',
                      color: endpoint.path.includes('POST') ? '#ff6b9d' : '#4ade80',
                      marginBottom: '8px',
                    }}>
                      {endpoint.path.split(' ')[0]}
                    </div>
                    <h3 style={{ color: theme.text, marginBottom: '4px', fontSize: '18px', fontWeight: 700 }}>
                      {endpoint.name}
                    </h3>
                    <p style={{ color: theme.muted, fontSize: '14px' }}>
                      {endpoint.desc}
                    </p>
                  </div>
                  <div style={{
                    fontSize: '24px',
                    color: theme.accent,
                    transition: 'transform 0.3s',
                    transform: expandedEndpoint === idx ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}>
                    ▼
                  </div>
                </div>

                {/* EXPANDED DETAILS */}
                {expandedEndpoint === idx && (
                  <div style={{
                    padding: '20px',
                    borderTop: `1px solid ${theme.border}`,
                    background: `rgba(0,212,255,0.02)`,
                  }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                      {endpoint.body && (
                        <div>
                          <h4 style={{ color: theme.accent, marginBottom: '12px', fontWeight: 700 }}>
                            Request Body
                          </h4>
                          <pre style={{
                            background: theme.bg,
                            padding: '12px',
                            borderRadius: '8px',
                            overflow: 'auto',
                            fontSize: '12px',
                            color: theme.muted,
                          }}>
                            {JSON.stringify(endpoint.body, null, 2)}
                          </pre>
                        </div>
                      )}
                      <div>
                        <h4 style={{ color: theme.accent, marginBottom: '12px', fontWeight: 700 }}>
                          Response
                        </h4>
                        <pre style={{
                          background: theme.bg,
                          padding: '12px',
                          borderRadius: '8px',
                          overflow: 'auto',
                          fontSize: '12px',
                          color: theme.muted,
                        }}>
                          {JSON.stringify(endpoint.response, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* AUTHENTICATION SECTION */}
        <div style={{
          maxWidth: '1000px',
          margin: '0 auto 80px',
          padding: '0 48px',
        }}>
          <div style={{
            padding: '48px',
            borderRadius: '16px',
            background: `linear-gradient(135deg, rgba(0,212,255,0.1), rgba(124,58,237,0.05))`,
            border: `1px solid ${theme.accent}40`,
          }}>
            <h2 style={{ fontSize: '28px', fontWeight: 900, color: theme.accent, marginBottom: '16px' }}>
              🔐 Authentication
            </h2>
            <p style={{ color: theme.text, marginBottom: '16px', lineHeight: '1.8' }}>
              All API endpoints (except /auth/register and /auth/login) require JWT authentication via the <code style={{ background: theme.card, padding: '4px 8px', borderRadius: '4px' }}>Authorization</code> header:
            </p>
            <pre style={{
              background: theme.card,
              padding: '16px',
              borderRadius: '8px',
              overflow: 'auto',
              color: '#4ade80',
              fontSize: '14px',
            }}>
              Authorization: Bearer YOUR_JWT_TOKEN
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}
