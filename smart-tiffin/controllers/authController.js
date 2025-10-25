const User = require('../models/User');
const Cook = require('../models/Cook');
const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwtConfig');

// Generate JWT Token
const sendTokenResponse = (user, statusCode, req, res) => {
  // Make sure we have a secret key
  const secret = jwtConfig.secret;
  if (!secret) {
    console.error('JWT Secret is missing!');
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.status(500).json({
        success: false,
        message: 'Server configuration error'
      });
    }
    return res.render('login', {
      title: 'Login - Smart Tiffin',
      error: 'Server configuration error. Please try again.'
    });
  }

  const token = jwt.sign(
    { id: user._id },
    secret,
    { expiresIn: jwtConfig.expiresIn }
  );

  // Store user in session
  req.session.user = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role
  };

  // For API requests, send token
  if (req.headers.accept && req.headers.accept.includes('application/json')) {
    return res.status(statusCode).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  }

  // For page requests, redirect based on role
  let redirectUrl = '/';
  switch (user.role) {
    case 'customer':
      redirectUrl = '/customer-dashboard';
      break;
    case 'cook':
      redirectUrl = '/chef-dashboard';
      break;
    case 'admin':
      redirectUrl = '/admin-dashboard';
      break;
  }

  res.redirect(redirectUrl);
};

// Rest of the authController code remains the same...
// [Keep all the register, login, logout functions as before]