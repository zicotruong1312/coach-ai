const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const User = require('../../models/User');
const MatchDetail = require('../../models/MatchDetail');
const Report = require('../../models/Report');
const { generateCoachFeedback } = require('../../services/gemini');
const { getMatches } = require('../../services/valorant');

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://coach-ai.vercel.app';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('coach')
    .setDescription('Phân tích 10 trận đấu gần nhất và nhận báo cáo AI Coach cá nhân'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    // 1. Kiểm tra user đã link chưa
    const user = await User.findOne({ discordId: interaction.user.id });
    if (!user) {
      return interaction.editReply('❌ Bạn chưa liên kết tài khoản Valorant! Hãy dùng lệnh `/link` trước.');
    }

    await interaction.editReply('⏳ AI Coach đang phân tích dữ liệu của bạn... (10-20 giây)');

    try {
      // 2. Lấy match từ DB trước
      let matchDetails = await MatchDetail.find({ discordId: user.discordId })
        .sort({ createdAt: -1 })
        .limit(10);

      // 3. Nếu DB chưa đủ 10 trận, fetch mới từ API và dùng 10 trận mới nhất làm chuẩn
      if (matchDetails.length < 10) {
        console.log(`[COACH] DB chưa đủ 10 trận cho ${user.riotName}, lấy từ API real-time...`);
        const res = await getMatches('ap', user.riotName, user.riotTag, 10);
        if (!res || !res.data || res.data.length === 0) {
          if (matchDetails.length === 0) {
            return interaction.editReply('❌ Không tìm thấy trận đấu nào. Hãy chơi thêm ít nhất 1 trận rồi thử lại!');
          }
        } else {
          // Xoá dữ liệu cũ, dùng toàn bộ data mới từ API (lên đến 10 trận)
          matchDetails = [];
          for (const match of res.data) {
            const playerStats = match.players.all_players.find(
              p => p.name === user.riotName && p.tag === user.riotTag
            );
            if (!playerStats) continue;

            const headshots = playerStats.stats.headshots || 0;
            const bodyshots = playerStats.stats.bodyshots || 0;
            const legshots  = playerStats.stats.legshots  || 0;
            const totalShots = headshots + bodyshots + legshots;

            matchDetails.push({
              matchId:     match.metadata.matchid,
              map:         match.metadata.map,
              agent:       playerStats.character,
              kills:       playerStats.stats.kills,
              deaths:      playerStats.stats.deaths,
              assists:     playerStats.stats.assists,
              headshotPct: totalShots > 0 ? Math.round((headshots / totalShots) * 100) : 0,
              createdAt:   new Date(match.metadata.game_start * 1000),
            });
          }
        }
      }


      if (matchDetails.length === 0) {
        return interaction.editReply('❌ Không đủ dữ liệu để phân tích. Hãy chơi thêm vài trận rồi thử lại!');
      }

      // 4. Tính toán số liệu tổng hợp
      const count = matchDetails.length;
      const totalKills   = matchDetails.reduce((s, m) => s + (m.kills   || 0), 0);
      const totalDeaths  = matchDetails.reduce((s, m) => s + (m.deaths  || 0), 0);
      const totalAssists = matchDetails.reduce((s, m) => s + (m.assists || 0), 0);
      const totalHS      = matchDetails.reduce((s, m) => s + (m.headshotPct || 0), 0);

      // Đếm tần suất agent và map
      const agentCount = {};
      const mapCount   = {};
      matchDetails.forEach(m => {
        agentCount[m.agent] = (agentCount[m.agent] || 0) + 1;
        mapCount[m.map]     = (mapCount[m.map]     || 0) + 1;
      });
      const topAgents = Object.entries(agentCount).sort((a, b) => b[1] - a[1]).slice(0, 3).map(e => e[0]);
      const topMaps   = Object.entries(mapCount).sort((a, b) => b[1] - a[1]).slice(0, 3).map(e => e[0]);

      const avgKills   = +(totalKills   / count).toFixed(1);
      const avgDeaths  = +(totalDeaths  / count).toFixed(1);
      const avgAssists = +(totalAssists / count).toFixed(1);
      const kd         = avgDeaths > 0 ? +(avgKills / avgDeaths).toFixed(2) : avgKills;
      const avgHS      = +(totalHS / count).toFixed(1);

      const statsPayload = {
        riotName: user.riotName, riotTag: user.riotTag,
        matchCount: count,
        avgKills, avgDeaths, avgAssists,
        kd, avgHeadshotPct: avgHS,
        avgFirstKills: 0, avgFirstDeaths: 0, // placeholder
        topAgents, topMaps,
      };

      // 5. Gọi Gemini AI
      const aiAnalysis = await generateCoachFeedback(statsPayload);

      // 6. Build matchHistory cho biểu đồ
      const matchHistory = matchDetails.map(m => ({
        matchId:     m.matchId,
        map:         m.map,
        agent:       m.agent,
        kills:       m.kills,
        deaths:      m.deaths,
        assists:     m.assists,
        headshotPct: m.headshotPct,
        playedAt:    m.createdAt,
      })).reverse(); // Thứ tự thời gian tăng dần

      // 7. Upsert Report vào DB (1 report duy nhất / user)
      await Report.findOneAndUpdate(
        { discordId: user.discordId },
        {
          discordId:   user.discordId,
          riotName:    user.riotName,
          riotTag:     user.riotTag,
          stats:       { ...statsPayload, matchHistory },
          aiAnalysis,
          lastUpdatedAt: new Date(),
        },
        { upsert: true, returnDocument: 'after' }
      );

      // 8. Cập nhật lastCoachAt cho user
      user.lastCoachAt = new Date();
      await user.save();

      // 9. Gửi Embed Discord
      const reportUrl = `${FRONTEND_URL}/report/${user.discordId}`;

      const embed = new EmbedBuilder()
        .setColor(0x6C5CE7)
        .setTitle(`🎯 Báo cáo AI Coach — ${user.riotName}#${user.riotTag}`)
        .setDescription(`Phân tích dựa trên **${count} trận** gần nhất. Nhấn nút bên dưới để xem báo cáo đầy đủ!`)
        .addFields(
          { name: '⚔️ K/D',         value: `**${kd}**`,        inline: true },
          { name: '🎯 Headshot',     value: `**${avgHS}%**`,    inline: true },
          { name: '📊 Phong cách',   value: `**${aiAnalysis.playstyleType}**`, inline: true },
          { name: '🌟 Pro Match',    value: `**${aiAnalysis.proPlayerMatch}**`, inline: true },
          { name: '⭐ Rating',       value: `**${aiAnalysis.overallRating}/10**`, inline: true },
          { name: '🗓️ Cập nhật',    value: `**Vừa xong**`,     inline: true },
          { name: '📋 Nhận xét HLV', value: aiAnalysis.summary || 'Không có dữ liệu' }
        )
        .setFooter({ text: 'Link này cố định — dữ liệu tự cập nhật mỗi khi bạn dùng /coach' })
        .setTimestamp();

      return interaction.editReply({
        content: `✅ Phân tích xong! Xem báo cáo đầy đủ tại:\n🔗 **${reportUrl}**`,
        embeds: [embed],
      });

    } catch (error) {
      console.error('[COACH] Lỗi:', error);
      return interaction.editReply('❌ Đã xảy ra lỗi khi phân tích. Hãy thử lại sau ít phút!');
    }
  },
};
