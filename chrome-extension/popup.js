
// --- Function declarations (ensure hoisting) ---
function showLoading() {
    document.getElementById('loading').style.display = 'block';
    document.getElementById('result').style.display = 'none';
    document.getElementById('error').style.display = 'none';
    const reportElem = document.getElementById('full-report');
    if (reportElem) reportElem.style.display = 'none';
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

function showError(message) {
    document.getElementById('error-message').textContent = message;
    document.getElementById('loading').style.display = 'none';
    document.getElementById('result').style.display = 'none';
    document.getElementById('error').style.display = 'block';

    document.getElementById('btn-retry').onclick = () => {
        showLoading();
        runAnalysis();
    };
    document.getElementById('btn-settings').onclick = () => {
        openSettings();
    };
}

function toggleReport() {
    const reportElem = window.reportElem;
    const detailBtn = window.detailBtn;
    if (!reportElem || !detailBtn) return;
    const isVisible = reportElem.style.display === 'block';
    if (isVisible) {
        reportElem.style.display = 'none';
        detailBtn.textContent = 'Show Charts';
    } else {
        reportElem.style.display = 'block';
        detailBtn.textContent = 'Hide Charts';
        setTimeout(() => {
            const chart = document.getElementById('metrics-chart');
            if (chart) {
                chart.style.display = 'block';
                drawMetricsChart(chart, window.lastAnalysis || {});
            }
        }, 0);
    }
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
        const response = await fetch(`${API_URL}/api/analyze-text`, {
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

// --- DOMContentLoaded handler (after all functions) ---
document.addEventListener('DOMContentLoaded', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        _currentTab = tabs[0];
        runAnalysis();
    });

    // Setup Show Charts button
    window.reportElem = document.getElementById('full-report');
    window.detailBtn = document.getElementById('btn-detail');
    if (window.detailBtn) {
        window.detailBtn.onclick = toggleReport;
    }
});

const DEFAULT_API_URL = 'http://localhost:8000';
const DEFAULT_APP_URL = 'http://localhost:5173'; // Frontend app URL (change if your frontend runs elsewhere)

function getConfigValue(key, defaultValue) {
    try { return localStorage.getItem(key) || defaultValue } catch { return defaultValue }
}

function setConfigValue(key, value) {
    try { localStorage.setItem(key, value) } catch {}
}

let API_URL = getConfigValue('codexiaApiUrl', DEFAULT_API_URL);
let APP_URL = getConfigValue('codexiaAppUrl', DEFAULT_APP_URL);


let _currentTab = null
let _currentPageContent = ''

async function runAnalysis() {
    if (!_currentTab) return;

    const { url, title, id } = _currentTab
    if (!url || !url.startsWith('http')) {
        showError('Cannot analyze this page type');
        return;
    }

    showLoading();

    try {
        if (!_currentPageContent) {
            _currentPageContent = await new Promise((resolve, reject) => {
                chrome.tabs.sendMessage(id, {action: 'getPageContent'}, (response) => {
                    if (chrome.runtime.lastError) {
                        return reject(chrome.runtime.lastError);
                    }
                    resolve(response?.content || '');
                });
            });
        }

        const result = await analyzeContent(_currentPageContent, url, title);
        displayResult(result);
        }
        catch (err) {
            showError('Failed to analyze: ' + (err?.message || err));
            return;
        }
    }

    function displayResult(data) {
    hideLoading();

    const analysis = data.analysis || data.results || {};
    const score = Math.round(analysis.trust_score ?? 50);
    const verdict = analysis.risk_level || 'UNKNOWN';

    document.getElementById('trust-score').textContent = score;
    document.getElementById('m-credibility').textContent = Math.round(analysis.credibility ?? 50);
    document.getElementById('m-sentiment').textContent = Math.round(analysis.sentiment ?? 50);
    document.getElementById('m-manipulation').textContent = Math.round(analysis.manipulation_score ?? 50);
    document.getElementById('m-risk').textContent = verdict;

    const badge = document.getElementById('verdict-badge');
    badge.textContent = verdict;
    badge.className = 'verdict-badge';
    if (score >= 70) badge.classList.add('safe');
    else if (score >= 40) badge.classList.add('caution');
    else badge.classList.add('dangerous');

    document.getElementById('result').style.display = 'block';

    // Full report toggle (in-popup) + open in web app


    // Removed redundant definitions of reportElem and detailBtn

    document.getElementById('btn-pdf').onclick = () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.addImage(document.querySelector('.header img').src, 'JPEG', 10, 10, 32, 32);
        doc.setFontSize(18);
        doc.text('Codexia AI Analysis', 50, 20);
        doc.setFontSize(12);
        doc.text('URL: ' + (_currentTab?.url || ''), 10, 50);
        doc.text('Score: ' + score, 10, 60);
        doc.text('Verdict: ' + verdict, 10, 70);
        doc.text('Summary:', 10, 80);
        doc.text(analysis.summary ? analysis.summary.substring(0, 400) : '', 10, 90, { maxWidth: 180 });
        doc.save('codexia-analysis.pdf');
    };
    // PDF export logic (fix: use PNG for logo, add chart images)
    document.getElementById('btn-pdf').onclick = () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        // Use PNG logo for better compatibility
        const logoImg = document.querySelector('.header img');
        if (logoImg) {
            // Convert image to base64 if not already
            const canvas = document.createElement('canvas');
            canvas.width = logoImg.naturalWidth;
            canvas.height = logoImg.naturalHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(logoImg, 0, 0);
            const imgData = canvas.toDataURL('image/png');
            doc.addImage(imgData, 'PNG', 10, 10, 32, 32);
        }
        doc.setFontSize(18);
        doc.text('Codexia AI Analysis', 50, 20);
        doc.setFontSize(12);
        doc.text('URL: ' + (_currentTab?.url || ''), 10, 50);
        doc.text('Score: ' + score, 10, 60);
        doc.text('Verdict: ' + verdict, 10, 70);
        doc.text('Summary:', 10, 80);
        doc.text(analysis.summary ? analysis.summary.substring(0, 400) : '', 10, 90, { maxWidth: 180 });
        // Add chart images if present
        const metricsChart = document.getElementById('metrics-chart');
        if (metricsChart) {
            const chartImg = metricsChart.toDataURL('image/png');
            doc.addImage(chartImg, 'PNG', 10, 110, 90, 40);
        }
        const pieChart = document.getElementById('pie-chart');
        if (pieChart) {
            const chartImg = pieChart.toDataURL('image/png');
            doc.addImage(chartImg, 'PNG', 110, 110, 90, 40);
        }
        doc.save('codexia-analysis.pdf');
    };

