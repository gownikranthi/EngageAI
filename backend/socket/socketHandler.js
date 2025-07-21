const Event = require('../models/Event');
const Engagement = require('../models/Engagement');

class SocketHandler {
  constructor(io) {
    this.io = io;
    this.io.on('connection', (socket) => this.handleConnection(socket));
  }

  handleConnection(socket) {
    console.log(`Socket connected: ${socket.id}`);

    // Join user-specific room for notifications
    if (socket.user && socket.user._id) {
      socket.join(socket.user._id.toString());
    }

    socket.on('session:join', (eventId) => {
      socket.join(eventId);
      console.log(`Socket ${socket.id} joined event room: ${eventId}`);
    });

    // --- Poll Logic ---
    socket.on('poll:launch', async ({ eventId, pollId }) => {
      try {
        const event = await Event.findById(eventId);
        if (!event) return;
        event.polls.forEach(p => { p.isActive = (p._id.toString() === pollId); });
        await event.save();
        const poll = event.polls.id(pollId);
        this.io.to(eventId).emit('poll:new', poll);
      } catch (error) {
        console.error('Error launching poll:', error);
      }
    });

    socket.on('poll:vote', async ({ eventId, pollId, optionId, userId }) => {
      try {
        const event = await Event.findById(eventId);
        if (!event) return;
        const poll = event.polls.id(pollId);
        if (poll && poll.isActive) {
          const option = poll.options.id(optionId);
          if (option) {
            option.votes += 1;
            await event.save();
            // Log engagement
            if (userId) {
              await Engagement.create({ userId, eventId, action: 'poll', metadata: { pollId, optionId } });
            }
            this.io.to(eventId).emit('poll:update', poll);
          }
        }
      } catch (error) {
        console.error('Error processing vote:', error);
      }
    });

    // --- NEW: Q&A Logic ---
    socket.on('question:submit', async ({ eventId, questionText, user }) => {
      try {
        const event = await Event.findById(eventId);
        if (!event) return;

        const newQuestion = {
          text: questionText,
          author: user.id,
          authorName: user.name,
        };

        event.questions.push(newQuestion);
        await event.save();

        const createdQuestion = event.questions[event.questions.length - 1];
        // Log engagement
        if (user && user.id) {
          await Engagement.create({ userId: user.id, eventId, action: 'qa', metadata: { question: questionText } });
        }
        // Broadcast the new question to everyone in the event room
        this.io.to(eventId).emit('question:new', createdQuestion);
      } catch (error) {
        console.error('Error submitting question:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  }
}

module.exports = SocketHandler; 