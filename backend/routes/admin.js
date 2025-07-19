const express = require('express');
const Event = require('../models/Event');
const Participation = require('../models/Participation');
const Engagement = require('../models/Engagement');
const User = require('../models/User');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

const router = express.Router();

// GET /api/v1/admin/analytics/:eventId
router.get('/analytics/:eventId', auth, admin, async (req, res) => {
  try {
    const { eventId } = req.params;

    // Validate ObjectId
    if (!eventId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID'
      });
    }

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Get participation statistics
    const totalParticipants = await Participation.countDocuments({ eventId });
    
    // Get engagement statistics
    const pollEngagements = await Engagement.countDocuments({ 
      eventId, 
      action: 'poll' 
    });
    const qaEngagements = await Engagement.countDocuments({ 
      eventId, 
      action: 'qa' 
    });
    const downloadEngagements = await Engagement.countDocuments({ 
      eventId, 
      action: 'download' 
    });

    // Get average session duration
    const participations = await Participation.find({ eventId });
    let totalDuration = 0;
    let activeParticipants = 0;

    participations.forEach(participation => {
      const duration = participation.lastSeen - participation.joinTime;
      if (duration > 0) {
        totalDuration += duration;
        activeParticipants++;
      }
    });

    const averageSessionDuration = activeParticipants > 0 
      ? Math.round((totalDuration / activeParticipants) / (1000 * 60)) // Convert to minutes
      : 0;

    // Get top participants by engagement
    const topParticipants = await Participation.aggregate([
      { $match: { eventId: event._id } },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $lookup: {
          from: 'engagements',
          let: { userId: '$userId', eventId: '$eventId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$userId', '$$userId'] },
                    { $eq: ['$eventId', '$$eventId'] }
                  ]
                }
              }
            }
          ],
          as: 'engagements'
        }
      },
      {
        $addFields: {
          engagementCount: { $size: '$engagements' },
          sessionDuration: {
            $divide: [
              { $subtract: ['$lastSeen', '$joinTime'] },
              1000 * 60 // Convert to minutes
            ]
          }
        }
      },
      {
        $project: {
          _id: 1,
          'user.name': 1,
          'user.email': 1,
          engagementCount: 1,
          sessionDuration: 1,
          joinTime: 1
        }
      },
      { $sort: { engagementCount: -1 } },
      { $limit: 10 }
    ]);

    const analytics = {
      event: {
        _id: event._id,
        name: event.name,
        description: event.description,
        startTime: event.startTime,
        endTime: event.endTime
      },
      participation: {
        totalParticipants,
        activeParticipants,
        averageSessionDuration
      },
      engagement: {
        totalPolls: pollEngagements,
        totalQA: qaEngagements,
        totalDownloads: downloadEngagements,
        totalEngagements: pollEngagements + qaEngagements + downloadEngagements
      },
      topParticipants
    };

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating analytics'
    });
  }
});

module.exports = router; 