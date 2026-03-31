import { useState, useCallback, useContext, createContext } from 'react'
import { useTheme } from '../context/ThemeContext'

const ToastContext = createContext()

export function ToastProvider({ children }) {
  const { theme } = useTheme()
  const [toasts, setToasts] = useState([])

  const showToast = useCallback((message, type = 'success', duration = 3000) => {
    const id = Date.now()
    const newToast = { id, message, type }
    setToasts(prev => [...prev, newToast])

    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id))
      }, duration)
    }

    return id
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}

function ToastContainer({ toasts, onRemove }) {
  return (
    <div style={{
      position: 'fixed',
      top: '24px',
      right: '24px',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      pointerEvents: 'none',
    }}>
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  )
}

function Toast({ toast, onRemove }) {
  const bgColor = {
    success: 'rgba(16, 185, 129, 0.1)',
    error: 'rgba(239, 68, 68, 0.1)',
    warning: 'rgba(251, 191, 36, 0.1)',
    info: 'rgba(59, 130, 246, 0.1)',
  }[toast.type]

  const borderColor = {
    success: theme.accent3,
    error: '#ef4444',
    warning: '#fbbf24',
    info: '#3b82f6',
  }[toast.type]

  const icon = {
    success: 'OK',
    error: 'X',
    warning: '!',
    info: 'i',
  }[toast.type]

  return (
    <div
      style={{
        animation: 'slideIn 0.3s ease-out',
        pointerEvents: 'auto',
        padding: '16px 20px',
        borderRadius: '12px',
        background: bgColor,
        border: `1px solid ${borderColor}`,
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        minWidth: '300px',
        maxWidth: '420px',
        boxShadow: `0 10px 40px rgba(0,0,0,0.2)`,
      }}
    >
      <div style={{
        fontSize: '18px',
        fontWeight: 'bold',
        color: borderColor,
        minWidth: '20px',
      }}>
        {icon}
      </div>
      <div style={{
        flex: 1,
        fontSize: '14px',
        color: theme.text,
        fontWeight: 500,
      }}>
        {toast.message}
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        style={{
          background: 'none',
          border: 'none',
          color: theme.muted,
          cursor: 'pointer',
          fontSize: '18px',
          padding: '0 4px',
          transition: 'color 0.2s',
        }}
        onMouseEnter={e => e.target.style.color = borderColor}
        onMouseLeave={e => e.target.style.color = theme.muted}
      >
        ✕
      </button>
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(400px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  )
}
