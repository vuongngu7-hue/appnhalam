
import { GoogleGenAI, Type, Schema } from "@google/genai";

const FLASH_MODEL = 'gemini-3-flash-preview';

// --- INIT AI CLIENT ---
const getAIInstance = () => {
  // Defensive check for API Key environment
  const key = process.env.API_KEY;
  if (!key) {
    console.error("API_KEY is missing!");
    throw new Error("Missing API Key");
  }
  return new GoogleGenAI({ apiKey: key });
};

// --- SUPER ROBUST JSON PARSER ---
// Hàm này "rửa" sạch mọi text thừa, markdown, code block để lấy JSON chuẩn
const cleanAndParseJSON = (text: string, fallback: any) => {
  if (!text) return fallback;
  try {
    let clean = text.trim();
    // 1. Gỡ bỏ Markdown code blocks
    clean = clean.replace(/```json/gi, '').replace(/```/g, '');
    
    // 2. Tìm điểm bắt đầu và kết thúc của JSON object/array
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

    // Cắt từ điểm bắt đầu
    clean = clean.substring(startIndex);

    // Tìm điểm kết thúc hợp lý nhất (ngược từ dưới lên)
    const lastBrace = clean.lastIndexOf('}');
    const lastBracket = clean.lastIndexOf(']');
    const endIndex = Math.max(lastBrace, lastBracket);

    if (endIndex === -1) return fallback;

    clean = clean.substring(0, endIndex + 1);

    return JSON.parse(clean);
  } catch (e) {
    console.warn("JSON Parse Failed. Raw text:", text);
    return fallback;
  }
};

const SYSTEM_CURRICULUM = `Bạn là Gia sư Gen Z.
QUY TẮC:
1. Ngôn ngữ: Teen code, mặn mòi (slay, keo lỳ, xu cà na...).
2. Kiến thức: Chuẩn SGK 2018.
3. OUTPUT: JSON ONLY. KHÔNG GIẢI THÍCH THÊM.`;

// --- 1. KHO ĐỀ (FIXED SEARCH LOGIC) ---
// Thay vì tự parse metadata, ta nhờ AI tổng hợp luôn
export const getOfficialExamLinks = async (subject: string, year: string, province: string, grade: string) => {
  const ai = getAIInstance();
  try {
    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: `Tìm kiếm 5 link tải đề thi ${subject} lớp ${grade} năm ${year} khu vực ${province}.
      
      QUAN TRỌNG: Sau khi tìm kiếm, hãy trả về kết quả dưới dạng JSON list:
      [
        { "web": { "title": "Tên đề thi", "uri": "Link tải" } },
        ...
      ]
      Chỉ lấy link uy tín (thuvienhoclieu, toanmath, tuyensinh247...).`,
      config: { 
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json" 
      }
    });

    // Ưu tiên 1: Parse JSON trực tiếp từ text AI trả về (Do đã dặn AI trả JSON)
    const data = cleanAndParseJSON(response.text || "[]", []);
    if (Array.isArray(data) && data.length > 0) return data;

    // Ưu tiên 2: Nếu AI không trả JSON, fallback sang Grounding Metadata
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const groundingLinks = chunks
      .filter((c: any) => c.web?.uri && c.web?.title)
      .map((c: any) => ({ web: { title: c.web.title, uri: c.web.uri } }));
      
    return groundingLinks;
  } catch (e) {
    console.error("Search Error:", e);
    return [];
  }
};

// --- 2. TẠO ĐỀ THI (FIXED SCHEMA) ---
export const generateExamPaper = async (subject: string, grade: string, difficulty: string, count: number = 20): Promise<any[]> => {
  const ai = getAIInstance();
  
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
      contents: `Tạo ${count} câu trắc nghiệm môn ${subject} lớp ${grade}, độ khó ${difficulty}.
      Output JSON thuần túy. KHÔNG MARKDOWN.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: examSchema
      }
    });
    
    return cleanAndParseJSON(response.text || "[]", []);
  } catch (e) {
    console.error("Exam Gen Error:", e);
    return []; // Trả về mảng rỗng để UI không crash
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
      contents: `Chấm bài văn: "${essay}" (Đề: ${topic}).
      Output JSON: {score, feedback, improvements}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: gradeSchema
      }
    });
    return cleanAndParseJSON(response.text || "{}", null);
  } catch (e) {
    return null;
  }
};

