const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const authMiddleware = require('../middleware/authMiddleware'); // Hoặc 'middlewares' tùy dự án của bạn
const roleMiddleware = require('../middleware/roleMiddleware');

// 🟢 1. THÊM ROUTE NÀY: Lấy danh sách toàn bộ người dùng cho trang quản trị
router.get('/', authMiddleware, roleMiddleware('ADMIN', 'LEADER'), async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server: ' + error.message });
  }
});

// (Phòng hờ trường hợp frontend gọi vào /api/admin/users hoặc /api/users/users)
router.get('/users', authMiddleware, roleMiddleware('ADMIN', 'LEADER'), async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server: ' + error.message });
  }
});

// 2. Lấy thông tin profile cá nhân
router.get('/profile', authMiddleware, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Lấy thông tin profile thành công!',
    user: req.user,
  });
});

// 3. Route thống kê hệ thống (Dành riêng cho Admin)
router.get('/admin/stats', authMiddleware, roleMiddleware('ADMIN'), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Lấy thống kê hệ thống thành công!',
    stats: {
      totalUsers: 10,
      activeSessions: 3,
    },
  });
});

// 4. Route Cập nhật thông tin thành viên
router.put('/users/:id', authMiddleware, roleMiddleware('ADMIN', 'LEADER'), async (req, res) => {
  try {
    const { id } = req.params;
    const { username, role, phone, gender, email, address, note, password } = req.body;

    const updateData = { username, role, phone, gender, email, address, note };

    if (password && password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    const updatedUser = await User.findByIdAndUpdate(id, updateData, { 
      new: true, 
      runValidators: true 
    }).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng cần cập nhật.' });
    }

    res.status(200).json({
      success: true,
      message: 'Cập nhật thông tin thành viên thành công!',
      data: updatedUser,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server: ' + error.message });
  }
});

module.exports = router;