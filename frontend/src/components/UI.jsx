import { useTheme } from '../context/ThemeContext'
import { scoreColor, riskColor } from '../theme'
import { RadialBarChart, RadialBar, PieChart, Pie, Cell } from 'recharts'
import { useState, useEffect } from 'react'

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, style, accentColor }) {
  const { theme } = useTheme()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <div style={{
      background: theme.card,
      border: `1px solid ${theme.border}`,
      borderRadius: '12px',
      padding: isMobile ? '16px' : '24px',
      borderTop: accentColor ? `2px solid ${accentColor}` : `1px solid ${theme.border}`,
      animation: 'fadeIn 0.3s ease',
      ...style,
    }}>
      {children}
    </div>
  )
}

// ─── CardTitle ────────────────────────────────────────────────────────────────
export function CardTitle({ children }) {
  const { theme } = useTheme()
  return (
    <div style={{
      fontFamily: theme.fontDisplay,
      fontSize: '11px',
      letterSpacing: '0.15em',
      color: theme.muted,
      textTransform: 'uppercase',
      marginBottom: '16px',
    }}>
      {children}
    </div>
  )
}

// ─── Button ───────────────────────────────────────────────────────────────────
export function Button({ children, onClick, variant = 'primary', disabled, style, size = 'md' }) {
  const { theme } = useTheme()
  const sizes = { sm: '6px 14px', md: '10px 24px', lg: '14px 32px' }
  const base = {
    padding: sizes[size],
    borderRadius: '8px',
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: theme.font,
    fontSize: size === 'sm' ? '11px' : '12px',
    letterSpacing: '0.08em',
    fontWeight: 700,
    transition: 'all 0.15s',
    opacity: disabled ? 0.4 : 1,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    ...style,
  }
  const variants = {
    primary: { background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`, color: '#000' },
    ghost: { background: 'transparent', border: `1px solid ${theme.border}`, color: theme.muted },
    outline: { background: `rgba(0,212,255,0.08)`, color: theme.accent, border: `1px solid rgba(0,212,255,0.25)` },
    danger: { background: `rgba(239,68,68,0.1)`, color: theme.danger, border: `1px solid rgba(239,68,68,0.3)` },
  }
  return (
    <button onClick={onClick} disabled={disabled} style={{ ...base, ...variants[variant] }}>
      {children}
    </button>
  )
}

// ─── Badge ────────────────────────────────────────────────────────────────────
export function Badge({ children, color }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '3px 10px',
      borderRadius: '20px',
      fontSize: '10px',
      letterSpacing: '0.1em',
      fontWeight: 700,
      background: `${color}20`,
      color,
      border: `1px solid ${color}40`,
    }}>
      {children}
    </span>
  )
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
export function Spinner({ size = 16 }) {
  const { theme } = useTheme()
  return (
    <div style={{
      display: 'inline-block',
      width: size,
      height: size,
      border: `2px solid rgba(0,212,255,0.3)`,
      borderTop: `2px solid ${theme.accent}`,
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
      flexShrink: 0,
    }} />
  )
}

// ─── Trust Gauge ──────────────────────────────────────────────────────────────
export function TrustGauge({ score }) {
  const { theme } = useTheme()
  const s = Number(score)
  const safeScore = Number.isFinite(s) ? Math.min(100, Math.max(0, s)) : 0
  const color = scoreColor(safeScore)
  const label = safeScore >= 70 ? 'HIGH TRUST' : safeScore >= 40 ? 'MODERATE' : 'LOW TRUST'
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <RadialBarChart width={180} height={180} cx={90} cy={90} innerRadius={60} outerRadius={80} startAngle={90} endAngle={-270} data={[{ value: safeScore, fill: color }]}>
          <RadialBar dataKey="value" cornerRadius={8} background={{ fill: 'rgba(255,255,255,0.04)' }} />
        </RadialBarChart>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
          <div style={{ fontFamily: theme.fontDisplay, fontSize: '32px', fontWeight: 900, color, lineHeight: 1 }}>{Math.round(safeScore)}</div>
          <div style={{ fontSize: '9px', letterSpacing: '0.15em', color: theme.muted }}>/100</div>
        </div>
      </div>
      <div style={{ marginTop: '8px' }}><Badge color={color}>{label}</Badge></div>
    </div>
  )
}

// ─── Score Bar ────────────────────────────────────────────────────────────────
export function ScoreBar({ label, value, color }) {
  const { theme } = useTheme()
  const v = Number(value)
  const pct = Number.isFinite(v) ? Math.min(100, Math.max(0, Math.round(v * 100))) : 0
  return (
    <div style={{ marginBottom: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ color: theme.muted, fontSize: '11px', letterSpacing: '0.06em' }}>{label}</span>
        <span style={{ fontFamily: theme.fontDisplay, fontWeight: 700, fontSize: '12px', color }}>{pct}%</span>
      </div>
      <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '4px', transition: 'width 1s ease' }} />
      </div>
    </div>
  )
}

// ─── Emotion Chart ────────────────────────────────────────────────────────────
export function EmotionChart({ emotions }) {
  const { theme } = useTheme()
  const EMOTION_COLORS = [theme.accent, theme.accent2, theme.accent3, theme.warn, theme.danger, '#ec4899']
  const safe = emotions && typeof emotions === 'object' ? emotions : {}
  const data = Object.entries(safe).map(([name, value]) => ({ name, value: Math.round(Number(value) * 100) }))
  if (data.length === 0) {
    return <div style={{ color: theme.muted, fontSize: '12px' }}>No emotion data</div>
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
      <PieChart width={120} height={120}>
        <Pie data={data} cx={55} cy={55} innerRadius={30} outerRadius={55} dataKey="value">
          {data.map((_, i) => <Cell key={i} fill={EMOTION_COLORS[i % EMOTION_COLORS.length]} />)}
        </Pie>
      </PieChart>
      <div style={{ flex: 1 }}>
        {data.map((d, i) => (
          <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: EMOTION_COLORS[i % EMOTION_COLORS.length], flexShrink: 0 }} />
            <div style={{ flex: 1, color: theme.muted, fontSize: '11px' }}>{d.name}</div>
            <div style={{ fontFamily: theme.fontDisplay, fontSize: '13px', fontWeight: 700 }}>{d.value}%</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Input ────────────────────────────────────────────────────────────────────
export function Input({ label, type = 'text', value, onChange, placeholder, style }) {
  const { theme } = useTheme()
  return (
    <div style={{ marginBottom: '16px' }}>
      {label && <label style={{ display: 'block', fontSize: '11px', letterSpacing: '0.1em', color: theme.muted, marginBottom: '6px' }}>{label}</label>}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{
          width: '100%',
          background: 'rgba(255,255,255,0.03)',
          border: `1px solid ${theme.border}`,
          borderRadius: '8px',
          color: theme.text,
          fontFamily: theme.font,
          fontSize: '13px',
          padding: '12px 16px',
          outline: 'none',
          transition: 'border-color 0.15s, box-shadow 0.15s',
          ...style,
        }}
        onFocus={e => { e.target.style.borderColor = theme.accent; e.target.style.boxShadow = `0 0 0 2px rgba(0,212,255,0.1)` }}
        onBlur={e => { e.target.style.borderColor = theme.border; e.target.style.boxShadow = 'none' }}
      />
    </div>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
export function StatCard({ label, value, sub, accent }) {
  const { theme } = useTheme()
  return (
    <div style={{
      background: theme.card,
      border: `1px solid ${theme.border}`,
      borderTop: `2px solid ${accent}`,
      borderRadius: '12px',
      padding: '20px',
    }}>
      <div style={{ fontFamily: theme.fontDisplay, fontSize: '36px', fontWeight: 900, letterSpacing: '-0.03em', color: accent, lineHeight: 1, marginBottom: '4px' }}>
        {value}
      </div>
      <div style={{ color: theme.muted, fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</div>
      {sub && <div style={{ color: theme.muted, fontSize: '11px', marginTop: '6px' }}>{sub}</div>}
    </div>
  )
}
