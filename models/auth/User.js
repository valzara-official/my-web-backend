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
  // 👇 Các trường thông tin mới được thêm vào
  code: {
    type: String,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    default: ''
  },
  phone: {
    type: String,
    trim: true,
    default: ''
  },
  address: {
    type: String,
    trim: true,
    default: ''
  },
  gender: {
    type: String,
    enum: ['Nam', 'Nữ', 'Khác'],
    default: 'Khác'
  },
  note: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  // Các trường thống kê online / thời gian hoạt động
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

// Middleware tự động tạo mã định danh (code) trước khi lưu nếu chưa có
userSchema.pre('save', async function(next) {
  if (!this.code) {
    const prefix = this.role === 'LEADER' ? 'L' : 'U';
    // Đếm số lượng user hiện có cùng role để tạo số thứ tự tiếp theo
    const count = await mongoose.model('User').countDocuments({ role: this.role });
    this.code = `${prefix}${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

module.exports = mongoose.model('User', userSchema);