const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['order', 'system', 'user'],
    default: 'order'
  },
  read: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 604800 // Automatically delete notifications after 7 days to save space
  }
});

module.exports = mongoose.model('Notification', notificationSchema);