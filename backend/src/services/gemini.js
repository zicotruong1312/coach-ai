const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const COACH_SYSTEM_PROMPT = `Bạn là một Huấn Luyện Viên Valorant cá nhân cực kỳ chuyên nghiệp, khắt khe nhưng sâu sắc.
Dựa trên số liệu thực tế được cung cấp, hãy phân tích người chơi và trả về CHÍNH XÁC một đối tượng JSON hợp lệ (không có markdown, không có text ngoài JSON).

JSON schema bắt buộc:
{
  "playstyleType": "string (VD: Thuần Aim, Não To, Entry Máu Liều, Support Chiến Lược, Bọc Hậu...)",
  "playstyleDesc": "string (Mô tả ngắn 2-3 câu về phong cách này)",
  "proPlayerMatch": "string (tên Pro Player phù hợp nhất, VD: Aspas, nAts, Boaster, Jinggg, yay, TenZ...)",
  "proPlayerReason": "string (Giải thích tại sao match với Pro Player này, 2-3 câu)",
  "strengths": ["string", "string", "string"],
  "weaknesses": ["string", "string", "string"],
  "radarScores": {
    "aim": number (0-100, dựa trên HS%, K/D, gunfight wins),
    "movement": number (0-100, dựa trên survival rate, deaths/trận, positioning),
    "abilityUsage": number (0-100, ước tính hiệu quả dùng skill dựa trên agent + assists),
    "gameSense": number (0-100, dựa trên FK/FD ratio, first blood, decision making),
    "teamPlay": number (0-100, dựa trên assists/trận, support agent usage)
  },
  "trainingPlan": [
    { "day": 1, "focus": "string", "tasks": ["string", "string", "string"] },
    { "day": 2, "focus": "string", "tasks": ["string", "string", "string"] },
    { "day": 3, "focus": "string", "tasks": ["string", "string", "string"] }
  ],
  "overallRating": number (1-10, điểm tổng năng lực),
  "summary": "string (Nhận xét tổng quát 3-4 câu từ góc nhìn HLV chuyên nghiệp, tiếng Việt, nhiệt huyết)"
}`;

async function generateCoachFeedback(stats) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const userPrompt = `
Phân tích người chơi: ${stats.riotName}#${stats.riotTag}
Số trận phân tích: ${stats.matchCount}

Số liệu tổng hợp:
- K/D trung bình: ${stats.kd}
- Kills/trận: ${stats.avgKills} | Deaths/trận: ${stats.avgDeaths} | Assists/trận: ${stats.avgAssists}
- Tỉ lệ Headshot: ${stats.avgHeadshotPct}%
- First Kills/trận: ${stats.avgFirstKills} | First Deaths/trận: ${stats.avgFirstDeaths}
- Đặc vụ thường dùng: ${stats.topAgents.join(', ')}
- Map thường chơi: ${stats.topMaps.join(', ')}

Trả về JSON theo đúng schema, không có markdown hay text thêm.`;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      systemInstruction: { parts: [{ text: COACH_SYSTEM_PROMPT }] }
    });

    const raw = result.response.text().trim();
    // Cố làm sạch nếu Gemini bọc trong markdown
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
    return JSON.parse(cleaned);

  } catch (error) {
    console.error('Gemini API Error:', error);
    // Fallback nếu lỗi
    return {
      playstyleType: 'Chưa xác định',
      playstyleDesc: 'Hệ thống chưa thể phân tích phong cách lúc này.',
      proPlayerMatch: 'N/A',
      proPlayerReason: 'Không thể kết nối tới AI Coach.',
      strengths: ['Cần thêm dữ liệu'],
      weaknesses: ['Cần thêm dữ liệu'],
      radarScores: { aim: 50, gamesense: 50, survival: 50, support: 50, aggression: 50 },
      trainingPlan: [
        { day: 1, focus: 'Luyện aim cơ bản', tasks: ['10 phút The Range', 'Warm-up Deathmatch'] },
        { day: 2, focus: 'Ôn map callouts', tasks: ['Xem mini-map khi di chuyển', 'Custom game khám phá góc'] },
        { day: 3, focus: 'Tổng hợp', tasks: ['Unrated để thư giãn', 'Review VOD 1 trận'] }
      ],
      overallRating: 5,
      summary: 'AI Coach hiện không khả dụng. Hãy thử lại sau ít phút nhé!'
    };
  }
}

module.exports = { generateCoachFeedback };
