const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Lấy danh sách tất cả các Nodes / Dịch vụ (Public hoặc cần đăng nhập tùy bạn, ở đây để mở hoặc gắn auth)
router.get('/nodes', userController.getNodes);

// Tăng số lượt click (Public)
router.post('/nodes/:id/click', userController.incrementClick);

// Các thao tác quản trị dành cho ADMIN và LEADER
router.post('/admin/nodes', authMiddleware, roleMiddleware(['ADMIN', 'LEADER']), userController.createNode);
router.put('/admin/nodes/:id', authMiddleware, roleMiddleware(['ADMIN', 'LEADER']), userController.updateNode);
router.delete('/admin/nodes/:id', authMiddleware, roleMiddleware(['ADMIN', 'LEADER']), userController.deleteNode);

module.exports = router;