/**
 * Electron Renderer Process - Main UI Controller
 * Initializes all components and handles navigation
 */

// Global component instances
let analyzeComponent;
let historyComponent;
let dashboardComponent;
let chatbotComponent;
let settingsComponent;

// Application initialization
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Initializing desktop app...');

  try {
    // Initialize AppContext (global state management)
    window.appContext.subscribe((newState) => {
      console.log('App state updated:', newState);
      updateNotifications();
    });

    // Initialize i18n system
    updateI18n();

    // Initialize all components
    initializeComponents();

    // Setup event listeners
    setupNavigation();
    setupThemeToggle();
    setupLanguageSelector();
    setupSectionNavigation();

    // Load initial data
    await loadInitialData();

    console.log('App initialization complete');
  } catch (error) {
    console.error('App initialization failed:', error);
    showNotification('Failed to initialize app', 'error');
  }
});

/**
 * Initialize all UI components
 */
function initializeComponents() {
  try {
    // Initialize each component
    analyzeComponent = new AnalyzeComponent();
    historyComponent = new HistoryComponent();
    dashboardComponent = new DashboardComponent();
    chatbotComponent = new ChatbotComponent();
    settingsComponent = new SettingsComponent();

    // Subscribe to state changes
    window.appContext.subscribe(() => {
      if (analyzeComponent?.render) analyzeComponent.render();
      if (historyComponent?.render) historyComponent.render();
      if (dashboardComponent?.render) dashboardComponent.render();
    });

    console.log('All components initialized');
  } catch (error) {
    console.error('Component initialization error:', error);
    throw error;
  }
}

/**
 * Setup navigation between sections
 */
function setupSectionNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  const sections = document.querySelectorAll('section[id$="-section"]');

  navItems.forEach((item) => {
    item.addEventListener('click', (e) => {
      e.preventDefault();

      const sectionName = item.getAttribute('data-section');
      if (!sectionName) return;

      // Hide all sections
      sections.forEach((section) => {
        section.classList.add('hidden');
      });

      // Show target section
      const targetSection = document.getElementById(`${sectionName}-section`);
      if (targetSection) {
        targetSection.classList.remove('hidden');
      }

      // Update nav items
      navItems.forEach((ni) => ni.classList.remove('active'));
      item.classList.add('active');

      // Update page title
      updatePageTitle(sectionName);

      // Update app context
      window.appContext.setState({ currentPage: sectionName });
    });
  });
}

/**
 * Setup theme toggle
 */
function setupThemeToggle() {
  const themeToggle = document.getElementById('theme-toggle');
  const themeLabel = document.getElementById('theme-label');
  const themeRadios = document.querySelectorAll('input[name="theme"]');

  if (!themeToggle) return;

  // Load saved theme
  const savedTheme = localStorage.getItem('theme') || 'dark';
  applyTheme(savedTheme);

  themeToggle.addEventListener('click', () => {
    const currentTheme = document.body.classList.contains('light-theme') ? 'light' : 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
  });

  // Update radio buttons when clicking theme toggle
  themeRadios.forEach((radio) => {
    radio.addEventListener('change', (e) => {
      applyTheme(e.target.value);
    });
  });

  // Subscribe to context changes
  window.appContext.subscribe((state) => {
    if (state.theme) {
      applyTheme(state.theme);
    }
  });
}

/**
 * Apply theme to document and save preference
 */
function applyTheme(theme) {
  const body = document.body;
  const themeLabel = document.getElementById('theme-label');
  const themeRadios = document.querySelectorAll('input[name="theme"]');

  if (theme === 'light') {
    body.classList.add('light-theme');
    if (themeLabel) themeLabel.textContent = 'Light Mode';
  } else {
    body.classList.remove('light-theme');
    if (themeLabel) themeLabel.textContent = 'Dark Mode';
  }

  // Update radio button
  themeRadios.forEach((radio) => {
    radio.checked = radio.value === theme;
  });

  localStorage.setItem('theme', theme);
  window.appContext.setState({ theme });
}

/**
 * Setup language selector
 */
