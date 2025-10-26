const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Import routes
const authRoutes = require('./routes/auth');
const chefApplicationsRoutes = require('./routes/chefApplications');

dotenv.config();

const app = express();

// CORS Setup
app.use(cors());

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-tiffin', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('MongoDB Connected Successfully'))
.catch(err => console.log('MongoDB Connection Error:', err));

// ✅ ROUTES SETUP - IMPORTANT!
app.use('/api/auth', authRoutes);
app.use('/api/chef-applications', chefApplicationsRoutes);

// Test route
app.get('/', (req, res) => {
    res.json({ 
        success: true,
        message: 'Smart Tiffin Backend is Running!',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});