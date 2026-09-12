require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');

const Node = require('./models/Node');
const User = require('./models/User');

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'valzaria_secret_key_2026';

// 1. Cấu hình Proxy & Middleware cơ bản
app.set('trust proxy', 1);
app.use(cookieParser());
app.use(express.json());

// 2. Cấu hình CORS
app.use(cors({
  origin: [
    'https://valzaria.com',
    'https://www.valzaria.com',
    'https://my-web-frontend.vercel.app',
    'http://localhost:5173'
  ],
  credentials: true
}));

// 3. Cấu hình Rate Limiter chống brute-force
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 5, // Tối đa 5 lần
  message: {
    success: false,
    message: 'Bạn đã thử đăng nhập sai quá nhiều lần. Vui lòng thử lại sau 15 phút.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 4. Hàm khởi tạo Admin mặc định trong MongoDB
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

// 5. Kết nối MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Đã kết nối MongoDB thành công');
    initAdminAccount();
  })
  .catch((err) => console.error('❌ Lỗi kết nối MongoDB:', err));

// 6. Middleware xác thực Admin cho các route bảo mật
const authenticateAdmin = (req, res, next) => {
  const token = req.cookies.admin_token;
  if (!token) return res.status(401).json({ message: 'Chưa đăng nhập hoặc phiên làm việc hết hạn' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Token không hợp lệ' });
  }
};

// --- ROUTES ---

// 🔑 Route Đăng nhập (Dùng Rate Limit + Bcrypt + HttpOnly Cookie)
app.post('/api/auth/login', loginLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, message: 'Tài khoản hoặc mật khẩu không đúng' });
    }

    const token = jwt.sign({ userId: user._id, username: user.username }, JWT_SECRET, { expiresIn: '1d' });

    res.cookie('admin_token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 24 * 60 * 60 * 1000
    });

    return res.json({ success: true, message: 'Đăng nhập thành công' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 🚪 Route Đăng xuất
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('admin_token', {
    httpOnly: true,
    secure: true,
    sameSite: 'none'
  });
  return res.json({ success: true, message: 'Đã đăng xuất' });
});

// 🌐 Public Routes
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

// 🔒 Admin Protected Routes (Yêu cầu Cookie xác thực)
app.get('/api/admin/nodes', authenticateAdmin, async (req, res) => {
  try {
    const nodes = await Node.find();
    res.json(nodes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/admin/nodes', authenticateAdmin, async (req, res) => {
  try {
    const { title, url, icon } = req.body;
    const newNode = new Node({ title, url, icon });
    await newNode.save();
    res.status(201).json(newNode);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));