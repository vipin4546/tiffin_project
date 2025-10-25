class AuthManager {
  constructor() {
    this.token = localStorage.getItem("smartTiffinToken");
    this.currentUser = null;
    this.init();
  }

  init() {
    this.checkAuthentication();
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Login form handler
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
      loginForm.addEventListener("submit", (e) => this.handleLogin(e));
    }

    // Logout handler
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", (e) => this.handleLogout(e));
    }

    // Admin login toggle
    const adminLoginToggle = document.getElementById("adminLoginToggle");
    if (adminLoginToggle) {
      adminLoginToggle.addEventListener("click", (e) =>
        this.toggleAdminLogin(e)
      );
    }
  }

  async handleLogin(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const email = formData.get("email");
    const password = formData.get("password");
    const isAdminLogin =
      document.getElementById("adminLoginFields")?.style.display !== "none";

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, isAdminLogin }),
      });

      const data = await response.json();

      if (data.status === "success") {
        this.token = data.token;
        localStorage.setItem("smartTiffinToken", data.token);
        this.currentUser = data.data.user;

        this.showAlert("Login successful!", "success");
        this.redirectBasedOnRole(data.data.user.role);
      } else {
        this.showAlert(data.message, "error");
      }
    } catch (error) {
      console.error("Login error:", error);
      this.showAlert("Login failed. Please try again.", "error");
    }
  }

  async handleLogout(e) {
    e.preventDefault();

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      this.token = null;
      this.currentUser = null;
      localStorage.removeItem("smartTiffinToken");
      window.location.href = "/login.html";
    }
  }

  toggleAdminLogin(e) {
    e.preventDefault();
    const adminFields = document.getElementById("adminLoginFields");
    const regularFields = document.getElementById("regularLoginFields");
    const toggleText = document.getElementById("adminToggleText");

    if (adminFields.style.display === "none") {
      adminFields.style.display = "block";
      regularFields.style.display = "none";
      toggleText.textContent = "← Back to regular login";
    } else {
      adminFields.style.display = "none";
      regularFields.style.display = "block";
      toggleText.textContent = "Admin login →";
    }
  }

  redirectBasedOnRole(role) {
    switch (role) {
      case "admin":
        window.location.href = "/admin-dashboard.html";
        break;
      case "chef":
        window.location.href = "/chef-dashboard.html";
        break;
      case "customer":
      default:
        window.location.href = "/customer-dashboard.html";
    }
  }

  async checkAuthentication() {
    if (this.token) {
      try {
        const response = await fetch("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          this.currentUser = data.data.user;
          this.updateUI();
        } else {
          this.clearAuth();
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        this.clearAuth();
      }
    }
  }

  updateUI() {
    // Update profile dropdown
    const userNameElement = document.getElementById("userName");
    const userRoleElement = document.getElementById("userRole");
    const userAvatarElement = document.getElementById("userAvatar");
    const authButtons = document.getElementById("authButtons");
    const userDropdown = document.getElementById("userDropdown");

    if (this.currentUser) {
      if (userNameElement) userNameElement.textContent = this.currentUser.name;
      if (userRoleElement) userRoleElement.textContent = this.currentUser.role;
      if (userAvatarElement) {
        userAvatarElement.src =
          this.currentUser.profileImage || "/images/default-avatar.jpg";
        userAvatarElement.alt = this.currentUser.name;
      }
      if (authButtons) authButtons.style.display = "none";
      if (userDropdown) userDropdown.style.display = "block";
    }
  }

  clearAuth() {
    this.token = null;
    this.currentUser = null;
    localStorage.removeItem("smartTiffinToken");
    this.updateUI();
  }

  showAlert(message, type) {
    // Remove existing alerts
    const existingAlert = document.querySelector(".alert");
    if (existingAlert) existingAlert.remove();

    const alertDiv = document.createElement("div");
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

    // Insert at the top of the main content or form
    const mainContent =
      document.querySelector("main") || document.querySelector(".container");
    if (mainContent) {
      mainContent.insertBefore(alertDiv, mainContent.firstChild);
    }

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (alertDiv.parentElement) {
        alertDiv.remove();
      }
    }, 5000);
  }

  // Method to get auth headers for API calls
  getAuthHeaders() {
    return {
      Authorization: `Bearer ${this.token}`,
      "Content-Type": "application/json",
    };
  }
}

// Initialize auth manager when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.authManager = new AuthManager();
});
