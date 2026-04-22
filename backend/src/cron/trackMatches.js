const cron = require('node-cron');
const User = require('../models/User');
const MatchDetail = require('../models/MatchDetail');
const { getMatches } = require('../services/valorant');

// Chạy job 15 phút một lần
const startTrackingJob = () => {
  console.log('[CRON] Khởi động hệ thống Tracking 15 phút/lần...');

  cron.schedule('*/15 * * * *', async () => {
    console.log('[CRON] Đang bắt đầu quét match mới cho các user...');
    
    try {
      const users = await User.find({});
      
      for (const user of users) {
        // Nghỉ 2s tránh bị rate limit API
        await new Promise(r => setTimeout(r, 2000));
        
        try {
          const res = await getMatches('ap', user.riotName, user.riotTag, 1);
          if (!res || !res.data || res.data.length === 0) continue;

          const latestMatch = res.data[0];
          const matchId = latestMatch.metadata.matchid;

          // Kiểm tra xem đã xử lý match này chưa
          const existing = await MatchDetail.findOne({ matchId: matchId, discordId: user.discordId });
          if (existing) continue;

          // Tìm player tương ứng trong trận
          const playerStats = latestMatch.players.all_players.find(
            p => p.name === user.riotName && p.tag === user.riotTag
          );

          if (!playerStats) continue;

          // Tạo logs vị trí người chơi chết
          const deathLogs = [];
          latestMatch.kills.forEach(kill => {
            if (kill.victim_puuid === playerStats.puuid) {
              deathLogs.push({
                round: kill.kill_time_in_round, // placeholder round
                weapon: kill.damage_weapon_id,
                x: kill.victim_death_location?.x || null,
                y: kill.victim_death_location?.y || null,
                timeInRound: kill.kill_time_in_match
              });
            }
          });

          const newMatch = new MatchDetail({
            matchId: matchId,
            discordId: user.discordId,
            map: latestMatch.metadata.map,
            agent: playerStats.character,
            kills: playerStats.stats.kills,
            deaths: playerStats.stats.deaths,
            assists: playerStats.stats.assists,
            headshots: playerStats.stats.headshots || 0,
            bodyshots: playerStats.stats.bodyshots || 0,
            legshots: playerStats.stats.legshots || 0,
            headshotPct: Math.round((playerStats.stats.headshots / ((playerStats.stats.headshots || 0) + (playerStats.stats.bodyshots || 0) + (playerStats.stats.legshots || 0))) * 100) || 0,
            deathLogs: deathLogs
          });

          await newMatch.save();
          console.log(`[CRON] Đã ghi nhận Match mới (${matchId}) cho tài khoản ${user.riotName}`);
        } catch (err) {
          console.error(`[CRON] Lỗi lấy match của user ${user.riotName}:`, err.message);
        }
      }
    } catch (error) {
      console.error('[CRON] Lỗi hệ thống Cron Tracking:', error.message);
    }
  });
};

module.exports = { startTrackingJob };
