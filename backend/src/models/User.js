const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  discordId: {
    type: String,
    required: true,
    unique: true,
  },
  riotName: {
    type: String,
    required: true,
  },
  riotTag: {
    type: String,
    required: true,
  },
  role: {
    type: String, // 'VIP', 'Thổ Phỉ', 'Root', v.v.
    default: 'Thổ Phỉ',
  },
  lastCoachAt: {
    type: Date,
    default: null, // Lưu thời gian lần cuối được AI Coach check-in
  },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
