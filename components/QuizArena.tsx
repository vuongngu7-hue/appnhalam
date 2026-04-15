
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile } from '../types';
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

const QuizArena: React.FC<QuizArenaProps & { userData: UserProfile; onUpdate: (u: UserProfile) => void }> = ({ onExp, showToast, userData, onUpdate }) => {
  const [mode, setMode] = useState<'lobby' | 'debate'>('lobby');
  const [activeTopic, setActiveTopic] = useState('');
  const [messages, setMessages] = useState<{role: string, text: string}[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [betAmount, setBetAmount] = useState(50);
  const [hasBet, setHasBet] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const startDebate = (topic: string) => {
    if (userData.coins < betAmount) {
      showToast("Không đủ xu để đặt cược!", "error");
      return;
    }
    setActiveTopic(topic);
    setMode('debate');
    setHasBet(true);
    onUpdate({ ...userData, coins: userData.coins - betAmount });
    setMessages([{ role: 'ai', text: `Tôi đã sẵn sàng. Chủ đề là: "${topic}". Bạn ủng hộ hay phản đối quan điểm này? Hãy đưa ra luận điểm đầu tiên của bạn. (Cược: ${betAmount} Xu)` }]);
  };

  const usePowerUp = (id: string) => {
    const item = userData.inventory.find(i => i.id === id);
    if (!item || item.count <= 0) {
      showToast("Hết lượt sử dụng!", "error");
      return;
    }

    let powerUpText = "";
    if (id === 'p1') powerUpText = "[POWER-UP: GỢI Ý] Hãy cho tôi một gợi ý về luận điểm phản bác mạnh mẽ nhất cho chủ đề này.";
    if (id === 'p2') powerUpText = "[POWER-UP: FACT CHECK] Hãy kiểm tra tính xác thực của các số liệu/thông tin trong cuộc tranh luận này.";

    setInput(powerUpText);
    onUpdate({
      ...userData,
      inventory: userData.inventory.map(i => i.id === id ? { ...i, count: i.count - 1 } : i)
    });
    showToast("Đã kích hoạt Power-up!", "success");
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

      // Check for win condition in AI response
      if (response.includes('BẢNG ĐIỂM') && response.includes('THẮNG')) {
        const winAmount = betAmount * 2;
        onUpdate({ ...userData, coins: userData.coins + winAmount });
        showToast(`Chúc mừng! Bạn thắng cược và nhận ${winAmount} Xu!`, "success");
      }
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
        className="flex flex-col h-full bg-slate-900/50 rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden"
      >
        <div className="glass-card p-4 border-b border-white/10 flex items-center justify-between shadow-sm sticky top-0 z-20 rounded-t-[3rem]">
          <button onClick={() => setMode('lobby')} className="p-2 text-slate-400 hover:text-indigo-400 transition-all hover:bg-white/5 rounded-xl">
            <ChevronLeft size={24} />
          </button>
          <div className="text-center">
            <h3 className="font-black text-xs text-white uppercase tracking-widest neon-text">Đấu Trường Tranh Biện</h3>
            <p className="text-[10px] text-indigo-400 font-bold truncate max-w-[200px] drop-shadow-[0_0_5px_rgba(99,102,241,0.8)]">{activeTopic}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex flex-col items-end">
              <span className="text-[8px] font-black text-slate-500 uppercase">Cược</span>
              <span className="text-xs font-black text-amber-400">{betAmount}</span>
            </div>
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]">
              <Gavel size={20} />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
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
                    ? 'bg-indigo-600 text-white rounded-tr-none shadow-[0_0_15px_rgba(99,102,241,0.3)]' 
                    : 'bg-slate-800 border border-white/10 text-slate-300 rounded-tl-none font-medium'
                }`}>
                  {m.text.includes('BẢNG ĐIỂM') ? (
                      <div className="space-y-3">
                          <div className="flex items-center gap-2 font-black text-indigo-400 border-b border-white/10 pb-2 mb-2 drop-shadow-[0_0_5px_rgba(99,102,241,0.8)]">
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
              <div className="bg-slate-800 border border-white/10 p-5 rounded-[2rem] rounded-tl-none shadow-sm flex gap-2">
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce shadow-[0_0_5px_rgba(99,102,241,0.8)]"></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s] shadow-[0_0_5px_rgba(99,102,241,0.8)]"></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s] shadow-[0_0_5px_rgba(99,102,241,0.8)]"></div>
              </div>
            </motion.div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Power-ups Bar */}
        <div className="px-4 py-2 flex gap-2 bg-slate-900/80 backdrop-blur-md border-t border-white/5">
           {(userData.inventory || []).filter(i => i.type === 'powerup').map(p => (
             <button 
               key={p.id}
               onClick={() => usePowerUp(p.id)}
               disabled={p.count <= 0}
               className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${p.count > 0 ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20' : 'bg-slate-800 border-white/5 text-slate-600 opacity-50'}`}
             >
                <Zap size={12} fill="currentColor" />
                <span className="text-[9px] font-black uppercase tracking-widest">{p.id === 'p1' ? 'Gợi ý' : 'Fact Check'} x{p.count}</span>
             </button>
           ))}
        </div>

        <div className="p-4 glass-card border-t border-white/10 safe-area-bottom rounded-b-[3rem]">
          <div className="flex items-center gap-3 bg-slate-900/50 p-2 rounded-[2rem] focus-within:border-indigo-500/50 transition-all border border-white/10 shadow-inner">
            <input 
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendDebate()}
              placeholder="Nhập luận điểm của bạn..."
              className="flex-1 bg-transparent px-4 py-3 outline-none text-sm font-medium text-white placeholder:text-slate-500"
            />
            <button 
              onClick={handleSendDebate}
              disabled={!input.trim() || isTyping}
              className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all ${
                input.trim() && !isTyping ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)] hover:bg-indigo-500' : 'bg-slate-800 text-slate-500 border border-white/10'
              }`}
            >
              <Send size={20} />
            </button>
          </div>
          <div className="flex justify-center mt-3 gap-4">
             <button onClick={() => setInput('Tóm tắt lại cuộc tranh biện và chấm điểm cho tôi. Hãy ghi rõ THẮNG hoặc THUA ở cuối.')} className="text-[10px] font-black text-slate-500 uppercase hover:text-indigo-400 transition-colors drop-shadow-[0_0_5px_rgba(99,102,241,0)] hover:drop-shadow-[0_0_5px_rgba(99,102,241,0.8)]">Kết thúc & Chấm điểm</button>
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
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 p-10 rounded-[3rem] text-white shadow-[0_0_30px_rgba(99,102,241,0.3)] relative overflow-hidden group border border-white/10">
        <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-125 transition-transform duration-700"><BrainCircuit size={160}/></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
              <span className="bg-white/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md border border-white/20">V3 Pro Edition</span>
          </div>
          <h2 className="text-4xl font-black mb-3 tracking-tighter neon-text">Arena Lobby</h2>
          <p className="text-indigo-200 text-sm max-w-[320px] font-medium leading-relaxed mb-8 opacity-90">
            Nơi tri thức va chạm. Thách thức AI Siêu Trí Tuệ trong những cuộc tranh luận nảy lửa.
          </p>
          
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10 max-w-[280px]">
               <div className="w-10 h-10 bg-amber-500/20 text-amber-400 rounded-xl flex items-center justify-center border border-amber-500/30">
                  <Stars size={20} fill="currentColor" />
               </div>
               <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Mức cược hiện tại</p>
                  <div className="flex items-center gap-4">
                     <button onClick={() => setBetAmount(Math.max(50, betAmount - 50))} className="text-white hover:text-indigo-400 transition-colors font-black">-</button>
                     <span className="text-xl font-black text-white">{betAmount} Xu</span>
                     <button onClick={() => setBetAmount(Math.min(500, betAmount + 50))} className="text-white hover:text-indigo-400 transition-colors font-black">+</button>
                  </div>
               </div>
            </div>

            <button 
                onClick={() => showToast("Hệ thống Quiz đang bảo trì, hãy thử chế độ Tranh biện!")}
                className="w-full sm:w-auto px-8 py-4 bg-white text-indigo-900 rounded-[1.5rem] font-black text-sm shadow-[0_0_20px_rgba(255,255,255,0.3)] active:scale-95 transition-all flex items-center justify-center gap-3 hover:gap-5 hover:bg-slate-100"
            >
                GHÉP TRẬN QUIZ <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* New Debate Mode Section */}
      <div className="glass-card rounded-[2.5rem] border border-white/10 shadow-xl p-8 bg-slate-900/50">
        <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                <MessageSquare size={24} />
            </div>
            <div>
                <h3 className="font-black text-white text-lg tracking-tight">Tranh Biện Với AI</h3>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Nâng tầm tư duy phản biện</p>
            </div>
            <div className="ml-auto flex items-center gap-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                <Sparkles size={12} />
                <span className="text-[10px] font-black">PRO</span>
            </div>
        </div>

        <div className="space-y-3">
            <p className="text-xs font-medium text-slate-400 mb-4 px-1">Chọn một chủ đề để bắt đầu màn đối đầu:</p>
            {DEBATE_TOPICS.map((topic, i) => (
                <motion.button 
                    key={i}
                    whileHover={{ x: 10 }}
                    onClick={() => startDebate(topic)}
                    className="w-full flex items-center justify-between p-5 bg-slate-800/50 border border-white/5 rounded-[1.8rem] hover:border-indigo-500/50 hover:shadow-[0_0_15px_rgba(99,102,241,0.2)] transition-all group text-left"
                >
                    <span className="text-sm font-medium text-slate-300 group-hover:text-indigo-400 pr-4">{topic}</span>
                    <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                        <ArrowRight size={18} />
                    </div>
                </motion.button>
            ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
            { icon: Trophy, label: "Hạng", val: "Vàng I", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
            { icon: Zap, label: "Win Rate", val: "68%", color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20" },
            { icon: Gavel, label: "Debate", val: "Level 5", color: "text-teal-400", bg: "bg-teal-500/10", border: "border-teal-500/20" }
        ].map((item, i) => (
            <motion.div 
              key={i} 
              whileHover={{ y: -5 }}
              className="glass-card p-5 rounded-[2rem] border border-white/5 shadow-sm text-center"
            >
                <div className={`w-10 h-10 ${item.bg} ${item.color} border ${item.border} rounded-xl flex items-center justify-center mb-3 mx-auto shadow-inner`}>
                    <item.icon size={20} />
                </div>
                <h4 className="font-bold text-white text-xs mb-1 tracking-tight">{item.val}</h4>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{item.label}</p>
            </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default QuizArena;
