
const mongoose = require('mongoose');

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
      enum: [
        'Submitted',
        'Pending',
        'In Progress',
        'Resolved',
        'Rejected',
        'Reopened',
      ],
    },
    remarks: {
      type: String,
      default: '',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    updaterRole: {
      type: String,
      default: 'user',
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const complaintSchema = new mongoose.Schema(
  {
    complaintId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        'Electricity',
        'Water Supply',
        'Road and Transport',
        'Sanitation',
        'Public Safety',
        'Internet and Technology',
        'Other',
      ],
      default: 'Other',
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: String,
      default: 'General Administration',
      trim: true,
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium',
    },
    image: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: [
        'Submitted',
        'Pending',
        'In Progress',
        'Resolved',
        'Rejected',
        'Reopened',
      ],
      default: 'Submitted',
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedTo: {
      type: String,
      default: 'Unassigned',
      trim: true,
    },
    adminRemarks: {
      type: String,
      default: '',
      trim: true,
    },
    statusHistory: {
      type: [statusHistorySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

complaintSchema.index({ userId: 1, createdAt: -1 });
complaintSchema.index({ status: 1, category: 1, priority: 1 });

module.exports =
  mongoose.models.Complaint ||
  mongoose.model('Complaint', complaintSchema);