function setupLanguageSelector() {
  const languageSelect = document.getElementById('language-select');
  const languageSelectSettings = document.getElementById('language-select-settings');

  const updateLanguage = (lang) => {
    localStorage.setItem('language', lang);
    window.appContext.setState({ language: lang });
    updateI18n();
    if (analyzeComponent?.render) analyzeComponent.render();
    if (historyComponent?.render) historyComponent.render();
    if (dashboardComponent?.render) dashboardComponent.render();
  };

  if (languageSelect) {
    languageSelect.value = localStorage.getItem('language') || 'en';
    languageSelect.addEventListener('change', (e) => {
      updateLanguage(e.target.value);
    });
  }

  if (languageSelectSettings) {
    languageSelectSettings.value = localStorage.getItem('language') || 'en';
    languageSelectSettings.addEventListener('change', (e) => {
      updateLanguage(e.target.value);
    });
  }
}

/**
 * Setup theme toggle in settings
 */
function setupSettingsTheme() {
  const themeRadios = document.querySelectorAll('input[name="theme"]');
  const savedTheme = localStorage.getItem('theme') || 'dark';

  themeRadios.forEach((radio) => {
    radio.checked = radio.value === savedTheme;
    radio.addEventListener('change', (e) => {
      applyTheme(e.target.value);
    });
  });
}

/**
 * Setup form event listeners
 */
function setupNavigation() {
  // Analyze button
  const analyzeBtn = document.getElementById('analyze-btn');
  if (analyzeBtn) {
    analyzeBtn.addEventListener('click', () => {
      if (analyzeComponent?.analyzeContent) {
        analyzeComponent.analyzeContent();
      }
    });
  }

  // Clear button
  const clearBtn = document.getElementById('clear-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (analyzeComponent?.clear) {
        analyzeComponent.clear();
      }
    });
  }

  // Content type tabs
  const contentTabs = document.querySelectorAll('.content-tab');
  contentTabs.forEach((tab) => {
    tab.addEventListener('click', (e) => {
      const type = tab.getAttribute('data-type');
      switchContentType(type);
    });
  });

  // History search and filters
  const historySearch = document.getElementById('history-search');
  const typeFilter = document.getElementById('type-filter');
  const scoreFilter = document.getElementById('score-filter');

  const filterHistory = () => {
    if (historyComponent?.applyFilters) {
      const searchTerm = historySearch?.value || '';
      const typeValue = typeFilter?.value || '';
      const scoreValue = scoreFilter?.value || '';
      historyComponent.applyFilters(searchTerm, typeValue, scoreValue);
    }
  };

  if (historySearch) historySearch.addEventListener('input', filterHistory);
  if (typeFilter) typeFilter.addEventListener('change', filterHistory);
  if (scoreFilter) scoreFilter.addEventListener('change', filterHistory);

  // Export button
  const exportBtn = document.getElementById('export-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      if (historyComponent?.exportToCSV) {
        historyComponent.exportToCSV();
      }
    });
  }

  // Delete all button
  const deleteAllBtn = document.getElementById('delete-all-btn');
  if (deleteAllBtn) {
    deleteAllBtn.addEventListener('click', () => {
      if (confirm('Delete all analyses? This cannot be undone.')) {
        if (confirm('Are you sure? Type DELETE to confirm.')) {
          if (historyComponent?.clearAllAnalyses) {
            historyComponent.clearAllAnalyses();
          }
        }
      }
    });
  }

  // Dashboard buttons
  const refreshDashboard = document.getElementById('refresh-dashboard');
  const exportReport = document.getElementById('export-report');

  if (refreshDashboard) {
    refreshDashboard.addEventListener('click', () => {
      if (dashboardComponent?.refresh) {
        dashboardComponent.refresh();
      }
    });
  }

  if (exportReport) {
    exportReport.addEventListener('click', () => {
      if (dashboardComponent?.exportReport) {
        dashboardComponent.exportReport();
      }
    });
  }

  // Chatbot
  const voiceChatBtn = document.getElementById('voice-chat-btn');
  const attachFileBtn = document.getElementById('attach-file-btn');
  const chatSendBtn = document.getElementById('chat-send-btn');
  const clearChatBtn = document.getElementById('clear-chat-btn');

  if (voiceChatBtn) {
    voiceChatBtn.addEventListener('click', () => {
      if (chatbotComponent?.toggleVoiceChat) {
        chatbotComponent.toggleVoiceChat();
      }
    });
  }

  if (attachFileBtn) {
    attachFileBtn.addEventListener('click', () => {
      document.getElementById('chat-file-input')?.click();
    });
  }

  if (chatSendBtn) {
    chatSendBtn.addEventListener('click', () => {
      const input = document.getElementById('chat-input');
      if (input?.value && chatbotComponent?.sendMessage) {
        chatbotComponent.sendMessage(input.value);
        input.value = '';
      }
    });
  }

  if (clearChatBtn) {
    clearChatBtn.addEventListener('click', () => {
      if (chatbotComponent?.clearChat) {
        chatbotComponent.clearChat();
      }
    });
  }

  // Settings
  const clearHistoryBtn = document.getElementById('clear-history-btn');
  const exportDataBtn = document.getElementById('export-data-btn');
  const deleteAccountBtn = document.getElementById('delete-account-btn');

  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener('click', () => {
      if (confirm('Clear all analysis history? This cannot be undone.')) {
        if (historyComponent?.clearAllAnalyses) {
          historyComponent.clearAllAnalyses();
        }
      }
    });
  }

  if (exportDataBtn) {
    exportDataBtn.addEventListener('click', () => {
      if (historyComponent?.exportToCSV) {
        historyComponent.exportToCSV();
      }
    });
  }

  if (deleteAccountBtn) {
    deleteAccountBtn.addEventListener('click', () => {
      deleteAccount();
    });
  }

  // API Settings
  const saveApiSettingsBtn = document.getElementById('save-api-settings');
  if (saveApiSettingsBtn) {
    saveApiSettingsBtn.addEventListener('click', () => {
      const apiUrl = document.getElementById('api-url-input')?.value;
      const apiKey = document.getElementById('api-key-input')?.value;

      if (apiUrl && apiKey) {
        localStorage.setItem('apiUrl', apiUrl);
        localStorage.setItem('apiKey', apiKey);
        showNotification('API settings saved', 'success');
      } else {
        showNotification('Please enter both API URL and Key', 'error');
      }
    });
  }

  // Setup settings theme
  setupSettingsTheme();
}

