const express = require('express');
const router = express.Router();
const Node = require('../../models/data/Node');

// 1. PUBLIC API: Lấy danh sách các nút hiển thị ở Trang chủ & Trang User
router.get('/public/nodes', async (req, res) => {
  try {
    const nodes = await Node.find({ status: 'ACTIVE' }).sort({ createdAt: -1 });
    res.json(nodes);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách nhánh' });
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
    res.status(500).json({ message: 'Lỗi khi cập nhật lượt click' });
  }
});

// 3. ADMIN & LEADER API: Lấy toàn bộ danh sách nút (Bao gồm cả ẩn/hiện)
router.get('/admin/nodes', async (req, res) => {
  try {
    if (!req.session || !['ADMIN', 'LEADER'].includes(req.session.role)) {
      return res.status(403).json({ message: 'Bạn không có quyền truy cập' });
    }
    const nodes = await Node.find().sort({ createdAt: -1 });
    res.json(nodes);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy dữ liệu quản trị' });
  }
});

// 4. ADMIN API: Tạo nút điều hướng mới
router.post('/admin/nodes', async (req, res) => {
  try {
    if (!req.session || req.session.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Chỉ Admin mới có quyền thêm nhánh mới' });
    }

    const { title, description, icon, url, status } = req.body;
    const newNode = new Node({
      title,
      description,
      icon,
      url,
      status: status || 'ACTIVE',
      createdBy: req.session.userId
    });

    await newNode.save();
    res.json({ success: true, node: newNode });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi thêm nhánh mới' });
  }
});

// 5. ADMIN API: Xóa nút điều hướng
router.delete('/admin/nodes/:id', async (req, res) => {
  try {
    if (!req.session || req.session.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Chỉ Admin mới có quyền xóa nhánh' });
    }

    await Node.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Xóa nhánh thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi xóa nhánh' });
  }
});

module.exports = router;