// ...existing code...
    function toggleReport() {
        const reportElem = window.reportElem;
        const detailBtn = window.detailBtn;
        if (!reportElem || !detailBtn) return;
        const isVisible = reportElem.style.display === 'block';
        if (isVisible) {
            reportElem.style.display = 'none';
            detailBtn.textContent = 'Show Charts';
        } else {
            reportElem.style.display = 'block';
            detailBtn.textContent = 'Hide Charts';
            setTimeout(() => {
                const chart = document.getElementById('metrics-chart');
                if (chart) {
                    chart.style.display = 'block';
                    drawMetricsChart(chart, analysis);
                }
            }, 0);
        }
    }

    // Simple bar chart for metrics
    function drawMetricsChart(canvas, analysis) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const metrics = [
            { label: 'Trust', value: analysis.trust_score ?? 0, color: '#00d4ff' },
            { label: 'Cred.', value: analysis.credibility ?? 0, color: '#7c3aed' },
            { label: 'Sent.', value: analysis.sentiment ?? 0, color: '#10b981' },
            { label: 'Manip.', value: analysis.manipulation_score ?? 0, color: '#ef4444' },
        ];
        const max = 100;
        const barW = 48, gap = 32, baseY = 100, chartH = 80;
        metrics.forEach((m, i) => {
            const x = 24 + i * (barW + gap);
            const h = Math.round((m.value / max) * chartH);
            ctx.fillStyle = m.color;
            ctx.fillRect(x, baseY - h, barW, h);
            ctx.fillStyle = '#f1f5f9';
            ctx.font = 'bold 13px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(m.label, x + barW / 2, baseY + 16);
            ctx.font = 'bold 15px monospace';
            ctx.fillText(Math.round(m.value), x + barW / 2, baseY - h - 8);
        });
        // Y axis
        ctx.strokeStyle = '#64748b';
        ctx.beginPath();
        ctx.moveTo(16, baseY - chartH);
        ctx.lineTo(16, baseY);
        ctx.stroke();
        ctx.font = '11px monospace';
        ctx.fillStyle = '#64748b';
        ctx.fillText('100', 10, baseY - chartH + 4);
        ctx.fillText('0', 10, baseY + 4);

        // Pie chart with Chart.js
        const pie = document.getElementById('pie-chart');
        if (pie && window.Chart) {
            pie.style.display = 'block';
            if (pie._chart) pie._chart.destroy();
            pie._chart = new window.Chart(pie.getContext('2d'), {
                type: 'pie',
                data: {
                    labels: ['Trust', 'Credibility', 'Sentiment', 'Manipulation'],
                    datasets: [{
                        data: [
                            analysis.trust_score ?? 0,
                            analysis.credibility ?? 0,
                            analysis.sentiment ?? 0,
                            analysis.manipulation_score ?? 0
                        ],
                        backgroundColor: ['#00d4ff', '#7c3aed', '#10b981', '#ef4444']
                    }]
                },
                options: {
                    plugins: { legend: { display: true, position: 'bottom' } },
                    responsive: false,
                    maintainAspectRatio: false
                }
            });
        }
    }




    // Removed Save Only button and handler as it is redundant

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function showLoading() {
    document.getElementById('loading').style.display = 'block';
    document.getElementById('result').style.display = 'none';
    document.getElementById('error').style.display = 'none';
    const reportElem = document.getElementById('full-report');
    if (reportElem) reportElem.style.display = 'none';
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

function showError(message) {
    document.getElementById('error-message').textContent = message;
    document.getElementById('loading').style.display = 'none';
    document.getElementById('result').style.display = 'none';
    document.getElementById('error').style.display = 'block';

    document.getElementById('btn-retry').onclick = () => {
        showLoading();
        runAnalysis();
    };
    document.getElementById('btn-settings').onclick = () => {
        openSettings();
    };
}

    const newApi = prompt('Backend API URL', API_URL);
    if (newApi) {
        API_URL = newApi;
        setConfigValue('codexiaApiUrl', API_URL);
    }
    const newApp = prompt('Frontend App URL', APP_URL);
    if (newApp) {
        APP_URL = newApp;
        setConfigValue('codexiaAppUrl', APP_URL);
    }
    // Re-run analysis after updating settings
    runAnalysis();
}
function openSettings() {
    // Theme selection
    const theme = prompt('Theme (light/dark/auto):', localStorage.getItem('codexiaTheme') || 'auto');
    if (theme && ['light','dark','auto'].includes(theme)) {
        localStorage.setItem('codexiaTheme', theme);
        document.body.setAttribute('data-theme', theme);
    }
    // Language selection
    const lang = prompt('Language (en/fr/es):', localStorage.getItem('codexiaLang') || 'en');
    if (lang && ['en','fr','es'].includes(lang)) {
        localStorage.setItem('codexiaLang', lang);
        // Optionally, reload UI with new language
    }
}

// Debug toggle code removed (no btn-toggle-debug in popup.html)
