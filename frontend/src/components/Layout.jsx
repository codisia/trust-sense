import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useLanguage } from '../context/LanguageContext'
import { useLiveSocket } from '../hooks/useLiveSocket'
import { useState, useEffect } from 'react'
import Footer from './Footer'

// NAV items will be computed inside the component once translations are available

export default function Layout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const { theme, isDark, toggleTheme } = useTheme()
  const { connected: liveConnected } = useLiveSocket()
  const { lang, setLang, t } = useLanguage()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth >= 768) setMobileMenuOpen(false)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const NAV_ITEMS = [
    { path: '/', icon: '', label: t('home') },
    { path: '/dashboard', icon: '', label: t('dashboard') },
    { path: '/dashboard/powerbi', icon: '', label: t('powerbi_dashboard') },
    { path: '/history', icon: '', label: t('history') },
    { path: '/insights', icon: '', label: t('insights') },
    { path: '/admin', icon: '', label: t('admin_panel'), requiredRole: 'admin' },
    { path: '/payment', icon: '', label: t('payment') },
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: theme.bg }}>
      {/* Mobile Menu Button */}
      {isMobile && (
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{
            position: 'fixed',
            top: '16px',
            left: '16px',
            zIndex: 101,
            background: theme.surface,
            border: `1px solid ${theme.border}`,
            borderRadius: '8px',
            padding: '8px',
            cursor: 'pointer',
            color: theme.text,
            fontSize: '16px',
          }}
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
      )}

      {/* Sidebar */}
      <aside style={{
        width: isMobile ? '280px' : '220px',
        background: theme.surface,
        borderRight: `1px solid ${theme.border}`,
        display: 'flex',
        flexDirection: 'column',
        position: isMobile ? 'fixed' : 'fixed',
        top: 0,
        left: isMobile ? (mobileMenuOpen ? 0 : '-280px') : 0,
        bottom: 0,
        zIndex: 100,
        transition: 'left 0.3s ease',
        boxShadow: isMobile && mobileMenuOpen ? '2px 0 8px rgba(0,0,0,0.3)' : 'none',
      }}>
        {/* Logo */}
        <div style={{ padding: '28px 24px', borderBottom: `1px solid ${theme.border}` }}>
          <div style={{
            fontFamily: theme.fontDisplay,
            fontSize: '18px',
            fontWeight: 800,
            letterSpacing: '0.05em',
            background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>TRUST SENSE</div>
          <div style={{ color: theme.muted, fontSize: '10px', letterSpacing: '0.2em', marginTop: '2px' }}>AI INTELLIGENCE PLATFORM</div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, paddingTop: '16px' }}>
          {NAV_ITEMS.filter(item => {
            // Filter: show if no role required, OR if user has required role
            if (!item.requiredRole) return true
            return user?.role === item.requiredRole
          }).map(item => {
            const active = location.pathname === item.path
            return (
              <div
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '11px 24px',
                  cursor: 'pointer',
                  color: active ? theme.accent : theme.muted,
                  borderLeft: active ? `2px solid ${theme.accent}` : '2px solid transparent',
                  background: active ? 'rgba(0,212,255,0.05)' : 'transparent',
                  transition: 'all 0.15s',
                  fontSize: '12px',
                  letterSpacing: '0.05em',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.color = theme.text }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.color = theme.muted }}
              >
                <span style={{ fontSize: '16px' }}>{item.icon}</span>
                <span>{item.label}</span>
              </div>
            )
          })}
        </nav>

        {/* User */}
        <div style={{ padding: '20px 24px', borderTop: `1px solid ${theme.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <span style={{ fontSize: '10px', color: liveConnected ? theme.accent3 : theme.muted, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: liveConnected ? theme.accent3 : theme.muted }} />
              {liveConnected ? t('live') : t('offline')}
            </span>
            <button
              type="button"
              onClick={toggleTheme}
              title={isDark ? t('switch_to_light') : t('switch_to_dark')}
              style={{ padding: '4px 8px', borderRadius: '6px', border: `1px solid ${theme.border}`, background: 'transparent', color: theme.muted, fontSize: '10px', cursor: 'pointer' }}
            >
              {isDark ? t('switch_to_light') : t('switch_to_dark')}
            </button>
            <select
              value={lang}
              onChange={e => setLang(e.target.value)}
              style={{ marginLeft: '8px', padding: '4px 6px', fontSize: '10px', borderRadius: '6px', border: `1px solid ${theme.border}`, background: theme.surface, color: theme.text, cursor: 'pointer' }}
            >
              <option value="en">EN</option>
              <option value="fr">FR</option>
              <option value="ar">AR</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px',
              background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '14px', fontWeight: 800, color: '#000', flexShrink: 0,
            }}>
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: theme.text }}>{user?.username || 'Guest'}</div>
              <div style={{ fontSize: '10px', color: theme.muted }}>{user?.role || 'viewer'}</div>
            </div>
          </div>
          <button
            onClick={logout}
            style={{
              width: '100%', padding: '7px', borderRadius: '6px',
              background: 'transparent', border: `1px solid ${theme.border}`,
              color: theme.muted, fontSize: '11px', cursor: 'pointer',
              fontFamily: theme.font, letterSpacing: '0.08em',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.target.style.borderColor = theme.danger; e.target.style.color = theme.danger }}
            onMouseLeave={e => { e.target.style.borderColor = theme.border; e.target.style.color = theme.muted }}
          >
            LOGOUT
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{
        marginLeft: isMobile ? 0 : '220px',
        flex: 1,
        padding: isMobile ? '16px' : '32px',
        display: 'flex',
        flexDirection: 'column',
        paddingTop: isMobile ? '60px' : '32px', // Account for mobile menu button
      }}>
        <div style={{ flex: 1 }}>{children}</div>
        <Footer />
      </main>

      {/* Mobile Menu Overlay */}
      {isMobile && mobileMenuOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 99,
          }}
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  )
}
