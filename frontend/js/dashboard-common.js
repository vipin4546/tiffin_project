class DashboardCommon {
  constructor() {
    this.token = localStorage.getItem("smartTiffinToken");
    this.userData = JSON.parse(localStorage.getItem("userData") || "{}");
    this.apiBase = "/api";
  }

  // Get auth headers for API calls
  getAuthHeaders() {
    return {
      Authorization: `Bearer ${this.token}`,
      "Content-Type": "application/json",
    };
  }

  // Show notification alert
  showAlert(message, type = "info") {
    const alertDiv = document.createElement("div");
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alertDiv.style.cssText =
      "top: 20px; right: 20px; z-index: 9999; min-width: 300px;";
    alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

    document.body.appendChild(alertDiv);

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (alertDiv.parentElement) {
        alertDiv.remove();
      }
    }, 5000);
  }

  // Format date
  formatDate(dateString) {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  // Format currency
  formatCurrency(amount) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  }

  // Format compact currency for large numbers
  formatCompactCurrency(amount) {
    if (amount >= 100000) {
      return "₹" + (amount / 100000).toFixed(1) + "L";
    } else if (amount >= 1000) {
      return "₹" + (amount / 1000).toFixed(0) + "K";
    }
    return this.formatCurrency(amount);
  }

  // Logout function
  logout() {
    localStorage.removeItem("smartTiffinToken");
    localStorage.removeItem("userData");
    window.location.href = "/login.html";
  }

  // Initialize profile dropdown with actual user data
  initProfileDropdown() {
    const profileImg = document.querySelector("#profileDropdown img");
    const profileName = document.querySelector("#profileDropdown span");

    if (profileImg && this.userData.name) {
      const initials = this.userData.name
        .split(" ")
        .map((n) => n[0])
        .join("");
      profileImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
        this.userData.name
      )}&background=2E8B57&color=fff`;
    }

    if (profileName) {
      profileName.textContent = this.userData.name || "Admin User";
    }

    // Add logout functionality
    const logoutLinks = document.querySelectorAll('a[href="#logout"]');
    logoutLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        this.logout();
      });
    });
  }

  // Check authentication
  checkAuth() {
    if (!this.token) {
      window.location.href = "/login.html";
      return false;
    }
    return true;
  }

  // Generic API call with error handling
  async apiCall(endpoint, options = {}) {
    try {
      const response = await fetch(`${this.apiBase}${endpoint}`, {
        headers: this.getAuthHeaders(),
        ...options,
      });

      if (response.status === 401) {
        this.logout();
        return null;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("API call failed:", error);
      this.showAlert("Network error. Please try again.", "danger");
      return null;
    }
  }

  // Initialize sidebar navigation
  initSidebarNavigation() {
    // Sidebar toggle functionality is already in HTML, just ensure it works
    const sidebarToggle = document.getElementById("sidebarToggle");
    const sidebar = document.querySelector(".sidebar");

    if (sidebarToggle && sidebar) {
      sidebarToggle.addEventListener("click", function () {
        sidebar.classList.toggle("active");
      });
    }

    // Close sidebar when clicking outside on mobile
    document.addEventListener("click", (e) => {
      if (
        window.innerWidth < 992 &&
        sidebar &&
        sidebar.classList.contains("active")
      ) {
        if (!sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
          sidebar.classList.remove("active");
        }
      }
    });
  }
}function validateUser() {
    const token = localStorage.getItem('smartTiffinToken');

    if (!token) {
        return redirectToLogin();
    }

    fetch('/api/auth/me', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === 'success') {
            const role = data.data.user.role;
            showProfileOptions(role); 
        } else {
            redirectToLogin();
        }
    })
    .catch(() => redirectToLogin());
}

function redirectToLogin() {
    localStorage.clear();
    window.location.href = '/login.html';
}

