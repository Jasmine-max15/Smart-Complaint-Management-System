const express = require('express');
const router = express.Router();
const { getUserStats, getAdminStats } = require('../controllers/dashboardController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/user-stats', protect, getUserStats);
router.get('/admin-stats', protect, adminOnly, getAdminStats);

module.exports = router;

