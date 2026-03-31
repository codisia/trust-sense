// ==========================================
// Global App Context - State Management
// ==========================================

class AppContext {
    constructor() {
        this.listeners = [];
        this.state = {
            // User State
            user: null,
            isAuthenticated: false,
            token: localStorage.getItem('auth_token'),
            
            // Analysis State
            analyses: [],
            currentAnalysis: null,
            analyzingId: null,
            
            // UI State
            currentPage: 'analyze',
            theme: localStorage.getItem('theme') || 'dark',
            language: localStorage.getItem('language') || 'en',
            notifications: [],
            
            // Chatbot State
            chatHistory: [],
            
            // Dashboard State
            dashboardData: null,
            charts: {},
        };
    }

    // Subscribe to state changes
    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    // Notify all listeners
    notifyListeners() {
        this.listeners.forEach(listener => listener(this.state));
    }

    // Update state
    setState(updates) {
        this.state = { ...this.state, ...updates };
        this.notifyListeners();
    }

    // Update nested state
    setNestedState(path, value) {
        const keys = path.split('.');
        let current = this.state;
        for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) current[keys[i]] = {};
            current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = value;
        this.notifyListeners();
    }

    // Add notification
    addNotification(message, type = 'info', duration = 3000) {
        const id = Date.now();
        const notification = { id, message, type };
        this.setNestedState('notifications', [
            ...this.state.notifications,
            notification
        ]);
        if (duration) {
            setTimeout(() => this.removeNotification(id), duration);
        }
        return id;
    }

    // Remove notification
    removeNotification(id) {
        this.setNestedState('notifications', 
            this.state.notifications.filter(n => n.id !== id)
        );
    }

    // Add analysis
    addAnalysis(analysis) {
        this.setNestedState('analyses', [analysis, ...this.state.analyses]);
        this.setNestedState('currentAnalysis', analysis);
    }

    // Add to chat history
    addChatMessage(role, content, type = 'text') {
        this.setNestedState('chatHistory', [
            ...this.state.chatHistory,
            { role, content, type, timestamp: Date.now() }
        ]);
    }

    // Clear analyses
    clearAnalyses() {
        this.setNestedState('analyses', []);
    }

    // Change theme
    changeTheme(theme) {
        localStorage.setItem('theme', theme);
        this.setState({ theme });
        if (theme === 'light') {
            document.body.classList.add('light-theme');
        } else {
            document.body.classList.remove('light-theme');
        }
    }

    // Change language
    changeLanguage(lang) {
        localStorage.setItem('language', lang);
        this.setState({ language: lang });
    }

    // Get state
    getState() {
        return this.state;
    }
}

// Create global instance
window.appContext = new AppContext();
