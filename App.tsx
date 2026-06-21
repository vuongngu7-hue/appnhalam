
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
import { UserProfile, AppTab, LoginMethod, DailyQuest, ActivityItem } from './types';
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
          parsedData.dailyExpGained = 0;
          parsedData.bossChallengePassed = false;

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

        // Migration: Ensure new fields exist for old users
        if (!parsedData.coins) parsedData.coins = 500;
        if (!parsedData.inventory) {
          parsedData.inventory = [
            { id: 'p1', type: 'powerup', count: 2 },
            { id: 'p2', type: 'powerup', count: 1 }
          ];
        }
        if (!parsedData.weakPoints) parsedData.weakPoints = [];
        if (!parsedData.activityLog || parsedData.activityLog.length === 0) {
          parsedData.activityLog = [
            {
              id: 'init-1',
              type: 'quiz',
              title: 'Chiến thắng Arena Tranh Biện',
              description: 'Hoàn thành phản biện chủ đề "Trí tuệ nhân tạo sẽ thay thế giáo viên trong tương lai"',
              timestamp: Date.now() - 3 * 3600 * 1000,
              xpGained: 55
            },
            {
              id: 'init-2',
              type: 'focus',
              title: 'Phòng tập trung vô cực Pomodoro',
              description: 'Tập trung học tập năng suất cao trong 25 phút',
              timestamp: Date.now() - 6 * 3600 * 1000,
              xpGained: 40
            },
            {
              id: 'init-3',
              type: 'tutor',
              title: 'Tương tác AI Tutor giải bài tập',
              description: 'Xác minh đáp án và giải thích chi tiết phương trình hóa hữu cơ',
              timestamp: Date.now() - 10 * 3600 * 1000,
              xpGained: 35
            }
          ];
        }
        if (parsedData.dailyExpGained === undefined) parsedData.dailyExpGained = 0;
        if (parsedData.bossChallengePassed === undefined) parsedData.bossChallengePassed = false;
        if (!parsedData.skills) {
          parsedData.skills = { criticalThinking: 20, focus: 20, creativity: 20, knowledge: 20, discipline: 20 };
        } else {
          if (parsedData.skills.criticalThinking === undefined) parsedData.skills.criticalThinking = 20;
          if (parsedData.skills.focus === undefined) parsedData.skills.focus = 20;
          if (parsedData.skills.creativity === undefined) parsedData.skills.creativity = 20;
          if (parsedData.skills.knowledge === undefined) parsedData.skills.knowledge = 20;
          if (parsedData.skills.discipline === undefined) parsedData.skills.discipline = 20;
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

  const handleAddExp = useCallback((
    amount: number, 
    activityType?: ActivityItem['type'], 
    activityTitle?: string, 
    activityDesc?: string
  ) => {
    setUserData(prev => {
        if (!prev) return null;
        const updatedSkills = { ...(prev.skills || { criticalThinking: 20, focus: 20, creativity: 20, knowledge: 20, discipline: 20 }) };
        
        // Dynamic skill training logic based on activeTab
        const pointsToAdd = Math.max(1, Math.round(amount * 0.15));

        const tab = activeTab;
        if (tab === AppTab.FOCUS || activityType === 'focus') {
          updatedSkills.focus = Math.min(100, (updatedSkills.focus || 20) + pointsToAdd);
        } else if (tab === AppTab.QUIZ || activityType === 'quiz') {
          updatedSkills.criticalThinking = Math.min(100, (updatedSkills.criticalThinking || 20) + pointsToAdd);
        } else if (tab === AppTab.TUTOR || activityType === 'tutor') {
          updatedSkills.knowledge = Math.min(100, (updatedSkills.knowledge || 20) + pointsToAdd);
        } else if (tab === AppTab.FEED || activityType === 'feed') {
          updatedSkills.creativity = Math.min(100, (updatedSkills.creativity || 20) + pointsToAdd);
        } else {
          updatedSkills.discipline = Math.min(100, (updatedSkills.discipline || 20) + pointsToAdd);
        }

        // Generate activity item
        let finalType: ActivityItem['type'] = activityType || 'other';
        let finalTitle = activityTitle || '';
        let finalDesc = activityDesc || '';

        if (!activityType) {
          if (tab === AppTab.FOCUS) {
            finalType = 'focus';
            finalTitle = 'Tập trung Pomodoro';
            finalDesc = 'Hoàn thành phiên làm việc sâu để rèn luyện sự tập trung.';
          } else if (tab === AppTab.QUIZ) {
            finalType = 'quiz';
            finalTitle = 'Arena Tranh Biện';
            finalDesc = 'Hoàn thành lượt phản biện sắc bén với đấu sĩ AI.';
          } else if (tab === AppTab.TUTOR) {
            finalType = 'tutor';
            finalTitle = 'Tương tác AI Tutor';
            finalDesc = 'Đặt câu hỏi và nhận phân tích học thuật từ AI Tutor.';
          } else if (tab === AppTab.FEED) {
            finalType = 'feed';
            finalTitle = 'Cập nhật Feed Tri Thức';
            finalDesc = 'Tham gia đóng góp ý kiến và thảo luận trên bảng tin.';
          } else if (tab === AppTab.MISSION) {
            finalType = 'mission';
            finalTitle = 'Nhiệm vụ lộ trình Sở GD';
            finalDesc = 'Hoàn thành một chương học tập trọng tâm trong kế hoạch ôn thi.';
          } else {
            finalType = 'other';
            finalTitle = 'Hoạt động học tập';
            finalDesc = 'Tích lũy điểm xu và kinh nghiệm học đường trên EduNova AI.';
          }
        }

        const newActivity: ActivityItem = {
          id: 'act-' + Math.random().toString(36).slice(2, 7),
          type: finalType,
          title: finalTitle,
          description: finalDesc,
          timestamp: Date.now(),
          xpGained: amount
        };

        const currentLog = prev.activityLog || [];
        const updatedLog = [newActivity, ...currentLog].slice(0, 50); // Keep latest 50

        return { 
          ...prev, 
          exp: prev.exp + amount,
          dailyExpGained: (prev.dailyExpGained || 0) + amount,
          skills: updatedSkills,
          activityLog: updatedLog
        };
    });
    showToast(`+${amount} EXP!`, 'success');
  }, [showToast, activeTab]);

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
      setUserData(prev => {
        if (!prev) return null;
        
        const updatedSkills = { ...(prev.skills || { criticalThinking: 20, focus: 20, creativity: 20, knowledge: 20, discipline: 20 }) };
        if (questId === 'q1') {
          updatedSkills.focus = Math.min(100, (updatedSkills.focus || 20) + 15);
        } else if (questId === 'q2') {
          updatedSkills.knowledge = Math.min(100, (updatedSkills.knowledge || 20) + 15);
        } else if (questId === 'q3') {
          updatedSkills.discipline = Math.min(100, (updatedSkills.discipline || 20) + 15);
          updatedSkills.creativity = Math.min(100, (updatedSkills.creativity || 20) + 10);
        }

        return {
          ...prev,
          exp: prev.exp + quest.reward,
          dailyExpGained: (prev.dailyExpGained || 0) + quest.reward,
          skills: updatedSkills,
          dailyQuests: prev.dailyQuests.map(q => q.id === questId ? { ...q, isClaimed: true } : q)
        };
      });
      showToast(`+${quest.reward} EXP & Nâng cấp Kỹ năng! 🎉`, 'success');
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
      exp: 0, coins: 500, bio: 'Sẵn sàng chinh phục tri thức 🚀', joinedAt: Date.now(), streak: 1, lives: 3, streakShields: 0, completedQuizzes: 0, 
      loginMethod: method, isVerified: method !== 'guest', dailyQuests: INITIAL_QUESTS, lastLogin: Date.now(),
      skills: { criticalThinking: 20, focus: 20, creativity: 20, knowledge: 20, discipline: 20 },
      weakPoints: [],
      inventory: [
        { id: 'p1', type: 'powerup', count: 2 }, // Hint
        { id: 'p2', type: 'powerup', count: 1 }  // Fact Check
      ],
      activityLog: [
        {
          id: 'init-1',
          type: 'quiz',
          title: 'Chiến thắng Arena Tranh Biện',
          description: 'Hoàn thành phản biện chủ đề "Trí tuệ nhân tạo sẽ thay thế giáo viên trong tương lai"',
          timestamp: Date.now() - 3 * 3600 * 1000,
          xpGained: 55
        },
        {
          id: 'init-2',
          type: 'focus',
          title: 'Phòng tập trung vô cực Pomodoro',
          description: 'Tập trung học tập năng suất cao trong 25 phút',
          timestamp: Date.now() - 6 * 3600 * 1000,
          xpGained: 40
        }
      ]
    };
    setUserData(newUser);
  };

  if (isLoading) return <LoadingScreen />;
  if (!userData) return <AuthScreen onAuth={handleAuth} />;

  return (
    <div className="min-h-screen text-slate-200 font-sans selection:bg-indigo-500/30 flex flex-col overflow-x-hidden bg-bg-main">
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
            className="w-full min-h-[60vh] flex flex-col"
          >
            {activeTab === AppTab.FEED && (
              <>
                <ZenDashboard userData={userData} onClaim={claimQuestReward} onUpdate={handleUpdateUser} />
                <Feed userData={userData} onExp={(n) => { handleAddExp(n); updateQuestProgress('q3', 1); }} />
              </>
            )}
            {activeTab === AppTab.MISSION && <MissionControl userData={userData} onUpdate={handleUpdateUser} />}
            {activeTab === AppTab.TUTOR && <AITutor userData={userData} onExp={(n) => { handleAddExp(n); updateQuestProgress('q2', 1); }} />}
            {activeTab === AppTab.FOCUS && <FocusZone onExp={(n) => { handleAddExp(n); updateQuestProgress('q1', 25); }} showToast={showToast} />}
            {activeTab === AppTab.QUIZ && <QuizArena onExp={handleAddExp} showToast={showToast} userData={userData} onUpdate={handleUpdateUser} />}
            {activeTab === AppTab.TOOLS && <StudyTools onExp={handleAddExp} />}
            {activeTab === AppTab.RANK && <Leaderboard currentUid={userData.uid} userData={userData} />}
            {activeTab === AppTab.PROFILE && <Profile userData={userData} onUpdate={handleUpdateUser} onToast={showToast} />}
            
            {/* Empty State / Quote Widget */}
            {activeTab === AppTab.FEED && (
              <div className="mt-auto py-12 text-center opacity-30 select-none">
                <Sparkles size={24} className="mx-auto mb-4 text-indigo-400" />
                <p className="text-sm font-medium italic">"Học tập là hạt giống của kiến thức, kiến thức là hạt giống của hạnh phúc."</p>
              </div>
            )}
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
    <div className="fixed inset-0 z-[300] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-6">
      <div className="glass-card w-full max-w-md rounded-[3rem] p-10 text-center shadow-2xl animate-slide-up">
        {step === 'intro' ? (
          <div className="space-y-8">
             <div className="w-24 h-24 bg-rose-500/20 rounded-[2rem] flex items-center justify-center text-rose-500 mx-auto animate-pulse border border-rose-500/30 shadow-[0_0_30px_rgba(244,63,94,0.3)]">
                <AlertTriangle size={40} />
             </div>
             <h2 className="text-4xl font-black text-white tracking-tighter neon-text">REDEMPTION?</h2>
             <p className="text-slate-400 font-medium text-sm leading-relaxed">Chuỗi <span className="text-orange-400 font-bold">{userData.streak}</span> ngày của fen sắp kết thúc. Giải đề thi Sở GD để hồi sinh!</p>
             <div className="flex flex-col gap-4 pt-4">
               <button onClick={loadQuiz} className="w-full py-4 bg-white text-rose-600 rounded-2xl font-bold shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:scale-105 transition-all">
                  {loading ? <RefreshCw className="animate-spin mx-auto" /> : "CHẤP NHẬN THỬ THÁCH"}
               </button>
               <button onClick={onFail} className="text-slate-500 font-bold text-xs uppercase tracking-widest py-2 hover:text-white transition-colors">CHẤP NHẬN DẬP LỬA</button>
             </div>
          </div>
        ) : (
          <div className="space-y-8 text-white text-left">
             <div className="bg-slate-800/50 p-6 rounded-2xl border border-white/10 shadow-inner">
                <p className="text-lg font-bold leading-relaxed">{quiz[0]?.question}</p>
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
                    className="p-4 bg-white/5 hover:bg-indigo-500/20 border border-white/10 hover:border-indigo-500/50 rounded-xl text-left font-medium transition-all"
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

const ZenDashboard: React.FC<{ userData: UserProfile; onClaim: (id: string) => void; onUpdate: (updated: UserProfile) => void }> = ({ userData, onClaim, onUpdate }) => {
  const isPhantom = userData.streak >= 7;
  const streakProgress = (userData.streak % 7) / 7 * 100;
  const levelInfo = getLevelInfo(userData.exp);
  const nextLevelExp = (Math.floor(userData.exp / 100) + 1) * 100;
  const expProgress = (userData.exp % 100) / 100 * 100;

  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0); // Next midnight
      const diff = midnight.getTime() - now.getTime();
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      const hStr = String(hours).padStart(2, '0');
      const mStr = String(minutes).padStart(2, '0');
      const sStr = String(seconds).padStart(2, '0');
      
      setTimeLeft(`${hStr}:${mStr}:${sStr}`);
    };
    
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const dailyBoss = useMemo(() => {
    const days = [
      { name: 'Chúa Tể Giải Tích 📐', desc: 'Sử dụng đạo hàm và tích phân tối thượng để bẻ gãy mọi nỗ lực học tập!', type: 'Math', hp: 100, avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=MathBoss' },
      { name: 'Quái Thú Động Lực Học ⚡', desc: 'Vận dụng ma sát và phản lực từ trường để làm chậm tốc độ tiếp thu của đối thủ!', type: 'Physics', hp: 100, avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=PhysicsBoss' },
      { name: 'Ma Vương Cacbohidrat 🧪', desc: 'Liên kết cấu trúc đường phức tạp để giam cầm tư duy logic!', type: 'Chemistry', hp: 100, avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=ChemBoss' },
      { name: 'Đại Đao Anh Ngữ 🇬🇧', desc: 'Phục kích bằng hàng loạt cụm từ Idioms bẫy ngữ pháp bế tắc!', type: 'English', hp: 100, avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=EnglishBoss' },
      { name: 'Mãng Xà Lịch Sử 📜', desc: 'Quấn chặt người học bằng các niên đại lịch sử và cột mốc dày đặc!', type: 'History', hp: 100, avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=HistoryBoss' },
      { name: 'Chúa Tể Địa Lý 🌍', desc: 'Tạo bão cát địa lý và kiến tạo mảng sụt lún để thử thách ý chí học giả!', type: 'Geography', hp: 100, avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=GeoBoss' },
      { name: 'Kẻ Hủy Diệt Tri Thức 🌌', desc: 'Quái vật hư vô nuốt chửng mọi sự tập trung và động lực mỗi cuối tuần!', type: 'General', hp: 100, avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=KnowledgeBoss' }
    ];
    return days[new Date().getDay()];
  }, []);

  const currentDailyExp = userData.dailyExpGained || 0;
  const bossHp = dailyBoss.hp;
  const bossHpRemaining = Math.max(0, bossHp - currentDailyExp);
  const hpPercent = Math.min(100, (currentDailyExp / bossHp) * 100);
  const isDefeated = currentDailyExp >= bossHp;
  const isClaimed = userData.bossChallengePassed || false;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mb-12 space-y-8"
    >
      <div className={`glass-card p-8 md:p-10 rounded-[3rem] transition-all duration-700 overflow-hidden relative group ${isPhantom ? 'ring-2 ring-purple-500/50 shadow-[0_0_30px_rgba(168,85,247,0.2)]' : ''}`}>
         <div className={`absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform ${isPhantom ? 'text-purple-400' : 'text-orange-400'}`}><Flame size={200} fill="currentColor" /></div>
         
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
                        className={`transition-all duration-500 ${i < userData.lives ? 'text-rose-500 fill-current drop-shadow-[0_0_12px_rgba(244,63,94,0.8)]' : 'text-slate-700'}`} 
                      />
                    </motion.div>
                  ))}
               </div>
               <div>
                 <h2 className={`text-4xl md:text-5xl font-black tracking-tighter ${isPhantom ? 'text-purple-400 neon-text' : 'text-orange-400 neon-text'}`}>
                    {isPhantom ? 'PHANTOM ERA' : 'STREAK SURVIVAL'}
                 </h2>
                 <p className="text-slate-400 font-medium text-sm leading-relaxed max-w-xs uppercase tracking-tight mt-2">
                    {isPhantom ? 'Ngọn lửa vĩnh cửu đã được kích hoạt. Bạn là huyền thoại!' : 'Duy trì chuỗi ngày học để thắp sáng tri thức.'}
                 </p>
               </div>

               <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <span>Tiến trình chuỗi</span>
                      <span className={isPhantom ? 'text-purple-400' : 'text-orange-400'}>{userData.streak % 7}/7 NGÀY</span>
                    </div>
                    <div className="h-2 bg-slate-800/50 rounded-full overflow-hidden border border-white/5">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${streakProgress}%` }}
                        className={`h-full rounded-full ${isPhantom ? 'bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.8)]' : 'bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.8)]'}`}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <span className="flex items-center gap-1"><Award size={12} className="text-indigo-400"/> EXP Lên cấp</span>
                      <span className="text-indigo-400">{userData.exp} / {nextLevelExp}</span>
                    </div>
                    <div className="h-2 bg-slate-800/50 rounded-full overflow-hidden border border-white/5">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${expProgress}%` }}
                        className="h-full rounded-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.8)]"
                      />
                    </div>
                  </div>
               </div>
            </div>
            
            <div className="flex flex-col items-center justify-center p-8 bg-slate-800/30 rounded-[3rem] border border-white/5 backdrop-blur-md relative overflow-hidden group/streak">
               <motion.div 
                 animate={isPhantom ? { filter: ["drop-shadow(0 0 20px rgba(168, 85, 247, 0.8))", "drop-shadow(0 0 40px rgba(99, 102, 241, 1))"], scale: [1, 1.1, 1] } : { scale: [1, 1.05, 1] }}
                 transition={{ repeat: Infinity, duration: 2 }}
                 className={`relative ${isPhantom ? 'text-purple-400' : 'text-orange-500'}`}
               >
                  <Flame size={100} fill="currentColor" />
                  <span className="absolute inset-0 flex items-center justify-center text-4xl font-black mt-4 text-white drop-shadow-md">{userData.streak}</span>
               </motion.div>
               <span className="mt-4 text-[11px] font-black uppercase tracking-[0.5em] text-slate-400">DAY STREAK</span>
               
               <AnimatePresence>
                 {userData.streakShields > 0 && (
                   <motion.div 
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, scale: 0.8 }}
                     className="mt-6 flex items-center gap-2 bg-indigo-500/20 px-5 py-2 rounded-full border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                   >
                      <Shield size={16} fill="currentColor" className="text-indigo-400" />
                      <span className="text-[11px] font-black uppercase tracking-widest text-indigo-300">{userData.streakShields} SHIELD ON</span>
                   </motion.div>
                 )}
               </AnimatePresence>
            </div>
         </div>
      </div>

      {/* Boss Raid Card */}
      <div className={`glass-card p-8 md:p-10 rounded-[3rem] border border-white/10 shadow-2xl bg-slate-900/50 relative overflow-hidden group transition-all duration-700 ${isDefeated && !isClaimed ? 'ring-2 ring-indigo-500/50 shadow-[0_0_30px_rgba(99,102,241,0.2)]' : ''}`}>
         <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 blur-[80px] rounded-full"></div>
         <div className="relative z-10 flex flex-col md:flex-row gap-6 items-center">
            <div className="shrink-0 relative group">
              <div className="absolute -inset-1 rounded-[2.5rem] bg-indigo-600/30 blur-md group-hover:scale-105 transition-all"></div>
              <img src={dailyBoss.avatar} className="relative w-24 h-24 rounded-[2rem] bg-slate-800 border-2 border-white/10 shadow-lg object-cover" />
              {isDefeated && (
                <div className="absolute -bottom-1 -right-1 bg-green-500 text-white p-1 rounded-lg border-2 border-slate-900 font-bold text-[8px] tracking-wide uppercase px-2 shadow-lg">K.O</div>
              )}
            </div>

            <div className="flex-1 text-center md:text-left space-y-2 min-w-0">
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div>
                     <div className="flex items-center gap-2 flex-wrap justify-center md:justify-start">
                        <span className="text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest bg-rose-500/20 text-rose-300 border border-rose-500/30">BOSS RAID HÀNG NGÀY</span>
                        <span className="text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1 shadow-sm">
                           <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse"></span>
                           RESET TRONG: {timeLeft}
                        </span>
                     </div>
                     <h3 className="text-xl md:text-2xl font-black text-white tracking-tight mt-2">{dailyBoss.name}</h3>
                  </div>
                  <div className="text-right">
                     <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black">BOSS HP</span>
                     <p className="text-sm font-black text-white">{bossHpRemaining}/{bossHp} EXP</p>
                  </div>
               </div>

               <p className="text-xs text-slate-400 font-medium leading-relaxed italic">{dailyBoss.desc}</p>
               
               {/* Boss HP Bar */}
               <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-[9px] font-black uppercase tracking-wider text-slate-500">
                     <span>Bản thân gây sát thương</span>
                     <span className={isDefeated ? 'text-green-400 font-bold' : 'text-rose-400'}>{Math.floor(hpPercent)}% Sát thương</span>
                  </div>
                  <div className="h-3 bg-slate-800 rounded-full overflow-hidden border border-white/5 relative">
                     <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${hpPercent}%` }}
                        className={`h-full rounded-full transition-all duration-500 ${isDefeated ? 'bg-gradient-to-r from-emerald-500 to-green-400 shadow-[0_0_15px_rgba(34,197,94,0.6)]' : 'bg-gradient-to-r from-rose-600 to-amber-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]'}`}
                     />
                  </div>
               </div>
            </div>
         </div>

         {/* Actions block footer */}
         <div className="mt-6 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10 w-full">
            <div className="text-center sm:text-left">
               <span className="text-[9px] text-slate-500 uppercase tracking-widest font-black block">Phần thưởng hạ boss</span>
               <span className="text-xs font-bold text-slate-300 flex items-center justify-center sm:justify-start gap-1.5 mt-0.5">
                  <Shield size={14} className="text-indigo-400" /> +1 Streak Shield (Bảo vệ chuỗi học tập)
               </span>
            </div>

            <div className="w-full sm:w-auto">
               {!isDefeated ? (
                  <div className="text-[11px] font-black text-rose-400 bg-rose-500/10 px-4 py-2 border border-rose-500/20 rounded-xl text-center">
                     CẦN THÊM {bossHpRemaining} EXP ĐỂ HẠ BOSS
                  </div>
               ) : !isClaimed ? (
                  <button 
                     onClick={() => {
                        onUpdate({
                           ...userData,
                           streakShields: userData.streakShields + 1,
                           bossChallengePassed: true
                        });
                        try {
                           // @ts-ignore
                           window.confetti({ particleCount: 150, spread: 80, origin: { y: 0.8 } });
                        } catch (e) {}
                     }}
                     className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.5)] hover:scale-105 active:scale-95 transition-all text-center cursor-pointer"
                  >
                     HẠ BOSS & NHẬN THƯỞNG 🛡️
                  </button>
               ) : (
                  <div className="text-[11px] font-black text-emerald-400 bg-emerald-500/10 px-4 py-2 border border-emerald-500/20 rounded-xl text-center">
                     BẢO VỆ CHUỖI ĐÃ ĐƯỢC BẬT CHU ĐÁO ✓
                  </div>
               )}
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
    <div className="fixed inset-0 bg-[#0f172a] flex items-center justify-center p-6 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse-glow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[100px] animate-pulse-glow" style={{ animationDelay: '1.5s' }}></div>
        
        <div className="glass-card w-full max-w-md rounded-[3rem] p-10 text-center relative z-10 animate-slide-up border border-white/10">
            <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2rem] mb-10 mx-auto flex items-center justify-center text-white shadow-[0_0_30px_rgba(20,184,166,0.4)] rotate-3">
                <BookOpen size={48} strokeWidth={2.5} />
            </div>
            {view === 'landing' ? (
                <div className="space-y-8 animate-slide-in">
                    <div>
                        <h1 className="text-4xl font-black text-white tracking-tighter mb-2 leading-none neon-text">EduNova AI</h1>
                        <p className="text-indigo-300 font-bold uppercase tracking-widest text-[10px]">Official Exam Integration</p>
                    </div>
                    <div className="space-y-4">
                        <button onClick={() => onAuth('google')} className="w-full py-4 flex items-center justify-center gap-4 bg-white/5 border border-white/10 rounded-[1.5rem] font-bold text-white hover:bg-white/10 transition-all shadow-sm">
                            <Globe size={22} className="text-blue-400" /> Google Login
                        </button>
                        <button onClick={() => setView('name')} className="w-full py-4 bg-indigo-600 text-white rounded-[1.5rem] font-bold shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:bg-indigo-500 transition-all">
                            Tiếp tục với tên riêng
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-8 animate-slide-in">
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tighter mb-2 leading-none">Chào học giả!</h1>
                        <p className="text-slate-400 font-medium text-sm">Chọn danh tính của bạn</p>
                    </div>
                    <div className="space-y-4 relative">
                        <div className="relative group">
                          <User size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-400 transition-colors" />
                          <input 
                            value={name} 
                            onChange={e => setName(e.target.value)} 
                            placeholder="VD: Sói Học Tập 🐺" 
                            className="w-full p-5 pl-14 bg-slate-900/50 rounded-[1.5rem] border border-white/10 focus:border-indigo-500/50 font-bold text-white text-lg shadow-inner outline-none transition-all focus:ring-2 focus:ring-indigo-500/20" 
                          />
                        </div>
                        <button onClick={() => onAuth('guest', name)} disabled={!name.trim()} className="w-full py-4 bg-indigo-600 text-white rounded-[1.5rem] font-bold shadow-[0_0_20px_rgba(99,102,241,0.4)] disabled:opacity-50 hover:bg-indigo-500 active:scale-95 transition-all flex justify-center items-center gap-2">
                          BẮT ĐẦU <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

const Header: React.FC<any> = ({ onOpenMenu, activeTab, userData }) => {
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateHeaderTime = () => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const ss = String(now.getSeconds()).padStart(2, '0');
      setTimeStr(`${hh}:${mm}:${ss}`);
    };
    updateHeaderTime();
    const interval = setInterval(updateHeaderTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="fixed top-6 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-4xl h-16 glass rounded-2xl z-40 flex items-center justify-between px-4 shadow-[0_10px_30px_rgba(0,0,0,0.5)] border border-white/10">
      <div className="flex items-center gap-2">
        <button onClick={onOpenMenu} className="p-2.5 bg-white/5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-all border border-white/5">
            <Menu size={18} strokeWidth={2.5} />
        </button>
        <div className="flex items-center gap-1.5 bg-slate-950/45 px-3 py-1.5 rounded-full border border-teal-500/25 text-teal-400 font-bold text-[10px] font-mono tracking-wider shadow-inner">
          <Clock size={12} className="text-teal-400 animate-pulse" />
          <span>{timeStr}</span>
        </div>
      </div>
      
      <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none">
          <h1 className="font-extrabold text-white tracking-[0.14em] uppercase text-sm md:text-base leading-none select-none drop-shadow-[0_0_12px_rgba(255,255,255,0.2)]">EDUNOVA AI</h1>
      </div>

      <div className="flex items-center gap-1.5 md:gap-2">
          <div className="flex items-center gap-1 bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/30">
            <Stars size={13} className="text-amber-400" fill="currentColor" />
            <span className="text-[10px] font-extrabold text-amber-400">{userData.coins}</span>
          </div>
          <div className="flex items-center gap-1 bg-orange-500/10 px-3 py-1.5 rounded-full border border-orange-500/30">
            <Flame size={13} className="text-orange-400" fill="currentColor" />
            <span className="text-[10px] font-extrabold text-orange-400">{userData.streak}</span>
          </div>
          <div className="flex items-center gap-1 bg-rose-500/10 px-3 py-1.5 rounded-full border border-rose-500/30">
            <Heart size={13} className="text-rose-400" fill="currentColor" />
            <span className="text-[10px] font-extrabold text-rose-400">{userData.lives}</span>
          </div>
          <div className="relative group cursor-pointer ml-1">
              <div className={`absolute -inset-0.5 rounded-full blur-sm opacity-70 animate-pulse ${userData.streak >= 7 ? 'bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-400' : 'bg-teal-500/40'}`}></div>
              <img src={userData.avatar} className="relative w-8 h-8 rounded-full border border-white/20 shadow-md" alt="avatar" />
          </div>
      </div>
    </header>
  );
};

const BottomNav: React.FC<any> = ({ activeTab, setActiveTab }) => (
  <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-auto z-40">
    <nav className="glass rounded-full border border-white/10 px-3 py-2 flex items-center gap-2 shadow-[0_15px_40px_rgba(0,0,0,0.8)] backdrop-blur-3xl bg-slate-950/80">
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
                  className={`relative p-3 rounded-full transition-all duration-300 ${isActive ? 'text-teal-400 animate-pulse-glow' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    {isActive && (
                      <>
                        <motion.div 
                          layoutId="activeTabGlow"
                          className="absolute inset-0 bg-teal-500/10 rounded-full blur-xl"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                        <motion.div 
                          layoutId="activeTabDot"
                          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-teal-400 rounded-full shadow-[0_0_8px_rgba(20,184,166,0.9)]"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      </>
                    )}
                    <tab.icon size={19} strokeWidth={isActive ? 2.5 : 2} className={`relative z-10 ${isActive ? 'drop-shadow-[0_0_10px_rgba(20,184,166,0.8)]' : ''}`} />
                </button>
            );
        })}
    </nav>
  </div>
);

