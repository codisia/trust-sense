import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/UI'
import AnimatedBackground3D from '../components/AnimatedBackground3D'
import { useTheme } from '../context/ThemeContext'

const PLANS = [
  {
    name: 'Starter',
    price: 'Free',
    limit: '3 analyses/day',
    color: '#10b981',
    popular: false,
    features: [
      'Text analysis',
      'Basic sentiment detection',
      'Credibility scoring',
      'Email support',
      'Limit: 3 daily analyses',
    ],
  },
  {
    name: 'Professional',
    price: '$29',
    period: '/month',
    limit: '100 analyses/day',
    color: '#00d4ff',
    popular: true,
    features: [
      'All Starter features',
      'Audio intelligence',
      'Video analysis',
      'Priority support',
      'Limit: 100 daily analyses',
      'Advanced analytics',
      'API access',
    ],
  },
  {
    name: 'Enterprise',
    price: '$99',
    period: '/month',
    limit: '1000+ analyses/day',
    color: '#7c3aed',
    popular: false,
    features: [
      'All Professional features',
      'Unlimited analyses',
      'Custom integrations',
      '24/7 phone support',
      'Dedicated account manager',
      'Custom training',
      'White-label options',
    ],
  },
]

export default function PricingPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { theme } = useTheme()

  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
      <AnimatedBackground3D />
      
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* NAVIGATION HEADER */}
        <div style={{
          padding: '20px 48px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: `1px solid rgba(0,212,255,0.1)`,
        }}>
          <div style={{
            fontFamily: theme.fontDisplay,
            fontSize: '18px',
            fontWeight: 800,
            background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            cursor: 'pointer',
          }} onClick={() => navigate('/')}>TRUST SENSE</div>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '10px 20px',
              background: 'transparent',
              border: `1px solid ${theme.border}`,
              color: theme.text,
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              letterSpacing: '0.08em',
              fontWeight: 600,
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.target.style.background = theme.accent; e.target.style.color = '#000'; e.target.style.borderColor = theme.accent; }}
            onMouseLeave={e => { e.target.style.background = 'transparent'; e.target.style.color = theme.text; e.target.style.borderColor = theme.border; }}
          >
            HOME
          </button>
        </div>
        
        {/* HEADER */}
        <div style={{
          paddingTop: '120px',
          paddingBottom: '80px',
          textAlign: 'center',
        }}>
          <h1 style={{
            fontSize: '56px',
            fontWeight: 900,
            background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '16px',
            letterSpacing: '-1px',
          }}>
            Transparent Pricing
          </h1>
          <p style={{
            fontSize: '18px',
            color: theme.muted,
            maxWidth: '600px',
            margin: '0 auto',
            lineHeight: '1.6',
          }}>
            Choose the perfect plan for your analysis needs. Scale as you grow.
          </p>
        </div>

        {/* PRICING CARDS */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '32px',
          padding: '0 48px 120px',
          maxWidth: '1400px',
          margin: '0 auto',
        }}>
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              style={{
                padding: '32px',
                borderRadius: '16px',
                background: plan.popular ? `linear-gradient(135deg, rgba(0,212,255,0.1), rgba(124,58,237,0.05))` : theme.card,
                border: `2px solid ${plan.popular ? plan.color : theme.border}`,
                boxShadow: plan.popular ? `0 20px 60px rgba(0,212,255,0.2)` : 'none',
                position: 'relative',
                transform: plan.popular ? 'scale(1.05)' : 'scale(1)',
                transition: 'all 0.3s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-8px) scale(1.05)'
                e.currentTarget.style.borderColor = plan.color
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = plan.popular ? 'scale(1.05)' : 'scale(1)'
                e.currentTarget.style.borderColor = plan.popular ? plan.color : theme.border
              }}
            >
              {plan.popular && (
                <div style={{
                  position: 'absolute',
                  top: '-16px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  padding: '6px 16px',
                  background: `linear-gradient(135deg, ${plan.color}, ${theme.accent2})`,
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '1px',
                  color: '#000',
                }}>
                  MOST POPULAR ⭐
                </div>
              )}

              <div style={{ marginBottom: '24px' }}>
                <h3 style={{
                  fontSize: '24px',
                  fontWeight: 800,
                  color: plan.color,
                  marginBottom: '12px',
                }}>
                  {plan.name}
                </h3>
                <div style={{
                  fontSize: '42px',
                  fontWeight: 900,
                  color: theme.text,
                  marginBottom: '8px',
                }}>
                  {plan.price}
                  {plan.period && <span style={{ fontSize: '16px', color: theme.muted }}>{plan.period}</span>}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: theme.accent,
                  fontWeight: 600,
                  letterSpacing: '0.5px',
                }}>
                  {plan.limit}
                </div>
              </div>

              <div style={{ marginBottom: '32px', paddingBottom: '32px', borderBottom: `1px solid ${theme.border}` }}>
                <ul>
                  {plan.features.map((feature, idx) => (
                    <li
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        marginBottom: '12px',
                        fontSize: '14px',
                        color: theme.text,
                      }}
                    >
                              {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <Button
                onClick={() => {
                  if (user) {
                    navigate('/dashboard')
                  } else {
                    navigate('/login')
                  }
                }}
                style={{
                  width: '100%',
                  background: plan.popular ? `linear-gradient(135deg, ${plan.color}, ${theme.accent2})` : 'transparent',
                  border: plan.popular ? 'none' : `1px solid ${plan.color}`,
                  color: plan.popular ? '#000' : plan.color,
                  fontWeight: 700,
                  fontSize: '16px',
                  padding: '14px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  boxShadow: plan.popular ? `0 10px 30px rgba(0,212,255,0.2)` : 'none',
                }}
              >
                {user ? 'UPGRADE NOW' : 'GET STARTED'}
              </Button>
            </div>
          ))}
        </div>

        {/* FAQ SECTION */}
        <div style={{
          maxWidth: '800px',
          margin: '120px auto 80px',
          padding: '0 48px',
        }}>
          <h2 style={{
            fontSize: '36px',
            fontWeight: 900,
            textAlign: 'center',
            marginBottom: '48px',
            color: theme.text,
          }}>
            Frequently Asked Questions
          </h2>

          <div style={{ display: 'grid', gap: '24px' }}>
            {[
              { q: 'Can I change plans anytime?', a: 'Yes, upgrade or downgrade instantly.' },
              { q: 'What payment methods do you accept?', a: 'Stripe: cards, Apple Pay, Google Pay, and more.' },
              { q: 'Do you offer custom plans?', a: 'Absolutely, contact sales@trustsense.ai for custom needs.' },
              { q: 'Is there a free trial?', a: 'Yes, start with 3 free analyses today.' },
            ].map((item, idx) => (
              <div key={idx} style={{
                padding: '20px',
                borderRadius: '12px',
                background: theme.card,
                border: `1px solid ${theme.border}`,
              }}>
                <h4 style={{ color: theme.accent, marginBottom: '8px', fontWeight: 700 }}>
                  {item.q}
                </h4>
                <p style={{ color: theme.muted, fontSize: '14px', lineHeight: '1.6' }}>
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
