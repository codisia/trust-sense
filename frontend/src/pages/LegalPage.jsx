import { useLocation, Link } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'

const CONTENT = {
  privacy: { title: 'Privacy Policy', body: 'Trust Sense collects and processes data only as necessary to provide analysis services. We do not sell your data. Analysis inputs and results may be stored for product improvement and compliance.' },
  terms: { title: 'Terms of Service', body: 'By using Trust Sense you agree to use the service for lawful purposes only. API usage is subject to rate limits. We reserve the right to suspend access for abuse.' },
  security: { title: 'Security', body: 'We use industry-standard encryption and secure APIs. API keys and credentials are never logged. Report vulnerabilities to security@trustsense.example.com.' },
  license: { title: 'License', body: 'Trust Sense Enterprise is licensed for your organization. Usage is subject to your agreement. Contact sales for licensing questions.' },
}

export default function LegalPage() {
  const topic = useLocation().pathname.replace(/^\//, '') || 'privacy'
  const { theme } = useTheme()
  const page = CONTENT[topic] || CONTENT.privacy

  return (
    <div style={{ minHeight: '60vh', padding: '48px 24px', maxWidth: '720px', margin: '0 auto' }}>
      <Link to="/" style={{ color: theme.accent, fontSize: '14px', marginBottom: '24px', display: 'inline-block' }}>← Back to Home</Link>
      <h1 style={{ fontFamily: theme.fontDisplay, fontSize: '28px', fontWeight: 800, marginBottom: '16px', color: theme.text }}>{page.title}</h1>
      <p style={{ color: theme.muted, lineHeight: 1.8, fontSize: '15px' }}>{page.body}</p>
    </div>
  )
}
