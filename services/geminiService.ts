
import { GoogleGenAI, Type, Schema } from "@google/genai";

const FLASH_MODEL = 'gemini-3-flash-preview';

const getAIInstance = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// --- ROBUST JSON PARSER ---
// Dù có schema, đôi khi AI vẫn thêm text thừa. Hàm này lọc sạch sẽ.
const cleanAndParseJSON = (text: string, fallback: any) => {
  try {
    if (!text) return fallback;
    // Tìm điểm bắt đầu { hoặc [ và điểm kết thúc } hoặc ]
    const firstBrace = text.indexOf('{');
    const firstBracket = text.indexOf('[');
    
    let startIndex = -1;
    if (firstBrace === -1 && firstBracket === -1) return fallback;
    if (firstBrace !== -1 && firstBracket !== -1) startIndex = Math.min(firstBrace, firstBracket);
    else startIndex = firstBrace !== -1 ? firstBrace : firstBracket;

    const lastBrace = text.lastIndexOf('}');
    const lastBracket = text.lastIndexOf(']');
    const endIndex = Math.max(lastBrace, lastBracket);

    if (startIndex === -1 || endIndex === -1) return fallback;

    const jsonStr = text.substring(startIndex, endIndex + 1);
    return JSON.parse(jsonStr);
  } catch (e) {
    console.warn("JSON Parse Failed:", text);
    return fallback;
  }
};

const SYSTEM_CURRICULUM = `Bạn là Gia sư Gen Z.
QUY TẮC:
1. Ngôn ngữ: Teen code, mặn mòi (slay, keo lỳ, xu cà na...).
2. Kiến thức: Chuẩn SGK 2018.
3. OUTPUT: CHỈ TRẢ VỀ JSON KHI ĐƯỢC HỎI VỀ DỮ LIỆU. KHÔNG MARKDOWN.`;

// --- 1. KHO ĐỀ (FIXED SEARCH) ---
export const getOfficialExamLinks = async (subject: string, year: string, province: string, grade: string) => {
  const ai = getAIInstance();
  // Prompt lách luật: Yêu cầu AI tìm kiếm rồi format lại thành list Markdown để dễ parse
  const query = `Tìm kiếm 5 đường link tải file PDF/Word đề thi chính thức môn ${subject} lớp ${grade} năm ${year} của ${province} (hoặc các trường chuyên tại đó).
  Yêu cầu trả về định dạng text list:
  - [Tiêu đề đề thi 1](Link 1)
  - [Tiêu đề đề thi 2](Link 2)
  ...
  Không cần giải thích gì thêm.`;
  
  try {
    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: query,
      config: { tools: [{ googleSearch: {} }] }
    });

    // Cách 1: Lấy từ Grounding Metadata (Chính chủ Google)
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    let links = chunks
      .filter((c: any) => c.web?.uri && c.web?.title)
      .map((c: any) => ({ web: { title: c.web.title, uri: c.web.uri } }));

    // Cách 2: Fallback - Parse từ text nếu Grounding không trả về trực tiếp
    if (links.length === 0 && response.text) {
      const regex = /\[(.*?)\]\((https?:\/\/[^\s)]+)\)/g;
      let match;
      while ((match = regex.exec(response.text)) !== null) {
        links.push({ web: { title: match[1], uri: match[2] } });
      }
    }

    return links;
  } catch (e) {
    console.error("Search Error:", e);
    return [];
  }
};

// --- 2. TẠO ĐỀ THI (FIXED SCHEMA) ---
export const generateExamPaper = async (subject: string, grade: string, difficulty: string, count: number = 20): Promise<any[]> => {
  const ai = getAIInstance();
  
  // Định nghĩa Schema cứng
  const examSchema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        question: { type: Type.STRING },
        options: { type: Type.ARRAY, items: { type: Type.STRING } },
        correctAnswerIndex: { type: Type.INTEGER },
        explanation: { type: Type.STRING }
      },
      required: ["question", "options", "correctAnswerIndex", "explanation"]
    }
  };

  try {
    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: `Tạo ${count} câu trắc nghiệm môn ${subject} lớp ${grade} (SGK 2018), độ khó ${difficulty}.
      - Output JSON thuần túy.
      - explanation: Giải thích ngắn gọn, hài hước kiểu Gen Z.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: examSchema
      }
    });
    
    return cleanAndParseJSON(response.text || "[]", []);
  } catch (e) {
    console.error("Exam Gen Error:", e);
    return [];
  }
};

// --- 3. CHẤM VĂN (FIXED SCHEMA) ---
export const gradeEssay = async (essay: string, topic: string) => {
  const ai = getAIInstance();

  const gradeSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      score: { type: Type.NUMBER },
      feedback: { type: Type.STRING },
      improvements: { type: Type.STRING }
    },
    required: ["score", "feedback", "improvements"]
  };

  try {
    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: `Bạn là giáo viên văn Gen Z khó tính nhưng công tâm. Hãy chấm bài văn sau với đề bài: "${topic}".
      Bài làm: "${essay}"
      
      Yêu cầu:
      - score: Điểm số (thang 10, có thể lẻ 0.5).
      - feedback: Nhận xét giọng "xéo xắt" nhưng xây dựng, dùng slang (overthinking, thao túng tâm lý, slay...).
      - improvements: Gợi ý sửa bài cụ thể.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: gradeSchema
      }
    });
    return cleanAndParseJSON(response.text || "{}", null);
  } catch (e) {
    console.error("Grade Error:", e);
    return null;
  }
};

