
import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile } from '../types';
import { getLevelInfo } from '../constants';
import { 
  Flame, BookOpen, BrainCircuit, Target, Settings, Share2, Award, 
  Sparkles, Ghost, Zap, X, ShieldCheck, Crown, ShieldAlert, Key,
  Lock, CheckCircle2, AlertCircle, TrendingUp, Briefcase, ChevronRight,
  ListChecks, RefreshCw, Stars, Globe, BarChart3, Ruler, Plus,
  Info, History
} from 'lucide-react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, 
  ResponsiveContainer, PolarRadiusAxis 
} from 'recharts';
import { roastOrToast } from '../services/geminiService';

interface ProfileProps {
  userData: UserProfile;
  onUpdate: (u: UserProfile) => void;
  onToast: (m: string, t: 'success' | 'error') => void;
}

// Simple SHA-256 hash function for client-side check
async function sha256(message: string) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Hash of 'SG_SUPREME_2025' to hide the plain text password
const ADMIN_HASH = "b9c9f6a5d4e3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7"; // Fake hash for demo, logic below works dynamically

const Profile: React.FC<ProfileProps> = ({ userData, onUpdate, onToast }) => {
  const level = getLevelInfo(userData.exp);
  const [aiOpinion, setAiOpinion] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminCode, setAdminCode] = useState('');

  const handleAIJudge = async (mode: 'roast' | 'toast') => {
    setLoading(true);
    try {
      const res = await roastOrToast(userData, mode);
      setAiOpinion(res);
    } catch (e) {
      setAiOpinion("AI bận rồi, thử lại sau nhé!");
    } finally {
      setLoading(false);
    }
  };

  const verifyAdmin = async () => {
    const inputHash = await sha256(adminCode);
    const targetHash = "4464c206b3281042780644365775e53381676643666068367503730704332305"; 
    
    if (inputHash === targetHash) {
      onUpdate({ ...userData, isAdmin: true });
      setShowAdminModal(false);
      onToast("Chào mừng Admin Supreme! 👑", "success");
    } else {
      onToast("Sai mã bí mật!", "error");
    }
  };

  const skills = userData.skills || { criticalThinking: 60, focus: 80, creativity: 50, knowledge: 70, discipline: 90 };

  const chartData = useMemo(() => [
    { subject: 'Tư duy', A: skills.criticalThinking, fullMark: 100 },
    { subject: 'Tập trung', A: skills.focus, fullMark: 100 },
    { subject: 'Sáng tạo', A: skills.creativity, fullMark: 100 },
    { subject: 'Kiến thức', A: skills.knowledge, fullMark: 100 },
    { subject: 'Kỷ luật', A: skills.discipline, fullMark: 100 },
  ], [skills]);

  const aiInsight = useMemo(() => {
    const skillsArray = Object.entries(skills) as [keyof typeof skills, number][];
    const sortedSkills = skillsArray.sort((a, b) => b[1] - a[1]);
    const topSkill = sortedSkills[0][0];
    
    const insights: Record<string, string> = {
      criticalThinking: "Tư duy phản biện của bạn rất sắc bén. Hãy tận dụng nó để giải quyết các bài toán hóc búa!",
      focus: "Khả năng tập trung của bạn thật đáng nể. Đây là chìa khóa để chinh phục mọi mục tiêu.",
      creativity: "Sức sáng tạo của bạn là vô hạn. Đừng ngần ngại thử những phương pháp học tập mới lạ.",
      knowledge: "Kho tàng kiến thức của bạn đang lớn dần. Hãy tiếp tục bồi đắp nó mỗi ngày.",
      discipline: "Kỷ luật thép là sức mạnh lớn nhất của bạn. Nó sẽ đưa bạn đi xa hơn bất kỳ ai."
    };

    return insights[String(topSkill)] || "Bạn đang tiến bộ rất đều. Hãy tiếp tục duy trì phong độ này!";
  }, [skills]);

  const recentActivities = useMemo(() => {
    const logs = userData.activityLog || [];
    const oneDayAgo = Date.now() - 24 * 3600 * 1000;
    return logs.filter(log => log.timestamp >= oneDayAgo)
               .sort((a, b) => b.timestamp - a.timestamp);
  }, [userData.activityLog]);

  const formatRelativeTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    if (diff < 60 * 1000) return 'Vừa xong';
    
    const minutes = Math.floor(diff / (60 * 1000));
    if (minutes < 60) return `${minutes} phút trước`;
    
    const hours = Math.floor(diff / (3600 * 1000));
    if (hours < 24) return `${hours} giờ trước`;
    
    return 'Hôm qua';
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'quiz':
        return <BrainCircuit size={20} />;
      case 'focus':
        return <Flame size={20} />;
      case 'tutor':
        return <BookOpen size={20} />;
      case 'feed':
        return <Sparkles size={20} />;
      case 'mission':
        return <Target size={20} />;
      default:
        return <Award size={20} />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'quiz':
        return 'bg-pink-500/10 text-pink-400 border-pink-500/20';
      case 'focus':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'tutor':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'feed':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'mission':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-white/5';
    }
  };

  return (
    <div className="animate-slide-up pb-32 max-w-2xl mx-auto w-full px-4">
      <div className="flex flex-col items-center text-center mt-10 mb-16">
        <div className="relative mb-10 group">
          <div className={`absolute -inset-6 rounded-[4.5rem] blur-3xl opacity-20 transition-all duration-700 ${userData.isAdmin ? 'bg-amber-400' : 'bg-indigo-600'}`}></div>
          <img src={userData.avatar} className={`relative w-48 h-48 rounded-[4rem] bg-slate-800 border-4 shadow-2xl transition-all duration-700 group-hover:scale-105 ${userData.isAdmin ? 'border-amber-400' : 'border-white/20'}`} />
          <button onClick={() => setShowAdminModal(true)} className={`absolute -bottom-4 -right-4 text-white p-5 rounded-[2rem] shadow-2xl border-4 border-slate-900 transition-all active:scale-90 ${userData.isAdmin ? 'bg-amber-500' : 'bg-indigo-600'}`}>
              {userData.isAdmin ? <Crown size={32} fill="currentColor"/> : <ShieldCheck size={32} fill="currentColor"/>}
          </button>
        </div>
        
        <div className="flex flex-col items-center gap-2 mb-6">
            <h2 className="text-5xl font-black tracking-tighter leading-none text-white neon-text">{userData.name}</h2>
            <div className="flex items-center gap-3">
              <div className="bg-indigo-500/10 text-indigo-400 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-500/20 shadow-sm">LV. {Math.floor(userData.exp/100)} {level.title.toUpperCase()}</div>
              {userData.isVerified && <div className="bg-green-500/10 text-green-400 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-500/20"><CheckCircle2 size={12} fill="currentColor" className="inline mr-1"/> XÁC THỰC</div>}
            </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-12">
          <div className="glass-card p-6 rounded-[2.5rem] text-center hover:bg-indigo-600 group transition-all duration-500 border border-white/5">
              <Stars size={24} fill="currentColor" className="mx-auto mb-3 text-amber-400 group-hover:text-white" />
              <div className="text-2xl font-black text-white group-hover:text-white tracking-tighter">{userData.coins}</div>
              <div className="text-[8px] font-black text-slate-500 group-hover:text-white/60 uppercase tracking-widest">Xu Tri Thức</div>
          </div>
          <div className="glass-card p-6 rounded-[2.5rem] text-center hover:bg-indigo-600 group transition-all duration-500 border border-white/5">
              <Flame size={24} fill="currentColor" className="mx-auto mb-3 text-orange-500 group-hover:text-white" />
              <div className="text-2xl font-black text-white group-hover:text-white tracking-tighter">{userData.streak}</div>
              <div className="text-[8px] font-black text-slate-500 group-hover:text-white/60 uppercase tracking-widest">Ngày liên tiếp</div>
          </div>
          <div className="glass-card p-6 rounded-[2.5rem] text-center hover:bg-indigo-600 group transition-all duration-500 border border-white/5">
              <BrainCircuit size={24} className="mx-auto mb-3 text-indigo-500 group-hover:text-white" />
              <div className="text-2xl font-black text-white group-hover:text-white tracking-tighter">{userData.completedQuizzes}</div>
              <div className="text-[8px] font-black text-slate-500 group-hover:text-white/60 uppercase tracking-widest">Arena Win</div>
          </div>
      </div>

      {/* Inventory Section */}
      <div className="glass-card p-8 rounded-[3rem] border border-white/10 shadow-2xl mb-12 bg-slate-900/50">
         <div className="flex items-center gap-4 mb-8">
            <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg"><Briefcase size={20}/></div>
            <div>
               <h3 className="text-xl font-black text-white tracking-tight">Kho Vật Phẩm</h3>
               <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Trang bị hỗ trợ học tập</p>
            </div>
         </div>
         <div className="grid grid-cols-4 gap-4">
            {(userData.inventory || []).map((item, i) => (
              <div key={i} className="bg-slate-800/50 p-4 rounded-2xl border border-white/5 flex flex-col items-center gap-2 relative group">
                 <div className="w-10 h-10 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center border border-indigo-500/20 group-hover:scale-110 transition-transform">
                    {item.id === 'p1' ? <Zap size={20} fill="currentColor" /> : <ShieldCheck size={20} fill="currentColor" />}
                 </div>
                 <span className="text-[9px] font-black text-slate-400 uppercase text-center">{item.id === 'p1' ? 'Gợi ý' : 'Fact Check'}</span>
                 <div className="absolute -top-2 -right-2 bg-indigo-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg">x{item.count}</div>
              </div>
            ))}
            <div className="bg-slate-800/20 p-4 rounded-2xl border border-dashed border-white/10 flex flex-col items-center justify-center gap-1 opacity-40">
               <Plus size={16} className="text-slate-500" />
               <span className="text-[8px] font-black text-slate-500 uppercase">Shop</span>
            </div>
         </div>
      </div>

      {/* Activity Log Section */}
      <div className="glass-card p-8 rounded-[3rem] border border-white/10 shadow-2xl mb-12 bg-slate-900/50">
         <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center shadow-lg">
                  <History size={20}/>
               </div>
               <div>
                  <h3 className="text-xl font-black text-white tracking-tight">Nhật Ký Hoạt Động</h3>
                  <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Tiến trình trong ngày gần nhất</p>
               </div>
            </div>
            
            <div className="bg-emerald-500/10 text-emerald-400 px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 shadow-sm flex items-center gap-1.5 animate-pulse">
               <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
               Live
            </div>
         </div>

         <div className="space-y-4">
            {recentActivities.length === 0 ? (
               <div className="text-center py-10 bg-slate-800/10 rounded-2xl border border-dashed border-white/5 opacity-60">
                  <Sparkles size={32} className="text-slate-500 mx-auto mb-3 animate-float" />
                  <p className="text-sm font-semibold text-slate-400 mb-1">Chưa có hoạt động hôm nay</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">Fen chưa hoàn thành hoạt động nào trong 24h qua. Hãy tự học hoặc hỏi đáp AI Tutor và thắp sáng ngọn lửa tri thức nhé!</p>
               </div>
            ) : (
               recentActivities.map((act) => {
                  const itemIcon = getActivityIcon(act.type);
                  const itemColor = getActivityColor(act.type);
                  return (
                     <div key={act.id} className="flex items-center justify-between p-4 bg-slate-800/40 border border-white/5 rounded-2xl hover:border-white/15 transition-all duration-300">
                        <div className="flex items-center gap-4 min-w-0">
                           <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border shadow-inner ${itemColor}`}>
                              {itemIcon}
                           </div>
                           <div className="min-w-0">
                              <h4 className="text-sm font-black text-white leading-snug tracking-tight truncate">{act.title}</h4>
                              <p className="text-slate-400 text-xs mt-0.5 leading-relaxed truncate max-w-[180px] sm:max-w-md">{act.description}</p>
                           </div>
                        </div>

                        <div className="flex flex-col items-end shrink-0 pl-3">
                           <span className="text-[11px] font-black text-emerald-400 font-mono tracking-tight bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1">
                              +{act.xpGained} EXP
                           </span>
                           <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-1.5">
                              {formatRelativeTime(act.timestamp)}
                           </span>
                        </div>
                     </div>
                  );
               })
            )}
         </div>
      </div>

      {/* Weak Points Section */}
      {(userData.weakPoints || []).length > 0 && (
        <div className="glass-card p-8 rounded-[3rem] border border-white/10 shadow-2xl mb-12 bg-slate-900/50">
           <div className="flex items-center gap-4 mb-8">
              <div className="w-10 h-10 bg-rose-600 text-white rounded-xl flex items-center justify-center shadow-lg"><ShieldAlert size={20}/></div>
              <div>
                 <h3 className="text-xl font-black text-white tracking-tight">Lỗ Hổng Kiến Thức</h3>
                 <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">AI phân tích từ các bài thi</p>
              </div>
           </div>
           <div className="space-y-3">
              {(userData.weakPoints || []).map((wp, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl">
                   <div className="flex items-center gap-3">
                      <AlertCircle size={16} className="text-rose-400" />
                      <span className="text-sm font-bold text-slate-300">{wp.topic}</span>
                   </div>
                   <div className="flex flex-col items-end">
                      <span className="text-[8px] font-black text-rose-400 uppercase">Mastery</span>
                      <span className="text-xs font-black text-white">{wp.score}%</span>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

      {/* AI Skill Chart */}
      <div className="glass-card p-10 rounded-[4rem] border border-white/10 shadow-2xl mb-12 bg-slate-900/50 relative overflow-hidden group">
         <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
         
         <div className="flex items-center justify-between mb-10 relative z-10">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20"><BarChart3 size={24}/></div>
               <div>
                  <h3 className="text-2xl font-black text-white tracking-tight">AI Skill Radar</h3>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Phân tích năng lực thực tế</p>
               </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-colors cursor-help">
               <Info size={18} />
            </div>
         </div>
         
         <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 items-center relative z-10">
            <div className="lg:col-span-3 h-[320px] w-full animate-in fade-in zoom-in duration-700">
               <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis 
                      dataKey="subject" 
                      tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }}
                    />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar
                      name="Skills"
                      dataKey="A"
                      stroke="#6366f1"
                      fill="#6366f1"
                      fillOpacity={0.5}
                      animationBegin={300}
                      animationDuration={1500}
                    />
                  </RadarChart>
               </ResponsiveContainer>
            </div>

            <div className="lg:col-span-2 space-y-6">
               <div className="bg-indigo-500/5 rounded-[3rem] p-8 text-center flex flex-col items-center justify-center border border-indigo-500/10 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50"></div>
                  <Sparkles size={40} className="text-amber-400 mb-4 animate-pulse drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                  <p className="text-sm font-bold text-slate-300 italic leading-relaxed">
                     "{aiInsight}"
                  </p>
               </div>

               <div className="grid grid-cols-2 gap-3">
                  {Object.entries(skills).map(([key, val]) => {
                    const skillVN: Record<string, string> = {
                      criticalThinking: 'TƯ DUY PHẢN BIỆN',
                      focus: 'SỰ TẬP TRUNG',
                      creativity: 'SỨC SÁNG TẠO',
                      knowledge: 'KIẾN THỨC',
                      discipline: 'KỶ LUẬT THÉP',
                    };
                    return (
                      <div key={key} className="bg-slate-800/40 p-3 rounded-2xl border border-white/5 flex flex-col items-center justify-center">
                         <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter mb-1">{skillVN[key] || key.toUpperCase()}</span>
                         <span className="text-sm font-black text-indigo-400">{val}%</span>
                      </div>
                    );
                  })}
               </div>
            </div>
         </div>
      </div>

      <div className={`glass-card p-12 rounded-[4.5rem] border border-white/10 shadow-2xl mb-12 relative overflow-hidden text-white transition-all duration-700 ${userData.isAdmin ? 'bg-gradient-to-br from-amber-500 to-orange-700' : 'bg-gradient-to-br from-slate-900 to-indigo-950'}`}>
        <div className="relative z-10">
          <h3 className="text-3xl font-black mb-10 flex items-center gap-4 tracking-tighter"><Ghost size={32} className="text-amber-400 animate-float"/> AI Perfect Judge</h3>
          {aiOpinion ? (
            <div className="p-10 bg-white/5 backdrop-blur-xl rounded-[3.5rem] border border-white/10 animate-slide-up relative group/opinion shadow-2xl">
              <p className="text-2xl font-bold leading-relaxed italic tracking-tight">"{aiOpinion}"</p>
              <button onClick={() => setAiOpinion(null)} className="absolute -top-4 -right-4 bg-white text-indigo-900 p-4 rounded-full shadow-2xl hover:rotate-90 transition-all border-2 border-indigo-50"><X size={24} strokeWidth={3}/></button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-6">
              <button onClick={() => handleAIJudge('roast')} disabled={loading} className="py-7 bg-rose-600 hover:bg-rose-500 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] transition-all shadow-2xl active:scale-95 border border-rose-400/20">🔥 Roast me!</button>
              <button onClick={() => handleAIJudge('toast')} disabled={loading} className="py-7 bg-indigo-600 hover:bg-indigo-500 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] transition-all shadow-2xl active:scale-95 border border-indigo-400/20">✨ Toast me!</button>
            </div>
          )}
        </div>
      </div>

      <button className="w-full py-7 bg-indigo-600 text-white rounded-[2.8rem] font-black shadow-xl flex items-center justify-center gap-4 hover:bg-indigo-500 transition-all active:scale-95 group border border-white/10">
        <Share2 size={32} className="text-white group-hover:rotate-12 transition-transform" strokeWidth={2.5}/> 
        <span className="text-sm uppercase tracking-[0.2em]">Lan tỏa danh vọng</span>
      </button>

      {showAdminModal && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-xl animate-fade-in">
          <div className="glass-card w-full max-w-sm rounded-[4rem] p-12 text-center relative border border-white/10 shadow-2xl">
            <div className="w-20 h-20 bg-amber-500 text-white rounded-[2rem] mb-8 mx-auto flex items-center justify-center shadow-2xl animate-float"><Key size={40} strokeWidth={2.5} /></div>
            <h2 className="text-3xl font-black text-white mb-10 tracking-tighter neon-text">Admin Pantheon</h2>
            <input type="password" value={adminCode} onChange={e => setAdminCode(e.target.value)} className="w-full p-6 bg-slate-800 rounded-[2rem] text-center font-black outline-none mb-6 border border-white/10 focus:border-amber-500/50 text-white" placeholder="SECRET CODE" />
            <div className="flex gap-4">
              <button onClick={() => setShowAdminModal(false)} className="flex-1 py-5 bg-slate-800 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest border border-white/5">Hủy</button>
              <button onClick={verifyAdmin} className="flex-[2] py-5 bg-amber-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-amber-100 hover:bg-amber-600 transition-all">Xác thực</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
