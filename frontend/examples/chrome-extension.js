/**
 * TRUST SENSE Chrome Extension - Manifest & Background Script
 * Analyzes web page content in real-time
 */

// manifest.json
const manifestJSON = {
  "manifest_version": 3,
  "name": "TRUST SENSE - Media Intelligence",
  "version": "1.0.0",
  "description": "Real-time analysis of web page content for credibility and trustworthiness",
  "permissions": [
    "activeTab",
    "scripting",
    "storage",
    "webRequest"
  ],
  "host_permissions": [
    "<all_urls>"
  ],
  "background": {
    "service_worker": "background.js"
  },
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "images/icon-16.png",
      "48": "images/icon-48.png",
      "128": "images/icon-128.png"
    }
  },
  "icons": {
    "16": "images/icon-16.png",
    "48": "images/icon-48.png",
    "128": "images/icon-128.png"
  }
};

// popup.html
const popupHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>TRUST SENSE</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            width: 400px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #333;
        }
        
        .container {
            padding: 20px;
            max-height: 600px;
            overflow-y: auto;
        }
        
        .header {
            text-align: center;
            margin-bottom: 20px;
            color: white;
        }
        
        .header h1 {
            font-size: 24px;
            margin-bottom: 5px;
        }
        
        .header p {
            font-size: 12px;
            opacity: 0.9;
        }
        
        .loading {
            text-align: center;
            padding: 40px 20px;
            color: white;
        }
        
        .spinner {
            display: inline-block;
            width: 40px;
            height: 40px;
            border: 4px solid rgba(255,255,255,0.3);
            border-top: 4px solid white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .result {
            background: white;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 15px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .verdict {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 15px;
            padding-bottom: 15px;
            border-bottom: 1px solid #eee;
        }
        
        .verdict-badge {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: bold;
            font-size: 14px;
        }
        
        .verdict-safe {
            background: #4caf50;
            color: white;
        }
        
        .verdict-caution {
            background: #ff9800;
            color: white;
        }
        
        .verdict-dangerous {
            background: #f44336;
            color: white;
        }
        
        .trust-score {
            text-align: center;
            margin-bottom: 15px;
        }
        
        .score-number {
            font-size: 36px;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 5px;
        }
        
        .score-label {
            font-size: 12px;
            color: #999;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .metric {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
            border-bottom: 1px solid #f0f0f0;
        }
        
        .metric-name {
            font-weight: 500;
            font-size: 14px;
        }
        
        .metric-value {
            font-size: 14px;
            color: #667eea;
            font-weight: bold;
        }
        
        .metrics {
            margin-bottom: 15px;
        }
        
        .recommendations {
            background: #f5f5f5;
            padding: 15px;
            border-radius: 6px;
            margin-top: 15px;
        }
        
        .recommendations h3 {
            font-size: 12px;
            text-transform: uppercase;
            color: #999;
            margin-bottom: 10px;
            font-weight: 600;
        }
        
        .recommendations ul {
            list-style: none;
            padding: 0;
        }
        
        .recommendations li {
            font-size: 13px;
            color: #555;
            margin-bottom: 8px;
            padding-left: 20px;
            position: relative;
        }
        
        .recommendations li:before {
            content: "•";
            position: absolute;
            left: 0;
            color: #667eea;
            font-weight: bold;
        }
        
        .error {
            background: white;
            border-radius: 8px;
            padding: 20px;
            color: #f44336;
            text-align: center;
        }
        
        .button-group {
            display: flex;
            gap: 10px;
            margin-top: 15px;
        }
        
        button {
            flex: 1;
            padding: 10px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 500;
            transition: all 0.3s;
        }
        
        .btn-primary {
            background: #667eea;
            color: white;
        }
        
        .btn-primary:hover {
            background: #5568d3;
            transform: translateY(-2px);
        }
        
        .btn-secondary {
            background: #f0f0f0;
            color: #333;
        }
        
        .btn-secondary:hover {
            background: #e0e0e0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔍 TRUST SENSE</h1>
            <p>Page credibility analysis</p>
        </div>
        
        <div id="loading" class="loading" style="display: none;">
            <div class="spinner"></div>
            <p style="margin-top: 15px; color: white;">Analyzing page...</p>
        </div>
        
        <div id="result" class="result" style="display: none;">
            <div class="verdict">
                <span>Page Assessment:</span>
                <span class="verdict-badge" id="verdict-badge"></span>
            </div>
            
            <div class="trust-score">
                <div class="score-number" id="trust-score">-</div>
                <div class="score-label">Trust Score</div>
            </div>
            
            <div class="metrics">
                <div class="metric">
                    <span class="metric-name">Credibility</span>
                    <span class="metric-value" id="metric-credibility">-</span>
                </div>
                <div class="metric">
                    <span class="metric-name">Sentiment</span>
                    <span class="metric-value" id="metric-sentiment">-</span>
                </div>
                <div class="metric">
                    <span class="metric-name">Manipulation</span>
                    <span class="metric-value" id="metric-manipulation">-</span>
                </div>
                <div class="metric">
                    <span class="metric-name">Bias Risk</span>
                    <span class="metric-value" id="metric-bias">-</span>
                </div>
            </div>
            
            <div class="recommendations">
                <h3>Recommendations</h3>
                <ul id="recommendations-list">
                    <li>Verify claims from multiple sources</li>
                    <li>Check author credibility</li>
                    <li>Look for evidence and citations</li>
                </ul>
            </div>
            
            <div class="button-group">
                <button class="btn-primary" id="btn-detail">View Details</button>
                <button class="btn-secondary" id="btn-report">Report Issue</button>
            </div>
        </div>
        
        <div id="error" class="error" style="display: none;">
            <p id="error-message">Unable to analyze this page</p>
        </div>
    </div>
    
    <script src="popup.js"></script>
</body>
</html>
`;

// popup.js
const popupJS = `
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Get current tab
        const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
        
        if (!tab.url.startsWith('http')) {
            showError('Cannot analyze this page type');
            return;
        }
        
        // Show loading state
        showLoading();
        
        // Get page content
        const pageContent = await getPageContent(tab.id);
        
        // Analyze with TRUST SENSE API
        const result = await analyzeWithAPI(pageContent, tab.url, tab.title);
        
        // Display results
        displayResult(result);
        
    } catch (error) {
        console.error('Error:', error);
        showError(error.message);
    }
});

