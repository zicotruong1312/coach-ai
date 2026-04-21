const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  discordId: {
    type: String,
    required: true,
    unique: true, // Mỗi user chỉ có 1 report, cập nhật tại chỗ
  },
  riotName: { type: String },
  riotTag:  { type: String },
  rank:     { type: String, default: 'Unranked' },
  
  // Số liệu tổng hợp từ các trận gần nhất
  stats: {
    matchCount:    { type: Number, default: 0 },
    avgKills:      { type: Number, default: 0 },
    avgDeaths:     { type: Number, default: 0 },
    avgAssists:    { type: Number, default: 0 },
    kd:            { type: Number, default: 0 },
    avgHeadshotPct:{ type: Number, default: 0 },
    kdTrend:       { type: Number, default: 0 },
    hsTrend:       { type: Number, default: 0 },
    avgFirstKills: { type: Number, default: 0 },
    avgFirstDeaths:{ type: Number, default: 0 },
    topAgents:     [String],
    topMaps:       [String],
    // Mảng từng trận để vẽ biểu đồ
    matchHistory: [{
      matchId:      String,
      map:          String,
      agent:        String,
      kills:        Number,
      deaths:       Number,
      assists:      Number,
      headshotPct:  Number,
      playedAt:     Date,
    }]
  },

  // Phân tích từ Gemini AI (JSON có cấu trúc)
  aiAnalysis: {
    playstyleType:  { type: String },
    playstyleDesc:  { type: String },
    proPlayerMatch: { type: String },
    proPlayerReason:{ type: String },
    recommendedAgents: [String],
    strengths:      [String],
    weaknesses:     [String],
    radarScores: {
      aim:          { type: Number, default: 0 }, // Độ chính xác, HS%, gunfight
      movement:     { type: Number, default: 0 }, // Positioning, survival, death locations
      abilityUsage: { type: Number, default: 0 }, // Hiệu quả sử dụng skill/ability
      gameSense:    { type: Number, default: 0 }, // FK/FD ratio, decision making
      teamPlay:     { type: Number, default: 0 }, // Assists, support, utility
    },
    trainingPlan: [{
      day:   Number,
      focus: String,
      tasks: [{
        name: String,        // Tên bài tập (VD: The Range Medium Bots)
        agent: String,       // Đặc vụ nên dùng (VD: Reyna / Any)
        mode: String,        // Chế độ (VD: The Range / Deathmatch / Custom)
        duration: String,    // Thời lượng (VD: 10 phút)
        videoUrl: String,    // Youtube search URL
        description: String, // Hướng dẫn chi tiết
      }],
    }],
    overallRating: { type: Number, default: 0 },
    summary:       { type: String },
  },

  lastUpdatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Report', reportSchema);
