const express = require('express');
const Engagement = require('../models/Engagement');
const auth = require('../middleware/auth');
const { validationResult, check } = require('express-validator');

const router = express.Router();

/**
 * @swagger
 * /api/v1/engage/log:
 *   post:
 *     summary: Log a user engagement action
 *     tags: [Engagement]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - eventId
 *               - action
 *             properties:
 *               eventId:
 *                 type: string
 *               action:
 *                 type: string
 *               details:
 *                 type: object
 *     responses:
 *       201:
 *         description: Engagement logged successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server Error
 */
router.post(
  '/log',
  auth,
  [
    check('eventId', 'Event ID is required').not().isEmpty(),
    check('action', 'Action is required').not().isEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { eventId, action, details } = req.body;
      const userId = req.user._id;

      // Create engagement record
      const engagement = new Engagement({
        userId,
        eventId,
        action,
        details: details || {},
        timestamp: new Date()
      });

      await engagement.save();

      res.status(201).json({
        success: true,
        message: 'Engagement logged successfully',
        data: engagement
      });
    } catch (error) {
      console.error('Engagement logging error:', error);
      if (error.kind === 'ObjectId') {
        return res.status(400).json({
          success: false,
          message: 'Invalid event ID'
        });
      }
      res.status(500).json({
        success: false,
        message: 'Server error while logging engagement'
      });
    }
  }
);

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