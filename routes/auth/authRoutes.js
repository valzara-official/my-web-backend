const express = require('express');
const router = express.Router();
const User = require('../../models/auth/User');

// 1. API ĐĂNG KÝ (Khách hàng tự đăng ký - Luôn cố định role là USER)
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ thông tin' });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Tên tài khoản đã tồn tại' });
    }

    // Luôn đặt role mặc định là USER bất kể dữ liệu truyền lên
    const newUser = new User({
      username,
      password, // Nên mã hóa bằng bcrypt nếu hệ thống của bạn có cài đặt
      role: 'USER'
    });

    await newUser.save();
    res.json({ success: true, message: 'Đăng ký tài khoản thành công' });
  } catch (error) {
    console.error('Lỗi đăng ký:', error);
    res.status(500).json({ success: false, message: 'Lỗi hệ thống khi đăng ký' });
  }
});

// 2. API ĐĂNG NHẬP
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username, password });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Tài khoản hoặc mật khẩu không chính xác' });
    }

    // Lưu phiên làm việc vào Session
    if (req.session) {
      req.session.userId = user._id;
      req.session.role = user.role;
    }

    res.json({
      success: true,
      message: 'Đăng nhập thành công',
      user: {
        id: user._id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Lỗi đăng nhập:', error);
    res.status(500).json({ success: false, message: 'Lỗi hệ thống khi đăng nhập' });
  }
});

// 3. API CHECK ME (Kiểm tra phiên làm việc khi F5)
router.get('/me', async (req, res) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
    }

    const user = await User.findById(req.session.userId).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'Tài khoản không tồn tại' });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi xác thực phiên làm việc' });
  }
});

// 4. API ĐĂNG XUẤT
router.post('/logout', (req, res) => {
  if (req.session) {
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.json({ success: true, message: 'Đã đăng xuất thành công' });
    });
  } else {
    res.json({ success: true });
  }
});

// 5. API DÀNH CHO ADMIN TẠO TÀI KHOẢN LEADER
router.post('/create-leader', async (req, res) => {
  try {
    if (!req.session || req.session.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Chỉ Admin mới có quyền tạo Leader' });
    }

    const { username, password } = req.body;
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Tên tài khoản đã tồn tại' });
    }

    const newLeader = new User({
      username,
      password,
      role: 'LEADER'
    });

    await newLeader.save();
    res.json({ success: true, message: 'Tạo tài khoản Leader thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi hệ thống khi tạo Leader' });
  }
});

module.exports = router;