const mongoose = require('mongoose');

const nodeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  icon: { type: String, default: '🌐' },
  url: { type: String, required: true },
  category: { type: String, default: 'Chung' }, // Thêm trường category để hỗ trợ bộ lọc danh mục ở Frontend
  status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  clicks: { type: Number, default: 0 },         // Đồng bộ tên trường thành `clicks` để khớp với controller và code cũ
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Node', nodeSchema);