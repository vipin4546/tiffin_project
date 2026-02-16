// frontend/js/config.js
const CONFIG = {
    // Auto-detect environment
    BACKEND_URL: window.location.port === '5000' ? '' : 'http://localhost:5000'
};