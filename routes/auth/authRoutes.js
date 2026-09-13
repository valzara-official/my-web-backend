const express = require('express');
const router = express.Router();
const User = require('../../models/auth/User');
const bcrypt = require('bcryptjs');

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
      note
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

    // Lưu thông tin vào Session hoặc trả về dữ liệu user (tùy thuộc vào cách bạn quản lý auth)
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

    // Nếu để trống mật khẩu thì không cập nhật trường password để tránh lỗi ghi đè
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

module.exports = router;