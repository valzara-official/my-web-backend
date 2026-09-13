const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['USER', 'LEADER', 'ADMIN'],
    default: 'USER'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  // 👇 THÊM 3 TRƯỜNG NÀY VÀO ĐỂ HỖ TRỢ THỐNG KÊ ONLINE / THỜI GIAN HOẠT ĐỘNG
  isOnline: {
    type: Boolean,
    default: false
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  totalActiveMinutes: {
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model('User', userSchema);