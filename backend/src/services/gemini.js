/**
 * AI Coach Service — Fallback Chain
 * 1. Groq  (llama-3.3-70b) — 30 req/min, 14,400 req/day FREE
 * 2. Gemini (gemini-2.0-flash) — 15 req/min, 1,500 req/day FREE
 * 3. Structured fallback — không bao giờ crash
 */
const Groq = require('groq-sdk');
const { GoogleGenAI } = require('@google/genai');

const groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
const geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ── Prompt dùng chung ─────────────────────────────────────────────
const SYSTEM_PROMPT = `Bạn là một Huấn Luyện Viên Valorant cá nhân cực kỳ chuyên nghiệp.
Trả về CHÍNH XÁC một đối tượng JSON hợp lệ. KHÔNG có markdown, KHÔNG có text ngoài JSON.

JSON schema:
{
  "playstyleType": "string",
  "playstyleDesc": "string (2-3 câu)",
  "proPlayerMatch": "string (Aspas / nAts / Boaster / Jinggg / yay / TenZ / cNed / Derke...)",
  "proPlayerReason": "string (2-3 câu tại sao match)",
  "recommendedAgents": ["string", "string"],
  "strengths": ["string", "string", "string"],
  "weaknesses": ["string", "string", "string"],
  "radarScores": {
    "aim": number (1-10),
    "movement": number (1-10),
    "abilityUsage": number (1-10),
    "gameSense": number (1-10),
    "teamPlay": number (1-10)
  },
  "trainingPlan": [
    { 
      "day": 1, 
      "focus": "string", 
      "tasks": [
        {
          "name": "string (Tên bài tập ngắn gọn)",
          "agent": "string (Tên Agent, VD: Reyna / Bất kỳ)",
          "mode": "string (VD: The Range / Deathmatch / Custom)",
          "duration": "string (VD: 15 phút / 2 trận)",
          "videoUrl": "string (Link Youtube tìm kiếm, VD: https://www.youtube.com/results?search_query=valorant+deathmatch+routine)",
          "description": "string (Mô tả chi tiết cách thực hiện bài tập, những lỗi sai cần tránh)"
        }
      ] 
    },
    { "day": 2, "focus": "string", "tasks": [...] },
    { "day": 3, "focus": "string", "tasks": [...] }
  ],
  "overallRating": number,
  "summary": "string (3-4 câu nhận xét tổng quát, tiếng Việt, nhiệt huyết)"
}

LƯU Ý QUAN TRỌNG: 
1. Mảng "recommendedAgents" phải chứa đúng tên 2-3 Agent trong Valorant (VD: "Jett", "Omen", "Killjoy") phù hợp nhất với phong cách của họ.
2. Ở phần "trainingPlan", CÁC BÀI TẬP PHẢI ĐƯỢC TÁCH RA THÀNH CÁC FIELD CỤ THỂ (name, agent, mode, duration, videoUrl, description). Thuộc tính "videoUrl" phải trỏ về "https://www.youtube.com/results?search_query=..." chứa cú pháp tìm kiếm video phù hợp bằng tiếng Anh. Chi tiết thực hiện ghi vào "description".`;

function buildUserPrompt(stats) {
  return `Phân tích người chơi: ${stats.riotName}#${stats.riotTag} (${stats.matchCount} trận)
K/D: ${stats.kd} | Kills: ${stats.avgKills} | Deaths: ${stats.avgDeaths} | Assists: ${stats.avgAssists}
Headshot: ${stats.avgHeadshotPct}% | Agents: ${stats.topAgents.join(', ')} | Maps: ${stats.topMaps.join(', ')}
Trả về JSON theo đúng schema, không có text thêm.`;
}

function parseJson(raw) {
  const cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();
  return JSON.parse(cleaned);
}

