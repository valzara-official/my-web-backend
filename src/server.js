const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');

// Load biến môi trường từ file .env
dotenv.config();

// Khởi tạo kết nối Database MongoDB
connectDB();

const app = express();

// Cấu hình Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Danh sách các Domain được phép gọi API (Hỗ trợ cả Localhost, Domain chính thức và các nhánh Vercel)
const allowedOrigins = [
  'http://localhost:5173',
  'https://www.valzaria.com',
  process.env.CLIENT_URL
].filter(Boolean); // Lọc bỏ giá trị undefined nếu chưa khai báo

// Cấu hình CORS chuẩn cho phép gửi kèm cookie credentials
app.use(
  cors({
    origin: function (origin, callback) {
      // Cho phép các tool test API như Postman hoặc server-to-server request không có origin
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
app.use('/api', productRoutes); // Bao gồm cả /nodes và các route admin/nodes
app.use('/api/users', userRoutes);

// Route kiểm tra server hoạt động
app.get('/', (req, res) => {
  res.status(200).json({ success: true, message: 'API Server is running smoothly!' });
});

// Xử lý lỗi 404 cho các route không tồn tại
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'Đường dẫn API không tồn tại.' });
});

// Khởi chạy Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server đang chạy tại cổng ${PORT}`);
});