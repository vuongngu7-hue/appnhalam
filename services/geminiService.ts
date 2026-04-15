
import { GoogleGenAI, Type, Schema } from "@google/genai";

const FLASH_MODEL = 'gemini-3-flash-preview';

// --- INIT AI CLIENT ---
const getAIInstance = () => {
  const key = process.env.API_KEY;
  if (!key) {
    console.error("API_KEY is missing!");
    throw new Error("Missing API Key");
  }
  return new GoogleGenAI({ apiKey: key });
};

// --- SUPER ROBUST JSON PARSER ---
// Hàm này cực kỳ quan trọng: Tìm và trích xuất JSON hợp lệ từ bất kỳ đống text nào
const cleanAndParseJSON = (text: string, fallback: any) => {
  if (!text) return fallback;
  try {
    // 1. Xóa markdown code blocks
    let clean = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    
    // 2. Tìm điểm bắt đầu ( { hoặc [ )
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

    // 3. Tìm điểm kết thúc ( } hoặc ] ) từ cuối lên
    const lastBrace = clean.lastIndexOf('}');
    const lastBracket = clean.lastIndexOf(']');
    const endIndex = Math.max(lastBrace, lastBracket);

    if (endIndex === -1 || endIndex < startIndex) return fallback;

    // 4. Cắt chuỗi JSON tiềm năng
    const jsonStr = clean.substring(startIndex, endIndex + 1);

    return JSON.parse(jsonStr);
  } catch (e) {
    console.warn("JSON Parse Failed. Raw text preview:", text.substring(0, 100));
    return fallback;
  }
};

const SYSTEM_CURRICULUM = `Bạn là một Gia sư Gen Z thông minh, thân thiện và tâm lý.
QUY TẮC:
1. Ngôn ngữ: Trẻ trung, gần gũi nhưng vẫn lịch sự và tự nhiên. Tránh lạm dụng quá đà các từ lóng (slay, keo lỳ...) nếu không cần thiết. Hãy nói chuyện như một người anh/chị khóa trên đang hướng dẫn em mình.
2. Kiến thức: Luôn bám sát chương trình Giáo dục phổ thông mới (SGK 2018). Giải thích dễ hiểu, có ví dụ thực tế.
3. Phong cách: Khuyến khích, động viên người học. Có thể dùng icon một cách tinh tế.
4. OUTPUT: Chỉ trả về JSON khi được yêu cầu cụ thể.`;

const SYSTEM_SERIOUS = `Bạn là một Giáo sư/Chuyên gia giáo dục hàng đầu, cực kỳ nghiêm túc, chuyên sâu và chi tiết.
QUY TẮC:
1. Ngôn ngữ: Trang trọng, học thuật, chính xác tuyệt đối. Không sử dụng từ lóng hay ngôn ngữ teen.
2. Kiến thức: Cung cấp thông tin chuyên sâu, đa chiều, có dẫn chứng hoặc giải thích cặn kẽ các khái niệm phức tạp.
3. Cấu trúc: Trình bày khoa học, rõ ràng (sử dụng bullet points, tiêu đề nếu cần).
4. Mục tiêu: Giúp người học hiểu sâu bản chất vấn đề một cách học thuật nhất.`;

// --- 1. KHO ĐỀ (FIXED SEARCH LOGIC) ---
// Chuyển sang chiến thuật: Text Prompt -> Parse Markdown & Metadata
export const getOfficialExamLinks = async (subject: string, year: string, province: string, grade: string) => {
  const ai = getAIInstance();
  const query = `Tìm kiếm 5 đường link tải file PDF/Word đề thi chính thức môn ${subject} lớp ${grade} năm ${year} của ${province} (hoặc các trường chuyên tại đó).
  Ưu tiên nguồn: thuvienhoclieu, toanmath, tuyensinh247.
  
  Hãy trả về kết quả dưới dạng danh sách Markdown:
  - [Tiêu đề đề thi](Đường link)
  `;
  
  try {
    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: query,
      config: { 
        tools: [{ googleSearch: {} }] 
        // LƯU Ý: Không dùng responseMimeType: 'application/json' ở đây để tool hoạt động tốt nhất
      }
    });

    // Cách 1: Lấy từ Grounding Metadata (Chính chủ Google trả về)
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    let links = chunks
      .filter((c: any) => c.web?.uri && c.web?.title)
      .map((c: any) => ({ web: { title: c.web.title, uri: c.web.uri } }));

    // Cách 2: Parse từ text (Markdown links) nếu Grounding thiếu
    if (response.text) {
      const regex = /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g;
      let match;
      while ((match = regex.exec(response.text)) !== null) {
        links.push({ web: { title: match[1], uri: match[2] } });
      }
    }

    // Lọc trùng lặp
    const uniqueLinks = Array.from(new Map(links.map(item => [item.web.uri, item])).values());
    
    return uniqueLinks;
  } catch (e) {
    console.error("Search Error:", e);
    return [];
  }
};