// --- CÁC HÀM KHÁC (GIỮ NGUYÊN HOẶC TỐI ƯU NHẸ) ---

export const generateExamRoadmap = async (grade: string, subject: string): Promise<any> => {
  const ai = getAIInstance();
  try {
    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: `Tạo lộ trình 5 bước ôn tập môn ${subject} lớp ${grade}. JSON format: {roadmap: [{id, title, difficulty, topics}]}`,
      config: { responseMimeType: "application/json" }
    });
    return cleanAndParseJSON(response.text || "{}", { roadmap: [] });
  } catch (e) { return { roadmap: [] }; }
};

export const getTutorResponse = async (msg: string) => {
  const ai = getAIInstance();
  const res = await ai.models.generateContent({
    model: FLASH_MODEL,
    contents: msg,
    config: { systemInstruction: SYSTEM_CURRICULUM }
  });
  return res.text || "Mạng lag quá ní ơi, hỏi lại đi!";
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
  return res.text || "Ảnh mờ quá, lau cam đi ní!";
};

export const getDailyBlitzQuiz = async (subject: string): Promise<any[]> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: FLASH_MODEL,
    contents: `Tạo 3 câu trắc nghiệm nhanh môn ${subject}. JSON: [{question, options, answer}]`,
    config: { responseMimeType: "application/json" }
  });
  return cleanAndParseJSON(response.text || "[]", []);
};

export const getDebateResponse = async (history: any[], topic: string) => {
  const ai = getAIInstance();
  const res = await ai.models.generateContent({
    model: FLASH_MODEL,
    contents: history.map(h => ({ role: h.role === 'ai' ? 'model' : 'user', parts: [{ text: h.text }] })),
    config: { systemInstruction: `Bạn là trọng tài tranh biện về: ${topic}. Phản biện gắt, hài hước.` }
  });
  return res.text || "";
};

export const checkVibePost = async (content: string) => {
  const ai = getAIInstance();
  const res = await ai.models.generateContent({
    model: FLASH_MODEL,
    contents: `Phân tích vibe: "${content}". JSON: {comment: string}`,
    config: { responseMimeType: "application/json" }
  });
  return cleanAndParseJSON(res.text || '{}', { comment: "Vibe đỉnh!" });
};

export const getOracleReading = async () => {
  const ai = getAIInstance();
  try {
    const res = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: `Bốc bài Tarot học tập. JSON: {cardName, rarity, message, luckyItem, buff}`,
      config: { responseMimeType: "application/json" }
    });
    return cleanAndParseJSON(res.text || '{}', {});
  } catch (e) { return null; }
};

export const suggestHashtags = async (content: string) => ["study", "genz", "flex"];
export const roastOrToast = async (user: any, mode: string) => {
    const ai = getAIInstance();
    const res = await ai.models.generateContent({
        model: FLASH_MODEL,
        contents: `${mode} profile này: ${JSON.stringify(user)}. Gen Z style.`,
    });
    return res.text;
};
export const getChampionTip = async (name: string) => "Học đi đôi với hành!";

export const generateMindMap = async (topic: string) => {
  const ai = getAIInstance();
  try {
    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: `Tạo Mindmap về "${topic}". JSON: {root, children: [{name, children}]}. Max 3 levels.`,
      config: { responseMimeType: "application/json" }
    });
    return cleanAndParseJSON(response.text || '{}', { root: "Lỗi", children: [] });
  } catch (e) { return { root: "Lỗi kết nối", children: [] }; }
};

export const summarizeText = async (text: string) => {
  const ai = getAIInstance();
  try {
    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: `Tóm tắt: ${text}`,
    });
    return response.text;
  } catch (e) { return "Lỗi tóm tắt."; }
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
      contents: `Tạo 10 flashcard: "${topic}". JSON: [{front, back}]`,
      config: { responseMimeType: "application/json" }
    });
    return cleanAndParseJSON(response.text || "[]", []);
  } catch (e) { return []; }
};
