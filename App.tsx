
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, Zap, Trophy, Send, Sparkles, Heart, MessageCircle, 
  Plus, Bot, Stars, Search, Menu, X, Flame, Share2, 
  Edit3, Layout, Calculator, User, Award, Users, Settings,
  CheckCircle2, Crown, Ghost, BookOpen, GraduationCap,
  LogOut, ArrowRight, Bell, Clock, BrainCircuit, Target, 
  ThumbsUp, Smile, MoreHorizontal, ThumbsDown, Scale,
  ChevronRight, Calendar, LayoutGrid,
  ShieldCheck, Globe, Facebook, Key, MessageSquare, Compass, 
  Star, CheckCircle, BarChart3, ListTodo, Rocket, Shield,
  RefreshCw, AlertTriangle
} from 'lucide-react';
import { UserProfile, AppTab, LoginMethod, DailyQuest } from './types';
import { getLevelInfo } from './constants';
import Feed from './components/Feed';
import AITutor from './components/AITutor';
import FocusZone from './components/FocusZone';
import QuizArena from './components/QuizArena';
import Leaderboard from './components/Leaderboard';
import Profile from './components/Profile';
import StudyTools from './components/StudyTools';
import MissionControl from './components/MissionControl';
import { getDailyBlitzQuiz } from './services/geminiService';

const INITIAL_QUESTS: DailyQuest[] = [
  { id: 'q1', text: 'Học tập trung 25 phút', target: 25, current: 0, reward: 100, isClaimed: false },
  { id: 'q2', text: 'Hỏi Gia sư AI 3 câu hỏi', target: 3, current: 0, reward: 50, isClaimed: false },
  { id: 'q3', text: 'Đăng 1 bài kiến thức mới', target: 1, current: 0, reward: 30, isClaimed: false }
];

