/**
 * Utility functions for the Chat Analyzer application
 */

/**
 * Debounce function to limit how often a function can fire
 * @param {Function} func - Function to debounce
 * @param {number} wait - Milliseconds to wait
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Show error message in a DOM element
 * @param {HTMLElement} element - Error container element
 * @param {string} message - Error message to display
 */
function showError(element, message) {
    if (!element) return;
    element.textContent = message;
    element.style.display = 'block';
    element.setAttribute('role', 'alert');
    element.setAttribute('aria-live', 'polite');
}

/**
 * Hide error message in a DOM element
 * @param {HTMLElement} element - Error container element
 */
function hideError(element) {
    if (!element) return;
    element.style.display = 'none';
    element.removeAttribute('role');
    element.removeAttribute('aria-live');
}

/**
 * Validate file type
 * @param {File} file - File to validate
 * @param {string} allowedExtension - Allowed file extension
 * @returns {boolean} True if valid
 */
function isValidFileType(file, allowedExtension) {
    return file && file.name && file.name.toLowerCase().endsWith(allowedExtension.toLowerCase());
}

/**
 * Validate file size
 * @param {File} file - File to validate
 * @param {number} maxSize - Maximum file size in bytes
 * @returns {boolean} True if valid
 */
function isValidFileSize(file, maxSize) {
    return file && file.size <= maxSize;
}

/**
 * Read file content using FileReader
 * @param {File} file - File to read
 * @returns {Promise<string>} File content
 */
function readFileContent(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (event) => resolve(event.target.result);
        reader.onerror = () => reject(new Error('Failed to read file'));
        
        reader.readAsText(file);
    });
}

/**
 * Set button loading state
 * @param {HTMLButtonElement} button - Button element
 * @param {boolean} isLoading - Whether button is loading
 * @param {string} loadingText - Text to show when loading
 * @param {string} defaultText - Default button text
 */
function setButtonLoadingState(button, isLoading, loadingText, defaultText) {
    if (!button) return;
    
    button.disabled = isLoading;
    button.textContent = isLoading ? loadingText : defaultText;
    button.setAttribute('aria-busy', isLoading ? 'true' : 'false');
}

/**
 * Toggle loading indicator visibility
 * @param {HTMLElement} indicator - Loading indicator element
 * @param {boolean} show - Whether to show or hide
 */
function toggleLoadingIndicator(indicator, show) {
    if (!indicator) return;
    indicator.style.display = show ? 'flex' : 'none';
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        debounce,
        showError,
        hideError,
        isValidFileType,
        isValidFileSize,
        readFileContent,
        setButtonLoadingState,
        toggleLoadingIndicator
    };
}
