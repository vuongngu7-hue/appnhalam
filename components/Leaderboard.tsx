
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
         <div className="inline-flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-full text-[10px] font-black uppercase tracking-[0.4em] shadow-lg shadow-indigo-200">
            <Globe size={12} className="animate-spin-slow" /> StudyGram V7
         </div>
         <h2 className="text-4xl font-black text-slate-800 tracking-tighter leading-none">BẢNG PHONG THẦN</h2>
      </div>

      {/* Champion Spotlight - Optimized for GPU */}
      {studentOfWeek && (
        <div className="relative p-10 rounded-[4rem] shadow-2xl bg-[#1a1c2c] text-white overflow-hidden group transform-gpu">
            {/* Simple gradient background instead of complex blurs */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 to-slate-900 opacity-50"></div>
            
            <div className="relative z-10 flex flex-col items-center text-center">
                <div className="mb-6 bg-amber-500/20 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2 border border-amber-500/30 text-amber-400">
                    <Crown size={14} fill="currentColor" className="animate-bounce"/> CHAMPION
                </div>
                
                <div className="relative mb-6">
                    <img src={studentOfWeek.avatar} className="relative w-32 h-32 rounded-[2.5rem] border-4 border-amber-400 shadow-2xl" />
                    <div className="absolute -bottom-3 -right-3 bg-white text-indigo-900 p-2 rounded-xl shadow-lg border-2 border-amber-400">
                        <ShieldCheck size={20} fill="currentColor"/>
                    </div>
                </div>

                <h3 className="text-3xl font-black tracking-tighter mb-3 text-amber-200">{studentOfWeek.name}</h3>
                
                <div className="bg-white/10 p-6 rounded-[2.5rem] border border-white/5 mb-6 max-w-sm">
                   <p className="text-indigo-100 font-bold italic text-sm leading-relaxed">"{championQuote}"</p>
                </div>

                <div className="flex gap-4">
                    <div className="bg-white/10 px-6 py-2 rounded-2xl text-xs font-black border border-white/10">{studentOfWeek.exp.toLocaleString()} XP</div>
                    <div className="bg-white/10 px-6 py-2 rounded-2xl text-xs font-black border border-white/10">🔥 {studentOfWeek.streak}</div>
                </div>
            </div>
        </div>
      )}

      {/* Ranking List - Solid Backgrounds for Performance */}
      <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-xl overflow-hidden mb-12 transform-gpu">
        <div className="p-8 border-b border-slate-50 flex items-center gap-3">
           <Star size={18} className="text-indigo-600" fill="currentColor" />
           <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Top Scholars</span>
        </div>
        
        <div className="divide-y divide-slate-50">
          {students.map((student, idx) => (
            <div 
              key={student.uid} 
              className={`flex items-center gap-5 p-6 md:p-8 ${student.uid === currentUid ? 'bg-indigo-50/50' : 'bg-white'}`}
            >
              <div className="w-8 flex justify-center items-center">
                {idx === 0 ? <Crown size={28} className="text-amber-500" fill="currentColor" /> : 
                 idx === 1 ? <Medal size={28} className="text-slate-400" fill="currentColor" /> :
                 idx === 2 ? <Medal size={28} className="text-amber-700" fill="currentColor" /> :
                 <span className="font-black text-slate-300 text-base">#{idx + 1}</span>}
              </div>

              <div className="relative shrink-0">
                  <img src={student.avatar} className="w-14 h-14 rounded-[1.2rem] bg-white border border-slate-100 shadow-sm" loading="lazy" />
              </div>

              <div className="flex-1 min-w-0">
                <h4 className={`font-black text-base truncate tracking-tight ${student.uid === currentUid ? 'text-indigo-600' : 'text-slate-800'}`}>
                    {student.name} {student.uid === currentUid && '(Bạn)'}
                </h4>
                <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1 text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-full">
                       <Flame size={10} className="text-orange-500" /> {student.streak}
                    </div>
                    {student.exp > 1000 && (
                       <div className="flex items-center gap-1 text-[9px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-full">
                          <Zap size={10} fill="currentColor" /> PRO
                       </div>
                    )}
                </div>
              </div>

              <div className="text-right">
                  <div className="text-lg font-black text-slate-800 tracking-tighter">
                    {student.exp.toLocaleString()}
                    <span className="text-[9px] uppercase ml-1 opacity-40">XP</span>
                  </div>
              </div>
            </div>
          ))}
          
          {students.length === 0 && (
            <div className="p-16 text-center space-y-3">
               <Ghost size={48} className="mx-auto text-slate-200" />
               <p className="text-slate-300 font-black text-xs uppercase tracking-[0.2em]">Chưa có dữ liệu...</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <button className="py-5 bg-white border-2 border-slate-100 text-indigo-600 font-black text-[10px] uppercase tracking-[0.2em] rounded-[2rem] shadow-sm flex items-center justify-center gap-3 hover:bg-slate-50 transition-all active:scale-95">
            <Share2 size={18}/> CHIA SẺ
        </button>
        <button className="py-5 bg-indigo-600 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-[2rem] shadow-xl shadow-indigo-200 flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all active:scale-95">
            <Zap size={18} fill="currentColor"/> THÁCH ĐẤU
        </button>
      </div>
    </div>
  );
};

export default Leaderboard;
