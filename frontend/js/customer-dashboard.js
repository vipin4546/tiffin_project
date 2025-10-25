class CustomerDashboard extends DashboardCommon {
  constructor() {
    super();
    this.init();
  }

  async init() {
    if (!this.checkAuth()) return;

    this.initProfileDropdown();
    this.initSidebarNavigation();
    await this.loadCustomerData();
    this.setupEventListeners();
    this.setupRatingSystem();
  }

  async loadCustomerData() {
    // Load dashboard stats
    const statsData = await this.apiCall("/dashboard/customer/stats");
    if (statsData) {
      this.updateDashboardStats(statsData.data);
    }

    // Load today's meals
    const todayMealsData = await this.apiCall(
      "/dashboard/customer/today-meals"
    );
    if (todayMealsData) {
      this.updateTodayMeals(todayMealsData.data);
    }

    // Load active subscriptions
    const subscriptionsData = await this.apiCall(
      "/dashboard/customer/active-subscriptions"
    );
    if (subscriptionsData) {
      this.updateActiveSubscriptions(subscriptionsData.data);
    }

    // Load upcoming meals
    const upcomingMealsData = await this.apiCall(
      "/dashboard/customer/upcoming-meals"
    );
    if (upcomingMealsData) {
      this.updateUpcomingMeals(upcomingMealsData.data);
    }

    // Load previous meals
    const previousMealsData = await this.apiCall(
      "/dashboard/customer/previous-meals"
    );
    if (previousMealsData) {
      this.updatePreviousMeals(previousMealsData.data);
    }

    // Load payment data
    const paymentsData = await this.apiCall("/dashboard/customer/payments");
    if (paymentsData) {
      this.updatePaymentsData(paymentsData.data);
    }
  }

  updateDashboardStats(stats) {
    // Update the 4 main dashboard cards
    const statCards = {
      subscriptions: {
        element: ".card-icon.subscriptions",
        value: stats.activeSubscriptions || 2,
      },
      meals: {
        element: ".card-icon.meals",
        value: stats.mealsToday || 3,
      },
      delivery: {
        element: ".card-icon.delivery",
        value: stats.nextDelivery || "12:30 PM",
      },
      billing: {
        element: ".card-icon.billing",
        value: this.formatCurrency(stats.nextPayment || 3600),
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
    const paymentCards = document.querySelectorAll(
      "#payments .dashboard-card .card-value"
    );
    if (paymentCards.length >= 3) {
      paymentCards[0].textContent = this.formatCurrency(
        stats.nextPayment || 3600
      );
      paymentCards[1].textContent = stats.dueDate || "10 June";
      paymentCards[2].textContent = this.formatCurrency(
        stats.totalPaid || 7200
      );
    }
  }

  updateTodayMeals(meals) {
    const container = document.querySelector("#dashboard .table-card");
    if (!container) return;

    const defaultMeals = [
      {
        type: "Lunch",
        time: "12:30 PM Delivery",
        items: [
          "North Indian Thali - Roti, Dal Makhani, Paneer Butter Masala, Rice, Salad",
        ],
        instructions: "Less spicy, no onions",
      },
      {
        type: "Dinner",
        time: "7:30 PM Delivery",
        items: ["Special Thali - Butter Chicken, Naan, Biryani, Raita, Kheer"],
        instructions: "Extra gravy",
      },
    ];

    const mealsToShow = meals || defaultMeals;

    // Find the meal cards container (after the table-card-header)
    const existingMealCards = container.querySelectorAll(".meal-card");
    existingMealCards.forEach((card) => card.remove());

    // Add new meal cards
    mealsToShow.forEach((meal) => {
      const mealCard = document.createElement("div");
      mealCard.className = "meal-card upcoming";
      mealCard.innerHTML = `
                <div class="meal-date">${meal.type} • ${meal.time}</div>
                <div class="meal-items">
                    ${meal.items
                      .map(
                        (item) => `
                        <div class="meal-item">
                            <strong>${item.split(" - ")[0]}</strong> - ${
                          item.split(" - ")[1]
                        }
                        </div>
                    `
                      )
                      .join("")}
                </div>
                <div class="text-muted small">
                    Special Instructions: ${meal.instructions}
                </div>
            `;
      container.appendChild(mealCard);
    });
  }

  updateActiveSubscriptions(subscriptions) {
    // Update dashboard preview
    const previewContainer = document.querySelector(
      "#dashboard .table-card:last-child"
    );
    if (previewContainer) {
      const existingSubs =
        previewContainer.querySelectorAll(".subscription-card");
      existingSubs.forEach((sub) => sub.remove());

      const defaultSubs = [
        {
          title: "Daily Lunch & Dinner Plan",
          details: "2 meals per day • Started: 10 May 2025",
          address: "123, MG Road, Mumbai",
        },
        {
          title: "Weekly Breakfast Plan",
          details: "1 meal per day • Started: 12 May 2025",
          address: "123, MG Road, Mumbai",
        },
      ];

      const subsToShow = subscriptions?.preview || defaultSubs;

      subsToShow.forEach((sub) => {
        const subCard = document.createElement("div");
        subCard.className = "subscription-card";
        subCard.innerHTML = `
                    <div class="subscription-header">
                        <div>
                            <div class="subscription-title">${sub.title}</div>
                            <div class="subscription-details">${sub.details}</div>
                        </div>
                        <div class="subscription-actions">
                            <button class="btn btn-sm btn-outline-primary" onclick="customerDashboard.pauseSubscription('${sub.id}')">Pause</button>
                            <button class="btn btn-sm btn-outline-danger" onclick="customerDashboard.cancelSubscription('${sub.id}')">Cancel</button>
                        </div>
                    </div>
                    <div class="text-muted small">
                        Delivery to: ${sub.address}
                    </div>
                `;
        previewContainer.appendChild(subCard);
      });
    }

    // Update full subscriptions section
    const fullSubsContainer = document.getElementById("subscriptions");
    if (fullSubsContainer) {
      const existingFullSubs =
        fullSubsContainer.querySelectorAll(".subscription-card");
      existingFullSubs.forEach((sub) => sub.remove());

      const defaultFullSubs = [
        {
          id: "sub1",
          title: "Daily Lunch & Dinner Plan",
          plan: "Daily Plan",
          meals: "2 meals per day (Lunch + Dinner)",
          startDate: "10 May 2025",
          nextBilling: "10 June 2025",
          address: "123, MG Road, Mumbai",
          instructions: "Less spicy, no onions",
        },
        {
          id: "sub2",
          title: "Weekly Breakfast Plan",
          plan: "Weekly Plan",
          meals: "1 meal per day (Breakfast)",
          startDate: "12 May 2025",
          nextBilling: "19 May 2025",
          address: "123, MG Road, Mumbai",
          instructions: "No sugar in tea/coffee",
        },
      ];

      const fullSubsToShow = subscriptions?.full || defaultFullSubs;

      fullSubsToShow.forEach((sub) => {
        const subCard = document.createElement("div");
        subCard.className = "subscription-card";
        subCard.innerHTML = `
                    <div class="subscription-header">
                        <div>
                            <div class="subscription-title">${sub.title}</div>
                            <div class="subscription-details">
                                <span class="plan-badge me-2">${sub.plan}</span>
                                <span>${sub.meals}</span>
                            </div>
                        </div>
                        <div class="subscription-actions">
                            <button class="btn btn-sm btn-outline-primary" onclick="customerDashboard.pauseSubscription('${sub.id}')">Pause</button>
                            <button class="btn btn-sm btn-outline-warning" onclick="customerDashboard.modifySubscription('${sub.id}')">Modify</button>
                            <button class="btn btn-sm btn-outline-danger" onclick="customerDashboard.cancelSubscription('${sub.id}')">Cancel</button>
                        </div>
                    </div>
                    <div class="row mt-3">
                        <div class="col-md-6">
                            <div><strong>Start Date:</strong> ${sub.startDate}</div>
                            <div><strong>Next Billing:</strong> ${sub.nextBilling}</div>
                        </div>
                        <div class="col-md-6">
                            <div><strong>Delivery Address:</strong> ${sub.address}</div>
                            <div><strong>Special Instructions:</strong> ${sub.instructions}</div>
                        </div>
                    </div>
                `;
        fullSubsContainer.appendChild(subCard);
      });
    }
  }

  updateUpcomingMeals(meals) {
    const container = document.getElementById("upcoming-meals");
    if (!container) return;

    const defaultMeals = {
      today: [
        {
          type: "Lunch",
          time: "12:30 PM Delivery",
          items: [
            "North Indian Thali - Roti, Dal Makhani, Paneer Butter Masala, Rice, Salad",
          ],
          instructions: "Less spicy, no onions",
        },
        {
          type: "Dinner",
          time: "7:30 PM Delivery",
          items: [
            "Special Thali - Butter Chicken, Naan, Biryani, Raita, Kheer",
          ],
          instructions: "Extra gravy",
        },
      ],
      tomorrow: [
        {
          type: "Breakfast",
          time: "8:00 AM Delivery",
          items: [
            "Poha with Tea - Flattened rice with spices, peanuts, and lemon",
          ],
          instructions: "No sugar in tea",
        },
        {
          type: "Lunch",
          time: "12:30 PM Delivery",
          items: ["South Indian Combo - Idli, Vada, Sambar, Chutney"],
          instructions: "Less spicy, no onions",
        },
        {
          type: "Dinner",
          time: "7:30 PM Delivery",
          items: ["North Indian Thali - Roti, Dal Tadka, Mix Veg, Rice, Salad"],
          instructions: "Extra gravy",
        },
      ],
    };

    const mealsToShow = meals || defaultMeals;

    // Clear existing content except headers and buttons
    const tableCards = container.querySelectorAll(".table-card");
    tableCards.forEach((card, index) => {
      const mealCards = card.querySelectorAll(".meal-card");
      mealCards.forEach((mealCard) => mealCard.remove());
    });

    // Add today's meals
    if (tableCards[0] && mealsToShow.today) {
      mealsToShow.today.forEach((meal) => {
        const mealCard = document.createElement("div");
        mealCard.className = "meal-card upcoming";
        mealCard.innerHTML = this.createMealCardHTML(meal);
        tableCards[0].appendChild(mealCard);
      });
    }

    // Add tomorrow's meals
    if (tableCards[1] && mealsToShow.tomorrow) {
      mealsToShow.tomorrow.forEach((meal) => {
        const mealCard = document.createElement("div");
        mealCard.className = "meal-card upcoming";
        mealCard.innerHTML = this.createMealCardHTML(meal);
        tableCards[1].appendChild(mealCard);
      });
    }
  }

  updatePreviousMeals(meals) {
    const container = document.getElementById("previous-meals");
    if (!container) return;

    const defaultMeals = [
      {
        date: "14 May 2025 • Dinner",
        type: "Delivered at 7:45 PM",
        items: ["Special Thali - Butter Chicken, Naan, Biryani, Raita, Kheer"],
        rating: 5,
        comment:
          "The butter chicken was excellent! Perfectly cooked and flavorful.",
        rated: true,
      },
      {
        date: "14 May 2025 • Lunch",
        type: "Delivered at 12:45 PM",
        items: [
          "North Indian Thali - Roti, Dal Makhani, Paneer Butter Masala, Rice, Salad",
        ],
        rating: 4,
        comment: "Good overall, but the dal was a bit too salty for my taste.",
        rated: true,
      },
      {
        date: "13 May 2025 • Dinner",
        type: "Delivered at 7:30 PM",
        items: ["South Indian Combo - Idli, Vada, Sambar, Chutney"],
        rating: 0,
        rated: false,
      },
    ];

    const mealsToShow = meals || defaultMeals;

    const tableCard = container.querySelector(".table-card");
    if (tableCard) {
      const existingMealCards = tableCard.querySelectorAll(".meal-card");
      existingMealCards.forEach((card) => card.remove());

      mealsToShow.forEach((meal) => {
        const mealCard = document.createElement("div");
        mealCard.className = "meal-card past";
        mealCard.innerHTML = this.createPreviousMealCardHTML(meal);
        tableCard.appendChild(mealCard);
      });
    }
  }

  updatePaymentsData(payments) {
    const tbody = document.querySelector("#payments table tbody");
    if (!tbody) return;

    const defaultPayments = [
      {
        date: "10 May 2025",
        description: "Monthly Subscription - Lunch & Dinner Plan",
        amount: 3600,
        status: "paid",
      },
      {
        date: "12 May 2025",
        description: "Weekly Subscription - Breakfast Plan",
        amount: 700,
        status: "paid",
      },
      {
        date: "10 Apr 2025",
        description: "Monthly Subscription - Lunch & Dinner Plan",
        amount: 3600,
        status: "paid",
      },
    ];

    const paymentsToShow = payments || defaultPayments;

    tbody.innerHTML = paymentsToShow
      .map(
        (payment) => `
            <tr>
                <td>${payment.date}</td>
                <td>${payment.description}</td>
                <td>${this.formatCurrency(payment.amount)}</td>
                <td><span class="status-badge status-${payment.status}">${
          payment.status.charAt(0).toUpperCase() + payment.status.slice(1)
        }</span></td>
                <td><a href="#" class="text-decoration-none" onclick="customerDashboard.downloadInvoice('${
                  payment.id
                }')">Download</a></td>
            </tr>
        `
      )
      .join("");
  }

  createMealCardHTML(meal) {
    return `
            <div class="meal-date">${meal.type} • ${meal.time}</div>
            <div class="meal-items">
                ${meal.items
                  .map(
                    (item) => `
                    <div class="meal-item">
                        <strong>${item.split(" - ")[0]}</strong> - ${
                      item.split(" - ")[1]
                    }
                    </div>
                `
                  )
                  .join("")}
            </div>
            <div class="text-muted small">
                Special Instructions: ${meal.instructions}
            </div>
        `;
  }

  createPreviousMealCardHTML(meal) {
    const stars = this.generateStarRating(meal.rating);

    if (meal.rated) {
      return `
                <div class="meal-date">${meal.date}</div>
                <div class="meal-type">${meal.type}</div>
                <div class="meal-items">
                    ${meal.items
                      .map(
                        (item) => `
                        <div class="meal-item">
                            <strong>${item.split(" - ")[0]}</strong> - ${
                          item.split(" - ")[1]
                        }
                        </div>
                    `
                      )
                      .join("")}
                </div>
                <div class="rating-stars">
                    ${stars}
                    <span class="ms-2 text-muted">Rated</span>
                </div>
                ${
                  meal.comment
                    ? `
                    <div class="mt-2">
                        <strong>Your comment:</strong> "${meal.comment}"
                    </div>
                `
                    : ""
                }
            `;
    } else {
      return `
                <div class="meal-date">${meal.date}</div>
                <div class="meal-type">${meal.type}</div>
                <div class="meal-items">
                    ${meal.items
                      .map(
                        (item) => `
                        <div class="meal-item">
                            <strong>${item.split(" - ")[0]}</strong> - ${
                          item.split(" - ")[1]
                        }
                        </div>
                    `
                      )
                      .join("")}
                </div>
                <div class="d-flex justify-content-between align-items-center">
                    <div class="rating-stars">
                        ${stars}
                        <span class="ms-2 text-muted">Not rated</span>
                    </div>
                    <button class="btn btn-sm btn-outline-primary" onclick="customerDashboard.rateMeal('${
                      meal.id
                    }')">Rate Now</button>
                </div>
            `;
    }
  }

  generateStarRating(rating) {
    let stars = "";
    for (let i = 1; i <= 5; i++) {
      if (i <= rating) {
        stars += '<i class="fas fa-star"></i>';
      } else {
        stars += '<i class="far fa-star"></i>';
      }
    }
    return stars;
  }

  setupEventListeners() {
    // Filter buttons for meals
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
        this.handleMealFilter(e.target.textContent.trim());
      });
    });

    // Export button
    const exportBtn = document.querySelector(
      '#payments button:contains("Export")'
    );
    if (exportBtn) {
      exportBtn.addEventListener("click", (e) => {
        e.preventDefault();
        this.exportPaymentHistory();
      });
    }

    // Add subscription button
    const addSubBtn = document.querySelector("#subscriptions .btn-primary");
    if (addSubBtn) {
      addSubBtn.addEventListener("click", (e) => {
        e.preventDefault();
        this.addNewSubscription();
      });
    }

    // Form submissions
    const forms = document.querySelectorAll("#settings form");
    forms.forEach((form) => {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleFormSubmit(e.target);
      });
    });

    // Rating submission
    const ratingForm = document.querySelector("#feedback .btn-primary");
    if (ratingForm) {
      ratingForm.addEventListener("click", (e) => {
        e.preventDefault();
        this.submitRating();
      });
    }
  }

  setupRatingSystem() {
    // Interactive rating stars in feedback section
    const ratingStars = document.querySelectorAll(
      "#feedback .rating-stars .far, #feedback .rating-stars .fas"
    );
    ratingStars.forEach((star) => {
      star.addEventListener("click", function () {
        const rating = parseInt(this.getAttribute("data-rating"));
        const starsContainer = this.parentElement;

        // Update visual stars
        const stars = starsContainer.querySelectorAll("i");
        stars.forEach((s, index) => {
          if (index < rating) {
            s.classList.remove("far");
            s.classList.add("fas");
          } else {
            s.classList.remove("fas");
            s.classList.add("far");
          }
        });

        // Store the rating for submission
        starsContainer.setAttribute("data-current-rating", rating);
      });
    });
  }

  handleMealFilter(filter) {
    const mealCards = document.querySelectorAll(".meal-card");
    const filterLower = filter.toLowerCase();

    mealCards.forEach((card) => {
      if (filterLower === "today") {
        const isToday = card
          .closest(".table-card")
          .querySelector("h4")
          ?.textContent?.includes("Today");
        card.style.display = isToday ? "" : "none";
      } else if (filterLower === "tomorrow") {
        const isTomorrow = card
          .closest(".table-card")
          .querySelector("h4")
          ?.textContent?.includes("Tomorrow");
        card.style.display = isTomorrow ? "" : "none";
      } else if (filterLower === "this week") {
        card.style.display = "";
      }
    });
  }

  // Action methods
  async pauseSubscription(subscriptionId) {
    if (confirm("Are you sure you want to pause this subscription?")) {
      const result = await this.apiCall(
        `/subscriptions/${subscriptionId}/pause`,
        {
          method: "POST",
        }
      );

      if (result && result.status === "success") {
        this.showAlert("Subscription paused successfully", "success");
        this.loadCustomerData(); // Refresh data
      }
    }
  }

  async cancelSubscription(subscriptionId) {
    if (
      confirm(
        "Are you sure you want to cancel this subscription? This action cannot be undone."
      )
    ) {
      const result = await this.apiCall(
        `/subscriptions/${subscriptionId}/cancel`,
        {
          method: "POST",
        }
      );

      if (result && result.status === "success") {
        this.showAlert("Subscription cancelled successfully", "success");
        this.loadCustomerData(); // Refresh data
      }
    }
  }

  modifySubscription(subscriptionId) {
    this.showAlert(`Modifying subscription: ${subscriptionId}`, "info");
    // In real app, open modification modal
  }

  addNewSubscription() {
    this.showAlert("Opening subscription selection...", "info");
    // In real app, navigate to subscription plans page
  }

  rateMeal(mealId) {
    // Navigate to feedback section and focus on rating
    document.querySelector('a[href="#feedback"]').click();
    this.showAlert("Please rate your meal in the feedback section", "info");
  }

  async submitRating() {
    const ratingContainer = document.querySelector("#feedback .rating-stars");
    const rating = ratingContainer?.getAttribute("data-current-rating");
    const comment = document.querySelector("#feedback textarea")?.value;

    if (!rating) {
      this.showAlert("Please select a rating", "warning");
      return;
    }

    const result = await this.apiCall("/ratings/submit", {
      method: "POST",
      body: JSON.stringify({
        rating: parseInt(rating),
        comment: comment,
      }),
    });

    if (result && result.status === "success") {
      this.showAlert("Thank you for your feedback!", "success");
      document.querySelector("#feedback textarea").value = "";
      this.loadCustomerData(); // Refresh to show the new rating
    }
  }

  downloadInvoice(paymentId) {
    this.showAlert(`Downloading invoice for payment: ${paymentId}`, "info");
    // In real app, trigger file download
  }

  exportPaymentHistory() {
    this.showAlert("Exporting payment history...", "info");
    // In real app, generate and download CSV/PDF
  }

  async handleFormSubmit(form) {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    let endpoint = "";
    let successMessage = "";

    if (form.querySelector('input[value="Rajesh Kumar"]')) {
      endpoint = "/customer/profile";
      successMessage = "Profile updated successfully";
    } else if (form.querySelector("textarea")) {
      if (form.querySelector("label").textContent.includes("Address")) {
        endpoint = "/customer/address";
        successMessage = "Delivery address updated successfully";
      } else if (
        form.querySelector("label").textContent.includes("Preferences")
      ) {
        endpoint = "/customer/preferences";
        successMessage = "Dietary preferences saved";
      }
    } else if (form.querySelector('input[type="password"]')) {
      endpoint = "/customer/password";
      successMessage = "Password changed successfully";
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

// Initialize customer dashboard when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.customerDashboard = new CustomerDashboard();
});
