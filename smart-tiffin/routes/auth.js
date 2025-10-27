const express = require('express');
const User = require('../models/User');
const Cook = require('../models/Cook'); // ✅ Add Cook model import
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

        // ✅ FIXED: Cook Login - Check both Cook model and User model
        if (role === 'homecook') {
            console.log('🔐 HomeCook login attempt for:', email);
            
            // First check in Cook model with cookEmail
            const cook = await Cook.findOne({ cookEmail: email.toLowerCase() })
                .populate('user', 'fullName email phone');
            
            if (cook) {
                console.log('✅ Cook found in Cook model:', cook.kitchenName);
                
                // Check if cook is approved
                if (cook.verificationStatus !== 'approved') {
                    return res.status(401).json({
                        success: false,
                        message: 'Your application is still under review'
                    });
                }

                // Verify cook password
                const isPasswordValid = await cook.comparePassword(password);
                
                if (isPasswordValid) {
                    console.log('✅ Cook password verified');
                    
                    // Generate JWT token for cook
                    const token = generateToken({
                        id: cook._id,
                        email: cook.cookEmail,
                        role: 'cook',
                        kitchenName: cook.kitchenName
                    });

                    return res.json({
                        success: true,
                        message: 'Cook login successful',
                        token: token,
                        role: 'cook',
                        user: {
                            id: cook._id,
                            name: cook.user.fullName,
                            email: cook.cookEmail,
                            kitchenName: cook.kitchenName
                        }
                    });
                } else {
                    console.log('❌ Cook password invalid');
                }
            }

            // If not found in Cook model, check User model (for existing cooks)
            console.log('🔍 Checking User model for:', email);
            const user = await User.findOne({ email: email.toLowerCase(), role: 'cook' });
            
            if (user) {
                console.log('✅ User found in User model:', user.fullName);
                
                const isPasswordValid = await bcrypt.compare(password, user.password);
                
                if (isPasswordValid) {
                    console.log('✅ User password verified');
                    
                    // Find cook profile
                    const cookProfile = await Cook.findOne({ user: user._id });
                    
                    if (!cookProfile) {
                        return res.status(401).json({
                            success: false,
                            message: 'Cook profile not found'
                        });
                    }

                    if (cookProfile.verificationStatus !== 'approved') {
                        return res.status(401).json({
                            success: false,
                            message: 'Your application is still under review'
                        });
                    }

                    const token = generateToken({
                        id: user._id,
                        email: user.email,
                        role: 'cook',
                        kitchenName: cookProfile.kitchenName
                    });

                    return res.json({
                        success: true,
                        message: 'Cook login successful',
                        token: token,
                        role: 'cook',
                        user: {
                            id: user._id,
                            name: user.fullName,
                            email: user.email,
                            kitchenName: cookProfile.kitchenName
                        }
                    });
                } else {
                    console.log('❌ User password invalid');
                }
            }

            return res.status(401).json({
                success: false,
                message: 'Invalid cook credentials'
            });
        }

        // Customer Login
        if (role === 'customer') {
            const user = await User.findOne({ email: email.toLowerCase(), role: 'customer' });
            
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found with this email'
                });
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);
            
            if (!isPasswordValid) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid password'
                });
            }

            const token = generateToken(user);

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

// GET CURRENT USER PROFILE
router.get('/me', protect, async (req, res) => {
    try {
        // Return user data without password
        const userData = {
            id: req.user._id,
            fullName: req.user.fullName,
            email: req.user.email,
            phone: req.user.phone,
            role: req.user.role,
            address: req.user.address
        };
        
        res.json({
            success: true,
            user: userData
        });
    } catch (error) {
        console.error('Get user profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching user data'
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

// ✅ COOK LOGIN ENDPOINT (Alternative route)
router.post('/cook-login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        console.log('🔐 Cook login attempt for:', email);

        // Find cook by cookEmail
        const cook = await Cook.findOne({ cookEmail: email.toLowerCase() })
            .populate('user', 'fullName email phone');
        
        if (!cook) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials - cook not found'
            });
        }

        // Check if cook is approved
        if (cook.verificationStatus !== 'approved') {
            return res.status(401).json({
                success: false,
                message: 'Your application is still under review'
            });
        }

        // Verify password
        const isPasswordValid = await cook.comparePassword(password);
        
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials - wrong password'
            });
        }

        // Generate JWT token
        const token = generateToken({
            id: cook._id,
            email: cook.cookEmail,
            role: 'cook',
            kitchenName: cook.kitchenName
        });

        res.status(200).json({
            success: true,
            message: 'Cook login successful',
            token: token,
            user: {
                id: cook._id,
                kitchenName: cook.kitchenName,
                email: cook.cookEmail,
                fullName: cook.user.fullName
            }
        });

    } catch (error) {
        console.error('Cook login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login'
        });
    }
});

module.exports = router;