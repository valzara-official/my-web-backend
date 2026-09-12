const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Node = require('../../models/data/Node');

const JWT_SECRET = process.env.JWT_SECRET || 'valzaria_secret_key_2026';

// Middleware xác thực JWT Cookie dùng chung cho các route Admin
const verifyAdminToken = (req, res, next) => {
  const token = req.cookies.admin_token;
  if (!token) {
    return res.status(401).json({ success: false, message: 'Chưa đăng nhập hoặc phiên hết hạn' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { userId, username, role }
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: 'Token không hợp lệ' });
  }
};

// 1. PUBLIC API: Lấy danh sách các nút hiển thị ở Trang chủ & Trang User
router.get('/public/nodes', async (req, res) => {
  try {
    const nodes = await Node.find({ status: 'ACTIVE' }).sort({ createdAt: -1 });
    res.json(nodes);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách nhánh' });
  }
});

// 2. PUBLIC API: Tăng số lượt click khi người dùng bấm vào nút điều hướng
router.post('/public/nodes/:id/click', async (req, res) => {
  try {
    const node = await Node.findByIdAndUpdate(
      req.params.id,
      { $inc: { click_count: 1 } },
      { new: true }
    );
    res.json({ success: true, click_count: node ? node.click_count : 0 });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi cập nhật lượt click' });
  }
});

// 3. ADMIN & LEADER API: Lấy toàn bộ danh sách nút (Bao gồm cả ẩn/hiện)
router.get('/admin/nodes', verifyAdminToken, async (req, res) => {
  try {
    if (!['ADMIN', 'LEADER'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền truy cập' });
    }
    const nodes = await Node.find().sort({ createdAt: -1 });
    res.json(nodes); // Trả về MẢNG để frontend .map() an toàn
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi lấy dữ liệu quản trị' });
  }
});

// 4. ADMIN API: Tạo nút điều hướng mới
router.post('/admin/nodes', verifyAdminToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Chỉ Admin mới có quyền thêm nhánh mới' });
    }

    const { title, description, icon, url, status } = req.body;
    const newNode = new Node({
      title,
      description,
      icon,
      url,
      status: status || 'ACTIVE',
      createdBy: req.user.userId
    });

    await newNode.save();
    res.json({ success: true, node: newNode });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi thêm nhánh mới' });
  }
});

// 5. ADMIN API: Xóa nút điều hướng
router.delete('/admin/nodes/:id', verifyAdminToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Chỉ Admin mới có quyền xóa nhánh' });
    }

    await Node.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Xóa nhánh thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi xóa nhánh' });
  }
});

module.exports = router;