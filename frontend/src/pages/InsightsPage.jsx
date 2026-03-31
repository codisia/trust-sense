import { useState, useEffect } from 'react'
import { analysisAPI } from '../services/api'
import { Card, CardTitle, StatCard, Button, Badge } from '../components/UI'
import AnimatedBackground3D from '../components/AnimatedBackground3D'
import { useTheme } from '../context/ThemeContext'
import { useLanguage } from '../context/LanguageContext'
import { scoreColor } from '../theme'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid } from 'recharts'

export default function InsightsPage() {
  const { theme } = useTheme()
  const { t } = useLanguage()
  const [stats, setStats] = useState(null)
  const [history, setHistory] = useState([])

  useEffect(() => {
    analysisAPI.getStats().then(r => setStats(r.data)).catch(() => {})
    analysisAPI.getHistory(0, 30).then(r => setHistory(r.data)).catch(() => {})
  }, [])

  // Build trend from history
  const trendData = history.slice().reverse().map((a, i) => ({
    index: i + 1,
    trust: Math.round(a.trust_score),
    fake: Math.round(a.fake_news_probability * 100),
  }))

  const emotionCounts = {}
  history.forEach(a => {
    if (a.dominant_emotion) emotionCounts[a.dominant_emotion] = (emotionCounts[a.dominant_emotion] || 0) + 1
  })
  const emotionData = Object.entries(emotionCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count)

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
        <div style={{ fontFamily: theme.fontDisplay, fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '4px' }}>Insights & Reports</div>
        <div style={{ color: theme.muted, fontSize: '12px', letterSpacing: '0.1em' }}>BUSINESS INTELLIGENCE LAYER</div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <StatCard label="Total Analyses" value={stats?.total ?? '—'} accent={theme.accent} />
        <StatCard label="Avg Trust Score" value={stats?.avg_trust_score ?? '—'} accent={scoreColor(stats?.avg_trust_score || 0)} />
        <StatCard label="Fake News Rate" value={stats ? `${Math.round((stats.fake_news_flagged / Math.max(stats.total, 1)) * 100)}%` : '—'} accent={theme.danger} />
        <StatCard label="High Risk Items" value={stats?.high_risk ?? '—'} accent={theme.warn} />
      </div>

      {/* Trust Score Trend */}
      <Card style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <CardTitle>Trust Score Evolution</CardTitle>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Badge color={theme.accent}>Trust Score</Badge>
            <Badge color={theme.danger}>Fake News %</Badge>
          </div>
        </div>
        {trendData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="tGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={theme.accent} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={theme.accent} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="fGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={theme.danger} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={theme.danger} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="index" tick={{ fill: theme.muted, fontSize: 11, fontFamily: theme.font }} axisLine={false} tickLine={false} label={{ value: 'Analysis #', position: 'insideBottom', fill: theme.muted, fontSize: 10 }} />
              <YAxis tick={{ fill: theme.muted, fontSize: 11, fontFamily: theme.font }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: '8px', fontFamily: theme.font, fontSize: '12px' }} />
              <Area type="monotone" dataKey="trust" stroke={theme.accent} fill="url(#tGrad)" strokeWidth={2} name="Trust Score" />
              <Area type="monotone" dataKey="fake" stroke={theme.danger} fill="url(#fGrad)" strokeWidth={2} strokeDasharray="4 2" name="Fake News %" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px', color: theme.muted, fontSize: '13px' }}>
            No data yet. Run analyses from the Dashboard to see trends.
          </div>
        )}
      </Card>

      {/* Emotion distribution + Risk breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <Card>
          <CardTitle>Dominant Emotion Distribution</CardTitle>
          {emotionData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={emotionData}>
                <XAxis dataKey="name" tick={{ fill: theme.muted, fontSize: 11, fontFamily: theme.font }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: theme.muted, fontSize: 11, fontFamily: theme.font }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: '8px', fontFamily: theme.font, fontSize: '12px' }} />
                <Bar dataKey="count" fill={theme.accent2} radius={[4, 4, 0, 0]} name="Count" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: theme.muted, fontSize: '13px' }}>Run analyses to see emotion patterns</div>
          )}
        </Card>

        <Card>
          <CardTitle>Trust Score Formula</CardTitle>
          <div style={{ padding: '16px', background: 'rgba(0,212,255,0.03)', border: `1px solid rgba(0,212,255,0.15)`, borderRadius: '10px', fontFamily: "'Space Mono', monospace", fontSize: '12px', color: theme.accent, lineHeight: '2', marginBottom: '16px' }}>
            TS = (0.30 × Credibility)<br />
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+ (0.20 × Emot. Stability)<br />
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+ (0.20 × Ling. Neutrality)<br />
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+ (0.30 × Content Reliability)
          </div>
          {[
            ['Credibility', '30%', theme.accent],
            ['Emotional Stability', '20%', theme.accent3],
            ['Linguistic Neutrality', '20%', theme.accent2],
            ['Content Reliability', '30%', theme.warn],
          ].map(([label, weight, color]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${theme.border}`, fontSize: '12px' }}>
              <span style={{ color: theme.muted }}>{label}</span>
              <span style={{ fontFamily: theme.fontDisplay, fontWeight: 800, color }}>{weight}</span>
            </div>
          ))}
        </Card>
      </div>

      </div>
    </div>
  )
}
