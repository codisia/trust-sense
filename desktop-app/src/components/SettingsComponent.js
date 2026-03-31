// ==========================================
// Settings Component
// ==========================================

class SettingsComponent {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadSettings();
    }

    setupEventListeners() {
        // Theme toggle
        document.querySelectorAll('input[name="theme"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.changeTheme(e.target.value);
            });
        });

        // Language selector
        document.getElementById('language-select')?.addEventListener('change', (e) => {
            this.changeLanguage(e.target.value);
        });

        // Clear history
        document.getElementById('clear-history-btn')?.addEventListener('click', () => {
            this.clearHistory();
        });

        // Export data
        document.getElementById('export-data-btn')?.addEventListener('click', () => {
            this.exportData();
        });

        // Delete account
        document.getElementById('delete-account-btn')?.addEventListener('click', () => {
            this.deleteAccount();
        });

        // API Settings
        document.getElementById('save-api-settings')?.addEventListener('click', () => {
            this.saveApiSettings();
        });
    }

    loadSettings() {
        const themeRadio = document.querySelector(`input[name="theme"][value="${window.appContext?.getState()?.theme || 'dark'}"]`);
        if (themeRadio) themeRadio.checked = true;

        const langSelect = document.getElementById('language-select');
        if (langSelect) langSelect.value = window.appContext?.getState()?.language || 'en';
    }

    async changeTheme(theme) {
        window.appContext?.changeTheme(theme);
        window.appContext?.addNotification(t('Theme updated'), 'success');
    }

    async changeLanguage(lang) {
        window.appContext?.changeLanguage(lang);
        window.appContext?.addNotification(t('Language changed'), 'success');
    }

    async clearHistory() {
        if (!confirm(t('Are you sure? This will delete all analyses. This cannot be undone.'))) return;

        try {
            await window.electronAPI?.clearAllAnalyses?.();
            window.appContext?.setState({ analyses: [] });
            window.appContext?.addNotification(t('History cleared'), 'success');
        } catch (error) {
            window.appContext?.addNotification(t('Error clearing history'), 'error');
        }
    }

    async exportData() {
        try {
            const state = window.appContext?.getState();
            const data = {
                analyses: state.analyses,
                chatHistory: state.chatHistory,
                exportDate: new Date().toISOString()
            };

            const json = JSON.stringify(data, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `trust-sense-data-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);

            window.appContext?.addNotification(t('Data exported'), 'success');
        } catch (error) {
            window.appContext?.addNotification(t('Error exporting data'), 'error');
        }
    }

    async deleteAccount() {
        if (!confirm(t('Are you sure? This action is irreversible and will delete all your data.'))) return;

        const confirmed = prompt('Type "DELETE" to confirm permanent deletion:');
        if (confirmed !== 'DELETE') return;

        try {
            await window.electronAPI?.deleteAccount?.();
            window.appContext?.setState({
                user: null,
                isAuthenticated: false,
                token: null,
                analyses: [],
                chatHistory: []
            });
            localStorage.clear();
            window.appContext?.addNotification(t('Account deleted'), 'success');
            // Redirect to login
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } catch (error) {
            window.appContext?.addNotification(t('Error deleting account'), 'error');
        }
    }

    async saveApiSettings() {
        const apiKey = document.getElementById('api-key-input')?.value;
        const apiUrl = document.getElementById('api-url-input')?.value;

        if (!apiKey || !apiUrl) {
            window.appContext?.addNotification('Please fill in all fields', 'error');
            return;
        }

        try {
            localStorage.setItem('api_key', apiKey);
            localStorage.setItem('api_url', apiUrl);

            // Notify main process
            await window.electronAPI?.updateApiSettings?.({ apiKey, apiUrl });

            window.appContext?.addNotification(t('Settings saved'), 'success');
        } catch (error) {
            window.appContext?.addNotification(t('Error saving settings'), 'error');
        }
    }

    // Load saved API settings
    loadApiSettings() {
        const apiKey = localStorage.getItem('api_key');
        const apiUrl = localStorage.getItem('api_url');

        if (apiKey) {
            const input = document.getElementById('api-key-input');
            if (input) input.value = apiKey;
        }

        if (apiUrl) {
            const input = document.getElementById('api-url-input');
            if (input) input.value = apiUrl;
        }
    }
}

// Initialize
window.settingsComponent = new SettingsComponent();
