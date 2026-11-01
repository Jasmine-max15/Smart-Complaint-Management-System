const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserProfile,
  updateUserProfile,
  updateUserStatus,
  deleteUser,
} = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/', protect, adminOnly, getAllUsers);
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.put('/:id/status', protect, adminOnly, updateUserStatus);
router.delete('/:id', protect, adminOnly, deleteUser);

module.exports = router;

