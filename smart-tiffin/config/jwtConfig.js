const dotenv = require('dotenv');
dotenv.config();

module.exports = {
    secret: process.env.JWT_SECRET || 'your_super_secret_key_here_change_in_production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d', // 7 days
    issuer: 'smart-tiffin',
    audience: 'smart-tiffin-users'
};