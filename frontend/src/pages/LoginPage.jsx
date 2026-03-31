import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Input, Button, Spinner } from '../components/UI'
import AnimatedBackground3D from '../components/AnimatedBackground3D'
import { useTheme } from '../context/ThemeContext'

export default function LoginPage() {
  const { theme } = useTheme()
  const [mode, setMode] = useState('login') // login | register
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login, register, loading, useSupabaseAuth, loginWithGoogle, loginWithLinkedIn, loginWithX } = useAuth()
  const navigate = useNavigate()
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleSubmit = async () => {
    setError('')
    if (!email || !password) { setError('Please fill in all fields'); return }
    if (mode === 'register' && !username) { setError('Username required'); return }

    const result = mode === 'login'
      ? await login(email, password)
      : await register(email, username, password)

    if (result.success) navigate('/dashboard')
    else setError(result.error)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: theme.bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: theme.font,
      padding: isMobile ? '20px 10px' : '20px',
      position: 'relative',
    }}>
      <AnimatedBackground3D />

      {/* Content wrapper */}
      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: isMobile ? '100%' : '420px' }}>

      <button
        onClick={() => navigate('/')}
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          zIndex: 10,
          background: 'transparent',
          border: `1px solid ${theme.border}`,
          color: theme.muted,
          padding: '8px 14px',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '11px',
          letterSpacing: '0.08em',
          fontWeight: 600,
          fontFamily: theme.font,
          transition: 'all 0.3s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = theme.accent
          e.currentTarget.style.color = theme.accent
          e.currentTarget.style.background = `rgba(0,212,255,0.08)`
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = theme.border
          e.currentTarget.style.color = theme.muted
          e.currentTarget.style.background = 'transparent'
        }}
      >
        ← HOME
      </button>

      <div style={{
        width: '100%', maxWidth: '420px',
        background: theme.card,
        border: `1px solid ${theme.border}`,
        borderRadius: '16px',
        padding: isMobile ? '30px 20px' : '40px',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            fontFamily: theme.fontDisplay,
            fontSize: '24px', fontWeight: 900, letterSpacing: '0.05em',
            background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>TRUST SENSE</div>
          <div style={{ color: theme.muted, fontSize: '11px', letterSpacing: '0.2em', marginTop: '4px' }}>AI INTELLIGENCE PLATFORM</div>
        </div>

        {/* Supabase required notice */}
        {!useSupabaseAuth && (
          <div style={{
            padding: '12px 16px', marginBottom: '20px',
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            borderRadius: '8px',
            color: theme.warn,
            fontSize: '12px',
            lineHeight: 1.5,
          }}>
            <strong>Supabase required.</strong> Add to <code style={{ background: 'rgba(0,0,0,0.2)', padding: '2px 6px', borderRadius: '4px' }}>.env</code>:<br />
            <code style={{ fontSize: '11px' }}>VITE_SUPABASE_URL</code>, <code style={{ fontSize: '11px' }}>VITE_SUPABASE_ANON_KEY</code><br />
            Create a project at <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" style={{ color: theme.accent }}>supabase.com</a> and enable Email auth.
          </div>
        )}

        {/* Mode toggle */}
        <div style={{
          display: 'flex', background: 'rgba(255,255,255,0.03)',
          border: `1px solid ${theme.border}`, borderRadius: '8px',
          padding: '4px', marginBottom: '28px',
        }}>
          {['login', 'register'].map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setError('') }}
              style={{
                flex: 1, padding: '8px', border: 'none', borderRadius: '6px',
                background: mode === m ? `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})` : 'transparent',
                color: mode === m ? '#000' : theme.muted,
                fontFamily: theme.font, fontSize: '11px', letterSpacing: '0.1em',
                fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {m.toUpperCase()}
            </button>
          ))}
        </div>

        <Input label="EMAIL" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
        {mode === 'register' && (
          <Input label="USERNAME" value={username} onChange={e => setUsername(e.target.value)} placeholder="analyst_name" />
        )}
        <Input label="PASSWORD" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />

        {error && (
          <div style={{
            padding: '10px 14px', background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px',
            color: theme.danger, fontSize: '12px', marginBottom: '16px',
          }}>
            ⚠ {error}
          </div>
        )}

        <Button onClick={handleSubmit} disabled={loading || !useSupabaseAuth} style={{ width: '100%', justifyContent: 'center', padding: '14px' }}>
          {loading ? <><Spinner /> {mode === 'login' ? 'SIGNING IN...' : 'CREATING ACCOUNT...'}</> : !useSupabaseAuth ? 'CONFIGURE SUPABASE FIRST' : mode === 'login' ? '→ SIGN IN' : '→ CREATE ACCOUNT'}
        </Button>

        {/* Social Login Buttons */}
        {useSupabaseAuth && (
        <div style={{ marginTop: '20px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '16px',
          }}>
            <div style={{ flex: 1, height: '1px', background: theme.border }} />
            <span style={{ fontSize: '11px', color: theme.muted, letterSpacing: '0.08em' }}>OR</span>
            <div style={{ flex: 1, height: '1px', background: theme.border }} />
          </div>
          <button
            onClick={async () => {
              setError('')
              const res = await loginWithGoogle()
              if (res.success) navigate('/dashboard')
              else if (res.error) setError(res.error)
            }}
            style={{
              width: '100%',
              padding: '12px',
              border: `1px solid ${theme.border}`,
              borderRadius: '8px',
              background: 'transparent',
              color: theme.text,
              fontSize: '12px',
              letterSpacing: '0.08em',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.3s',
              fontFamily: theme.font,
              marginBottom: '10px',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = theme.accent
              e.currentTarget.style.background = `rgba(0,212,255,0.08)`
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = theme.border
              e.currentTarget.style.background = 'transparent'
            }}
          >
            <span>○</span> SIGN IN WITH GOOGLE
          </button>
          <button
            onClick={async () => {
              setError('')
              const res = await loginWithLinkedIn()
              if (res.success) navigate('/dashboard')
              else if (res.error) setError(res.error)
            }}
            style={{
              width: '100%',
              padding: '12px',
              border: `1px solid ${theme.border}`,
              borderRadius: '8px',
              background: 'transparent',
              color: theme.text,
              fontSize: '12px',
              letterSpacing: '0.08em',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.3s',
              fontFamily: theme.font,
              marginBottom: '10px',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = theme.accent
              e.currentTarget.style.background = `rgba(10,102,194,0.08)`
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = theme.border
              e.currentTarget.style.background = 'transparent'
            }}
          >
            <span>in</span> SIGN IN WITH LINKEDIN
          </button>
          <button
            onClick={async () => {
              setError('')
              const res = await loginWithX()
              if (res.success) navigate('/dashboard')
              else if (res.error) setError(res.error)
            }}
            style={{
              width: '100%',
              padding: '12px',
              border: `1px solid ${theme.border}`,
              borderRadius: '8px',
              background: 'transparent',
              color: theme.text,
              fontSize: '12px',
              letterSpacing: '0.08em',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.3s',
              fontFamily: theme.font,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = theme.accent
              e.currentTarget.style.background = `rgba(29,155,209,0.08)`
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = theme.border
              e.currentTarget.style.background = 'transparent'
            }}
          >
            <span>𝕏</span> SIGN IN WITH X
          </button>
        </div>
        )}
      </div>
      </div>
    </div>
  )
}
