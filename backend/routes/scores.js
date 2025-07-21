const express = require('express');
const Engagement = require('../models/Engagement');
const Participation = require('../models/Participation');
const auth = require('../middleware/auth');
const { check, validationResult } = require('express-validator');
const { getUserEventScore } = require('../utils/score');
const Event = require('../models/Event');

const router = express.Router();

/**
 * @swagger
 * /api/v1/scores/event/{eventId}:
 *   get:
 *     summary: Get user's score for a specific event
 *     tags: [Scores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: The event ID
 *     responses:
 *       200:
 *         description: The user's score for the event.
 *       404:
 *         description: Event not found.
 *       500:
 *         description: Server Error.
 */
router.get('/event/:eventId', auth, async (req, res) => {
  try {
    const { eventId } = req.params;

    // Validate ObjectId
    if (!eventId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID'
      });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const userId = req.user._id;

    // Check if user is requesting their own scores or is admin
    if (req.user._id.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own scores.'
      });
    }

    const score = await getUserEventScore(userId, eventId);

    res.json({
      success: true,
      data: {
        totalScore: Math.round(score.totalScore * 100) / 100,
        breakdown: score.breakdown
      }
    });
  } catch (error) {
    console.error('Get event score error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while calculating event score'
    });
  }
});

/**
 * @swagger
 * /api/v1/scores/leaderboard/{eventId}:
 *   get:
 *     summary: Get the leaderboard for a specific event
 *     tags: [Scores]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: The event ID
 *     responses:
 *       200:
 *         description: The event leaderboard.
 *       404:
 *         description: Event not found.
 *       500:
 *         description: Server Error.
 */
router.get('/leaderboard/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;

    // Validate ObjectId
    if (!eventId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID'
      });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const leaderboard = await Participation.find({ eventId })
      .populate('userId', 'username')
      .sort({ totalScore: -1 });

    res.json({
      success: true,
      data: leaderboard
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching leaderboard'
    });
  }
});

module.exports = router; 