import { useEffect, useRef, useState } from 'react'

/**
 * WebSocket URL from API URL (http(s) -> ws(s))
 */
function getWsUrl() {
  const api = import.meta.env.VITE_API_URL || 'http://localhost:8000'
  return api.replace(/^http/, 'ws') + '/ws/live'
}

/**
 * Hook to connect to Trust Sense live WebSocket for real-time alerts.
 * @returns {{ connected: boolean, lastEvent: object | null, reconnect: function }}
 */
export function useLiveSocket() {
  const [connected, setConnected] = useState(false)
  const [lastEvent, setLastEvent] = useState(null)
  const wsRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)

  const connect = () => {
    const url = getWsUrl()
    try {
      const ws = new WebSocket(url)
      ws.onopen = () => setConnected(true)
      ws.onclose = () => {
        setConnected(false)
        reconnectTimeoutRef.current = setTimeout(connect, 5000)
      }
      ws.onerror = () => {}
      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data)
          setLastEvent(data)
        } catch {
          setLastEvent({ raw: e.data })
        }
      }
      wsRef.current = ws
    } catch (_) {
      setConnected(false)
      reconnectTimeoutRef.current = setTimeout(connect, 5000)
    }
  }

  useEffect(() => {
    connect()
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
      if (wsRef.current) wsRef.current.close()
    }
  }, [])

  const reconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    setLastEvent(null)
    connect()
  }

  return { connected, lastEvent, reconnect }
}

export default useLiveSocket
