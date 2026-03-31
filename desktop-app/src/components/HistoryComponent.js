// ==========================================
// History Component
// ==========================================

class HistoryComponent {
    constructor() {
        this.analyses = [];
        this.filteredAnalyses = [];
        this.currentPage = 1;
        this.pageSize = 10;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadHistories();
    }

    setupEventListeners() {
        // Search
        document.getElementById('history-search')?.addEventListener('input', (e) => {
            this.search(e.target.value);
        });

        // Filter by type
        document.getElementById('type-filter')?.addEventListener('change', (e) => {
            this.filter({ type: e.target.value });
        });

        // Filter by score
        document.getElementById('score-filter')?.addEventListener('change', (e) => {
            this.filter({ score: e.target.value });
        });

        // Export
        document.getElementById('export-btn')?.addEventListener('click', () => {
            this.exportCSV();
        });

        // Delete all
        document.getElementById('delete-all-btn')?.addEventListener('click', () => {
            this.deleteAll();
        });

        // Pagination
        document.getElementById('prev-page')?.addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.render();
            }
        });

        document.getElementById('next-page')?.addEventListener('click', () => {
            if (this.currentPage * this.pageSize < this.filteredAnalyses.length) {
                this.currentPage++;
                this.render();
            }
        });

        // Subscribe to app context for new analyses
        if (window.appContext) {
            window.appContext.subscribe((state) => {
                this.analyses = state.analyses;
                this.filteredAnalyses = state.analyses;
                this.currentPage = 1;
                this.render();
            });
        }
    }

    async loadHistories() {
        try {
            const histories = await window.electronAPI?.getAnalysisHistory?.();
            if (histories) {
                this.analyses = histories;
                this.filteredAnalyses = histories;
                if (window.appContext) {
                    window.appContext.setState({ analyses: histories });
                }
                this.render();
            }
        } catch (error) {
            console.error('Error loading history:', error);
            window.appContext?.addNotification('Error loading history', 'error');
        }
    }

    search(query) {
        if (!query.trim()) {
            this.filteredAnalyses = this.analyses;
        } else {
            this.filteredAnalyses = this.analyses.filter(a =>
                a.content?.toLowerCase().includes(query.toLowerCase()) ||
                a.content_type?.toLowerCase().includes(query.toLowerCase())
            );
        }
        this.currentPage = 1;
        this.render();
    }

    filter(filters) {
        let filtered = [...this.analyses];

        if (filters.type && filters.type !== 'all') {
            filtered = filtered.filter(a => a.content_type === filters.type);
        }

        if (filters.score) {
            const [min, max] = filters.score.split('-').map(Number);
            filtered = filtered.filter(a => {
                const score = a.trust_score;
                return score >= min && (max ? score <= max : true);
            });
        }

        this.filteredAnalyses = filtered;
        this.currentPage = 1;
        this.render();
    }

    render() {
        const tbody = document.getElementById('history-table-body');
        if (!tbody) return;

        if (this.filteredAnalyses.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-8 text-gray-500">
                        ${t('No analyses yet')}
                    </td>
                </tr>
            `;
            return;
        }

        const start = (this.currentPage - 1) * this.pageSize;
        const end = start + this.pageSize;
        const pageItems = this.filteredAnalyses.slice(start, end);

        tbody.innerHTML = pageItems.map(analysis => `
            <tr class="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                <td class="px-4 py-3">${new Date(analysis.timestamp).toLocaleDateString()}</td>
                <td class="px-4 py-3">
                    <span class="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                        ${analysis.content_type.toUpperCase()}
                    </span>
                </td>
                <td class="px-4 py-3 font-bold">${Math.round(analysis.trust_score)}</td>
                <td class="px-4 py-3">
                    <div class="flex gap-2">
                        <button onclick="window.historyComponent.viewDetail('${analysis.id}')" 
                                class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm">
                            ${t('View')}
                        </button>
                        <button onclick="window.historyComponent.deleteItem('${analysis.id}')" 
                                class="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm">
                            ${t('Delete')}
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        // Update pagination
        const pageInfo = document.getElementById('page-info');
        if (pageInfo) {
            pageInfo.textContent = `${t('Page')} ${this.currentPage} / ${Math.ceil(this.filteredAnalyses.length / this.pageSize)}`;
        }

        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');
        if (prevBtn) prevBtn.disabled = this.currentPage === 1;
        if (nextBtn) nextBtn.disabled = this.currentPage * this.pageSize >= this.filteredAnalyses.length;
    }

    viewDetail(id) {
        const analysis = this.analyses.find(a => a.id === id);
        if (analysis) {
            window.appContext?.setNestedState('currentAnalysis', analysis);
            // Show modal or detail view
            this.showDetailModal(analysis);
        }
    }

    showDetailModal(analysis) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
                <h2 class="text-2xl font-bold mb-4">${t('Analysis Details')}</h2>
                
                <div class="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <p class="text-gray-500 text-sm">${t('Date')}</p>
                        <p class="font-bold">${new Date(analysis.timestamp).toLocaleString()}</p>
                    </div>
                    <div>
                        <p class="text-gray-500 text-sm">${t('Type')}</p>
                        <p class="font-bold">${analysis.content_type}</p>
                    </div>
                    <div>
                        <p class="text-gray-500 text-sm">${t('Trust Score')}</p>
                        <p class="font-bold text-lg">${Math.round(analysis.trust_score)}</p>
                    </div>
                    <div>
                        <p class="text-gray-500 text-sm">${t('Credibility')}</p>
                        <p class="font-bold">${analysis.credibility || 'N/A'}</p>
                    </div>
                </div>

                <div class="mb-4">
                    <p class="text-gray-500 text-sm mb-2">${t('Content')}</p>
                    <p class="bg-gray-100 dark:bg-gray-700 p-3 rounded max-h-32 overflow-y-auto">
                        ${analysis.content?.substring(0, 500) || 'N/A'}...
                    </p>
                </div>

                <div class="flex gap-2">
                    <button onclick="this.closest('.fixed').remove()" class="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500">
                        ${t('Close')}
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    async deleteItem(id) {
        if (!confirm(t('Are you sure? This cannot be undone.'))) return;

        try {
            await window.electronAPI?.deleteAnalysis?.(id);
            this.analyses = this.analyses.filter(a => a.id !== id);
            this.filteredAnalyses = this.filteredAnalyses.filter(a => a.id !== id);
            window.appContext?.setState({ analyses: this.analyses });
            this.render();
            window.appContext?.addNotification(t('Analysis deleted'), 'success');
        } catch (error) {
            window.appContext?.addNotification(t('Error deleting analysis'), 'error');
        }
    }

    async deleteAll() {
        if (!confirm(t('Are you sure? This will delete all analyses. This cannot be undone.'))) return;

        try {
            await window.electronAPI?.clearAllAnalyses?.();
            this.analyses = [];
            this.filteredAnalyses = [];
            window.appContext?.setState({ analyses: [] });
            this.render();
            window.appContext?.addNotification(t('History cleared'), 'success');
        } catch (error) {
            window.appContext?.addNotification(t('Error clearing history'), 'error');
        }
    }

    exportCSV() {
        if (this.filteredAnalyses.length === 0) {
            window.appContext?.addNotification(t('No data to export'), 'warning');
            return;
        }

        const csv = [
            ['Date', 'Type', 'Trust Score', 'Credibility', 'Content'].join(','),
            ...this.filteredAnalyses.map(a => [
                new Date(a.timestamp).toLocaleString(),
                a.content_type,
                a.trust_score,
                a.credibility || 'N/A',
                `"${a.content?.substring(0, 100) || ''}"`.replace(/"/g, '""')
            ].join(','))
        ].join('\\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analyses-${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);

        window.appContext?.addNotification(t('Data exported'), 'success');
    }
}

// Initialize
window.historyComponent = new HistoryComponent();
