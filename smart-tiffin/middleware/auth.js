const jwt = require('jsonwebtoken');
const User = require('../models/User');
const jwtConfig = require('../config/jwtConfig');

// Session-based authentication for pages
exports.requireAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
};

// JWT-based authentication for APIs
exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token && req.session.user) {
    // If no token but session exists, use session
    req.user = req.session.user;
    return next();
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }

  try {
    // Use the secret from jwtConfig
    const decoded = jwt.verify(token, jwtConfig.secret);
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('JWT Error:', error);
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};

// Role-based authorization
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    if (!roles.includes(req.user.role)) {
      if (req.headers.accept && req.headers.accept.includes('text/html')) {
        return res.redirect('/');
      }
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

// LOGIN ENDPOINT
router.post('/login', async (req, res) => {
    try {
        const { email, password, role } = req.body;

        // Validation
        if (!email || !password || !role) {
            return res.status(400).json({
                success: false,
                message: 'Email, password and role are required'
            });
        }

        // Admin Login
        if (role === 'admin') {
            // Check against environment variables
            const adminEmail = process.env.ADMIN_EMAIL || 'admin@smarttiffin.com';
            const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
            
            if (email === adminEmail && password === adminPassword) {
                return res.json({
                    success: true,
                    message: 'Admin login successful',
                    role: 'admin',
                    user: {
                        id: 'admin-001',
                        name: 'Admin User',
                        email: email
                    }
                });
            } else {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid admin credentials'
                });
            }
        }

        // Customer/HomeCook Login
        if (role === 'customer' || role === 'homecook') {
            // Find user by email
            const user = await User.findOne({ email });
            
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Check role match
            if (user.role !== role) {
                return res.status(401).json({
                    success: false,
                    message: `Invalid role. This account is registered as ${user.role}`
                });
            }

            // Verify password
            const isPasswordValid = await bcrypt.compare(password, user.password);
            
            if (!isPasswordValid) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid password'
                });
            }

            // Login successful
            return res.json({
                success: true,
                message: 'Login successful',
                role: user.role,
                user: {
                    id: user._id,
                    name: user.fullName,
                    email: user.email,
                    phone: user.phone
                }
            });
        }

        // Invalid role
        return res.status(400).json({
            success: false,
            message: 'Invalid role specified'
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login'
        });
    }
});