const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const { check, validationResult } = require('express-validator');

/**
 * @swagger
 * /api/v1/polls/{eventId}:
 *   post:
 *     summary: Create a new poll for an event
 *     tags: [Polls]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the event to add the poll to
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - question
 *               - options
 *             properties:
 *               question:
 *                 type: string
 *               options:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Poll created successfully
 *       400:
 *         description: Bad request or validation error
 *       404:
 *         description: Event not found
 *       500:
 *         description: Server Error
 */
// POST /api/v1/polls/:eventId - Create a new poll for an event
router.post(
  '/:eventId',
  [
    auth,
    admin,
    [
      check('question', 'Poll question is required').not().isEmpty(),
      check('options', 'Poll must have at least two options').isArray({ min: 2 }),
      check('options.*', 'Each option must be a non-empty string').isString().not().isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const event = await Event.findById(req.params.eventId);
      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }

      const { question, options } = req.body;
      const newPoll = {
        question,
        options: options.map(optionText => ({ text: optionText, votes: 0 })),
        isActive: false
      };

      event.polls.push(newPoll);
      await event.save();

      // Return the newly created poll with its ID
      const createdPoll = event.polls[event.polls.length - 1];
      res.status(201).json({ success: true, data: createdPoll, message: 'Poll created successfully' });

    } catch (error) {
      console.error('Error creating poll:', error);
      res.status(500).json({ message: 'Server Error' });
    }
  }
);

module.exports = router; 