const express = require('express');
const Event = require('../models/Event');
const Participation = require('../models/Participation');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const { eventValidation, handleValidationErrors } = require('../middleware/validation');
const AuditLog = require('../models/AuditLog');
const SocketHandler = require('../socket/socketHandler');

const router = express.Router();

// Helper for consistent API responses
function sendResponse(res, { success, message, data = null, errors = null, status = 200 }) {
  const response = { success, message };
  if (data !== null) response.data = data;
  if (errors !== null) response.errors = errors;
  return res.status(status).json(response);
}

// GET /api/v1/events
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    // FIX #1: Removed 'as string' TypeScript syntax
    const limit = parseInt(req.query.limit) || 10; 
    // FIX #2: Removed 'as string' TypeScript syntax
    const search = req.query.search; 

    const filter = { isDeleted: false };
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    const total = await Event.countDocuments(filter);
    const events = await Event.find(filter)
      .populate('createdBy', 'name email')
      .sort({ startTime: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return sendResponse(res, {
      success: true,
      message: 'Events fetched successfully',
      data: { events, total, page, limit }
    });
  } catch (error) {
    console.error('Get events error:', error);
    return sendResponse(res, {
      success: false,
      message: 'Server error while fetching events',
      status: 500
    });
  }
});

// GET /api/v1/events/:id
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findOne({ _id: req.params.id, isDeleted: false })
      .populate('createdBy', 'name email');

    if (!event) {
      return sendResponse(res, {
        success: false,
        message: 'Event not found',
        status: 404
      });
    }

    return sendResponse(res, {
      success: true,
      message: 'Event fetched successfully',
      data: event
    });
  } catch (error) {
    console.error('Get event error:', error);
    if (error.kind === 'ObjectId') {
      return sendResponse(res, {
        success: false,
        message: 'Invalid event ID',
        status: 400
      });
    }
    return sendResponse(res, {
      success: false,
      message: 'Server error while fetching event',
      status: 500
    });
  }
});

// POST /api/v1/events
router.post('/', auth, admin, eventValidation, handleValidationErrors, async (req, res) => {
  try {
    const { name, description, startTime, endTime } = req.body;
    // Check for duplicate name (case-insensitive, not deleted)
    const duplicate = await Event.findOne({ name: { $regex: `^${name}$`, $options: 'i' }, isDeleted: false });
    if (duplicate) {
      return sendResponse(res, {
        success: false,
        message: 'An event with this name already exists.',
        status: 400
      });
    }
    // Check for overlapping time (not deleted)
    const overlap = await Event.findOne({
      isDeleted: false,
      $or: [
        { startTime: { $lt: endTime }, endTime: { $gt: startTime } }
      ]
    });
    if (overlap) {
      return sendResponse(res, {
        success: false,
        message: 'Event time overlaps with another event.',
        status: 400
      });
    }
    const event = new Event({
      name,
      description,
      startTime,
      endTime,
      createdBy: req.user._id
    });
    await event.save();
    const populatedEvent = await Event.findById(event._id).populate('createdBy', 'name email');
    // Audit log
    await AuditLog.create({
      action: 'create',
      entity: 'Event',
      entityId: event._id,
      performedBy: req.user._id,
      details: { event: populatedEvent }
    });
    // Emit real-time notification to all students
    if (SocketHandler.io) {
      SocketHandler.io.emit('new_event_created', {
        eventId: event._id,
        name: event.name,
        createdAt: event.createdAt,
        createdBy: {
          _id: req.user._id,
          name: req.user.name,
          email: req.user.email
        }
      });
    }
    return sendResponse(res, {
      success: true,
      message: 'Event created successfully',
      data: populatedEvent,
      status: 201 // Use 201 for resource creation
    });
  } catch (error) {
    console.error('Create event error:', error);
    return sendResponse(res, {
      success: false,
      message: 'Server error while creating event',
      status: 500
    });
  }
});

// PUT /api/v1/events/:id
router.put('/:id', auth, admin, eventValidation, handleValidationErrors, async (req, res) => {
  try {
    const { name, description, startTime, endTime } = req.body;
    // Check for duplicate name (case-insensitive, not deleted, not self)
    const duplicate = await Event.findOne({
      _id: { $ne: req.params.id },
      name: { $regex: `^${name}$`, $options: 'i' },
      isDeleted: false
    });
    if (duplicate) {
      return sendResponse(res, {
        success: false,
        message: 'An event with this name already exists.',
        status: 400
      });
    }
    // Check for overlapping time (not deleted, not self)
    const overlap = await Event.findOne({
      _id: { $ne: req.params.id },
      isDeleted: false,
      $or: [
        { startTime: { $lt: endTime }, endTime: { $gt: startTime } }
      ]
    });
    if (overlap) {
      return sendResponse(res, {
        success: false,
        message: 'Event time overlaps with another event.',
        status: 400
      });
    }
    const before = await Event.findOne({ _id: req.params.id, isDeleted: false });
    const event = await Event.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { name, description, startTime, endTime },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');
    if (!event) {
      return sendResponse(res, {
        success: false,
        message: 'Event not found',
        status: 404
      });
    }
    // Audit log
    await AuditLog.create({
      action: 'update',
      entity: 'Event',
      entityId: event._id,
      performedBy: req.user._id,
      details: { before, after: event }
    });
    return sendResponse(res, {
      success: true,
      message: 'Event updated successfully',
      data: event
    });
  } catch (error) {
    console.error('Update event error:', error);
    return sendResponse(res, {
      success: false,
      message: 'Server error while updating event',
      status: 500
    });
  }
});

// DELETE /api/v1/events/:id
router.delete('/:id', auth, admin, async (req, res) => {
  try {
    const before = await Event.findOne({ _id: req.params.id, isDeleted: false });
    const event = await Event.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );
    if (!event) {
      return sendResponse(res, {
        success: false,
        message: 'Event not found',
        status: 404
      });
    }
    // Audit log
    await AuditLog.create({
      action: 'delete',
      entity: 'Event',
      entityId: event._id,
      performedBy: req.user._id,
      details: { before }
    });
    return sendResponse(res, {
      success: true,
      message: 'Event deleted successfully (soft delete)'
    });
  } catch (error) {
    console.error('Delete event error:', error);
    return sendResponse(res, {
      success: false,
      message: 'Server error while deleting event',
      status: 500
    });
  }
});

// POST /api/v1/events/:id/join
router.post('/:id/join', auth, async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user._id;

    // Check if event exists
    const event = await Event.findOne({ _id: eventId, isDeleted: false });
    if (!event) {
      return sendResponse(res, {
        success: false,
        message: 'Event not found',
        status: 404
      });
    }

    // Check if user is already participating
    const existingParticipation = await Participation.findOne({
      userId,
      eventId
    });

    if (existingParticipation) {
      return sendResponse(res, {
        success: false,
        message: 'User is already participating in this event',
        status: 400
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

    return sendResponse(res, {
      success: true,
      message: 'Successfully joined the event',
      data: participation
    });
  } catch (error) {
    console.error('Join event error:', error);
    if (error.code === 11000) {
      return sendResponse(res, {
        success: false,
        message: 'User is already participating in this event',
        status: 400
      });
    }
    if (error.kind === 'ObjectId') {
      return sendResponse(res, {
        success: false,
        message: 'Invalid event ID',
        status: 400
      });
    }
    return sendResponse(res, {
      success: false,
      message: 'Server error while joining event',
      status: 500
    });
  }
});

module.exports = router;
