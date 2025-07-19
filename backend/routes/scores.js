const express = require('express');
const Engagement = require('../models/Engagement');
const Participation = require('../models/Participation');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/v1/scores/:userId/:eventId
router.get('/:userId/:eventId', auth, async (req, res) => {
  try {
    const { userId, eventId } = req.params;

    // Validate ObjectIds
    if (!userId.match(/^[0-9a-fA-F]{24}$/) || !eventId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID or event ID'
      });
    }

    // Check if user is requesting their own scores or is admin
    if (req.user._id.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own scores.'
      });
    }

    // Calculate poll score
    const pollEngagements = await Engagement.find({
      userId,
      eventId,
      action: 'poll'
    });
    const pollScore = pollEngagements.length * 10;

    // Calculate QA score
    const qaEngagements = await Engagement.find({
      userId,
      eventId,
      action: 'qa'
    });
    const qaScore = qaEngagements.length * 15;

    // Calculate download score
    const downloadEngagements = await Engagement.find({
      userId,
      eventId,
      action: 'download'
    });
    const downloadScore = downloadEngagements.length * 5;

    // Calculate time score
    const participation = await Participation.findOne({
      userId,
      eventId
    });

    let timeScore = 0;
    if (participation) {
      const timeDiffMs = participation.lastSeen - participation.joinTime;
      const timeDiffMinutes = Math.floor(timeDiffMs / (1000 * 60));
      timeScore = timeDiffMinutes * 0.2;
    }

    // Calculate total score
    const totalScore = pollScore + qaScore + downloadScore + timeScore;

    const breakdown = {
      pollScore,
      qaScore,
      downloadScore,
      timeScore: Math.round(timeScore * 100) / 100 // Round to 2 decimal places
    };

    res.json({
      success: true,
      data: {
        totalScore: Math.round(totalScore * 100) / 100,
        breakdown
      }
    });
  } catch (error) {
    console.error('Get scores error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while calculating scores'
    });
  }
});

module.exports = router; 