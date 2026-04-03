/**
 * Form Validator Module
 * Handles form validation logic
 */

class FormValidator {
    /**
     * Create a FormValidator instance
     * @param {Object} options - Configuration options
     * @param {HTMLInputElement} options.titleInput - Title input element
     * @param {HTMLTextAreaElement} options.contentTextarea - Content textarea element
     * @param {HTMLElement} options.errorContainer - Error display element
     */
    constructor(options) {
        this.titleInput = options.titleInput;
        this.contentTextarea = options.contentTextarea;
        this.errorContainer = options.errorContainer;
        this.customValidators = options.customValidators || [];
        
        this.init();
    }
    
    /**
     * Initialize event listeners
     */
    init() {
        if (this.contentTextarea) {
            this.contentTextarea.addEventListener('input', this.handleContentInput.bind(this));
        }
    }
    
    /**
     * Handle content input to clear errors
     */
    handleContentInput() {
        if (this.hasContent()) {
            this.hideError();
        }
    }
    
    /**
     * Check if content textarea has value
     * @returns {boolean} True if has content
     */
    hasContent() {
        return this.contentTextarea && this.contentTextarea.value.trim().length > 0;
    }
    
    /**
     * Check if title input has value
     * @returns {boolean} True if has title
     */
    hasTitle() {
        return this.titleInput && this.titleInput.value.trim().length > 0;
    }
    
    /**
     * Validate the entire form
     * @returns {Object} Validation result with isValid flag and errors array
     */
    validate() {
        const errors = [];
        
        // Validate title
        if (!this.hasTitle()) {
            errors.push({
                field: 'title',
                message: 'Please enter a title for your chat.'
            });
        }
        
        // Validate content
        if (!this.hasContent()) {
            errors.push({
                field: 'content',
                message: 'Please paste your chat content or upload a .txt file.'
            });
        }
        
        // Run custom validators
        this.customValidators.forEach(validator => {
            const result = validator(this);
            if (!result.valid) {
                errors.push({
                    field: result.field || 'custom',
                    message: result.message
                });
            }
        });
        
        return {
            isValid: errors.length === 0,
            errors: errors,
            firstError: errors[0] || null
        };
    }
    
    /**
     * Show validation errors
     * @param {Object} validationResult - Result from validate()
     */
    showValidationErrors(validationResult) {
        if (validationResult.firstError && this.errorContainer) {
            this.showError(validationResult.firstError.message);
            
            // Focus on the first invalid field
            if (validationResult.firstError.field === 'content' && this.contentTextarea) {
                this.contentTextarea.focus();
            } else if (validationResult.firstError.field === 'title' && this.titleInput) {
                this.titleInput.focus();
            }
        }
    }
    
    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        if (this.errorContainer) {
            this.errorContainer.textContent = message;
            this.errorContainer.style.display = 'block';
            this.errorContainer.setAttribute('role', 'alert');
            this.errorContainer.setAttribute('aria-live', 'polite');
        }
    }
    
    /**
     * Hide error message
     */
    hideError() {
        if (this.errorContainer) {
            this.errorContainer.style.display = 'none';
            this.errorContainer.removeAttribute('role');
            this.errorContainer.removeAttribute('aria-live');
        }
    }
    
    /**
     * Clear all validation states
     */
    clear() {
        this.hideError();
    }
    
    /**
     * Add custom validator
     * @param {Function} validator - Custom validator function
     */
    addValidator(validator) {
        this.customValidators.push(validator);
    }
    
    /**
     * Destroy the instance and clean up
     */
    destroy() {
        if (this.contentTextarea) {
            this.contentTextarea.removeEventListener('input', this.handleContentInput);
        }
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FormValidator;
}
