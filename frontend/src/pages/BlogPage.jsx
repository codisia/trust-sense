import { Link } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'

export default function BlogPage() {
  const { theme } = useTheme()

  return (
    <div style={{ minHeight: '60vh', padding: '48px 24px', maxWidth: '720px', margin: '0 auto' }}>
      <Link to="/" style={{ color: theme.accent, fontSize: '14px', marginBottom: '24px', display: 'inline-block' }}>← Back to Home</Link>
      <h1 style={{ fontFamily: theme.fontDisplay, fontSize: '24px', fontWeight: 800, marginBottom: '16px', color: theme.text }}>Blog</h1>
      <p style={{ color: theme.muted, lineHeight: 1.8 }}>Updates and articles coming soon.</p>
    </div>
  )
}