/**
 * Switch content type in Analyze section
 */
function switchContentType(type) {
  // Update tab styles
  const tabs = document.querySelectorAll('.content-tab');
  tabs.forEach((tab) => {
    if (tab.getAttribute('data-type') === type) {
      tab.classList.add('active');
      tab.style.borderBottomColor = 'rgb(34, 211, 238)';
      tab.style.color = 'rgb(34, 211, 238)';
    } else {
      tab.classList.remove('active');
      tab.style.borderBottomColor = 'transparent';
      tab.style.color = 'rgb(156, 163, 175)';
    }
  });

  // Show/hide content type inputs
  const contentTypes = document.querySelectorAll('[data-content-type]');
  contentTypes.forEach((ct) => {
    if (ct.getAttribute('data-content-type') === type) {
      ct.classList.remove('hidden');
    } else {
      ct.classList.add('hidden');
    }
  });
}

/**
 * Update page title based on section
 */
function updatePageTitle(section) {
  const pageTitle = document.getElementById('page-title');
  if (!pageTitle) return;

  const titles = {
    analyze: t('Analyze') || 'Analyze Content',
    history: t('History') || 'Analysis History',
    dashboard: t('Dashboard') || 'Dashboard',
    chatbot: 'AI Chatbot',
    settings: t('Settings') || 'Settings',
  };

  pageTitle.textContent = titles[section] || 'Trust Sense';
}

/**
 * Show notification
 */
function showNotification(message, type = 'info', duration = 3000) {
  const container = document.getElementById('notifications-container');
  if (!container) return;

  const notification = document.createElement('div');
  notification.className = `notification ${type} px-4 py-3 rounded-lg shadow-lg animate-slideInRight`;
  notification.textContent = message;

  container.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, duration);

  // Add to app context
  window.appContext.addNotification(message, type, duration);
}

/**
 * Update notifications display
 */
function updateNotifications() {
  // Notifications are handled by showNotification() function
}

/**
 * Load initial data
 */
