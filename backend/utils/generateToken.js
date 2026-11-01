const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret_key_mca_project', {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
};

module.exports = generateToken;

