
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    complaintId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint',
      default: null,
    },

    type: {
      type: String,
      enum: [
        'complaint',
        'status',
        'alert',
        'welcome',
        'submission',
        'status_update',
      ],
      required: true,
    },

    title: {
      type: String,
      required: true,
    },

    message: {
      type: String,
      required: true,
    },

    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Notification', notificationSchema);
