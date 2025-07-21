const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Participation = require('../models/Participation');
const { getUserEventScore } = require('../utils/score'); // Correctly import the new helper
const Event = require('../models/Event');

/**
 * @swagger
 * /api/v1/profile/event-history:
 *   get:
 *     summary: Get the event history for the logged-in user
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of events the user has participated in.
 *       500:
 *         description: Server Error
 */
router.get('/event-history', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Find all events the user has participated in
    const participations = await Participation.find({ userId }).populate('eventId', 'name startTime');

    if (!participations) {
      return res.json({ success: true, data: [] });
    }

    // For each participation, get the event details and calculate the score
    const history = await Promise.all(participations.map(async (p) => {
      if (!p.eventId) return null; // Skip if event was deleted

      const score = await getUserEventScore(userId, p.eventId._id);
      return {
        eventName: p.eventId.name,
        eventDate: p.eventId.startTime,
        yourScore: score,
      };
    }));

    // Filter out any null results from deleted events
    const validHistory = history.filter(item => item !== null);

    res.json({ success: true, data: validHistory });

  } catch (error) {
    console.error('Error fetching user history:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

/**
 * @swagger
 * /api/v1/profile/score/{eventId}:
 *   get:
 *     summary: Get the user's score for a specific event
 *     tags: [Profile]
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
 *         description: The user's engagement score for the event.
 *       500:
 *         description: Server Error
 */
router.get('/score/:eventId', auth, async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const userId = req.user.id;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const score = await getUserEventScore(userId, eventId);
    res.json({ success: true, data: { eventName: event.name, yourScore: score } });

  } catch (error) {
    console.error('Error fetching user score:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

module.exports = router; 