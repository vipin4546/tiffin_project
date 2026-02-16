// frontend/js/auth.js

// ✅ Backend URL configuration
const BACKEND_URL = (window.location.port === '5000' || window.location.hostname === 'localhost:5000') ? '' : 'http://localhost:5000';

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.token = localStorage.getItem('token');
        this.init();
    }

    async init() {
        await this.checkAuthStatus();
        this.renderNavigation();
        this.setupEventListeners();
    }

    async checkAuthStatus() {
        try {
            if (!this.token) {
                return;
            }

            // ✅ USE BACKEND_URL here - This was missing!
            const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.currentUser = data.user;
                console.log('User logged in:', this.currentUser);
            } else {
                // Token is invalid, clear it
                this.clearAuth();
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            this.clearAuth();
        }
    }

    renderNavigation() {
        const authButtons = document.getElementById('authButtons');
        const userProfile = document.getElementById('userProfile');
        const userNameSpan = document.getElementById('userName');

        if (this.currentUser) {
            // User is logged in - show profile
            if (authButtons) authButtons.style.display = 'none';
            if (userProfile) userProfile.style.display = 'flex';
            if (userNameSpan) {
                userNameSpan.textContent = this.currentUser.fullName || this.currentUser.email.split('@')[0];
            }
        } else {
            // User is not logged in - show login/signup buttons
            if (authButtons) authButtons.style.display = 'flex';
            if (userProfile) userProfile.style.display = 'none';
        }
    }

    clearAuth() {
        localStorage.removeItem('token');
        this.token = null;
        this.currentUser = null;
        this.renderNavigation();
    }

    setupEventListeners() {
        // Close dropdown when clicking outside
        document.addEventListener('click', (event) => {
            const dropdown = document.getElementById('profileDropdown');
            const profileIcon = document.getElementById('userProfile');
            
            if (dropdown && profileIcon && !profileIcon.contains(event.target)) {
                dropdown.style.display = 'none';
            }
        });
    }
}

// Initialize auth manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.authManager = new AuthManager();
});

// Profile dropdown functionality
function toggleProfileDropdown() {
    const dropdown = document.getElementById('profileDropdown');
    if (dropdown) {
        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    }
}

// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('role');
        localStorage.removeItem('isLoggedIn');
        window.location.href = 'index.html';
    }
}

// Check if user is authenticated
function isAuthenticated() {
    return !!localStorage.getItem('token');
}

// Get current token
function getToken() {
    return localStorage.getItem('token');
}