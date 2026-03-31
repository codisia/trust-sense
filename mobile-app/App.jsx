import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import axios from 'axios';

const API_URL = 'http://localhost:8001';

export default function App() {
  const [activeTab, setActiveTab] = useState('analyze');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [newsVideos, setNewsVideos] = useState([]);

  const analyzeContent = async () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Please enter content to analyze');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${API_URL}/api/platforms/mobile/quick-analyze`,
        {
          text: content,
        }
      );

      setResult(response.data);
      setContent('');
    } catch (error) {
      Alert.alert('Error', error.message || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${API_URL}/api/analysis-history`
      );
      setHistory(response.data || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const loadNewsVideos = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${API_URL}/api/news/videos?limit=10`
      );
      setNewsVideos(response.data || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load news videos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🔍 TRUST SENSE</Text>
        <Text style={styles.headerSubtitle}>Mobile Analysis</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'analyze' && styles.activeTab]}
          onPress={() => setActiveTab('analyze')}
        >
          <Text style={[styles.tabText, activeTab === 'analyze' && styles.activeTabText]}>
            Analyze
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.activeTab]}
          onPress={() => {
            setActiveTab('history');
            loadHistory();
          }}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
            History
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'news' && styles.activeTab]}
          onPress={() => {
            setActiveTab('news');
            loadNewsVideos();
          }}
        >
          <Text style={[styles.tabText, activeTab === 'news' && styles.activeTabText]}>
            AI News
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>
        {activeTab === 'analyze' ? (
          <View style={styles.section}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Content to Analyze</Text>
              <TextInput
                style={styles.input}
                placeholder="Paste URL or text..."
                value={content}
                onChangeText={setContent}
                multiline
                numberOfLines={5}
                placeholderTextColor="#999"
              />
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={analyzeContent}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>🔍 Analyze Now</Text>
              )}
            </TouchableOpacity>

            {result && (
              <View style={styles.resultCard}>
                <View style={styles.scoreBox}>
                  <Text style={styles.scoreNumber}>{Math.round(result.trust_score)}</Text>
                  <Text style={styles.scoreLabel}>Trust Score</Text>
                </View>

                <View style={styles.metricRow}>
                  <Text style={styles.metricLabel}>Risk Level:</Text>
                  <Text style={styles.metricValue}>{result.risk_level}</Text>
                </View>

                {result.emotion && (
                  <View style={styles.metricRow}>
                    <Text style={styles.metricLabel}>Emotion:</Text>
                    <Text style={styles.metricValue}>{result.emotion}</Text>
                  </View>
                )}

                {result.summary && (
                  <View style={styles.metricRow}>
                    <Text style={styles.metricLabel}>Summary:</Text>
                    <Text style={styles.metricValue}>{result.summary}</Text>
                  </View>
                )}

                {result.recommendation && (
                  <View style={styles.recommendations}>
                    <Text style={styles.recommendationTitle}>📝 Recommendation:</Text>
                    <Text style={styles.recommendationItem}>
                      {result.recommendation}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        ) : activeTab === 'history' ? (
          <View style={styles.section}>
            {loading ? (
              <ActivityIndicator size="large" color="#667eea" style={{ marginTop: 20 }} />
            ) : history.length > 0 ? (
              history.map((item, index) => (
                <View key={`history-${index}`} style={styles.historyItem}>
                  <View style={styles.historyRow}>
                    <Text style={styles.historyContent}>
                      {item.raw_input ? item.raw_input.substring(0, 50) + '...' : 'No content'}
                    </Text>
                    <Text style={styles.historyScore}>{Math.round(item.trust_score || 0)}</Text>
                  </View>
                  <View style={styles.historyMeta}>
                    <Text style={styles.historyMetaText}>
                      {item.risk_level || 'Unknown'} • {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Unknown date'}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No history yet</Text>
            )}
          </View>
        ) : activeTab === 'news' ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>AI Generated News Videos</Text>
            {loading ? (
              <ActivityIndicator size="large" color="#667eea" style={{ marginTop: 20 }} />
            ) : newsVideos.length > 0 ? (
              newsVideos.map((video, index) => (
                <View key={`video-${index}`} style={styles.videoItem}>
                  <Text style={styles.videoTitle}>
                    AI News Broadcast #{video.id}
                  </Text>
                  <Text style={styles.videoMeta}>
                    Status: {video.status} • {video.created_at ? new Date(video.created_at).toLocaleDateString() : 'Unknown date'}
                  </Text>
                  {video.video_url ? (
                    <TouchableOpacity
                      style={styles.videoButton}
                      onPress={() => {
                        // In a real app, you'd open the video in a player
                        Alert.alert('Video', `Open video: ${video.video_url}`);
                      }}
                    >
                      <Text style={styles.videoButtonText}>▶️ Watch Video</Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.processingText}>Video processing...</Text>
                  )}
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No AI news videos yet</Text>
            )}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#667eea',
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#667eea',
  },
  tabText: {
    fontSize: 16,
    color: '#999',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#667eea',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  section: {
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    fontSize: 14,
    color: '#333',
    textAlignVertical: 'top',
    minHeight: 100,
  },
  button: {
    backgroundColor: '#667eea',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginVertical: 15,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  resultCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 20,
    marginTop: 15,
  },
  scoreBox: {
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  scoreNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#667eea',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  metricLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#667eea',
  },
  recommendations: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  recommendationTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  recommendationItem: {
    fontSize: 13,
    color: '#555',
    marginBottom: 8,
    lineHeight: 18,
  },
  historyItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyContent: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  historyScore: {
    fontSize: 16,
    fontWeight: '700',
    color: '#667eea',
    marginLeft: 10,
  },
  historyMetaText: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  videoItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  videoMeta: {
    fontSize: 12,
    color: '#999',
    marginBottom: 10,
  },
  videoButton: {
    backgroundColor: '#667eea',
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 15,
    alignItems: 'center',
  },
  videoButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  processingText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 10,
  },
});
