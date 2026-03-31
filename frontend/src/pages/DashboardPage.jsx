import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { analysisAPI, mediaAPI } from '../services/api'
import {
  Card, CardTitle, Button, Badge, Spinner,
  TrustGauge, ScoreBar, EmotionChart, StatCard,
} from '../components/UI'
import Chatbot from '../components/Chatbot'
import AnimatedBackground3D from '../components/AnimatedBackground3D'
import Footer from '../components/Footer'
import NewsSection from '../components/NewsSection'
import { useTheme } from '../context/ThemeContext'
import { useLanguage } from '../context/LanguageContext'
import { scoreColor, riskColor } from '../theme'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const MODES = [
  { id: 'text', label: 'Text', icon: '' },
  { id: 'audio', label: 'Audio', icon: '' },
  { id: 'video', label: 'Video', icon: '' },
]

export default function DashboardPage() {
  const navigate = useNavigate()
  const { theme } = useTheme()
  const { t } = useLanguage()
  const [mode, setMode] = useState('text')
  const [text, setText] = useState('')
  const [audioFile, setAudioFile] = useState(null)
  const [videoFile, setVideoFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState(null)
  const [chatbotOpen, setChatbotOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    analysisAPI.getStatsSummary().then(r => setStats(r.data?.data ?? r.data)).catch(() => {})
  }, [result])

  const analyze = async () => {
    if (mode === 'text' && !text.trim()) return
    if (mode === 'audio' && !audioFile) { setError('Select an audio file'); return }
    if (mode === 'video' && !videoFile) { setError('Select a video file'); return }
    setLoading(true)
    setResult(null)
    setError(null)
    try {
      if (mode === 'text') {
        const { data } = await analysisAPI.analyzeText(text)
        setResult(data)
      } else if (mode === 'audio') {
        const { data } = await mediaAPI.analyzeAudio(audioFile)
        const t = data.text_analysis
        setResult(t ? {
          ...t,
          signals: data.voice_emotion ? [
            `Voice emotion: ${data.voice_emotion.emotion || '—'} (${((data.voice_emotion.confidence || 0) * 100).toFixed(0)}%)`,
            ...(Array.isArray(t.signals) ? t.signals : []),
          ] : (t.signals || []),
          summary: t.summary || `Audio: ${data.voice_emotion?.emotion || 'analyzed'}.`,
        } : {
          trust_score: 50,
          risk_level: 'MEDIUM',
          credibility: 0.5,
          emotional_stability: 0.5,
          linguistic_neutrality: 0.5,
          content_reliability: 0.5,
          fake_news_probability: 0,
          manipulation_score: 0,
          dominant_emotion: data.voice_emotion?.emotion || 'neutral',
          emotions: data.voice_emotion?.emotion_scores || {},
          sentiment: 0,
          signals: [`Voice: ${data.voice_emotion?.emotion || '—'}`, data.transcript?.transcript ? `Transcript: ${data.transcript.transcript.slice(0, 100)}…` : ''],
          summary: `Audio analysis: ${data.voice_emotion?.emotion || '—'}.`,
        })
      } else {
        const { data } = await mediaAPI.analyzeVideo(videoFile)
        setResult({
          trust_score: data.trust_score ?? 50,
          risk_level: data.risk_level || 'MEDIUM',
          credibility: 1 - (data.deepfake_detection?.is_deepfake_probability ?? 0),
          emotional_stability: 0.7,
          linguistic_neutrality: 0.8,
          content_reliability: 1 - (data.deepfake_detection?.is_deepfake_probability ?? 0),
          fake_news_probability: data.deepfake_detection?.is_deepfake_probability ?? 0,
          manipulation_score: data.deepfake_detection?.is_deepfake_probability ?? 0,
          dominant_emotion: data.facial_emotions?.dominant_emotions?.[0] || 'unknown',
          emotions: data.facial_emotions?.average_emotions || {},
          sentiment: 0,
          signals: [
            `Deepfake probability: ${((data.deepfake_detection?.is_deepfake_probability ?? 0) * 100).toFixed(1)}%`,
            data.facial_emotions ? `Facial emotions: ${Object.keys(data.facial_emotions.average_emotions || {}).join(', ') || '—'}` : '',
          ].filter(Boolean),
          summary: `Video: ${data.risk_level} risk. Deepfake: ${((data.deepfake_detection?.is_deepfake_probability ?? 0) * 100).toFixed(0)}%.`,
        })
      }
      analysisAPI.getStatsSummary().then(r => setStats(r.data?.data ?? r.data)).catch(() => {})
    } catch (e) {
      setError(e.response?.data?.detail || e.message || 'Analysis failed. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  const rColor = result ? riskColor(result.risk_level) : theme.muted

  return (
    <div style={{
      background: theme.bg,
      position: 'relative',
    }}>
      <AnimatedBackground3D />
      
      {/* Content wrapper */}
      <div style={{ position: 'relative', zIndex: 1, padding: '48px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: theme.fontDisplay, fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '4px' }}>
            {t('intelligence_dashboard')}
          </div>
          <div style={{ color: theme.muted, fontSize: '12px', letterSpacing: '0.1em' }}>{t('dashboard_subtitle')}</div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Button 
            onClick={() => navigate('/')}
            style={{ 
              padding: '10px 16px', 
              fontSize: '12px',
              background: 'rgba(255,255,255,0.05)',
              color: theme.muted,
              border: `1px solid ${theme.border}`
            }}
          >
            {t('home')}
          </Button>
          <Button 
            onClick={() => setChatbotOpen(!chatbotOpen)}
            style={{ 
              padding: '10px 16px', 
              fontSize: '12px',
              background: chatbotOpen ? theme.accent2 : 'rgba(0,212,255,0.1)',
              color: chatbotOpen ? '#000' : theme.accent,
              border: `1px solid ${theme.accent2}`
            }}
          >
            AI ASSISTANT
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <StatCard label="Total Analyses" value={stats?.totalAnalyses ?? stats?.total ?? '—'} accent={theme.accent} />
        <StatCard label="Active Users" value={stats?.activeUsers ?? '—'} accent={theme.accent3} />
        <StatCard label="Processing" value={stats?.processingTime ?? '—'} accent={theme.accent2} />
        <StatCard label="Usage" value={result?.usage?.remaining != null ? `${result.usage.remaining} left` : '—'} accent={theme.warn} />
      </div>

      {/* AI News Broadcasting Section */}
      <NewsSection isMobile={isMobile} />

      {/* Input + Results */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : (result ? '1fr 1fr' : '1fr'),
        gap: '20px',
        marginBottom: '20px',
        transition: 'all 0.3s'
      }}>
        {/* Input Card */}
        <Card>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => { setMode(m.id); setError(null); setResult(null) }}
                style={{
                  padding: '8px 14px',
                  fontSize: '12px',
                  fontWeight: 600,
                  background: mode === m.id ? theme.accent : 'rgba(255,255,255,0.05)',
                  color: mode === m.id ? '#000' : theme.muted,
                  border: `1px solid ${mode === m.id ? theme.accent : theme.border}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                {m.icon} {m.label}
              </button>
            ))}
          </div>
          <CardTitle>
            {mode === 'text' && 'Text Analysis Input'}
            {mode === 'audio' && 'Audio Analysis'}
            {mode === 'video' && 'Video Analysis'}
          </CardTitle>
          {mode === 'text' && (
            <>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) { e.preventDefault(); analyze(); } }}
                placeholder={t('input_placeholder')}
                style={{
                  width: '100%', minHeight: '160px', resize: 'vertical',
                  background: 'rgba(255,255,255,0.03)', border: `1px solid ${theme.border}`,
                  borderRadius: '8px', color: theme.text, fontFamily: theme.font,
                  fontSize: '13px', padding: '16px', outline: 'none',
                  lineHeight: '1.7', transition: 'border-color 0.15s',
                }}
                onFocus={e => { e.target.style.borderColor = theme.accent; e.target.style.boxShadow = `0 0 0 2px rgba(0,212,255,0.1)` }}
                onBlur={e => { e.target.style.borderColor = theme.border; e.target.style.boxShadow = 'none' }}
              />
              <div style={{ marginTop: '12px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <Button onClick={analyze} disabled={loading || !text.trim()}>
                  {loading ? <><Spinner /> ANALYZING...</> : t('run_analysis')}
                </Button>
                {text && <Button variant="ghost" onClick={() => { setText(''); setResult(null) }}>{t('clear')}</Button>}
                <div style={{ marginLeft: 'auto', color: theme.muted, fontSize: '11px' }}>{text.length} chars</div>
              </div>
            </>
          )}
          {mode === 'audio' && (
            <>
              <div style={{
                width: '100%', minHeight: '120px',
                background: 'rgba(255,255,255,0.03)', border: `2px dashed ${theme.border}`,
                borderRadius: '8px', color: theme.muted, fontFamily: theme.font,
                fontSize: '13px', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={e => { setAudioFile(e.target.files?.[0] || null); setError(null) }}
                  style={{ fontSize: '12px' }}
                />
                {audioFile && <span style={{ color: theme.accent }}>Selected: {audioFile.name}</span>}
              </div>
              <div style={{ marginTop: '12px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <Button onClick={analyze} disabled={loading || !audioFile}>
                  {loading ? <><Spinner /> ANALYZING...</> : t('run_analysis')}
                </Button>
                {audioFile && <Button variant="ghost" onClick={() => { setAudioFile(null); setResult(null) }}>{t('clear')}</Button>}
              </div>
            </>
          )}
          {mode === 'video' && (
            <>
              <div style={{
                width: '100%', minHeight: '120px',
                background: 'rgba(255,255,255,0.03)', border: `2px dashed ${theme.border}`,
                borderRadius: '8px', color: theme.muted, fontFamily: theme.font,
                fontSize: '13px', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}>
                <input
                  type="file"
                  accept="video/*"
                  onChange={e => { setVideoFile(e.target.files?.[0] || null); setError(null) }}
                  style={{ fontSize: '12px' }}
                />
                {videoFile && <span style={{ color: theme.accent }}>Selected: {videoFile.name}</span>}
              </div>
              <div style={{ marginTop: '12px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <Button onClick={analyze} disabled={loading || !videoFile}>
                  {loading ? <><Spinner /> ANALYZING...</> : t('run_analysis')}
                </Button>
                {videoFile && <Button variant="ghost" onClick={() => { setVideoFile(null); setResult(null) }}>{t('clear')}</Button>}
              </div>
            </>
          )}

          {error && (
            <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: theme.danger, fontSize: '12px' }}>
              {t('warning')} {error}
            </div>
          )}
        </Card>

        {/* Results */}
        {result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn 0.4s ease' }}>
            {/* Trust Score */}
            <Card accentColor={rColor}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <CardTitle>{t('trust_score')}</CardTitle>
                <Badge color={rColor}>RISK: {result.risk_level}</Badge>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                <TrustGauge score={result.trust_score} />
                <div style={{ flex: 1 }}>
                  <ScoreBar label="Credibility" value={result.credibility} color={theme.accent} />
                  <ScoreBar label="Emotional Stability" value={result.emotional_stability} color={theme.accent3} />
                  <ScoreBar label="Linguistic Neutrality" value={result.linguistic_neutrality} color={theme.accent2} />
                  <ScoreBar label="Content Reliability" value={result.content_reliability} color={theme.warn} />
                </div>
              </div>
            </Card>

            {/* Key metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Card style={{ padding: '16px' }}>
                <div style={{ fontSize: '10px', letterSpacing: '0.12em', color: theme.muted, marginBottom: '8px' }}>Fake News Probability</div>
                <div style={{ fontFamily: theme.fontDisplay, fontSize: '28px', fontWeight: 900, color: (result.fake_news_probability ?? 0) > 0.5 ? theme.danger : theme.accent3 }}>
                  {Math.round((result.fake_news_probability ?? 0) * 100)}%
                </div>
              </Card>
              <Card style={{ padding: '16px' }}>
                <div style={{ fontSize: '10px', letterSpacing: '0.12em', color: theme.muted, marginBottom: '8px' }}>Manipulation Index</div>
                <div style={{ fontFamily: theme.fontDisplay, fontSize: '28px', fontWeight: 900, color: (result.manipulation_score ?? 0) > 0.5 ? theme.warn : theme.accent3 }}>
                  {Math.round((result.manipulation_score ?? 0) * 100)}%
                </div>
              </Card>
            </div>

            {/* Signals + summary */}
            <Card style={{ padding: '16px' }}>
              <div style={{ fontSize: '10px', letterSpacing: '0.12em', color: theme.muted, marginBottom: '10px' }}>DETECTED SIGNALS</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                {(Array.isArray(result.signals) ? result.signals : []).map((signal, i) => {
                  const getSignalColor = (s) => {
                    if (s.toLowerCase().includes('fake') || s.toLowerCase().includes('manipulation') || s.toLowerCase().includes('risk') || s.toLowerCase().includes('danger')) return theme.danger
                    if (s.toLowerCase().includes('trust') || s.toLowerCase().includes('credibility')) return theme.accent3
                    return theme.accent
                  }
                  return (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '8px 12px', borderRadius: '8px',
                      background: 'rgba(255,255,255,0.03)', border: `1px solid ${theme.border}`,
                      fontSize: '12px', color: theme.text
                    }}>
                      <span style={{ flex: 1 }}>{signal}</span>
                      <div style={{
                        width: '8px', height: '8px', borderRadius: '50%',
                        background: getSignalColor(signal)
                      }} />
                    </div>
                  )
                })}
              </div>
              <div style={{ color: theme.muted, fontSize: '12px', lineHeight: '1.7', fontStyle: 'italic', borderTop: `1px solid ${theme.border}`, paddingTop: '12px' }}>
                "{result.summary || 'No summary available.'}"
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Emotion + Sentiment row */}
      {result && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <Card>
            <CardTitle>{t('emotions_distribution')}</CardTitle>
            <EmotionChart emotions={result.emotions} />
            <div style={{ marginTop: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: theme.muted }}>DOMINANT EMOTION</div>
              <div style={{ fontFamily: theme.fontDisplay, fontSize: '20px', fontWeight: 800, color: theme.accent, marginTop: '4px' }}>
                {result.dominant_emotion || '—'}
              </div>
            </div>
          </Card>
          <Card>
            <CardTitle>{t('sentiment_polarity')}</CardTitle>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
              <div style={{
                fontFamily: theme.fontDisplay, fontSize: '52px', fontWeight: 900,
                color: (result.sentiment ?? 0) >= 0 ? theme.accent3 : theme.danger,
              }}>
                {(result.sentiment ?? 0) >= 0 ? '+' : ''}{(Number(result.sentiment) || 0).toFixed(2)}
              </div>
              <div>
                <div style={{
                  fontFamily: theme.fontDisplay, fontSize: '14px', fontWeight: 800,
                  color: (result.sentiment ?? 0) >= 0.3 ? theme.accent3 : (result.sentiment ?? 0) <= -0.3 ? theme.danger : theme.warn,
                }}>
                  {(result.sentiment ?? 0) >= 0.3 ? 'POSITIVE' : (result.sentiment ?? 0) <= -0.3 ? 'NEGATIVE' : 'NEUTRAL'}
                </div>
                <div style={{ color: theme.muted, fontSize: '11px', marginTop: '4px' }}>Sentiment polarity score</div>
              </div>
            </div>
            {/* Polarity slider */}
            <div style={{ position: 'relative', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
              <div style={{ position: 'absolute', left: 0, width: '50%', height: '100%', background: `linear-gradient(to right, ${theme.danger}, transparent)`, borderRadius: '4px 0 0 4px', opacity: 0.4 }} />
              <div style={{ position: 'absolute', right: 0, width: '50%', height: '100%', background: `linear-gradient(to left, ${theme.accent3}, transparent)`, borderRadius: '0 4px 4px 0', opacity: 0.4 }} />
              <div style={{
                position: 'absolute', top: '50%', transform: 'translateY(-50%)',
                left: `calc(${((Number(result.sentiment) || 0) + 1) / 2 * 100}% - 6px)`,
                width: '12px', height: '12px', borderRadius: '50%',
                background: theme.accent, boxShadow: `0 0 12px ${theme.accent}`,
                transition: 'left 0.8s ease',
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '10px', color: theme.muted }}>
              <span>-1.0 Negative</span><span>Positive +1.0</span>
            </div>
          </Card>
        </div>
      )}

      {/* Insights Section */}
      {result && (
        <Card style={{ marginBottom: '20px' }}>
          <CardTitle>AI Insights & Recommendations</CardTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
            {/* Trust Assessment */}
            <div style={{ padding: '16px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: `1px solid ${theme.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '16px' }}>
                  {/* no icon */}
                </span>
                <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', color: theme.muted, textTransform: 'uppercase' }}>
                  Trust Assessment
                </div>
              </div>
              <div style={{ fontSize: '14px', color: theme.text, marginBottom: '8px' }}>
                {result.trust_score >= 70 ? 'Content appears trustworthy with strong credibility indicators.' :
                 result.trust_score >= 40 ? 'Moderate trust level - verify additional sources.' :
                 'Low trust score - exercise caution and cross-reference information.'}
              </div>
              <div style={{ fontSize: '11px', color: theme.muted }}>
                Risk Level: <span style={{ color: rColor, fontWeight: 600 }}>{result.risk_level}</span>
              </div>
            </div>

            {/* Manipulation Analysis */}
            <div style={{ padding: '16px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: `1px solid ${theme.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '16px' }}>
                  {/* no icon */}
                </span>
                <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', color: theme.muted, textTransform: 'uppercase' }}>
                  Content Integrity
                </div>
              </div>
              <div style={{ fontSize: '14px', color: theme.text, marginBottom: '8px' }}>
                {(result.manipulation_score ?? 0) > 0.5 ? 'High manipulation indicators detected - content may be intentionally misleading.' :
                 (result.fake_news_probability ?? 0) > 0.5 ? 'Potential misinformation - verify facts independently.' :
                 'Content appears authentic with low manipulation risk.'}
              </div>
              <div style={{ fontSize: '11px', color: theme.muted }}>
                Fake News Risk: <span style={{ color: (result.fake_news_probability ?? 0) > 0.5 ? theme.danger : theme.accent3, fontWeight: 600 }}>
                  {Math.round((result.fake_news_probability ?? 0) * 100)}%
                </span>
              </div>
            </div>

            {/* Emotional Analysis */}
            <div style={{ padding: '16px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: `1px solid ${theme.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '16px' }}>
                  {Math.abs(result.sentiment ?? 0) > 0.3 ? '💭' : '😐'}
                </span>
                <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', color: theme.muted, textTransform: 'uppercase' }}>
                  Emotional Impact
                </div>
              </div>
              <div style={{ fontSize: '14px', color: theme.text, marginBottom: '8px' }}>
                {Math.abs(result.sentiment ?? 0) > 0.3 ?
                  `Strong ${result.sentiment > 0 ? 'positive' : 'negative'} emotional tone detected. Content may influence reader sentiment significantly.` :
                  'Neutral emotional presentation - balanced and objective tone.'}
              </div>
              <div style={{ fontSize: '11px', color: theme.muted }}>
                Dominant Emotion: <span style={{ color: theme.accent, fontWeight: 600 }}>{result.dominant_emotion || 'neutral'}</span>
              </div>
            </div>

            {/* Recommendations */}
            <div style={{ padding: '16px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: `1px solid ${theme.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '16px' }}>💡</span>
                <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', color: theme.muted, textTransform: 'uppercase' }}>
                  Recommendations
                </div>
              </div>
              <div style={{ fontSize: '14px', color: theme.text, marginBottom: '8px' }}>
                {result.trust_score < 40 ? 'Cross-reference with multiple reliable sources before sharing.' :
                 result.fake_news_probability > 0.5 ? 'Verify claims through fact-checking services.' :
                 'Content appears reliable - monitor for updates or related developments.'}
              </div>
              <div style={{ fontSize: '11px', color: theme.muted }}>
                Action: <span style={{ color: theme.accent2, fontWeight: 600 }}>
                  {result.trust_score < 40 ? 'High Caution' : result.fake_news_probability > 0.5 ? 'Fact Check' : 'Monitor'}
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}

      </div>

      {/* Footer */}
      <Footer />

      {/* Chatbot */}
      <Chatbot 
        isOpen={chatbotOpen} 
        onClose={() => setChatbotOpen(false)}
        analysisResult={result}
      />
    </div>
  )
}
