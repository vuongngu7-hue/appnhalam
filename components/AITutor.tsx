
import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, Sparkles, Trash2, Camera, Image as ImageIcon, X, Zap, MessageSquare, BookOpen, BrainCircuit, Globe, Mic, MicOff, Volume2, FastForward, CheckCircle2, AlertCircle } from 'lucide-react';
import { Message, UserProfile, Modality } from '../types';
import { GoogleGenAI } from '@google/genai';
import { getTutorResponse, analyzeStudyImage } from '../services/geminiService';
import MarkdownText from './MarkdownText';

// Helper for Live API
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) { binary += String.fromCharCode(bytes[i]); }
  return btoa(binary);
}

// Robust layout parser for source-controlled educational replies
export interface ParsedTutorReply {
  mainContent: string;
  source: string;
  confidence: string;
  isParsed: boolean;
}

export const parseTutorReply = (text: string): ParsedTutorReply => {
  if (!text) return { mainContent: '', source: '', confidence: '', isParsed: false };

  // Patterns to locate key phrases
  const contentHeaders = [
    /1\.\s*(?:Nội dung trả lời|Noi dung tra loi)\s*:?\*?\*/i,
    /(?:Nội dung trả lời|Noi dung tra loi)\s*:?\*?\*/i,
    /1\.\s*(?:Nội dung lời giải|Noi dung loi giai)\s*:?\*?\*/i,
    /(?:Nội dung lời giải|Noi dung loi gia)\s*:?\*?\*/i,
  ];

  const sourceHeaders = [
    /2\.\s*(?:Nguồn tham khảo|Nguon tham khao|Nguồn|Nguon)\s*:?\*?\*/i,
    /(?:Nguồn tham khảo|Nguon tham khao)\s*:?\*?\*/i,
  ];

  const confidenceHeaders = [
    /3\.\s*(?:Mức độ tin cậy|Muc do tin cay|Mức độ|Muc do|Độ tin cậy|Do tin cay|Tin cậy|Tin cay)\s*:?\*?\*/i,
    /(?:Mức độ tin cậy|Muc do tin cay|Độ tin cậy|Do tin cay|Tin cậy|Tin cay)\s*:?\*?\*/i,
  ];

  let contentPos = -1;
  let contentHeaderMatched = '';
  for (const regex of contentHeaders) {
    const match = text.match(regex);
    if (match && match.index !== undefined) {
      contentPos = match.index;
      contentHeaderMatched = match[0];
      break;
    }
  }

  let sourcePos = -1;
  let sourceHeaderMatched = '';
  for (const regex of sourceHeaders) {
    const match = text.match(regex);
    if (match && match.index !== undefined) {
      sourcePos = match.index;
      sourceHeaderMatched = match[0];
      break;
    }
  }

  let confidencePos = -1;
  let confidenceHeaderMatched = '';
  for (const regex of confidenceHeaders) {
    const match = text.match(regex);
    if (match && match.index !== undefined) {
      confidencePos = match.index;
      confidenceHeaderMatched = match[0];
      break;
    }
  }

  if (sourcePos !== -1 || confidencePos !== -1) {
    let mainContent = '';
    let source = '';
    let confidence = '';

    const startOfContent = contentPos !== -1 ? contentPos + contentHeaderMatched.length : 0;
    
    let endOfContent = text.length;
    if (sourcePos !== -1 && sourcePos > startOfContent) {
      endOfContent = Math.min(endOfContent, sourcePos);
    }
    if (confidencePos !== -1 && confidencePos > startOfContent) {
      endOfContent = Math.min(endOfContent, confidencePos);
    }

    mainContent = text.substring(startOfContent, endOfContent).trim();

    if (sourcePos !== -1) {
      const startOfSource = sourcePos + sourceHeaderMatched.length;
      let endOfSource = text.length;
      if (confidencePos !== -1 && confidencePos > startOfSource) {
        endOfSource = confidencePos;
      }
      source = text.substring(startOfSource, endOfSource).trim();
    }

    if (confidencePos !== -1) {
      const startOfConfidence = confidencePos + confidenceHeaderMatched.length;
      confidence = text.substring(startOfConfidence).trim();
    }

    const cleanSection = (str: string) => {
      let s = str.trim();
      s = s.replace(/^[\*\s\:\-\'\"]+/, '').replace(/[\*\s\:\-\'\"]+$/, '');
      return s.trim();
    };

    mainContent = cleanSection(mainContent);
    source = cleanSection(source);
    confidence = cleanSection(confidence);

    if (!mainContent && text) {
      return { mainContent: text, source: '', confidence: '', isParsed: false };
    }

    return {
      mainContent,
      source: source || 'Chưa xác minh được nguồn chính thức.',
      confidence: confidence || 'Chưa có thông tin đánh giá độ tin cậy.',
      isParsed: true
    };
  }

  return {
    mainContent: text,
    source: '',
    confidence: '',
    isParsed: false
  };
};

const AITutor: React.FC<{ userData: UserProfile; onExp: (amount: number) => void }> = ({ userData, onExp }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [isFastMode, setIsFastMode] = useState(true);
  const [isSeriousMode, setIsSeriousMode] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sessionRef = useRef<any>(null);

  const toggleLiveMode = async () => {
    if (isLive) {
      if (sessionRef.current) sessionRef.current.close();
      setIsLive(false);
      return;
    }
    // Live API Logic... (giữ nguyên hoặc tối ưu thêm nếu cần)
    setIsLive(true);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async (customText?: string) => {
    const textToSend = customText || input;
    if ((!textToSend.trim() && !selectedImage) || isTyping) return;
    
    const userText = textToSend.trim();
    const imageToProcess = selectedImage;
    setInput('');
    setSelectedImage(null);

    setMessages(prev => [...prev, { role: 'user', text: imageToProcess ? `[Ảnh] ${userText}` : userText, timestamp: Date.now() }]);
    setIsTyping(true);

    try {
      const promptSuffix = isFastMode ? " (Hãy viết phần 'Nội dung trả lời' thật súc tích ngắn gọn, bám sát trọng tâm trong 1-2 câu, nhưng vẫn bắt buộc hiển thị đủ 'Nguồn tham khảo' và 'Mức độ tin cậy' theo mẫu bắt buộc)" : "";
      const replyText = imageToProcess 
        ? await analyzeStudyImage(imageToProcess, (userText || "Giải thích ảnh này") + promptSuffix, isSeriousMode)
        : await getTutorResponse(userText + promptSuffix, isSeriousMode);
      setMessages(prev => [...prev, { role: 'ai', text: replyText, timestamp: Date.now() }]);
      onExp(15);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'ai', text: "Lỗi kết nối AI rồi fen!", timestamp: Date.now() }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/50 relative overflow-hidden rounded-[3rem] border border-white/10 shadow-2xl">
      {/* Header */}
      <div className="glass-card p-5 border-b border-white/10 flex items-center justify-between shadow-sm z-10 sticky top-0 rounded-t-[3rem]">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-[1.2rem] flex items-center justify-center text-white shadow-[0_0_15px_rgba(99,102,241,0.5)] animate-float"><Bot size={28} /></div>
          <div>
            <h3 className="font-black text-white tracking-tight neon-text">
              {isSeriousMode ? 'AI Expert Mentor' : 'AI Study Buddy'}
            </h3>
            <div className="flex items-center gap-2 mt-1">
                <span className="text-[9px] text-green-400 font-black uppercase tracking-widest flex items-center gap-1 drop-shadow-[0_0_5px_rgba(74,222,128,0.8)]"><Zap size={10} fill="currentColor"/> Online</span>
                <button 
                  onClick={() => setIsFastMode(!isFastMode)}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black transition-all ${isFastMode ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-800 text-slate-400 border border-white/10'}`}
                >
                  <FastForward size={10}/> {isFastMode ? 'SIÊU TỐC ON' : 'BÌNH THƯỜNG'}
                </button>
                <button 
                  onClick={() => setIsSeriousMode(!isSeriousMode)}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black transition-all ${isSeriousMode ? 'bg-indigo-500 text-white shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-slate-800 text-slate-400 border border-white/10'}`}
                >
                  <BrainCircuit size={10}/> {isSeriousMode ? 'CHUYÊN GIA' : 'TÂM SỰ'}
                </button>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
           <button onClick={() => setMessages([])} className="p-3 text-slate-400 hover:text-rose-400 hover:bg-white/5 rounded-xl transition-colors"><Trash2 size={20} /></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar pb-32 custom-scrollbar">
        {messages.map((m, i) => {
          const isUser = m.role === 'user';
          let renderedContent = <MarkdownText text={m.text} />;
          
          if (!isUser) {
            const parsed = parseTutorReply(m.text);
            if (parsed.isParsed) {
              const isUnverified = parsed.source.toLowerCase().includes("chưa xác minh") || parsed.source.toLowerCase().includes("chua xac minh");
              const pctMatch = parsed.confidence.match(/(\d+)\s*%/);
              const percentValue = pctMatch ? parseInt(pctMatch[1]) : null;

              renderedContent = (
                <div className="space-y-4">
                  <div className="prose prose-invert max-w-none text-slate-200">
                    <MarkdownText text={parsed.mainContent} />
                  </div>
                  
                  <div className="border-t border-white/5 my-3" />
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                    <div className={`p-3.5 rounded-2xl border text-xs leading-relaxed flex flex-col justify-between transition-all ${
                      isUnverified 
                        ? 'bg-rose-500/5 border-rose-500/20 text-rose-300' 
                        : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300'
                    }`}>
                      <div>
                        <div className="flex items-center gap-1.5 font-black uppercase tracking-wider text-[9px] mb-1.5 text-slate-400">
                          {isUnverified ? (
                            <AlertCircle size={13} className="text-rose-400 shrink-0" />
                          ) : (
                            <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                          )}
                          Nguồn học liệu kiểm chứng
                        </div>
                        <p className="font-semibold text-slate-200">{parsed.source}</p>
                      </div>
                      <div className="mt-2 text-[8px] text-slate-500 font-bold uppercase tracking-widest">
                        {isUnverified ? "Cần lưu ý" : "Đã kiểm chứng"}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 text-xs leading-relaxed flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-1.5 font-black uppercase tracking-wider text-[9px] mb-1.5 text-slate-400">
                          <BrainCircuit size={13} className="text-indigo-400 shrink-0" />
                          Độ tin cậy học thuật
                        </div>
                        <p className="font-semibold text-slate-200">{parsed.confidence}</p>
                      </div>
                      
                      {percentValue !== null && (
                        <div className="mt-2">
                          <div className="flex justify-between items-center text-[8px] text-slate-400 font-bold uppercase tracking-widest mb-1">
                            <span>Chỉ số tin cậy</span>
                            <span>{percentValue}%</span>
                          </div>
                          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden border border-white/5">
                            <div 
                              className={`h-full rounded-full transition-all duration-1000 ${
                                percentValue >= 90 ? 'bg-emerald-400' : percentValue >= 70 ? 'bg-indigo-400' : 'bg-amber-400'
                              }`}
                              style={{ width: `${percentValue}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            }
          }

          return (
            <div key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-6 rounded-[2.5rem] text-sm leading-relaxed shadow-lg font-medium ${
                isUser ? 'bg-indigo-600 text-white rounded-tr-none shadow-[0_0_15px_rgba(99,102,241,0.3)]' : 'bg-slate-800 text-slate-300 rounded-tl-none border border-white/10'
              }`}>
                {isUser ? m.text : renderedContent}
              </div>
            </div>
          );
        })}
        {isTyping && <div className="p-4 bg-slate-800 w-20 rounded-full shadow-lg flex gap-2 justify-center animate-pulse border border-white/10"><div className="w-2 h-2 bg-indigo-400 rounded-full"></div><div className="w-2 h-2 bg-indigo-400 rounded-full delay-75"></div><div className="w-2 h-2 bg-indigo-400 rounded-full delay-150"></div></div>}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 glass-card border-t border-white/10 absolute bottom-0 left-0 right-0 z-20 rounded-b-[3rem]">
        {selectedImage && (
          <div className="mb-3 relative inline-block animate-slide-up"><img src={selectedImage} className="w-16 h-16 rounded-xl border-2 border-white/20 shadow-xl"/><button onClick={() => setSelectedImage(null)} className="absolute -top-2 -right-2 bg-rose-500 text-white p-1 rounded-lg shadow-[0_0_10px_rgba(244,63,94,0.5)]"><X size={12}/></button></div>
        )}
        <div className="flex items-center gap-2 bg-slate-900/50 p-1.5 rounded-full border border-white/10 focus-within:border-indigo-500/50 transition-all shadow-inner">
          <button onClick={() => fileInputRef.current?.click()} className="p-2.5 text-slate-400 hover:text-indigo-400 transition-colors"><Camera size={20}/></button>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={e => {
            const file = e.target.files?.[0];
            if(file) { const reader = new FileReader(); reader.onloadend = () => setSelectedImage(reader.result as string); reader.readAsDataURL(file); }
          }}/>
          <input 
            value={input} 
            onChange={e => setInput(e.target.value)} 
            onKeyDown={e => e.key === 'Enter' && handleSend()} 
            placeholder={isSeriousMode ? "Nhập vấn đề cần phân tích chuyên sâu..." : "Tâm sự hoặc hỏi bài đi fen..."} 
            className="flex-1 bg-transparent px-2 py-2 outline-none font-normal text-white text-sm placeholder:text-slate-500 placeholder:font-normal"
          />
          <button 
            onClick={() => handleSend()} 
            disabled={!input.trim() && !selectedImage} 
            className="w-10 h-10 bg-indigo-600 text-white rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)] flex items-center justify-center active:scale-90 transition-all disabled:opacity-30 hover:bg-indigo-500 shrink-0"
          >
            <Send size={18}/>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AITutor;
