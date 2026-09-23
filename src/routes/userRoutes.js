const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

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

// 🟢 THÊM DÒNG NÀY: Mount userRoutes vào tiền tố /api/admin để khớp với Frontend
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