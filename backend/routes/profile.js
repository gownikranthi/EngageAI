const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Participation = require('../models/Participation');
const { getUserEventScore } = require('../utils/score'); // Correctly import the new helper

// GET /api/v1/profile/my-history
router.get('/my-history', auth, async (req, res) => {
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

module.exports = router; 