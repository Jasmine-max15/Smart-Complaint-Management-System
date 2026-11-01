const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'fallback_secret_key_mca_project'
      );

      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User account associated with this token no longer exists.',
        });
      }

      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Your account has been deactivated. Please contact administration.',
        });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('Authentication Error:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired authorization token.',
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.',
    });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Administrative privileges required.',
    });
  }
};

module.exports = { protect, adminOnly };

