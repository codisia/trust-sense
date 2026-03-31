// ==========================================
// Translations - i18n Support
// ==========================================

const translations = {
    en: {
        // Navigation
        'Analyze': 'Analyze',
        'History': 'History',
        'Dashboard': 'Dashboard',
        'Settings': 'Settings',
        'Analyze Content': 'Analyze Content',
        'Analysis History': 'Analysis History',
        
        // Analyze Section
        'Text': 'Text',
        'URL': 'URL',
        'Audio': 'Audio',
        'Video': 'Video',
        'Image': 'Image',
        'Paste your content here': 'Paste your content here',
        'Enter URL': 'Enter URL',
        'Upload Audio': 'Upload Audio (MP3, WAV, OGG)',
        'Upload Video': 'Upload Video (MP4, WebM)',
        'Drop image here or click': 'Drop image here or click to select',
        'Analyze Now': 'Analyze Now',
        'Clear': 'Clear',
        'Quick Scan': 'Quick Scan',
        'Deep Analysis': 'Deep Analysis',
        'Analyzing...': 'Analyzing...',
        'Analysis Type': 'Analysis Type',
        
        // Results
        'Trust Score': 'Trust Score',
        'Credibility': 'Credibility',
        'Emotion': 'Emotion',
        'Bias': 'Bias',
        'Sentiment': 'Sentiment',
        'Keywords': 'Keywords',
        'Key Findings': 'Key Findings',
        'Detailed Analysis': 'Detailed Analysis',
        'Copy': 'Copy',
        'Save': 'Save',
        'Share': 'Share',
        
        // History
        'No analyses yet': 'No analyses yet',
        'Search analyses': 'Search analyses',
        'Filter by type': 'Filter by type',
        'Filter by score': 'Filter by score',
        'Export': 'Export as CSV',
        'Delete': 'Delete',
        'View': 'View',
        'Date': 'Date',
        'Type': 'Type',
        'Score': 'Score',
        'Status': 'Status',
        
        // Dashboard
        'Statistics': 'Statistics',
        'Total Analyses': 'Total Analyses',
        'Average Score': 'Average Score',
        'This Month': 'This Month',
        'Trust Trends': 'Trust Trends',
        'Emotion Breakdown': 'Emotion Breakdown',
        'Top Keywords': 'Top Keywords',
        'Credibility Over Time': 'Credibility Over Time',
        'Export Report': 'Export Report',
        
        // Settings
        'Preferences': 'Preferences',
        'Theme': 'Theme',
        'Dark Mode': 'Dark Mode',
        'Light Mode': 'Light Mode',
        'Language': 'Language',
        'English': 'English',
        'French': 'Français',
        'Spanish': 'Español',
        'German': 'Deutsch',
        'Data': 'Data',
        'Clear History': 'Clear History',
        'Export Data': 'Export All Data',
        'Delete Account': 'Delete Account',
        'About': 'About',
        'Version': 'Version',
        'Help': 'Help & Support',
        'Documentation': 'Documentation',
        
        // Chatbot
        'Ask me anything': 'Ask me anything about content analysis',
        'Send': 'Send',
        'Voice Chat': 'Voice Chat',
        'Stop Recording': 'Stop Recording',
        'Typing...': 'Typing...',
        
        // Notifications
        'Success': 'Success!',
        'Error': 'Error',
        'Warning': 'Warning',
        'Analysis complete': 'Analysis complete!',
        'Content copied': 'Content copied to clipboard',
        'Data exported': 'Data exported successfully',
        'History cleared': 'History cleared',
        'Account deleted': 'Your account has been deleted',
        
        // Messages
        'Please enter content': 'Please enter content to analyze',
        'Invalid URL': 'Please enter a valid URL',
        'File too large': 'File too large (max 100MB)',
        'Unsupported file': 'Unsupported file format',
        'Are you sure': 'Are you sure? This cannot be undone.',
    },
    
    fr: {
        'Analyze': 'Analyser',
        'History': 'Historique',
        'Dashboard': 'Tableau de bord',
        'Settings': 'Paramètres',
        'Analyze Content': 'Analyser le contenu',
        'Analysis History': 'Historique des analyses',
        
        'Text': 'Texte',
        'URL': 'URL',
        'Audio': 'Audio',
        'Video': 'Vidéo',
        'Image': 'Image',
        'Paste your content here': 'Collez votre contenu ici',
        'Enter URL': 'Entrez l\'URL',
        'Analyze Now': 'Analyser maintenant',
        'Clear': 'Effacer',
        'Quick Scan': 'Analyse rapide',
        'Deep Analysis': 'Analyse approfondie',
        'Analyzing...': 'Analyse en cours...',
        
        'Trust Score': 'Score de confiance',
        'Credibility': 'Crédibilité',
        'Emotion': 'Émotion',
        'Bias': 'Biais',
        'Sentiment': 'Sentiment',
        'Keywords': 'Mots-clés',
        
        'No analyses yet': 'Pas d\'analyses pour le moment',
        'Search analyses': 'Rechercher les analyses',
        'Export': 'Exporter en CSV',
        'Delete': 'Supprimer',
        
        'Theme': 'Thème',
        'Dark Mode': 'Mode sombre',
        'Light Mode': 'Mode clair',
        'Language': 'Langue',
        'English': 'English',
        'French': 'Français',
        'Spanish': 'Español',
        'German': 'Deutsch',
        
        'Success': 'Succès!',
        'Error': 'Erreur',
        'Analysis complete': 'Analyse terminée!',
        'Content copied': 'Contenu copié',
        'Data exported': 'Données exportées',
    },
    
    es: {
        'Analyze': 'Analizar',
        'History': 'Historial',
        'Dashboard': 'Panel',
        'Settings': 'Configuración',
        'Analyze Content': 'Analizar contenido',
        'Analysis History': 'Historial de análisis',
        
        'Text': 'Texto',
        'URL': 'URL',
        'Audio': 'Audio',
        'Video': 'Video',
        'Image': 'Imagen',
        'Paste your content here': 'Pegue su contenido aquí',
        'Analyze Now': 'Analizar ahora',
        'Clear': 'Limpiar',
    },
    
    de: {
        'Analyze': 'Analysieren',
        'History': 'Verlauf',
        'Dashboard': 'Dashboard',
        'Settings': 'Einstellungen',
        'Analyze Content': 'Inhalte analysieren',
        'Analysis History': 'Analyseverlauf',
        
        'Text': 'Text',
        'URL': 'URL',
        'Audio': 'Audio',
        'Video': 'Video',
        'Image': 'Bild',
    }
};

// Get translation
function t(key) {
    const lang = window.appContext?.getState()?.language || 'en';
    return translations[lang]?.[key] || translations.en[key] || key;
}

// Update all elements with data-i18n attribute
function updateI18n() {
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.dataset.i18n;
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
            element.placeholder = t(key);
        } else {
            element.textContent = t(key);
        }
    });
}

// Watch for language changes
if (window.appContext) {
    window.appContext.subscribe(state => {
        updateI18n();
    });
}
