// Helper function to send requests to Express API routes
const apiCall = async (action: string, body: any = {}) => {
  try {
    const response = await fetch(`/api/gemini/${action}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error in Gemini API Call (${action}):`, error);
    throw error;
  }
};

export const getOfficialExamLinks = async (subject: string, year: string, province: string, grade: string) => {
  return apiCall("getOfficialExamLinks", { subject, year, province, grade });
};

export const generateExamPaper = async (subjectOrSource: string, grade: string, difficulty: string, count: number = 10, isSerious: boolean = false): Promise<string> => {
  try {
    const result = await apiCall("generateExamPaper", { subjectOrSource, grade, difficulty, count, isSerious });
    return result?.text || "";
  } catch (e) {
    console.error("Exam Gen Error:", e);
    return "";
  }
};

export const generateStructuredExamPaper = async (subject: string, grade: string, difficulty: string, count: number = 10, isSerious: boolean = false): Promise<any[]> => {
  try {
    return await apiCall("generateStructuredExamPaper", { subject, grade, difficulty, count, isSerious });
  } catch (e) {
    console.error("Structured Exam Generation Error:", e);
    return [];
  }
};

export const gradeEssay = async (essay: string, topic: string, isSerious: boolean = false) => {
  try {
    return await apiCall("gradeEssay", { essay, topic, isSerious });
  } catch (e) {
    console.error("Grade Error:", e);
    return null;
  }
};

export const generateExamRoadmap = async (grade: string, subject: string): Promise<any> => {
  try {
    return await apiCall("generateExamRoadmap", { grade, subject });
  } catch (e) {
    return { roadmap: [] };
  }
};

export const getTutorResponse = async (msg: string, isSerious: boolean = false) => {
  try {
    const result = await apiCall("getTutorResponse", { msg, isSerious });
    return result?.text || "Mạng lag quá ní ơi, hỏi lại đi!";
  } catch (e) {
    return "Lỗi kết nối AI.";
  }
};

export const analyzeStudyImage = async (base64Image: string, prompt: string, isSerious: boolean = false) => {
  try {
    const result = await apiCall("analyzeStudyImage", { base64Image, prompt, isSerious });
    return result?.text || "Không đọc được ảnh.";
  } catch (e) {
    return "Lỗi xử lý ảnh.";
  }
};

export const getDailyBlitzQuiz = async (subject: string): Promise<any[]> => {
  try {
    return await apiCall("getDailyBlitzQuiz", { subject });
  } catch (e) {
    return [];
  }
};

export const getDebateResponse = async (history: any[], topic: string) => {
  try {
    const result = await apiCall("getDebateResponse", { history, topic });
    return result?.text || "";
  } catch (e) {
    return "AI đang bận suy nghĩ...";
  }
};

export const checkVibePost = async (content: string) => {
  try {
    return await apiCall("checkVibePost", { content });
  } catch (e) {
    return { comment: "Vibe đỉnh!" };
  }
};

export const getOracleReading = async () => {
  try {
    return await apiCall("getOracleReading");
  } catch (e) {
    return null;
  }
};

export const suggestHashtags = async (content: string) => ["study", "genz", "flex"];

export const roastOrToast = async (user: any, mode: string) => {
  try {
    const result = await apiCall("roastOrToast", { user, mode });
    return result?.text || "AI đang bận.";
  } catch (e) {
    return "AI đang bận.";
  }
};

export const getChampionTip = async (name: string) => "Học đi đối với hành!";

export const generateMindMap = async (topic: string, isSerious: boolean = false) => {
  try {
    return await apiCall("generateMindMap", { topic, isSerious });
  } catch (e) {
    return { name: "Lỗi kết nối", children: [] };
  }
};

export const summarizeText = async (text: string, isSerious: boolean = false) => {
  try {
    const result = await apiCall("summarizeText", { text, isSerious });
    return result?.text || "Lỗi tóm tắt.";
  } catch (e) {
    return "Lỗi tóm tắt.";
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

export const generateFlashcards = async (topic: string, isSerious: boolean = false) => {
  try {
    return await apiCall("generateFlashcards", { topic, isSerious });
  } catch (e) {
    return [];
  }
};
