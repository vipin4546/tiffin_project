const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  secret: process.env.JWT_SECRET || 'fallback_secret_key_for_development',
  expiresIn: process.env.JWT_EXPIRE || '30d'
};