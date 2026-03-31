import { useState, useRef, useEffect } from 'react'
import { analysisAPI } from '../services/api'
import { useTheme } from '../context/ThemeContext'
import { Button, Spinner } from './UI'

export default function Chatbot({ isOpen, onClose, analysisResult }) {
  const { theme } = useTheme()
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      text: 'Hi! I\'m your Trust Sense AI assistant. Ask me about credibility, misinformation detection, or how to verify sources. I can also explain your analysis results.'
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || loading) return

    // Add user message to chat
    const userMessage = {
      id: Date.now(),
      role: 'user',
      text: input
    }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      // Send to chatbot API
      const response = await fetch('http://localhost:8000/api/chatbot/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: input })
      })

      const data = await response.json()

      if (data.success) {
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          role: 'assistant',
          text: data.response
        }])
      } else {
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          role: 'assistant',
          text: 'Sorry, I encountered an error. Please try again.'
        }])
      }
    } catch (error) {
      console.error('Chatbot error:', error)
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        text: 'Connection error. Is the backend running?'
      }])
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: 20,
      right: 20,
      width: '360px',
      height: '600px',
      background: theme.surface,
      border: `1px solid ${theme.border}`,
      borderRadius: '12px',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1000,
      boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      animation: 'slideIn 0.3s ease-out'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px',
        borderBottom: `1px solid ${theme.border}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: theme.text }}>Trust Sense Assistant</div>
          <div style={{ fontSize: '11px', color: theme.muted }}>AI-powered credibility guide</div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: theme.muted,
            fontSize: '18px',
            cursor: 'pointer',
            padding: '4px'
          }}
        >
          ✕
        </button>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {messages.map(msg => (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              animation: 'fadeIn 0.2s ease-out'
            }}
          >
            <div
              style={{
                maxWidth: '85%',
                padding: '12px 14px',
                borderRadius: msg.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                background: msg.role === 'user' 
                  ? theme.accent 
                  : 'rgba(0,212,255,0.1)',
                color: msg.role === 'user' ? '#000' : theme.text,
                fontSize: '13px',
                lineHeight: '1.4',
                wordWrap: 'break-word'
              }}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            padding: '12px 14px',
            background: 'rgba(0,212,255,0.1)',
            borderRadius: '12px',
            width: 'fit-content'
          }}>
            <Spinner size="small" />
            <span style={{ fontSize: '12px', color: theme.muted }}>Thinking...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '12px',
        borderTop: `1px solid ${theme.border}`
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
            placeholder="Ask about credibility, fake news, sources..."
            style={{
              flex: 1,
              padding: '10px 12px',
              background: 'rgba(255,255,255,0.03)',
              border: `1px solid ${theme.border}`,
              borderRadius: '6px',
              color: theme.text,
              fontFamily: theme.font,
              fontSize: '12px',
              outline: 'none',
              transition: 'border-color 0.15s'
            }}
            onFocus={e => e.target.style.borderColor = theme.accent}
            onBlur={e => e.target.style.borderColor = theme.border}
            disabled={loading}
          />
          <Button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            style={{ padding: '10px 14px', fontSize: '11px' }}
          >
            {loading ? <Spinner /> : '→'}
          </Button>
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
