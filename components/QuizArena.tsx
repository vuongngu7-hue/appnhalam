
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, Target, Stars, ArrowRight, BrainCircuit, Users, Zap, 
  ShieldCheck, MessageSquare, Send, X, Bot, Award, Sparkles,
  ChevronLeft, Loader2, Info, Gavel
} from 'lucide-react';
import { getDebateResponse } from '../services/geminiService';

interface QuizArenaProps {
  onExp: (amount: number) => void;
  showToast: (message: string) => void;
}

const DEBATE_TOPICS = [
  "Trí tuệ nhân tạo sẽ thay thế giáo viên trong tương lai.",
  "Mạng xã hội đang làm thế hệ trẻ cô đơn hơn.",
  "Điểm số không phản ánh đúng thực lực của một học sinh.",
  "Học đại học không còn là con đường duy nhất để thành công.",
  "Việc làm thêm khi đi học lợi bất cập hại."
];

const QuizArena: React.FC<QuizArenaProps> = ({ onExp, showToast }) => {
  const [mode, setMode] = useState<'lobby' | 'debate'>('lobby');
  const [activeTopic, setActiveTopic] = useState('');
  const [messages, setMessages] = useState<{role: string, text: string}[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const startDebate = (topic: string) => {
    setActiveTopic(topic);
    setMode('debate');
    setMessages([{ role: 'ai', text: `Tôi đã sẵn sàng. Chủ đề là: "${topic}". Bạn ủng hộ hay phản đối quan điểm này? Hãy đưa ra luận điểm đầu tiên của bạn.` }]);
  };

  const handleSendDebate = async () => {
    if (!input.trim() || isTyping) return;

    const userText = input.trim();
    setInput('');
    const newMessages = [...messages, { role: 'user', text: userText }];
    setMessages(newMessages);
    setIsTyping(true);

    try {
      const response = await getDebateResponse(newMessages, activeTopic);
      setMessages(prev => [...prev, { role: 'ai', text: response }]);
      onExp(5);
    } catch (error) {
      showToast("AI đang suy ngẫm quá sâu, hãy thử lại nhé!");
    } finally {
      setIsTyping(false);
    }
  };

  if (mode === 'debate') {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col h-full"
      >
        <div className="bg-white/80 backdrop-blur-md p-4 border-b flex items-center justify-between shadow-sm sticky top-0 z-20">
          <button onClick={() => setMode('lobby')} className="p-2 text-slate-400 hover:text-indigo-600 transition-all">
            <ChevronLeft size={24} />
          </button>
          <div className="text-center">
            <h3 className="font-black text-xs text-slate-800 uppercase tracking-widest">Đấu Trường Tranh Biện</h3>
            <p className="text-[10px] text-indigo-500 font-bold truncate max-w-[200px]">{activeTopic}</p>
          </div>
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
            <Gavel size={20} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
          <AnimatePresence initial={false}>
            {messages.map((m, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] p-5 rounded-[2rem] text-sm leading-relaxed shadow-sm transition-all ${
                  m.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none font-medium'
                }`}>
                  {m.text.includes('BẢNG ĐIỂM') ? (
                      <div className="space-y-3">
                          <div className="flex items-center gap-2 font-black text-indigo-600 border-b pb-2 mb-2">
                              <Award size={18} /> ĐÁNH GIÁ TỪ TRỌNG TÀI AI
                          </div>
                          <pre className="whitespace-pre-wrap font-sans">{m.text}</pre>
                      </div>
                  ) : m.text}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {isTyping && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-white border border-slate-100 p-5 rounded-[2rem] rounded-tl-none shadow-sm flex gap-2">
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
            </motion.div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="p-4 bg-white border-t border-slate-100 safe-area-bottom">
          <div className="flex items-center gap-3 bg-slate-100 p-2 rounded-[2rem] focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-50 transition-all border border-transparent focus-within:border-indigo-200">
            <input 
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendDebate()}
              placeholder="Nhập luận điểm của bạn..."
              className="flex-1 bg-transparent px-4 py-3 outline-none text-sm font-bold"
            />
            <button 
              onClick={handleSendDebate}
              disabled={!input.trim() || isTyping}
              className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all ${
                input.trim() && !isTyping ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-200 text-slate-400'
              }`}
            >
              <Send size={20} />
            </button>
          </div>
          <div className="flex justify-center mt-3 gap-4">
             <button onClick={() => setInput('Tóm tắt lại cuộc tranh biện và chấm điểm cho tôi.')} className="text-[10px] font-black text-slate-400 uppercase hover:text-indigo-600 transition-colors">Kết thúc & Chấm điểm</button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col h-full gap-6 max-w-2xl mx-auto pb-10"
    >
      <div className="bg-gradient-to-br from-indigo-800 via-indigo-600 to-purple-700 p-10 rounded-[3rem] text-white shadow-2xl shadow-indigo-100 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-10 opacity-20 group-hover:scale-125 transition-transform duration-700"><BrainCircuit size={160}/></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
              <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md">V3 Pro Edition</span>
          </div>
          <h2 className="text-4xl font-black mb-3 tracking-tighter">Arena Lobby</h2>
          <p className="text-indigo-100 text-sm max-w-[320px] font-semibold leading-relaxed mb-8 opacity-90">
            Nơi tri thức va chạm. Thách thức AI Siêu Trí Tuệ trong những cuộc tranh luận nảy lửa.
          </p>
          <div className="flex flex-wrap gap-4">
            <button 
                onClick={() => showToast("Hệ thống Quiz đang bảo trì, hãy thử chế độ Tranh biện!")}
                className="px-8 py-4 bg-white text-indigo-600 rounded-[1.5rem] font-black text-sm shadow-xl active:scale-95 transition-all flex items-center gap-3 hover:gap-5"
            >
                GHÉP TRẬN QUIZ <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* New Debate Mode Section */}
      <div className="glass rounded-[2.5rem] border-white shadow-xl p-8 bg-gradient-to-br from-white to-indigo-50/30">
        <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
                <MessageSquare size={24} />
            </div>
            <div>
                <h3 className="font-black text-slate-800 text-lg tracking-tight">Tranh Biện Với AI</h3>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Nâng tầm tư duy phản biện</p>
            </div>
            <div className="ml-auto flex items-center gap-1 bg-amber-100 text-amber-600 px-3 py-1 rounded-full">
                <Sparkles size={12} />
                <span className="text-[10px] font-black">PRO</span>
            </div>
        </div>

        <div className="space-y-3">
            <p className="text-xs font-bold text-slate-500 mb-4 px-1">Chọn một chủ đề để bắt đầu màn đối đầu:</p>
            {DEBATE_TOPICS.map((topic, i) => (
                <motion.button 
                    key={i}
                    whileHover={{ x: 10 }}
                    onClick={() => startDebate(topic)}
                    className="w-full flex items-center justify-between p-5 bg-white border border-slate-100 rounded-[1.8rem] hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-50 transition-all group text-left"
                >
                    <span className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 pr-4">{topic}</span>
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        <ArrowRight size={18} />
                    </div>
                </motion.button>
            ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
            { icon: Trophy, label: "Hạng", val: "Vàng I", color: "text-amber-500", bg: "bg-amber-50" },
            { icon: Zap, label: "Win Rate", val: "68%", color: "text-indigo-500", bg: "bg-indigo-50" },
            { icon: Gavel, label: "Debate", val: "Level 5", color: "text-teal-500", bg: "bg-teal-50" }
        ].map((item, i) => (
            <motion.div 
              key={i} 
              whileHover={{ y: -5 }}
              className="glass p-5 rounded-[2rem] border-white shadow-sm text-center"
            >
                <div className={`w-10 h-10 ${item.bg} ${item.color} rounded-xl flex items-center justify-center mb-3 mx-auto`}>
                    <item.icon size={20} />
                </div>
                <h4 className="font-bold text-slate-800 text-xs mb-1 tracking-tight">{item.val}</h4>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{item.label}</p>
            </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default QuizArena;
