const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const COACH_SYSTEM_PROMPT = `Bạn là một Huấn Luyện Viên Valorant cá nhân cực kỳ chuyên nghiệp, khắt khe nhưng sâu sắc.
Nhiệm vụ của bạn là phân tích dữ liệu chỉ số và thói quen của người chơi, sau đó:
1. Đánh giá phong cách chơi (Ví dụ: Thuần Aim, Não to/Gamesense, Máu liều Entry, hay Bọc hậu).
2. Tìm một hình mẫu Tuyển Thủ Chuyên Nghiệp (Pro Player) có lối chơi tương đồng nhất (VD: Aspas, nAts, Boaster, Jinggg...) để làm kim chỉ nam.
3. Khen ngợi thế mạnh của họ (dựa vào KAST, HS%, First Kills) và chỉ ra điểm yếu (VD: hay chết ở Mid, thủ site kém).
4. Đưa ra lộ trình bài tập 3 ngày tới: Nếu tay to nhưng não bé -> dạy cách dùng não để tận dụng tay to. Nếu game sense tốt nhưng aim yếu -> đưa bài tập Aim cơ bản.
Hãy dùng tone giọng nghiêm túc của một HLV thực thụ, không quá suồng sã nhưng rất nhiệt huyết. Trình bày bằng Tiếng Việt.`;

async function generateCoachFeedback(playerData, recentMatches) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    // Xây dựng Prompt dựa trên data
    const userPrompt = `
      Thông tin người chơi: ${playerData.riotName}#${playerData.riotTag} (Rank: ${playerData.rank})
      Dữ liệu 3 ngày qua:
      - K/D trung bình: ${playerData.kd}
      - KAST: ${playerData.kast}%
      - Tỉ lệ Headshot: ${playerData.hs}%
      - Thường xuyên chơi Hê/Đặc vụ: ${playerData.agents.join(', ')}
      - First Kills (Mạng đầu): ${playerData.fk}
      - First Deaths (Chết đầu): ${playerData.fd}
      - Vị trí chết nhiều nhất: ${playerData.deathHabits}
      
      Hãy phân tích, tìm hình mẫu Pro Player và lên giáo trình!
    `;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      systemInstruction: { parts: [{ text: COACH_SYSTEM_PROMPT }] }
    });

    return result.response.text();
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "HLV đang đi vắng, bot không thể kết nối tới Google Gemini. Hãy chờ tí nhé!";
  }
}

module.exports = {
  generateCoachFeedback
};
