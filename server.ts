import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

const getAIInstance = () => {
  const key = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!key) {
    throw new Error("GEMINI_API_KEY is required for server-side AI features");
  }
  return new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
};

const FLASH_MODEL = 'gemini-3.5-flash';

const cleanAndParseJSON = (text: string, fallback: any) => {
  if (!text) return fallback;
  try {
    let clean = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    const firstBrace = clean.indexOf('{');
    const firstBracket = clean.indexOf('[');
    let startIndex = -1;
    if (firstBrace !== -1 && firstBracket !== -1) {
      startIndex = Math.min(firstBrace, firstBracket);
    } else if (firstBrace !== -1) {
      startIndex = firstBrace;
    } else {
      startIndex = firstBracket;
    }
    if (startIndex === -1) return fallback;
    const lastBrace = clean.lastIndexOf('}');
    const lastBracket = clean.lastIndexOf(']');
    const endIndex = Math.max(lastBrace, lastBracket);
    if (endIndex === -1 || endIndex < startIndex) return fallback;
    const jsonStr = clean.substring(startIndex, endIndex + 1);
    return JSON.parse(jsonStr);
  } catch (e) {
    console.warn("JSON Parse Failed: ", e);
    return fallback;
  }
};

const SYSTEM_CURRICULUM = `Bạn là một Gia sư Gen Z (Study-Buddy) kiêm AI giáo dục có kiểm chứng nguồn cực kỳ tâm lý, thông minh.
QUY TẮC PHÁT NGÔN BẮT BUỘC:
Mọi câu trả lời giải thích kiến thức học tập hoặc phản hồi học thuật của bạn đều phải có định dạng rõ ràng gồm đúng 3 phần sau:

1. Nội dung trả lời: [Giải thích kiến thức bằng ngôn từ Gen Z trẻ trung, gần gũi như "fen", "chill", "vibe" nhưng vẫn chính xác].
2. Nguồn tham khảo: [Chỉ rõ nguồn học liệu chính thống. Thứ tự ưu tiên: SGK Bộ GD&ĐT (chỉ rõ tên sách, ví dụ: SGK Toán 12 Cánh Diều), Đề minh họa Bộ GD&ĐT, Đề thi chính thức của Sở GD, hoặc Tài liệu giáo dục uy tín khác. Nếu không tìm thấy nguồn chính thức pháp lý rõ ràng thì bắt buộc phải ghi cụ thể cụm từ: "Chưa xác minh được nguồn chính thức."]
3. Mức độ tin cậy: [Ước lượng độ chính xác thực tế, ví dụ: "Tuyệt đối (100%)" hoặc "Cao (95%)", kèm lý do đánh giá ngắn gọn].`;

