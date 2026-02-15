
import React, { useState, useMemo, useCallback, memo } from 'react';
import { 
  Wand2, BookOpen, ListChecks, CalendarDays, 
  ChevronRight, ArrowLeft, Loader2, Sparkles, 
  Copy, Check, LayoutGrid, RotateCw, Download, FileText,
  Smile, ImageIcon, Network, ChevronDown, GraduationCap, Map,
  CheckCircle2, AlertCircle, Search, Globe, Filter,
  Gem, Eye, Moon, BrainCircuit, PenTool, Layers, Undo2, ArrowRight,
  History, Command
} from 'lucide-react';
import { 
  summarizeText, generateFlashcards, downloadAsFile, 
  generateMindMap, getOfficialExamLinks, generateExamPaper, 
  getOracleReading, gradeEssay
} from '../services/geminiService';
import MarkdownText from './MarkdownText';

// --- STATIC CONFIG (Clean Code) ---
const TOOLS_CONFIG = [
  { 
    id: 'exam_bank', 
    name: 'Kho Đề Sở GD', 
    desc: 'Truy tìm đề thi chính thức', 
    icon: Globe, 
    fromColor: 'from-blue-500', 
    toColor: 'to-indigo-600',
    placeholder: 'Tìm kiếm đề thi (VD: Đề Toán 2024 Hà Nội)...',
    suggestions: ['Đề Toán 2024 Hà Nội', 'Đề Văn 2023 TP.HCM', 'Đề Anh 2024 Đà Nẵng']
  },
  { 
    id: 'quiz_creator', 
    name: 'Tạo Đề AI', 
    desc: 'Tự động tạo đề trắc nghiệm', 
    icon: GraduationCap, 
    fromColor: 'from-rose-500', 
    toColor: 'to-pink-600',
    placeholder: 'Chủ đề ôn thi...',
    suggestions: ['Hàm số mũ Logarit', 'Lịch sử thế giới hiện đại', 'Di truyền học']
  },
  { 
    id: 'flashcard', 
    name: 'Flashcard Pro', 
    desc: 'Học từ vựng siêu tốc', 
    icon: Layers, 
    fromColor: 'from-amber-400', 
    toColor: 'to-orange-500',
    placeholder: 'Nhập chủ đề (VD: 50 từ vựng IELTS Environment)...',
    suggestions: ['Từ vựng chủ đề Environment', 'Công thức Lý 12 chương 1', 'Sự kiện lịch sử VN 1945']
  },
  { 
    id: 'essay_grader', 
    name: 'Chấm Văn 4.0', 
    desc: 'Sửa lỗi & nâng cấp văn phong', 
    icon: PenTool, 
    fromColor: 'from-fuchsia-500', 
    toColor: 'to-purple-600',
    placeholder: 'Dán bài làm của bạn vào đây...',
    suggestions: ['Phân tích nhân vật Mị', 'Nghị luận về sống đẹp', 'Cảm nhận Tây Tiến']
  },
  { 
    id: 'mindmap', 
    name: 'Mindmap', 
    desc: 'Hệ thống hóa kiến thức', 
    icon: Network, 
    fromColor: 'from-emerald-400', 
    toColor: 'to-teal-600',
    placeholder: 'Nhập chủ đề gốc...',
    suggestions: ['Chiến tranh lạnh', 'Quang hợp ở thực vật', 'Thơ mới 1930-1945']
  },
  { 
    id: 'summary', 
    name: 'Tóm Tắt Nhanh', 
    desc: 'Biến dài thành ngắn', 
    icon: ListChecks, 
    fromColor: 'from-sky-400', 
    toColor: 'to-blue-500',
    placeholder: 'Dán văn bản cần tóm tắt...',
    suggestions: ['Tóm tắt văn bản lịch sử', 'Tóm tắt bài báo khoa học']
  }
];

// --- SUB-COMPONENTS (Performance Optimization) ---

