class AdminDashboard extends DashboardCommon {
  constructor() {
    super();
    this.charts = {};
    this.init();
  }

  async init() {
    if (!this.checkAuth()) return;

    this.initProfileDropdown();
    this.initSidebarNavigation();
    await this.loadAdminData();
    this.setupEventListeners();
    this.initializeCharts();
  }

  async loadAdminData() {
    // Load dashboard stats
    const statsData = await this.apiCall("/dashboard/admin/stats");
    if (statsData) {
      this.updateDashboardStats(statsData.data);
    }

    // Load recent customers
    const customersData = await this.apiCall(
      "/dashboard/admin/recent-customers"
    );
    if (customersData) {
      this.updateRecentCustomers(customersData.data);
    }

    // Load pending applications
    const applicationsData = await this.apiCall(
      "/dashboard/admin/pending-applications"
    );
    if (applicationsData) {
      this.updatePendingApplications(applicationsData.data);
    }

    // Load active subscriptions
    const subscriptionsData = await this.apiCall(
      "/dashboard/admin/active-subscriptions"
    );
    if (subscriptionsData) {
      this.updateActiveSubscriptions(subscriptionsData.data);
    }

    // Load recent transactions
    const transactionsData = await this.apiCall(
      "/dashboard/admin/recent-transactions"
    );
    if (transactionsData) {
      this.updateRecentTransactions(transactionsData.data);
    }
  }

  updateDashboardStats(stats) {
    // Update the 6 main dashboard cards
    const statCards = {
      totalCustomers: {
        element: ".card-icon.customers",
        value: stats.totalCustomers || 1248,
      },
      activeCooks: {
        element: ".card-icon.cooks",
        value: stats.activeCooks || 86,
      },
      activeSubscriptions: {
        element: ".card-icon.subscriptions",
        value: stats.activeSubscriptions || 942,
      },
      revenue: {
        element: ".card-icon.revenue",
        value: this.formatCompactCurrency(stats.revenueThisMonth || 420000),
      },
      pendingApplications: {
        element: ".card-icon.applications",
        value: stats.pendingApplications || 12,
      },
      totalOrders: {
        element: ".card-icon.orders",
        value: stats.totalOrdersToday || 2847,
      },
    };

    Object.entries(statCards).forEach(([key, config]) => {
      const cardElement = document.querySelector(config.element);
      if (cardElement) {
        const cardValue = cardElement
          .closest(".dashboard-card")
          .querySelector(".card-value");
        if (cardValue) {
          cardValue.textContent = config.value;
        }
      }
    });

    // Update payment summary cards
    const paymentStats = {
      totalRevenue: stats.totalRevenue || 420000,
      cookPayouts: stats.cookPayouts || 310000,
      platformEarnings: stats.platformEarnings || 110000,
      successRate: stats.successRate || 98.2,
    };

    // Update payment cards if payments section is visible
    const paymentCards = document.querySelectorAll("#payments .dashboard-card");
    if (paymentCards.length >= 4) {
      paymentCards[0].querySelector(".card-value").textContent =
        this.formatCompactCurrency(paymentStats.totalRevenue);
      paymentCards[1].querySelector(".card-value").textContent =
        this.formatCompactCurrency(paymentStats.cookPayouts);
      paymentCards[2].querySelector(".card-value").textContent =
        this.formatCompactCurrency(paymentStats.platformEarnings);
      paymentCards[3].querySelector(".card-value").textContent =
        paymentStats.successRate + "%";
    }
  }

  updateRecentCustomers(customers) {
    const tbody = document.querySelector("#dashboard table tbody");
    if (!tbody) return;

    const defaultCustomers = [
      { name: "Rajesh Kumar", email: "rajesh@example.com", status: "active" },
      { name: "Priya Sharma", email: "priya@example.com", status: "active" },
      { name: "Anil Patel", email: "anil@example.com", status: "inactive" },
    ];

    const customersToShow = customers || defaultCustomers;

    tbody.innerHTML = customersToShow
      .map(
        (customer) => `
            <tr>
                <td>${customer.name}</td>
                <td>${customer.email}</td>
                <td>
                    <span class="status-badge status-${customer.status}">
                        ${
                          customer.status.charAt(0).toUpperCase() +
                          customer.status.slice(1)
                        }
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="adminDashboard.editCustomer('${
                      customer.id || customer.email
                    }')">
                        Edit
                    </button>
                </td>
            </tr>
        `
      )
      .join("");
  }

  updatePendingApplications(applications) {
    const tbody = document.querySelectorAll("#dashboard table tbody")[1];
    if (!tbody) return;

    const defaultApplications = [
      {
        name: "Sunita Reddy",
        cuisine: "South Indian",
        appliedOn: "15 May 2025",
      },
      {
        name: "Vikram Singh",
        cuisine: "North Indian",
        appliedOn: "14 May 2025",
      },
      { name: "Meera Joshi", cuisine: "Continental", appliedOn: "14 May 2025" },
    ];

    const appsToShow = applications || defaultApplications;

    tbody.innerHTML = appsToShow
      .map(
        (app) => `
            <tr>
                <td>${app.name}</td>
                <td>${app.cuisine}</td>
                <td>${app.appliedOn}</td>
                <td>
                    <button class="btn btn-sm btn-success" onclick="adminDashboard.approveApplication('${
                      app.id || app.name
                    }')">
                        Approve
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="adminDashboard.rejectApplication('${
                      app.id || app.name
                    }')">
                        Reject
                    </button>
                </td>
            </tr>
        `
      )
      .join("");
  }

