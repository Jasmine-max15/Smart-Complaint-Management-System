
const fs = require('fs');
const path = require('path');

const Complaint = require('../models/Complaint');
const Notification = require('../models/Notification');

// Generate unique complaint ID
const generateComplaintId = () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(1000 + Math.random() * 9000);

  return `CMP-${date}-${random}`;
};

// Submit complaint
const createComplaint = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      location,
      department,
      priority,
    } = req.body;

    if (!title || !description || !category || !location) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, category and location are required.',
      });
    }

    let complaintId = generateComplaintId();

    while (await Complaint.exists({ complaintId })) {
      complaintId = generateComplaintId();
    }

    const complaint = await Complaint.create({
      complaintId,
      title: title.trim(),
      description: description.trim(),
      category,
      location: location.trim(),
      department: department
        ? department.trim()
        : 'General Administration',
      priority: priority || 'Medium',
      image: req.file ? `/uploads/${req.file.filename}` : '',
      status: 'Submitted',
      userId: req.user._id,
      assignedTo: department
        ? `${department.trim()} Desk`
        : 'Unassigned',
      adminRemarks:
        'Complaint registered and awaiting administrative review.',
      statusHistory: [
        {
          status: 'Submitted',
          remarks: 'Complaint lodged successfully by citizen.',
          updatedBy: req.user._id,
          updaterRole: req.user.role,
        },
      ],
    });

    await Notification.create({
      userId: req.user._id,
      complaintId: complaint._id,
      title: 'Complaint Lodged Successfully',
      message: `Your complaint "${complaint.title}" has been registered with ID: ${complaint.complaintId}.`,
      type: 'submission',
    });

    return res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully!',
      complaint,
    });
  } catch (error) {
    next(error);
  }
};

// Get all complaints
const getAllComplaints = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 10, 1),
      100
    );

    const query = {};

    if (req.query.status && req.query.status !== 'all') {
      query.status = req.query.status;
    }

    if (req.query.category && req.query.category !== 'all') {
      query.category = req.query.category;
    }

    if (req.query.priority && req.query.priority !== 'all') {
      query.priority = req.query.priority;
    }

    if (req.query.department && req.query.department !== 'all') {
      query.department = new RegExp(req.query.department, 'i');
    }

    if (req.query.search) {
      const search = new RegExp(
        req.query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        'i'
      );

      query.$or = [
        { complaintId: search },
        { title: search },
        { description: search },
        { location: search },
      ];
    }

    const total = await Complaint.countDocuments(query);

    const complaints = await Complaint.find(query)
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return res.json({
      success: true,
      count: complaints.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      complaints,
    });
  } catch (error) {
    next(error);
  }
};

// Get logged-in user's complaints
const getMyComplaints = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 10, 1),
      100
    );

    const query = { userId: req.user._id };

    if (req.query.status && req.query.status !== 'all') {
      query.status = req.query.status;
    }

    if (req.query.category && req.query.category !== 'all') {
      query.category = req.query.category;
    }

    if (req.query.priority && req.query.priority !== 'all') {
      query.priority = req.query.priority;
    }

    if (req.query.search) {
      const search = new RegExp(
        req.query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        'i'
      );

      query.$or = [
        { complaintId: search },
        { title: search },
        { description: search },
        { location: search },
      ];
    }

    const total = await Complaint.countDocuments(query);

    const complaints = await Complaint.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return res.json({
      success: true,
      count: complaints.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      complaints,
    });
  } catch (error) {
    next(error);
  }
};

// Get complaint by MongoDB ID or complaint ID
const getComplaintById = async (req, res, next) => {
  try {
    const identifier = req.params.id;

    let complaint;

    if (identifier.startsWith('CMP-')) {
      complaint = await Complaint.findOne({
        complaintId: identifier,
      });
    } else {
      if (!/^[0-9a-fA-F]{24}$/.test(identifier)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid complaint ID.',
        });
      }

      complaint = await Complaint.findById(identifier);
    }

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint record not found.',
      });
    }

    await complaint.populate([
      { path: 'userId', select: 'name email phone address' },
      { path: 'statusHistory.updatedBy', select: 'name role' },
    ]);

    const ownerId = complaint.userId?._id?.toString();
    const currentUserId = req.user._id.toString();

    if (req.user.role !== 'admin' && ownerId !== currentUserId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this complaint.',
      });
    }

    return res.json({
      success: true,
      complaint,
    });
  } catch (error) {
    next(error);
  }
};

// Public complaint tracking
const trackComplaintPublic = async (req, res, next) => {
  try {
    const complaintId = req.params.complaintId.trim().toUpperCase();

    const complaint = await Complaint.findOne({ complaintId }).select(
      'complaintId title category location department priority status adminRemarks statusHistory createdAt updatedAt'
    );

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: `No complaint found matching ID "${complaintId}".`,
      });
    }

    return res.json({
      success: true,
      complaint,
    });
  } catch (error) {
    next(error);
  }
};

