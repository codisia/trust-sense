import { useState, useEffect } from 'react'
import { analysisAPI } from '../services/api'
import { Card, CardTitle, Badge, Button, Spinner, ScoreBar } from '../components/UI'
import AnimatedBackground3D from '../components/AnimatedBackground3D'
import { useTheme } from '../context/ThemeContext'
import { useLanguage } from '../context/LanguageContext'
import { scoreColor, riskColor } from '../theme'

export default function HistoryPage() {
  const { theme } = useTheme()
  const { t } = useLanguage()
  const [analyses, setAnalyses] = useState([])
  const sampleAnalyses = [
    {
      id: 101,
      created_at: new Date().toISOString(),
      input_type: 'text',
      raw_input: 'Sample phishing email content',
      trust_score: 25,
      sentiment: -0.5,
      fake_news_probability: 0.8,
      dominant_emotion: 'anger',
      risk_level: 'HIGH',
    },
    {
      id: 102,
      created_at: new Date().toISOString(),
      input_type: 'text',
      raw_input: 'Neutral news article example',
      trust_score: 75,
      sentiment: 0.1,
      fake_news_probability: 0.1,
      dominant_emotion: 'neutral',
      risk_level: 'LOW',
    },
  ]
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({ risk_level: '', min_trust_score: '', from_date: '', to_date: '' })
  const [exporting, setExporting] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const loadHistory = () => {
    setLoading(true)
    const params = { skip: 0, limit: 100 }
    if (filters.risk_level) params.risk_level = filters.risk_level
    if (filters.min_trust_score !== '') params.min_trust_score = Number(filters.min_trust_score)
    if (filters.from_date) params.from_date = filters.from_date
    if (filters.to_date) params.to_date = filters.to_date
    analysisAPI.getHistory(params)
      .then(r => setAnalyses(r.data))
      .catch(() => setError('Could not load history'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadHistory()
  }, [])

  const handleExportCSV = () => {
    setExporting(true)
    const params = {}
    if (filters.risk_level) params.risk_level = filters.risk_level
    if (filters.min_trust_score !== '') params.min_trust_score = Number(filters.min_trust_score)
    if (filters.from_date) params.from_date = filters.from_date
    if (filters.to_date) params.to_date = filters.to_date
    analysisAPI.getHistoryExportCSV(params)
      .then((r) => {
        const url = URL.createObjectURL(new Blob([r.data]))
        const a = document.createElement('a')
        a.href = url
        a.download = 'trust-sense-history.csv'
        a.click()
        URL.revokeObjectURL(url)
      })
      .catch(() => setError('Export failed'))
      .finally(() => setExporting(false))
  }

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
        <div style={{ fontFamily: theme.fontDisplay, fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '4px' }}>{t('analysis_history_title')}</div>
        <div style={{ color: theme.muted, fontSize: '12px', letterSpacing: '0.1em' }}>CHRONOLOGICAL INTELLIGENCE LOG</div>
      </div>

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <CardTitle>{t('recent_analyses')}</CardTitle>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <select
              value={filters.risk_level}
              onChange={e => setFilters(f => ({ ...f, risk_level: e.target.value }))}
              style={{ padding: '6px 10px', borderRadius: '6px', border: `1px solid ${theme.border}`, background: theme.surface, color: theme.text, fontSize: '11px' }}
            >
              <option value="">All risk</option>
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
            <input
              type="number"
              placeholder="Min trust"
              min="0"
              max="100"
              value={filters.min_trust_score}
              onChange={e => setFilters(f => ({ ...f, min_trust_score: e.target.value }))}
              style={{ width: '70px', padding: '6px 8px', borderRadius: '6px', border: `1px solid ${theme.border}`, background: theme.surface, color: theme.text, fontSize: '11px' }}
            />
            <input
              type="date"
              value={filters.from_date}
              onChange={e => setFilters(f => ({ ...f, from_date: e.target.value }))}
              style={{ padding: '6px 8px', borderRadius: '6px', border: `1px solid ${theme.border}`, background: theme.surface, color: theme.text, fontSize: '11px' }}
            />
            <input
              type="date"
              value={filters.to_date}
              onChange={e => setFilters(f => ({ ...f, to_date: e.target.value }))}
              style={{ padding: '6px 8px', borderRadius: '6px', border: `1px solid ${theme.border}`, background: theme.surface, color: theme.text, fontSize: '11px' }}
            />
            <Button variant="outline" size="sm" onClick={loadHistory}>Apply</Button>
            <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={exporting}>
              {exporting ? 'Exporting…' : 'Export CSV'}
            </Button>
            <Badge color={theme.accent}>{analyses.length} RECORDS</Badge>
          </div>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '40px', color: theme.muted }}>
            <Spinner size={24} /><div style={{ marginTop: '12px', fontSize: '12px' }}>Loading history...</div>
          </div>
        )}

        {error && <div style={{ color: theme.danger, fontSize: '12px', padding: '20px' }}>{t('warning')} {error}</div>}

        {!loading && analyses.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: theme.muted, fontSize: '13px' }}>
            No analyses yet. Showing sample data below.
          </div>
        )}

        {!loading && analyses.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                  {['ID', 'Date', 'Type', 'Input Preview', 'Trust Score', 'Fake News', 'Emotion', 'Risk', 'Action'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: '10px', letterSpacing: '0.12em', color: theme.muted, fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {((analyses.length > 0) ? analyses : sampleAnalyses).map((row, i) => (
                  <tr key={row.id} style={{ borderBottom: `1px solid ${theme.border}`, background: selected?.id === row.id ? 'rgba(0,212,255,0.04)' : 'transparent', transition: 'background 0.15s' }}>
                    <td style={{ padding: '12px', color: theme.accent, fontWeight: 700 }}>#{row.id}</td>
                    <td style={{ padding: '12px', color: theme.muted, fontSize: '11px', whiteSpace: 'nowrap' }}>
                      {new Date(row.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '12px' }}><Badge color={theme.accent2}>{row.input_type?.toUpperCase()}</Badge></td>
                    <td style={{ padding: '12px', color: theme.muted, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '11px' }}>
                      {row.raw_input || '—'}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ fontFamily: theme.fontDisplay, fontWeight: 900, color: scoreColor(row.trust_score), fontSize: '16px' }}>
                        {Math.round(row.trust_score)}
                      </span>
                    </td>
                    <td style={{ padding: '12px', color: (row.fake_news_probability > 0.5) ? theme.danger : theme.accent3 }}>
                      {Math.round(row.fake_news_probability * 100)}%
                    </td>
                    <td style={{ padding: '12px', color: theme.muted, fontSize: '12px' }}>{row.dominant_emotion || '—'}</td>
                    <td style={{ padding: '12px' }}>
                      <Badge color={riskColor(row.risk_level)}>{row.risk_level}</Badge>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <Button variant="outline" size="sm" onClick={() => setSelected(selected?.id === row.id ? null : row)}>
                        {selected?.id === row.id ? 'CLOSE' : 'VIEW'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Detail panel */}
        {selected && (
          <div style={{
            marginTop: '24px', padding: '24px',
            background: 'rgba(0,212,255,0.03)',
            border: `1px solid rgba(0,212,255,0.2)`,
            borderRadius: '10px',
            animation: 'fadeIn 0.3s ease',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ fontFamily: theme.fontDisplay, fontSize: '16px', fontWeight: 800 }}>
                Analysis Detail — #{selected.id}
              </div>
              <Badge color={scoreColor(selected.trust_score)}>TRUST: {Math.round(selected.trust_score)}/100</Badge>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '24px' }}>
              <div>
                <div style={{ color: theme.muted, fontSize: '10px', letterSpacing: '0.1em', marginBottom: '8px' }}>INPUT PREVIEW</div>
                <div style={{ fontSize: '13px', lineHeight: '1.7', color: theme.text }}>{selected.raw_input}</div>
              </div>
              <div>
                <ScoreBar label="Sentiment" value={(selected.sentiment + 1) / 2} color={selected.sentiment >= 0 ? theme.accent3 : theme.danger} />
                <ScoreBar label="Content Reliability" value={1 - selected.fake_news_probability} color={theme.accent} />
              </div>
              <div>
                <div style={{ color: theme.muted, fontSize: '10px', letterSpacing: '0.1em', marginBottom: '8px' }}>DOMINANT EMOTION</div>
                <div style={{ fontFamily: theme.fontDisplay, fontSize: '24px', fontWeight: 900, color: theme.accent }}>{selected.dominant_emotion}</div>
                <div style={{ marginTop: '12px' }}><Badge color={riskColor(selected.risk_level)}>{selected.risk_level} RISK</Badge></div>
              </div>
            </div>
          </div>
        )}
      </Card>
      </div>
    </div>
  )
}
