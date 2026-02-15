
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Rocket, ChevronRight, CheckCircle, Loader2, 
  ArrowLeft, GraduationCap, Zap, Info, HelpCircle,
  XCircle, Award, ListOrdered, BarChart, Timer
} from 'lucide-react';
import { UserProfile, StudyMission, Grade, ExamDifficulty } from '../types';
import { generateExamRoadmap, generateExamPaper } from '../services/geminiService';

const MissionControl: React.FC<{ userData: UserProfile; onUpdate: (u: UserProfile) => void }> = ({ userData, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [loadingNodeId, setLoadingNodeId] = useState<string | null>(null);
  const [grade, setGrade] = useState<Grade>(userData.currentMission?.grade || '12');
  const [subject, setSubject] = useState(userData.currentMission?.subject || 'Toán học');
  const [questionCount, setQuestionCount] = useState<number>(20);
  const [activeExam, setActiveExam] = useState<any[] | null>(null);
  
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({}); // Store index of selected option
  const [isReviewed, setIsReviewed] = useState(false);

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
          status: 'current'
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
    try {
      const exam = await generateExamPaper(subject, grade, difficulty, questionCount);
      if (exam && exam.length > 0) {
        setActiveExam(exam);
      } else {
        alert("AI đang bận, fen thử lại sau vài giây nhé!");
      }
    } catch (e) {
      console.error(e);
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
      exp: correct * 30 
    };
  }, [activeExam, userAnswers]);

  const finishExam = () => {
    if (!isReviewed) {
      setIsReviewed(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    onUpdate({
      ...userData,
      exp: userData.exp + scoreInfo.exp,
      completedQuizzes: userData.completedQuizzes + 1
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
      <div className="content-container animate-in space-y-4 px-4 pb-40">
        <div className="bg-white/95 backdrop-blur-md p-4 sticky top-0 z-30 -mx-4 mb-4 border-b border-slate-100 flex items-center justify-between shadow-sm">
          <button onClick={() => setActiveExam(null)} className="flex items-center gap-2 text-slate-500 font-bold text-sm">
            <ArrowLeft size={16} /> THOÁT
          </button>
          <div className="flex gap-2">
            <div className="bg-slate-100 px-3 py-1.5 rounded-full text-[10px] font-black text-slate-500 uppercase">
              {Object.keys(userAnswers).length}/{activeExam.length} CÂU
            </div>
            {isReviewed && (
              <div className="bg-indigo-600 text-white px-3 py-1.5 rounded-full text-[10px] font-black uppercase">
                ĐÚNG {scoreInfo.correct}/{scoreInfo.total}
              </div>
            )}
          </div>
        </div>

        {isReviewed && (
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-8 rounded-[2.5rem] text-white shadow-xl animate-slide-up mb-8">
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
            <div className="bg-white/20 p-4 rounded-2xl flex items-center justify-between border border-white/10">
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
              <div key={i} className={`bg-white rounded-[2.5rem] p-8 border-2 shadow-sm transition-all ${
                isReviewed ? (isCorrect ? 'border-green-200' : 'border-rose-100') : 'border-slate-50'
              }`}>
                <div className="flex items-start gap-4 mb-6">
                  <span className={`shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm ${
                    isReviewed ? (isCorrect ? 'bg-green-500 text-white' : 'bg-rose-500 text-white') : 'bg-slate-900 text-white'
                  }`}>
                    {i+1}
                  </span>
                  <p className="font-bold text-slate-800 leading-snug text-lg pt-1">{q.question}</p>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {q.options.map((opt: string, idx: number) => {
                    const optionChar = String.fromCharCode(65 + idx);
                    const isSelected = userIdx === idx;
                    const isRightAnswer = checkAnswer(idx, q); // Re-use logic for identifying correct one
                    
                    let btnStyle = "bg-slate-50 border-transparent text-slate-600";
                    if (isReviewed) {
                       if (isRightAnswer) btnStyle = "bg-green-500 border-green-500 text-white shadow-lg";
                       else if (isSelected && !isRightAnswer) btnStyle = "bg-rose-500 border-rose-500 text-white";
                       else btnStyle = "bg-slate-50 border-transparent text-slate-300 opacity-60";
                    } else if (isSelected) {
                       btnStyle = "bg-indigo-50 border-indigo-600 text-indigo-700 scale-[1.02] shadow-md";
                    }

                    return (
                      <button 
                        key={idx} 
                        disabled={isReviewed}
                        onClick={() => handleSelect(i, idx)}
                        className={`group p-5 text-left text-sm rounded-2xl border-2 transition-all flex items-center gap-4 ${btnStyle}`}
                      >
                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                          isReviewed ? 'bg-white/20' : (isSelected ? 'bg-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-400')
                        }`}>
                          {optionChar}
                        </span>
                        <span className="flex-1 font-semibold">{opt}</span>
                      </button>
                    );
                  })}
                </div>

                {isReviewed && (
                  <div className={`mt-6 p-6 rounded-3xl border ${isCorrect ? 'bg-green-50 border-green-100' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="flex items-center gap-2 mb-2">
                       <HelpCircle size={16} className="text-indigo-600" />
                       <span className="text-[10px] font-black uppercase tracking-widest text-indigo-700">Giải thích AI</span>
                    </div>
                    <p className="text-sm font-bold text-slate-600 leading-relaxed italic">
                      {q.explanation || "Đang cập nhật..."}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        <div className="mt-12">
           <button 
             onClick={finishExam} 
             disabled={!isReviewed && Object.keys(userAnswers).length < activeExam.length}
             className={`w-full py-6 rounded-3xl font-black shadow-2xl transition-all text-lg flex items-center justify-center gap-3 ${
               isReviewed ? 'bg-slate-900 text-white' : 'bg-indigo-600 text-white disabled:opacity-50'
             }`}
           >
              {isReviewed ? <ArrowLeft size={24}/> : <Rocket size={24}/>}
              {isReviewed ? 'XONG' : 'NỘP BÀI'}
           </button>
        </div>
      </div>
    );
  }

  // --- CONFIGURATION VIEW ---
  if (!userData.currentMission) {
    return (
      <div className="content-container animate-in space-y-8 px-4 py-6">
        <div className="text-center space-y-2">
          <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white mx-auto shadow-2xl mb-6">
             <GraduationCap size={40} />
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Cấu hình Ôn thi</h2>
          <p className="text-slate-500 text-sm font-bold opacity-70 italic">SGK mới 2018 - Chuẩn Sở GD</p>
        </div>

        <div className="space-y-6">
          <div className="flex gap-2 p-1.5 bg-slate-100 rounded-[2rem]">
            {['10', '11', '12'].map(g => (
              <button key={g} onClick={() => setGrade(g as Grade)} className={`flex-1 py-4 rounded-[1.5rem] font-black text-xs transition-all ${grade === g ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>LỚP {g}</button>
            ))}
          </div>

          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center gap-2 mb-2">
               <ListOrdered size={16} className="text-indigo-600"/>
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quy mô đề</label>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[20, 30, 40, 50].map(c => (
                <button key={c} onClick={() => setQuestionCount(c)} className={`py-3 rounded-xl text-xs font-black transition-all border-2 ${questionCount === c ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-slate-50 border-transparent text-slate-500'}`}>{c} CÂU</button>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
               <BarChart size={16} className="text-indigo-600"/>
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Môn học</label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {['Toán học', 'Ngữ văn', 'Tiếng Anh', 'Vật lý', 'Hóa học', 'Sinh học', 'Lịch sử', 'Địa lý'].map(s => (
                <button key={s} onClick={() => setSubject(s)} className={`p-4 rounded-2xl text-xs font-bold border-2 transition-all ${subject === s ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-slate-50 border-transparent text-slate-500'}`}>{s}</button>
              ))}
            </div>
          </div>

          <button onClick={startMission} disabled={loading} className="w-full py-6 bg-slate-900 text-white rounded-3xl font-black shadow-2xl flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95 transition-all text-lg">
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
       <div className="bg-gradient-to-br from-indigo-700 via-indigo-600 to-purple-800 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
          <div className="relative z-10">
             <div className="flex gap-2 mb-4">
                <span className="bg-white/20 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10 backdrop-blur-md">LỚP {mission.grade}</span>
                <span className="bg-white/20 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10 backdrop-blur-md">{mission.subject}</span>
             </div>
             <h3 className="text-3xl font-black tracking-tight leading-none mb-2">Chiến Dịch 2025</h3>
             <p className="text-indigo-100 text-[11px] font-bold uppercase tracking-[0.2em] opacity-80">Mở khóa toàn bộ chương mục</p>
          </div>
          <Zap size={100} className="absolute right-[-20px] bottom-[-20px] text-white/10 group-hover:scale-125 transition-transform duration-700" />
       </div>

       <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Danh sách chương</h4>
             <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 flex items-center gap-2"><Timer size={12}/> Đề {questionCount} câu</span>
          </div>
          {mission.roadmap.map((node, i) => {
             const isLoadingThis = loadingNodeId === node.id;
             return (
                <button 
                  key={node.id} 
                  disabled={loadingNodeId !== null}
                  onClick={() => loadExam(node.id, node.difficulty)}
                  className={`w-full text-left clean-card p-6 rounded-[2.5rem] flex items-center gap-6 border-2 transition-all relative overflow-hidden hover:border-indigo-300 hover:bg-indigo-50/10 shadow-lg group`}
                >
                   <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-black shrink-0 shadow-lg transition-all bg-indigo-600 group-hover:scale-110`}>
                      {isLoadingThis ? <Loader2 className="animate-spin" size={20}/> : i + 1}
                   </div>
                   <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                         <span className="text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest bg-slate-900 text-white">
                            {node.difficulty === 'theory' ? 'CƠ BẢN' : node.difficulty === 'practice' ? 'LUYỆN TẬP' : 'VẬN DỤNG'}
                         </span>
                      </div>
                      <h5 className="font-black text-base truncate tracking-tight text-slate-800">{node.title}</h5>
                   </div>
                   {!isLoadingThis && <ChevronRight size={20} className="text-indigo-400 group-hover:translate-x-1 transition-transform" />}
                </button>
             );
          })}
       </div>

       <div className="p-8 bg-slate-50 rounded-[3rem] border border-slate-100 text-center space-y-4">
          <Info size={32} className="mx-auto text-slate-300" />
          <p className="text-sm font-bold text-slate-500 italic leading-relaxed px-4">
            "Fen có thể chọn bất kỳ chương nào để ôn luyện. EXP được tính theo số câu đúng thực tế."
          </p>
          <button onClick={() => onUpdate({...userData, currentMission: undefined})} className="text-indigo-600 font-black text-[10px] uppercase tracking-[0.3em] pt-4">
             ĐỔI MÔN HỌC / CẤU HÌNH ĐỀ
          </button>
       </div>
    </div>
  );
};

export default MissionControl;