async function loadInitialData() {
  try {
    // Load theme
    const savedTheme = localStorage.getItem('theme') || 'dark';
    applyTheme(savedTheme);

    // Load language
    const savedLanguage = localStorage.getItem('language') || 'en';
    const langSelect = document.getElementById('language-select');
    const langSelectSettings = document.getElementById('language-select-settings');
    if (langSelect) langSelect.value = savedLanguage;
    if (langSelectSettings) langSelectSettings.value = savedLanguage;

    // Load analysis history
    if (historyComponent?.loadAnalysisHistory) {
      await historyComponent.loadAnalysisHistory();
    }

    // Load dashboard data
    if (dashboardComponent?.loadStatistics) {
      await dashboardComponent.loadStatistics();
    }

    // Load API settings
    const apiUrl = localStorage.getItem('apiUrl') || 'http://localhost:8000';
    const apiKey = localStorage.getItem('apiKey') || '';

    if (document.getElementById('api-url-input')) {
      document.getElementById('api-url-input').value = apiUrl;
    }
    if (document.getElementById('api-key-input')) {
      document.getElementById('api-key-input').value = apiKey;
    }

    console.log('Initial data loaded');
  } catch (error) {
    console.error('Error loading initial data:', error);
  }
}

/**
 * Delete account
 */
async function deleteAccount() {
  const userInput = prompt(
    'This will permanently delete all your data. Type DELETE to confirm:',
  );

  if (userInput !== 'DELETE') {
    showNotification('Account deletion cancelled', 'info');
    return;
  }

  try {
    // Clear all local storage
    localStorage.clear();

    // Clear all app state
    window.appContext.setState({
      user: null,
      isAuthenticated: false,
      token: null,
      analyses: [],
      currentAnalysis: null,
      chatHistory: [],
      dashboardData: {},
    });

    // Show message and reload
    showNotification('Account deleted. Restarting app...', 'success');

    setTimeout(() => {
      window.location.reload();
    }, 1000);
  } catch (error) {
    console.error('Error deleting account:', error);
    showNotification('Error deleting account', 'error');
  }
}

/**
 * Export to JSON
 */
function exportToJSON() {
  const data = {
    analyses: window.appContext.state.analyses,
    chatHistory: window.appContext.state.chatHistory,
    settings: {
      theme: localStorage.getItem('theme'),
      language: localStorage.getItem('language'),
    },
  };

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `trust-sense-data-${new Date().toISOString().split('T')[0]}.json`;
  a.click();

  URL.revokeObjectURL(url);
  showNotification('Data exported', 'success');
}

/**
 * Keyboard shortcuts
 */
document.addEventListener('keydown', (e) => {
  // Ctrl/Cmd + S to save/export
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    exportToJSON();
  }

  // Escape to close modals
  if (e.key === 'Escape') {
    const modals = document.querySelectorAll('.modal.active');
    modals.forEach((modal) => modal.classList.remove('active'));
  }

  // Ctrl/Cmd + K for search
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    const searchInput = document.getElementById('history-search');
    if (searchInput) searchInput.focus();
  }
});

// Export functions for testing
window.showNotification = showNotification;
window.switchContentType = switchContentType;
window.exportToJSON = exportToJSON;
window.deleteAccount = deleteAccount;

        themeBtn.innerHTML = `<i class="fas ${isDark ? 'fa-sun' : 'fa-moon'} mr-2"></i> ${isDark ? 'Light' : 'Dark'}`
    }

    // Setup language selector - create a menu if not exists
    const langBtn = document.querySelector('button[onclick="changeLanguage()"]')
    if (langBtn) {
        langBtn.onclick = (e) => {
            e.stopPropagation()
            showLanguageMenu(e.target)
        }
        langBtn.innerHTML = `<i class="fas fa-globe mr-2"></i> ${currentLanguage.toUpperCase()}`
    }

    // Setup content type tabs
    const tabs = document.querySelectorAll('.content-tab')
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const type = tab.getAttribute('data-type')
            switchContentType(type)
        })
    })

    // Setup image drop zone
    const dropZone = document.getElementById('image-drop-zone')
    const imageInput = document.getElementById('image-input')
    
    if (dropZone && imageInput) {
        dropZone.addEventListener('click', () => imageInput.click())
        
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault()
            dropZone.classList.add('border-trust-cyan', 'bg-trust-cyan/5')
        })
        
        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('border-trust-cyan', 'bg-trust-cyan/5')
        })
        
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault()
            dropZone.classList.remove('border-trust-cyan', 'bg-trust-cyan/5')
            const files = e.dataTransfer.files
            if (files.length) {
                imageInput.files = files
                previewImage(files[0])
            }
        })
        
        imageInput.addEventListener('change', (e) => {
            if (e.target.files.length) {
                previewImage(e.target.files[0])
            }
        })
    }
}

