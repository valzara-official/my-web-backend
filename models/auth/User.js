const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['USER', 'LEADER', 'ADMIN'], 
    default: 'USER' 
  },
  createdAt: { type: Date, default: Date.now }
});

// API Đổi mật khẩu cho Admin
router.put('/change-admin-password', async (req, res) => {
  try {
    const { username, oldPassword, newPassword } = req.body;

    const user = await User.findOne({ username, role: 'ADMIN' });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản Admin' });
    }

    // Kiểm tra mật khẩu cũ
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Mật khẩu cũ không đúng' });
    }

    // Mã hóa và lưu mật khẩu mới
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ success: true, message: 'Cập nhật mật khẩu Admin thành công!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi hệ thống' });
  }
});

module.exports = mongoose.model('User', userSchema);