  updateActiveSubscriptions(subscriptions) {
    const tbody = document.querySelector("#subscriptions table tbody");
    if (!tbody) return;

    const defaultSubscriptions = [
      {
        customerName: "Rajesh Kumar",
        planType: "Monthly",
        startDate: "10 May 2025",
        endDate: "10 Jun 2025",
        mealFrequency: "2 meals/day",
        status: "active",
      },
      {
        customerName: "Priya Sharma",
        planType: "Weekly",
        startDate: "12 May 2025",
        endDate: "19 May 2025",
        mealFrequency: "1 meal/day",
        status: "active",
      },
      {
        customerName: "Anil Patel",
        planType: "Daily",
        startDate: "15 May 2025",
        endDate: "15 May 2025",
        mealFrequency: "2 meals/day",
        status: "active",
      },
    ];

    const subsToShow = subscriptions || defaultSubscriptions;

    tbody.innerHTML = subsToShow
      .map(
        (sub) => `
            <tr>
                <td>${sub.customerName}</td>
                <td><span class="plan-badge">${sub.planType}</span></td>
                <td>${sub.startDate}</td>
                <td>${sub.endDate}</td>
                <td>${sub.mealFrequency}</td>
                <td>
                    <span class="status-badge status-${sub.status}">
                        ${
                          sub.status.charAt(0).toUpperCase() +
                          sub.status.slice(1)
                        }
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-warning" onclick="adminDashboard.pauseSubscription('${
                      sub.id
                    }')">
                        Pause
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="adminDashboard.cancelSubscription('${
                      sub.id
                    }')">
                        Cancel
                    </button>
                </td>
            </tr>
        `
      )
      .join("");
  }

  updateRecentTransactions(transactions) {
    const tbody = document.querySelector("#payments table tbody");
    if (!tbody) return;

    const defaultTransactions = [
      {
        date: "15 May 2025",
        customer: "Rajesh Kumar",
        cook: "Chef Priya",
        amount: 3600,
        type: "Subscription",
        status: "completed",
      },
      {
        date: "15 May 2025",
        customer: "Priya Sharma",
        cook: "Chef Priya",
        amount: 700,
        type: "Subscription",
        status: "completed",
      },
      {
        date: "14 May 2025",
        customer: "Anil Patel",
        cook: "Chef Ramesh",
        amount: 200,
        type: "One-time",
        status: "completed",
      },
    ];

    const txToShow = transactions || defaultTransactions;

    tbody.innerHTML = txToShow
      .map(
        (tx) => `
            <tr>
                <td>${tx.date}</td>
                <td>${tx.customer}</td>
                <td>${tx.cook}</td>
                <td>${this.formatCurrency(tx.amount)}</td>
                <td>${tx.type}</td>
                <td>
                    <span class="status-badge status-${tx.status}">
                        ${
                          tx.status.charAt(0).toUpperCase() + tx.status.slice(1)
                        }
                    </span>
                </td>
            </tr>
        `
      )
      .join("");
  }

  initializeCharts() {
    // Revenue Chart
    const revenueCtx = document.getElementById("revenueChart");
    if (revenueCtx) {
      this.charts.revenue = new Chart(revenueCtx, {
        type: "line",
        data: {
          labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
          datasets: [
            {
              label: "Monthly Revenue (₹)",
              data: [320000, 350000, 380000, 400000, 420000, 450000],
              borderColor: "#2E8B57",
              backgroundColor: "rgba(46, 139, 87, 0.1)",
              borderWidth: 2,
              fill: true,
              tension: 0.4,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function (value) {
                  return "₹" + value / 1000 + "K";
                },
              },
            },
          },
        },
      });
    }

    // Subscription Chart
    const subscriptionCtx = document.getElementById("subscriptionChart");
    if (subscriptionCtx) {
      this.charts.subscription = new Chart(subscriptionCtx, {
        type: "doughnut",
        data: {
          labels: ["Daily", "Weekly", "Monthly"],
          datasets: [
            {
              data: [180, 260, 502],
              backgroundColor: ["#2E8B57", "#4299E1", "#9F7AEA"],
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "bottom",
            },
          },
        },
      });
    }

    // Additional charts for reports section
    const subscribersCtx = document.getElementById("subscribersChart");
    if (subscribersCtx) {
      this.charts.subscribers = new Chart(subscribersCtx, {
        type: "bar",
        data: {
          labels: ["Jan", "Feb", "Mar", "Apr", "May"],
          datasets: [
            {
              label: "Total Subscribers",
              data: [650, 720, 810, 890, 942],
              backgroundColor: "#2E8B57",
              borderColor: "#2E8B57",
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
            },
          },
        },
      });
    }