function switchContentType(type) {
    currentContentType = type
    
    // Update tabs
    document.querySelectorAll('.content-tab').forEach(tab => {
        if (tab.getAttribute('data-type') === type) {
            tab.classList.add('text-trust-cyan', 'border-b-2', 'border-trust-cyan')
            tab.classList.remove('text-gray-400')
        } else {
            tab.classList.remove('text-trust-cyan', 'border-b-2', 'border-trust-cyan')
            tab.classList.add('text-gray-400')
        }
    })

    // Update input groups
    document.getElementById('text-input-group')?.classList.toggle('hidden', type !== 'text')
    document.getElementById('text-input-group')?.classList.toggle('active', type === 'text')
    
    document.getElementById('url-input-group')?.classList.toggle('hidden', type !== 'url')
    document.getElementById('url-input-group')?.classList.toggle('active', type === 'url')
    
    document.getElementById('image-input-group')?.classList.toggle('hidden', type !== 'image')
    document.getElementById('image-input-group')?.classList.toggle('active', type === 'image')
}

function previewImage(file) {
    const reader = new FileReader()
    reader.onload = (e) => {
        const preview = document.getElementById('image-preview')
        const img = document.getElementById('preview-img')
        img.src = e.target.result
        preview.classList.remove('hidden')
    }
    reader.readAsDataURL(file)
}

function showLanguageMenu(btn) {
    // Remove existing menu if any
    const existing = document.getElementById('language-menu')
    if (existing) existing.remove()

    // Create language menu
    const menu = document.createElement('div')
    menu.id = 'language-menu'
    menu.className = 'absolute bg-trust-surface-2 border border-gray-700 rounded-lg shadow-lg p-2 z-50'
    menu.style.minWidth = '150px'

    const languages = ['en', 'es', 'fr', 'de']
    const langNames = { en: '🇬🇧 English', es: '🇪🇸 Español', fr: '🇫🇷 Français', de: '🇩🇪 Deutsch' }

    languages.forEach(lang => {
        const item = document.createElement('div')
        item.className = `px-4 py-2 rounded cursor-pointer transition-all ${currentLanguage === lang ? 'bg-trust-cyan/20 text-trust-cyan font-semibold' : 'text-gray-300 hover:text-trust-cyan hover:bg-trust-surface-1'}`
        item.textContent = langNames[lang]
        item.onclick = () => {
            changeLanguage(lang)
            setupSettingsButtons()
            menu.remove()
        }
        menu.appendChild(item)
    })

    // Position menu relative to button
    const rect = btn.getBoundingClientRect()
    menu.style.position = 'fixed'
    menu.style.top = (rect.bottom + 8) + 'px'
    menu.style.left = (rect.left - 60) + 'px'

    document.body.appendChild(menu)

    // Close menu when clicking elsewhere
    setTimeout(() => {
        document.addEventListener('click', function closeMenu() {
            if (menu && menu.parentNode) menu.remove()
            document.removeEventListener('click', closeMenu)
        })
    }, 100)
}

// ==========================================
// Initialize on DOMContentLoaded
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    // Load initial data
    loadHistory();
    loadDashboard();

    // Restore theme from localStorage/database
    const theme = localStorage.getItem('theme') || 'dark'
    if (theme === 'light') {
        document.body.classList.add('light-theme')
    } else {
        document.body.classList.remove('light-theme')
    }

    // Restore language
    currentLanguage = localStorage.getItem('language') || 'en'
    updateLanguageUI()

    // Show initial section
    showSection('analyze');
    
    // Setup theme and language buttons
    setupSettingsButtons()
});
