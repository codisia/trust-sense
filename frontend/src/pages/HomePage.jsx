import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/UI'
import AnimatedBackground3D from '../components/AnimatedBackground3D'
import { useTheme } from '../context/ThemeContext'
import { useState, useEffect } from 'react'

const FEATURES = [
  { icon: '', title: 'Text Analysis', desc: 'Sentiment, credibility, fake news detection' },
  { icon: '', title: 'Audio Intelligence', desc: 'Speech recognition & emotion detection' },
  { icon: '', title: 'Video Analysis', desc: 'Deepfake detection & facial analysis' },
  { icon: '', title: 'Image Intelligence', desc: 'OCR & visual understanding' },
]

const FOUNDERS = [
  {
    name: 'Hassene Hamrouni',
    role: 'Developer & Co-Founder',
    bio: 'Full-stack engineer. Building scalable AI systems.',
    image: '👨‍💻',
  },
  {
    name: 'Fedia Jlassi',
    role: 'Designer & Co-Founder',
    bio: 'UX/UI visionary. Crafting beautiful experiences.',
    image: '🎨',
  },
]

const TESTIMONIALS = [
  { name: 'Michael Zhang', role: 'Content Moderator', text: 'Game changer for our team.', avatar: '👨‍💼' },
  { name: 'Emma Johnson', role: 'CEO', text: 'Turnaround time cut by 70%.', avatar: '👩‍💼' },
  { name: 'David Kim', role: 'Security Lead', text: 'Enterprise-grade reliability.', avatar: '👨‍💻' },
]

