const express = require('express');
const { requireAuth, authorize } = require('../middleware/auth');
const router = express.Router();

// Home page - Only accessible after login
router.get('/', requireAuth, (req, res) => {
  res.render('index', { 
    title: 'Smart Tiffin - Home',
    user: req.session.user 
  });
});

// Login page - Accessible without login
router.get('/login', (req, res) => {
  if (req.session.user) {
    return res.redirect('/');
  }
  res.render('login', { 
    title: 'Login - Smart Tiffin',
    error: null 
  });
});

// Signup page - Accessible without login
router.get('/signup', (req, res) => {
  if (req.session.user) {
    return res.redirect('/');
  }
  res.render('signup', { 
    title: 'Sign Up - Smart Tiffin',
    error: null 
  });
});

// Become a Chef page
router.get('/become-chef', requireAuth, (req, res) => {
  res.render('become-chef', { 
    title: 'Become a Chef - Smart Tiffin',
    user: req.session.user 
  });
});

// Customer Dashboard
router.get('/customer-dashboard', requireAuth, authorize('customer'), (req, res) => {
  res.render('customer-dashboard', { 
    title: 'Customer Dashboard - Smart Tiffin',
    user: req.session.user 
  });
});

// Chef Dashboard
router.get('/chef-dashboard', requireAuth, authorize('cook'), (req, res) => {
  res.render('chef-dashboard', { 
    title: 'Chef Dashboard - Smart Tiffin',
    user: req.session.user 
  });
});

// Admin Dashboard
router.get('/admin-dashboard', requireAuth, authorize('admin'), (req, res) => {
  res.render('admin-dashboard', { 
    title: 'Admin Dashboard - Smart Tiffin',
    user: req.session.user 
  });
});

module.exports = router;