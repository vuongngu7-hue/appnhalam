
import { GoogleGenAI, Type } from "@google/genai";

const FLASH_MODEL = 'gemini-3-flash-preview';

const getAIInstance = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// --- OPTIMIZATION HELPER: CLEAN JSON ---
// AI often returns ```json ... ``` blocks. This function strips them before parsing.
const cleanAndParseJSON = (text: string, fallback: any) => {
  try {
    if (!text) return fallback;
    // Remove markdown code blocks if present
    let cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
    // Sometimes it wraps in just ``` ... ```
    cleanText = cleanText.replace(/```\n?|\n?```/g, '').trim();
    return JSON.parse(cleanText);
  } catch (e) {
    console.warn("JSON Parse Failed:", text);
    return fallback;
  }
};

const SYSTEM_CURRICULUM = `Bạn là Gia sư Gen Z "keo lỳ", năng động.
QUY TẮC:
1. Ngôn ngữ: Teen code hiện đại (slay, xu cà na, gwenchana, overthinking, flex...).
2. Kiến thức: Chuẩn SGK 2018 (Mới).
3. JSON Output: TUYỆT ĐỐI CHÍNH XÁC, không thêm text thừa ngoài JSON khi được yêu cầu.`;

export const generateExamRoadmap = async (grade: string, subject: string): Promise<any> => {
  const ai = getAIInstance();
  try {
    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: `Tạo lộ trình 5 bước ôn tập môn ${subject} lớp ${grade} (SGK 2018). 
      JSON format: {roadmap: [{id: string, title: string, difficulty: 'theory'|'practice'|'hardcore', topics: string[]}]}`,
      config: {
        systemInstruction: SYSTEM_CURRICULUM,
        responseMimeType: "application/json"
      }
    });
    return cleanAndParseJSON(response.text || "{}", { roadmap: [] });
  } catch (e) {
    return { roadmap: [] };
  }
};

export const generateExamPaper = async (subject: string, grade: string, difficulty: string, count: number = 20): Promise<any[]> => {
  const ai = getAIInstance();
  try {
    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: `Tạo đúng ${count} câu hỏi trắc nghiệm lớp ${grade} môn ${subject} bám sát SGK 2018, độ khó: ${difficulty}. 
      Yêu cầu output JSON thuần túy:
      [{
        "question": "Nội dung câu hỏi",
        "options": ["A", "B", "C", "D"],
        "correctAnswerIndex": 0, (0=A, 1=B, 2=C, 3=D)
        "explanation": "Giải thích ngắn gọn kiểu Gen Z"
      }]`,
      config: {
        systemInstruction: SYSTEM_CURRICULUM,
        responseMimeType: "application/json"
      }
    });
    const data = cleanAndParseJSON(response.text || "[]", []);
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.error("Gemini Error:", e);
    return [];
  }
};

export const getTutorResponse = async (msg: string) => {
  const ai = getAIInstance();
  const res = await ai.models.generateContent({
    model: FLASH_MODEL,
    contents: msg,
    config: { systemInstruction: SYSTEM_CURRICULUM }
  });
  return res.text || "Xu cà na, mạng lag rồi ní ơi!";
};

export const analyzeStudyImage = async (base64Image: string, prompt: string) => {
  const ai = getAIInstance();
  const res = await ai.models.generateContent({
    model: FLASH_MODEL,
    contents: {
      parts: [
        { inlineData: { data: base64Image.split(',')[1], mimeType: 'image/jpeg' } },
        { text: prompt }
      ]
    },
    config: { systemInstruction: SYSTEM_CURRICULUM }
  });
  return res.text || "Không soi được ảnh này, mờ quá hoặc lỗi rồi ní.";
};

export const getDailyBlitzQuiz = async (subject: string): Promise<any[]> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: FLASH_MODEL,
    contents: `Tạo 3 câu trắc nghiệm nhanh môn ${subject}. JSON: [{question: string, options: [string], answer: string}]`,
    config: { responseMimeType: "application/json" }
  });
  return cleanAndParseJSON(response.text || "[]", []);
};

export const getDebateResponse = async (history: any[], topic: string) => {
  const ai = getAIInstance();
  const res = await ai.models.generateContent({
    model: FLASH_MODEL,
    contents: history.map(h => ({ role: h.role === 'ai' ? 'model' : 'user', parts: [{ text: h.text }] })),
    config: { systemInstruction: `Bạn là trọng tài tranh biện Gen Z về: ${topic}. Phản biện gắt, dùng ngôn ngữ teen code, hài hước và chấm điểm công tâm.` }
  });
  return res.text || "";
};

