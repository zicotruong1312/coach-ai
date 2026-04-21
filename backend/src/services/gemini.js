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
  "strengths": ["string", "string", "string"],
  "weaknesses": ["string", "string", "string"],
  "radarScores": {
    "aim": number,
    "movement": number,
    "abilityUsage": number,
    "gameSense": number,
    "teamPlay": number
  },
  "trainingPlan": [
    { "day": 1, "focus": "string", "tasks": ["string","string","string"] },
    { "day": 2, "focus": "string", "tasks": ["string","string","string"] },
    { "day": 3, "focus": "string", "tasks": ["string","string","string"] }
  ],
  "overallRating": number,
  "summary": "string (3-4 câu nhận xét tổng quát, tiếng Việt, nhiệt huyết)"
}`;

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
    strengths: ['Cần thêm dữ liệu để phân tích'],
    weaknesses: ['Cần thêm dữ liệu để phân tích'],
    radarScores: { aim: 50, movement: 50, abilityUsage: 50, gameSense: 50, teamPlay: 50 },
    trainingPlan: [
      { day: 1, focus: 'Aim Training', tasks: ['10 phút The Range warm-up', 'Deathmatch 15 phút', 'Tập flicking với Vandal'] },
      { day: 2, focus: 'Map Awareness', tasks: ['Xem mini-map liên tục khi di chuyển', 'Học callout chuẩn theo map', 'Custom game khám phá góc ngách'] },
      { day: 3, focus: 'Game Sense', tasks: ['Review VOD 1 trận vừa chơi', 'Tập sử dụng util đúng lúc', 'Unrated để áp dụng kiến thức'] }
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
