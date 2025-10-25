const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const session = require('express-session');
const connectDB = require('./config/database');
const User = require('./models/User');

// Load env vars and connect to DB
dotenv.config();
connectDB();

const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Session middleware
app.use(session({
  secret: process.env.JWT_SECRET || 'smart_tiffin_secret_2025',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, // Set to true if using HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// EJS setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Make user data available to all views
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// Routes
app.get('/', (req, res) => {
  if (req.session.user) {
    // Redirect to appropriate dashboard based on role
    switch(req.session.user.role) {
      case 'customer':
        return res.redirect('/customer-dashboard');
      case 'cook':
        return res.redirect('/chef-dashboard');
      case 'admin':
        return res.redirect('/admin-dashboard');
      default:
        return res.redirect('/login');
    }
  }
  res.redirect('/login');
});

app.get('/login', (req, res) => {
  if (req.session.user) {
    return res.redirect('/');
  }
  res.render('login', { 
    title: 'Login - Smart Tiffin',
    error: null,
    message: req.query.message || null
  });
});

app.get('/signup', (req, res) => {
  if (req.session.user) {
    return res.redirect('/');
  }
  res.render('signup', { 
    title: 'Sign Up - Smart Tiffin',
    error: null 
  });
});

// Register with MongoDB and Session
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, phone, role, confirmPassword } = req.body;
    
    // Validation
    if (password !== confirmPassword) {
      return res.render('signup', {
        title: 'Sign Up - Smart Tiffin',
        error: 'Passwords do not match'
      });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.render('signup', {
        title: 'Sign Up - Smart Tiffin',
        error: 'User already exists with this email'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: role || 'customer'
    });

    // Store user in session
    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone
    };

    console.log('User created and session set:', user.email);
    
    // Redirect based on role
    if (user.role === 'customer') {
      res.redirect('/customer-dashboard');
    } else if (user.role === 'cook') {
      res.redirect('/chef-dashboard');
    } else {
      res.redirect('/');
    }

  } catch (error) {
    console.error('Registration error:', error);
    res.render('signup', {
      title: 'Sign Up - Smart Tiffin',
      error: 'Something went wrong. Please try again.'
    });
  }
});

// Login with MongoDB and Session
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    
    // Admin login
    if (role === 'admin') {
      if (email === 'admin@smarttiffin.com' && password === 'admin123') {
        // Create admin session
        req.session.user = {
          id: 'admin',
          name: 'Admin User',
          email: 'admin@smarttiffin.com',
          role: 'admin'
        };
        return res.redirect('/admin-dashboard');
      } else {
        return res.render('login', {
          title: 'Login - Smart Tiffin',
          error: 'Invalid admin credentials',
          message: null
        });
      }
    }

    // Find user
    const user = await User.findOne({ email });
    
    if (user && (await user.matchPassword(password))) {
      // Check role
      if (role && user.role !== role) {
        return res.render('login', {
          title: 'Login - Smart Tiffin',
          error: `Invalid login for ${role} role`,
          message: null
        });
      }

      // Store user in session
      req.session.user = {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone
      };

      // Redirect based on role
      if (user.role === 'customer') {
        res.redirect('/customer-dashboard');
      } else if (user.role === 'cook') {
        res.redirect('/chef-dashboard');
      } else {
        res.redirect('/');
      }
    } else {
      res.render('login', {
        title: 'Login - Smart Tiffin',
        error: 'Invalid email or password',
        message: null
      });
    }

  } catch (error) {
    console.error('Login error:', error);
    res.render('login', {
      title: 'Login - Smart Tiffin',
      error: 'Something went wrong. Please try again.',
      message: null
    });
  }
});

// Protected route middleware
const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
};

// Dashboard routes (Protected)
app.get('/customer-dashboard', requireAuth, (req, res) => {
  if (req.session.user.role !== 'customer') {
    return res.redirect('/');
  }
  res.render('customer-dashboard', { 
    title: 'Customer Dashboard - Smart Tiffin',
    user: req.session.user
  });
});

app.get('/chef-dashboard', requireAuth, (req, res) => {
  if (req.session.user.role !== 'cook') {
    return res.redirect('/');
  }
  res.render('chef-dashboard', { 
    title: 'Chef Dashboard - Smart Tiffin',
    user: req.session.user
  });
});

app.get('/admin-dashboard', requireAuth, (req, res) => {
  if (req.session.user.role !== 'admin') {
    return res.redirect('/');
  }
  res.render('admin-dashboard', { 
    title: 'Admin Dashboard - Smart Tiffin',
    user: req.session.user
  });
});

// Become a Chef page (Protected)
app.get('/become-chef', requireAuth, (req, res) => {
  res.render('become-chef', { 
    title: 'Become a Chef - Smart Tiffin',
    user: req.session.user
  });
});

// Handle Chef Application
app.post('/api/cooks/apply', requireAuth, async (req, res) => {
  try {
    const { kitchenName, cuisine, description, mealTypes } = req.body;
    
    // Update user role to cook
    await User.findByIdAndUpdate(req.session.user.id, { role: 'cook' });
    
    // Update session
    req.session.user.role = 'cook';
    
    console.log('Chef application received from:', req.session.user.email);
    res.redirect('/chef-dashboard?message=Application submitted successfully!');
    
  } catch (error) {
    console.error('Chef application error:', error);
    res.render('become-chef', {
      title: 'Become a Chef - Smart Tiffin',
      error: 'Application submission failed. Please try again.',
      user: req.session.user
    });
  }
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/login?message=Logged out successfully!');
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Open http://localhost:${PORT} in your browser`);
});