const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// CORS Setup
app.use(cors());

app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-tiffin', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('MongoDB Connected Successfully'))
.catch(err => console.log('MongoDB Connection Error:', err));

// Routes - IMPORTANT!
app.use('/api/auth', require('./routes/auth'));

// Test route
app.get('/', (req, res) => {
    res.json({ message: 'Smart Tiffin Backend is Running!' });
});

// Test auth route
app.get('/api/auth/test', (req, res) => {
    res.json({ message: 'Auth routes are working!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});