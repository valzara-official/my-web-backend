require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');

const User = require('./models/auth/User');
const authRoutes = require('./routes/auth/authRoutes');
const nodeRoutes = require('./routes/data/nodeRoutes');

// 1. KHỞI TẠO UNG DỤNG EXPRESS TRƯỚC CÁC CẤU HÌNH
const app = express();
const PORT = process.env.PORT || 5000;

// 2. Cấu hình Proxy & Middleware cơ bản
app.set('trust proxy', 1);
app.use(cookieParser());
app.use(express.json());

// 3. Cấu hình CORS
app.use(cors({
  origin: ['https://valzaria.com', 'https://www.valzaria.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 4. Rate Limiter chống brute-force đăng nhập
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

// Nạp Limiter cho API Đăng nhập
app.use('/api/auth/login', loginLimiter);

// 5. NẠP ROUTER ĐÃ CHIA TỰC THƯ MỤC ROUTES
app.use('/api/auth', authRoutes);
app.use('/api', nodeRoutes);

// 6. Khởi tạo tài khoản Admin mặc định (Nếu chưa có trong DB)
const initAdminAccount = async () => {
  try {
    const adminExist = await User.findOne({ username: 'admin' });
    if (!adminExist) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await User.create({ 
        username: 'admin', 
        password: hashedPassword,
        role: 'ADMIN' // Bổ sung quyền ADMIN
      });
      console.log('✅ Đã khởi tạo tài khoản Admin trong MongoDB');
    }
  } catch (err) {
    console.error('❌ Lỗi khởi tạo Admin:', err.message);
  }
};

// 7. Kết nối MongoDB & Lắng nghe cổng
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Đã kết nối MongoDB thành công');
    initAdminAccount();
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => console.error('❌ Lỗi kết nối MongoDB:', err));