// ==========================================
// Chatbot Component
// ==========================================

class ChatbotComponent {
    constructor() {
        this.isRecording = false;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadChatHistory();
    }

    setupEventListeners() {
        // Send message
        document.getElementById('chat-send-btn')?.addEventListener('click', () => {
            this.sendMessage();
        });

        // Enter to send
        document.getElementById('chat-input')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Voice chat toggle
        document.getElementById('voice-chat-btn')?.addEventListener('click', () => {
            this.toggleVoiceChat();
        });

        // Attachment
        document.getElementById('attach-file-btn')?.addEventListener('click', () => {
            document.getElementById('chat-file-input')?.click();
        });

        document.getElementById('chat-file-input')?.addEventListener('change', (e) => {
            this.handleAttachment(e.target.files[0]);
        });

        // Clear chat
        document.getElementById('clear-chat-btn')?.addEventListener('click', () => {
            this.clearChat();
        });
    }

    loadChatHistory() {
        const history = window.appContext?.getState()?.chatHistory || [];
        this.renderChat(history);
    }

    async sendMessage() {
        const input = document.getElementById('chat-input');
        if (!input || !input.value.trim()) return;

        const message = input.value.trim();
        input.value = '';

        // Add user message to UI
        this.addMessageToUI('user', message);

        // Add to context
        window.appContext?.addChatMessage('user', message);

        // Send to API
        try {
            const response = await window.electronAPI?.chatbotQuery?.({
                message,
                context: window.appContext?.getState()?.currentAnalysis
            });

            if (response) {
                this.addMessageToUI('bot', response.answer);
                window.appContext?.addChatMessage('bot', response.answer);
            }
        } catch (error) {
            console.error('Chat error:', error);
            this.addMessageToUI('bot', `Error: ${error.message}`);
        }
    }

    addMessageToUI(role, content) {
        const chatBox = document.getElementById('chat-messages');
        if (!chatBox) return;

        const messageEl = document.createElement('div');
        messageEl.className = `message message-${role} ${role === 'user' ? 'text-right' : 'text-left'}`;
        messageEl.innerHTML = `
            <div class="inline-block max-w-xs px-4 py-2 rounded-lg ${
                role === 'user'
                    ? 'bg-blue-500 text-white rounded-br-none'
                    : 'bg-gray-700 text-gray-100 rounded-bl-none'
            }">
                ${this.escapeHtml(content)}
            </div>
        `;

        chatBox.appendChild(messageEl);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    async toggleVoiceChat() {
        if (this.isRecording) {
            this.stopVoiceChat();
        } else {
            this.startVoiceChat();
        }
    }

    async startVoiceChat() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(stream);
            this.audioChunks = [];

            this.mediaRecorder.ondataavailable = (event) => {
                this.audioChunks.push(event.data);
            };

            this.mediaRecorder.onstop = () => {
                this.processVoiceInput();
            };

            this.mediaRecorder.start();
            this.isRecording = true;

            const btn = document.getElementById('voice-chat-btn');
            if (btn) {
                btn.textContent = '⏹ ' + t('Stop Recording');
                btn.classList.add('recording');
            }
        } catch (error) {
            window.appContext?.addNotification('Microphone access denied', 'error');
        }
    }

    stopVoiceChat() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;

            const btn = document.getElementById('voice-chat-btn');
            if (btn) {
                btn.textContent = '🎤 ' + t('Voice Chat');
                btn.classList.remove('recording');
            }
        }
    }

    async processVoiceInput() {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
        
        try {
            const response = await window.electronAPI?.voiceChat?.({
                audio: audioBlob,
                context: window.appContext?.getState()?.currentAnalysis
            });

            if (response) {
                this.addMessageToUI('user', response.transcription);
                this.addMessageToUI('bot', response.answer);
                window.appContext?.addChatMessage('user', response.transcription, 'audio');
                window.appContext?.addChatMessage('bot', response.answer);
            }
        } catch (error) {
            window.appContext?.addNotification('Voice chat error', 'error');
        }
    }

    async handleAttachment(file) {
        if (!file) return;

        const supportedTypes = ['image/jpeg', 'image/png', 'audio/mpeg', 'video/mp4'];
        if (!supportedTypes.includes(file.type)) {
            window.appContext?.addNotification(t('Unsupported file format'), 'error');
            return;
        }

        if (file.size > 100 * 1024 * 1024) {
            window.appContext?.addNotification(t('File too large'), 'error');
            return;
        }

        try {
            const response = await window.electronAPI?.chatbotWithFile?.({
                file,
                context: window.appContext?.getState()?.currentAnalysis
            });

            if (response) {
                this.addMessageToUI('user', `📎 ${file.name}`);
                this.addMessageToUI('bot', response.answer);
                window.appContext?.addChatMessage('user', file.name, 'file');
                window.appContext?.addChatMessage('bot', response.answer);
            }
        } catch (error) {
            window.appContext?.addNotification('Error processing file', 'error');
        }
    }

    renderChat(history) {
        const chatBox = document.getElementById('chat-messages');
        if (!chatBox) return;

        chatBox.innerHTML = history.map(msg => `
            <div class="message message-${msg.role} ${msg.role === 'user' ? 'text-right' : 'text-left'}">
                <div class="inline-block max-w-xs px-4 py-2 rounded-lg ${
                    msg.role === 'user'
                        ? 'bg-blue-500 text-white rounded-br-none'
                        : 'bg-gray-700 text-gray-100 rounded-bl-none'
                }">
                    ${this.escapeHtml(msg.content)}
                </div>
            </div>
        `).join('');

        chatBox.scrollTop = chatBox.scrollHeight;
    }

    clearChat() {
        if (!confirm(t('Clear all chat messages?'))) return;

        window.appContext?.setState({ chatHistory: [] });
        document.getElementById('chat-messages')!.innerHTML = '';
        window.appContext?.addNotification(t('Chat cleared'), 'success');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize
window.chatbotComponent = new ChatbotComponent();
