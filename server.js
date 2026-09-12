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

// 1. Khởi tạo ứng dụng Express
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
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: 'Bạn đã thử đăng nhập sai quá nhiều lần. Vui lòng thử lại sau 15 phút.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Nạp Rate Limiter trực tiếp cho endpoint đăng nhập
app.use('/api/auth/login', loginLimiter);

// 5. Nạp Routers từ thư mục modular
app.use('/api/auth', authRoutes);
app.use('/api', nodeRoutes);

// 6. Khởi tạo / Đồng bộ hóa tài khoản Admin
const initAdminAccount = async () => {
  try {
    const adminExist = await User.findOne({ username: 'admin' });
    const hashedPassword = await bcrypt.hash('123654', 10);

    if (!adminExist) {
      await User.create({ 
        username: 'admin', 
        password: hashedPassword,
        role: 'ADMIN'
      });
      console.log('✅ Đã tạo tài khoản Admin mới (Mật khẩu: 123654)');
    } else {
      // Tự động cập nhật lại mật khẩu mới và role ADMIN nếu record cũ bị sai
      adminExist.password = hashedPassword;
      adminExist.role = 'ADMIN';
      await adminExist.save();
      console.log('✅ Đã đồng bộ mật khẩu 123654 và role ADMIN cho tài khoản admin');
    }
  } catch (err) {
    console.error('❌ Lỗi khởi tạo/đồng bộ Admin:', err.message);
  }
};

// 7. Kết nối MongoDB & Khởi chạy Server
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Đã kết nối MongoDB thành công');
    initAdminAccount();
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => console.error('❌ Lỗi kết nối MongoDB:', err));