const App: React.FC = () => {
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.FEED);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [showRedemption, setShowRedemption] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Optimized Persistence
  useEffect(() => {
    if (userData) {
      localStorage.setItem('studygram_user', JSON.stringify(userData));
    }
  }, [userData]);

  // Optimized Initial Load & Survival Logic
  useEffect(() => {
    const savedData = localStorage.getItem('studygram_user');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData) as UserProfile;
        const now = new Date();
        const lastLoginDate = new Date(parsedData.lastLogin || 0);
        
        // Reset to midnight for accurate day comparison
        const todayMidnight = new Date(now.setHours(0,0,0,0)).getTime();
        const lastLoginMidnight = new Date(lastLoginDate.setHours(0,0,0,0)).getTime();
        const dayDiff = (todayMidnight - lastLoginMidnight) / (1000 * 3600 * 24);

        if (dayDiff >= 1) {
          // New Day Logic
          parsedData.dailyQuests = INITIAL_QUESTS; // Reset quests
          parsedData.lastLogin = Date.now();

          if (dayDiff > 1) {
             // Missed a day
             if (parsedData.streakShields > 0) {
                parsedData.streakShields -= 1;
                setTimeout(() => showToast("Đã dùng Khiên bảo vệ Streak! 🛡️", "success"), 1000);
             } else {
                parsedData.lives -= 1;
                if (parsedData.lives <= 0) {
                  setShowRedemption(true);
                } else {
                  setTimeout(() => showToast("Bạn đã lỡ 1 ngày! Mất 1 ❤️", "error"), 1000);
                }
             }
          } else {
            // Consecutive Day
            setShowStreakModal(true);
          }
        }
        
        setUserData(parsedData);
      } catch (e) {
        localStorage.removeItem('studygram_user');
      }
    }
    setIsLoading(false); 
  }, []); // Run once on mount

  const handleUpdateUser = useCallback((updated: UserProfile) => {
    setUserData(updated);
  }, []);

  const handleAddExp = useCallback((amount: number) => {
    setUserData(prev => {
        if (!prev) return null;
        return { ...prev, exp: prev.exp + amount };
    });
    showToast(`+${amount} EXP!`, 'success');
  }, [showToast]);

  const updateQuestProgress = useCallback((questId: string, amount: number) => {
    setUserData(prev => {
      if (!prev) return null;
      const updatedQuests = prev.dailyQuests.map(q => 
        q.id === questId ? { ...q, current: Math.min(q.target, q.current + amount) } : q
      );
      // Only update if changed to prevent render loops
      if (JSON.stringify(updatedQuests) === JSON.stringify(prev.dailyQuests)) return prev;
      return { ...prev, dailyQuests: updatedQuests };
    });
  }, []);

  const claimQuestReward = (questId: string) => {
    if (!userData) return;
    const quest = userData.dailyQuests.find(q => q.id === questId);
    if (quest && quest.current >= quest.target && !quest.isClaimed) {
      handleAddExp(quest.reward);
      setUserData(prev => {
        if (!prev) return null;
        return {
          ...prev,
          dailyQuests: prev.dailyQuests.map(q => q.id === questId ? { ...q, isClaimed: true } : q)
        };
      });
      try {
        // @ts-ignore
        if (window.confetti) window.confetti({ particleCount: 70, spread: 80, origin: { y: 0.8 } });
      } catch (e) {}
    }
  };

  const handleAuth = (method: LoginMethod, name?: string) => {
    const newUser: UserProfile = {
      uid: 'u-' + Math.random().toString(36).slice(2, 7),
      name: name || 'Học giả Gen Z',
      avatar: `https://api.dicebear.com/7.x/notionists/svg?seed=${name || method}-${Math.random()}`,
      exp: 0, bio: 'Sẵn sàng chinh phục tri thức 🚀', joinedAt: Date.now(), streak: 1, lives: 3, streakShields: 0, completedQuizzes: 0, 
      loginMethod: method, isVerified: method !== 'guest', dailyQuests: INITIAL_QUESTS, lastLogin: Date.now(),
      skills: { criticalThinking: 20, focus: 20, creativity: 20, knowledge: 20, discipline: 20 },
      weakPoints: []
    };
    setUserData(newUser);
  };

  if (isLoading) return <LoadingScreen />;
  if (!userData) return <AuthScreen onAuth={handleAuth} />;

  return (
    <div className="min-h-screen text-slate-800 font-sans selection:bg-indigo-100 flex flex-col overflow-x-hidden bg-[#FDFCF8]">
      {toast && <Toast toast={toast} />}
      
      <AnimatePresence>
        {showStreakModal && (
          <StreakModal 
            streak={userData.streak}
            onClaim={() => {
              handleUpdateUser({ ...userData, streak: userData.streak + 1, exp: userData.exp + 50 });
              setShowStreakModal(false);
              try {
                 // @ts-ignore
                 window.confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
              } catch(e) {}
            }} 
          />
        )}

        {showRedemption && (
          <RedemptionModal 
            userData={userData}
            onSuccess={() => {
              handleUpdateUser({ ...userData, lives: 1, streakShields: 0, lastLogin: Date.now() });
              setShowRedemption(false);
              showToast("Hồi sinh thành công! 🛡️", "success");
            }}
            onFail={() => {
              handleUpdateUser({ ...userData, streak: 1, lives: 3, streakShields: 0, lastLogin: Date.now() });
              setShowRedemption(false);
              showToast("Streak đã bị dập tắt...", "error");
            }}
          />
        )}
      </AnimatePresence>

      <Sidebar 
        isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} 
        userData={userData} setActiveTab={setActiveTab} activeTab={activeTab} 
        onLogout={() => { localStorage.removeItem('studygram_user'); setUserData(null); }}
      />
      
      <Header onOpenMenu={() => setSidebarOpen(true)} userData={userData} activeTab={activeTab} />

      <main className={`flex-1 w-full max-w-4xl mx-auto transition-all duration-500 ${activeTab === AppTab.TUTOR ? 'h-[calc(100vh-80px-100px)] overflow-hidden' : 'p-4 md:p-8 pb-32 mt-20'}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="w-full"
          >
            {activeTab === AppTab.FEED && (
              <>
                <ZenDashboard userData={userData} onClaim={claimQuestReward} />
                <Feed userData={userData} onExp={(n) => { handleAddExp(n); updateQuestProgress('q3', 1); }} />
              </>
            )}
            {activeTab === AppTab.MISSION && <MissionControl userData={userData} onUpdate={handleUpdateUser} />}
            {activeTab === AppTab.TUTOR && <AITutor userData={userData} onExp={(n) => { handleAddExp(n); updateQuestProgress('q2', 1); }} />}
            {activeTab === AppTab.FOCUS && <FocusZone onExp={(n) => { handleAddExp(n); updateQuestProgress('q1', 25); }} showToast={showToast} />}
            {activeTab === AppTab.QUIZ && <QuizArena onExp={handleAddExp} showToast={showToast} />}
            {activeTab === AppTab.TOOLS && <StudyTools onExp={handleAddExp} />}
            {activeTab === AppTab.RANK && <Leaderboard currentUid={userData.uid} userData={userData} />}
            {activeTab === AppTab.PROFILE && <Profile userData={userData} onUpdate={handleUpdateUser} onToast={showToast} />}
          </motion.div>
        </AnimatePresence>
      </main>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

const RedemptionModal: React.FC<{ userData: UserProfile, onSuccess: () => void, onFail: () => void }> = ({ userData, onSuccess, onFail }) => {
  const [step, setStep] = useState<'intro' | 'quiz'>('intro');
  const [quiz, setQuiz] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadQuiz = async () => {
    setLoading(true);
    try {
      const data = await getDailyBlitzQuiz("Kiến thức tổng hợp THPT");
      if (data && data.length > 0) {
        setQuiz(data);
        setStep('quiz');
      } else {
         throw new Error("No quiz data");
      }
    } catch (e) {
      // Fallback quiz if AI fails
      setQuiz([{ question: "Văn hào nào được mệnh danh là 'Ông vua phóng sự đất Bắc'?", options: ["Vũ Trọng Phụng", "Nam Cao", "Ngô Tất Tố", "Nguyên Hồng"], answer: "Vũ Trọng Phụng" }]);
      setStep('quiz');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] bg-slate-900/95 backdrop-blur-3xl flex items-center justify-center p-6">
      <div className="glass w-full max-w-md rounded-[4.5rem] p-12 text-center border-white shadow-2xl animate-slide-up">
        {step === 'intro' ? (
          <div className="space-y-8">
             <div className="w-24 h-24 bg-rose-500 rounded-[2.5rem] flex items-center justify-center text-white mx-auto animate-pulse shadow-2xl shadow-rose-500/30">
                <AlertTriangle size={48} />
             </div>
             <h2 className="text-4xl font-black text-white tracking-tighter">REDEMPTION?</h2>
             <p className="text-slate-300 font-bold text-sm leading-relaxed italic">Chuỗi {userData.streak} ngày của fen sắp kết thúc. Giải đề thi Sở GD để hồi sinh!</p>
             <div className="flex flex-col gap-4 pt-6">
               <button onClick={loadQuiz} className="w-full py-5 bg-white text-rose-600 rounded-[1.8rem] font-black shadow-xl hover:scale-105 transition-all">
                  {loading ? <RefreshCw className="animate-spin mx-auto" /> : "CHẤP NHẬN THỬ THÁCH"}
               </button>
               <button onClick={onFail} className="text-slate-500 font-black text-[10px] uppercase tracking-widest py-2 hover:text-white transition-colors">CHẤP NHẬN DẬP LỬA</button>
             </div>
          </div>
        ) : (
          <div className="space-y-8 text-white text-left">
             <div className="bg-white/10 p-8 rounded-[3rem] border border-white/20">
                <p className="text-lg font-black leading-relaxed">{quiz[0]?.question}</p>
             </div>
             <div className="grid grid-cols-1 gap-3">
                {quiz[0]?.options.map((opt: string, i: number) => (
                   <button 
                    key={i} 
                    onClick={() => {
                        // Loose comparison logic
                        const isCorrect = opt === quiz[0].answer || opt.startsWith(quiz[0].answer);
                        isCorrect ? onSuccess() : onFail();
                    }}
                    className="p-5 bg-white/5 hover:bg-white/20 border border-white/10 rounded-2xl text-left font-bold transition-all"
                  >
                     {opt}
                   </button>
                ))}
             </div>
          </div>
        )}
      </div>
    </div>
  );
}

const ZenDashboard: React.FC<{ userData: UserProfile; onClaim: (id: string) => void }> = ({ userData, onClaim }) => {
  const isPhantom = userData.streak >= 7;
  const streakProgress = (userData.streak % 7) / 7 * 100;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mb-12 space-y-8"
    >
      <div className={`glass p-10 rounded-[4.5rem] border-white shadow-2xl transition-all duration-700 overflow-hidden relative group ${isPhantom ? 'bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 ring-8 ring-purple-500/20' : 'bg-gradient-to-br from-[#1a1c2c] to-[#0f172a]'} text-white`}>
         <div className={`absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform ${isPhantom ? 'text-purple-400' : 'text-orange-400'}`}><Flame size={200} fill="currentColor" /></div>
         
         <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
               <div className="flex items-center gap-3">
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={userData.lives === 1 && i === 0 ? { scale: [1, 1.2, 1] } : {}}
                      transition={{ repeat: Infinity, duration: 0.8 }}
                    >
                      <Heart 
                        size={32} 
                        className={`transition-all duration-500 ${i < userData.lives ? 'text-rose-500 fill-current drop-shadow-[0_0_12px_rgba(244,63,94,0.8)]' : 'text-slate-600'}`} 
                      />
                    </motion.div>
                  ))}
               </div>
               <div>
                 <h2 className={`text-5xl font-black tracking-tighter ${isPhantom ? 'text-purple-400' : 'text-orange-500'}`}>
                    {isPhantom ? 'PHANTOM ERA' : 'STREAK SURVIVAL'}
                 </h2>
                 <p className="text-slate-400 font-bold text-sm leading-relaxed max-w-xs uppercase tracking-tight mt-2">
                    {isPhantom ? 'Ngọn lửa vĩnh cửu đã được kích hoạt. Bạn là huyền thoại!' : 'Duy trì chuỗi ngày học để thắp sáng tri thức.'}
                 </p>
               </div>

               <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                    <span>Tiến trình chuỗi</span>
                    <span>{userData.streak % 7}/7 NGÀY</span>
                  </div>
                  <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/10">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${streakProgress}%` }}
                      className={`h-full rounded-full ${isPhantom ? 'bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.5)]' : 'bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.5)]'}`}
                    />
                  </div>
               </div>
            </div>
            
            <div className="flex flex-col items-center justify-center p-10 bg-white/5 rounded-[4rem] border border-white/10 backdrop-blur-md relative overflow-hidden group/streak">
               <motion.div 
                 animate={isPhantom ? { filter: ["drop-shadow(0 0 20px rgba(168, 85, 247, 0.8))", "drop-shadow(0 0 40px rgba(99, 102, 241, 1))"], scale: [1, 1.1, 1] } : { scale: [1, 1.05, 1] }}
                 transition={{ repeat: Infinity, duration: 2 }}
                 className={`relative ${isPhantom ? 'text-purple-400' : 'text-orange-500'}`}
               >
                  <Flame size={100} fill="currentColor" />
                  <span className="absolute inset-0 flex items-center justify-center text-4xl font-black mt-4">{userData.streak}</span>
               </motion.div>
               <span className="mt-4 text-[11px] font-black uppercase tracking-[0.5em] text-white/40">DAY STREAK</span>
               
               <AnimatePresence>
                 {userData.streakShields > 0 && (
                   <motion.div 
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, scale: 0.8 }}
                     className="mt-6 flex items-center gap-2 bg-indigo-600/40 px-5 py-2 rounded-full border border-indigo-400/50 shadow-lg shadow-indigo-500/20"
                   >
                      <Shield size={16} fill="currentColor" className="text-indigo-300" />
                      <span className="text-[11px] font-black uppercase tracking-widest">{userData.streakShields} SHIELD ON</span>
                   </motion.div>
                 )}
               </AnimatePresence>
            </div>
         </div>
      </div>
    </motion.div>
  );
};

