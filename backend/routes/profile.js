const express = require('express');
const Participation = require('../models/Participation');
const Event = require('../models/Event');
const auth = require('../middleware/auth');
const { getUserEventScore } = require('../utils/score'); // Assume you have a helper for this

const router = express.Router();

// GET /api/v1/profile/my-history
router.get('/my-history', auth, async (req, res) => {
  try {
    const participations = await Participation.find({ userId: req.user._id }).populate('eventId');
    const history = await Promise.all(participations.map(async (p) => {
      const event = p.eventId;
      if (!event) return null;
      // Use your existing scoring logic
      const yourScore = await getUserEventScore(req.user._id, event._id);
      return {
        eventName: event.name,
        eventDate: event.startTime,
        yourScore,
      };
    }));
    res.json({ success: true, data: history.filter(Boolean) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch profile history' });
  }
});

module.exports = router; 