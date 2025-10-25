class DashboardManager {
  constructor() {
    this.authManager = window.authManager;
    this.init();
  }

  async init() {
    await this.authManager.checkAuthentication();

    if (!this.authManager.currentUser) {
      window.location.href = "/login.html";
      return;
    }

    this.setupDashboard();
    this.loadDashboardData();
  }

  setupDashboard() {
    // Role-specific setup
    switch (this.authManager.currentUser.role) {
      case "customer":
        this.setupCustomerDashboard();
        break;
      case "chef":
        this.setupChefDashboard();
        break;
      case "admin":
        this.setupAdminDashboard();
        break;
    }

    // Common dashboard event listeners
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Subscription actions
    const subscribeBtn = document.getElementById("subscribeBtn");
    if (subscribeBtn) {
      subscribeBtn.addEventListener("click", (e) => this.handleSubscription(e));
    }

    // Menu item interactions
    document.addEventListener("click", (e) => {
      if (e.target.classList.contains("add-to-cart")) {
        this.handleAddToCart(e);
      }
      if (e.target.classList.contains("view-details")) {
        this.handleViewDetails(e);
      }
    });

    // Profile updates
    const profileForm = document.getElementById("profileForm");
    if (profileForm) {
      profileForm.addEventListener("submit", (e) =>
        this.handleProfileUpdate(e)
      );
    }
  }

  async loadDashboardData() {
    try {
      const role = this.authManager.currentUser.role;
      let endpoint = "";

      switch (role) {
        case "customer":
          endpoint = "/api/dashboard/customer";
          break;
        case "chef":
          endpoint = "/api/dashboard/chef";
          break;
        case "admin":
          endpoint = "/api/dashboard/admin";
          break;
      }

      const response = await fetch(endpoint, {
        headers: this.authManager.getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        this.updateDashboardUI(data);
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    }
  }

  updateDashboardUI(data) {
    // Update dashboard with loaded data
    const welcomeElement = document.getElementById("welcomeMessage");
    if (welcomeElement) {
      welcomeElement.textContent = `Welcome back, ${this.authManager.currentUser.name}!`;
    }

    // Role-specific UI updates
    switch (this.authManager.currentUser.role) {
      case "customer":
        this.updateCustomerDashboard(data);
        break;
      case "chef":
        this.updateChefDashboard(data);
        break;
      case "admin":
        this.updateAdminDashboard(data);
        break;
    }
  }

  // Customer-specific methods
  setupCustomerDashboard() {
    console.log("Setting up customer dashboard...");
  }

  updateCustomerDashboard(data) {
    // Update subscriptions
    const subscriptionsElement = document.getElementById("subscriptions");
    if (subscriptionsElement && data.subscriptions) {
      subscriptionsElement.innerHTML = this.renderSubscriptions(
        data.subscriptions
      );
    }

    // Update recommended meals
    const mealsElement = document.getElementById("recommendedMeals");
    if (mealsElement && data.recommendedMeals) {
      mealsElement.innerHTML = this.renderMeals(data.recommendedMeals);
    }
  }

  async handleSubscription(e) {
    const planId = e.target.dataset.planId;

    try {
      const response = await fetch("/api/subscriptions/subscribe", {
        method: "POST",
        headers: this.authManager.getAuthHeaders(),
        body: JSON.stringify({ planId }),
      });

      const data = await response.json();

      if (data.status === "success") {
        this.authManager.showAlert("Subscription successful!", "success");
        this.loadDashboardData(); // Refresh data
      } else {
        this.authManager.showAlert(data.message, "error");
      }
    } catch (error) {
      console.error("Subscription error:", error);
      this.authManager.showAlert(
        "Subscription failed. Please try again.",
        "error"
      );
    }
  }

  // Chef-specific methods
  setupChefDashboard() {
    console.log("Setting up chef dashboard...");
  }

  updateChefDashboard(data) {
    // Update chef stats
    const statsElement = document.getElementById("chefStats");
    if (statsElement && data.stats) {
      statsElement.innerHTML = this.renderChefStats(data.stats);
    }

    // Update orders
    const ordersElement = document.getElementById("recentOrders");
    if (ordersElement && data.recentOrders) {
      ordersElement.innerHTML = this.renderOrders(data.recentOrders);
    }
  }

  // Admin-specific methods
  setupAdminDashboard() {
    console.log("Setting up admin dashboard...");
  }

  updateAdminDashboard(data) {
    // Update admin stats
    const statsElement = document.getElementById("adminStats");
    if (statsElement && data.stats) {
      statsElement.innerHTML = this.renderAdminStats(data.stats);
    }

    // Update pending approvals
    const approvalsElement = document.getElementById("pendingApprovals");
    if (approvalsElement && data.pendingApprovals) {
      approvalsElement.innerHTML = this.renderPendingApprovals(
        data.pendingApprovals
      );
    }
  }

  // UI rendering helpers
  renderSubscriptions(subscriptions) {
    return subscriptions
      .map(
        (sub) => `
            <div class="col-md-4 mb-3">
                <div class="card">
                    <div class="card-body">
                        <h5 class="card-title">${sub.planName}</h5>
                        <p class="card-text">${sub.status}</p>
                        <p class="card-text">Next delivery: ${sub.nextDelivery}</p>
                    </div>
                </div>
            </div>
        `
      )
      .join("");
  }

  renderChefStats(stats) {
    return `
            <div class="row text-center">
                <div class="col-md-3">
                    <div class="card bg-primary text-white">
                        <div class="card-body">
                            <h3>${stats.activeSubscriptions}</h3>
                            <p>Active Subscriptions</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-success text-white">
                        <div class="card-body">
                            <h3>${stats.totalOrders}</h3>
                            <p>Total Orders</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-info text-white">
                        <div class="card-body">
                            <h3>${stats.rating}</h3>
                            <p>Rating</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-warning text-white">
                        <div class="card-body">
                            <h3>${stats.revenue}</h3>
                            <p>Revenue</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
  }

  // Common methods
  async handleProfileUpdate(e) {
    e.preventDefault();
    const formData = new FormData(e.target);

    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: this.authManager.getAuthHeaders(),
        body: JSON.stringify(Object.fromEntries(formData)),
      });

      const data = await response.json();

      if (data.status === "success") {
        this.authManager.showAlert("Profile updated successfully!", "success");
        this.authManager.currentUser = data.data.user;
        this.authManager.updateUI();
      } else {
        this.authManager.showAlert(data.message, "error");
      }
    } catch (error) {
      console.error("Profile update error:", error);
      this.authManager.showAlert("Profile update failed.", "error");
    }
  }
}

// Initialize dashboard when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  if (document.querySelector(".dashboard-page")) {
    window.dashboardManager = new DashboardManager();
  }
});
