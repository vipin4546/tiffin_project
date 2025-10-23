// Sample meal data (will be replaced with API calls later)
const featuredMeals = [
  {
    id: 1,
    name: "Chicken Biryani",
    description:
      "Aromatic basmati rice cooked with tender chicken and traditional spices",
    price: 12.99,
    image: "images/meal1.jpg",
    rating: 4.8,
    chef: "Aisha's Kitchen",
    category: "Main Course",
  },
  {
    id: 2,
    name: "Paneer Butter Masala",
    description: "Cottage cheese in rich tomato and butter gravy",
    price: 10.99,
    image: "images/meal2.jpg",
    rating: 4.6,
    chef: "Spice Garden",
    category: "Vegetarian",
  },
  {
    id: 3,
    name: "Vegetable Pulao",
    description: "Fragrant rice with mixed vegetables and mild spices",
    price: 8.99,
    image: "images/meal3.jpg",
    rating: 4.5,
    chef: "Home Style",
    category: "Vegetarian",
  },
  {
    id: 4,
    name: "Butter Chicken",
    description: "Tender chicken in creamy tomato gravy",
    price: 13.99,
    image: "images/meal4.jpg",
    rating: 4.9,
    chef: "Royal Kitchen",
    category: "Main Course",
  },
];

// Load featured meals
function loadFeaturedMeals() {
  const mealsContainer = document.getElementById("featuredMeals");

  if (mealsContainer) {
    mealsContainer.innerHTML = featuredMeals
      .map(
        (meal) => `
            <div class="col-md-6 col-lg-3">
                <div class="card meal-card h-100">
                    <img src="${meal.image}" class="card-img-top meal-image" alt="${meal.name}">
                    <div class="card-body d-flex flex-column">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <h5 class="card-title">${meal.name}</h5>
                            <span class="price-tag">$${meal.price}</span>
                        </div>
                        <p class="card-text flex-grow-1">${meal.description}</p>
                        <div class="d-flex justify-content-between align-items-center mt-auto">
                            <small class="text-muted">by ${meal.chef}</small>
                            <div class="rating">
                                <i class="fas fa-star"></i> ${meal.rating}
                            </div>
                        </div>
                        <button class="btn btn-success mt-3" onclick="addToCart(${meal.id})">
                            <i class="fas fa-shopping-cart me-2"></i>Add to Cart
                        </button>
                    </div>
                </div>
            </div>
        `
      )
      .join("");
  }
}

// Cart functionality (simplified for frontend)
let cart = [];

function addToCart(mealId) {
  const meal = featuredMeals.find((m) => m.id === mealId);
  if (meal) {
    cart.push(meal);
    updateCartCount();
    showToast(`${meal.name} added to cart!`);
  }
}

function updateCartCount() {
  const cartCount = document.getElementById("cartCount");
  if (cartCount) {
    cartCount.textContent = cart.length;
  }
}

function showToast(message) {
  // Create toast element
  const toast = document.createElement("div");
  toast.className = "position-fixed bottom-0 end-0 p-3";
  toast.style.zIndex = "11";
  toast.innerHTML = `
        <div class="toast show" role="alert">
            <div class="toast-header">
                <strong class="me-auto">HomeCooked</strong>
                <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        </div>
    `;

  document.body.appendChild(toast);

  // Remove toast after 3 seconds
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// Initialize when page loads
document.addEventListener("DOMContentLoaded", function () {
  loadFeaturedMeals();
  updateCartCount();

  // Add cart count to navbar if not exists
  if (!document.getElementById("cartCount")) {
    const cartLink = document.querySelector('a[href="cart.html"]');
    if (cartLink) {
      cartLink.innerHTML += ` <span id="cartCount" class="badge bg-success">0</span>`;
    }
  }
});
