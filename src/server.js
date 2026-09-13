// Đường dẫn file: src/server.js
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

// Cấu hình CORS cho phép Frontend giao tiếp (gửi kèm cookie credentials: true)
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
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