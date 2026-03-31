export const theme = {
  bg: '#060910',
  surface: '#0d1117',
  card: '#111827',
  border: '#1f2937',
  accent: '#00d4ff',
  accent2: '#7c3aed',
  accent3: '#10b981',
  danger: '#ef4444',
  warn: '#f59e0b',
  text: '#f1f5f9',
  muted: '#64748b',
  font: "'Space Mono', monospace",
  fontDisplay: "'Syne', sans-serif",
}

export const themeLight = {
  bg: '#f8fafc',
  surface: '#ffffff',
  card: '#f1f5f9',
  border: '#e2e8f0',
  accent: '#0369a1',
  accent2: '#6d28d9',
  accent3: '#059669',
  danger: '#dc2626',
  warn: '#d97706',
  text: '#0f172a',
  muted: '#64748b',
  font: "'Space Mono', monospace",
  fontDisplay: "'Syne', sans-serif",
}

export const scoreColor = (score) =>
  score >= 70 ? theme.accent3 : score >= 40 ? theme.warn : theme.danger

export const riskColor = (risk) => ({
  LOW: theme.accent3,
  MEDIUM: theme.warn,
  HIGH: '#f97316',
  CRITICAL: theme.danger,
}[risk] || theme.muted)