export const checkVibePost = async (content: string) => {
  const ai = getAIInstance();
  const res = await ai.models.generateContent({
    model: FLASH_MODEL,
    contents: `Phân tích vibe: "${content}". JSON: {comment: string}`,
    config: { 
      systemInstruction: "Bạn là một AI Gen Z chuyên đi comment dạo. Nhận xét ngắn gọn, hài hước, dùng slang (slay, keo lỳ...).",
      responseMimeType: "application/json" 
    }
  });
  return cleanAndParseJSON(res.text || '{}', { comment: "Vibe này hơi bị đỉnh!" });
};

export const getOracleReading = async () => {
  const ai = getAIInstance();
  try {
    const res = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: `Bạn là "Thần Bài Học Thuật" Gen Z. Bốc 1 lá bài Tarot học tập.
      JSON: {
        "cardName": "Tên lá bài (Hài hước)",
        "rarity": "Common" | "Rare" | "Epic" | "Legendary",
        "message": "Lời tiên tri ngắn gọn kiểu teen code",
        "luckyItem": "Vật phẩm may mắn",
        "buff": "Hiệu ứng buff"
      }`,
      config: { responseMimeType: "application/json" }
    });
    return cleanAndParseJSON(res.text || '{}', {});
  } catch (e) {
    return {
      cardName: "The 404 Error",
      rarity: "Common",
      message: "Vũ trụ đang mất kết nối. Xu cà na!",
      luckyItem: "Nút F5",
      buff: "Không có"
    };
  }
};

export const suggestHashtags = async (content: string) => ["study", "2k7", "2k8", "2k9", "slay", "flex"];
export const roastOrToast = async (user: any, mode: string) => {
    const ai = getAIInstance();
    const res = await ai.models.generateContent({
        model: FLASH_MODEL,
        contents: `${mode === 'roast' ? 'Roast (chê hài hước)' : 'Toast (khen nức nở)'} profile này: ${JSON.stringify(user)}. Dùng ngôn ngữ Gen Z.`,
    });
    return res.text;
};
export const getChampionTip = async (name: string) => "Học không chơi đánh rơi tuổi trẻ, chơi không học bán rẻ tương lai!";

// --- NEW IMPLEMENTATIONS ---

export const getOfficialExamLinks = async (subject: string, year: string, province: string, grade: string) => {
  const ai = getAIInstance();
  const query = `Đề thi chính thức môn ${subject} lớp ${grade} năm ${year} sở GD ${province} có đáp án (file PDF hoặc Word)`;
  try {
    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: query,
      config: { tools: [{ googleSearch: {} }] }
    });
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    return chunks.filter((c: any) => c.web);
  } catch (e) {
    return [];
  }
};

export const generateMindMap = async (topic: string) => {
  const ai = getAIInstance();
  try {
    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: `Tạo sơ đồ tư duy: "${topic}". JSON: { "root": "${topic}", "children": [{ "name": "...", "children": [...] }] }. Max 3 levels.`,
      config: { responseMimeType: "application/json" }
    });
    return cleanAndParseJSON(response.text || '{}', { root: "Lỗi", children: [] });
  } catch (e) {
    return { root: "Lỗi kết nối", children: [] };
  }
};

export const summarizeText = async (text: string) => {
  const ai = getAIInstance();
  try {
    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: `Tóm tắt văn bản sau (Gen Z style, gạch đầu dòng):\n\n${text}`,
    });
    return response.text;
  } catch (e) {
    return "Không thể tóm tắt văn bản này.";
  }
};

export const downloadAsFile = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export const generateFlashcards = async (topic: string) => {
  const ai = getAIInstance();
  try {
    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: `Tạo 10 flashcard về: "${topic}". JSON: [{ "front": "Hỏi", "back": "Đáp" }]. Ngắn gọn, súc tích.`,
      config: { responseMimeType: "application/json" }
    });
    return cleanAndParseJSON(response.text || "[]", []);
  } catch (e) {
    return [];
  }
};

export const gradeEssay = async (essay: string, topic: string) => {
  const ai = getAIInstance();
  try {
    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: `Chấm điểm văn: "${topic}". JSON: { "score": number, "feedback": "Nhận xét (Gen Z)", "improvements": "Cải thiện" }`,
      config: { responseMimeType: "application/json" }
    });
    return cleanAndParseJSON(response.text || "{}", {});
  } catch (e) {
    return null;
  }
};