const Sidebar: React.FC<any> = ({ isOpen, onClose, userData, setActiveTab, activeTab, onLogout }) => (
  <>
    <div className={`fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[60] transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />
    <aside className={`fixed top-0 left-0 bottom-0 w-80 glass border-r border-white/10 z-[70] transition-transform duration-500 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="p-8 border-b border-white/5 flex flex-col items-center bg-slate-800/30">
        <div className="relative mb-4">
            <div className={`absolute -inset-2 rounded-full blur-lg opacity-40 bg-gradient-to-r from-indigo-500 to-purple-500 animate-pulse`}></div>
            <img src={userData.avatar} className="relative w-20 h-20 rounded-[2rem] border-2 border-white/20 shadow-2xl" alt="profile" />
        </div>
        <h3 className="font-black text-lg text-white tracking-tight">{userData.name}</h3>
        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-1">LV. {Math.floor(userData.exp/100)} - {getLevelInfo(userData.exp).title}</p>
        <div className="flex gap-1 mt-4 bg-slate-900/50 px-3 py-1.5 rounded-full border border-white/5 shadow-inner">
           {[...Array(3)].map((_, i) => <Heart key={i} size={14} className={i < userData.lives ? 'text-rose-500 fill-current' : 'text-slate-600'} />)}
        </div>
      </div>
      <nav className="p-4 space-y-1 overflow-y-auto no-scrollbar max-h-[calc(100vh-250px)]">
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
          <button key={item.id} onClick={() => { setActiveTab(item.id); onClose(); }} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl font-bold text-sm transition-all ${activeTab === item.id ? 'bg-indigo-500/20 text-indigo-300 shadow-[inset_0_0_10px_rgba(99,102,241,0.1)] border border-indigo-500/20 translate-x-1' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
            <item.icon size={18} strokeWidth={activeTab === item.id ? 2.5 : 2} /> 
            {item.label}
          </button>
        ))}
      </nav>
      <div className="absolute bottom-8 left-0 right-0 px-6">
        <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 py-3.5 bg-rose-500/10 text-rose-400 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all border border-rose-500/20">
            <LogOut size={16}/> Đăng xuất
        </button>
      </div>
    </aside>
  </>
);

