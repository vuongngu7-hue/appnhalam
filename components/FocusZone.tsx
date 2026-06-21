
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Clock, Play, Pause, RotateCcw, Music, Youtube, Search, Zap, 
  Sparkles, Heart, X, Flame, Award, ChevronRight, Wind, CloudRain, 
  Coffee, Volume2, VolumeX, SkipForward, BarChart, Headphones
} from 'lucide-react';

const PET_STAGES = [
  { icon: '🥚', label: 'Incubating', color: 'text-slate-400', glow: 'shadow-slate-200' },
  { icon: '🐣', label: 'Novice', color: 'text-yellow-400', glow: 'shadow-yellow-200' },
  { icon: '🦅', label: 'Scholar', color: 'text-teal-400', glow: 'shadow-teal-400' },
  { icon: '🐉', label: 'Dragon', color: 'text-emerald-400', glow: 'shadow-emerald-400' }
];

const AMBIENT_SOUNDS = [
  { id: 'rain', name: 'Mưa Rơi', icon: CloudRain, url: 'https://www.soundjay.com/nature/rain-01.mp3' },
  { id: 'wind', name: 'Gió Ngàn', icon: Wind, url: 'https://www.soundjay.com/nature/wind-01.mp3' },
  { id: 'cafe', name: 'Phố Thị', icon: Coffee, url: 'https://www.soundjay.com/misc/restaurant-ambience-1.mp3' },
  { id: 'fire', name: 'Lửa Trại', icon: Flame, url: 'https://www.soundjay.com/nature/fire-1.mp3' },
  { id: 'forest', name: 'Rừng Xanh', icon: Sparkles, url: 'https://www.soundjay.com/nature/forest-1.mp3' },
  { id: 'waves', name: 'Sóng Biển', icon: Wind, url: 'https://www.soundjay.com/nature/ocean-wave-1.mp3' }
];

