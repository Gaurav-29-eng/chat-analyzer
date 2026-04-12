/**
 * Form Handler Module
 * Manages form submission, loading states, and error handling
 */

// Render backend URL - update this with your Render deployment URL
const RENDER_BACKEND_URL = 'https://chat-analyzer-zpyx.onrender.com';

class FormHandler {
    /**
     * Create a FormHandler instance
     * @param {Object} options - Configuration options
     * @param {HTMLFormElement} options.form - Form element
     * @param {HTMLButtonElement} options.submitButton - Submit button element
     * @param {HTMLElement} options.loadingIndicator - Loading indicator element
     * @param {FormValidator} options.validator - FormValidator instance
     * @param {Function} options.onSubmit - Callback before submission
     * @param {Function} options.onSuccess - Callback on successful submission
     * @param {Function} options.onError - Callback on submission error
     * @param {string} options.backendUrl - Backend URL (defaults to RENDER_BACKEND_URL)
     */
    constructor(options) {
        this.form = options.form;
        this.submitButton = options.submitButton;
        this.loadingIndicator = options.loadingIndicator;
        this.validator = options.validator;
        this.onSubmit = options.onSubmit || (() => {});
        this.onSuccess = options.onSuccess || (() => {});
        this.onError = options.onError || (() => {});
        this.backendUrl = options.backendUrl || RENDER_BACKEND_URL;
        this.responseData = null;

        this.defaultButtonText = this.submitButton ? this.submitButton.textContent : 'Submit';
        this.loadingText = options.loadingText || 'Processing...';

        this.init();
    }
    
    /**
     * Initialize event listeners
     */
    init() {
        if (!this.form) return;
        
        this.form.addEventListener('submit', this.handleSubmit.bind(this));
    }
    
    /**
     * Handle form submission
     * @param {Event} event - Submit event
     */
    async handleSubmit(event) {
        event.preventDefault();

        // Run validation if validator is provided
        if (this.validator) {
            const validation = this.validator.validate();

            if (!validation.isValid) {
                this.validator.showValidationErrors(validation);
                this.onError(validation.errors);
                return;
            }
        }

        // Clear any existing errors
        if (this.validator) {
            this.validator.clear();
        }

        // Clean chat content before sending
        const chatInput = this.form.querySelector('textarea[name="content"]');
        if (chatInput) {
            const cleanText = chatInput.value
                .replace(/\r\n/g, "\n")
                .replace(/\t/g, " ")
                .replace(/[^\x00-\x7F]/g, "");
            chatInput.value = cleanText;
        }

        // Show loading state
        this.setLoadingState(true);

        // Call onSubmit callback
        this.onSubmit();

        // Send via fetch to Render backend
        const formData = new FormData(this.form);
        const endpoint = '/analyze';
        const url = this.backendUrl + endpoint;

        try {
            const response = await fetch(url, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                // Read and parse JSON response
                const data = await response.json();
                // Store response data
                this.responseData = data;
                // Trigger callbacks with response data
                this.showResult(data);
                this.onSuccess(data);
            } else {
                const error = await response.text();
                this.showError(error);
                this.onError(error);
            }
        } catch (err) {
            this.showError('Failed to submit. Please try again.');
            this.onError(err);
        } finally {
            this.setLoadingState(false);
        }
    }

    /**
     * Show submission result without page reload
     * @param {Object} data - Response JSON data
     */
    showResult(data) {
        // Display success message inline
        this.showSuccessMessage(data.message || 'Chat analyzed successfully!');
        // Store result for access
        this.lastResult = data;

        // Display analysis results
        this.showAnalysisResults(data);
    }

    /**
     * Display mood, score, and analysis output
     * @param {Object} data - Response JSON data
     */
    showAnalysisResults(data) {
        // Remove existing results
        const existing = this.form.querySelector('.analysis-results');
        if (existing) existing.remove();

        // Create results container
        const container = document.createElement('div');
        container.className = 'analysis-results';

        // Mood
        const mood = data.analysis?.mood || data.mood || 'Unknown';
        const score = data.analysis?.score ?? data.score ?? 0;

        container.innerHTML = `
            <div class="analysis-card">
                <h3>Analysis Results</h3>
                <div class="analysis-row">
                    <span class="analysis-label">Mood:</span>
                    <span class="analysis-value mood-${mood.toLowerCase()}">${mood}</span>
                </div>
                <div class="analysis-row">
                    <span class="analysis-label">Score:</span>
                    <span class="analysis-value">${score}</span>
                </div>
                ${data.top_words ? `
                <div class="analysis-row">
                    <span class="analysis-label">Top Words:</span>
                    <div class="top-words">
                        ${data.top_words.map(w => `<span class="word-tag">${w.word} (${w.count})</span>`).join('')}
                    </div>
                </div>
                ` : ''}
                ${data.summary ? `
                <div class="analysis-row">
                    <span class="analysis-label">Summary:</span>
                    <p class="analysis-summary">${data.summary}</p>
                </div>
                ` : ''}
            </div>
        `;

        // Insert after form
        this.form.parentNode.insertBefore(container, this.form.nextSibling);
    }

    /**
     * Show success message
     * @param {string} message - Success message
     */
    showSuccessMessage(message) {
        // Create or update success alert
        let alert = this.form.querySelector('.alert-success');
        if (!alert) {
            alert = document.createElement('div');
            alert.className = 'alert alert-success';
            alert.setAttribute('role', 'alert');
            this.form.insertBefore(alert, this.form.firstChild);
        }
        alert.textContent = message;
        alert.style.display = 'block';

        // Auto-hide after 3 seconds
        setTimeout(() => {
            alert.style.display = 'none';
        }, 3000);
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        alert(message);
    }
    
    /**
     * Set loading state on button and show indicator
     * @param {boolean} isLoading - Whether form is loading
     */
    setLoadingState(isLoading) {
        // Update button
        if (this.submitButton) {
            this.submitButton.disabled = isLoading;
            this.submitButton.textContent = isLoading ? this.loadingText : this.defaultButtonText;
            this.submitButton.setAttribute('aria-busy', isLoading ? 'true' : 'false');
        }
        
        // Toggle loading indicator
        if (this.loadingIndicator) {
            this.loadingIndicator.style.display = isLoading ? 'flex' : 'none';
        }
    }
    
    /**
     * Reset form to initial state
     */
    reset() {
        if (this.form) {
            this.form.reset();
        }
        this.setLoadingState(false);
        if (this.validator) {
            this.validator.clear();
        }
    }
    
    /**
     * Disable form submission
     */
    disable() {
        if (this.submitButton) {
            this.submitButton.disabled = true;
        }
    }
    
    /**
     * Enable form submission
     */
    enable() {
        if (this.submitButton) {
            this.submitButton.disabled = false;
        }
    }
    
    /**
     * Destroy the instance and clean up
     */
    destroy() {
        if (this.form) {
            this.form.removeEventListener('submit', this.handleSubmit);
        }
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FormHandler;
}
