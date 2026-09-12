const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../../models/auth/User');

const JWT_SECRET = process.env.JWT_SECRET || 'valzaria_secret_key_2026';

// Middleware xác thực JWT từ Cookie
const authenticateToken = (req, res, next) => {
  const token = req.cookies.admin_token;
  if (!token) {
    return res.status(401).json({ success: false, message: 'Chưa đăng nhập hoặc phiên hết hạn' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: 'Token không hợp lệ' });
  }
};

// 1. API ĐĂNG KÝ (Khách tự đăng ký - Mặc định role USER)
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ tên tài khoản và mật khẩu' });
    }

    const existingUser = await User.findOne({ username: username.trim() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Tên tài khoản đã tồn tại' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username: username.trim(),
      password: hashedPassword,
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

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Vui lòng điền tên tài khoản và mật khẩu' });
    }

    const user = await User.findOne({ username: username.trim() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Tài khoản hoặc mật khẩu không chính xác' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Tài khoản hoặc mật khẩu không chính xác' });
    }

    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.cookie('admin_token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000
    });

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

// 3. API CHECK ME (Xác thực lại phiên làm việc khi F5)
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
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
  res.clearCookie('admin_token', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/'
  });
  return res.json({ success: true, message: 'Đã đăng xuất thành công' });
});

// 5. API TẠO LEADER (Chỉ ADMIN mới có quyền thực thi)
router.post('/create-leader', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Chỉ Admin mới có quyền tạo tài khoản Leader' });
    }

    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp username và password cho Leader' });
    }

    const existingUser = await User.findOne({ username: username.trim() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Tên tài khoản Leader đã tồn tại' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newLeader = new User({
      username: username.trim(),
      password: hashedPassword,
      role: 'LEADER'
    });

    await newLeader.save();
    res.json({ success: true, message: 'Tạo tài khoản Leader thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi hệ thống khi tạo Leader' });
  }
});

// 6. API LẤY DANH SÁCH TẤT CẢ USER/LEADER (Dành cho Admin quản lý)
router.get('/users', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Không có quyền truy cập danh sách người dùng' });
    }
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi lấy danh sách tài khoản' });
  }
});

// 7. API XÓA TÀI KHOẢN (Dành cho Admin)
router.delete('/users/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Chỉ Admin mới có quyền xóa tài khoản' });
    }
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Xóa tài khoản thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi xóa tài khoản' });
  }
});

// 8. API ĐỔI MẬT KHẨU
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user.userId);

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Mật khẩu cũ không chính xác' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ success: true, message: 'Cập nhật mật khẩu thành công!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi hệ thống khi đổi mật khẩu' });
  }
});

// 9. API CẬP NHẬT TÀI KHOẢN (Dành cho Admin sửa role, username hoặc reset password)
router.put('/users/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Chỉ Admin mới có quyền chỉnh sửa tài khoản' });
    }

    const { username, password, role } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản' });
    }

    if (username) user.username = username.trim();
    if (role && ['ADMIN', 'LEADER', 'USER'].includes(role)) {
      user.role = role;
    }
    if (password && password.trim() !== '') {
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();
    res.json({ success: true, message: 'Cập nhật tài khoản thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi hệ thống khi cập nhật tài khoản' });
  }
});

module.exports = router;