// --- 2. TẠO ĐỀ THI (FIXED SCHEMA) ---
export const generateExamPaper = async (subject: string, grade: string, difficulty: string, count: number = 20, isSerious: boolean = false): Promise<any[]> => {
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
      contents: `Tạo ${count} câu trắc nghiệm môn ${subject} lớp ${grade}, độ khó ${difficulty}. Hãy đảm bảo các câu hỏi có tính phân hóa cao và lời giải thích cực kỳ chi tiết, học thuật.
      Output JSON thuần túy. KHÔNG MARKDOWN.`,
      config: {
        systemInstruction: isSerious ? SYSTEM_SERIOUS : SYSTEM_CURRICULUM,
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
export const gradeEssay = async (essay: string, topic: string, isSerious: boolean = false) => {
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
      contents: `Chấm bài văn: "${essay}" (Đề: ${topic}). Hãy đưa ra nhận xét chuyên sâu về cấu trúc, từ vựng và tư duy nghị luận.
      Output JSON: {score, feedback, improvements}`,
      config: {
        systemInstruction: isSerious ? SYSTEM_SERIOUS : SYSTEM_CURRICULUM,
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
      contents: `Lộ trình ôn thi ${subject} lớp ${grade}. JSON: {roadmap: [{id, title, difficulty, topics}]}`,
      config: { responseMimeType: "application/json" }
    });
    return cleanAndParseJSON(response.text || "{}", { roadmap: [] });
  } catch (e) { return { roadmap: [] }; }
};

export const getTutorResponse = async (msg: string, isSerious: boolean = false) => {
  const ai = getAIInstance();
  try {
    const res = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: msg,
      config: { systemInstruction: isSerious ? SYSTEM_SERIOUS : SYSTEM_CURRICULUM }
    });
    return res.text || "Mạng lag quá ní ơi, hỏi lại đi!";
  } catch (e) { return "Lỗi kết nối AI."; }
};

export const analyzeStudyImage = async (base64Image: string, prompt: string, isSerious: boolean = false) => {
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
      config: { systemInstruction: isSerious ? SYSTEM_SERIOUS : SYSTEM_CURRICULUM }
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
      config: { systemInstruction: `Bạn đang trong một cuộc tranh biện về chủ đề: "${topic}". Hãy đưa ra các lập luận sắc bén, logic nhưng vẫn giữ phong cách trẻ trung, có chút hài hước và lôi cuốn. Đừng quá gay gắt nhưng phải bảo vệ vững chắc quan điểm của mình.` }
    });
    return res.text || "";
  } catch (e) { return "AI đang bận suy nghĩ..."; }
};

export const checkVibePost = async (content: string) => {
  const ai = getAIInstance();
  try {
    const res = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: `Vibe check bài đăng này: "${content}". Hãy đưa ra một lời nhận xét ngắn gọn, tự nhiên và thân thiện. JSON: {comment}`,
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
      contents: `Bốc một lá bài Tarot cho việc học tập hôm nay. Hãy đưa ra lời khuyên sâu sắc và tích cực. JSON: {cardName, rarity, message, luckyItem, buff}`,
      config: { responseMimeType: "application/json" }
    });
    return cleanAndParseJSON(res.text || '{}', null);
  } catch (e) { return null; }
};

export const suggestHashtags = async (content: string) => ["study", "genz", "flex"];
export const roastOrToast = async (user: any, mode: string) => {
    const ai = getAIInstance();
    const prompt = mode === 'roast' 
        ? `Hãy "roast" (nhận xét hài hước, châm chọc nhẹ nhàng) profile học tập này một cách duyên dáng, không thô tục: ${JSON.stringify(user)}`
        : `Hãy "toast" (khen ngợi, động viên) profile học tập này một cách chân thành và ấm áp: ${JSON.stringify(user)}`;
    
    try {
        const res = await ai.models.generateContent({
            model: FLASH_MODEL,
            contents: prompt,
        });
        return res.text;
    } catch(e) { return "AI đang bận."; }
};
export const getChampionTip = async (name: string) => "Học đi đôi với hành!";

export const generateMindMap = async (topic: string, isSerious: boolean = false) => {
  const ai = getAIInstance();
  try {
    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: `Tạo Mindmap chuyên sâu về "${topic}". JSON: {root, children: [{name, children}]}. Max 3 levels.`,
      config: { 
        systemInstruction: isSerious ? SYSTEM_SERIOUS : SYSTEM_CURRICULUM,
        responseMimeType: "application/json" 
      }
    });
    return cleanAndParseJSON(response.text || '{}', { root: "Lỗi", children: [] });
  } catch (e) { return { root: "Lỗi kết nối", children: [] }; }
};

export const summarizeText = async (text: string, isSerious: boolean = false) => {
  const ai = getAIInstance();
  try {
    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: `Tóm tắt văn bản sau đây: ${text}`,
      config: { systemInstruction: isSerious ? SYSTEM_SERIOUS : SYSTEM_CURRICULUM }
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

export const generateFlashcards = async (topic: string, isSerious: boolean = false) => {
  const ai = getAIInstance();
  try {
    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: `Tạo 10 flashcard học thuật về: "${topic}". JSON: [{front, back}]`,
      config: { 
        systemInstruction: isSerious ? SYSTEM_SERIOUS : SYSTEM_CURRICULUM,
        responseMimeType: "application/json" 
      }
    });
    return cleanAndParseJSON(response.text || "[]", []);
  } catch (e) { return []; }
};
