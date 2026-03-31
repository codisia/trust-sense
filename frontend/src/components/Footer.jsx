import { Link, useLocation } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'

const linkStyle = (theme) => ({
  color: theme.muted,
  textDecoration: 'none',
  fontSize: '13px',
  transition: 'color 0.2s',
})

export default function Footer() {
  const { theme, isDark, toggleTheme } = useTheme()

  const sections = [
    {
      title: 'Product',
      links: [
        { text: 'Features', href: '/#features', external: false },
        { text: 'Pricing', href: '/pricing', external: false },
        { text: 'Dashboard', href: '/dashboard', external: false },
        { text: 'API', href: '/docs', external: false },
      ],
    },
    {
      title: 'Documentation',
      links: [
        { text: 'Getting Started', href: '/docs', external: false },
        { text: 'API Reference', href: '/docs', external: false },
        { text: 'Integration Guide', href: '/docs', external: false },
        { text: 'FAQ', href: '/docs', external: false },
      ],
    },
    {
      title: 'Company',
      links: [
        { text: 'About Us', href: '/#about', external: false },
        { text: 'Blog', href: '/blog', external: false },
        { text: 'Contact', href: '/#contact', external: false },
        { text: 'Careers', href: '/#careers', external: false },
      ],
    },
    {
      title: 'Legal',
      links: [
        { text: 'Privacy Policy', href: '/privacy', external: false },
        { text: 'Terms of Service', href: '/terms', external: false },
        { text: 'Security', href: '/security', external: false },
        { text: 'License', href: '/license', external: false },
      ],
    },
  ]

  return (
    <footer style={{
      background: theme.surface,
      borderTop: `1px solid ${theme.border}`,
      padding: '48px 40px 24px',
      marginTop: '80px',
    }}>
      {/* Main Footer Grid */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '40px',
        marginBottom: '40px',
      }}>
        {/* Brand Column */}
        <div>
          <div style={{
            fontFamily: theme.fontDisplay,
            fontSize: '18px',
            fontWeight: 800,
            letterSpacing: '0.05em',
            background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '12px',
          }}>TRUST SENSE</div>
          <p style={{
            color: theme.muted,
            fontSize: '13px',
            lineHeight: '1.6',
            marginBottom: '16px',
          }}>
            Enterprise-grade AI for multimodal content analysis. Verify authenticity, detect manipulation, and understand psychological impact.
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <a href="#" title="GitHub" style={{
              padding: '6px 10px', borderRadius: '6px',
              background: theme.bg, color: theme.text, textDecoration: 'none',
              transition: 'all 0.2s', fontSize: '14px',
            }} onMouseEnter={e => { e.target.style.background = theme.accent; e.target.style.color = '#000' }}
               onMouseLeave={e => { e.target.style.background = theme.bg; e.target.style.color = theme.text }}>
              GitHub
            </a>
            <a href="#" title="Twitter" style={{
              padding: '6px 10px', borderRadius: '6px',
              background: theme.bg, color: theme.text, textDecoration: 'none',
              transition: 'all 0.2s', fontSize: '14px',
            }} onMouseEnter={e => { e.target.style.background = theme.accent; e.target.style.color = '#000' }}
               onMouseLeave={e => { e.target.style.background = theme.bg; e.target.style.color = theme.text }}>
              Twitter
            </a>
            <a href="#" title="LinkedIn" style={{
              padding: '6px 10px', borderRadius: '6px',
              background: theme.bg, color: theme.text, textDecoration: 'none',
              transition: 'all 0.2s', fontSize: '14px',
            }} onMouseEnter={e => { e.target.style.background = theme.accent; e.target.style.color = '#000' }}
               onMouseLeave={e => { e.target.style.background = theme.bg; e.target.style.color = theme.text }}>
              LinkedIn
            </a>
          </div>
        </div>

        {/* Link Sections */}
        {sections.map(section => (
          <div key={section.title}>
            <h3 style={{
              fontSize: '13px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: theme.text,
              marginBottom: '16px',
              textTransform: 'uppercase',
            }}>{section.title}</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {section.links.map(link => (
                <li key={link.text + link.href} style={{ marginBottom: '10px' }}>
                  {link.href.startsWith('/#') ? (
                    <a href={link.href} style={linkStyle(theme)} onMouseEnter={e => { e.target.style.color = theme.accent }} onMouseLeave={e => { e.target.style.color = theme.muted }}>{link.text}</a>
                  ) : (
                    <Link to={link.href} style={linkStyle(theme)} onMouseEnter={e => { e.target.style.color = theme.accent }} onMouseLeave={e => { e.target.style.color = theme.muted }}>{link.text}</Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom Bar */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        paddingTop: '24px',
        borderTop: `1px solid ${theme.border}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        <p style={{
          color: theme.muted,
          fontSize: '12px',
          margin: 0,
        }}>
          © 2026 Trust Sense. All rights reserved.
        </p>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <Link to="/status" style={{ color: theme.muted, fontSize: '12px', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => { e.target.style.color = theme.accent }} onMouseLeave={e => { e.target.style.color = theme.muted }}>System Status</Link>
          <Link to="/sitemap" style={{ color: theme.muted, fontSize: '12px', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => { e.target.style.color = theme.accent }} onMouseLeave={e => { e.target.style.color = theme.muted }}>Sitemap</Link>
          {/* Theme selector dropdown */}
          <select
            value={theme === theme.dark ? 'dark' : 'light'}
            onChange={e => {
              if (e.target.value === 'dark') toggleTheme()
              else if (isDark) toggleTheme()
            }}
            style={{
              padding: '4px 8px',
              borderRadius: '6px',
              border: `1px solid ${theme.border}`,
              background: theme.surface,
              color: theme.text,
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
      </div>
    </footer>
  )
}
