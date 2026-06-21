
import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Rocket, ChevronRight, CheckCircle, Loader2, 
  ArrowLeft, GraduationCap, Zap, Info, HelpCircle,
  XCircle, Award, ListOrdered, BarChart, Timer
} from 'lucide-react';
import { UserProfile, StudyMission, Grade, ExamDifficulty } from '../types';
import { generateExamRoadmap, generateStructuredExamPaper } from '../services/geminiService';

const MissionControl: React.FC<{ userData: UserProfile; onUpdate: (u: UserProfile) => void }> = ({ userData, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [loadingNodeId, setLoadingNodeId] = useState<string | null>(null);
  const [grade, setGrade] = useState<Grade>(userData.currentMission?.grade || '12');
  const [subject, setSubject] = useState(userData.currentMission?.subject || 'Toán học');
  const [questionCount, setQuestionCount] = useState<number>(20);
  const [activeExam, setActiveExam] = useState<any[] | null>(null);
  const [examTimer, setExamTimer] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({}); // Store index of selected option
  const [isReviewed, setIsReviewed] = useState(false);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  useEffect(() => {
    if (errorToast) {
      const timer = setTimeout(() => setErrorToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [errorToast]);

  useEffect(() => {
    let interval: any = null;
    if (isTimerActive) {
      interval = setInterval(() => setExamTimer(t => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerActive]);

  const formatExamTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  // --- OPTIMIZED GRADING LOGIC ---
  const checkAnswer = (userSelectedIndex: number | undefined, question: any) => {
    if (userSelectedIndex === undefined || !question) return false;
    
    // Priority 1: Check against index (Gemini recommended output)
    if (typeof question.correctAnswerIndex === 'number') {
      return userSelectedIndex === question.correctAnswerIndex;
    }
    
    // Priority 2: Fallback text comparison (Robustness check)
    try {
        const selectedText = question.options[userSelectedIndex];
        const correctRaw = question.answer?.toString().trim();
        if (!correctRaw) return false;
        
        // Handle "A. Content" vs "Content"
        const cleanCorrect = correctRaw.replace(/^[A-D]\.\s*/, '').trim().toLowerCase();
        const cleanSelected = selectedText.replace(/^[A-D]\.\s*/, '').trim().toLowerCase();
        
        return cleanCorrect === cleanSelected || correctRaw.startsWith(String.fromCharCode(65 + userSelectedIndex));
    } catch(e) {
        return false;
    }
  };

  const startMission = async () => {
    setLoading(true);
    try {
      const roadmapData = await generateExamRoadmap(grade, subject);
      const newMission: StudyMission = {
        goal: 'THPTQG',
        grade: grade,
        targetDate: Date.now() + 60 * 24 * 60 * 60 * 1000,
        subject: subject,
        roadmap: roadmapData.roadmap.map((n: any) => ({
          ...n,
          status: 'current',
          mastery: 0
        }))
      };
      onUpdate({ ...userData, currentMission: newMission });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadExam = async (nodeId: string, difficulty: ExamDifficulty) => {
    setLoadingNodeId(nodeId);
    setUserAnswers({});
    setIsReviewed(false);
    setExamTimer(0);
    try {
      const exam = await generateStructuredExamPaper(subject, grade, difficulty, questionCount);
      if (exam && exam.length > 0) {
        setActiveExam(exam);
        setIsTimerActive(true);
      } else {
        setErrorToast("AI đang bận, fen thử lại sau vài giây nhé!");
      }
    } catch (e) {
      console.error(e);
      setErrorToast("Đã xảy ra lỗi khi tạo đề, vui lòng thử lại nhé!");
    } finally {
      setLoadingNodeId(null);
    }
  };

  const scoreInfo = useMemo(() => {
    if (!activeExam) return { correct: 0, total: 0, exp: 0 };
    let correct = 0;
    activeExam.forEach((q, i) => {
      if (checkAnswer(userAnswers[i], q)) correct++;
    });
    return {
      correct,
      total: activeExam.length,
      exp: correct * 30 + (correct === activeExam.length ? 100 : 0)
    };
  }, [activeExam, userAnswers]);

  const finishExam = () => {
    if (!isReviewed) {
      setIsReviewed(true);
      setIsTimerActive(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const mastery = Math.round((scoreInfo.correct / scoreInfo.total) * 100);
    const updatedRoadmap = userData.currentMission?.roadmap.map(node => 
      node.id === loadingNodeId ? { ...node, status: mastery > 50 ? 'completed' : 'current', mastery } : node
    );

    // Update weak points if score is low
    let newWeakPoints = [...userData.weakPoints];
    if (mastery < 70) {
      const topic = userData.currentMission?.roadmap.find(n => n.id === loadingNodeId)?.title || subject;
      const existing = newWeakPoints.find(wp => wp.topic === topic);
      if (existing) {
        existing.score = Math.min(existing.score, mastery);
      } else {
        newWeakPoints.push({ topic, score: mastery });
      }
    }

    onUpdate({
      ...userData,
      exp: userData.exp + scoreInfo.exp,
      coins: userData.coins + (scoreInfo.correct * 5),
      completedQuizzes: userData.completedQuizzes + 1,
      currentMission: userData.currentMission ? { ...userData.currentMission, roadmap: updatedRoadmap || [] } : undefined,
      weakPoints: newWeakPoints
    });
    
    setActiveExam(null);
    if (scoreInfo.correct / scoreInfo.total > 0.5) {
       try {
         // @ts-ignore
         window.confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } });
       } catch(e) {}
    }
  };

  const handleSelect = (qIdx: number, optIdx: number) => {
    if (isReviewed) return;
    setUserAnswers(prev => ({ ...prev, [qIdx]: optIdx }));
  };

  if (activeExam) {
    return (
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="content-container space-y-4 px-4 pb-40"
      >
        <div className="glass-card p-4 sticky top-0 z-30 -mx-4 mb-4 border-b border-white/10 flex items-center justify-between shadow-lg">
          <button onClick={() => setActiveExam(null)} className="flex items-center gap-2 text-slate-400 font-bold text-sm hover:text-white transition-colors">
            <ArrowLeft size={16} /> THOÁT
          </button>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-full text-[10px] font-black text-indigo-400 border border-indigo-500/20">
              <Timer size={12} /> {formatExamTime(examTimer)}
            </div>
            <div className="bg-slate-800/50 px-3 py-1.5 rounded-full text-[10px] font-black text-slate-400 uppercase border border-white/5">
              {Object.keys(userAnswers).length}/{activeExam.length} CÂU
            </div>
            {isReviewed && (
              <div className="bg-indigo-600 text-white px-3 py-1.5 rounded-full text-[10px] font-black uppercase shadow-[0_0_10px_rgba(99,102,241,0.5)]">
                ĐÚNG {scoreInfo.correct}/{scoreInfo.total}
              </div>
            )}
          </div>
        </div>

        {isReviewed && (
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-8 rounded-[2.5rem] text-white shadow-[0_0_30px_rgba(99,102,241,0.3)] animate-slide-up mb-8 border border-white/20">
            <div className="flex justify-between items-center mb-4">
              <Award size={48} className="opacity-50" />
              <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Kết quả</p>
                <h4 className="text-4xl font-black">{Math.round((scoreInfo.correct / scoreInfo.total) * 100)}%</h4>
              </div>
            </div>
            <p className="font-bold text-sm mb-4 opacity-90 italic">
              {scoreInfo.correct === scoreInfo.total ? "Tuyệt vời! Fen là thiên tài! 🚀" : 
               scoreInfo.correct > scoreInfo.total / 2 ? "Khá tốt! Xem lại lỗi sai nhé. ✨" : 
               "Cố gắng lên, đọc kỹ giải thích bên dưới."}
            </p>
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl flex items-center justify-between border border-white/10 shadow-inner">
              <span className="text-xs font-black uppercase tracking-widest">Thưởng:</span>
              <span className="text-xl font-black">+{scoreInfo.exp} EXP</span>
            </div>
          </div>
        )}

        <div className="space-y-8">
          {activeExam.map((q, i) => {
            const isCorrect = checkAnswer(userAnswers[i], q);
            const userIdx = userAnswers[i];
            
            return (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className={`glass-card rounded-[2.5rem] p-8 border transition-all shadow-xl ${
                  isReviewed ? (isCorrect ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-rose-500/30 bg-rose-500/5') : 'border-white/10'
                }`}
              >
                <div className="flex items-start gap-4 mb-6">
                  <span className={`shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm border ${
                    isReviewed ? (isCorrect ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-rose-500 text-white border-rose-400') : 'bg-indigo-500/20 text-indigo-400 border-indigo-500/20'
                  }`}>
                    {i+1}
                  </span>
                  <p className="font-bold text-slate-200 leading-snug text-lg pt-1">{q.question}</p>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {q.options.map((opt: string, idx: number) => {
                    const optionChar = String.fromCharCode(65 + idx);
                    const isSelected = userIdx === idx;
                    const isRightAnswer = checkAnswer(idx, q);
                    
                    let btnStyle = "bg-white/5 border-white/5 text-slate-400";
                    if (isReviewed) {
                       if (isRightAnswer) btnStyle = "bg-emerald-500 border-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]";
                       else if (isSelected && !isRightAnswer) btnStyle = "bg-rose-500 border-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]";
                       else btnStyle = "bg-white/5 border-transparent text-slate-600 opacity-40";
                    } else if (isSelected) {
                       btnStyle = "bg-indigo-500/10 border-indigo-500 text-indigo-400 scale-[1.02] shadow-[0_0_15px_rgba(99,102,241,0.2)]";
                    }

                    return (
                      <button 
                        key={idx} 
                        disabled={isReviewed}
                        onClick={() => handleSelect(i, idx)}
                        className={`group p-5 text-left text-sm rounded-2xl border transition-all flex items-center gap-4 ${btnStyle} ${!isReviewed && 'hover:bg-white/10'}`}
                      >
                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0 border ${
                          isReviewed ? 'bg-white/20 border-white/10' : (isSelected ? 'bg-indigo-500 text-white border-indigo-400' : 'bg-slate-800/50 border-white/10 text-slate-500')
                        }`}>
                          {optionChar}
                        </span>
                        <span className="flex-1 font-semibold">{opt}</span>
                      </button>
                    );
                  })}
                </div>

                {isReviewed && (
                  <div className={`mt-6 p-6 rounded-3xl border shadow-inner ${isCorrect ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-slate-800/50 border-white/5'}`}>
                    <div className="flex items-center gap-2 mb-2">
                       <HelpCircle size={16} className="text-indigo-400" />
                       <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Giải thích AI</span>
                    </div>
                    <p className="text-sm font-bold text-slate-400 leading-relaxed italic">
                      {q.explanation || "Đang cập nhật..."}
                    </p>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
        
        <div className="mt-12">
           <button 
             onClick={finishExam} 
             disabled={!isReviewed && Object.keys(userAnswers).length < activeExam.length}
             className={`w-full py-6 rounded-3xl font-black shadow-2xl transition-all text-lg flex items-center justify-center gap-3 border border-white/20 active:scale-95 ${
               isReviewed ? 'bg-indigo-600 text-white shadow-[0_0_30px_rgba(99,102,241,0.4)]' : 'bg-indigo-600 text-white disabled:opacity-50'
             }`}
           >
              {isReviewed ? <Award size={24} /> : <Rocket size={24} />}
              {isReviewed ? 'HOÀN TẤT & NHẬN XP' : 'NỘP BÀI KIỂM TRA'}
           </button>
        </div>
      </motion.div>
    );
  }

  // --- CONFIGURATION VIEW ---
  if (!userData.currentMission) {
    return (
      <div className="content-container animate-in space-y-8 px-4 py-6">
        <div className="text-center space-y-2">
          <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white mx-auto shadow-[0_0_30px_rgba(99,102,241,0.4)] mb-6 border border-white/20">
             <GraduationCap size={40} />
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight neon-text">Cấu hình Ôn thi</h2>
          <p className="text-slate-400 text-sm font-bold opacity-70 italic">SGK mới 2018 - Chuẩn Sở GD</p>
        </div>

        <div className="space-y-6">
          <div className="flex gap-2 p-1.5 bg-slate-800/50 rounded-[2rem] border border-white/5">
            {['10', '11', '12'].map(g => (
              <button key={g} onClick={() => setGrade(g as Grade)} className={`flex-1 py-4 rounded-[1.5rem] font-black text-xs transition-all ${grade === g ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>LỚP {g}</button>
            ))}
          </div>

          <div className="glass-card p-6 rounded-[2.5rem] border border-white/10 shadow-xl space-y-4">
            <div className="flex items-center gap-2 mb-2">
               <ListOrdered size={16} className="text-indigo-400"/>
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Quy mô đề</label>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[20, 30, 40, 50].map(c => (
                <button key={c} onClick={() => setQuestionCount(c)} className={`py-3 rounded-xl text-xs font-black transition-all border border-white/5 ${questionCount === c ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-800/50 text-slate-500 hover:text-slate-300'}`}>{c} CÂU</button>
              ))}
            </div>
          </div>

          <div className="glass-card p-6 rounded-[2.5rem] border border-white/10 shadow-xl">
            <div className="flex items-center gap-2 mb-4">
               <BarChart size={16} className="text-indigo-400"/>
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Môn học</label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {['Toán học', 'Ngữ văn', 'Tiếng Anh', 'Vật lý', 'Hóa học', 'Sinh học', 'Lịch sử', 'Địa lý'].map(s => (
                <button key={s} onClick={() => setSubject(s)} className={`p-4 rounded-2xl text-xs font-bold border transition-all ${subject === s ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.1)]' : 'bg-slate-800/50 border-white/5 text-slate-500 hover:bg-white/5'}`}>{s}</button>
              ))}
            </div>
          </div>

          <button onClick={startMission} disabled={loading} className="w-full py-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-3xl font-black shadow-[0_0_30px_rgba(99,102,241,0.4)] border border-white/20 flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95 transition-all text-lg">
            {loading ? <Loader2 className="animate-spin" /> : <Rocket size={24}/>}
            {loading ? 'ĐANG TẠO...' : 'KÍCH HOẠT LỘ TRÌNH'}
          </button>
        </div>
      </div>
    );
  }

  // --- ROADMAP VIEW ---
  const mission = userData.currentMission;
  return (
    <div className="content-container animate-in space-y-8 px-4 py-2 pb-40">
       <div className="bg-gradient-to-br from-indigo-700 via-indigo-600 to-purple-800 p-8 rounded-[3rem] text-white shadow-[0_0_30px_rgba(99,102,241,0.3)] relative overflow-hidden group border border-white/20">
          <div className="relative z-10">
             <div className="flex gap-2 mb-4">
                <span className="bg-white/10 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10 backdrop-blur-md shadow-inner">LỚP {mission.grade}</span>
                <span className="bg-white/10 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10 backdrop-blur-md shadow-inner">{mission.subject}</span>
             </div>
             <h3 className="text-3xl font-black tracking-tight leading-none mb-2">Chiến Dịch 2025</h3>
             <p className="text-indigo-100 text-[11px] font-bold uppercase tracking-[0.2em] opacity-80">Mở khóa toàn bộ chương mục</p>
          </div>
          <Zap size={100} className="absolute right-[-20px] bottom-[-20px] text-white/10 group-hover:scale-125 transition-transform duration-700" />
       </div>

       <div className="space-y-4 relative">
          <div className="absolute left-12 top-0 bottom-0 w-1 bg-slate-800/50 rounded-full -z-10" />
          
          <div className="flex items-center justify-between px-2">
             <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Chiến dịch của bạn</h4>
             <span className="text-[10px] font-black text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20 flex items-center gap-2"><Timer size={12}/> Đề {questionCount} câu</span>
          </div>

          <div className="space-y-6">
            {mission.roadmap.map((node, i) => {
               const isLoadingThis = loadingNodeId === node.id;
               const isCompleted = node.status === 'completed';
               
               return (
                  <motion.button 
                    key={node.id} 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    disabled={loadingNodeId !== null}
                    onClick={() => loadExam(node.id, node.difficulty)}
                    className={`w-full text-left glass-card p-6 rounded-[2.5rem] flex items-center gap-6 border transition-all relative overflow-hidden hover:border-indigo-500/50 hover:bg-white/5 shadow-xl group ${isCompleted ? 'border-emerald-500/30' : 'border-white/10'}`}
                  >
                     <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-black shrink-0 shadow-lg transition-all ${isCompleted ? 'bg-emerald-500 border-emerald-400' : 'bg-indigo-600 border-indigo-400'} border group-hover:scale-110`}>
                        {isLoadingThis ? <Loader2 className="animate-spin" size={20}/> : (isCompleted ? <CheckCircle size={20} /> : i + 1)}
                     </div>
                     <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                           <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${
                             node.difficulty === 'theory' ? 'bg-blue-500' : node.difficulty === 'practice' ? 'bg-indigo-500' : 'bg-rose-500'
                           } text-white`}>
                              {node.difficulty === 'theory' ? 'CƠ BẢN' : node.difficulty === 'practice' ? 'LUYỆN TẬP' : 'VẬN DỤNG'}
                           </span>
                           {node.mastery > 0 && (
                             <span className="text-[8px] font-black text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                               MASTERY: {node.mastery}%
                             </span>
                           )}
                        </div>
                        <h5 className="font-black text-base truncate tracking-tight text-slate-200">{node.title}</h5>
                     </div>
                     {!isLoadingThis && <ChevronRight size={20} className="text-indigo-400 group-hover:translate-x-1 transition-transform" />}
                  </motion.button>
               );
            })}
          </div>
       </div>

       <div className="p-8 glass-card rounded-[3rem] border border-white/10 text-center space-y-4 shadow-xl">
          <Info size={32} className="mx-auto text-slate-600" />
          <p className="text-sm font-bold text-slate-400 italic leading-relaxed px-4">
            "Fen có thể chọn bất kỳ chương nào để ôn luyện. EXP được tính theo số câu đúng thực tế."
          </p>
          <button onClick={() => onUpdate({ ...userData, currentMission: undefined })} className="text-indigo-400 font-black text-[10px] uppercase tracking-[0.3em] pt-4 hover:text-indigo-300 transition-colors">
             ĐỔI MÔN HỌC / CẤU HÌNH ĐỀ
          </button>
       </div>

       <AnimatePresence>
         {errorToast && (
           <motion.div
             initial={{ opacity: 0, scale: 0.9, y: -20 }}
             animate={{ opacity: 1, scale: 1, y: 0 }}
             exit={{ opacity: 0, scale: 0.9, y: -10 }}
             className="absolute top-24 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4"
           >
             <div className="bg-rose-500/90 text-white p-4 rounded-3xl shadow-[0_0_35px_rgba(244,63,94,0.4)] backdrop-blur-md border border-white/20 flex items-center gap-3">
               <XCircle size={20} className="shrink-0 text-white" />
               <p className="text-xs font-black tracking-tight">{errorToast}</p>
             </div>
           </motion.div>
         )}
       </AnimatePresence>
    </div>
  );
};

export default MissionControl;
