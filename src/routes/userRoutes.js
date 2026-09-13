const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Route mẫu dành riêng cho trang cá nhân hoặc thông tin người dùng (User / Leader / Admin)
router.get('/profile', authMiddleware, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Lấy thông tin profile thành công!',
    user: req.user,
  });
});

// Route mẫu quản lý thông tin người dùng nâng cao dành riêng cho Admin
router.get('/admin/stats', authMiddleware, roleMiddleware(['ADMIN']), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Lấy thống kê hệ thống thành công!',
    stats: {
      totalUsers: 10, // Ví dụ thống kê
      activeSessions: 3,
    },
  });
});

module.exports = router;