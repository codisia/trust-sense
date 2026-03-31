import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../services/api';
import { useTheme } from '../context/ThemeContext';

export default function PowerBIDashboard() {
  const { theme } = useTheme();
  const [data, setData] = useState(null);
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [dataRes, summaryRes, trendsRes] = await Promise.all([
        api.get('/api/powerbi/data'),
        api.get('/api/powerbi/summary'),
        api.get('/api/trends').catch(() => ({ data: null }))
      ]);

      const dataContent = dataRes.data;
      const summaryContent = summaryRes.data;
      const trendsContent = trendsRes?.data ?? null;

      setData(dataContent && typeof dataContent.data !== 'undefined' ? dataContent : { data: [], total_records: 0 });
      setSummary(summaryContent || { total_analyses: 0, avg_trust_score: 0, high_risk_count: 0, emotions: {}, platforms: {}, risk_distribution: {} });
      setTrends(trendsContent);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to fetch data from backend');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: theme.bg }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'inline-block', animation: 'spin 1s linear infinite', width: '48px', height: '48px', borderRadius: '50%', borderTop: `3px solid ${theme.accent}`, borderRight: `3px solid transparent` }}></div>
          <p style={{ marginTop: '16px', color: theme.muted }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '24px', background: 'rgba(239,68,68,0.1)', border: `1px solid rgba(239,68,68,0.3)`, borderRadius: '8px' }}>
        <h2 style={{ color: theme.danger, fontWeight: 'bold' }}>Error Loading Dashboard</h2>
        <p style={{ color: theme.danger }}>{error}</p>
        <button
          onClick={fetchData}
          style={{ marginTop: '16px', padding: '8px 16px', background: theme.danger, color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
        >
          Retry
        </button>
      </div>
    );
  }

  const COLORS = [theme.accent, theme.danger, theme.accent3, theme.accent2];

  return (
    <div style={{ background: theme.bg, padding: '32px', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: theme.text, marginBottom: '8px' }}>📊 Power BI Dashboard</h1>
            <p style={{ color: theme.muted, marginTop: '8px' }}>Real-time analytics from Trust Sense backend</p>
          </div>
          <button
            onClick={fetchData}
            style={{ padding: '10px 24px', background: theme.accent, color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s' }}
            onMouseEnter={e => e.target.style.opacity = '0.8'}
            onMouseLeave={e => e.target.style.opacity = '1'}
          >
            🔄 Refresh
          </button>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '32px' }}>
            {/* Total Analyses */}
            <div style={{ background: theme.surface, borderRadius: '8px', padding: '24px', border: `1px solid ${theme.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ color: theme.muted, fontSize: '12px', fontWeight: '500' }}>Total Analyses</p>
                  <p style={{ fontSize: '32px', fontWeight: 'bold', color: theme.accent, marginTop: '8px' }}>
                    {summary.total_analyses || 0}
                  </p>
                </div>
                <div style={{ fontSize: '40px' }}>📈</div>
              </div>
            </div>

            {/* Avg Trust Score */}
            <div style={{ background: theme.surface, borderRadius: '8px', padding: '24px', border: `1px solid ${theme.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ color: theme.muted, fontSize: '12px', fontWeight: '500' }}>Avg Trust Score</p>
                  <p style={{ fontSize: '32px', fontWeight: 'bold', color: theme.accent3, marginTop: '8px' }}>
                    {summary.avg_trust_score?.toFixed(1) || 0}%
                  </p>
                </div>
                <div style={{ fontSize: '40px' }}>✅</div>
              </div>
            </div>

            {/* High Risk Count */}
            <div style={{ background: theme.surface, borderRadius: '8px', padding: '24px', border: `1px solid ${theme.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ color: theme.muted, fontSize: '12px', fontWeight: '500' }}>High Risk Items</p>
                  <p style={{ fontSize: '32px', fontWeight: 'bold', color: theme.danger, marginTop: '8px' }}>
                    {summary.high_risk_count || 0}
                  </p>
                </div>
                <div style={{ fontSize: '40px' }}>⚠️</div>
              </div>
            </div>

            {/* Platforms Analyzed */}
            <div style={{ background: theme.surface, borderRadius: '8px', padding: '24px', border: `1px solid ${theme.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ color: theme.muted, fontSize: '12px', fontWeight: '500' }}>Platforms</p>
                  <p style={{ fontSize: '32px', fontWeight: 'bold', color: theme.accent2, marginTop: '8px' }}>
                    {Object.keys(summary.platforms || {}).length}
                  </p>
                </div>
                <div style={{ fontSize: '40px' }}>🌐</div>
              </div>
            </div>
          </div>
        )}

        {/* Charts Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '32px', marginBottom: '32px' }}>
          {/* Risk Distribution */}
          {summary?.risk_distribution && (
            <div style={{ background: theme.surface, borderRadius: '8px', padding: '24px', border: `1px solid ${theme.border}` }}>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: theme.text, marginBottom: '16px' }}>Risk Level Distribution</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={Object.entries(summary.risk_distribution).map(([key, value]) => ({
                      name: key,
                      value: value
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill={theme.accent}
                    dataKey="value"
                  >
                    {Object.keys(summary.risk_distribution).map((key, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: '6px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Platform Analysis */}
          {summary?.platforms && Object.keys(summary.platforms).length > 0 && (
            <div style={{ background: theme.surface, borderRadius: '8px', padding: '24px', border: `1px solid ${theme.border}` }}>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: theme.text, marginBottom: '16px' }}>Posts by Platform</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={Object.entries(summary.platforms).map(([platform, count]) => ({
                    platform: platform.toUpperCase(),
                    count: count
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.border} />
                  <XAxis dataKey="platform" stroke={theme.muted} />
                  <YAxis stroke={theme.muted} />
                  <Tooltip contentStyle={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: '6px' }} />
                  <Bar dataKey="count" fill={theme.accent} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Emotion Breakdown */}
          {summary?.emotions && Object.keys(summary.emotions).length > 0 && (
            <div style={{ background: theme.surface, borderRadius: '8px', padding: '24px', border: `1px solid ${theme.border}` }}>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: theme.text, marginBottom: '16px' }}>Emotions Detected</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={Object.entries(summary.emotions).map(([emotion, count]) => ({
                    emotion: emotion,
                    count: count
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.border} />
                  <XAxis dataKey="emotion" angle={-45} textAnchor="end" height={100} stroke={theme.muted} />
                  <YAxis stroke={theme.muted} />
                  <Tooltip contentStyle={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: '6px' }} />
                  <Bar dataKey="count" fill={theme.accent3} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Sentiment Distribution */}
          {summary && (
            <div style={{ background: theme.surface, borderRadius: '8px', padding: '24px', border: `1px solid ${theme.border}` }}>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: theme.text, marginBottom: '16px' }}>Sentiment Distribution</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: theme.text }}>Positive</span>
                    <span style={{ color: theme.accent3, fontWeight: 'bold' }}>High Engagement</span>
                  </div>
                  <div style={{ width: '100%', background: theme.border, borderRadius: '999px', height: '12px' }}>
                    <div style={{ background: theme.accent3, height: '12px', borderRadius: '999px', width: '60%' }}></div>
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: theme.text }}>Neutral</span>
                    <span style={{ color: theme.accent, fontWeight: 'bold' }}>Balanced</span>
                  </div>
                  <div style={{ width: '100%', background: theme.border, borderRadius: '999px', height: '12px' }}>
                    <div style={{ background: theme.accent, height: '12px', borderRadius: '999px', width: '25%' }}></div>
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: theme.text }}>Negative</span>
                    <span style={{ color: theme.danger, fontWeight: 'bold' }}>Review Needed</span>
                  </div>
                  <div style={{ width: '100%', background: theme.border, borderRadius: '999px', height: '12px' }}>
                    <div style={{ background: theme.danger, height: '12px', borderRadius: '999px', width: '15%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Raw Data Table */}
        {data?.data && data.data.length > 0 && (
          <div style={{ background: theme.surface, borderRadius: '8px', padding: '24px', border: `1px solid ${theme.border}` }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: theme.text, marginBottom: '16px' }}>Recent Analysis Records</h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse' }}>
                <thead style={{ background: theme.border }}>
                  <tr>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: theme.text, fontWeight: 'bold' }}>ID</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: theme.text, fontWeight: 'bold' }}>Platform</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: theme.text, fontWeight: 'bold' }}>Trust Score</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: theme.text, fontWeight: 'bold' }}>Risk Level</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: theme.text, fontWeight: 'bold' }}>Emotion</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: theme.text, fontWeight: 'bold' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.slice(0, 10).map((record) => (
                    <tr key={record.id} style={{ borderBottom: `1px solid ${theme.border}` }}>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: '12px', color: theme.muted }}>{record.id.substring(0, 8)}...</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ padding: '4px 12px', background: theme.accent, color: '#000', borderRadius: '999px', fontSize: '12px', fontWeight: 'bold' }}>
                          {record.source_platform || 'general'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontWeight: 'bold', color: record.trust_score >= 70 ? theme.accent3 : theme.warn }}>
                          {record.trust_score ? record.trust_score.toFixed(1) : 'N/A'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          background: record.risk_level === 'LOW' ? 'rgba(16,185,129,0.1)' :
                            record.risk_level === 'MEDIUM' ? 'rgba(245,158,11,0.1)' :
                            record.risk_level === 'HIGH' ? 'rgba(249,115,22,0.1)' :
                            'rgba(239,68,68,0.1)',
                          color: record.risk_level === 'LOW' ? theme.accent3 :
                            record.risk_level === 'MEDIUM' ? theme.warn :
                            record.risk_level === 'HIGH' ? theme.accent2 :
                            theme.danger
                        }}>
                          {record.risk_level || 'N/A'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: theme.muted }}>{record.dominant_emotion || '-'}</td>
                      <td style={{ padding: '12px 16px', fontSize: '12px', color: theme.muted }}>
                        {record.created_at ? new Date(record.created_at).toLocaleDateString() : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data.data.length > 10 && (
              <p style={{ marginTop: '16px', color: theme.muted, fontSize: '12px' }}>Showing 10 of {data.data.length} records</p>
            )}
          </div>
        )}

        {/* Google Trends Section */}
        {trends && trends.trends && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">🔥 Google Trending Topics</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Trends Table */}
              <div className="overflow-x-auto">
                <h3 className="font-semibold text-slate-700 mb-4">Top Trending Searches</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-slate-300">
                      <th className="px-4 py-2 text-left text-slate-600">Rank</th>
                      <th className="px-4 py-2 text-left text-slate-600">Query</th>
                      <th className="px-4 py-2 text-left text-slate-600">Category</th>
                      <th className="px-4 py-2 text-left text-slate-600">Trust Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trends.trends.slice(0, 5).map((trend, idx) => (
                      <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50">
                        <td className="px-4 py-2 font-bold text-blue-600">#{trend.rank}</td>
                        <td className="px-4 py-2 font-medium text-slate-900">{trend.query}</td>
                        <td className="px-4 py-2 capitalize">
                          <span className="px-2 py-1 bg-slate-200 text-slate-700 rounded text-xs">
                            {trend.category}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          <span className={`font-bold ${trend.trust_score >= 70 ? 'text-green-600' : trend.trust_score >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {trend.trust_score}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Category Distribution */}
              <div>
                <h3 className="font-semibold text-slate-700 mb-4">Trends by Category</h3>
                <div className="space-y-2">
                  {trends.trends.reduce((acc, trend) => {
                    const existing = acc.find(t => t.category === trend.category);
                    if (existing) {
                      existing.count++;
                    } else {
                      acc.push({ category: trend.category, count: 1 });
                    }
                    return acc;
                  }, []).map((cat, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded">
                      <span className="capitalize font-medium text-slate-700">{cat.category}</span>
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-semibold">
                        {cat.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <p className="mt-4 text-slate-600 text-sm">
              📊 Source: Google Trends API | Updated: {new Date(trends.timestamp).toLocaleTimeString()}
            </p>
          </div>
        )}

        {/* Empty State */}
        {(!data?.data || data.data.length === 0) && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-slate-500 text-lg">No data yet. Start running analyses to populate the dashboard!</p>
          </div>
        )}
      </div>
    </div>
  );
}
