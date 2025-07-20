const jwt = require('jsonwebtoken');
const Participation = require('../models/Participation');
const Engagement = require('../models/Engagement');
const User = require('../models/User');

class SocketHandler {
  static io = null;
  constructor(io) {
    this.io = io;
    SocketHandler.io = io;
    this.setupSocketHandlers();
    this.startHeartbeat();
  }

  setupSocketHandlers() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication error'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');
        
        if (!user) {
          return next(new Error('User not found'));
        }

        socket.user = user;
        next();
      } catch (error) {
        next(new Error('Authentication error'));
      }
    });

    this.io.on('connection', (socket) => {
      console.log(`User ${socket.user.name} connected: ${socket.id}`);

      // Handle session join
      socket.on('session:join', async (data) => {
        try {
          const { eventId } = data;
          
          if (!eventId) {
            socket.emit('error', { message: 'Event ID is required' });
            return;
          }

          // Join the event room
          socket.join(eventId);
          socket.eventId = eventId;

          // Update or create participation record
          await Participation.findOneAndUpdate(
            { userId: socket.user._id, eventId },
            { 
              $set: { lastSeen: new Date() },
              $setOnInsert: { joinTime: new Date() }
            },
            { upsert: true, new: true }
          );

          // Get updated participant list
          const participants = await Participation.find({ eventId })
            .populate('userId', 'name email')
            .sort({ joinTime: 1 });

          // Emit session update to the room
          this.io.to(eventId).emit('session:update', {
            participants: participants.map(p => ({
              _id: p.userId._id,
              name: p.userId.name,
              email: p.userId.email,
              joinTime: p.joinTime,
              lastSeen: p.lastSeen
            })),
            eventId
          });

          console.log(`User ${socket.user.name} joined event ${eventId}`);
        } catch (error) {
          console.error('Session join error:', error);
          socket.emit('error', { message: 'Failed to join session' });
        }
      });

      // Handle poll submission
      socket.on('poll:submit', async (data) => {
        try {
          const { eventId, pollId, question, answer } = data;

          if (!eventId || !pollId) {
            socket.emit('error', { message: 'Event ID and Poll ID are required' });
            return;
          }

          // Log engagement
          const engagement = new Engagement({
            userId: socket.user._id,
            eventId,
            action: 'poll',
            metadata: { pollId, question, answer },
            timestamp: new Date()
          });

          await engagement.save();

          // Get updated poll results
          const pollEngagements = await Engagement.find({
            eventId,
            action: 'poll',
            'metadata.pollId': pollId
          });

          const pollResults = pollEngagements.reduce((acc, engagement) => {
            const answer = engagement.metadata.answer;
            acc[answer] = (acc[answer] || 0) + 1;
            return acc;
          }, {});

          // Emit poll update to the room
          this.io.to(eventId).emit('poll:update', {
            pollId,
            question,
            results: pollResults,
            totalVotes: pollEngagements.length
          });

          console.log(`Poll submitted by ${socket.user.name} for event ${eventId}`);
        } catch (error) {
          console.error('Poll submit error:', error);
          socket.emit('error', { message: 'Failed to submit poll' });
        }
      });

      // Handle QA submission
      socket.on('qa:submit', async (data) => {
        try {
          const { eventId, question, answer } = data;

          if (!eventId || !question) {
            socket.emit('error', { message: 'Event ID and question are required' });
            return;
          }

          // Log engagement
          const engagement = new Engagement({
            userId: socket.user._id,
            eventId,
            action: 'qa',
            metadata: { question, answer },
            timestamp: new Date()
          });

          await engagement.save();

          // Emit new QA to the room
          this.io.to(eventId).emit('qa:new', {
            question,
            answer,
            askedBy: {
              _id: socket.user._id,
              name: socket.user.name,
              email: socket.user.email
            },
            timestamp: new Date()
          });

          console.log(`QA submitted by ${socket.user.name} for event ${eventId}`);
        } catch (error) {
          console.error('QA submit error:', error);
          socket.emit('error', { message: 'Failed to submit QA' });
        }
      });

      // Handle disconnect
      socket.on('disconnect', async () => {
        try {
          if (socket.eventId) {
            // Update last seen when user disconnects
            await Participation.findOneAndUpdate(
              { userId: socket.user._id, eventId: socket.eventId },
              { lastSeen: new Date() }
            );

            // Get updated participant list
            const participants = await Participation.find({ eventId: socket.eventId })
              .populate('userId', 'name email')
              .sort({ joinTime: 1 });

            // Emit session update to remaining users
            this.io.to(socket.eventId).emit('session:update', {
              participants: participants.map(p => ({
                _id: p.userId._id,
                name: p.userId.name,
                email: p.userId.email,
                joinTime: p.joinTime,
                lastSeen: p.lastSeen
              })),
              eventId: socket.eventId
            });
          }

          console.log(`User ${socket.user.name} disconnected: ${socket.id}`);
        } catch (error) {
          console.error('Disconnect error:', error);
        }
      });
    });
  }

  startHeartbeat() {
    // Update lastSeen for all connected users every 30 seconds
    setInterval(async () => {
      try {
        const sockets = await this.io.fetchSockets();
        
        for (const socket of sockets) {
          if (socket.eventId && socket.user) {
            await Participation.findOneAndUpdate(
              { userId: socket.user._id, eventId: socket.eventId },
              { lastSeen: new Date() }
            );
          }
        }
      } catch (error) {
        console.error('Heartbeat error:', error);
      }
    }, 30000); // 30 seconds
  }
}

module.exports = SocketHandler; 