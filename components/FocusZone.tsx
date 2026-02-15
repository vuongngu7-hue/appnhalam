
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
  { id: 'fire', name: 'Lửa Trại', icon: Flame, url: 'https://www.soundjay.com/nature/fire-1.mp3' }
];

const FocusZone: React.FC<{ onExp: (amount: number) => void; showToast: (m: string) => void }> = ({ onExp, showToast }) => {
  const [seconds, setSeconds] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'study' | 'break'>('study');
  const [petStage, setPetStage] = useState(0);
  const [showMusic, setShowMusic] = useState(false);
  const [activeAmbient, setActiveAmbient] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Smooth visualizer bars
  const bars = useMemo(() => Array.from({ length: 20 }), []);

  useEffect(() => {
    let interval: any = null;
    if (isActive && seconds > 0) {
      interval = setInterval(() => setSeconds(s => s - 1), 1000);
      
      // Evolve Pet Logic
      const elapsed = (mode === 'study' ? 25 * 60 : 5 * 60) - seconds;
      const stage = Math.min(Math.floor(elapsed / (25 * 60 / 4)), 3);
      if (mode === 'study') setPetStage(stage);

    } else if (seconds === 0) {
      setIsActive(false);
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

  const progress = ((mode === 'study' ? 25 * 60 : 5 * 60) - seconds) / (mode === 'study' ? 25 * 60 : 5 * 60) * 100;

  return (
    <div className="flex flex-col items-center py-6 max-w-lg mx-auto w-full animate-slide-up relative">
      <audio ref={audioRef} />

      {/* Main Timer Cylinder */}
      <div className="relative w-full aspect-square max-h-[400px] flex items-center justify-center">
         {/* Outer Glow Ring */}
         <div className={`absolute inset-0 rounded-full border-[20px] border-slate-50 transition-all duration-1000 ${isActive ? 'scale-105 shadow-[0_0_60px_rgba(99,102,241,0.3)]' : 'scale-100'}`}></div>
         
         {/* Progress Ring SVG */}
         <svg className="absolute inset-0 w-full h-full -rotate-90 p-4 drop-shadow-xl">
            <circle cx="50%" cy="50%" r="42%" stroke="currentColor" strokeWidth="20" fill="transparent" className="text-slate-100" />
            <circle 
              cx="50%" cy="50%" r="42%" stroke="currentColor" strokeWidth="20" fill="transparent" 
              strokeDasharray="264%" strokeDashoffset={`${264 - (progress / 100) * 264}%`} 
              strokeLinecap="round"
              className={`transition-all duration-1000 ease-linear ${mode === 'study' ? 'text-indigo-500' : 'text-green-500'}`}
            />
         </svg>

         {/* Center Content */}
         <div className="absolute inset-8 rounded-full bg-white flex flex-col items-center justify-center shadow-inner z-10">
            {/* Visualizer */}
            <div className="flex items-center gap-1 h-8 mb-4">
              {bars.map((_, i) => (
                <div 
                  key={i} 
                  className={`w-1 bg-slate-200 rounded-full transition-all duration-300 ${isActive ? (mode === 'study' ? 'bg-indigo-400 animate-music-bar' : 'bg-green-400 animate-music-bar') : ''}`}
                  style={{ animationDelay: `${i * 0.05}s` }}
                ></div>
              ))}
            </div>

            <div className="text-7xl font-black text-slate-800 tracking-tighter tabular-nums mb-2">
               {formatTime(seconds)}
            </div>
            
            <div className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.3em] ${mode === 'study' ? 'bg-indigo-50 text-indigo-600' : 'bg-green-50 text-green-600'}`}>
               {mode === 'study' ? 'Focus Mode' : 'Chill Mode'}
            </div>

            <div className="mt-6 text-4xl animate-bounce">
               {PET_STAGES[petStage].icon}
            </div>
         </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-6 mt-12 z-20">
         <button onClick={() => { setIsActive(false); setSeconds(mode === 'study' ? 25*60 : 5*60); }} className="w-16 h-16 rounded-[2rem] bg-slate-100 text-slate-400 flex items-center justify-center hover:bg-slate-200 transition-colors">
            <RotateCcw size={24} />
         </button>

         <button 
           onClick={() => setIsActive(!isActive)} 
           className={`w-24 h-24 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl transition-all hover:scale-105 active:scale-95 ${isActive ? 'bg-slate-800' : (mode === 'study' ? 'bg-indigo-600 shadow-indigo-300' : 'bg-green-500 shadow-green-300')}`}
         >
            {isActive ? <Pause size={36} fill="currentColor" /> : <Play size={36} fill="currentColor" className="ml-1" />}
         </button>

         <button onClick={() => setShowMusic(!showMusic)} className={`w-16 h-16 rounded-[2rem] flex items-center justify-center transition-colors ${showMusic ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>
            <Headphones size={24} />
         </button>
      </div>

      {/* Ambient Menu */}
      {showMusic && (
         <div className="absolute bottom-32 glass bg-white/90 p-6 rounded-[3rem] shadow-2xl w-full border border-white animate-slide-up grid grid-cols-4 gap-4">
            {AMBIENT_SOUNDS.map(s => (
               <button 
                 key={s.id} 
                 onClick={() => toggleAmbient(s)}
                 className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all ${activeAmbient === s.id ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-50 text-slate-400'}`}
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
