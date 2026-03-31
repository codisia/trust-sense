/**
 * Firefox Extension Popup - Cross-browser compatible
 */

const API_BASE_URL = 'http://localhost:8000'
let lastAnalysis = null
let currentTab = null

// Get current tab (Firefox compatible)
async function getCurrentTab() {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true })
    return tabs[0]
}

// Send message to content script (Firefox compatible)
function sendMessage(tab, message) {
    return browser.tabs.sendMessage(tab.id, message)
}

// Real analyzeContent function that calls backend API
async function analyzeContent(content, url, title) {
    try {
        console.log('📝 Calling backend API...')
        
        // Combine content for analysis
        let analysisText = `Title: ${title}\n\nContent: ${content}`
        if (url) {
            analysisText = `URL: ${url}\n\n${analysisText}`
        }

        // Call backend API
        const response = await fetch(`${API_BASE_URL}/api/analyze-text`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: analysisText.substring(0, 5000) })
        })

        if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        console.log('✅ Analysis received from API:', data)
        
        return {
            analysis: {
                trust_score: data.trust_score || 0,
                credibility: Math.round((data.credibility || 0) * 100),
                sentiment: Math.round((data.sentiment || 0.5) * 100),
                manipulation_score: Math.round((data.manipulation_score || 0) * 100),
                risk_level: data.risk_level || 'UNKNOWN',
                summary: data.summary || generateAnalysisSummary(data)
            }
        }
    } catch (error) {
        console.error('❌ Analysis error:', error)
        throw error
    }
}

// Generate summary from analysis if not provided
function generateAnalysisSummary(data) {
    const score = Math.round(data.trust_score || 0)
    const risk = data.risk_level || 'UNKNOWN'
    
    if (score >= 80) {
        return `✅ High credibility content (${score}% trust score, ${risk} risk)`
    } else if (score >= 60) {
        return `⚠️ Moderate credibility (${score}% trust score, ${risk} risk)`
    } else {
        return `❌ Low credibility content (${score}% trust score, ${risk} risk)`
    }
}

// UI Functions
function showLoading() {
    document.getElementById('loading').style.display = 'flex'
    document.getElementById('result').style.display = 'none'
    document.getElementById('error').style.display = 'none'
    document.getElementById('btn-retry').style.display = 'none'
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none'
}

function showError(message) {
    const errorMsg = document.getElementById('error-message')
    const error = document.getElementById('error')
    const result = document.getElementById('result')
    const loading = document.getElementById('loading')
    const retryBtn = document.getElementById('btn-retry')
    
    errorMsg.textContent = message
    error.style.display = 'block'
    result.style.display = 'none'
    loading.style.display = 'none'
    retryBtn.style.display = 'inline-block'
}

// Display results
function displayResult(analysis) {
    hideLoading()
    
    const score = Math.round(analysis.trust_score || 0)
    const verdict = analysis.risk_level || 'UNKNOWN'
    
    document.getElementById('trust-score').textContent = score
    document.getElementById('m-credibility').textContent = Math.round(analysis.credibility || 0)
    document.getElementById('m-sentiment').textContent = Math.round(analysis.sentiment || 0)
    document.getElementById('m-manipulation').textContent = Math.round(analysis.manipulation_score || 0)
    document.getElementById('m-risk').textContent = verdict
    document.getElementById('summary-text').textContent = analysis.summary || 'No summary available'
    
    const badge = document.getElementById('verdict-badge')
    badge.textContent = verdict
    badge.className = 'verdict-badge'
    
    if (score >= 70) {
        badge.classList.add('safe')
    } else if (score >= 40) {
        badge.classList.add('caution')
    } else {
        badge.classList.add('dangerous')
    }
    
    document.getElementById('result').style.display = 'block'
}

// Run analysis on popup open
async function runAnalysis() {
    try {
        showLoading()
        
        currentTab = await getCurrentTab()
        
        // Get content from page
        let pageContent = ''
        try {
            const response = await sendMessage(currentTab, { action: 'getPageContent' })
            pageContent = response?.content || 'Unable to extract page content'
        } catch (error) {
            console.warn('Could not get page content via content script:', error)
            pageContent = 'Page content extraction failed'
        }

        // Analyze content
        const result = await analyzeContent(pageContent, currentTab.url, currentTab.title)
        
        if (result.analysis) {
            lastAnalysis = result.analysis
            displayResult(result.analysis)
        }
    } catch (error) {
        console.error('Analysis error:', error)
        showError(`Analysis failed: ${error.message}`)
    }
}

// Initialize on popup open
document.addEventListener('DOMContentLoaded', () => {
    runAnalysis()
    
    // Retry button
    document.getElementById('btn-retry').addEventListener('click', () => {
        runAnalysis()
    })
    
    // Open full report button
    document.getElementById('btn-open-full').addEventListener('click', () => {
        if (currentTab) {
            browser.tabs.create({
                url: `http://localhost:5173?analyze=${encodeURIComponent(currentTab.url)}`
            })
        }
    })
})
