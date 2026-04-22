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
      let matchDetails = [];
      let usedApi = false;

      // 2. Ưu tiên lấy trực tiếp 10 trận mới nhất từ API để đảm bảo data luôn chuẩn nhất
      console.log(`[COACH] Lấy 10 trận mới nhất từ API real-time cho ${user.riotName}...`);
      try {
        const res = await getMatches('ap', user.riotName, user.riotTag, 10);
        if (res && res.data && res.data.length > 0) {
          usedApi = true;
          for (const match of res.data) {
            const playerStats = match.players.all_players.find(
              p => p.name === user.riotName && p.tag === user.riotTag
            );
            if (!playerStats) continue;

            const headshots = playerStats.stats.headshots || 0;
            const bodyshots = playerStats.stats.bodyshots || 0;
            const legshots  = playerStats.stats.legshots  || 0;
            const totalShots = headshots + bodyshots + legshots;

            const playerTeam = playerStats.team?.toLowerCase();
            const winningTeam = match.teams
              ? Object.entries(match.teams).find(([, t]) => t?.has_won === true)?.[0]?.toLowerCase()
              : null;
            const won = winningTeam ? playerTeam === winningTeam : null;

            matchDetails.push({
              matchId:     match.metadata.matchid,
              map:         match.metadata.map,
              agent:       playerStats.character,
              kills:       playerStats.stats.kills,
              deaths:      playerStats.stats.deaths,
              assists:     playerStats.stats.assists,
              score:       playerStats.stats.score, // Thêm score để tính ACS
              rounds:      match.metadata.rounds_played,
              headshots, bodyshots, legshots,
              headshotPct: totalShots > 0 ? Math.round((headshots / totalShots) * 100) : 0,
              createdAt:   new Date(match.metadata.game_start * 1000),
              won,
            });
          }
        }
      } catch (err) {
        console.error(`[COACH] Lỗi lấy API: ${err.message}. Chuyển sang dùng DB...`);
      }

      // 3. Fallback: Nếu API lỗi, lấy từ DB
      if (!usedApi || matchDetails.length === 0) {
        matchDetails = await MatchDetail.find({ discordId: user.discordId })
          .sort({ createdAt: -1 })
          .limit(10);
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

      // Thống kê Hit Distribution (Tỉ lệ trúng các bộ phận)
      const sumHS = matchDetails.reduce((s, m) => s + (m.headshots || 0), 0);
      const sumBS = matchDetails.reduce((s, m) => s + (m.bodyshots || 0), 0);
      const sumLS = matchDetails.reduce((s, m) => s + (m.legshots || 0), 0);
      const totalHits = sumHS + sumBS + sumLS;
      
      const avgBodyPct = totalHits > 0 ? Math.round((sumBS / totalHits) * 100) : 0;
      const avgLegPct  = totalHits > 0 ? Math.round((sumLS / totalHits) * 100) : 0;
      // Dùng avgHS thực tế (tổng / số trận) thay vì tính từ totalHits để đồng nhất với display, 
      // hoặc lấy theo totalHits (chuẩn hơn). Dùng K/D, số trận..
      
      // Đếm tần suất agent và tính toán chi tiết mỗi agent
      const agentStats = {};
      const mapCount   = {};
      matchDetails.forEach(m => {
        if (!agentStats[m.agent]) {
          agentStats[m.agent] = { name: m.agent, matches: 0, kills: 0, deaths: 0, hsTotal: 0, wins: 0 };
        }
        agentStats[m.agent].matches += 1;
        agentStats[m.agent].kills   += (m.kills || 0);
        agentStats[m.agent].deaths  += (m.deaths || 0);
        agentStats[m.agent].hsTotal += (m.headshotPct || 0);
        if (m.won === true) agentStats[m.agent].wins += 1;
        mapCount[m.map] = (mapCount[m.map] || 0) + 1;
      });

      const topAgents = Object.values(agentStats)
        .sort((a, b) => b.matches - a.matches)
        .slice(0, 3)
        .map(a => ({
          name: a.name,
          matches: a.matches,
          kd: a.deaths > 0 ? +(a.kills / a.deaths).toFixed(2) : a.kills,
          hsPct: Math.round(a.hsTotal / a.matches),
          winPct: a.matches > 0 ? Math.round((a.wins / a.matches) * 100) : 0,
        }));

      const topMaps = Object.entries(mapCount).sort((a, b) => b[1] - a[1]).slice(0, 3).map(e => e[0]);

      const avgKills   = +(totalKills   / count).toFixed(1);
      const avgDeaths  = +(totalDeaths  / count).toFixed(1);
      const avgAssists = +(totalAssists / count).toFixed(1);
      const kd         = avgDeaths > 0 ? +(avgKills / avgDeaths).toFixed(2) : avgKills;
      const avgHS      = +(totalHS / count).toFixed(1);

      // Tính Trend (5 trận gần nhất vs 5 trận trước đó)
      let kdTrend = 0;
      let hsTrend = 0;
      if (count > 5) {
        const recent5 = matchDetails.slice(0, 5);
        const past5 = matchDetails.slice(5, 10);
        
        const recentKills = recent5.reduce((s, m) => s + (m.kills || 0), 0);
        const recentDeaths = recent5.reduce((s, m) => s + (m.deaths || 0), 0);
        const recentKD = recentDeaths > 0 ? recentKills / recentDeaths : recentKills;
        const recentHS = recent5.reduce((s, m) => s + (m.headshotPct || 0), 0) / 5;

        const pastKills = past5.reduce((s, m) => s + (m.kills || 0), 0);
        const pastDeaths = past5.reduce((s, m) => s + (m.deaths || 0), 0);
        const countPast = past5.length;
        const pastKD = pastDeaths > 0 ? pastKills / pastDeaths : pastKills;
        const pastHS = past5.reduce((s, m) => s + (m.headshotPct || 0), 0) / countPast;

        kdTrend = +(recentKD - pastKD).toFixed(2);
        hsTrend = +(recentHS - pastHS).toFixed(1);
      }

      const statsPayload = {
        riotName: user.riotName, riotTag: user.riotTag,
        matchCount: count,
        avgKills, avgDeaths, avgAssists,
        kd, avgHeadshotPct: avgHS,
        avgBodyPct, avgLegPct, // <== Added Accuracy
        kdTrend, hsTrend,
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
        score:       m.score || 0,
        rounds:      m.rounds || 0,
        headshotPct: m.headshotPct,
        playedAt:    m.createdAt,
        won:         m.won ?? null,
      })); // KHÔNG reverse để UI giữ đúng thứ tự mới nhất (top) xuống cũ nhất (bottom)

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
