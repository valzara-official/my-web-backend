const express = require('express');
const router = express.Router();
const User = require('../../models/auth/User');
const bcrypt = require('bcryptjs');

// Middleware kiểm tra xem người dùng đã đăng nhập chưa (dựa vào session)
const isAuthenticated = (req, res, next) => {
  // Kiểm tra nếu có session.userId hoặc user đã đăng nhập
  if (req.session && req.session.userId) {
    req.user = { id: req.session.userId };
    return next();
  }
  return res.status(401).json({ success: false, message: 'Unauthorized: Chưa đăng nhập' });
};

// 1. Đăng ký / Thêm thành viên mới (POST /api/auth/register)
router.post('/register', async (req, res) => {
  try {
    const { username, password, role, email, phone, address, gender, note } = req.body;
    
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Tên tài khoản đã tồn tại!' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      username,
      password: hashedPassword,
      role: role || 'USER',
      email,
      phone,
      address,
      gender,
      note,
      isOnline: false,
      lastActive: new Date()
    });

    res.status(201).json({ success: true, message: 'Thêm thành viên thành công!', data: newUser });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. Đăng nhập hệ thống (POST /api/auth/login)
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Tên đăng nhập hoặc mật khẩu không đúng!' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Tên đăng nhập hoặc mật khẩu không đúng!' });
    }

    // QUAN TRỌNG: Lưu ID vào session để các request sau (như /ping) biết ai đang gửi
    if (req.session) {
      req.session.userId = user._id;
    }

    // Cập nhật trạng thái ngay khi đăng nhập thành công
    await User.findByIdAndUpdate(user._id, { isOnline: true, lastActive: new Date() });

    res.json({
      success: true,
      message: 'Đăng nhập thành công!',
      user: {
        id: user._id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. Lấy danh sách toàn bộ users (GET /api/auth/users)
router.get('/users', async (req, res) => {
  try {
    // Tùy chọn: Có thể viết thêm hàm quét nhanh xem ai quá 2 phút không gửi ping thì đổi thành offline ở đây trước khi trả về
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    await User.updateMany(
      { lastActive: { $lt: twoMinutesAgo }, isOnline: true },
      { isOnline: false }
    );

    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 4. Cập nhật thông tin thành viên theo ID (PUT /api/auth/users/:id)
router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (!updateData.password || updateData.password.trim() === '') {
      delete updateData.password;
    } else {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    const updatedUser = await User.findByIdAndUpdate(id, updateData, { new: true }).select('-password');
    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }

    res.json({ success: true, message: 'Cập nhật thành công', data: updatedUser });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 5. Xóa thành viên theo ID (DELETE /api/auth/users/:id)
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }

    res.json({ success: true, message: 'Xóa thành viên thành công', data: deletedUser });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 6. API nhận tín hiệu Heartbeat từ Frontend (POST /api/auth/ping)
router.post('/ping', isAuthenticated, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, {
      lastActive: new Date(),
      isOnline: true
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server khi ping' });
  }
});

// 7. API lấy thông tin user đang đăng nhập (GET /api/auth/me)
router.get('/me', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }
    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        email: user.email,
        phone: user.phone
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 8. Đăng xuất (POST /api/auth/logout)
router.post('/logout', (req, res) => {
  if (req.session) {
    req.session.destroy(err => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Lỗi khi đăng xuất' });
      }
      res.clearCookie('connect.sid', { secure: true, sameSite: 'none' });
      return res.json({ success: true, message: 'Đăng xuất thành công' });
    });
  } else {
    return res.json({ success: true, message: 'Đã đăng xuất' });
  }
});

module.exports = router;