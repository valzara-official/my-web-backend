const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const User = require('./models/User'); // 🟢 Thêm import Model User
const bcrypt = require('bcryptjs');     // 🟢 Thêm import bcrypt để mã hóa mật khẩu

dotenv.config();

// Hàm tự động tạo tài khoản admin mặc định khi khởi động server
const createDefaultAdmin = async () => {
  try {
    const adminExists = await User.findOne({ username: 'admin1' });
    if (!adminExists) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('123654', salt);

      await User.create({
        username: 'admin1',
        password: hashedPassword,
        role: 'ADMIN',
        email: 'admin1@valzaria.com',
        phone: '0987654321',
      });
      console.log('✅ Đã tự động tạo tài khoản admin mặc định: admin1 / 123654');
    } else {
      console.log('ℹ️ Tài khoản admin1 đã tồn tại trong hệ thống.');
    }
  } catch (error) {
    console.error('❌ Lỗi khi khởi tạo tài khoản admin mặc định:', error.message);
  }
};

// Khởi kết nối Database và gọi hàm tạo Admin
connectDB().then(() => {
  createDefaultAdmin();
});

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const allowedOrigins = [
  'http://localhost:5173',
  'https://www.valzaria.com',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.some(domain => origin.endsWith('.vercel.app'))) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

// Khai báo các Routes API
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const userRoutes = require('./routes/userRoutes');

app.use('/api/auth', authRoutes);
app.use('/api', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', userRoutes);

app.get('/', (req, res) => {
  res.status(200).json({ success: true, message: 'API Server is running smoothly!' });
});

app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'Đường dẫn API không tồn tại.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server đang chạy tại cổng ${PORT}`);
});