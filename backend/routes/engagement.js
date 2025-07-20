const express = require('express');
const Engagement = require('../models/Engagement');
const auth = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /engage/download:
 *   post:
 *     summary: Log a download engagement
 *     description: Records a download engagement for a user and event.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               eventId:
 *                 type: string
 *               metadata:
 *                 type: object
 *     responses:
 *       201:
 *         description: Download engagement recorded
 *       400:
 *         description: Missing or invalid event ID
 */
// POST /api/v1/engage/download
router.post('/download', auth, async (req, res) => {
  try {
    const { eventId, metadata } = req.body;
    const userId = req.user._id;

    if (!eventId) {
      return res.status(400).json({
        success: false,
        message: 'Event ID is required'
      });
    }

    // Create engagement record
    const engagement = new Engagement({
      userId,
      eventId,
      action: 'download',
      metadata: metadata || {},
      timestamp: new Date()
    });

    await engagement.save();

    res.status(201).json({
      success: true,
      message: 'Download engagement recorded',
      data: engagement
    });
  } catch (error) {
    console.error('Download engagement error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while recording download engagement'
    });
  }
});

module.exports = router; 