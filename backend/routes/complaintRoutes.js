const express = require('express');
const router = express.Router();
const {
  createComplaint,
  getAllComplaints,
  getMyComplaints,
  getComplaintById,
  trackComplaintPublic,
  updateComplaint,
  updateComplaintStatus,
  deleteComplaint,
  exportComplaintsCSV,
} = require('../controllers/complaintController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Public tracking
router.get('/track/:complaintId', trackComplaintPublic);

// CSV Export (Admin)
router.get('/export/csv', protect, adminOnly, exportComplaintsCSV);

// Complaints CRUD
router.route('/')
  .post(protect, upload.single('image'), createComplaint)
  .get(protect, adminOnly, getAllComplaints);

router.get('/my', protect, getMyComplaints);

router.route('/:id')
  .get(protect, getComplaintById)
  .put(protect, upload.single('image'), updateComplaint)
  .delete(protect, deleteComplaint);

router.patch('/:id/status', protect, adminOnly, updateComplaintStatus);

module.exports = router;

