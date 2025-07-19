const express = require('express');
const Event = require('../models/Event');
const Participation = require('../models/Participation');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/v1/events
router.get('/', async (req, res) => {
  try {
    const events = await Event.find()
      .populate('createdBy', 'name email')
      .sort({ startTime: -1 });

    res.json({
      success: true,
      data: events
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching events'
    });
  }
});

// GET /api/v1/events/:id
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.json({
      success: true,
      data: event
    });
  } catch (error) {
    console.error('Get event error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while fetching event'
    });
  }
});

// POST /api/v1/events/:id/join
router.post('/:id/join', auth, async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user._id;

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if user is already participating
    const existingParticipation = await Participation.findOne({
      userId,
      eventId
    });

    if (existingParticipation) {
      return res.status(400).json({
        success: false,
        message: 'User is already participating in this event'
      });
    }

    // Create participation record
    const participation = new Participation({
      userId,
      eventId,
      joinTime: new Date(),
      lastSeen: new Date()
    });

    await participation.save();

    res.status(201).json({
      success: true,
      message: 'Successfully joined the event',
      data: participation
    });
  } catch (error) {
    console.error('Join event error:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'User is already participating in this event'
      });
    }
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while joining event'
    });
  }
});

module.exports = router; 