export default function HomePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { theme } = useTheme()
  const [counters, setCounters] = useState({ analyses: 0, users: 0, accuracy: 0 })
  const [openFaq, setOpenFaq] = useState(null)
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    const duration = 2500
    const start = Date.now()
    const targets = { analyses: 10000, users: 5000, accuracy: 99 }

    const interval = setInterval(() => {
      const progress = Math.min((Date.now() - start) / duration, 1)
      const eased = 1 - (1 - progress) * (1 - progress)
      setCounters({
        analyses: Math.floor(targets.analyses * eased),
        users: Math.floor(targets.users * eased),
        accuracy: Math.floor(targets.accuracy * eased),
      })
      if (progress === 1) clearInterval(interval)
    }, 16)

    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{
      background: theme.bg,
      fontFamily: theme.font,
      color: theme.text,
      width: '100%',
      position: 'relative',
    }}>
      <AnimatedBackground3D />
      
      {/* Content wrapper with relative positioning */}
      <div style={{ position: 'relative', zIndex: 1 }}>

      {/* ─── NAVBAR ─── */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: isMobile ? '16px 20px' : '16px 56px',
        background: `linear-gradient(180deg, rgba(6,9,16,0.98) 0%, rgba(13,17,23,0.95) 100%)`,
        backdropFilter: 'blur(25px)',
        borderBottom: `1px solid rgba(0,212,255,0.12)`,
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: `0 8px 32px rgba(0,212,255,0.08)`,
      }}>
        {/* LOGO & BRANDING */}
        <div
          onClick={() => navigate('/')}
          style={{
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.opacity = '0.9'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.opacity = '1'
          }}
        >
          {/* Logo Icon */}
          <div style={{
            width: '40px',
            height: '40px',
            background: `linear-gradient(135deg, ${theme.accent} 0%, ${theme.accent2} 100%)`,
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 900,
            fontSize: '20px',
            color: '#000',
            boxShadow: `0 8px 24px rgba(0,212,255,0.3)`,
            border: `1px solid rgba(0,212,255,0.4)`,
            letterSpacing: '-0.05em',
          }}>
            ◆
          </div>
          {/* Brand Name */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
          }}>
            <div style={{
              fontFamily: theme.fontDisplay,
              fontSize: '18px',
              fontWeight: 950,
              letterSpacing: '-0.02em',
              background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              TRUST SENSE
            </div>
            <div style={{
              fontSize: '8px',
              letterSpacing: '0.15em',
              color: theme.accent,
              fontWeight: 700,
            }}>
              INTELLIGENCE PLATFORM
            </div>
          </div>
        </div>

        {/* NAVIGATION LINKS & CTA */}
        <div style={{ display: 'flex', gap: '48px', alignItems: 'center' }}>
          {/* Navigation Links */}
          <div style={{ display: 'flex', gap: '36px', alignItems: 'center' }}>
            {[
              { label: 'FEATURES', link: '#features' },
              { label: 'PRICING', link: '/pricing' },
              { label: 'TEAM', link: '#team' },
              { label: 'FAQ', link: '#faq' },
            ].map((item) => (
              <a key={item.label} href={item.link} style={{
                color: theme.muted,
                textDecoration: 'none',
                fontSize: '11px',
                letterSpacing: '0.15em',
                fontWeight: 700,
                transition: 'all 0.3s ease',
                position: 'relative',
                paddingBottom: '4px',
              }}
              onMouseEnter={e => {
                e.target.style.color = theme.accent
                e.target.style.textShadow = `0 0 8px ${theme.accent}40`
              }}
              onMouseLeave={e => {
                e.target.style.color = theme.muted
                e.target.style.textShadow = 'none'
              }}
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* CTA Buttons */}
          <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
            {user ? (
              <Button onClick={() => navigate('/dashboard')} size="sm" style={{
                background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`,
                boxShadow: `0 8px 20px rgba(0,212,255,0.3)`,
              }}>
                ◈ DASHBOARD
              </Button>
            ) : (
              <>
                <Button 
                  onClick={() => navigate('/login')} 
                  variant="ghost" 
                  size="sm" 
                  style={{ 
                    color: theme.muted,
                    border: `1px solid ${theme.border}`,
                    transition: 'all 0.3s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = theme.accent
                    e.currentTarget.style.color = theme.accent
                    e.currentTarget.style.background = `rgba(0,212,255,0.05)`
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = theme.border
                    e.currentTarget.style.color = theme.muted
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  LOGIN
                </Button>
                <Button 
                  onClick={() => navigate('/login')} 
                  size="sm"
                  style={{
                    background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`,
                    boxShadow: `0 8px 20px rgba(0,212,255,0.3)`,
                  }}
                >
                  START FREE
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ─── HERO SECTION ─── */}
      <section style={{
        padding: '160px 48px 100px',
        textAlign: 'center',
        position: 'relative',
        zIndex: 1,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}>
        <div style={{
          maxWidth: '1000px',
          margin: '0 auto',
        }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            border: `1px solid rgba(0,212,255,0.3)`,
            borderRadius: '50px',
            marginBottom: '40px',
            fontSize: '12px',
            color: theme.accent,
            letterSpacing: '0.15em',
            fontWeight: 700,
            animation: 'slideInUp 1s ease',
            background: 'rgba(0,212,255,0.05)',
            backdropFilter: 'blur(10px)',
          }}>
            AI-POWERED CONTENT VERIFICATION
          </div>

          {/* Main headline */}
          <h1 style={{
            fontFamily: theme.fontDisplay,
            fontSize: '80px',
            fontWeight: 950,
            letterSpacing: '-0.03em',
            marginBottom: '28px',
            lineHeight: 1.1,
            background: `linear-gradient(135deg, ${theme.accent} 0%, ${theme.accent2} 50%, ${theme.accent3} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            animation: 'slideInUp 1s ease 0.1s both',
          }}>
            Trust Tomorrow,<br />Today
          </h1>

          {/* Subheading */}
          <p style={{
            fontSize: '22px',
            color: theme.muted,
            maxWidth: '750px',
            margin: '0 auto 60px',
            lineHeight: 1.7,
            animation: 'slideInUp 1s ease 0.2s both',
          }}>
            Enterprise-grade AI for multimodal analysis. Detect deepfakes, verify credibility with 99% accuracy.
          </p>

          {/* CTA Buttons */}
          <div style={{
            display: 'flex',
            gap: '20px',
            justifyContent: 'center',
            marginBottom: '100px',
            animation: 'slideInUp 1s ease 0.3s both',
          }}>
            {user ? (
              <Button onClick={() => navigate('/dashboard')} size="lg">
                ◈ OPEN DASHBOARD
              </Button>
            ) : (
              <>
                <Button onClick={() => navigate('/login')} size="lg">
                  ◈ START ANALYZING FREE
                </Button>
                <Button onClick={() => navigate('/login')} variant="outline" size="lg">
                  ◎ VIEW DEMO
                </Button>
              </>
            )}
          </div>

          {/* Live stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '20px',
            maxWidth: '700px',
            margin: '0 auto',
          }}>
            {[
              { label: 'Analyses Run', value: counters.analyses, suffix: '+' },
              { label: 'Active Users', value: counters.users, suffix: '+' },
              { label: 'Accuracy', value: counters.accuracy, suffix: '%' },
            ].map((stat, idx) => (
              <div key={idx} style={{
                background: `linear-gradient(135deg, rgba(0,212,255,0.08), rgba(124,58,237,0.08))`,
                border: `1px solid rgba(0,212,255,0.2)`,
                borderRadius: '12px',
                padding: '24px',
                textAlign: 'center',
                backdropFilter: 'blur(10px)',
                animation: 'slideInUp 1s ease',
                animationDelay: `${idx * 0.1 + 0.4}s`,
                animationFillMode: 'both',
              }}>
                <div style={{
                  fontSize: '36px',
                  fontWeight: 900,
                  background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  marginBottom: '8px',
                }}>
                  {stat.value.toLocaleString()}{stat.suffix}
                </div>
                <div style={{
                  fontSize: '11px',
                  color: theme.muted,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES SECTION ─── */}
      <section id="features" style={{
        padding: '120px 48px',
        maxWidth: '1200px',
        margin: '0 auto',
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '80px',
        }}>
          <div style={{
            fontSize: '12px',
            color: theme.accent,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            marginBottom: '16px',
            fontWeight: 700,
          }}>
            ◆ CAPABILITIES
          </div>
          <h2 style={{
            fontFamily: theme.fontDisplay,
            fontSize: '64px',
            fontWeight: 900,
            marginBottom: '20px',
          }}>
            Multimodal Mastery
          </h2>
          <p style={{
            fontSize: '18px',
            color: theme.muted,
            maxWidth: '600px',
            margin: '0 auto',
          }}>
            Analyze any content type with AI that understands context
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '28px',
        }}>
          {FEATURES.map((feature, idx) => (
            <div key={idx} style={{
              background: `linear-gradient(135deg, rgba(0,212,255,0.05), rgba(124,58,237,0.05))`,
              border: `1px solid rgba(0,212,255,0.2)`,
              borderRadius: '16px',
              padding: '40px 28px',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-8px)'
              e.currentTarget.style.borderColor = theme.accent
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.borderColor = 'rgba(0,212,255,0.2)'
            }}
            >
              <div style={{
                fontSize: '48px',
                marginBottom: '24px',
              }}>
                {feature.icon}
              </div>
              <h3 style={{
                fontFamily: theme.fontDisplay,
                fontSize: '20px',
                fontWeight: 800,
                marginBottom: '12px',
                color: theme.accent,
              }}>
                {feature.title}
              </h3>
              <p style={{
                fontSize: '14px',
                color: theme.muted,
                lineHeight: 1.8,
              }}>
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── WHY CHOOSE ─── */}
      <section style={{
        padding: '120px 48px',
        background: `linear-gradient(180deg, rgba(0,212,255,0.02) 0%, transparent 100%)`,
        borderTop: `1px solid rgba(0,212,255,0.1)`,
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
        }}>
          <div style={{
            textAlign: 'center',
            marginBottom: '80px',
          }}>
            <h2 style={{
              fontFamily: theme.fontDisplay,
              fontSize: '64px',
              fontWeight: 900,
            }}>
              Why Choose Trust Sense?
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '28px',
          }}>
            {[
              { icon: '✓', title: '99% Accurate', desc: 'Advanced ML models trained on millions of samples' },
              { icon: '⚡', title: 'Lightning Fast', desc: 'Process in milliseconds, not minutes' },
              { icon: '🔒', title: 'Privacy First', desc: 'End-to-end encryption, zero data storage' },
              { icon: '🔗', title: 'Easy Integration', desc: 'REST API, webhooks, SDKs for all languages' },
              { icon: '🏢', title: 'Enterprise Ready', desc: 'SOC 2, GDPR, 99.99% SLA guaranteed' },
              { icon: '💬', title: '24/7 Support', desc: 'Expert team always available for you' },
            ].map((item, idx) => (
              <div key={idx} style={{
                background: theme.card,
                border: `1px solid rgba(0,212,255,0.15)`,
                borderRadius: '16px',
                padding: '40px 28px',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-8px)'
                e.currentTarget.style.borderColor = theme.accent
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.borderColor = 'rgba(0,212,255,0.15)'
              }}
              >
                <div style={{ fontSize: '32px', marginBottom: '16px' }}>{item.icon}</div>
                <h3 style={{
                  fontFamily: theme.fontDisplay,
                  fontSize: '18px',
                  fontWeight: 700,
                  marginBottom: '8px',
                  color: theme.accent,
                }}>
                  {item.title}
                </h3>
                <p style={{
                  fontSize: '13px',
                  color: theme.muted,
                  lineHeight: 1.6,
                }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FOUNDERS SECTION ─── */}
      <section id="team" style={{
        padding: '120px 48px',
        maxWidth: '1200px',
        margin: '0 auto',
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '80px',
        }}>
          <div style={{
            fontSize: '12px',
            color: theme.accent,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            marginBottom: '16px',
            fontWeight: 700,
          }}>
        
          </div>
          <h2 style={{
            fontFamily: theme.fontDisplay,
            fontSize: '64px',
            fontWeight: 900,
            marginBottom: '20px',
          }}>
            Meet the Founders
          </h2>
          <p style={{
            fontSize: '18px',
            color: theme.muted,
            maxWidth: '600px',
            margin: '0 auto',
          }}>
            Building the future of trust and verification
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '40px',
        }}>
          {FOUNDERS.map((founder, idx) => (
            <div key={idx} style={{
              background: `linear-gradient(135deg, rgba(0,212,255,0.08), rgba(124,58,237,0.08))`,
              border: `1px solid rgba(0,212,255,0.2)`,
              borderRadius: '16px',
              overflow: 'hidden',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-8px)'
              e.currentTarget.style.borderColor = theme.accent
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.borderColor = 'rgba(0,212,255,0.2)'
            }}
            >
              <div style={{
                height: '200px',
                background: `linear-gradient(135deg, rgba(0,212,255,0.15), rgba(124,58,237,0.15))`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '80px',
              }}>
                {founder.image}
              </div>
              <div style={{ padding: '36px 28px' }}>
                <h3 style={{
                  fontFamily: theme.fontDisplay,
                  fontSize: '20px',
                  fontWeight: 800,
                  marginBottom: '4px',
                  color: theme.accent,
                }}>
                  {founder.name}
                </h3>
                <div style={{
                  fontSize: '12px',
                  color: theme.muted,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  marginBottom: '12px',
                  fontWeight: 600,
                }}>
                  {founder.role}
                </div>
                <p style={{
                  fontSize: '13px',
                  color: theme.muted,
                  lineHeight: 1.6,
                }}>
                  {founder.bio}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section style={{
        padding: '120px 48px',
        background: `linear-gradient(180deg, transparent 0%, rgba(0,212,255,0.02) 100%)`,
        borderTop: `1px solid rgba(0,212,255,0.1)`,
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
        }}>
          <div style={{
            textAlign: 'center',
            marginBottom: '80px',
          }}>
            <div style={{
              fontSize: '12px',
              color: theme.accent,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              marginBottom: '16px',
              fontWeight: 700,
            }}>
              ⭐ TESTIMONIALS
            </div>
            <h2 style={{
              fontFamily: theme.fontDisplay,
              fontSize: '64px',
              fontWeight: 900,
            }}>
              What Users Say
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '28px',
          }}>
            {TESTIMONIALS.map((testimonial, idx) => (
              <div key={idx} style={{
                background: theme.card,
                border: `1px solid rgba(0,212,255,0.2)`,
                borderRadius: '16px',
                padding: '36px',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = theme.accent
                e.currentTarget.style.transform = 'translateY(-4px)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(0,212,255,0.2)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
              >
                <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
                  {[...Array(5)].map((_, i) => (
                    <span key={i} style={{ fontSize: '14px' }}>⭐</span>
                  ))}
                </div>
                <p style={{
                  fontSize: '14px',
                  color: theme.text,
                  lineHeight: 1.8,
                  marginBottom: '20px',
                  fontStyle: 'italic',
                  borderLeft: `3px solid ${theme.accent}`,
                  paddingLeft: '16px',
                }}>
                  "{testimonial.text}"
                </p>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, rgba(0,212,255,0.2), rgba(124,58,237,0.2))`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '22px',
                  }}>
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '13px' }}>
                      {testimonial.name}
                    </div>
                    <div style={{ fontSize: '11px', color: theme.muted }}>
                      {testimonial.role}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ SECTION ─── */}
      <section id="faq" style={{
        padding: '120px 48px',
        maxWidth: '900px',
        margin: '0 auto',
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '80px',
        }}>
          <div style={{
            fontSize: '12px',
            color: theme.accent,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            marginBottom: '16px',
            fontWeight: 700,
          }}>
            ❓ QUESTIONS
          </div>
          <h2 style={{
            fontFamily: theme.fontDisplay,
            fontSize: '64px',
            fontWeight: 900,
          }}>
            Common Questions
          </h2>
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          {[
            { q: 'How accurate is Trust Sense?', a: 'Our models achieve 99%+ accuracy using multi-ensemble learning.' },
            { q: 'What data sources can I analyze?', a: 'Text, audio, video, images, URLs, and live streaming.' },
            { q: 'Is my data secure?', a: 'End-to-end encrypted. We never store or train on your content.' },
            { q: 'Can I integrate with my tools?', a: 'REST API, webhooks, Slack, Discord, and Power BI integrations.' },
            { q: 'What\'s the pricing?', a: 'Free tier available. Pro plans start at $29/month.' },
            { q: 'Do you offer team features?', a: 'Yes. Unlimited team members, shared dashboards, audit logs.' },
          ].map((item, idx) => (
            <div key={idx} style={{
              background: theme.card,
              border: `1px solid rgba(0,212,255,0.15)`,
              borderRadius: '12px',
              overflow: 'hidden',
              transition: 'all 0.3s ease',
            }}>
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                style={{
                  width: '100%',
                  padding: '20px 24px',
                  background: 'transparent',
                  border: 'none',
                  color: theme.text,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '15px',
                  fontFamily: theme.fontDisplay,
                  fontWeight: 700,
                  transition: 'all 0.3s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.parentElement.style.borderColor = theme.accent
                }}
                onMouseLeave={e => {
                  e.currentTarget.parentElement.style.borderColor = 'rgba(0,212,255,0.15)'
                }}
              >
                {item.q}
                <span style={{
                  fontSize: '16px',
                  transition: 'transform 0.3s',
                  transform: openFaq === idx ? 'rotate(180deg)' : 'rotate(0)',
                }}>
                  ▼
                </span>
              </button>

              {openFaq === idx && (
                <div style={{
                  padding: '0 24px 20px',
                  borderTop: `1px solid rgba(0,212,255,0.1)`,
                  fontSize: '13px',
                  color: theme.muted,
                  lineHeight: 1.8,
                }}>
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ─── CTA SECTION ─── */}
      <section style={{
        padding: '120px 48px',
        textAlign: 'center',
        borderTop: `1px solid rgba(0,212,255,0.1)`,
        background: `linear-gradient(180deg, transparent 0%, rgba(0,212,255,0.03) 100%)`,
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{
          maxWidth: '700px',
          margin: '0 auto',
        }}>
          <h2 style={{
            fontFamily: theme.fontDisplay,
            fontSize: '56px',
            fontWeight: 900,
            marginBottom: '20px',
          }}>
            Ready to Verify?
          </h2>
          <p style={{
            fontSize: '18px',
            color: theme.muted,
            marginBottom: '40px',
            lineHeight: 1.8,
          }}>
            Join thousands of organizations building trust with AI. No credit card required.
          </p>

          {user ? (
            <Button onClick={() => navigate('/dashboard')} size="lg">
              ◈ GO TO DASHBOARD
            </Button>
          ) : (
            <Button onClick={() => navigate('/login')} size="lg">
              ◈ START FREE TODAY
            </Button>
          )}
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer style={{
        padding: '80px 48px 40px',
        borderTop: `1px solid rgba(0,212,255,0.1)`,
        background: theme.surface,
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto 60px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '48px',
        }}>
          <div>
            <div style={{
              fontFamily: theme.fontDisplay,
              fontSize: '18px',
              fontWeight: 900,
              background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '12px',
            }}>
              ◆ TRUST SENSE
            </div>
            <p style={{
              fontSize: '12px',
              color: theme.muted,
              lineHeight: 1.6,
            }}>
              Enterprise AI for trust and verification. Deployed globally.
            </p>
          </div>

          {[
            { title: 'Product', links: ['Features', 'Pricing', 'Security'] },
            { title: 'Resources', links: ['Docs', 'API', 'Blog'] },
            { title: 'Company', links: ['About', 'Team', 'Contact'] },
          ].map((col, idx) => (
            <div key={idx}>
              <div style={{
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: theme.accent,
                marginBottom: '16px',
              }}>
                {col.title}
              </div>
              {col.links.map((link) => (
                <div key={link} style={{
                  fontSize: '12px',
                  color: theme.muted,
                  marginBottom: '10px',
                  cursor: 'pointer',
                  transition: 'color 0.3s',
                }}
                onMouseEnter={e => e.target.style.color = theme.accent}
                onMouseLeave={e => e.target.style.color = theme.muted}
                >
                  {link}
                </div>
              ))}
            </div>
          ))}
        </div>

        <div style={{
          padding: '40px 0',
          borderTop: `1px solid rgba(0,212,255,0.1)`,
          textAlign: 'center',
          fontSize: '11px',
          color: theme.muted,
        }}>
          <p style={{ margin: '0 0 12px' }}>
            © 2026 Trust Sense. Built by Hassene Hamrouni & Fedia Jlassi.
          </p>
        </div>
      </footer>

      <style>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes float1 {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-30px); }
        }
        @keyframes float2 {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(30px); }
        }
        * { box-sizing: border-box; }
      `}</style>
      </div>
    </div>
  )
}
