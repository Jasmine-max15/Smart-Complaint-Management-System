
const Complaint = require('../models/Complaint');
const User = require('../models/User');

// Count complaints by status, ignoring capitalization and extra spaces.
const countByStatus = async (filter, statuses) => {
  const result = await Complaint.aggregate([
    { $match: filter },
    {
      $group: {
        _id: {
          $toLower: {
            $trim: {
              input: { $ifNull: ['$status', ''] }
            }
          }
        },
        count: { $sum: 1 }
      }
    }
  ]);

  return result
    .filter(item => statuses.includes(item._id))
    .reduce((total, item) => total + item.count, 0);
};

// USER DASHBOARD
// GET /api/dashboard/user-stats
const getUserStats = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const [
      total,
      pending,
      inProgress,
      resolved,
      rejected
    ] = await Promise.all([
      Complaint.countDocuments({ userId }),
      countByStatus({ userId }, ['pending', 'submitted']),
      countByStatus({ userId }, ['in progress']),
      countByStatus({ userId }, ['resolved']),
      countByStatus({ userId }, ['rejected'])
    ]);

    const recentComplaints = await Complaint.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5);

    const categoryStats = await Complaint.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      stats: {
        total,
        pending,
        inProgress,
        resolved,
        rejected,
        categoryStats
      },
      recentComplaints
    });
  } catch (error) {
    next(error);
  }
};

// ADMIN DASHBOARD
// GET /api/dashboard/admin-stats
const getAdminStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalComplaints,
      submitted,
      pending,
      inProgress,
      resolved,
      rejected,
      reopened
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Complaint.countDocuments(),
      countByStatus({}, ['submitted']),
      countByStatus({}, ['pending']),
      countByStatus({}, ['in progress']),
      countByStatus({}, ['resolved']),
      countByStatus({}, ['rejected']),
      countByStatus({}, ['reopened'])
    ]);

    const categoryBreakdown = await Complaint.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const priorityBreakdown = await Complaint.aggregate([
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    // Monthly complaint trend for the past six months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyTrendRaw = await Complaint.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    const monthlyTrend = monthlyTrendRaw.map(item => ({
      label: `${monthNames[item._id.month - 1]} ${item._id.year}`,
      count: item.count
    }));

    const recentComplaints = await Complaint.find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(6);

    const recentUsers = await User.find({ role: 'user' })
      .select('name email phone isActive createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalComplaints,
        submitted,
        pending,
        inProgress,
        resolved,
        rejected,
        reopened,
        categoryBreakdown,
        priorityBreakdown,
        monthlyTrend
      },
      recentComplaints,
      recentUsers
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserStats,
  getAdminStats
};
