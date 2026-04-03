/**
 * File Upload Handler Module
 * Handles file upload validation and reading
 */

class FileUploader {
    /**
     * Create a FileUploader instance
     * @param {Object} options - Configuration options
     * @param {HTMLInputElement} options.fileInput - File input element
     * @param {HTMLElement} options.errorContainer - Error display element
     * @param {HTMLTextAreaElement} options.contentTextarea - Content textarea to populate
     * @param {Function} options.onSuccess - Callback when file is successfully read
     * @param {Function} options.onError - Callback when file reading fails
     */
    constructor(options) {
        this.fileInput = options.fileInput;
        this.errorContainer = options.errorContainer;
        this.contentTextarea = options.contentTextarea;
        this.onSuccess = options.onSuccess || (() => {});
        this.onError = options.onError || (() => {});
        
        this.MAX_FILE_SIZE = options.maxFileSize || 10 * 1024 * 1024;
        this.ALLOWED_EXTENSION = options.allowedExtension || '.txt';
        
        this.init();
    }
    
    /**
     * Initialize event listeners
     */
    init() {
        if (!this.fileInput) return;
        
        this.fileInput.addEventListener('change', this.handleFileChange.bind(this));
    }
    
    /**
     * Handle file change event
     * @param {Event} event - Change event
     */
    handleFileChange(event) {
        const file = event.target.files[0];
        
        if (!file) return;
        
        // Validate and process file
        const validation = this.validateFile(file);
        if (!validation.valid) {
            this.showError(validation.message);
            this.resetFileInput();
            return;
        }
        
        // Clear any previous errors
        this.hideError();
        
        // Read file content
        this.readFile(file);
    }
    
    /**
     * Validate file type and size
     * @param {File} file - File to validate
     * @returns {Object} Validation result with valid flag and message
     */
    validateFile(file) {
        // Check file type
        if (!this.isValidFileType(file)) {
            return {
                valid: false,
                message: `Please upload a ${this.ALLOWED_EXTENSION} file only. WhatsApp exports chats as ${this.ALLOWED_EXTENSION} files.`
            };
        }
        
        // Check file size
        if (file.size > this.MAX_FILE_SIZE) {
            const maxSizeMB = (this.MAX_FILE_SIZE / (1024 * 1024)).toFixed(0);
            return {
                valid: false,
                message: `File is too large. Maximum file size is ${maxSizeMB}MB.`
            };
        }
        
        return { valid: true, message: '' };
    }
    
    /**
     * Check if file has allowed extension
     * @param {File} file - File to check
     * @returns {boolean} True if valid
     */
    isValidFileType(file) {
        return file && file.name && 
               file.name.toLowerCase().endsWith(this.ALLOWED_EXTENSION.toLowerCase());
    }
    
    /**
     * Read file content using FileReader
     * @param {File} file - File to read
     */
    readFile(file) {
        const reader = new FileReader();
        
        reader.onload = (event) => {
            this.handleFileSuccess(event.target.result);
        };
        
        reader.onerror = () => {
            this.handleFileError('Unable to read the file. Please try again or paste the content manually.');
        };
        
        reader.readAsText(file);
    }
    
    /**
     * Handle successful file read
     * @param {string} content - File content
     */
    handleFileSuccess(content) {
        if (this.contentTextarea) {
            this.contentTextarea.value = content;
        }
        this.onSuccess(content);
    }
    
    /**
     * Handle file read error
     * @param {string} message - Error message
     */
    handleFileError(message) {
        this.showError(message);
        this.resetFileInput();
        this.onError(message);
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
        }
    }
    
    /**
     * Hide error message
     */
    hideError() {
        if (this.errorContainer) {
            this.errorContainer.style.display = 'none';
            this.errorContainer.removeAttribute('role');
        }
    }
    
    /**
     * Reset file input
     */
    resetFileInput() {
        if (this.fileInput) {
            this.fileInput.value = '';
        }
    }
    
    /**
     * Destroy the instance and clean up
     */
    destroy() {
        if (this.fileInput) {
            this.fileInput.removeEventListener('change', this.handleFileChange);
        }
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FileUploader;
}