const AuthScreen: React.FC<{ onAuth: (m: LoginMethod, name?: string) => void }> = ({ onAuth }) => {
  const [name, setName] = useState('');
  const [view, setView] = useState<'landing' | 'name'>('landing');

  return (
    <div className="fixed inset-0 bg-[#FDFCF8] flex items-center justify-center p-6 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100 rounded-full blur-[120px] opacity-60 animate-pulse"></div>
        <div className="glass w-full max-w-md rounded-[4rem] p-12 text-center shadow-2xl relative z-10 animate-slide-up">
            <div className="w-24 h-24 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[2.5rem] mb-10 mx-auto flex items-center justify-center text-white shadow-2xl rotate-3">
                <BookOpen size={48} strokeWidth={2.5} />
            </div>
            {view === 'landing' ? (
                <div className="space-y-8 animate-slide-in">
                    <div>
                        <h1 className="text-4xl font-black text-slate-800 tracking-tighter mb-2 leading-none">StudyGram V7</h1>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Official Exam Integration</p>
                    </div>
                    <div className="space-y-4">
                        <button onClick={() => onAuth('google')} className="w-full py-5 flex items-center justify-center gap-4 bg-white border-2 border-slate-100 rounded-[1.8rem] font-black text-slate-700 hover:border-indigo-200 hover:bg-slate-50 transition-all shadow-sm">
                            <Globe size={22} className="text-blue-500" /> Google Login
                        </button>
                        <button onClick={() => setView('name')} className="w-full py-5 bg-indigo-600 text-white rounded-[1.8rem] font-black shadow-xl hover:bg-indigo-700 transition-all">
                            Tiếp tục với tên riêng
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-8 animate-slide-in">
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tighter mb-2 leading-none">Chào học giả!</h1>
                        <p className="text-slate-400 font-bold text-sm">Chọn danh tính của bạn</p>
                    </div>
                    <div className="space-y-4">
                        <input value={name} onChange={e => setName(e.target.value)} placeholder="VD: Sói Học Tập 🐺" className="w-full p-6 bg-slate-50 rounded-[1.8rem] border-2 border-transparent focus:border-indigo-50 font-bold text-center text-lg shadow-inner" />
                        <button onClick={() => onAuth('guest', name)} disabled={!name.trim()} className="w-full py-5 bg-indigo-600 text-white rounded-[1.8rem] font-black shadow-xl disabled:opacity-50 hover:bg-indigo-700 active:scale-95 transition-all">BẮT ĐẦU 🚀</button>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

const Header: React.FC<any> = ({ onOpenMenu, activeTab, userData }) => (
  <header className="fixed top-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-2xl border-b border-slate-100/50 z-40 flex items-center justify-between px-8">
    <div className="flex items-center gap-4">
      <button onClick={onOpenMenu} className="p-3 bg-white/50 rounded-2xl text-slate-600 hover:text-indigo-600 transition-all border border-white shadow-sm">
          <Menu size={24} strokeWidth={2.5} />
      </button>
      <div className="hidden md:flex items-center gap-2 bg-orange-50 px-4 py-2 rounded-2xl border border-orange-100">
        <Flame size={18} className="text-orange-500" fill="currentColor" />
        <span className="text-sm font-black text-orange-600">{userData.streak}</span>
      </div>
    </div>
    <div className="flex flex-col items-center">
        <h1 className="font-black text-indigo-600 uppercase tracking-tighter text-xl leading-none">StudyGram</h1>
        <span className="text-[8px] font-black text-slate-300 tracking-[0.3em] mt-1 uppercase">Official Exam Hub</span>
    </div>
    <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 bg-rose-50 px-3 py-1.5 rounded-2xl border border-rose-100">
          <Heart size={16} className="text-rose-500" fill="currentColor" />
          <span className="text-xs font-black text-rose-600">{userData.lives}</span>
        </div>
        <div className="relative group cursor-pointer">
            <div className={`absolute -inset-1 rounded-full blur-md opacity-70 animate-pulse ${userData.streak >= 7 ? 'bg-gradient-to-r from-purple-500 via-indigo-500 to-pink-500' : 'bg-orange-400'}`}></div>
            <img src={userData.avatar} className="relative w-10 h-10 rounded-full border-2 border-white shadow-lg" alt="avatar" />
        </div>
    </div>
  </header>
);

const BottomNav: React.FC<any> = ({ activeTab, setActiveTab }) => (
  <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-lg z-40">
    <nav className="glass bg-white/90 rounded-[3rem] border-white px-4 py-3.5 flex justify-around shadow-2xl ring-1 ring-slate-100/50">
        {[
            { id: AppTab.FEED, icon: Home },
            { id: AppTab.MISSION, icon: Rocket },
            { id: AppTab.TUTOR, icon: Bot },
            { id: AppTab.FOCUS, icon: Clock },
            { id: AppTab.TOOLS, icon: LayoutGrid },
            { id: AppTab.QUIZ, icon: BrainCircuit },
            { id: AppTab.PROFILE, icon: User }
        ].map(tab => {
            const isActive = activeTab === tab.id;
            return (
                <button 
                  key={tab.id} 
                  onClick={() => setActiveTab(tab.id)} 
                  className={`relative p-3.5 rounded-2xl transition-all duration-300 ${isActive ? 'text-indigo-600' : 'text-slate-300 hover:text-slate-500'}`}
                >
                    {isActive && (
                      <motion.div 
                        layoutId="activeTab"
                        className="absolute inset-0 bg-indigo-50 rounded-2xl shadow-inner"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <tab.icon size={26} strokeWidth={isActive ? 3 : 2} className="relative z-10" />
                </button>
            );
        })}
    </nav>
  </div>
);

const Sidebar: React.FC<any> = ({ isOpen, onClose, userData, setActiveTab, activeTab, onLogout }) => (
  <>
    <div className={`fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />
    <aside className={`fixed top-0 left-0 bottom-0 w-80 bg-white z-[70] transition-transform duration-500 border-r border-slate-100 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="p-10 border-b border-slate-50 flex flex-col items-center bg-slate-50/50">
        <div className="relative mb-4">
            <div className={`absolute -inset-2 rounded-full blur-lg opacity-40 bg-gradient-to-r from-indigo-500 to-purple-500 animate-pulse`}></div>
            <img src={userData.avatar} className="relative w-24 h-24 rounded-[2.5rem] border-4 border-white shadow-2xl" alt="profile" />
        </div>
        <h3 className="font-black text-xl text-slate-800 tracking-tight">{userData.name}</h3>
        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1">LV. {Math.floor(userData.exp/100)} - {getLevelInfo(userData.exp).title}</p>
        <div className="flex gap-1 mt-4 bg-white/80 px-4 py-2 rounded-full border border-slate-100 shadow-sm">
           {[...Array(3)].map((_, i) => <Heart key={i} size={16} className={i < userData.lives ? 'text-rose-500 fill-current' : 'text-slate-200'} />)}
        </div>
      </div>
      <nav className="p-6 space-y-2 overflow-y-auto no-scrollbar max-h-[calc(100vh-250px)]">
        {[
          { id: AppTab.FEED, icon: Home, label: 'Feed Tri Thức' },
          { id: AppTab.MISSION, icon: Rocket, label: 'Chiến Dịch Sở GD' },
          { id: AppTab.TUTOR, icon: Bot, label: 'Gia sư AI' },
          { id: AppTab.FOCUS, icon: Clock, label: 'Phòng Tập Trung' },
          { id: AppTab.TOOLS, icon: LayoutGrid, label: 'Kho Đề & Công Cụ' },
          { id: AppTab.QUIZ, icon: BrainCircuit, label: 'Arena Tranh Biện' },
          { id: AppTab.RANK, icon: Trophy, label: 'Bảng Phong Thần' },
          { id: AppTab.PROFILE, icon: User, label: 'Hồ Sơ' }
        ].map(item => (
          <button key={item.id} onClick={() => { setActiveTab(item.id); onClose(); }} className={`w-full flex items-center gap-4 px-6 py-4 rounded-[1.5rem] font-bold text-sm transition-all ${activeTab === item.id ? 'bg-indigo-600 text-white shadow-xl translate-x-2' : 'text-slate-500 hover:bg-indigo-50 hover:text-indigo-600'}`}>
            <item.icon size={20} strokeWidth={activeTab === item.id ? 2.5 : 2} /> 
            {item.label}
          </button>
        ))}
      </nav>
      <div className="absolute bottom-10 left-0 right-0 px-10">
        <button onClick={onLogout} className="w-full flex items-center justify-center gap-3 py-4 bg-rose-50 text-rose-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all shadow-sm border border-rose-100">
            <LogOut size={18}/> Đăng xuất
        </button>
      </div>
    </aside>
  </>
);

const Toast: React.FC<any> = ({ toast }) => (
  <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[400] px-8 py-4 rounded-[2rem] shadow-2xl font-black text-[10px] uppercase tracking-widest animate-slide-up flex items-center gap-3 border backdrop-blur-xl ${toast.type === 'success' ? 'bg-indigo-600/95 border-indigo-400 text-white' : 'bg-rose-600/95 border-rose-400 text-white'}`}>
    {toast.type === 'success' ? <CheckCircle2 size={16} strokeWidth={3} /> : <X size={16} strokeWidth={3} />} {toast.message}
  </div>
);

const LoadingScreen = () => (
  <div className="fixed inset-0 bg-[#FDFCF8] flex items-center justify-center z-[500]">
    <div className="flex flex-col items-center gap-6">
      <div className="relative w-24 h-24 bg-indigo-600 rounded-[2.8rem] flex items-center justify-center text-white shadow-2xl animate-float">
        <Bot size={48} strokeWidth={2.5}/>
      </div>
      <div className="flex flex-col items-center gap-1">
        <span className="font-black text-slate-800 text-[10px] uppercase tracking-[0.4em] animate-pulse">StudyGram V7</span>
        <span className="font-bold text-slate-400 text-[8px] uppercase tracking-widest italic">Official Exam Edition</span>
      </div>
    </div>
  </div>
);

const StreakModal: React.FC<any> = ({ streak, onClaim }) => (
  <div className="fixed inset-0 z-[250] bg-slate-900/60 backdrop-blur-xl flex items-center justify-center p-6">
    <div className="glass w-full max-w-sm rounded-[4.5rem] p-12 text-center relative border-white shadow-2xl animate-slide-up">
      <div className="w-24 h-24 bg-gradient-to-br from-orange-400 to-orange-600 rounded-[2.5rem] flex items-center justify-center text-white mx-auto mb-8 shadow-2xl rotate-6 animate-bounce">
          <Flame size={48} fill="currentColor" />
      </div>
      <h2 className="text-4xl font-black text-slate-800 mb-2 tracking-tighter leading-none">DAY {streak + 1}!</h2>
      <p className="text-slate-400 font-bold text-sm mb-10 leading-relaxed italic">Vinh quang học thuật đang vẫy gọi! +50 EXP.</p>
      <button onClick={onClaim} className="w-full py-5 bg-indigo-600 text-white rounded-[1.8rem] font-black text-sm uppercase tracking-widest shadow-2xl hover:bg-indigo-700 active:scale-95 transition-all">NHẬN VÀ CHIẾN TIẾP 🚀</button>
    </div>
  </div>
);

export default App;
