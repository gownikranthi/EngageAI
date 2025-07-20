const Notification = require('../models/Notification');

async function createNotification(userId, message, link, io) {
  const notification = await Notification.create({ user: userId, message, link });
  if (io) {
    io.to(userId.toString()).emit('notification:new', notification);
  }
  return notification;
}

module.exports = { createNotification }; 