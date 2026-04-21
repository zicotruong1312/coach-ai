const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  matchId: { type: String, required: true },
  discordId: { type: String, required: true },
  map: { type: String },
  agent: { type: String },
  kills: { type: Number, default: 0 },
  deaths: { type: Number, default: 0 },
  assists: { type: Number, default: 0 },
  headshotPct: { type: Number, default: 0 },
  firstKills: { type: Number, default: 0 },
  firstDeaths: { type: Number, default: 0 },
  kast: { type: Number, default: 0 },
  deathLogs: [{
    round: Number,
    weapon: String,
    x: Number,
    y: Number,
    timeInRound: Number
  }]
}, { timestamps: true });

// Tránh lưu trùng match của cùng 1 user
matchSchema.index({ matchId: 1, discordId: 1 }, { unique: true });

module.exports = mongoose.model('MatchDetail', matchSchema);
