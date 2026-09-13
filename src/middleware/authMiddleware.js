const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    // Lấy token từ HttpOnly Cookie hoặc từ Header Authorization (Bearer token)
    let token = req.cookies && req.cookies.token;

    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Không tìm thấy phiên đăng nhập. Vui lòng đăng nhập lại.' });
    }

    // Giải mã token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_key');

    // Gắn thông tin user vào request object để sử dụng ở các controller tiếp theo
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' });
    }
    return res.status(401).json({ success: false, message: 'Xác thực không hợp lệ.' });
  }
};

module.exports = authMiddleware;