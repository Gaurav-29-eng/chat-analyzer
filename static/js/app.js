/**
 * Chat Analyzer Application
 * Main entry point that initializes all modules
 */

/**
 * ChatAnalyzerApp - Main application class
 * Manages all components and their interactions
 */
class ChatAnalyzerApp {
    constructor() {
        this.components = {};
        this.isInitialized = false;
    }
    
    /**
     * Initialize the application
     */
    init() {
        if (this.isInitialized) {
            console.warn('ChatAnalyzerApp already initialized');
            return;
        }
        
        // Check if we're on the index page with the form
        const form = document.querySelector('form[action*="submit_chat"]');
        if (form) {
            this.initChatForm();
        }
        
        this.isInitialized = true;
        console.log('ChatAnalyzerApp initialized successfully');
    }
    
    /**
     * Initialize the chat form components
     */
    initChatForm() {
        // Get DOM elements
        const elements = this.getFormElements();
        
        if (!elements.form) {
            console.error('Form element not found');
            return;
        }
        
        // Initialize FileUploader
        if (elements.fileInput && typeof FileUploader !== 'undefined') {
            this.components.fileUploader = new FileUploader({
                fileInput: elements.fileInput,
                errorContainer: elements.fileError,
                contentTextarea: elements.contentTextarea,
                maxFileSize: 10 * 1024 * 1024, // 10MB
                allowedExtension: '.txt',
                onSuccess: (content) => {
                    // Clear content error when file is successfully loaded
                    if (this.components.formValidator) {
                        this.components.formValidator.hideError();
                    }
                    console.log('File uploaded successfully');
                },
                onError: (message) => {
                    console.error('File upload error:', message);
                }
            });
        }
        
        // Initialize FormValidator
        if (typeof FormValidator !== 'undefined') {
            this.components.formValidator = new FormValidator({
                titleInput: elements.titleInput,
                contentTextarea: elements.contentTextarea,
                errorContainer: elements.contentError
            });
        }
        
        // Initialize FormHandler
        if (typeof FormHandler !== 'undefined') {
            this.components.formHandler = new FormHandler({
                form: elements.form,
                submitButton: elements.submitButton,
                loadingIndicator: elements.loadingIndicator,
                validator: this.components.formValidator,
                loadingText: 'Processing...',
                onSubmit: () => {
                    console.log('Form submission started');
                },
                onError: (errors) => {
                    console.error('Validation errors:', errors);
                }
            });
        }
    }
    
    /**
     * Get all form-related DOM elements
     * @returns {Object} Object containing all form elements
     */
    getFormElements() {
        return {
            form: document.querySelector('form[action*="submit_chat"]'),
            titleInput: document.getElementById('title'),
            fileInput: document.getElementById('file-upload'),
            contentTextarea: document.getElementById('content'),
            submitButton: document.getElementById('submit-btn'),
            fileError: document.getElementById('file-error'),
            contentError: document.getElementById('content-error'),
            loadingIndicator: document.getElementById('loading-indicator')
        };
    }
    
    /**
     * Destroy all components and clean up
     */
    destroy() {
        Object.values(this.components).forEach(component => {
            if (component && typeof component.destroy === 'function') {
                component.destroy();
            }
        });
        this.components = {};
        this.isInitialized = false;
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.chatAnalyzerApp = new ChatAnalyzerApp();
        window.chatAnalyzerApp.init();
    });
} else {
    window.chatAnalyzerApp = new ChatAnalyzerApp();
    window.chatAnalyzerApp.init();
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChatAnalyzerApp;
}
