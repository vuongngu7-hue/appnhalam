
import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, Sparkles, Trash2, Camera, Image as ImageIcon, X, Zap, MessageSquare, BookOpen, BrainCircuit, Globe, Mic, MicOff, Volume2, FastForward } from 'lucide-react';
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
      const promptSuffix = isFastMode ? " (Trả lời cực ngắn trong 2 câu)" : "";
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
            <h3 className="font-black text-white tracking-tight neon-text">AI Tutor Supreme</h3>
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
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black transition-all ${isSeriousMode ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.3)]' : 'bg-slate-800 text-slate-400 border border-white/10'}`}
                >
                  <BrainCircuit size={10}/> {isSeriousMode ? 'CHUYÊN GIA ON' : 'GIA SƯ'}
                </button>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
           <button onClick={() => setMessages([])} className="p-3 text-slate-400 hover:text-rose-400 hover:bg-white/5 rounded-xl transition-colors"><Trash2 size={20} /></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar pb-32 custom-scrollbar">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-6 rounded-[2.5rem] text-sm leading-relaxed shadow-lg font-medium ${
              m.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none shadow-[0_0_15px_rgba(99,102,241,0.3)]' : 'bg-slate-800 text-slate-300 rounded-tl-none border border-white/10'
            }`}>
              {m.role === 'ai' ? <MarkdownText text={m.text} /> : m.text}
            </div>
          </div>
        ))}
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
            placeholder={isSeriousMode ? "Nhập câu hỏi học thuật cần giải đáp chi tiết..." : "Hỏi gì đi fen, tui trả lời ngắn gọn..."} 
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
