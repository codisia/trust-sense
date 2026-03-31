import '@testing-library/jest-dom'

// Mock environment variables
global.import = {
  meta: {
    env: {
      VITE_API_URL: 'http://localhost:8000',
      VITE_SUPABASE_URL: 'https://test.supabase.co',
      VITE_SUPABASE_KEY: 'test-key',
    }
  }
}
