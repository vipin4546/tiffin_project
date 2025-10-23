// Navbar functionality
class NavbarManager {
  constructor() {
    this.init();
  }

  init() {
    this.addScrollEffect();
    this.updateCartCount();
    this.setActiveNavLink();
    this.addMobileMenuClose();
  }

  // Add scroll effect to navbar
  addScrollEffect() {
    const navbar = document.querySelector(".navbar");

    window.addEventListener("scroll", () => {
      if (window.scrollY > 100) {
        navbar.classList.add("navbar-scrolled");
      } else {
        navbar.classList.remove("navbar-scrolled");
      }
    });
  }

  // Update cart count from localStorage or session
  updateCartCount() {
    const cartCount = document.querySelector(".badge");
    if (cartCount) {
      // Get cart from localStorage or use default
      const cart = JSON.parse(localStorage.getItem("cart")) || [];
      cartCount.textContent = cart.length;
    }
  }

  // Set active nav link based on current page
  setActiveNavLink() {
    const currentPage = window.location.pathname.split("/").pop();
    const navLinks = document.querySelectorAll(".nav-link");

    navLinks.forEach((link) => {
      link.classList.remove("active");
      if (link.getAttribute("href") === currentPage) {
        link.classList.add("active");
      }
    });
  }

  // Close mobile menu when link is clicked
  addMobileMenuClose() {
    const navLinks = document.querySelectorAll(".navbar-nav .nav-link");
    const navbarToggler = document.querySelector(".navbar-toggler");
    const navbarCollapse = document.querySelector(".navbar-collapse");

    navLinks.forEach((link) => {
      link.addEventListener("click", () => {
        if (window.innerWidth < 992) {
          navbarCollapse.classList.remove("show");
        }
      });
    });
  }
}

// Initialize navbar when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  new NavbarManager();
});

// Cart functionality for demo
let cart = JSON.parse(localStorage.getItem("cart")) || [];

function addToCart(item) {
  cart.push(item);
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartDisplay();
}

function updateCartDisplay() {
  const cartCount = document.querySelector(".badge");
  if (cartCount) {
    cartCount.textContent = cart.length;
  }
}

// Export for use in other files
if (typeof module !== "undefined" && module.exports) {
  module.exports = { NavbarManager, addToCart, updateCartDisplay };
}
