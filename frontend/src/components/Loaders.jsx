import { useTheme } from '../context/ThemeContext'

export function LoadingSpinner() {
  const { theme } = useTheme()
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      width: '100vw',
      position: 'fixed',
      top: 0,
      left: 0,
      background: theme.bg,
      zIndex: 9998,
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '60px',
          height: '60px',
          margin: '0 auto 24px',
          borderRadius: '50%',
          background: `conic-gradient(${theme.accent}, ${theme.accent2}, ${theme.accent})`,
          animation: 'spin 2s linear infinite',
        }} />
        <div style={{
          fontSize: '16px',
          color: theme.text,
          fontWeight: 600,
          letterSpacing: '2px',
          animation: 'fadeInOut 2s ease-in-out infinite',
        }}>
          ANALYZING...
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes fadeInOut {
            0%, 100% { opacity: 0.5; }
            50% { opacity: 1; }
          }
        `}</style>
      </div>
    </div>
  )
}

export function InlineSpinner({ size = 'small' }) {
  const { theme } = useTheme()
  const sizes = {
    small: '20px',
    medium: '40px',
    large: '60px',
  }

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        width: sizes[size],
        height: sizes[size],
        borderRadius: '50%',
        border: `3px solid rgba(0,212,255,0.2)`,
        borderTopColor: theme.accent,
        animation: 'spin 1s linear infinite',
      }} />
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export function SkeletonLoader() {
  const { theme } = useTheme()
  return (
    <div style={{ width: '100%' }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{
          height: '16px',
          background: `linear-gradient(90deg, ${theme.card} 25%, ${theme.surface} 50%, ${theme.card} 75%)`,
          backgroundSize: '200% 100%',
          animation: 'skeletonShimmer 2s infinite',
          marginBottom: '12px',
          borderRadius: '8px',
        }} />
      ))}
      <style>{`
        @keyframes skeletonShimmer {
          0% { backgroundPosition: 200% 0; }
          100% { backgroundPosition: -200% 0; }
        }
      `}</style>
    </div>
  )
}
