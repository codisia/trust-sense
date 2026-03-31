// ==========================================
// Analyze Component
// ==========================================

class AnalyzeComponent {
    constructor() {
        this.contentType = 'text';
        this.currentFile = null;
        this.isAnalyzing = false;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupDragDrop();
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.content-tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchTab(e.target.dataset.type));
        });

        // Analyze button
        const analyzeBtn = document.getElementById('analyze-btn');
        if (analyzeBtn) analyzeBtn.addEventListener('click', () => this.analyze());

        // Clear button
        const clearBtn = document.getElementById('clear-btn');
        if (clearBtn) clearBtn.addEventListener('click', () => this.clear());

        // File inputs
        document.getElementById('audio-input')?.addEventListener('change', (e) => {
            this.currentFile = e.target.files[0];
            this.showFilePreview('audio');
        });

        document.getElementById('video-input')?.addEventListener('change', (e) => {
            this.currentFile = e.target.files[0];
            this.showFilePreview('video');
        });

        document.getElementById('image-input')?.addEventListener('change', (e) => {
            this.currentFile = e.target.files[0];
            this.showFilePreview('image');
        });
    }

    setupDragDrop() {
        const dropZones = document.querySelectorAll('.drop-zone');
        dropZones.forEach(zone => {
            zone.addEventListener('dragover', (e) => {
                e.preventDefault();
                zone.classList.add('drag-over');
            });

            zone.addEventListener('dragleave', () => {
                zone.classList.remove('drag-over');
            });

            zone.addEventListener('drop', (e) => {
                e.preventDefault();
                zone.classList.remove('drag-over');
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    this.currentFile = files[0];
                    this.showFilePreview(this.contentType);
                }
            });
        });
    }

    switchTab(type) {
        this.contentType = type;
        
        // Update active tab
        document.querySelectorAll('.content-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.type === type);
        });

        // Show/hide content groups
        document.querySelectorAll('[data-content-type]').forEach(el => {
            el.classList.add('hidden');
        });
        document.querySelectorAll(`[data-content-type="${type}"]`).forEach(el => {
            el.classList.remove('hidden');
        });

        // Focus on appropriate input
        const inputId = {
            'text': 'text-input',
            'url': 'url-input',
            'audio': 'audio-input',
            'video': 'video-input',
            'image': 'image-input'
        }[type];

        if (inputId && inputId !== 'audio-input' && inputId !== 'video-input' && inputId !== 'image-input') {
            document.getElementById(inputId)?.focus();
        }
    }

    showFilePreview(type) {
        if (!this.currentFile) return;

        const preview = document.getElementById(`${type}-preview`);
        if (!preview) return;

        if (type === 'image') {
            const reader = new FileReader();
            reader.onload = (e) => {
                preview.innerHTML = `<img src="${e.target.result}" alt="Preview" class="max-w-md h-auto rounded">`;
            };
            reader.readAsDataURL(this.currentFile);
        } else {
            preview.textContent = `Selected: ${this.currentFile.name}`;
        }
    }

    clear() {
        document.getElementById('text-input')!.value = '';
        document.getElementById('url-input')!.value = '';
        this.currentFile = null;
        document.querySelectorAll('[id$="-preview"]').forEach(el => {
            el.innerHTML = '';
        });
    }

    async analyze() {
        if (this.isAnalyzing) return;

        let content = '';
        const analysisType = document.getElementById('analysis-type')?.value || 'quick';

        // Get content based on type
        switch (this.contentType) {
            case 'text':
                content = document.getElementById('text-input')?.value || '';
                if (!content.trim()) {
                    window.showNotification('Please enter text to analyze', 'error');
                    return;
                }
                break;

            case 'url':
                content = document.getElementById('url-input')?.value || '';
                if (!content.trim()) {
                    window.showNotification('Please enter a URL to analyze', 'error');
                    return;
                }
                break;

            case 'audio':
            case 'video':
            case 'image':
                if (!this.currentFile) {
                    window.showNotification('Please select a file', 'error');
                    return;
                }
                content = this.currentFile;
                break;
        }

        this.isAnalyzing = true;
        const analyzeBtn = document.getElementById('analyze-btn');
        if (analyzeBtn) {
            analyzeBtn.disabled = true;
            analyzeBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Analyzing...';
        }

        try {
            let result = null;

            // Call appropriate API based on content type
            switch (this.contentType) {
                case 'text':
                    result = await window.electronAPI?.analyzeText(content);
                    break;
                case 'url':
                    result = await window.electronAPI?.analyzeUrl(content);
                    break;
                case 'audio':
                    result = await window.electronAPI?.analyzeAudio(
                        content.path || content.name,
                        content.name
                    );
                    break;
                case 'video':
                    result = await window.electronAPI?.analyzeVideo(
                        content.path || content.name,
                        content.name
                    );
                    break;
                case 'image':
                    // Convert to base64
                    const base64 = await this.fileToBase64(content);
                    result = await window.electronAPI?.analyzeImage(base64, content.name);
                    break;
            }

            if (result?.success) {
                const data = result.data;
                window.appContext.addAnalysis(data);
                this.displayResults(data);
                window.showNotification('Analysis complete!', 'success');
            } else {
                window.showNotification(result?.error || 'Analysis failed', 'error');
            }
        } catch (error) {
            console.error('Analysis error:', error);
            window.showNotification(error?.message || 'Error during analysis', 'error');
        } finally {
            this.isAnalyzing = false;
            if (analyzeBtn) {
                analyzeBtn.disabled = false;
                analyzeBtn.innerHTML = '<i class="fas fa-play mr-2"></i>Analyze Now';
            }
        }
    }

    async fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    displayResults(analysis) {
        // Update results panel
        document.getElementById('results-score')!.textContent = Math.round(analysis.trust_score || 0);
        
        const credibilityNum = Math.round((analysis.credibility || 0) * 100);
        document.getElementById('results-credibility')!.textContent = credibilityNum + '%';
        
        const emotionText = analysis.dominant_emotion || 'Neutral';
        document.getElementById('results-emotion')!.textContent = emotionText;
        
        // Show results section
        const resultsSection = document.getElementById('results-section');
        if (resultsSection) {
            resultsSection.classList.remove('hidden');
            
            // Scroll to results
            setTimeout(() => {
                resultsSection.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    }
}

// Initialize
window.analyzeComponent = new AnalyzeComponent();