const FocusZone: React.FC<{ onExp: (amount: number) => void; showToast: (m: string) => void }> = ({ onExp, showToast }) => {
  const [seconds, setSeconds] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'study' | 'break'>('study');
  const [petStage, setPetStage] = useState(0);
  const [showMusic, setShowMusic] = useState(false);
  const [activeAmbient, setActiveAmbient] = useState<string | null>(null);
  const [isDeepFocus, setIsDeepFocus] = useState(false);
  const [totalFocusTime, setTotalFocusTime] = useState(0);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Smooth visualizer bars
  const bars = useMemo(() => Array.from({ length: 20 }), []);

  useEffect(() => {
    let interval: any = null;
    if (isActive && seconds > 0) {
      interval = setInterval(() => {
        setSeconds(s => s - 1);
        if (mode === 'study') setTotalFocusTime(prev => prev + 1);
      }, 1000);
      
      // Evolve Pet Logic
      const elapsed = (mode === 'study' ? 25 * 60 : 5 * 60) - seconds;
      const stage = Math.min(Math.floor(elapsed / (25 * 60 / 4)), 3);
      if (mode === 'study') setPetStage(stage);

    } else if (seconds === 0) {
      setIsActive(false);
      setIsDeepFocus(false);
      if (mode === 'study') {
        onExp(150);
        showToast("🔥 Tuyệt đỉnh! Bạn đã hoàn thành phiên học!");
        setMode('break');
        setSeconds(5 * 60);
      } else {
        showToast("Hết giờ nghỉ! Chiến tiếp nào!");
        setMode('study');
        setSeconds(25 * 60);
      }
    }
    return () => clearInterval(interval);
  }, [isActive, seconds, mode, onExp, showToast]);

  const toggleAmbient = (sound: any) => {
    if (activeAmbient === sound.id) {
      audioRef.current?.pause();
      setActiveAmbient(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = sound.url;
        audioRef.current.loop = true;
        audioRef.current.play().catch(() => {});
        setActiveAmbient(sound.id);
      }
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  const formatDuration = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const progress = ((mode === 'study' ? 25 * 60 : 5 * 60) - seconds) / (mode === 'study' ? 25 * 60 : 5 * 60) * 100;

  return (
    <div className={`flex flex-col items-center py-6 max-w-lg mx-auto w-full animate-slide-up relative transition-all duration-700 ${isDeepFocus ? 'fixed inset-0 z-[100] bg-slate-950 justify-center' : ''}`}>
      <audio ref={audioRef} />

      {!isDeepFocus && (
        <div className="w-full flex justify-between items-center mb-8 px-4">
          <div className="flex items-center gap-3 bg-slate-900/40 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/5">
            <BarChart size={16} className="text-teal-400" />
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Total Focused</span>
              <span className="text-xs font-black text-white">{formatDuration(totalFocusTime)}</span>
            </div>
          </div>
          <button 
            onClick={() => setIsDeepFocus(true)}
            className="flex items-center gap-2 bg-teal-500/10 text-teal-400 px-4 py-2 rounded-2xl border border-teal-500/20 hover:bg-teal-500/20 transition-all font-black text-[10px] uppercase tracking-widest shadow-[0_0_15px_rgba(20,184,166,0.1)]"
          >
            <Zap size={14} fill="currentColor" /> Deep Focus
          </button>
        </div>
      )}

      {isDeepFocus && (
        <button 
          onClick={() => setIsDeepFocus(false)}
          className="absolute top-10 right-10 p-4 text-slate-500 hover:text-white transition-colors"
        >
          <X size={32} />
        </button>
      )}

      {/* Main Timer Cylinder */}
      <div className={`relative w-full aspect-square max-h-[400px] flex items-center justify-center transition-all duration-700 ${isDeepFocus ? 'scale-125' : ''}`}>
         {/* Outer Glow Ring */}
         <div className={`absolute inset-0 rounded-full border-[20px] border-slate-900/20 transition-all duration-1000 ${isActive ? 'scale-105 shadow-[0_0_70px_rgba(20,184,166,0.25)]' : 'scale-100'}`}></div>
         
         {/* Progress Ring SVG */}
         <svg className="absolute inset-0 w-full h-full -rotate-90 p-4 drop-shadow-2xl">
            <circle cx="50%" cy="50%" r="42%" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-950/40" />
            <circle 
              cx="50%" cy="50%" r="42%" stroke="currentColor" strokeWidth="12" fill="transparent" 
              strokeDasharray="264%" strokeDashoffset={`${264 - (progress / 100) * 264}%`} 
              strokeLinecap="round"
              className={`transition-all duration-1000 ease-linear ${mode === 'study' ? 'text-teal-400 drop-shadow-[0_0_12px_rgba(20,184,166,0.8)]' : 'text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.8)]'}`}
            />
         </svg>

         {/* Center Content */}
         <div className="absolute inset-10 rounded-full bg-slate-950/70 backdrop-blur-md border border-white/5 flex flex-col items-center justify-center shadow-inner z-10">
            <div className="text-8xl font-black text-white tracking-tighter tabular-nums mb-3 drop-shadow-[0_0_20px_rgba(255,255,255,0.25)]">
               {formatTime(seconds)}
            </div>
            
            <div className={`px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-[0.25em] border ${mode === 'study' ? 'bg-teal-500/10 text-teal-400 border-teal-500/30 shadow-[0_0_15px_rgba(20,184,166,0.15)]' : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'}`}>
               {mode === 'study' ? 'FOCUS MODE' : 'CHILL MODE'}
            </div>

            {/* Premium Pixel Speckled Egg Shape */}
            <div className="mt-5 text-white drop-shadow-[0_0_25px_rgba(255,255,255,0.9)] hover:scale-110 active:scale-95 transition-all cursor-pointer">
              <svg viewBox="0 0 100 130" className="w-10 h-12" fill="currentColor">
                <path d="M50 0 C22.4 0 0 58.2 0 88 C0 111.2 22.4 130 50 130 C77.6 130 100 111.2 100 88 C100 58.2 77.6 0 50 0 Z" fill="#ffffff" />
                {/* Discrete egg speckles for detail */}
                <circle cx="45" cy="75" r="3" fill="#e2e8f0" />
                <circle cx="58" cy="85" r="2.5" fill="#cbd5e1" />
                <circle cx="38" cy="95" r="3.5" fill="#cbd5e1" />
                <circle cx="62" cy="65" r="2" fill="#e2e8f0" />
              </svg>
            </div>
         </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-8 mt-12 z-20">
         <button onClick={() => { setIsActive(false); setSeconds(mode === 'study' ? 25*60 : 5*60); }} className="w-14 h-14 rounded-full bg-slate-950/50 border border-teal-500/20 text-slate-400 flex items-center justify-center hover:bg-slate-800 hover:text-white transition-all shadow-lg hover:border-teal-500/40">
            <RotateCcw size={20} />
         </button>

         <button 
           onClick={() => setIsActive(!isActive)} 
           className={`w-20 h-20 rounded-full flex items-center justify-center text-slate-950 shadow-2xl transition-all hover:scale-105 active:scale-95 ${isActive ? 'bg-slate-800 border border-teal-500/30 text-teal-400 shadow-[0_0_25px_rgba(20,184,166,0.2)]' : 'bg-teal-500 shadow-[0_0_35px_rgba(20,184,166,0.6)] hover:bg-teal-400 text-slate-950'}`}
         >
            {isActive ? <Pause size={30} fill="currentColor" /> : <Play size={30} fill="currentColor" className="ml-1" />}
         </button>

         <button onClick={() => setShowMusic(!showMusic)} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all border shadow-lg ${showMusic ? 'bg-teal-500/20 text-teal-400 border-teal-500/40' : 'bg-slate-950/50 text-slate-400 border-teal-500/20 hover:bg-slate-800 hover:text-white'}`}>
            <Headphones size={20} />
         </button>
      </div>

      {/* Ambient Menu */}
      {showMusic && (
         <div className="absolute bottom-36 left-4 right-4 glass-card p-5 rounded-[2.5rem] shadow-[0_15px_50px_rgba(0,0,0,0.8)] border border-white/10 animate-slide-up grid grid-cols-3 gap-3 z-40 shadow-[0_0_30px_rgba(20,184,166,0.15)]">
            {AMBIENT_SOUNDS.map(s => (
               <button 
                 key={s.id} 
                 onClick={() => toggleAmbient(s)}
                 className={`flex flex-col items-center gap-2 p-3.5 rounded-2xl transition-all ${
                   activeAmbient === s.id 
                     ? 'bg-teal-500 text-slate-950 font-black shadow-[0_0_15px_rgba(20,184,166,0.6)]' 
                     : 'bg-slate-900/45 hover:bg-slate-800 text-slate-400 hover:text-white border border-white/5'
                 }`}
               >
                  <s.icon size={18} className={activeAmbient === s.id ? "text-slate-950" : "text-teal-400/80"} />
                  <span className="text-[9px] font-bold uppercase tracking-wider">{s.name}</span>
               </button>
            ))}
         </div>
      )}

      <style>{`
        @keyframes music-bar { 0%, 100% { height: 4px; } 50% { height: 100%; } }
        .animate-music-bar { animation: music-bar 0.8s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default FocusZone;