// Update complaint details
const updateComplaint = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found.',
      });
    }

    const isOwner =
      complaint.userId.toString() === req.user._id.toString();

    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this complaint.',
      });
    }

    if (!isAdmin && complaint.status !== 'Submitted') {
      return res.status(400).json({
        success: false,
        message: 'Only submitted complaints can be edited.',
      });
    }

    const {
      title,
      description,
      category,
      location,
      department,
      priority,
    } = req.body;

    if (title !== undefined) complaint.title = title.trim();
    if (description !== undefined) complaint.description = description.trim();
    if (category !== undefined) complaint.category = category;
    if (location !== undefined) complaint.location = location.trim();
    if (department !== undefined) complaint.department = department.trim();
    if (priority !== undefined) complaint.priority = priority;

    if (req.file) {
      complaint.image = `/uploads/${req.file.filename}`;
    }

    await complaint.save();

    return res.json({
      success: true,
      message: 'Complaint updated successfully.',
      complaint,
    });
  } catch (error) {
    next(error);
  }
};

// Update complaint status
const updateComplaintStatus = async (req, res, next) => {
  try {
    const {
      status,
      remarks,
      assignedTo,
      priority,
      department,
    } = req.body;

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found.',
      });
    }

    const previousStatus = complaint.status;
    const newStatus = status || previousStatus;

    if (status) complaint.status = status;

    if (assignedTo !== undefined) {
      complaint.assignedTo = assignedTo.trim();
    }

    if (department !== undefined) {
      complaint.department = department.trim();
    }

    if (priority !== undefined) {
      complaint.priority = priority;
    }

    if (remarks) {
      complaint.adminRemarks = remarks.trim();
    }

    complaint.statusHistory.push({
      status: newStatus,
      remarks: remarks
        ? remarks.trim()
        : `Status updated from ${previousStatus} to ${newStatus}.`,
      updatedBy: req.user._id,
      updaterRole: req.user.role,
      updatedAt: new Date(),
    });

    await complaint.save();

    await Notification.create({
      userId: complaint.userId,
      complaintId: complaint._id,
      title: `Complaint Status Updated: ${newStatus}`,
      message: `Your complaint "${complaint.title}" (${complaint.complaintId}) status changed from "${previousStatus}" to "${newStatus}".`,
      type: 'status_update',
    });

    const populatedComplaint = await Complaint.findById(complaint._id)
      .populate('userId', 'name email phone')
      .populate('statusHistory.updatedBy', 'name role');

    return res.json({
      success: true,
      message: `Complaint status updated to "${newStatus}" successfully.`,
      complaint: populatedComplaint,
    });
  } catch (error) {
    next(error);
  }
};

// Delete complaint
const deleteComplaint = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found.',
      });
    }

    const isOwner =
      complaint.userId.toString() === req.user._id.toString();

    const isAdmin = req.user.role === 'admin';

    if (!isAdmin && (!isOwner || complaint.status !== 'Submitted')) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own submitted complaints.',
      });
    }

    if (complaint.image) {
      const imagePath = path.join(
        __dirname,
        '..',
        complaint.image.replace(/^[/\\]+/, '')
      );

      if (fs.existsSync(imagePath)) {
        try {
          fs.unlinkSync(imagePath);
        } catch (error) {
          console.warn('Could not delete image:', error.message);
        }
      }
    }

    await Notification.deleteMany({
      complaintId: complaint._id,
    });

    await complaint.deleteOne();

    return res.json({
      success: true,
      message: 'Complaint deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// Export complaints as CSV
const exportComplaintsCSV = async (req, res, next) => {
  try {
    const complaints = await Complaint.find()
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 });

    const escapeCSV = (value) =>
      `"${String(value ?? '').replace(/"/g, '""')}"`;

    const headers = [
      'Complaint ID',
      'Title',
      'Category',
      'Priority',
      'Department',
      'Status',
      'Citizen Name',
      'Citizen Email',
      'Location',
      'Submitted Date',
      'Last Updated',
    ];

    const rows = complaints.map((complaint) => [
      complaint.complaintId,
      complaint.title,
      complaint.category,
      complaint.priority,
      complaint.department,
      complaint.status,
      complaint.userId?.name || 'Unknown',
      complaint.userId?.email || 'Unknown',
      complaint.location,
      complaint.createdAt
        ? new Date(complaint.createdAt).toLocaleDateString()
        : '',
      complaint.updatedAt
        ? new Date(complaint.updatedAt).toLocaleDateString()
        : '',
    ]);

    const csvContent = [
      headers.map(escapeCSV).join(','),
      ...rows.map((row) => row.map(escapeCSV).join(',')),
    ].join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="complaints-report.csv"'
    );

    return res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createComplaint,
  getAllComplaints,
  getMyComplaints,
  getComplaintById,
  trackComplaintPublic,
  updateComplaint,
  updateComplaintStatus,
  deleteComplaint,
  exportComplaintsCSV,
};
