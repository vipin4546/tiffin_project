const express = require('express');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const router = express.Router();

// SIGNUP ENDPOINT
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

        // Success response
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
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

        console.log('Login attempt:', { email, role });

        // Admin Login
        if (role === 'admin') {
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

module.exports = router;