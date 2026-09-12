require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const Node = require('./models/Node');

const app = express();

// =========================
// CORS
// =========================
app.use(cors({
  origin: [
    'https://valzaria.com',
    'https://www.valzaria.com',
    'https://my-web-frontend.vercel.app',
    'http://localhost:5173'
  ],
  credentials: true
}));

app.use(express.json());

// =========================
// KẾT NỐI MONGODB
// =========================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Đã kết nối MongoDB thành công'))
  .catch((err) => console.error('❌ Lỗi kết nối MongoDB:', err));

// =========================
// TEST SERVER
// =========================
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Backend đang hoạt động!'
  });
});

// =========================
// LOGIN ADMIN
// =========================
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Kiểm tra dữ liệu
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập email và mật khẩu'
      });
    }

    // Tạm thời dùng tài khoản cố định
    // Sau này có thể chuyển sang MongoDB
    if (
      email === process.env.ADMIN_EMAIL &&
      password === process.env.ADMIN_PASSWORD
    ) {
      return res.json({
        success: true,
        message: 'Đăng nhập thành công',
        user: {
          email: email,
          role: 'admin'
        }
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Email hoặc mật khẩu không đúng'
    });

  } catch (err) {
    console.error('❌ Lỗi login:', err);

    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
});

// =========================
// LẤY DANH SÁCH NHÁNH
// =========================
app.get('/api/nodes', async (req, res) => {
  try {
    const nodes = await Node.find();
    res.json(nodes);
  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
});

// =========================
// THÊM NHÁNH MỚI
// =========================
app.post('/api/nodes', async (req, res) => {
  try {
    const { title, url, icon } = req.body;

    const newNode = new Node({
      title,
      url,
      icon
    });

    await newNode.save();

    res.status(201).json(newNode);

  } catch (err) {
    res.status(400).json({
      message: err.message
    });
  }
});

// =========================
// TĂNG LƯỢT CLICK
// =========================
app.post('/api/nodes/:id/click', async (req, res) => {
  try {
    const node = await Node.findByIdAndUpdate(
      req.params.id,
      { $inc: { clicks: 1 } },
      { new: true }
    );

    if (!node) {
      return res.status(404).json({
        message: 'Không tìm thấy'
      });
    }

    res.json(node);

  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
});

// =========================
// START SERVER
// =========================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});