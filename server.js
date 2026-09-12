require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); // Thêm bcryptjs

const Node = require('./models/Node');
const User = require('./models/User'); // Thêm Model User

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'valzaria_secret_key_2026';

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

// Hàm tạo tài khoản Admin mặc định vào MongoDB (nếu chưa có)
const initAdminAccount = async () => {
  try {
    const adminExist = await User.findOne({ username: 'admin' });
    if (!adminExist) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await User.create({ username: 'admin', password: hashedPassword });
      console.log('✅ Đã khởi tạo tài khoản Admin mã hóa trong MongoDB');
    }
  } catch (err) {
    console.error('❌ Lỗi khởi tạo Admin:', err.message);
  }
};

// Kết nối MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Đã kết nối MongoDB thành công');
    initAdminAccount(); // Khởi tạo admin sau khi kết nối DB
  })
  .catch((err) => console.error('❌ Lỗi kết nối MongoDB:', err));

// 🔑 ROUTE ĐĂNG NHẬP ADMIN (Dùng Bcrypt + MongoDB)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // 1. Tìm user trong MongoDB
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Tài khoản hoặc mật khẩu không đúng' });
    }

    // 2. So sánh mật khẩu nhập vào với mật khẩu đã mã hóa trong DB
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Tài khoản hoặc mật khẩu không đúng' });
    }

    // 3. Tạo JWT Token
    const token = jwt.sign({ userId: user._id, username: user.username }, JWT_SECRET, { expiresIn: '1d' });
    return res.json({ success: true, token });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// --- Các route public & nodes giữ nguyên ---
app.get('/api/public/nodes', async (req, res) => {
  try {
    const nodes = await Node.find();
    res.json(nodes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

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