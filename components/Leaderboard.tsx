
import React, { useState, useEffect } from 'react';
import { 
  Crown, Medal, Flame, Zap, Trophy, Globe, ShieldCheck, Star, Ghost, Share2
} from 'lucide-react';
import { getChampionTip } from '../services/geminiService';
import { UserProfile } from '../types';

interface LeaderboardProps {
  currentUid: string;
  userData: UserProfile;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ currentUid, userData }) => {
  const [championQuote, setChampionQuote] = useState("Vị thế này chỉ dành cho những người không bao giờ bỏ cuộc! 🌌");
  const [students, setStudents] = useState<any[]>([]);

  useEffect(() => {
    // Optimized: Run heavy processing in useEffect
    const savedPosts = localStorage.getItem('studygram_posts');
    const posts = savedPosts ? JSON.parse(savedPosts) : [];
    
    const uniqueUsersMap = new Map();
    uniqueUsersMap.set(userData.uid, {
      uid: userData.uid,
      name: userData.name,
      avatar: userData.avatar,
      exp: userData.exp,
      streak: userData.streak,
      isVerified: userData.isVerified,
      isStudentOfWeek: userData.exp > 500
    });

    posts.forEach((p: any) => {
      if (!uniqueUsersMap.has(p.uid)) {
        uniqueUsersMap.set(p.uid, {
          uid: p.uid,
          name: p.userName,
          avatar: p.avatar,
          exp: Math.floor(Math.random() * 200) + 50,
          streak: 1,
          isVerified: false,
          isStudentOfWeek: false
        });
      }
    });

    const sortedStudents = Array.from(uniqueUsersMap.values())
      .sort((a, b) => b.exp - a.exp)
      .map((s, idx) => ({ ...s, rank: idx + 1 }));

    setStudents(sortedStudents);
  }, [userData]);

  useEffect(() => {
    const fetchTip = async () => {
      if (students.length > 0 && students[0].uid === userData.uid) {
        try {
          const tip = await getChampionTip(userData.name);
          setChampionQuote(tip);
        } catch (e) {}
      }
    };
    fetchTip();
  }, [students, userData.name]);

  const studentOfWeek = students.find(s => s.isStudentOfWeek) || students[0];

  return (
    <div className="space-y-8 animate-slide-up pb-32 max-w-2xl mx-auto w-full">
      {/* Pantheon Header */}
      <div className="text-center space-y-4">
         <div className="inline-flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-full text-[10px] font-black uppercase tracking-[0.4em] shadow-[0_0_15px_rgba(99,102,241,0.5)] border border-white/20">
            <Globe size={12} className="animate-spin-slow" /> StudyGram V7
         </div>
         <h2 className="text-4xl font-black text-white tracking-tighter leading-none neon-text">BẢNG PHONG THẦN</h2>
      </div>

      {/* Champion Spotlight - Optimized for GPU */}
      {studentOfWeek && (
        <div className="relative p-10 rounded-[4rem] shadow-2xl bg-slate-900/50 text-white overflow-hidden group transform-gpu border border-white/10">
            {/* Simple gradient background instead of complex blurs */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/50 to-purple-900/50 opacity-50"></div>
            
            <div className="relative z-10 flex flex-col items-center text-center">
                <div className="mb-6 bg-amber-500/20 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2 border border-amber-500/30 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                    <Crown size={14} fill="currentColor" className="animate-bounce"/> CHAMPION
                </div>
                
                <div className="relative mb-6">
                    <img src={studentOfWeek.avatar} className="relative w-32 h-32 rounded-[2.5rem] border-4 border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.4)]" />
                    <div className="absolute -bottom-3 -right-3 bg-slate-800 text-amber-400 p-2 rounded-xl shadow-lg border-2 border-amber-400">
                        <ShieldCheck size={20} fill="currentColor"/>
                    </div>
                </div>

                <h3 className="text-3xl font-black tracking-tighter mb-3 text-amber-200 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]">{studentOfWeek.name}</h3>
                
                <div className="bg-white/5 backdrop-blur-md p-6 rounded-[2.5rem] border border-white/10 mb-6 max-w-sm shadow-inner">
                   <p className="text-indigo-100 font-medium italic text-sm leading-relaxed">"{championQuote}"</p>
                </div>

                <div className="flex gap-4">
                    <div className="bg-indigo-600/20 px-6 py-2 rounded-2xl text-xs font-black border border-indigo-500/30 text-indigo-300 shadow-inner">{studentOfWeek.exp.toLocaleString()} XP</div>
                    <div className="bg-orange-600/20 px-6 py-2 rounded-2xl text-xs font-black border border-orange-500/30 text-orange-400 shadow-inner">🔥 {studentOfWeek.streak}</div>
                </div>
            </div>
        </div>
      )}

      {/* Ranking List - Solid Backgrounds for Performance */}
      <div className="glass-card rounded-[3.5rem] border border-white/10 shadow-xl overflow-hidden mb-12 transform-gpu">
        <div className="p-8 border-b border-white/5 flex items-center gap-3 bg-white/5">
           <Star size={18} className="text-indigo-400" fill="currentColor" />
           <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Top Scholars</span>
        </div>
        
        <div className="divide-y divide-white/5">
          {students.map((student, idx) => (
            <div 
              key={student.uid} 
              className={`flex items-center gap-5 p-6 md:p-8 transition-colors ${student.uid === currentUid ? 'bg-indigo-600/10' : 'hover:bg-white/5'}`}
            >
              <div className="w-8 flex justify-center items-center">
                {idx === 0 ? <Crown size={28} className="text-amber-400 drop-shadow-[0_0_5px_rgba(245,158,11,0.8)]" fill="currentColor" /> : 
                 idx === 1 ? <Medal size={28} className="text-slate-400" fill="currentColor" /> :
                 idx === 2 ? <Medal size={28} className="text-amber-700" fill="currentColor" /> :
                 <span className="font-black text-slate-600 text-base">#{idx + 1}</span>}
              </div>

              <div className="relative shrink-0">
                  <img src={student.avatar} className="w-14 h-14 rounded-[1.2rem] bg-slate-800 border border-white/10 shadow-sm" loading="lazy" />
              </div>

              <div className="flex-1 min-w-0">
                <h4 className={`font-black text-base truncate tracking-tight ${student.uid === currentUid ? 'text-indigo-400 neon-text' : 'text-slate-200'}`}>
                    {student.name} {student.uid === currentUid && '(Bạn)'}
                </h4>
                <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1 text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-800/50 px-2 py-0.5 rounded-full border border-white/5">
                       <Flame size={10} className="text-orange-500" /> {student.streak}
                    </div>
                    {student.exp > 1000 && (
                       <div className="flex items-center gap-1 text-[9px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                          <Zap size={10} fill="currentColor" /> PRO
                       </div>
                    )}
                </div>
              </div>

              <div className="text-right">
                  <div className="text-lg font-black text-white tracking-tighter neon-text">
                    {student.exp.toLocaleString()}
                    <span className="text-[9px] uppercase ml-1 opacity-40">XP</span>
                  </div>
              </div>
            </div>
          ))}
          
          {students.length === 0 && (
            <div className="p-16 text-center space-y-3">
               <Ghost size={48} className="mx-auto text-slate-700" />
               <p className="text-slate-600 font-black text-xs uppercase tracking-[0.2em]">Chưa có dữ liệu...</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <button className="py-5 glass-card border border-white/10 text-indigo-400 font-black text-[10px] uppercase tracking-[0.2em] rounded-[2rem] shadow-sm flex items-center justify-center gap-3 hover:bg-white/5 transition-all active:scale-95">
            <Share2 size={18}/> CHIA SẺ
        </button>
        <button className="py-5 bg-indigo-600 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-[2rem] shadow-[0_0_20px_rgba(99,102,241,0.3)] border border-white/20 flex items-center justify-center gap-3 hover:bg-indigo-500 transition-all active:scale-95">
            <Zap size={18} fill="currentColor"/> THÁCH ĐẤU
        </button>
      </div>
    </div>
  );
};

export default Leaderboard;
