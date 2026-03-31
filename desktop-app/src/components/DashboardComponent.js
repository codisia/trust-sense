// ==========================================
// Dashboard Component
// ==========================================

// Make sure Chart.js is available
const loadChartJS = async () => {
    if (window.Chart) return;
    return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        script.onload = resolve;
        document.head.appendChild(script);
    });
};

class DashboardComponent {
    constructor() {
        this.charts = {};
        this.dashboardData = null;
        this.init();
    }

    async init() {
        await loadChartJS();
        this.setupEventListeners();
        this.loadDashboardData();
    }

    setupEventListeners() {
        document.getElementById('refresh-dashboard')?.addEventListener('click', () => {
            this.loadDashboardData();
        });

        document.getElementById('export-report')?.addEventListener('click', () => {
            this.exportReport();
        });

        // Subscribe to context updates
        if (window.appContext) {
            window.appContext.subscribe(() => {
                this.loadDashboardData();
            });
        }
    }

    loadDashboardData() {
        const analyses = window.appContext?.getState()?.analyses || [];

        if (analyses.length === 0) {
            this.renderEmpty();
            return;
        }

        // Calculate statistics
        const stats = this.calculateStats(analyses);
        this.dashboardData = stats;

        this.renderStatistics(stats);
        this.renderCharts(stats, analyses);
    }

    calculateStats(analyses) {
        const scores = analyses.map(a => a.trust_score || 0);
        const avgScore = scores.length ? scores.reduce((a, b) => a + b) / scores.length : 0;
        const highScores = scores.filter(s => s >= 75).length;
        const mediumScores = scores.filter(s => s >= 50 && s < 75).length;
        const lowScores = scores.filter(s => s < 50).length;

        // Group by type
        const byType = {};
        analyses.forEach(a => {
            if (!byType[a.content_type]) byType[a.content_type] = 0;
            byType[a.content_type]++;
        });

        // Trend by date (last 7 days)
        const today = new Date();
        const trend = {};
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const key = date.toLocaleDateString();
            trend[key] = {
                count: 0,
                avgScore: 0,
                totalScore: 0
            };
        }

        analyses.forEach(a => {
            const date = new Date(a.timestamp).toLocaleDateString();
            if (trend[date]) {
                trend[date].count++;
                trend[date].totalScore += a.trust_score || 0;
                trend[date].avgScore = trend[date].totalScore / trend[date].count;
            }
        });

