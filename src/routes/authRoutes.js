const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Định nghĩa các endpoints xác thực
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);

// Route kiểm tra trạng thái đăng nhập qua Cookie
router.get('/check', authMiddleware, authController.checkAuth);

// Route lấy danh sách toàn bộ users (Dành cho Admin/Leader)
router.get('/users', authMiddleware, roleMiddleware('ADMIN', 'LEADER'), authController.getUsers);

// Route cấp tài khoản (Dành cho Leader hoặc Admin)
router.post('/create-leader', authMiddleware, roleMiddleware('ADMIN', 'LEADER'), authController.register);

module.exports = router;