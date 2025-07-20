const express = require('express');
const Event = require('../models/Event');
const Participation = require('../models/Participation');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const { eventValidation, handleValidationErrors } = require('../middleware/validation');
const AuditLog = require('../models/AuditLog');
const SocketHandler = require('../socket/socketHandler');
const { createNotification } = require('../utils/notification');
const User = require('../models/User');
const EventSummary = require('../models/EventSummary');
const { generateEventSummary } = require('../services/aiScribeService');

const router = express.Router();

// Helper for consistent API responses
function sendResponse(res, { success, message, data = null, errors = null, status = 200 }) {
  const response = { success, message };
  if (data !== null) response.data = data;
  if (errors !== null) response.errors = errors;
  return res.status(status).json(response);
}

/**
 * @swagger
 * /events:
 *   get:
 *     summary: Retrieve a list of all events
 *     description: Fetches all non-deleted events, supports pagination and search.
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of events per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for event name
 *     responses:
 *       200:
 *         description: A list of events.
 */
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

/**
 * @swagger
 * /events/{id}:
 *   get:
 *     summary: Get event by ID
 *     description: Fetch a single event by its ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Event details
 *       404:
 *         description: Event not found
 */
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

/**
 * @swagger
 * /events:
 *   post:
 *     summary: Create a new event
 *     description: Admin only. Creates a new event.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Event created
 *       400:
 *         description: Validation error
 */
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
    // Notify all users
    const allUsers = await User.find({});
    for (const u of allUsers) {
      await createNotification(u._id, `A new event "${event.name}" has been created!`, `/events/${event._id}`, req.app.get('io'));
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
        success: true,
        message: 'User is already participating in this event',
        data: existingParticipation
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

// POST /api/v1/events/:id/clone
router.post('/:id/clone', auth, admin, async (req, res) => {
  try {
    const original = await Event.findById(req.params.id);
    if (!original) {
      return sendResponse(res, { success: false, message: 'Original event not found', status: 404 });
    }
    const now = new Date();
    const startTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const endTime = new Date(startTime.getTime() + (original.endTime - original.startTime));
    const newEvent = new Event({
      name: `Copy of ${original.name}`,
      description: original.description,
      startTime,
      endTime,
      createdBy: req.user._id,
      polls: original.polls,
      resources: original.resources,
    });
    await newEvent.save();
    return sendResponse(res, { success: true, message: 'Event cloned successfully', data: newEvent, status: 201 });
  } catch (error) {
    return sendResponse(res, { success: false, message: 'Failed to clone event', status: 500 });
  }
});

// POST /api/v1/events/:id/generate-summary (admin only)
router.post('/:id/generate-summary', auth, admin, async (req, res) => {
  try {
    const summary = await generateEventSummary(req.params.id);
    res.status(201).json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to generate summary' });
  }
});

// GET /api/v1/events/:id/summary (public)
router.get('/:id/summary', async (req, res) => {
  try {
    const summary = await EventSummary.findOne({ eventId: req.params.id });
    if (!summary) return res.status(404).json({ success: false, message: 'Summary not found' });
    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch summary' });
  }
});

// Add resource to event
router.post('/:eventId/resources', auth, admin, async (req, res) => {
  try {
    const { fileName, fileUrl, description } = req.body;
    if (!fileName || !fileUrl) {
      return sendResponse(res, { success: false, message: 'File name and URL are required.', status: 400 });
    }
    const event = await Event.findById(req.params.eventId);
    if (!event) {
      return sendResponse(res, { success: false, message: 'Event not found', status: 404 });
    }
    const newResource = { fileName, fileUrl, description };
    event.resources = event.resources || [];
    event.resources.push(newResource);
    await event.save();
    return sendResponse(res, { success: true, message: 'Resource added', data: event });
  } catch (error) {
    console.error('Add resource error:', error);
    return sendResponse(res, { success: false, message: 'Failed to add resource', status: 500 });
  }
});

// Delete resource from event
router.delete('/:eventId/resources/:resourceId', auth, admin, async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) {
      return sendResponse(res, { success: false, message: 'Event not found', status: 404 });
    }
    event.resources = (event.resources || []).filter(r => r._id.toString() !== req.params.resourceId);
    await event.save();
    return sendResponse(res, { success: true, message: 'Resource deleted', data: event });
  } catch (error) {
    console.error('Delete resource error:', error);
    return sendResponse(res, { success: false, message: 'Failed to delete resource', status: 500 });
  }
});

module.exports = router;