const SYSTEM_SERIOUS = `Bạn là một Giáo sư AI/Chuyên gia học thuật kiêm AI giáo dục có kiểm chứng nguồn với tư duy sắc bén.
QUY TẮC PHÁT NGÔN BẮT BUỘC:
Mọi câu trả lời giải thích kiến thức học thuật của bạn đều phải có định dạng rõ ràng gồm đúng 3 phần sau:

1. Nội dung trả lời: [Chuyên nghiệp, chuẩn mực, phân tích chuyên sâu chi tiết căn bản bản chất cốt lõi (First Principles) từng bước một].
2. Nguồn tham khảo: [Chỉ rõ nguồn học liệu chính thống khoa học. Thứ tự ưu tiên: SGK Bộ GD&ĐT (nêu cụ thể tên sách, lớp), Đề minh họa Bộ GD&ĐT, Đề thi chính thức của Sở GD, hoặc Tài liệu giáo dục uy tín khác. Nếu không tìm thấy nguồn chính thức pháp lý rõ ràng thì bắt buộc phải ghi cụ thể cụm từ: "Chưa xác minh được nguồn chính thức."]
3. Mức độ tin cậy: [Ước lượng độ tin cậy học thuật bằng phần trăm %, kèm lý do ngắn gọn].`;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "20mb" }));

  // AI Endpoint proxies
  app.post("/api/gemini/getOfficialExamLinks", async (req, res) => {
    try {
      const { subject, year, province, grade } = req.body;
      const ai = getAIInstance();
      const query = `Tìm kiếm 5 đường link tải file PDF/Word đề thi chính thức môn ${subject} lớp ${grade} năm ${year} của ${province} (hoặc các trường chuyên tại đó).
      Ưu tiên nguồn: thuvienhoclieu, toanmath, tuyensinh247.
      
      Hãy trả về kết quả dưới dạng danh sách Markdown:
      - [Tiêu đề đề thi](Đường link)
      `;
      const response = await ai.models.generateContent({
        model: FLASH_MODEL,
        contents: query,
        config: { tools: [{ googleSearch: {} }] }
      });

      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const links = chunks
        .filter((c: any) => c.web?.uri && c.web?.title)
        .map((c: any) => ({ web: { title: c.web.title, uri: c.web.uri } }));

      if (response.text) {
        const regex = /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g;
        let match;
        while ((match = regex.exec(response.text)) !== null) {
          links.push({ web: { title: match[1], uri: match[2] } });
        }
      }

      const uniqueLinks = Array.from(new Map(links.map((item: any) => [item.web.uri, item])).values());
      res.json(uniqueLinks);
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message || "Xử lý AI lỗi" });
    }
  });

  app.post("/api/gemini/generateExamPaper", async (req, res) => {
    try {
      const { subjectOrSource, grade, difficulty, count, isSerious } = req.body;
      const ai = getAIInstance();
      const response = await ai.models.generateContent({
        model: FLASH_MODEL,
        contents: `Bạn là AI tạo đề thi chuyên nghiệp.
      
Nhiệm vụ:
1. Phân tích nguồn đề hoặc chủ đề được cung cấp: "${subjectOrSource}"
2. Tạo đề trắc nghiệm mới hoàn toàn gồm ${count} câu hỏi ở mức độ lớp ${grade}, độ khó bám sát mục tiêu "${difficulty}".
3. Không sao chép nguyên văn câu hỏi từ nguồn đề đã cung cấp mà hãy phát triển sáng tạo các câu hỏi mới có cấu trúc/kiến thức tương đương.
4. Trả kết quả dưới dạng HTML chứa danh sách các câu hỏi. KHÔNG TRẢ JSON, KHÔNG BỌC TRONG BLOCK CODE JSON. Trả về mã HTML thuần túy hoặc bọc trong markdown block \`\`\`html \`\`\`.

Mỗi câu hỏi PHẢI tuân thủ CHÍNH XÁC cấu trúc sau:
<div class="question" data-correct="[Ký tự đáp án đúng A/B/C/D]" data-explanation="1. Nội dung lời giải: [Giải thích chi tiết vì sao đáp án đó đúng]. 2. Nguồn tham khảo: [Ghi nguồn cụ thể: SGK Bộ GD&ĐT lớp X, Đề minh họa Bộ GD&ĐT, hoặc Đề thi chính thức của Sở GD. Nếu không rõ nguồn thì ghi chính xác 'Chưa xác minh được nguồn chính thức.']. 3. Mức độ tin cậy: [Đánh giá % tin cậy kèm lý do ngắn gọn].">
<h3>Câu [Số thứ tự]</h3>
<p>[Đề bài và câu hỏi]</p>
<button>A. [Lựa chọn A]</button>
<button>B. [Lựa chọn B]</button>
<button>C. [Lựa chọn C]</button>
<button>D. [Lựa chọn D]</button>
</div>

Ví dụ chính xác:
<div class="question" data-correct="B" data-explanation="1. Nội dung lời giải: Đạo hàm của x^2 là 2x. Thay x = 2 ta được 2*2 = 4. 2. Nguồn tham khảo: SGK Toán 11 Cánh Diều trang 65. 3. Mức độ tin cậy: 100% do đây là công thức đạo hàm cơ bản chuẩn toán bám sát chương trình học.">
<h3>Câu 1</h3>
<p>Tính đạo hàm của hàm số y = x^2 tại điểm x = 2.</p>
<button>A. 2</button>
<button>B. 4</button>
<button>C. 8</button>
<button>D. 16</button>
</div>`,
        config: {
          systemInstruction: isSerious ? SYSTEM_SERIOUS : SYSTEM_CURRICULUM,
        }
      });
      res.json({ text: response.text || "" });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message || "Xử lý AI lỗi" });
    }
  });

  app.post("/api/gemini/generateStructuredExamPaper", async (req, res) => {
    try {
      const { subject, grade, difficulty, count, isSerious } = req.body;
      const ai = getAIInstance();
      const response = await ai.models.generateContent({
        model: FLASH_MODEL,
        contents: `Hãy tạo đề thi trắc nghiệm môn ${subject} lớp ${grade}, mục tiêu độ khó: ${difficulty}, gồm đúng ${count} câu hỏi bám sát cấu trúc mới nhất của Bộ GD&ĐT và SGK chương trình mới 2018 (Kết nối tri thức, Chân trời sáng tạo, Cánh diều). 
        
        Yêu cầu bắt buộc về cấu trúc JSON xuất ra:
        Hãy trả về một mảng JSON các câu hỏi. Mỗi câu hỏi gồm:
        - "question": đề bài trắc nghiệm.
        - "options": một mảng gồm đúng 4 chuỗi đại diện cho đáp án A, B, C, D (phải ghi rõ "A. ...", "B. ...", "C. ...", "D. ...")
        - "answer": chữ cái in hoa đáp án đúng ("A", "B", "C" hoặc "D")
        - "explanation": giải thích chi tiết đáp án đúng và trích dẫn chuẩn SGK Bộ Giáo dục hoặc đề minh họa Bộ GD&ĐT.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                answer: { type: Type.STRING },
                explanation: { type: Type.STRING }
              },
              required: ["question", "options", "answer", "explanation"]
            }
          },
          systemInstruction: isSerious ? SYSTEM_SERIOUS : SYSTEM_CURRICULUM
        }
      });
      res.json(cleanAndParseJSON(response.text || "[]", []));
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message || "Xử lý AI lỗi" });
    }
  });

  app.post("/api/gemini/gradeEssay", async (req, res) => {
    try {
      const { essay, topic, isSerious } = req.body;
      const ai = getAIInstance();
      const response = await ai.models.generateContent({
        model: FLASH_MODEL,
        contents: `Chấm bài văn: "${essay}" (Đề: ${topic}). Hãy đưa ra nhận xét chuyên sâu về cấu trúc, từ vựng và tư duy nghị luận.
        Output JSON: {score, feedback, improvements}`,
        config: {
          systemInstruction: isSerious ? SYSTEM_SERIOUS : SYSTEM_CURRICULUM,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.NUMBER },
              feedback: { type: Type.STRING },
              improvements: { type: Type.STRING }
            },
            required: ["score", "feedback", "improvements"]
          }
        }
      });
      res.json(cleanAndParseJSON(response.text || "{}", null));
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message || "Xử lý AI lỗi" });
    }
  });

  app.post("/api/gemini/generateExamRoadmap", async (req, res) => {
    try {
      const { grade, subject } = req.body;
      const ai = getAIInstance();
      const response = await ai.models.generateContent({
        model: FLASH_MODEL,
        contents: `Lộ trình ôn thi ${subject} lớp ${grade}. JSON: {roadmap: [{id, title, difficulty, topics}]}`,
        config: { responseMimeType: "application/json" }
      });
      res.json(cleanAndParseJSON(response.text || "{}", { roadmap: [] }));
    } catch (e: any) {
      console.error(e);
      res.json({ roadmap: [] });
    }
  });

  app.post("/api/gemini/getTutorResponse", async (req, res) => {
    try {
      const { msg, isSerious } = req.body;
      const ai = getAIInstance();
      const response = await ai.models.generateContent({
        model: FLASH_MODEL,
        contents: msg,
        config: { systemInstruction: isSerious ? SYSTEM_SERIOUS : SYSTEM_CURRICULUM }
      });
      res.json({ text: response.text || "Mạng lag quá ní ơi, hỏi lại đi!" });
    } catch (e: any) {
      console.error(e);
      res.json({ text: "Lỗi kết nối AI." });
    }
  });

  app.post("/api/gemini/analyzeStudyImage", async (req, res) => {
    try {
      const { base64Image, prompt, isSerious } = req.body;
      const ai = getAIInstance();
      const response = await ai.models.generateContent({
        model: FLASH_MODEL,
        contents: {
          parts: [
            { inlineData: { data: base64Image.split(',')[1], mimeType: 'image/jpeg' } },
            { text: prompt }
          ]
        },
        config: { systemInstruction: isSerious ? SYSTEM_SERIOUS : SYSTEM_CURRICULUM }
      });
      res.json({ text: response.text || "Không đọc được ảnh." });
    } catch (e: any) {
      console.error(e);
      res.json({ text: "Lỗi xử lý ảnh." });
    }
  });

  app.post("/api/gemini/getDailyBlitzQuiz", async (req, res) => {
    try {
      const { subject } = req.body;
      const ai = getAIInstance();
      const response = await ai.models.generateContent({
        model: FLASH_MODEL,
        contents: `3 câu hỏi trắc nghiệm ${subject}. JSON: [{question, options, answer}]`,
        config: { responseMimeType: "application/json" }
      });
      res.json(cleanAndParseJSON(response.text || "[]", []));
    } catch (e: any) {
      console.error(e);
      res.json([]);
    }
  });

  app.post("/api/gemini/getDebateResponse", async (req, res) => {
    try {
      const { history, topic } = req.body;
      const ai = getAIInstance();
      const response = await ai.models.generateContent({
        model: FLASH_MODEL,
        contents: history.map((h: any) => ({ role: h.role === 'ai' ? 'model' : 'user', parts: [{ text: h.text }] })),
        config: { systemInstruction: `Bạn đang trong một cuộc tranh biện về chủ đề: "${topic}". Hãy đưa ra các lập luận sắc bén, logic nhưng vẫn giữ phong cách trẻ trung, có chút hài hước và lôi cuốn. Đừng quá gay gắt nhưng phải bảo vệ vững chắc quan điểm của mình.` }
      });
      res.json({ text: response.text || "" });
    } catch (e: any) {
      console.error(e);
      res.json({ text: "AI đang bận suy nghĩ..." });
    }
  });

  app.post("/api/gemini/checkVibePost", async (req, res) => {
    try {
      const { content } = req.body;
      const ai = getAIInstance();
      const response = await ai.models.generateContent({
        model: FLASH_MODEL,
        contents: `Vibe check bài đăng này: "${content}". Hãy đưa ra một lời nhận xét ngắn gọn, tự nhiên và thân thiện. JSON: {comment}`,
        config: { responseMimeType: "application/json" }
      });
      res.json(cleanAndParseJSON(response.text || '{}', { comment: "Vibe đỉnh!" }));
    } catch (e: any) {
      console.error(e);
      res.json({ comment: "Vibe đỉnh!" });
    }
  });

  app.post("/api/gemini/getOracleReading", async (req, res) => {
    try {
      const ai = getAIInstance();
      const response = await ai.models.generateContent({
        model: FLASH_MODEL,
        contents: `Bốc một lá bài Tarot cho việc học tập hôm nay. Hãy đưa ra lời khuyên sâu sắc và tích cực. JSON: {cardName, rarity, message, luckyItem, buff}`,
        config: { responseMimeType: "application/json" }
      });
      res.json(cleanAndParseJSON(response.text || '{}', null));
    } catch (e: any) {
      console.error(e);
      res.json(null);
    }
  });

  app.post("/api/gemini/roastOrToast", async (req, res) => {
    try {
      const { user, mode } = req.body;
      const ai = getAIInstance();
      const prompt = mode === 'roast' 
          ? `Hãy "roast" (nhận xét hài hước, châm chọc nhẹ nhàng) profile học tập này một cách duyên dáng, không thô tục: ${JSON.stringify(user)}`
          : `Hãy "toast" (khen ngợi, động viên) profile học tập này một cách chân thành và ấm áp: ${JSON.stringify(user)}`;
      const response = await ai.models.generateContent({
        model: FLASH_MODEL,
        contents: prompt
      });
      res.json({ text: response.text || "" });
    } catch (e: any) {
      console.error(e);
      res.json({ text: "AI đang bận." });
    }
  });

  app.post("/api/gemini/generateMindMap", async (req, res) => {
    try {
      const { topic, isSerious } = req.body;
      const ai = getAIInstance();
      const response = await ai.models.generateContent({
        model: FLASH_MODEL,
        contents: `Tạo sơ đồ tư duy (Mindmap) toàn diện và logic về chủ đề: "${topic}".
        YÊU CẦU:
        1. Cấu trúc: Phân cấp rõ ràng, tối đa 4 cấp độ.
        2. Nội dung: Mỗi nút (node) phải súc tích nhưng đầy đủ ý nghĩa. Đảm bảo tính bao quát kiến thức.
        3. Định dạng JSON: { "name": "Chủ đề gốc", "children": [ { "name": "Nhánh 1", "children": [...] } ] }`,
        config: {
          systemInstruction: isSerious ? SYSTEM_SERIOUS : SYSTEM_CURRICULUM,
          responseMimeType: "application/json"
        }
      });
      res.json(cleanAndParseJSON(response.text || '{}', { name: "Lỗi", children: [] }));
    } catch (e: any) {
      console.error(e);
      res.json({ name: "Lỗi kết nối", children: [] });
    }
  });

  app.post("/api/gemini/summarizeText", async (req, res) => {
    try {
      const { text, isSerious } = req.body;
      const ai = getAIInstance();
      const response = await ai.models.generateContent({
        model: FLASH_MODEL,
        contents: `Tóm tắt văn bản sau đây: ${text}`,
        config: { systemInstruction: isSerious ? SYSTEM_SERIOUS : SYSTEM_CURRICULUM }
      });
      res.json({ text: response.text || "" });
    } catch (e: any) {
      console.error(e);
      res.json({ text: "Lỗi tóm tắt." });
    }
  });

  app.post("/api/gemini/generateFlashcards", async (req, res) => {
    try {
      const { topic, isSerious } = req.body;
      const ai = getAIInstance();
      const response = await ai.models.generateContent({
        model: FLASH_MODEL,
        contents: `Tạo 10 flashcard học thuật về: "${topic}". JSON: [{front, back}]`,
        config: {
          systemInstruction: isSerious ? SYSTEM_SERIOUS : SYSTEM_CURRICULUM,
          responseMimeType: "application/json"
        }
      });
      res.json(cleanAndParseJSON(response.text || "[]", []));
    } catch (e: any) {
      console.error(e);
      res.json([]);
    }
  });

  // Serve static assets or mount Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
