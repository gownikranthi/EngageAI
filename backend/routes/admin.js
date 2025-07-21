const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const User = require('../models/User');
const Participation = require('../models/Participation');
const Event = require('../models/Event');
const Engagement = require('../models/Engagement');
const { getUserEventScore } = require('../utils/score'); // We'll use our score helper

// Middleware to ensure all routes in this file are protected for admins
router.use(auth, admin);

/**
 * @route   GET /api/v1/admin/users
 * @desc    Get all users in the system
 * @access  Private (Admin)
 */
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Error fetching all users:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

/**
 * @route   GET /api/v1/admin/events/:id/participants
 * @desc    Get all participants for a specific event
 * @access  Private (Admin)
 */
router.get('/events/:id/participants', async (req, res) => {
  try {
    const participations = await Participation.find({ eventId: req.params.id })
      .populate('userId', 'name email');
    const participants = participations.map(p => p.userId);
    res.json({ success: true, data: participants });
  } catch (error) {
    console.error(`Error fetching participants for event ${req.params.id}:`, error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

/**
 * @route   GET /api/v1/admin/analytics/:id
 * @desc    Get full analytics for a specific event
 * @access  Private (Admin)
 */
router.get('/analytics/:id', async (req, res) => {
  try {
    const eventId = req.params.id;

    // 1. Get all participants for the event
    const participations = await Participation.find({ eventId }).populate('userId', 'name email');
    const totalParticipants = participations.length;

    // 2. Get all engagement actions for the event
    const engagements = await Engagement.find({ eventId });

    const engagementBreakdown = {
      polls: engagements.filter(e => e.action === 'poll').length,
      questions: engagements.filter(e => e.action === 'qa').length,
      downloads: engagements.filter(e => e.action === 'download').length,
      timeSpent: 0, // We can calculate this if needed
    };

    // 3. Calculate top users by score
    const usersWithScores = await Promise.all(
      participations.map(async (p) => {
        if (!p.userId) return null;
        const score = await getUserEventScore(p.userId._id, eventId);
        return {
          id: p.userId._id,
          name: p.userId.name,
          score: score,
        };
      })
    );
    
    const validUsers = usersWithScores.filter(u => u !== null);
    // Sort users by score in descending order
    const topUsers = validUsers.sort((a, b) => b.score - a.score);

    // 4. Prepare timeline data (optional, can be expanded)
    const timelineData = []; // Placeholder for more advanced timeline analytics

    // 5. Assemble the final analytics object
    const analytics = {
      totalParticipants,
      engagementBreakdown,
      topUsers,
      timelineData,
    };

    res.json({ success: true, data: analytics });

  } catch (error) {
    console.error(`Error fetching analytics for event ${req.params.id}:`, error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

module.exports = router; 