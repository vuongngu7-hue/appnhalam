
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Clock, Play, Pause, RotateCcw, Music, Youtube, Search, Zap, 
  Sparkles, Heart, X, Flame, Award, ChevronRight, Wind, CloudRain, 
  Coffee, Volume2, VolumeX, SkipForward, BarChart, Headphones
} from 'lucide-react';

const PET_STAGES = [
  { icon: '🥚', label: 'Incubating', color: 'text-slate-400', glow: 'shadow-slate-200' },
  { icon: '🐣', label: 'Novice', color: 'text-yellow-400', glow: 'shadow-yellow-200' },
  { icon: '🦅', label: 'Scholar', color: 'text-indigo-500', glow: 'shadow-indigo-300' },
  { icon: '🐉', label: 'Dragon', color: 'text-purple-500', glow: 'shadow-purple-400' }
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
          <div className="flex items-center gap-3 bg-slate-800/50 px-4 py-2 rounded-2xl border border-white/5">
            <BarChart size={16} className="text-indigo-400" />
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Total Focused</span>
              <span className="text-xs font-black text-white">{formatDuration(totalFocusTime)}</span>
            </div>
          </div>
          <button 
            onClick={() => setIsDeepFocus(true)}
            className="flex items-center gap-2 bg-indigo-500/10 text-indigo-400 px-4 py-2 rounded-2xl border border-indigo-500/20 hover:bg-indigo-500/20 transition-all font-black text-[10px] uppercase tracking-widest"
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
         <div className={`absolute inset-0 rounded-full border-[20px] border-slate-800/50 transition-all duration-1000 ${isActive ? 'scale-105 shadow-[0_0_60px_rgba(99,102,241,0.3)]' : 'scale-100'}`}></div>
         
         {/* Progress Ring SVG */}
         <svg className="absolute inset-0 w-full h-full -rotate-90 p-4 drop-shadow-xl">
            <circle cx="50%" cy="50%" r="42%" stroke="currentColor" strokeWidth="20" fill="transparent" className="text-slate-800" />
            <circle 
              cx="50%" cy="50%" r="42%" stroke="currentColor" strokeWidth="20" fill="transparent" 
              strokeDasharray="264%" strokeDashoffset={`${264 - (progress / 100) * 264}%`} 
              strokeLinecap="round"
              className={`transition-all duration-1000 ease-linear ${mode === 'study' ? 'text-indigo-500 drop-shadow-[0_0_10px_rgba(99,102,241,0.8)]' : 'text-green-500 drop-shadow-[0_0_10px_rgba(74,222,128,0.8)]'}`}
            />
         </svg>

         {/* Center Content */}
         <div className="absolute inset-8 rounded-full bg-slate-900/80 backdrop-blur-md border border-white/10 flex flex-col items-center justify-center shadow-inner z-10">
            {/* Visualizer */}
            <div className="flex items-center gap-1 h-8 mb-4">
              {bars.map((_, i) => (
                <div 
                  key={i} 
                  className={`w-1 bg-slate-700 rounded-full transition-all duration-300 ${isActive ? (mode === 'study' ? 'bg-indigo-400 animate-music-bar shadow-[0_0_5px_rgba(99,102,241,0.8)]' : 'bg-green-400 animate-music-bar shadow-[0_0_5px_rgba(74,222,128,0.8)]') : ''}`}
                  style={{ animationDelay: `${i * 0.05}s` }}
                ></div>
              ))}
            </div>

            <div className="text-7xl font-black text-white tracking-tighter tabular-nums mb-2 neon-text">
               {formatTime(seconds)}
            </div>
            
            <div className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.3em] border ${mode === 'study' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' : 'bg-green-500/20 text-green-300 border-green-500/30'}`}>
               {mode === 'study' ? 'Focus Mode' : 'Chill Mode'}
            </div>

            <div className="mt-6 text-4xl animate-bounce drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
               {PET_STAGES[petStage].icon}
            </div>
         </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-6 mt-12 z-20">
         <button onClick={() => { setIsActive(false); setSeconds(mode === 'study' ? 25*60 : 5*60); }} className="w-16 h-16 rounded-[2rem] bg-slate-800/50 border border-white/10 text-slate-400 flex items-center justify-center hover:bg-white/10 hover:text-white transition-colors shadow-inner">
            <RotateCcw size={24} />
         </button>

         <button 
           onClick={() => setIsActive(!isActive)} 
           className={`w-24 h-24 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl transition-all hover:scale-105 active:scale-95 ${isActive ? 'bg-slate-800 border border-white/20' : (mode === 'study' ? 'bg-indigo-600 shadow-[0_0_30px_rgba(99,102,241,0.5)]' : 'bg-green-500 shadow-[0_0_30px_rgba(74,222,128,0.5)]')}`}
         >
            {isActive ? <Pause size={36} fill="currentColor" /> : <Play size={36} fill="currentColor" className="ml-1" />}
         </button>

         <button onClick={() => setShowMusic(!showMusic)} className={`w-16 h-16 rounded-[2rem] flex items-center justify-center transition-colors border shadow-inner ${showMusic ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' : 'bg-slate-800/50 text-slate-400 border-white/10 hover:bg-white/10 hover:text-white'}`}>
            <Headphones size={24} />
         </button>
      </div>

      {/* Ambient Menu */}
      {showMusic && (
         <div className="absolute bottom-32 glass-card p-6 rounded-[3rem] shadow-2xl w-full border border-white/10 animate-slide-up grid grid-cols-4 gap-4">
            {AMBIENT_SOUNDS.map(s => (
               <button 
                 key={s.id} 
                 onClick={() => toggleAmbient(s)}
                 className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all ${activeAmbient === s.id ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'hover:bg-white/10 text-slate-400 hover:text-white'}`}
               >
                  <s.icon size={20} />
                  <span className="text-[9px] font-bold uppercase">{s.id}</span>
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