// --- CÁC HÀM KHÁC (Đã bọc try-catch an toàn) ---

export const generateExamRoadmap = async (grade: string, subject: string): Promise<any> => {
  const ai = getAIInstance();
  try {
    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: `Lộ trình ôn thi ${subject} lớp ${grade}. JSON: {roadmap: [{id, title, difficulty, topics}]}`,
      config: { responseMimeType: "application/json" }
    });
    return cleanAndParseJSON(response.text || "{}", { roadmap: [] });
  } catch (e) { return { roadmap: [] }; }
};

export const getTutorResponse = async (msg: string) => {
  const ai = getAIInstance();
  try {
    const res = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: msg,
      config: { systemInstruction: SYSTEM_CURRICULUM }
    });
    return res.text || "Mạng lag quá ní ơi, hỏi lại đi!";
  } catch (e) { return "Lỗi kết nối AI."; }
};

export const analyzeStudyImage = async (base64Image: string, prompt: string) => {
  const ai = getAIInstance();
  try {
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
    return res.text || "Không đọc được ảnh.";
  } catch (e) { return "Lỗi xử lý ảnh."; }
};

export const getDailyBlitzQuiz = async (subject: string): Promise<any[]> => {
  const ai = getAIInstance();
  try {
    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: `3 câu hỏi trắc nghiệm ${subject}. JSON: [{question, options, answer}]`,
      config: { responseMimeType: "application/json" }
    });
    return cleanAndParseJSON(response.text || "[]", []);
  } catch (e) { return []; }
};

export const getDebateResponse = async (history: any[], topic: string) => {
  const ai = getAIInstance();
  try {
    const res = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: history.map(h => ({ role: h.role === 'ai' ? 'model' : 'user', parts: [{ text: h.text }] })),
      config: { systemInstruction: `Tranh biện về: ${topic}. Gay gắt, hài hước.` }
    });
    return res.text || "";
  } catch (e) { return "AI đang bận suy nghĩ..."; }
};

export const checkVibePost = async (content: string) => {
  const ai = getAIInstance();
  try {
    const res = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: `Vibe check: "${content}". JSON: {comment}`,
      config: { responseMimeType: "application/json" }
    });
    return cleanAndParseJSON(res.text || '{}', { comment: "Vibe đỉnh!" });
  } catch (e) { return { comment: "Vibe đỉnh!" }; }
};

export const getOracleReading = async () => {
  const ai = getAIInstance();
  try {
    const res = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: `Bốc bài Tarot học tập. JSON: {cardName, rarity, message, luckyItem, buff}`,
      config: { responseMimeType: "application/json" }
    });
    return cleanAndParseJSON(res.text || '{}', null);
  } catch (e) { return null; }
};

export const suggestHashtags = async (content: string) => ["study", "2k7", "flex"];
export const roastOrToast = async (user: any, mode: string) => {
    const ai = getAIInstance();
    try {
        const res = await ai.models.generateContent({
            model: FLASH_MODEL,
            contents: `${mode} profile này: ${JSON.stringify(user)}.`,
        });
        return res.text;
    } catch(e) { return "AI đang bận."; }
};
export const getChampionTip = async (name: string) => "Học đi đôi với hành!";

export const generateMindMap = async (topic: string) => {
  const ai = getAIInstance();
  try {
    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: `Mindmap về "${topic}". JSON: {root, children: [{name, children}]}. Max 3 levels.`,
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
      contents: `10 flashcard: "${topic}". JSON: [{front, back}]`,
      config: { responseMimeType: "application/json" }
    });
    return cleanAndParseJSON(response.text || "[]", []);
  } catch (e) { return []; }
};
