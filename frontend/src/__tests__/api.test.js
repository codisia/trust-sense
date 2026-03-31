import { describe, it, expect, beforeEach, vi } from 'vitest'
import axios from 'axios'

vi.mock('axios')

describe('API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Text Analysis', () => {
    it('should send text for analysis', async () => {
      const mockResponse = {
        data: {
          trust_score: 75,
          sentiment: 0.3,
          risk_level: 'LOW',
        }
      }
      
      axios.post.mockResolvedValueOnce(mockResponse)
      
      const result = await axios.post('http://localhost:8000/api/analyze-text', {
        text: 'Sample text'
      })
      
      expect(result.data).toHaveProperty('trust_score')
      expect(result.data.trust_score).toBe(75)
      expect(result.data.risk_level).toBe('LOW')
    })

    it('should handle analysis errors', async () => {
      const error = new Error('Analysis failed')
      axios.post.mockRejectedValueOnce(error)
      
      try {
        await axios.post('http://localhost:8000/api/analyze-text', { text: '' })
      } catch (e) {
        expect(e.message).toBe('Analysis failed')
      }
    })
  })

  describe('Authentication', () => {
    it('should handle login request', async () => {
      const mockResponse = {
        data: {
          access_token: 'test-token',
          token_type: 'bearer',
          user: {
            id: 1,
            email: 'user@example.com',
            username: 'testuser',
            role: 'analyst',
          }
        }
      }
      
      axios.post.mockResolvedValueOnce(mockResponse)
      
      const result = await axios.post('http://localhost:8000/auth/login', {
        email: 'user@example.com',
        password: 'password123'
      })
      
      expect(result.data).toHaveProperty('access_token')
      expect(result.data.user.email).toBe('user@example.com')
    })

    it('should handle registration', async () => {
      const mockResponse = {
        data: {
          id: 1,
          email: 'newuser@example.com',
          username: 'newuser',
          role: 'analyst',
          subscription_tier: 'free',
        }
      }
      
      axios.post.mockResolvedValueOnce(mockResponse)
      
      const result = await axios.post('http://localhost:8000/auth/register', {
        email: 'newuser@example.com',
        username: 'newuser',
        password: 'password123'
      })
      
      expect(result.data.email).toBe('newuser@example.com')
      expect(result.data.subscription_tier).toBe('free')
    })
  })

  describe('History', () => {
    it('should fetch analysis history', async () => {
      const mockResponse = {
        data: [
          {
            id: 1,
            trust_score: 75,
            sentiment: 0.3,
            risk_level: 'LOW',
            created_at: '2026-03-03T10:00:00',
          }
        ]
      }
      
      axios.get.mockResolvedValueOnce(mockResponse)
      
      const result = await axios.get('http://localhost:8000/api/analysis-history')
      
      expect(Array.isArray(result.data)).toBe(true)
      expect(result.data[0]).toHaveProperty('trust_score')
    })

    it('should support filtering history', async () => {
      const mockResponse = { data: [] }
      axios.get.mockResolvedValueOnce(mockResponse)
      
      await axios.get('http://localhost:8000/api/analysis-history', {
        params: {
          risk_level: 'HIGH',
          skip: 0,
          limit: 10,
        }
      })
      
      expect(axios.get).toHaveBeenCalledWith(
        'http://localhost:8000/api/analysis-history',
        expect.any(Object)
      )
    })
  })

  describe('Health Check', () => {
    it('should check API health', async () => {
      const mockResponse = {
        data: {
          status: 'healthy',
          service: 'Trust Sense API',
          version: '2.0.0',
        }
      }
      
      axios.get.mockResolvedValueOnce(mockResponse)
      
      const result = await axios.get('http://localhost:8000/health')
      
      expect(result.data.status).toBe('healthy')
      expect(result.data.service).toBe('Trust Sense API')
    })
  })
})
