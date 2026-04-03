/**
 * Configuration constants for the Chat Analyzer application
 */
const CONFIG = {
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_FILE_EXTENSION: '.txt',
    ACCEPT_FILE_TYPES: '.txt',
    ANIMATION_DURATION: 300,
    DEBOUNCE_DELAY: 300
};

/**
 * Error messages used throughout the application
 */
const MESSAGES = {
    FILE_TYPE_ERROR: 'Please upload a .txt file only. WhatsApp exports chats as .txt files.',
    FILE_SIZE_ERROR: 'File is too large. Maximum file size is 10MB.',
    FILE_READ_ERROR: 'Unable to read the file. Please try again or paste the content manually.',
    EMPTY_TITLE_ERROR: 'Please enter a title for your chat.',
    EMPTY_CONTENT_ERROR: 'Please paste your chat content or upload a .txt file.',
    LOADING_TEXT: 'Processing...',
    SUBMIT_BUTTON_TEXT: 'Save Chat',
    ANALYZING_TEXT: 'Analyzing your chat...'
};

// Freeze objects to prevent accidental modifications
Object.freeze(CONFIG);
Object.freeze(MESSAGES);

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CONFIG, MESSAGES };
}