function fallbackResult() {
  return {
    playstyleType: 'Chưa xác định',
    playstyleDesc: 'AI Coach tạm thời bận — hãy thử lại sau ít phút.',
    proPlayerMatch: 'N/A',
    proPlayerReason: 'Không thể xác định hình mẫu lúc này.',
    recommendedAgents: ['Any'],
    strengths: ['Cần thêm dữ liệu để phân tích'],
    weaknesses: ['Cần thêm dữ liệu để phân tích'],
    radarScores: { aim: 5, movement: 5, abilityUsage: 5, gameSense: 5, teamPlay: 5 },
    trainingPlan: [
      { 
        day: 1, 
        focus: 'Aim Training', 
        tasks: [
          {
            name: 'Warm-up Đầu Tiên',
            agent: 'Bất kỳ',
            mode: 'The Range',
            duration: '10 phút',
            videoUrl: 'https://www.youtube.com/results?search_query=valorant+the+range+warmup',
            description: 'Vào The Range, bật mode Medium Bots. Đứng ở giữa và cố gắng đưa tâm chuẩn sát đầu bot nhất có thể trước khi bắn. Tập trung vào độ chính xác (accuracy) chứ không phải tốc độ (speed).'
          }
        ] 
      },
      { 
        day: 2, 
        focus: 'Map Awareness', 
        tasks: [
          {
            name: 'Học Map Cơ Bản',
            agent: 'Bất kỳ',
            mode: 'Custom Match',
            duration: '15 phút',
            videoUrl: 'https://www.youtube.com/results?search_query=valorant+map+awareness+guide',
            description: 'Vào một trận Custom, chạy quanh map mà bạn hay chơi nhất. Tưởng tượng kẻ địch đang camp ở đâu và tập kê tâm pre-aim vào những góc đó.'
          }
        ] 
      },
      { 
        day: 3, 
        focus: 'Game Sense', 
        tasks: [
          {
            name: 'Review VOD',
            agent: 'Bất kỳ',
            mode: 'Phân tích Video',
            duration: '20 phút',
            videoUrl: 'https://www.youtube.com/results?search_query=how+to+vod+review+valorant',
            description: 'Tải phần mềm quay màn hình. Quay lại 1 trận bạn chơi siêu tệ, sau đó vừa xem lại vừa tự hỏi "Tại sao mình chết ở tình huống này?".'
          }
        ] 
      }
    ],
    overallRating: 5,
    summary: 'Hệ thống AI đang tạm thời gặp sự cố. Dữ liệu thống kê cơ bản đã được lưu lại. Gõ /coach lại sau ít phút để nhận phân tích đầy đủ nhé!'
  };
}

// ── Provider 1: Groq ───────────────────────────────────────────────
async function tryGroq(stats) {
  const completion = await groqClient.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user',   content: buildUserPrompt(stats) }
    ],
    temperature: 0.7,
    max_tokens: 2048,
  });
  return parseJson(completion.choices[0].message.content);
}

// ── Provider 2: Gemini ─────────────────────────────────────────────
async function tryGemini(stats) {
  const response = await geminiClient.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: `${SYSTEM_PROMPT}\n\n${buildUserPrompt(stats)}`,
  });
  return parseJson(response.text);
}

// ── Main: Fallback Chain ───────────────────────────────────────────
async function generateCoachFeedback(stats) {
  // 1. Thử Groq trước
  try {
    console.log('[AI] Đang dùng Groq (llama-3.3-70b)...');
    const result = await tryGroq(stats);
    console.log('[AI] ✅ Groq thành công');
    return result;
  } catch (err) {
    console.warn('[AI] ⚠️ Groq thất bại:', err.message);
  }

  // 2. Fallback sang Gemini
  try {
    console.log('[AI] Đang fallback sang Gemini (gemini-2.0-flash)...');
    const result = await tryGemini(stats);
    console.log('[AI] ✅ Gemini thành công');
    return result;
  } catch (err) {
    console.warn('[AI] ⚠️ Gemini thất bại:', err.message);
  }

  // 3. Fallback cuối — không bao giờ crash
  console.log('[AI] 🔄 Dùng structured fallback');
  return fallbackResult();
}

module.exports = { generateCoachFeedback };
