
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
        ? await analyzeStudyImage(imageToProcess, (userText || "Giải thích ảnh này") + promptSuffix)
        : await getTutorResponse(userText + promptSuffix);
      setMessages(prev => [...prev, { role: 'ai', text: replyText, timestamp: Date.now() }]);
      onExp(15);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'ai', text: "Lỗi kết nối AI rồi fen!", timestamp: Date.now() }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F4F7FF]/30 relative overflow-hidden">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-xl p-5 border-b flex items-center justify-between shadow-sm z-10 sticky top-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-[1.2rem] flex items-center justify-center text-white shadow-xl animate-float"><Bot size={28} /></div>
          <div>
            <h3 className="font-black text-slate-800 tracking-tight">AI Tutor Supreme</h3>
            <div className="flex items-center gap-2">
                <span className="text-[9px] text-green-500 font-black uppercase tracking-widest flex items-center gap-1"><Zap size={10} fill="currentColor"/> Online</span>
                <button 
                  onClick={() => setIsFastMode(!isFastMode)}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black transition-all ${isFastMode ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'}`}
                >
                  <FastForward size={10}/> {isFastMode ? 'SIÊU TỐC ON' : 'BÌNH THƯỜNG'}
                </button>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
           <button onClick={() => setMessages([])} className="p-4 text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={24} /></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar pb-32">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-6 rounded-[2.5rem] text-sm leading-relaxed shadow-lg font-bold ${
              m.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-slate-700 rounded-tl-none border-b-4 border-slate-200'
            }`}>
              {m.role === 'ai' ? <MarkdownText text={m.text} /> : m.text}
            </div>
          </div>
        ))}
        {isTyping && <div className="p-4 bg-white w-20 rounded-full shadow-lg flex gap-2 justify-center animate-pulse"><div className="w-2 h-2 bg-indigo-400 rounded-full"></div><div className="w-2 h-2 bg-indigo-400 rounded-full delay-75"></div><div className="w-2 h-2 bg-indigo-400 rounded-full delay-150"></div></div>}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white/95 border-t backdrop-blur-xl absolute bottom-0 left-0 right-0 z-20">
        {selectedImage && (
          <div className="mb-4 relative inline-block animate-slide-up"><img src={selectedImage} className="w-20 h-20 rounded-2xl border-4 border-white shadow-xl"/><button onClick={() => setSelectedImage(null)} className="absolute -top-2 -right-2 bg-rose-500 text-white p-1 rounded-lg"><X size={14}/></button></div>
        )}
        <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-[2rem] border-2 border-slate-100 focus-within:bg-white focus-within:border-indigo-400 transition-all shadow-inner">
          <button onClick={() => fileInputRef.current?.click()} className="p-4 text-slate-400 hover:text-indigo-600 transition-colors"><Camera size={24}/></button>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={e => {
            const file = e.target.files?.[0];
            if(file) { const reader = new FileReader(); reader.onloadend = () => setSelectedImage(reader.result as string); reader.readAsDataURL(file); }
          }}/>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="Hỏi gì đi fen, tui trả lời ngắn gọn..." className="flex-1 bg-transparent px-2 py-3 outline-none font-bold"/>
          <button onClick={() => handleSend()} disabled={!input.trim() && !selectedImage} className="w-12 h-12 bg-indigo-600 text-white rounded-2xl shadow-xl flex items-center justify-center active:scale-90 transition-all disabled:opacity-30"><Send size={20}/></button>
        </div>
      </div>
    </div>
  );
};

export default AITutor;