    const cookActivityCtx = document.getElementById("cookActivityChart");
    if (cookActivityCtx) {
      this.charts.cookActivity = new Chart(cookActivityCtx, {
        type: "bar",
        data: {
          labels: [
            "Chef Priya",
            "Chef Ramesh",
            "Chef Sunita",
            "Chef Vikram",
            "Others",
          ],
          datasets: [
            {
              label: "Monthly Earnings (₹)",
              data: [124500, 98000, 76000, 54000, 67500],
              backgroundColor: "#FF6B35",
              borderColor: "#FF6B35",
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function (value) {
                  return "₹" + value / 1000 + "K";
                },
              },
            },
          },
        },
      });
    }
  }

  setupEventListeners() {
    // Search functionality
    const searchInputs = document.querySelectorAll('input[type="text"]');
    searchInputs.forEach((input) => {
      input.addEventListener("input", (e) => {
        this.handleSearch(e.target.value, e.target.closest("table"));
      });
    });

    // Filter buttons
    const filterButtons = document.querySelectorAll(".btn-group .btn");
    filterButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        // Remove active class from all buttons in group
        e.target
          .closest(".btn-group")
          .querySelectorAll(".btn")
          .forEach((b) => {
            b.classList.remove("active");
          });
        // Add active class to clicked button
        e.target.classList.add("active");

        // Apply filter
        this.handleFilter(
          e.target.textContent.trim(),
          e.target.closest("table")
        );
      });
    });

    // Export buttons
    const exportButtons = document.querySelectorAll(
      'button:contains("Export")'
    );
    exportButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        this.exportData(btn.textContent.includes("CSV") ? "csv" : "pdf");
      });
    });

    // Form submissions
    const forms = document.querySelectorAll("form");
    forms.forEach((form) => {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleFormSubmit(e.target);
      });
    });
  }

  handleSearch(query, table) {
    if (!table) return;

    const rows = table.querySelectorAll("tbody tr");
    rows.forEach((row) => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(query.toLowerCase()) ? "" : "none";
    });
  }

  handleFilter(filter, table) {
    if (!table) return;

    const rows = table.querySelectorAll("tbody tr");
    rows.forEach((row) => {
      if (filter === "All") {
        row.style.display = "";
      } else {
        const status = row
          .querySelector(".status-badge")
          ?.textContent.toLowerCase();
        row.style.display = status === filter.toLowerCase() ? "" : "none";
      }
    });
  }

  // Action methods for buttons
  async approveApplication(applicationId) {
    const result = await this.apiCall(
      `/admin/applications/${applicationId}/approve`,
      {
        method: "POST",
      }
    );

    if (result && result.status === "success") {
      this.showAlert("Application approved successfully", "success");
      this.loadAdminData(); // Refresh data
    }
  }

  async rejectApplication(applicationId) {
    const result = await this.apiCall(
      `/admin/applications/${applicationId}/reject`,
      {
        method: "POST",
      }
    );

    if (result && result.status === "success") {
      this.showAlert("Application rejected", "success");
      this.loadAdminData(); // Refresh data
    }
  }

  async pauseSubscription(subscriptionId) {
    if (confirm("Are you sure you want to pause this subscription?")) {
      const result = await this.apiCall(
        `/admin/subscriptions/${subscriptionId}/pause`,
        {
          method: "POST",
        }
      );

      if (result && result.status === "success") {
        this.showAlert("Subscription paused", "success");
        this.loadAdminData();
      }
    }
  }

  async cancelSubscription(subscriptionId) {
    if (confirm("Are you sure you want to cancel this subscription?")) {
      const result = await this.apiCall(
        `/admin/subscriptions/${subscriptionId}/cancel`,
        {
          method: "POST",
        }
      );

      if (result && result.status === "success") {
        this.showAlert("Subscription cancelled", "success");
        this.loadAdminData();
      }
    }
  }

  editCustomer(customerId) {
    this.showAlert(`Editing customer: ${customerId}`, "info");
    // In a real app, you would open a modal or navigate to edit page
  }

  exportData(format) {
    this.showAlert(`Exporting data as ${format.toUpperCase()}...`, "info");
    // In a real app, you would generate and download the file
  }

  async handleFormSubmit(form) {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    // Determine which form was submitted
    if (form.querySelector('input[value="Admin User"]')) {
      // Profile form
      const result = await this.apiCall("/admin/profile", {
        method: "PUT",
        body: JSON.stringify(data),
      });

      if (result && result.status === "success") {
        this.showAlert("Profile updated successfully", "success");
      }
    } else if (form.querySelector('input[name="platformCommission"]')) {
      // Settings form
      const result = await this.apiCall("/admin/settings", {
        method: "PUT",
        body: JSON.stringify(data),
      });

      if (result && result.status === "success") {
        this.showAlert("Settings saved successfully", "success");
      }
    }
  }
}

// Initialize admin dashboard when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.adminDashboard = new AdminDashboard();
});
