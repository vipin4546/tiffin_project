const express = require('express');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { generateToken, protect, authorize } = require('../middleware/auth');
const router = express.Router();

// SIGNUP ENDPOINT (with JWT token)
router.post('/signup', async (req, res) => {
    try {
        const { fullName, email, phone, password, address } = req.body;

        // Validation
        if (!fullName || !email || !phone || !password) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required except address'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email'
            });
        }

        // Create new user
        const newUser = new User({
            fullName,
            email,
            phone,
            password,
            address: address || ""
        });

        // Save user to database
        await newUser.save();

        // Generate JWT token
        const token = generateToken(newUser);

        // Success response with token
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token: token,
            user: {
                id: newUser._id,
                fullName: newUser.fullName,
                email: newUser.email,
                role: newUser.role
            }
        });

    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during registration'
        });
    }
});

// LOGIN ENDPOINT (with JWT token)
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

        console.log('Login attempt:', { email, role });

        // Admin Login
        if (role === 'admin') {
            const adminEmail = process.env.ADMIN_EMAIL || 'admin@smarttiffin.com';
            const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
            
            if (email === adminEmail && password === adminPassword) {
                // Create admin user object for token
                const adminUser = {
                    _id: 'admin-001',
                    email: email,
                    role: 'admin',
                    name: 'Admin User'
                };
                
                const token = generateToken(adminUser);
                
                return res.json({
                    success: true,
                    message: 'Admin login successful',
                    token: token,
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
                    message: 'User not found with this email'
                });
            }

            // Check role match
            if (user.role !== role) {
                return res.status(401).json({
                    success: false,
                    message: `This account is registered as ${user.role}, not ${role}`
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

            // Generate JWT token
            const token = generateToken(user);

            // Login successful
            return res.json({
                success: true,
                message: 'Login successful',
                token: token,
                role: user.role,
                user: {
                    id: user._id,
                    name: user.fullName,
                    email: user.email,
                    phone: user.phone
                }
            });
        }

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

// PROTECTED ROUTE EXAMPLE - Get current user profile
router.get('/profile', protect, async (req, res) => {
    try {
        res.json({
            success: true,
            user: req.user
        });
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// PROTECTED ROUTE EXAMPLE - Admin only
router.get('/admin/stats', protect, authorize('admin'), async (req, res) => {
    try {
        // This route only accessible by admin
        const userCount = await User.countDocuments();
        
        res.json({
            success: true,
            stats: {
                totalUsers: userCount,
                message: 'Admin statistics'
            }
        });
    } catch (error) {
        console.error('Admin stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

module.exports = router;