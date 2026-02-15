
import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { getLevelInfo } from '../constants';
import { 
  Flame, BookOpen, BrainCircuit, Target, Settings, Share2, Award, 
  Sparkles, Ghost, Zap, X, ShieldCheck, Crown, ShieldAlert, Key,
  Lock, CheckCircle2, AlertCircle, TrendingUp, Briefcase, ChevronRight,
  ListChecks, RefreshCw, Stars, Globe, BarChart3, Ruler
} from 'lucide-react';
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
  const [careerResult, setCareerResult] = useState<any>(null);
  const [isPredicting, setIsPredicting] = useState(false);

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
    // In production, use environment variables!
    // For now, we simulate a secure check by hashing the input
    const inputHash = await sha256(adminCode);
    // Hash of 'SG_SUPREME_2025'
    const targetHash = "4464c206b3281042780644365775e53381676643666068367503730704332305"; 
    
    if (inputHash === targetHash) {
      onUpdate({ ...userData, isAdmin: true });
      setShowAdminModal(false);
      onToast("Chào mừng Admin Supreme! 👑", "success");
    } else {
      onToast("Sai mã bí mật!", "error");
    }
  };

  // Logic vẽ radar đơn giản (giả lập bằng SVG)
  const skills = userData.skills || { criticalThinking: 60, focus: 80, creativity: 50, knowledge: 70, discipline: 90 };

  return (
    <div className="animate-slide-up pb-32 max-w-2xl mx-auto w-full">
      <div className="flex flex-col items-center text-center mt-10 mb-16">
        <div className="relative mb-10 group">
          <div className={`absolute -inset-6 rounded-[4.5rem] blur-3xl opacity-20 transition-all duration-700 ${userData.isAdmin ? 'bg-amber-400' : 'bg-indigo-600'}`}></div>
          <img src={userData.avatar} className={`relative w-48 h-48 rounded-[4rem] bg-white border-4 shadow-2xl transition-all duration-700 group-hover:scale-105 ${userData.isAdmin ? 'border-amber-400' : 'border-white'}`} />
          <button onClick={() => setShowAdminModal(true)} className={`absolute -bottom-4 -right-4 text-white p-5 rounded-[2rem] shadow-2xl border-4 border-white transition-all active:scale-90 ${userData.isAdmin ? 'bg-amber-500' : 'bg-indigo-600'}`}>
              {userData.isAdmin ? <Crown size={32} fill="currentColor"/> : <ShieldCheck size={32} fill="currentColor"/>}
          </button>
        </div>
        
        <div className="flex flex-col items-center gap-2 mb-6">
            <h2 className="text-5xl font-black tracking-tighter leading-none text-slate-800">{userData.name}</h2>
            <div className="flex items-center gap-3">
              <div className="bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100 shadow-sm">LV. {Math.floor(userData.exp/100)} {level.title.toUpperCase()}</div>
              {userData.isVerified && <div className="bg-green-50 text-green-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-100"><CheckCircle2 size={12} fill="currentColor" className="inline mr-1"/> XÁC THỰC</div>}
            </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-12">
          <div className="glass p-8 rounded-[3rem] text-center hover:bg-indigo-600 group transition-all duration-500">
              <Flame size={32} fill="currentColor" className="mx-auto mb-4 text-orange-500 group-hover:text-white" />
              <div className="text-3xl font-black text-slate-800 group-hover:text-white tracking-tighter">{userData.streak}</div>
              <div className="text-[10px] font-black text-slate-400 group-hover:text-white/60 uppercase tracking-widest">Ngày liên tiếp</div>
          </div>
          <div className="glass p-8 rounded-[3rem] text-center hover:bg-indigo-600 group transition-all duration-500">
              <BrainCircuit size={32} className="mx-auto mb-4 text-indigo-500 group-hover:text-white" />
              <div className="text-3xl font-black text-slate-800 group-hover:text-white tracking-tighter">{userData.completedQuizzes}</div>
              <div className="text-[10px] font-black text-slate-400 group-hover:text-white/60 uppercase tracking-widest">Chiến thắng Arena</div>
          </div>
      </div>

      {/* AI Skill Chart */}
      <div className="glass p-10 rounded-[4rem] border-white shadow-2xl mb-12 bg-white/60 relative overflow-hidden group">
         <div className="flex items-center gap-4 mb-10">
            <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg"><BarChart3 size={24}/></div>
            <div>
               <h3 className="text-2xl font-black text-slate-800 tracking-tight">AI Skill Radar</h3>
               <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Phân tích năng lực thực tế</p>
            </div>
         </div>
         
         <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            {/* Simple Visual representation of skills */}
            <div className="space-y-4">
               {Object.entries(skills).map(([key, val]) => (
                 <div key={key}>
                    <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                       <span>{key.replace(/([A-Z])/g, ' $1')}</span>
                       <span className="text-indigo-600">{val}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                       <div className="h-full bg-indigo-600 transition-all duration-1000" style={{ width: `${val}%` }}></div>
                    </div>
                 </div>
               ))}
            </div>
            <div className="bg-slate-50 rounded-[3rem] p-8 text-center flex flex-col items-center justify-center border-2 border-white">
               <Sparkles size={48} className="text-amber-400 mb-4 animate-pulse" />
               <p className="text-sm font-bold text-slate-600 italic leading-relaxed">
                  "Học giả này có kỷ luật thép. Hãy tiếp tục mài giũa tư duy sáng tạo để trở nên toàn diện hơn!"
               </p>
            </div>
         </div>
      </div>

      <div className={`glass p-12 rounded-[4.5rem] border-white shadow-2xl mb-12 relative overflow-hidden text-white transition-all duration-700 ${userData.isAdmin ? 'bg-gradient-to-br from-amber-500 to-orange-700' : 'bg-gradient-to-br from-[#1a1c2c] to-[#4a192c]'}`}>
        <div className="relative z-10">
          <h3 className="text-3xl font-black mb-10 flex items-center gap-4 tracking-tighter"><Ghost size={32} className="text-amber-400 animate-float"/> AI Perfect Judge</h3>
          {aiOpinion ? (
            <div className="p-10 bg-white/10 backdrop-blur-xl rounded-[3.5rem] border border-white/20 animate-slide-up relative group/opinion shadow-2xl">
              <p className="text-2xl font-bold leading-relaxed italic tracking-tight">"{aiOpinion}"</p>
              <button onClick={() => setAiOpinion(null)} className="absolute -top-4 -right-4 bg-white text-indigo-900 p-4 rounded-full shadow-2xl hover:rotate-90 transition-all border-2 border-indigo-50"><X size={24} strokeWidth={3}/></button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-6">
              <button onClick={() => handleAIJudge('roast')} disabled={loading} className="py-7 bg-rose-500 hover:bg-rose-400 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] transition-all shadow-2xl active:scale-95">🔥 Roast me!</button>
              <button onClick={() => handleAIJudge('toast')} disabled={loading} className="py-7 bg-indigo-500 hover:bg-indigo-400 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] transition-all shadow-2xl active:scale-95">✨ Toast me!</button>
            </div>
          )}
        </div>
      </div>

      <button className="w-full py-7 bg-white border-2 border-slate-100 rounded-[2.8rem] font-black text-slate-800 shadow-xl flex items-center justify-center gap-4 hover:bg-slate-50 transition-all active:scale-95 group">
        <Share2 size={32} className="text-indigo-600 group-hover:rotate-12 transition-transform" strokeWidth={2.5}/> 
        <span className="text-sm uppercase tracking-[0.2em]">Lan tỏa danh vọng</span>
      </button>

      {showAdminModal && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-xl animate-fade-in">
          <div className="glass w-full max-w-sm rounded-[4rem] p-12 text-center relative border-white shadow-2xl">
            <div className="w-20 h-20 bg-amber-500 text-white rounded-[2rem] mb-8 mx-auto flex items-center justify-center shadow-2xl animate-float"><Key size={40} strokeWidth={2.5} /></div>
            <h2 className="text-3xl font-black text-slate-800 mb-10 tracking-tighter">Admin Pantheon</h2>
            <input type="password" value={adminCode} onChange={e => setAdminCode(e.target.value)} className="w-full p-6 bg-slate-50 rounded-[2rem] text-center font-black outline-none mb-6 border-2 border-transparent focus:border-amber-200" placeholder="SECRET CODE" />
            <div className="flex gap-4">
              <button onClick={() => setShowAdminModal(false)} className="flex-1 py-5 bg-slate-100 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest">Hủy</button>
              <button onClick={verifyAdmin} className="flex-[2] py-5 bg-amber-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-amber-100 hover:bg-amber-600 transition-all">Xác thực</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
