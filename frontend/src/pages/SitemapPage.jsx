import { Link } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'

const PAGES = [
  { path: '/', label: 'Home' },
  { path: '/login', label: 'Login' },
  { path: '/pricing', label: 'Pricing' },
  { path: '/docs', label: 'API Documentation' },
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/dashboard/powerbi', label: 'Power BI Dashboard' },
  { path: '/history', label: 'Analysis History' },
  { path: '/insights', label: 'Insights' },
  { path: '/admin', label: 'Admin' },
  { path: '/privacy', label: 'Privacy Policy' },
  { path: '/terms', label: 'Terms of Service' },
  { path: '/security', label: 'Security' },
  { path: '/license', label: 'License' },
  { path: '/status', label: 'System Status' },
]

export default function SitemapPage() {
  const { theme } = useTheme()

  return (
    <div style={{ minHeight: '60vh', padding: '48px 24px', maxWidth: '560px', margin: '0 auto' }}>
      <Link to="/" style={{ color: theme.accent, fontSize: '14px', marginBottom: '24px', display: 'inline-block' }}>← Back to Home</Link>
      <h1 style={{ fontFamily: theme.fontDisplay, fontSize: '24px', fontWeight: 800, marginBottom: '20px', color: theme.text }}>Sitemap</h1>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {PAGES.map(({ path, label }) => (
          <li key={path} style={{ marginBottom: '10px' }}>
            <Link to={path} style={{ color: theme.muted, textDecoration: 'none', fontSize: '14px' }} onMouseEnter={e => { e.target.style.color = theme.accent }} onMouseLeave={e => { e.target.style.color = theme.muted }}>{label}</Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
