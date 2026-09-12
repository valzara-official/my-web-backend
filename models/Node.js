const mongoose = require('mongoose');

const NodeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  url: { type: String, required: true },
  icon: { type: String, default: '🌐' },
  clicks: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Node', NodeSchema);