const Toast: React.FC<any> = ({ toast }) => (
  <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[400] px-6 py-3 rounded-2xl shadow-2xl font-bold text-xs tracking-wide animate-slide-up flex items-center gap-3 border backdrop-blur-xl ${toast.type === 'success' ? 'bg-indigo-900/90 border-indigo-500/50 text-indigo-100 shadow-[0_0_20px_rgba(99,102,241,0.3)]' : 'bg-rose-900/90 border-rose-500/50 text-rose-100 shadow-[0_0_20px_rgba(244,63,94,0.3)]'}`}>
    {toast.type === 'success' ? <CheckCircle2 size={16} className="text-indigo-400" /> : <X size={16} className="text-rose-400" />} {toast.message}
  </div>
);

const LoadingScreen = () => (
  <div className="fixed inset-0 bg-[#0f172a] flex items-center justify-center z-[500]">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.15)_0,transparent_50%)] animate-pulse-glow"></div>
    <div className="flex flex-col items-center gap-6 relative z-10">
      <div className="relative w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2rem] flex items-center justify-center text-white shadow-[0_0_30px_rgba(20,184,166,0.5)] animate-float">
        <Bot size={40} strokeWidth={2.5}/>
      </div>
      <div className="flex flex-col items-center gap-1">
        <span className="font-black text-white text-xs uppercase tracking-[0.4em] animate-pulse neon-text">EduNova AI</span>
        <span className="font-medium text-indigo-400 text-[9px] uppercase tracking-widest">Premium AI Edition</span>
      </div>
    </div>
  </div>
);

const StreakModal: React.FC<any> = ({ streak, onClaim }) => (
  <div className="fixed inset-0 z-[250] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-6">
    <div className="glass-card w-full max-w-sm rounded-[3rem] p-10 text-center relative animate-slide-up">
      <div className="w-24 h-24 bg-gradient-to-br from-orange-400 to-orange-600 rounded-[2rem] flex items-center justify-center text-white mx-auto mb-8 shadow-[0_0_30px_rgba(249,115,22,0.4)] rotate-6 animate-bounce">
          <Flame size={48} fill="currentColor" />
      </div>
      <h2 className="text-4xl font-black text-white mb-2 tracking-tighter leading-none neon-text">DAY {streak + 1}!</h2>
      <p className="text-slate-400 font-medium text-sm mb-8 leading-relaxed">Vinh quang học thuật đang vẫy gọi! <span className="text-indigo-400 font-bold">+50 EXP</span></p>
      <button onClick={onClaim} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:bg-indigo-500 active:scale-95 transition-all">NHẬN VÀ CHIẾN TIẾP 🚀</button>
    </div>
  </div>
);

export default App;
