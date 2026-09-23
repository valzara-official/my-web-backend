const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const authMiddleware = require('../middleware/authMiddleware'); // Đổi thành 'middlewares' nếu thư mục của bạn có chữ s
const roleMiddleware = require('../middleware/roleMiddleware'); // Đổi thành 'middlewares' nếu thư mục của bạn có chữ s

// 1. Lấy thông tin profile cá nhân
router.get('/profile', authMiddleware, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Lấy thông tin profile thành công!',
    user: req.user,
  });
});

// 2. Route thống kê hệ thống (Dành riêng cho Admin)
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

// 3. Route Cập nhật thông tin thành viên (Khớp với nút "Lưu thay đổi" từ giao diện Admin)
router.put('/users/:id', authMiddleware, roleMiddleware('ADMIN', 'LEADER'), async (req, res) => {
  try {
    const { id } = req.params;
    const { username, role, phone, gender, email, address, note, password } = req.body;

    const updateData = { username, role, phone, gender, email, address, note };

    // Nếu có nhập mật khẩu mới thì tiến hành mã hóa
    if (password && password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    const updatedUser = await User.findByIdAndUpdate(id, updateData, { 
      new: true, 
      runValidators: true 
    }).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy người dùng cần cập nhật.' 
      });
    }

    res.status(200).json({
      success: true,
      message: 'Cập nhật thông tin thành viên thành công!',
      data: updatedUser,
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi server: ' + error.message 
    });
  }
});

module.exports = router;