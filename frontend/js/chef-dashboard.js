class ChefDashboard extends DashboardCommon {
  constructor() {
    super();
    this.charts = {};
    this.init();
  }

  async init() {
    if (!this.checkAuth()) return;

    this.initProfileDropdown();
    this.initSidebarNavigation();
    await this.loadChefData();
    this.setupEventListeners();
    this.initializeCharts();
  }

  async loadChefData() {
    // Load dashboard stats
    const statsData = await this.apiCall("/dashboard/chef/stats");
    if (statsData) {
      this.updateDashboardStats(statsData.data);
    }

    // Load recent subscribers
    const subscribersData = await this.apiCall(
      "/dashboard/chef/recent-subscribers"
    );
    if (subscribersData) {
      this.updateRecentSubscribers(subscribersData.data);
    }

    // Load active subscribers
    const activeSubsData = await this.apiCall(
      "/dashboard/chef/active-subscribers"
    );
    if (activeSubsData) {
      this.updateActiveSubscribers(activeSubsData.data);
    }

    // Load meal prep data
    const mealPrepData = await this.apiCall("/dashboard/chef/meal-prep");
    if (mealPrepData) {
      this.updateMealPrepData(mealPrepData.data);
    }

    // Load earnings data
    const earningsData = await this.apiCall("/dashboard/chef/earnings");
    if (earningsData) {
      this.updateEarningsData(earningsData.data);
    }

    // Load feedback data
    const feedbackData = await this.apiCall("/dashboard/chef/feedback");
    if (feedbackData) {
      this.updateFeedbackData(feedbackData.data);
    }
  }

  updateDashboardStats(stats) {
    // Update the 4 main dashboard cards
    const statCards = {
      subscribers: {
        element: ".card-icon.subscribers",
        value: stats.activeSubscribers || 42,
        activity: stats.subscriberActivity || "high",
      },
      meals: {
        element: ".card-icon.meals",
        value: stats.mealsToday || 68,
        activity: stats.mealActivity || "high",
      },
      earnings: {
        element: ".card-icon.earnings",
        value: this.formatCurrency(stats.earningsThisMonth || 12450),
        activity: stats.earningsActivity || "medium",
      },
      delivery: {
        element: ".card-icon.delivery",
        value: stats.nextDelivery || "Tomorrow",
      },
    };

    Object.entries(statCards).forEach(([key, config]) => {
      const cardElement = document.querySelector(config.element);
      if (cardElement) {
        const dashboardCard = cardElement.closest(".dashboard-card");
        const cardValue = dashboardCard.querySelector(".card-value");

        if (cardValue) {
          cardValue.textContent = config.value;
        }

        // Update activity indicator
        if (config.activity) {
          dashboardCard.classList.remove(
            "activity-high",
            "activity-medium",
            "activity-low"
          );
          dashboardCard.classList.add(`activity-${config.activity}`);
        }
      }
    });

    // Update meal prep summary
    this.updateMealPrepSummary(stats.mealPrepSummary);
  }

  updateMealPrepSummary(mealPrep) {
    const defaultPrep = {
      lunch: 38,
      dinner: 30,
    };

    const prepData = mealPrep || defaultPrep;

    const lunchCount = document.querySelector(".meal-type-lunch .meal-count");
    const dinnerCount = document.querySelector(".meal-type-dinner .meal-count");

    if (lunchCount) lunchCount.textContent = prepData.lunch;
    if (dinnerCount) dinnerCount.textContent = prepData.dinner;
  }

  updateRecentSubscribers(subscribers) {
    const tbody = document.querySelector("#dashboard table tbody");
    if (!tbody) return;

    const defaultSubscribers = [
      {
        name: "Rajesh Kumar",
        plan: "Monthly",
        mealsPerDay: "2 (Lunch + Dinner)",
        startDate: "10 May 2025",
        status: "active",
      },
      {
        name: "Priya Sharma",
        plan: "Weekly",
        mealsPerDay: "1 (Lunch Only)",
        startDate: "12 May 2025",
        status: "active",
      },
      {
        name: "Anil Patel",
        plan: "Daily",
        mealsPerDay: "2 (Lunch + Dinner)",
        startDate: "15 May 2025",
        status: "active",
      },
    ];

    const subsToShow = subscribers || defaultSubscribers;

    tbody.innerHTML = subsToShow
      .map(
        (sub) => `
            <tr>
                <td>
                    <div class="d-flex align-items-center">
                        <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(
                          sub.name
                        )}&background=2E8B57&color=fff" 
                             alt="Avatar" 
                             class="rounded-circle me-2" 
                             width="32" 
                             height="32" />
                        ${sub.name}
                    </div>
                </td>
                <td><span class="plan-badge">${sub.plan}</span></td>
                <td>${sub.mealsPerDay}</td>
                <td>${sub.startDate}</td>
                <td>
                    <span class="status-badge status-${sub.status}">
                        ${
                          sub.status.charAt(0).toUpperCase() +
                          sub.status.slice(1)
                        }
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="chefDashboard.viewSubscriberDetails('${
                      sub.id || sub.name
                    }')">
                        Details
                    </button>
                </td>
            </tr>
        `
      )
      .join("");
  }

  updateActiveSubscribers(subscribers) {
    const tbody = document.querySelector("#subscribers table tbody");
    if (!tbody) return;

    const defaultSubscribers = [
      {
        name: "Rajesh Kumar",
        plan: "Monthly",
        mealsPerDay: "2 (Lunch + Dinner)",
        address: "123, MG Road, Mumbai",
        dates: "10 May - 10 Jun 2025",
        instructions: "No onions, less spicy",
        status: "active",
      },
      {
        name: "Priya Sharma",
        plan: "Weekly",
        mealsPerDay: "1 (Lunch Only)",
        address: "456, Andheri East, Mumbai",
        dates: "12 May - 19 May 2025",
        instructions: "Jain food, no root vegetables",
        status: "active",
      },
      {
        name: "Anil Patel",
        plan: "Daily",
        mealsPerDay: "2 (Lunch + Dinner)",
        address: "789, Bandra West, Mumbai",
        dates: "15 May - 15 May 2025",
        instructions: "Extra gravy with meals",
        status: "active",
      },
      {
        name: "Sunita Reddy",
        plan: "Monthly",
        mealsPerDay: "1 (Dinner Only)",
        address: "321, Powai, Mumbai",
        dates: "01 May - 01 Jun 2025",
        instructions: "No sugar, diabetic diet",
        status: "paused",
      },
    ];

    const subsToShow = subscribers || defaultSubscribers;

    tbody.innerHTML = subsToShow
      .map(
        (sub) => `
            <tr>
                <td>
                    <div class="d-flex align-items-center">
                        <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(
                          sub.name
                        )}&background=2E8B57&color=fff" 
                             alt="Avatar" 
                             class="rounded-circle me-2" 
                             width="32" 
                             height="32" />
                        ${sub.name}
                    </div>
                </td>
                <td><span class="plan-badge">${sub.plan}</span></td>
                <td>${sub.mealsPerDay}</td>
                <td>${sub.address}</td>
                <td>${sub.dates}</td>
                <td>${sub.instructions}</td>
                <td>
                    <span class="status-badge status-${sub.status}">
                        ${
                          sub.status.charAt(0).toUpperCase() +
                          sub.status.slice(1)
                        }
                    </span>
                </td>
            </tr>
        `
      )
      .join("");
  }

  updateMealPrepData(mealData) {
    const tbody = document.querySelector("#meal-prep table tbody");
    if (!tbody) return;

    const defaultMealData = [
      {
        name: "Rajesh Kumar",
        lunch: { hasMeal: true, type: "North Indian Thali" },
        dinner: { hasMeal: true, type: "Special Thali" },
        instructions: "No onions, less spicy",
        deliveryTime: "12:30 PM / 7:30 PM",
      },
      {
        name: "Priya Sharma",
        lunch: { hasMeal: true, type: "South Indian Combo" },
        dinner: { hasMeal: false },
        instructions: "Jain food, no root vegetables",
        deliveryTime: "1:00 PM",
      },
      {
        name: "Anil Patel",
        lunch: { hasMeal: true, type: "Special Thali" },
        dinner: { hasMeal: true, type: "North Indian Thali" },
        instructions: "Extra gravy with meals",
        deliveryTime: "1:15 PM / 8:00 PM",
      },
      {
        name: "Sunita Reddy",
        lunch: { hasMeal: false },
        dinner: { hasMeal: true, type: "Diet Meal Plan" },
        instructions: "No sugar, diabetic diet",
        deliveryTime: "7:00 PM",
      },
    ];

    const mealsToShow = mealData || defaultMealData;

    tbody.innerHTML = mealsToShow
      .map(
        (meal) => `
            <tr>
                <td>${meal.name}</td>
                <td>
                    ${
                      meal.lunch.hasMeal
                        ? `<i class="fas fa-check text-success"></i> ${meal.lunch.type}`
                        : '<i class="fas fa-times text-muted"></i>'
                    }
                </td>
                <td>
                    ${
                      meal.dinner.hasMeal
                        ? `<i class="fas fa-check text-success"></i> ${meal.dinner.type}`
                        : '<i class="fas fa-times text-muted"></i>'
                    }
                </td>
                <td>${meal.instructions}</td>
                <td>${meal.deliveryTime}</td>
            </tr>
        `
      )
      .join("");
  }

  updateEarningsData(earnings) {
    // Update earnings cards
    const earningsCards = document.querySelectorAll(
      "#earnings .dashboard-card .card-value"
    );
    if (earningsCards.length >= 4) {
      const defaultEarnings = {
        today: 2450,
        week: 8750,
        month: 12450,
        total: 184250,
      };

      const earningsData = earnings || defaultEarnings;

      earningsCards[0].textContent = this.formatCurrency(earningsData.today);
      earningsCards[1].textContent = this.formatCurrency(earningsData.week);
      earningsCards[2].textContent = this.formatCurrency(earningsData.month);
      earningsCards[3].textContent = this.formatCurrency(earningsData.total);
    }

    // Update payments table
    const tbody = document.querySelector("#earnings table tbody");
    if (!tbody) return;

    const defaultPayments = [
      {
        date: "15 May 2025",
        customer: "Rajesh Kumar",
        plan: "Monthly",
        amount: 3600,
        status: "paid",
      },
      {
        date: "15 May 2025",
        customer: "Priya Sharma",
        plan: "Weekly",
        amount: 700,
        status: "paid",
      },
      {
        date: "14 May 2025",
        customer: "Anil Patel",
        plan: "Daily",
        amount: 200,
        status: "paid",
      },
      {
        date: "14 May 2025",
        customer: "Sunita Reddy",
        plan: "Monthly",
        amount: 1800,
        status: "paid",
      },
    ];

    const paymentsToShow = earnings?.recentPayments || defaultPayments;

    tbody.innerHTML = paymentsToShow
      .map(
        (payment) => `
            <tr>
                <td>${payment.date}</td>
                <td>${payment.customer}</td>
                <td>${payment.plan}</td>
                <td>${this.formatCurrency(payment.amount)}</td>
                <td><span class="status-badge status-${payment.status}">${
          payment.status.charAt(0).toUpperCase() + payment.status.slice(1)
        }</span></td>
            </tr>
        `
      )
      .join("");
  }

  updateFeedbackData(feedback) {
    // Update feedback cards
    const feedbackCards = document.querySelectorAll(
      "#feedback .dashboard-card .card-value"
    );
    if (feedbackCards.length >= 4) {
      const defaultFeedback = {
        rating: 4.7,
        totalReviews: 142,
        positiveFeedback: 96,
        thisMonth: 12,
      };

      const feedbackData = feedback || defaultFeedback;

      feedbackCards[0].textContent = feedbackData.rating;
      feedbackCards[1].textContent = feedbackData.totalReviews;
      feedbackCards[2].textContent = feedbackData.positiveFeedback + "%";
      feedbackCards[3].textContent = feedbackData.thisMonth;
    }

    // Update rating stars
    const ratingElement = document.querySelector(
      "#feedback .dashboard-card .rating"
    );
    if (ratingElement) {
      ratingElement.innerHTML = this.generateStarRating(
        feedback?.rating || 4.7
      );
    }

    // Update reviews
    this.updateReviews(feedback?.reviews);
  }

  updateReviews(reviews) {
    const reviewsContainer = document.querySelector("#feedback .table-card");
    if (!reviewsContainer) return;

    const defaultReviews = [
      {
        name: "Rajesh Kumar",
        date: "12 May 2025",
        rating: 5,
        comment:
          "Excellent food! The North Indian Thali was delicious and homely. Will definitely continue my subscription.",
      },
      {
        name: "Priya Sharma",
        date: "11 May 2025",
        rating: 4.5,
        comment:
          "Loved the South Indian Combo. The idlis were soft and the sambar had perfect flavor. Appreciate the Jain options!",
      },
      {
        name: "Anil Patel",
        date: "10 May 2025",
        rating: 5,
        comment:
          "The Special Thali was amazing! Butter chicken was perfectly cooked. Highly recommended for working professionals.",
      },
    ];

    const reviewsToShow = reviews || defaultReviews;

    // Remove existing review cards (keep the table-card-header)
    const existingReviewCards =
      reviewsContainer.querySelectorAll(".review-card");
    existingReviewCards.forEach((card) => card.remove());

    // Add new review cards
    reviewsToShow.forEach((review) => {
      const reviewCard = document.createElement("div");
      reviewCard.className = "review-card";
      reviewCard.innerHTML = `
                <div class="review-header">
                    <div class="reviewer-name">${review.name}</div>
                    <div class="review-date">${review.date}</div>
                </div>
                <div class="rating">
                    ${this.generateStarRating(review.rating)}
                </div>
                <p>${review.comment}</p>
            `;
      reviewsContainer.appendChild(reviewCard);
    });
  }

  generateStarRating(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    let stars = "";

    // Full stars
    for (let i = 0; i < fullStars; i++) {
      stars += '<i class="fas fa-star"></i>';
    }

    // Half star
    if (hasHalfStar) {
      stars += '<i class="fas fa-star-half-alt"></i>';
    }

    // Empty stars
    for (let i = 0; i < emptyStars; i++) {
      stars += '<i class="far fa-star"></i>';
    }

    return stars;
  }

  initializeCharts() {
    // Earnings Chart
    const earningsCtx = document.getElementById("earningsChart");
    if (earningsCtx) {
      this.charts.earnings = new Chart(earningsCtx, {
        type: "bar",
        data: {
          labels: ["Jan", "Feb", "Mar", "Apr", "May"],
          datasets: [
            {
              label: "Monthly Earnings (₹)",
              data: [22000, 25000, 28000, 30000, 12450],
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
              ticks: {
                callback: function (value) {
                  return "₹" + value;
                },
              },
            },
          },
        },
      });
    }
  }

  setupEventListeners() {
    // Export buttons
    const exportButtons = document.querySelectorAll(
      'button:contains("Export")'
    );
    exportButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const exportType = btn.textContent.includes("Schedule")
          ? "schedule"
          : "report";
        this.exportData(exportType);
      });
    });

    // Filter buttons
    const filterButtons = document.querySelectorAll(".btn-group .btn");
    filterButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();

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

    // Form submissions
    const forms = document.querySelectorAll("#settings form");
    forms.forEach((form) => {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleFormSubmit(e.target);
      });
    });

    // Toggle switch
    const toggleSwitch = document.querySelector(
      "#settings .toggle-switch input"
    );
    if (toggleSwitch) {
      toggleSwitch.addEventListener("change", (e) => {
        this.updateSubscriptionAcceptance(e.target.checked);
      });
    }
  }

  handleFilter(filter, table) {
    if (!table) return;

    const rows = table.querySelectorAll("tbody tr");
    const filterLower = filter.toLowerCase();

    rows.forEach((row) => {
      if (filterLower === "all" || filterLower === "today") {
        row.style.display = "";
      } else if (filterLower === "lunch") {
        const hasLunch = row.cells[1].querySelector(".fa-check");
        row.style.display = hasLunch ? "" : "none";
      } else if (filterLower === "dinner") {
        const hasDinner = row.cells[2].querySelector(".fa-check");
        row.style.display = hasDinner ? "" : "none";
      } else {
        // Filter by plan type
        const planType = row.cells[1]?.textContent?.toLowerCase();
        row.style.display = planType?.includes(filterLower) ? "" : "none";
      }
    });
  }

  // Action methods
  viewSubscriberDetails(subscriberId) {
    this.showAlert(`Viewing details for: ${subscriberId}`, "info");
    // In real app, open modal or navigate to details page
  }

  exportData(type) {
    this.showAlert(`Exporting ${type}...`, "info");
    // In real app, generate and download file
  }

  async updateSubscriptionAcceptance(isAccepting) {
    const result = await this.apiCall("/chef/subscription-settings", {
      method: "PUT",
      body: JSON.stringify({ acceptNewSubscriptions: isAccepting }),
    });

    if (result && result.status === "success") {
      this.showAlert(
        `Successfully ${
          isAccepting ? "enabled" : "disabled"
        } new subscription acceptance`,
        "success"
      );
    }
  }

  async handleFormSubmit(form) {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    let endpoint = "";
    let successMessage = "";

    if (form.querySelector('input[value="Chef Priya"]')) {
      endpoint = "/chef/profile";
      successMessage = "Profile updated successfully";
    } else if (form.querySelector('input[value="Priya\'s Homely Kitchen"]')) {
      endpoint = "/chef/kitchen-info";
      successMessage = "Kitchen information updated successfully";
    } else if (form.querySelector('select[name="maximumSubscribers"]')) {
      endpoint = "/chef/subscription-settings";
      successMessage = "Subscription settings updated";
    } else if (form.querySelector('input[value="Priya Sharma"]')) {
      endpoint = "/chef/bank-info";
      successMessage = "Bank information updated successfully";
    }

    if (endpoint) {
      const result = await this.apiCall(endpoint, {
        method: "PUT",
        body: JSON.stringify(data),
      });

      if (result && result.status === "success") {
        this.showAlert(successMessage, "success");
      }
    }
  }
}

// Initialize chef dashboard when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.chefDashboard = new ChefDashboard();
});
