const Product = require('../models/Product'); // Hoặc model Node/Service của bạn

// Lấy danh sách tất cả các Nodes / Dịch vụ
exports.getNodes = async (req, res) => {
  try {
    const nodes = await Product.find().sort({ createdAt: -1 });
    res.status(200).json(nodes);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server: ' + error.message });
  }
};

// Thêm mới một Node / Dịch vụ (Admin / Leader)
exports.createNode = async (req, res) => {
  try {
    const { title, url, description, category, icon, status } = req.body;

    if (!title || !url) {
      return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ tiêu đề và đường dẫn URL.' });
    }

    const newNode = await Product.create({
      title,
      url: url || req.body.target_url,
      description,
      category,
      icon: icon || '🌐',
      status: status || 'ACTIVE',
      clicks: 0,
    });

    res.status(201).json({
      success: true,
      message: 'Thêm node thành công!',
      data: newNode,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server: ' + error.message });
  }
};

// Cập nhật thông tin Node / Dịch vụ
exports.updateNode = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, url, description, category, icon, status } = req.body;

    const updatedNode = await Product.findByIdAndUpdate(
      id,
      {
        title,
        url: url || req.body.target_url,
        description,
        category,
        icon,
        status,
      },
      { new: true, runValidators: true }
    );

    if (!updatedNode) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy node cần cập nhật.' });
    }

    res.status(200).json({
      success: true,
      message: 'Cập nhật node thành công!',
      data: updatedNode,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server: ' + error.message });
  }
};

// Xóa một Node / Dịch vụ
exports.deleteNode = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedNode = await Product.findByIdAndDelete(id);
    if (!deletedNode) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy node cần xóa.' });
    }

    res.status(200).json({
      success: true,
      message: 'Xóa node thành công!',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server: ' + error.message });
  }
};

// Tăng số lượng lượt click khi user truy cập vào node
exports.incrementClick = async (req, res) => {
  try {
    const { id } = req.params;

    const node = await Product.findById(id);
    if (!node) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy node.' });
    }

    node.clicks = (node.clicks || 0) + 1;
    await node.save();

    res.status(200).json({
      success: true,
      message: 'Đã ghi nhận lượt click.',
      clicks: node.clicks,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server: ' + error.message });
  }
};