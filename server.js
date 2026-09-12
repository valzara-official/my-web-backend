require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Node = require('./models/Node');

const app = express();

const JWT_SECRET = process.env.JWT_SECRET || 'valzaria_secret_key_2026';

app.use(cors({
  origin: [
    'https://valzaria.com',          // Đã xóa dấu / ở cuối
    'https://www.valzaria.com',
    'https://my-web-frontend.vercel.app',
    'http://localhost:5173'
  ],
  credentials: true
}));
app.use(express.json());

// Kết nối MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Đã kết nối MongoDB thành công'))
  .catch((err) => console.error('❌ Lỗi kết nối MongoDB:', err));

// 🔑 ROUTE ĐĂNG NHẬP ADMIN (Đã bổ sung để hết lỗi 404)
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'admin123') {
    const token = jwt.sign({ username, role: 'ADMIN' }, JWT_SECRET, { expiresIn: '1d' });
    return res.json({ success: true, token });
  }
  return res.status(401).json({ success: false, message: 'Tên đăng nhập hoặc mật khẩu không đúng' });
});

// 1. Lấy danh sách nhánh (Public)
app.get('/api/public/nodes', async (req, res) => {
  try {
    const nodes = await Node.find();
    res.json(nodes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

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
app.post('/api/public/nodes/:id/click', async (req, res) => {
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