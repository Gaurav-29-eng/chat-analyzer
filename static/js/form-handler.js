/**
 * Form Handler Module
 * Manages form submission, loading states, and error handling
 */

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
     */
    constructor(options) {
        this.form = options.form;
        this.submitButton = options.submitButton;
        this.loadingIndicator = options.loadingIndicator;
        this.validator = options.validator;
        this.onSubmit = options.onSubmit || (() => {});
        this.onSuccess = options.onSuccess || (() => {});
        this.onError = options.onError || (() => {});
        
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
    handleSubmit(event) {
        // Run validation if validator is provided
        if (this.validator) {
            const validation = this.validator.validate();
            
            if (!validation.isValid) {
                event.preventDefault();
                this.validator.showValidationErrors(validation);
                this.onError(validation.errors);
                return;
            }
        }
        
        // Clear any existing errors
        if (this.validator) {
            this.validator.clear();
        }
        
        // Show loading state
        this.setLoadingState(true);
        
        // Call onSubmit callback
        this.onSubmit();
        
        // Form will submit normally (for server-side rendering)
        // The loading state will persist until page reloads
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
