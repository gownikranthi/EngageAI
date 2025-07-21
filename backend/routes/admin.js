const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const User = require('../models/User');
const Participation = require('../models/Participation');
const Event = require('../models/Event');
const Engagement = require('../models/Engagement');

// Middleware to ensure all routes in this file are protected for admins
router.use(auth, admin);

/**
 * @route   GET /api/v1/admin/users
 * @desc    Get all users in the system
 * @access  Private (Admin)
 */
router.get('/users', async (req, res) => {
  try {
    // Find all users and exclude their passwords from the result
    const users = await User.find().select('-password');
    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Error fetching all users:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

/**
 * @route   DELETE /api/v1/admin/users/:id
 * @desc    Delete a user
 * @access  Private (Admin)
 */
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Optional: Add logic here to clean up related data (e.g., participations, engagements)
    // For now, we'll just delete the user document.
    await user.remove();

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error(`Error deleting user ${req.params.id}:`, error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});


/**
 * @route   GET /api/v1/admin/events/:eventId/participants
 * @desc    Get all participants for a specific event
 * @access  Private (Admin)
 */
router.get('/events/:eventId/participants', async (req, res) => {
  try {
    const { eventId } = req.params;

    // First, check if the event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Find all participation records for this event and populate the user details
    const participations = await Participation.find({ eventId })
      .populate('userId', 'name email'); // 'userId' is the field in Participation, 'name email' are fields from User

    // Extract just the user information from the participation records
    const participants = participations.map(p => p.userId).filter(p => p); // Filter out nulls if a user was deleted

    res.json({ success: true, data: participants });
  } catch (error) {
    console.error(`Error fetching participants for event ${req.params.eventId}:`, error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

/**
 * @route   GET /api/v1/admin/analytics/summary
 * @desc    Get summary analytics for the admin dashboard
 * @access  Private (Admin)
 */
router.get('/analytics/summary', async (req, res) => {
  try {
    const [
      totalUsers,
      totalEvents,
      totalEngagements,
      avgEngagementPerEvent,
      eventsToday
    ] = await Promise.all([
      User.countDocuments(),
      Event.countDocuments(),
      Engagement.countDocuments(),
      Engagement.aggregate([
        { $group: { _id: "$eventId", count: { $sum: 1 } } },
        { $group: { _id: null, avg: { $avg: "$count" } } }
      ]),
      Event.find({ date: { $gte: new Date().setHours(0, 0, 0, 0) } }).countDocuments()
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalEvents,
        totalEngagements,
        avgEngagementPerEvent: avgEngagementPerEvent[0]?.avg.toFixed(2) || 0,
        eventsToday
      }
    });
  } catch (error) {
    console.error('Error fetching analytics summary:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

module.exports = router; 