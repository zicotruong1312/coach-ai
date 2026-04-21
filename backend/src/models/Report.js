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
    strengths:      [String],
    weaknesses:     [String],
    radarScores: {
      aim:      { type: Number, default: 0 },
      gamesense:{ type: Number, default: 0 },
      survival: { type: Number, default: 0 },
      support:  { type: Number, default: 0 },
      aggression:{ type: Number, default: 0 },
    },
    trainingPlan: [{
      day:   Number,
      focus: String,
      tasks: [String],
    }],
    overallRating: { type: Number, default: 0 },
    summary:       { type: String },
  },

  lastUpdatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Report', reportSchema);
