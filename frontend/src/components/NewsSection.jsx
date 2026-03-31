import { useState, useEffect } from 'react'
import { newsAPI } from '../services/api'
import { Card, CardTitle, Button, Badge, Spinner } from '../components/UI'
import { useTheme } from '../context/ThemeContext'

export default function NewsSection({ isMobile }) {
  const { theme } = useTheme()
  const [articles, setArticles] = useState([])
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(false)
  const [runningPipeline, setRunningPipeline] = useState(false)

  useEffect(() => {
    loadNewsData()
  }, [])

  const loadNewsData = async () => {
    setLoading(true)
    try {
      const [articlesRes, videosRes] = await Promise.all([
        newsAPI.getLatestArticles(),
        newsAPI.getVideos()
      ])
      setArticles(articlesRes.data || [])
      setVideos(videosRes.data || [])
    } catch (error) {
      // Failed to load news data
    } finally {
      setLoading(false)
    }
  }

  const runPipeline = async () => {
    setRunningPipeline(true)
    try {
      await newsAPI.runPipeline({
        trust_threshold: 70,
        publish_platforms: ['youtube'],
        include_sign_language: false
      })
      // Reload data after pipeline completes
      await loadNewsData()
    } catch (error) {
      // Pipeline execution failed
    } finally {
      setRunningPipeline(false)
    }
  }

  return (
    <div style={{ marginBottom: '32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <div style={{ fontFamily: theme.fontDisplay, fontSize: '20px', fontWeight: 800, letterSpacing: '-0.02em' }}>
            AI News Broadcasting
          </div>
          <div style={{ color: theme.muted, fontSize: '12px' }}>
            Automated news analysis, script generation, and video publishing
          </div>
        </div>
        <Button
          onClick={runPipeline}
          disabled={runningPipeline}
          style={{
            padding: '8px 16px',
            fontSize: '12px',
            background: runningPipeline ? theme.muted : theme.accent,
            color: runningPipeline ? theme.text : '#000'
          }}
        >
          {runningPipeline ? <><Spinner /> RUNNING...</> : 'Run Pipeline'}
        </Button>
      </div>

      {/* News Videos */}
      {videos.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <CardTitle style={{ marginBottom: '12px' }}>Latest AI News Videos</CardTitle>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '16px'
          }}>
            {videos.slice(0, 6).map((video) => (
              <Card key={video.id} style={{ padding: '16px' }}>
                {video.video_url ? (
                  <video
                    controls
                    style={{
                      width: '100%',
                      height: '180px',
                      borderRadius: '8px',
                      marginBottom: '12px',
                      background: theme.bg
                    }}
                    src={video.video_url}
                  />
                ) : (
                  <div style={{
                    width: '100%',
                    height: '180px',
                    borderRadius: '8px',
                    marginBottom: '12px',
                    background: 'rgba(255,255,255,0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: theme.muted
                  }}>
                    Video Processing...
                  </div>
                )}
                <div style={{ fontSize: '12px', color: theme.muted, marginBottom: '8px' }}>
                  Status: <Badge color={video.status === 'generated' ? theme.accent : theme.warn}>
                    {video.status}
                  </Badge>
                </div>
                <div style={{ fontSize: '11px', color: theme.text }}>
                  Created: {new Date(video.created_at).toLocaleString()}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Latest Articles */}
      <div>
        <CardTitle style={{ marginBottom: '12px' }}>Analyzed News Articles</CardTitle>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '16px'
        }}>
          {loading ? (
            <Card style={{ padding: '32px', textAlign: 'center' }}>
              <Spinner /> Loading news data...
            </Card>
          ) : articles.length === 0 ? (
            <Card style={{ padding: '32px', textAlign: 'center', color: theme.muted }}>
              No articles analyzed yet. Run the pipeline to get started.
            </Card>
          ) : (
            articles.slice(0, 8).map((article) => (
              <Card key={article.id} style={{ padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: theme.text,
                      marginBottom: '4px',
                      lineHeight: '1.4'
                    }}>
                      {article.title}
                    </h4>
                    <div style={{ fontSize: '11px', color: theme.muted }}>
                      {article.source} • {new Date(article.published_at || article.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <Badge color={article.trust_score >= 70 ? theme.accent3 : article.trust_score >= 40 ? theme.warn : theme.danger}>
                    {Math.round(article.trust_score || 0)}%
                  </Badge>
                </div>
                {article.content && (
                  <p style={{
                    fontSize: '12px',
                    color: theme.muted,
                    lineHeight: '1.5',
                    marginBottom: '12px',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {article.content}
                  </p>
                )}
                <div style={{ display: 'flex', gap: '8px', fontSize: '10px', color: theme.muted }}>
                  <span>Language: {article.language}</span>
                  {article.url && (
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: theme.accent, textDecoration: 'none' }}
                    >
                      Source →
                    </a>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}