        return {
            totalAnalyses: analyses.length,
            avgScore: Math.round(avgScore),
            highScores,
            mediumScores,
            lowScores,
            byType,
            trend,
            lastAnalysis: analyses[0]
        };
    }

    renderEmpty() {
        const container = document.getElementById('statistics-container');
        if (container) {
            container.innerHTML = `
                <div class="text-center py-12">
                    <p class="text-gray-400 text-lg">${t('No analyses yet')}</p>
                    <p class="text-gray-500 text-sm">${t('Run your first analysis to see dashboard data')}</p>
                </div>
            `;
        }
    }

    renderStatistics(stats) {
        const container = document.getElementById('statistics-container');
        if (!container) return;

        container.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div class="stat-card bg-gradient-to-br from-blue-500 to-blue-600">
                    <div class="text-3xl font-bold">${stats.totalAnalyses}</div>
                    <div class="text-sm opacity-90">${t('Total Analyses')}</div>
                </div>
                <div class="stat-card bg-gradient-to-br from-green-500 to-green-600">
                    <div class="text-3xl font-bold">${stats.avgScore}</div>
                    <div class="text-sm opacity-90">${t('Average Score')}</div>
                </div>
                <div class="stat-card bg-gradient-to-br from-yellow-500 to-yellow-600">
                    <div class="text-3xl font-bold">${stats.mediumScores}</div>
                    <div class="text-sm opacity-90">Medium Credibility</div>
                </div>
                <div class="stat-card bg-gradient-to-br from-red-500 to-red-600">
                    <div class="text-3xl font-bold">${stats.lowScores}</div>
                    <div class="text-sm opacity-90">Low Credibility</div>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div class="bg-gray-800 p-4 rounded-lg">
                    <h3 class="font-bold mb-2">${t('By Content Type')}</h3>
                    <ul class="text-sm space-y-1">
                        ${Object.entries(stats.byType).map(([type, count]) => 
                            `<li>${type.toUpperCase()}: <span class="font-bold">${count}</span></li>`
                        ).join('')}
                    </ul>
                </div>
                <div class="bg-gray-800 p-4 rounded-lg">
                    <h3 class="font-bold mb-2">${t('Credibility Breakdown')}</h3>
                    <div class="space-y-1">
                        <div class="text-sm">
                            <div class="flex justify-between mb-1">
                                <span>High (75+)</span>
                                <span class="font-bold text-green-400">${stats.highScores}</span>
                            </div>
                            <div class="w-full bg-gray-700 rounded h-2">
                                <div class="bg-green-500 h-2 rounded" style="width: ${(stats.highScores / stats.totalAnalyses * 100) || 0}%"></div>
                            </div>
                        </div>
                        <div class="text-sm">
                            <div class="flex justify-between mb-1">
                                <span>Medium (50-74)</span>
                                <span class="font-bold text-yellow-400">${stats.mediumScores}</span>
                            </div>
                            <div class="w-full bg-gray-700 rounded h-2">
                                <div class="bg-yellow-500 h-2 rounded" style="width: ${(stats.mediumScores / stats.totalAnalyses * 100) || 0}%"></div>
                            </div>
                        </div>
                        <div class="text-sm">
                            <div class="flex justify-between mb-1">
                                <span>Low (&lt;50)</span>
                                <span class="font-bold text-red-400">${stats.lowScores}</span>
                            </div>
                            <div class="w-full bg-gray-700 rounded h-2">
                                <div class="bg-red-500 h-2 rounded" style="width: ${(stats.lowScores / stats.totalAnalyses * 100) || 0}%"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderCharts(stats, analyses) {
        // Trust Trend Chart
        this.renderTrendChart(stats.trend);

        // Type Distribution Chart
        this.renderTypeChart(stats.byType);

        // Score Distribution Chart
        this.renderScoreChart(analyses);
    }

    renderTrendChart(trend) {
        const ctx = document.getElementById('trend-chart');
        if (!ctx) return;

        const dates = Object.keys(trend);
        const scores = dates.map(d => Math.round(trend[d].avgScore));

        if (this.charts.trend) this.charts.trend.destroy();

        this.charts.trend = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [{
                    label: 'Avg Trust Score',
                    data: scores,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: true } },
                scales: {
                    y: { beginAtZero: true, max: 100,
                        ticks: { color: '#9ca3af' },
                        grid: { color: 'rgba(156, 163, 175, 0.1)' }
                    },
                    x: { ticks: { color: '#9ca3af' }, grid: { display: false } }
                }
            }
        });
    }

    renderTypeChart(byType) {
        const ctx = document.getElementById('type-chart');
        if (!ctx) return;

        if (this.charts.type) this.charts.type.destroy();

        this.charts.type = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(byType),
                datasets: [{
                    data: Object.values(byType),
                    backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { position: 'bottom', labels: { color: '#d1d5db' } } }
            }
        });
    }

    renderScoreChart(analyses) {
        const ctx = document.getElementById('score-chart');
        if (!ctx) return;

        const bins = { '0-20': 0, '21-40': 0, '41-60': 0, '61-80': 0, '81-100': 0 };
        analyses.forEach(a => {
            const score = a.trust_score || 0;
            if (score <= 20) bins['0-20']++;
            else if (score <= 40) bins['21-40']++;
            else if (score <= 60) bins['41-60']++;
            else if (score <= 80) bins['61-80']++;
            else bins['81-100']++;
        });

        if (this.charts.score) this.charts.score.destroy();

        this.charts.score = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Object.keys(bins),
                datasets: [{
                    label: 'Number of Analyses',
                    data: Object.values(bins),
                    backgroundColor: '#3b82f6'
                }]
            },
            options: {
                responsive: true,
                indexAxis: 'y',
                scales: {
                    x: { ticks: { color: '#9ca3af' }, grid: { color: 'rgba(156, 163, 175, 0.1)' } },
                    y: { ticks: { color: '#9ca3af' } }
                }
            }
        });
    }

    exportReport() {
        if (!this.dashboardData) {
            window.appContext?.addNotification(t('No data to export'), 'warning');
            return;
        }

        const stats = this.dashboardData;
        const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Trust Sense Dashboard Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
        h1 { color: #3b82f6; }
        .stat { display: inline-block; margin: 10px 20px 10px 0; }
        .stat-value { font-size: 24px; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #3b82f6; color: white; }
    </style>
</head>
<body>
    <h1>Trust Sense Dashboard Report</h1>
    <p>Generated: ${new Date().toLocaleString()}</p>

    <h2>Statistics</h2>
    <div class="stat">
        <div style="color: #999;">Total Analyses</div>
        <div class="stat-value">${stats.totalAnalyses}</div>
    </div>
    <div class="stat">
        <div style="color: #999;">Average Score</div>
        <div class="stat-value">${stats.avgScore}</div>
    </div>
    <div class="stat">
        <div style="color: #999;">High Credibility</div>
        <div class="stat-value" style="color: green;">${stats.highScores}</div>
    </div>
    <div class="stat">
        <div style="color: #999;">Low Credibility</div>
        <div class="stat-value" style="color: red;">${stats.lowScores}</div>
    </div>

    <h2>Distribution by Type</h2>
    <table>
        <tr>
            <th>Content Type</th>
            <th>Count</th>
        </tr>
        ${Object.entries(stats.byType).map(([type, count]) => 
            `<tr><td>${type}</td><td>${count}</td></tr>`
        ).join('')}
    </table>
</body>
</html>
        `;

        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dashboard-report-${Date.now()}.html`;
        a.click();
        URL.revokeObjectURL(url);

        window.appContext?.addNotification(t('Report exported'), 'success');
    }
}

// Initialize
window.dashboardComponent = new DashboardComponent();