async function getPageContent(tabId) {
    return new Promise((resolve) => {
        chrome.tabs.sendMessage(tabId, {action: 'getPageContent'}, (response) => {
            if (response && response.content) {
                resolve(response.content);
            } else {
                resolve('');
            }
        });
    });
}

async function analyzeWithAPI(content, url, title) {
    const response = await fetch('http://localhost:8000/api/platforms/chrome/analyze-page', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-API-Key': 'chrome-extension-key'
        },
        body: JSON.stringify({
            page_url: url,
            page_title: title,
            page_content: content.substring(0, 5000) // Limit to 5000 chars
        })
    });
    
    if (!response.ok) {
        throw new Error('API error: ' + response.status);
    }
    
    return response.json();
}

function displayResult(data) {
    hideLoading();
    
    const trustScore = data.verdict_score || 50;
    const verdict = data.verdict || 'CAUTION';
    
    document.getElementById('trust-score').textContent = Math.round(trustScore);
    document.getElementById('metric-credibility').textContent = 
        data.metrics?.credibility || '--';
    document.getElementById('metric-sentiment').textContent = 
        data.metrics?.sentiment || '--';
    document.getElementById('metric-manipulation').textContent = 
        data.metrics?.manipulation || '--';
    document.getElementById('metric-bias').textContent = 
        data.metrics?.bias || '--';
    
    // Set verdict badge
    const badge = document.getElementById('verdict-badge');
    badge.textContent = verdict;
    badge.className = 'verdict-badge';
    if (verdict === 'SAFE') badge.classList.add('verdict-safe');
    else if (verdict === 'CAUTION') badge.classList.add('verdict-caution');
    else if (verdict === 'DANGEROUS') badge.classList.add('verdict-dangerous');
    
    // Display recommendations
    if (data.recommendations && Array.isArray(data.recommendations)) {
        const list = document.getElementById('recommendations-list');
        list.innerHTML = data.recommendations
            .map(rec => \`<li>\${rec}</li>\`)
            .join('');
    }
    
    document.getElementById('result').style.display = 'block';
}

function showLoading() {
    document.getElementById('loading').style.display = 'block';
    document.getElementById('result').style.display = 'none';
    document.getElementById('error').style.display = 'none';
}

function showError(message) {
    document.getElementById('error-message').textContent = message;
    document.getElementById('loading').style.display = 'none';
    document.getElementById('result').style.display = 'none';
    document.getElementById('error').style.display = 'block';
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

// Button handlers
document.getElementById('btn-detail')?.addEventListener('click', () => {
    chrome.runtime.openOptionsPage?.();
});

document.getElementById('btn-report')?.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://trustsense.com/report' });
});
`;

// content.js - Injected into page to extract content
const contentJS = `
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getPageContent') {
        // Extract text content from page
        const text = document.body.innerText;
        const links = Array.from(document.querySelectorAll('a[href*="http"]'))
            .map(a => ({text: a.textContent, url: a.href}))
            .slice(0, 10);
        const images = Array.from(document.querySelectorAll('img[alt]'))
            .map(img => img.alt)
            .slice(0, 10);
        
        sendResponse({
            content: text.substring(0, 10000)
        });
    }
});
`;

// Export for documentation
console.log('manifest.json:', JSON.stringify(manifestJSON, null, 2));
console.log('popup.html:', popupHTML);
console.log('popup.js:', popupJS);
console.log('content.js:', contentJS);
