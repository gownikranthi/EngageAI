const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const User = require('../models/User');
const Participation = require('../models/Participation');
const Event = require('../models/Event');
const Engagement = require('../models/Engagement');
const { getUserEventScore } = require('../utils/score');

// Protect all routes in this file for admins
router.use(auth, admin);

/**
 * @swagger
 * /api/v1/admin/analytics/{id}:
 *   get:
 *     summary: Get full analytics for a specific event
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The event ID
 *     responses:
 *       200:
 *         description: Event analytics data fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       500:
 *         description: Server Error
 */
router.get('/analytics/:id', async (req, res) => {
  try {
    const eventId = req.params.id;

    // 1. Get participants
    const participations = await Participation.find({ eventId }).populate('userId', 'name email');
    const totalParticipants = participations.length;

    // 2. Get engagement actions
    const engagements = await Engagement.find({ eventId });
    const engagementBreakdown = {
      polls: engagements.filter(e => e.action === 'poll').length,
      questions: engagements.filter(e => e.action === 'qa').length,
      downloads: engagements.filter(e => e.action === 'download').length,
    };

    // 3. Calculate top users
    const usersWithScores = await Promise.all(
      participations.map(async (p) => {
        if (!p.userId) return null;
        const score = await getUserEventScore(p.userId._id, eventId);
        return { id: p.userId._id, name: p.userId.name, email: p.userId.email, score };
      })
    );
    const topUsers = usersWithScores.filter(u => u !== null).sort((a, b) => b.score - a.score);

    // 4. Assemble the final analytics object
    const analytics = { totalParticipants, engagementBreakdown, topUsers, timelineData: [] };
    res.json({ success: true, data: analytics });

  } catch (error) {
    console.error(`Error fetching analytics for event ${req.params.id}:`, error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

/**
 * @swagger
 * /api/v1/admin/users:
 *   get:
 *     summary: Get all users
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         description: Server Error
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
 * @swagger
 * /api/v1/admin/events/{id}/participants:
 *   get:
 *     summary: Get participants for a specific event
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The event ID
 *     responses:
 *       200:
 *         description: A list of event participants
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         description: Server Error
 */
router.get('/events/:id/participants', async (req, res) => {
  try {
    const participations = await Participation.find({ eventId: req.params.id })
      .populate('userId', 'name email');
    const participants = participations.map(p => p.userId).filter(Boolean); // Filter out null/deleted users
    res.json({ success: true, data: participants });
  } catch (error) {
    console.error(`Error fetching participants for event ${req.params.id}:`, error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

module.exports = router; 