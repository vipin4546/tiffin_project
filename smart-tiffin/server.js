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

// ✅ FIX: Enhanced CORS Setup
app.use(cors({
    origin: [
        'http://127.0.0.1:5500', 
        'http://127.0.0.1:5501', 
        'http://localhost:5500', 
        'http://localhost:5501', 
        'http://localhost:3000',
        'http://localhost:5000',
        'http://127.0.0.1:5000'

    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from frontend folder
app.use(express.static(path.join(__dirname, '../frontend')));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-tiffin', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB Connected Successfully'))
.catch(err => console.log('❌ MongoDB Connection Error:', err));

// Routes Setup
app.use('/api/auth', authRoutes);
app.use('/api/chef-applications', chefApplicationsRoutes);

// ✅ Serve frontend files for all routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📱 Frontend: http://localhost:${PORT}`);
    console.log(`🔗 API: http://localhost:${PORT}/api`);
    console.log(`🌐 Network: http://0.0.0.0:${PORT}`);
});