const ToolCard = memo(({ tool, onClick }: { tool: any, onClick: (id: string) => void }) => (
  <button 
    onClick={() => onClick(tool.id)} 
    className="group relative overflow-hidden bg-white rounded-[2rem] border border-slate-100 p-6 text-left shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
  >
    <div className={`absolute inset-0 bg-gradient-to-br ${tool.fromColor} ${tool.toColor} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${tool.fromColor} ${tool.toColor} flex items-center justify-center text-white shadow-lg mb-4 group-hover:scale-110 transition-transform duration-300`}>
      <tool.icon size={28} />
    </div>
    <h3 className="font-black text-slate-800 text-lg mb-1">{tool.name}</h3>
    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">{tool.desc}</p>
    <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0">
      <ArrowRight size={20} className="text-slate-300" />
    </div>
  </button>
));

const MindMapNode = memo(({ node, depth = 0 }: { node: any; depth?: number }) => {
  const [expanded, setExpanded] = useState(true);
  const colors = ['bg-indigo-600', 'bg-purple-500', 'bg-pink-500', 'bg-amber-500'];
  const color = colors[depth % colors.length];

  if (!node) return null;

  return (
    <div className="flex flex-col items-center relative animate-in fade-in zoom-in duration-300">
      <div 
        onClick={() => setExpanded(!expanded)}
        className={`relative z-10 px-6 py-3 rounded-2xl text-white font-bold shadow-lg cursor-pointer transition-all hover:scale-105 active:scale-95 flex items-center gap-2 ${color} ${depth === 0 ? 'text-xl py-4 px-8 mb-6 shadow-xl shadow-indigo-200' : 'text-sm mb-4'}`}
      >
        {node.name || node.root}
        {node.children?.length > 0 && <ChevronDown size={16} className={`transition-transform ${expanded ? 'rotate-180' : ''}`}/>}
      </div>
      
      {expanded && node.children?.length > 0 && (
        <div className="flex justify-center gap-8 relative pt-4">
           <div className="absolute top-0 left-1/2 w-0.5 h-4 bg-slate-300 -translate-x-1/2"></div>
           {node.children.length > 1 && (
             <div className="absolute top-0 left-[calc(50%/2)] right-[calc(50%/2)] h-0 border-t-2 border-slate-300 w-[calc(100%-4rem)] left-8"></div>
           )}
           {node.children.map((child: any, i: number) => (
            <div key={i} className="flex flex-col items-center relative">
               <div className="w-0.5 h-4 bg-slate-300 absolute -top-4"></div>
               <MindMapNode node={child} depth={depth + 1} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

const FlashcardDeck = memo(({ cards }: { cards: any[] }) => {
  const [index, setIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const next = useCallback(() => { setIsFlipped(false); setTimeout(() => setIndex((i) => (i + 1) % cards.length), 200); }, [cards.length]);
  const prev = useCallback(() => { setIsFlipped(false); setTimeout(() => setIndex((i) => (i - 1 + cards.length) % cards.length), 200); }, [cards.length]);

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-md mx-auto py-4">
       <div className="perspective-1000 w-full aspect-[3/2] cursor-pointer group" onClick={() => setIsFlipped(!isFlipped)}>
        <div className={`relative w-full h-full transition-all duration-700 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
          {/* Front */}
          <div className="absolute inset-0 backface-hidden bg-white border border-slate-100 rounded-[2.5rem] shadow-2xl flex flex-col items-center justify-center p-6 text-center overflow-hidden">
            <span className="absolute top-6 left-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">Question</span>
            
            <div className="w-full max-h-[80%] overflow-y-auto px-4 flex items-center justify-center">
                <p className="text-xl md:text-2xl font-black text-slate-800 leading-tight">{cards[index].front}</p>
            </div>

            <div className="absolute bottom-6 right-6 text-slate-300 animate-pulse"><RotateCw size={20}/></div>
          </div>
          
          {/* Back */}
          <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[2.5rem] shadow-2xl flex flex-col items-center justify-center p-6 text-center rotate-y-180 text-white overflow-hidden">
            <span className="absolute top-6 left-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Answer</span>
            
            <div className="w-full max-h-[80%] overflow-y-auto px-4 flex items-center justify-center">
                <p className="text-lg md:text-xl font-bold leading-relaxed">{cards[index].back}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-6 bg-white p-2 rounded-full shadow-lg border border-slate-100">
         <button onClick={prev} className="p-4 hover:bg-slate-50 rounded-full transition-colors"><ArrowLeft size={20}/></button>
         <span className="font-black text-sm w-12 text-center text-slate-400">{index + 1}/{cards.length}</span>
         <button onClick={next} className="p-4 hover:bg-slate-50 rounded-full transition-colors"><ArrowRight size={20}/></button>
      </div>
      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
        /* Hide scrollbar for cleaner look */
        ::-webkit-scrollbar { width: 0px; background: transparent; }
      `}</style>
    </div>
  );
});

// --- MAIN COMPONENT ---
const StudyTools: React.FC<{ onExp: (amount: number) => void }> = ({ onExp }) => {
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [subInput, setSubInput] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [examLinks, setExamLinks] = useState<any[]>([]);
  const [filters, setFilters] = useState({ year: '2024', subject: 'Toán học', province: 'Hà Nội', grade: '12' });
  const [oracleCard, setOracleCard] = useState<any>(null);
  const [showOracle, setShowOracle] = useState(false);

  const currentToolConfig = useMemo(() => TOOLS_CONFIG.find(t => t.id === activeTool), [activeTool]);

  const handleRunTool = useCallback(async () => {
    if (!input.trim() && activeTool !== 'exam_bank') return;
    setLoading(true);
    setResult(null);
    setExamLinks([]);

    try {
      // Async logic (giữ nguyên logic service nhưng code gọn hơn)
      let res;
      switch (activeTool) {
        case 'exam_bank':
          const links = await getOfficialExamLinks(filters.subject, filters.year, filters.province, filters.grade);
          setExamLinks(links);
          onExp(10);
          break;
        case 'quiz_creator':
          res = await generateExamPaper(input || filters.subject, filters.grade, "practice", 10);
          setResult(res);
          onExp(30);
          break;
        case 'mindmap':
          res = await generateMindMap(input);
          setResult(res);
          onExp(20);
          break;
        case 'summary':
          res = await summarizeText(input);
          setResult(res);
          onExp(15);
          break;
        case 'flashcard':
          res = await generateFlashcards(input);
          setResult(res);
          onExp(25);
          break;
        case 'essay_grader':
          res = await gradeEssay(input, subInput || 'Chủ đề tự do');
          setResult(res);
          onExp(35);
          break;
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [activeTool, input, subInput, filters, onExp]);

  const summonOracle = async () => {
    if (loading) return;
    setLoading(true);
    setShowOracle(true);
    setOracleCard(null);
    try {
      const data = await getOracleReading();
      setOracleCard(data);
      onExp(50);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = useCallback(() => {
    setActiveTool(null);
    setResult(null);
    setInput('');
    setExamLinks([]);
    setSubInput('');
  }, []);

  return (
    <div className="space-y-8 animate-slide-up max-w-3xl mx-auto w-full pb-32">
      {/* HEADER SECTION */}
      {!activeTool && (
        <div className="text-center py-8 animate-fade-in">
           <h2 className="text-5xl font-black text-slate-800 tracking-tighter mb-3">WORKSTATION</h2>
           <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.3em]">Hệ điều hành học tập tương lai</p>
        </div>
      )}

      {/* ORACLE WIDGET (Compact & Futuristic) */}
      {!activeTool && (
        <div className="relative group overflow-hidden rounded-[2.5rem] shadow-2xl transition-all hover:scale-[1.02]">
           <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 animate-gradient-xy"></div>
           <div className="relative p-8 flex items-center justify-between text-white">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-inner">
                    <Eye size={24} className="text-white animate-pulse" />
                 </div>
                 <div>
                    <h3 className="font-black text-lg">Academic Oracle</h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">Dự đoán vận hạn học tập</p>
                 </div>
              </div>
              <button onClick={summonOracle} className="px-6 py-3 bg-white text-indigo-700 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-indigo-50 transition-all active:scale-95">
                 {loading ? <Loader2 className="animate-spin"/> : 'Triệu hồi'}
              </button>
           </div>
           
           {/* Oracle Result Overlay */}
           {showOracle && (
             <div className="bg-slate-900/90 backdrop-blur-md absolute inset-0 z-20 flex flex-col items-center justify-center p-8 text-center animate-in fade-in">
                {oracleCard ? (
                  <div className="animate-slide-up space-y-4">
                     <Gem size={48} className="text-amber-400 mx-auto animate-bounce"/>
                     <h3 className="text-2xl font-black text-white">{oracleCard.cardName}</h3>
                     <p className="text-indigo-200 text-sm font-bold italic">"{oracleCard.message}"</p>
                     <div className="flex gap-2 justify-center mt-4">
                        <span className="bg-white/10 px-3 py-1 rounded-full text-[10px] text-white font-black uppercase">Item: {oracleCard.luckyItem}</span>
                        <span className="bg-white/10 px-3 py-1 rounded-full text-[10px] text-white font-black uppercase">Buff: {oracleCard.buff}</span>
                     </div>
                     <button onClick={() => setShowOracle(false)} className="mt-6 text-slate-400 hover:text-white text-xs font-black uppercase tracking-widest">Đóng</button>
                  </div>
                ) : (
                  <Loader2 className="animate-spin text-white" size={32} />
                )}
             </div>
           )}
        </div>
      )}

      {/* TOOL GRID (Bento Layout) */}
      {!activeTool ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-stagger-in">
           {TOOLS_CONFIG.map(tool => (
             <ToolCard key={tool.id} tool={tool} onClick={setActiveTool} />
           ))}
        </div>
      ) : (
        <div className="animate-slide-in">
           {/* TOOL WORKSPACE */}
           <div className="flex items-center gap-4 mb-6">
              <button onClick={handleBack} className="w-10 h-10 bg-white rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition-colors shadow-sm">
                 <ArrowLeft size={20} />
              </button>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                 <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${currentToolConfig?.fromColor} ${currentToolConfig?.toColor} flex items-center justify-center text-white`}>
                    {currentToolConfig && <currentToolConfig.icon size={16} />}
                 </div>
                 {currentToolConfig?.name}
              </h2>
           </div>

           <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-8 mb-8 relative overflow-hidden">
              {/* Contextual Inputs */}
              {(activeTool === 'exam_bank' || activeTool === 'quiz_creator') && (
                <div className="grid grid-cols-2 gap-3 mb-6">
                   <select value={filters.year} onChange={e => setFilters({...filters, year: e.target.value})} className="bg-slate-50 p-3 rounded-xl text-xs font-bold outline-none border-2 border-transparent focus:border-indigo-100">{['2024', '2023', '2022'].map(y => <option key={y} value={y}>{y}</option>)}</select>
                   <select value={filters.subject} onChange={e => setFilters({...filters, subject: e.target.value})} className="bg-slate-50 p-3 rounded-xl text-xs font-bold outline-none border-2 border-transparent focus:border-indigo-100">{['Toán học', 'Ngữ văn', 'Tiếng Anh', 'Vật lý'].map(s => <option key={s} value={s}>{s}</option>)}</select>
                </div>
              )}
              
              {activeTool === 'essay_grader' && (
                 <input 
                    value={subInput} 
                    onChange={e => setSubInput(e.target.value)} 
                    placeholder="Chủ đề bài văn (Không bắt buộc)..." 
                    className="w-full p-4 bg-slate-50 rounded-2xl mb-4 font-bold text-sm outline-none border-2 border-transparent focus:border-indigo-100 transition-all"
                 />
              )}

              <div className="relative">
                 <textarea 
                   value={input} 
                   onChange={e => setInput(e.target.value)} 
                   placeholder={currentToolConfig?.placeholder} 
                   className="w-full h-40 bg-slate-50 rounded-2xl p-5 font-medium text-sm outline-none border-2 border-transparent focus:border-indigo-100 transition-all resize-none"
                 />
                 {/* Smart Suggestions */}
                 <div className="absolute bottom-4 left-4 flex gap-2 overflow-x-auto max-w-[calc(100%-2rem)] no-scrollbar">
                    {currentToolConfig?.suggestions?.map((s, i) => (
                       <button key={i} onClick={() => setInput(s)} className="whitespace-nowrap px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-500 hover:text-indigo-600 hover:border-indigo-200 transition-colors shadow-sm">
                          {s}
                       </button>
                    ))}
                 </div>
              </div>

              <button 
                onClick={handleRunTool} 
                disabled={loading} 
                className={`mt-6 w-full py-5 rounded-2xl font-black text-white shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-3 bg-gradient-to-r ${currentToolConfig?.fromColor} ${currentToolConfig?.toColor} disabled:opacity-50`}
              >
                 {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={20} fill="currentColor" />}
                 {loading ? 'AI ĐANG XỬ LÝ...' : 'KÍCH HOẠT'}
              </button>
           </div>

           {/* RESULTS AREA */}
           {(result || examLinks.length > 0) && (
              <div className="animate-slide-up space-y-6">
                 <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 size={18} className="text-green-500" />
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">Kết quả xử lý</span>
                 </div>
                 
                 {/* DYNAMIC RESULT RENDERING */}
                 <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-8 overflow-hidden relative">
                    {/* Exam Links */}
                    {activeTool === 'exam_bank' && (
                       <div className="space-y-3">
                          {examLinks.map((link, i) => (
                             <a key={i} href={link.web?.uri} target="_blank" rel="noreferrer" className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-indigo-50 transition-colors group">
                                <span className="font-bold text-sm text-slate-700 group-hover:text-indigo-700 truncate max-w-[80%]">{link.web?.title}</span>
                                <Globe size={16} className="text-slate-300 group-hover:text-indigo-500"/>
                             </a>
                          ))}
                          {examLinks.length === 0 && <p className="text-center text-slate-400 text-sm font-bold">Không tìm thấy kết quả.</p>}
                       </div>
                    )}

                    {/* Mindmap */}
                    {activeTool === 'mindmap' && result && (
                       <div className="overflow-x-auto py-8">
                          <MindMapNode node={result} />
                          <div className="text-center mt-8">
                             <button onClick={() => downloadAsFile(JSON.stringify(result), "mindmap.json")} className="text-xs font-bold text-indigo-600 hover:underline">Download JSON</button>
                          </div>
                       </div>
                    )}

                    {/* Flashcards */}
                    {activeTool === 'flashcard' && Array.isArray(result) && <FlashcardDeck cards={result} />}

                    {/* Essay Grader */}
                    {activeTool === 'essay_grader' && result && (
                       <div className="space-y-6">
                          <div className="flex items-center gap-6 p-6 bg-slate-50 rounded-[2rem]">
                             <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-white ${result.score >= 8 ? 'bg-green-500' : 'bg-amber-500'}`}>{result.score}</div>
                             <div>
                                <h4 className="font-black text-slate-800">Điểm số tổng quan</h4>
                                <p className="text-xs text-slate-500">Dựa trên tiêu chí chấm thi THPT</p>
                             </div>
                          </div>
                          <div className="prose prose-sm max-w-none">
                             <MarkdownText text={result.feedback} />
                             <div className="h-px bg-slate-100 my-4"></div>
                             <MarkdownText text={result.improvements} />
                          </div>
                       </div>
                    )}

                    {/* Text Summary */}
                    {activeTool === 'summary' && typeof result === 'string' && (
                       <div className="prose prose-slate max-w-none font-medium text-slate-600">
                          <MarkdownText text={result} />
                          <button onClick={() => navigator.clipboard.writeText(result)} className="absolute top-6 right-6 p-2 bg-slate-100 rounded-lg hover:bg-slate-200"><Copy size={16}/></button>
                       </div>
                    )}
                 </div>
              </div>
           )}
        </div>
      )}

      <style>{`
        .animate-gradient-xy { background-size: 200% 200%; animation: gradient-xy 6s ease infinite; }
        @keyframes gradient-xy { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
      `}</style>
    </div>
  );
};

export default StudyTools;
