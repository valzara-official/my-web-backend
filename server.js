require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const Node = require('./models/Node');

const app = express();
app.use(cors({
  origin: [
    'https://valzaria.com/',          // Tên miền riêng của bạn
    'https://www.valzaria.com',      // Dạng www (nếu có)
    'https://my-web-frontend.vercel.app', // URL mặc định của Vercel
    'http://localhost:5173'               // Cho phép chạy test ở local
  ],
  credentials: true
}));
app.use(express.json());

// Kết nối MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Đã kết nối MongoDB thành công'))
  .catch((err) => console.error('❌ Lỗi kết nối MongoDB:', err));

// 1. Lấy danh sách nhánh
app.get('/api/nodes', async (req, res) => {
  try {
    const nodes = await Node.find();
    res.json(nodes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. Thêm nhánh mới
app.post('/api/nodes', async (req, res) => {
  try {
    const { title, url, icon } = req.body;
    const newNode = new Node({ title, url, icon });
    await newNode.save();
    res.status(201).json(newNode);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// 3. Tăng lượt click
app.post('/api/nodes/:id/click', async (req, res) => {
  try {
    const node = await Node.findByIdAndUpdate(
      req.params.id,
      { $inc: { clicks: 1 } },
      { new: true }
    );
    if (!node) return res.status(404).json({ message: 'Không tìm thấy' });
    res.json(node);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));