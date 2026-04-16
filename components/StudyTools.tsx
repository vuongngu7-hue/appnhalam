
import React, { useState, useMemo, useCallback, memo } from 'react';
import { 
  Wand2, BookOpen, ListChecks, CalendarDays, 
  ChevronRight, ArrowLeft, Loader2, Sparkles, 
  Copy, Check, LayoutGrid, RotateCw, Download, FileText,
  Smile, ImageIcon, Network, ChevronDown, GraduationCap, Map,
  CheckCircle2, AlertCircle, Search, Globe, Filter,
  Gem, Eye, Moon, BrainCircuit, PenTool, Layers, Undo2, ArrowRight,
  History, Command, X, Send, Camera
} from 'lucide-react';
import { 
  summarizeText, generateFlashcards, downloadAsFile, 
  generateMindMap, getOfficialExamLinks, generateExamPaper, 
  getOracleReading, gradeEssay
} from '../services/geminiService';
import MarkdownText from './MarkdownText';

const TOOLS_CONFIG = [
  { 
    id: 'exam_bank', 
    name: 'Kho Đề Sở GD', 
    desc: 'Truy tìm đề thi chính thức', 
    icon: Globe, 
    fromColor: 'from-blue-500', 
    toColor: 'to-indigo-600',
    placeholder: 'Nhập từ khóa bổ sung (VD: Trường Chuyên KHTN, đề thi thử)...',
    suggestions: ['Đề Toán 2024 Hà Nội', 'Đề Văn 2023 TP.HCM', 'Đề Anh 2024 Đà Nẵng']
  },
  { 
    id: 'quiz_creator', 
    name: 'Tạo Đề AI', 
    desc: 'Tự động tạo đề trắc nghiệm', 
    icon: GraduationCap, 
    fromColor: 'from-rose-500', 
    toColor: 'to-pink-600',
    placeholder: 'Chủ đề ôn thi (VD: Hàm số, Lịch sử 12)...',
    suggestions: ['Hàm số mũ Logarit', 'Lịch sử thế giới hiện đại', 'Di truyền học']
  },
  { 
    id: 'flashcard', 
    name: 'Flashcard Pro', 
    desc: 'Học từ vựng siêu tốc', 
    icon: Layers, 
    fromColor: 'from-amber-400', 
    toColor: 'to-orange-500',
    placeholder: 'Nhập chủ đề...',
    suggestions: ['Từ vựng IELTS Environment', 'Công thức Lý 12 chương 1']
  },
  { 
    id: 'essay_grader', 
    name: 'Chấm Văn 4.0', 
    desc: 'Sửa lỗi & nâng cấp văn phong', 
    icon: PenTool, 
    fromColor: 'from-fuchsia-500', 
    toColor: 'to-purple-600',
    placeholder: 'Dán bài làm của bạn vào đây (Tối thiểu 50 từ)...',
    suggestions: []
  },
  { 
    id: 'mindmap', 
    name: 'Mindmap', 
    desc: 'Hệ thống hóa kiến thức', 
    icon: Network, 
    fromColor: 'from-emerald-400', 
    toColor: 'to-teal-600',
    placeholder: 'Nhập chủ đề gốc...',
    suggestions: ['Chiến tranh lạnh', 'Quang hợp ở thực vật']
  },
  { 
    id: 'summary', 
    name: 'Tóm Tắt Nhanh', 
    desc: 'Biến dài thành ngắn', 
    icon: ListChecks, 
    fromColor: 'from-sky-400', 
    toColor: 'to-blue-500',
    placeholder: 'Dán văn bản cần tóm tắt...',
    suggestions: []
  }
];

const ToolCard = memo(({ tool, onClick }: { tool: any, onClick: (id: string) => void }) => (
  <button 
    onClick={() => onClick(tool.id)} 
    className="group relative overflow-hidden glass-card rounded-[2rem] border border-white/10 p-6 text-left shadow-sm hover:shadow-[0_0_30px_rgba(99,102,241,0.2)] hover:-translate-y-1 hover:border-indigo-500/30 transition-all duration-300"
  >
    <div className={`absolute inset-0 bg-gradient-to-br ${tool.fromColor} ${tool.toColor} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${tool.fromColor} ${tool.toColor} flex items-center justify-center text-white shadow-[0_0_15px_rgba(255,255,255,0.2)] mb-4 group-hover:scale-110 transition-transform duration-300`}>
      <tool.icon size={28} />
    </div>
    <h3 className="font-black text-white text-lg mb-1 tracking-tight">{tool.name}</h3>
    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{tool.desc}</p>
    <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0">
      <ArrowRight size={20} className="text-indigo-400 drop-shadow-[0_0_5px_rgba(99,102,241,0.8)]" />
    </div>
  </button>
));

const MindMapNode = memo(({ node, depth = 0 }: { node: any; depth?: number }) => {
  const [expanded, setExpanded] = useState(true);
  const colors = [
    'bg-indigo-600 shadow-[0_0_20px_rgba(99,102,241,0.4)] border-indigo-400', 
    'bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.3)] border-purple-300', 
    'bg-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.3)] border-pink-300', 
    'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)] border-amber-300'
  ];
  const color = colors[depth % colors.length];

  if (!node) return null;

  return (
    <div className="flex flex-col items-center relative animate-in fade-in zoom-in duration-500">
      <div 
        onClick={() => setExpanded(!expanded)}
        className={`relative z-10 px-6 py-3 rounded-2xl text-white font-black cursor-pointer transition-all hover:scale-105 active:scale-95 flex items-center gap-3 border-2 shadow-lg ${color} ${depth === 0 ? 'text-xl py-5 px-10 mb-10' : 'text-xs mb-6'}`}
      >
        <span className="whitespace-nowrap">{node.name || node.root}</span>
        {node.children?.length > 0 && (
          <div className={`p-1 rounded-full bg-white/20 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}>
            <ChevronDown size={depth === 0 ? 20 : 14} />
          </div>
        )}
      </div>
      
      {expanded && node.children?.length > 0 && (
        <div className="flex justify-center gap-6 relative pt-4">
           {/* Vertical line from parent */}
           <div className="absolute top-0 left-1/2 w-0.5 h-4 bg-slate-700 -translate-x-1/2"></div>
           
           {/* Horizontal bridge line */}
           {node.children.length > 1 && (
             <div className="absolute top-4 left-0 right-0 flex justify-center">
                <div className="h-0.5 bg-slate-700" style={{ width: `calc(100% - ${100 / node.children.length}%)` }}></div>
             </div>
           )}
           
           {node.children.map((child: any, i: number) => (
            <div key={i} className="flex flex-col items-center relative">
               {/* Vertical line to child */}
               <div className="w-0.5 h-4 bg-slate-700 absolute -top-0"></div>
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
          <div className="absolute inset-0 backface-hidden glass-card border border-white/10 rounded-[2.5rem] shadow-2xl flex flex-col items-center justify-center p-6 text-center overflow-hidden">
            <span className="absolute top-6 left-6 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 drop-shadow-[0_0_5px_rgba(99,102,241,0.8)]">Question</span>
            <div className="w-full max-h-[80%] overflow-y-auto px-4 flex items-center justify-center custom-scrollbar">
                <p className="text-xl md:text-2xl font-black text-white leading-tight">{cards[index].front}</p>
            </div>
            <div className="absolute bottom-6 right-6 text-slate-300 animate-pulse"><RotateCw size={20}/></div>
          </div>
          {/* Back */}
          <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[2.5rem] shadow-[0_0_30px_rgba(99,102,241,0.5)] flex flex-col items-center justify-center p-6 text-center rotate-y-180 text-white overflow-hidden border border-white/20">
            <span className="absolute top-6 left-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/40 drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">Answer</span>
            <div className="w-full max-h-[80%] overflow-y-auto px-4 flex items-center justify-center custom-scrollbar">
                <p className="text-lg md:text-xl font-bold leading-relaxed">{cards[index].back}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-6 glass-card p-2 rounded-full shadow-lg border border-white/10">
         <button onClick={prev} className="p-4 hover:bg-white/10 text-slate-400 hover:text-white rounded-full transition-colors"><ArrowLeft size={20}/></button>
         <span className="font-black text-sm w-12 text-center text-slate-300">{index + 1}/{cards.length}</span>
         <button onClick={next} className="p-4 hover:bg-white/10 text-slate-400 hover:text-white rounded-full transition-colors"><ArrowRight size={20}/></button>
      </div>
      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
        ::-webkit-scrollbar { width: 0px; background: transparent; }
      `}</style>
    </div>
  );
});

const StudyTools: React.FC<{ onExp: (amount: number) => void }> = ({ onExp }) => {
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [isSeriousMode, setIsSeriousMode] = useState(false);
  const [input, setInput] = useState('');
  const [subInput, setSubInput] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [examLinks, setExamLinks] = useState<any[]>([]);
  const [filters, setFilters] = useState({ year: '2024', subject: 'Toán học', province: 'Hà Nội', grade: '12', difficulty: 'Trung bình' });
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [isQuizSubmitted, setIsQuizSubmitted] = useState(false);
  const [oracleCard, setOracleCard] = useState<any>(null);
  const [showOracle, setShowOracle] = useState(false);

  const currentToolConfig = useMemo(() => TOOLS_CONFIG.find(t => t.id === activeTool), [activeTool]);

  const handleRunTool = useCallback(async () => {
    // Validate inputs
    if (activeTool !== 'exam_bank' && !input.trim() && activeTool !== 'quiz_creator') {
       setError("Vui lòng nhập nội dung!");
       return;
    }
    if (activeTool === 'essay_grader' && input.length < 50) {
       setError("Bài văn quá ngắn, hãy viết ít nhất 50 từ nhé!");
       return;
    }

    setLoading(true);
    setResult(null);
    setExamLinks([]);
    setError(null);
    setUserAnswers({});
    setIsQuizSubmitted(false);

    try {
      let res;
      switch (activeTool) {
        case 'exam_bank':
          const links = await getOfficialExamLinks(filters.subject, filters.year, filters.province, filters.grade);
          if (!links || links.length === 0) {
             setError("Không tìm thấy link nào. Thử đổi năm hoặc từ khóa khác xem!");
          } else {
             setExamLinks(links);
             onExp(10);
          }
          break;
        case 'quiz_creator':
          res = await generateExamPaper(input || filters.subject, filters.grade, filters.difficulty, 10, isSeriousMode);
          if (!res || res.length === 0) {
             setError("AI chưa tạo được câu hỏi. Hệ thống đang quá tải, hãy thử lại!");
          } else {
             setResult(res);
             onExp(30);
          }
          break;
        case 'essay_grader':
          res = await gradeEssay(input, subInput || 'Chủ đề tự do', isSeriousMode);
          if (!res) {
             setError("Lỗi chấm bài. Hãy đảm bảo nội dung là văn bản tiếng Việt hợp lệ.");
          } else {
             setResult(res);
             onExp(35);
          }
          break;
        case 'mindmap':
          res = await generateMindMap(input, isSeriousMode);
          if (!res || !res.children || res.children.length === 0) {
             setError("Không thể tạo Mindmap. Thử chủ đề đơn giản hơn.");
          } else {
            setResult(res);
            onExp(20);
          }
          break;
        case 'summary':
          res = await summarizeText(input, isSeriousMode);
          setResult(res);
          onExp(15);
          break;
        case 'flashcard':
          res = await generateFlashcards(input, isSeriousMode);
          if (!res || res.length === 0) setError("Không tạo được Flashcard.");
          else {
            setResult(res);
            onExp(25);
          }
          break;
      }
    } catch (err) {
      setError("Đã có lỗi hệ thống xảy ra. Vui lòng thử lại!");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [activeTool, input, subInput, filters, onExp, isSeriousMode]);

  const summonOracle = async () => {
    if (loading) return;
    setLoading(true);
    setShowOracle(true);
    setOracleCard(null);
    try {
      const data = await getOracleReading();
      setOracleCard(data);
      onExp(50);
    } catch {
      setError("Oracle đang bận.");
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
    setError(null);
    setUserAnswers({});
    setIsQuizSubmitted(false);
  }, []);

  return (
    <div className="space-y-8 animate-slide-up max-w-3xl mx-auto w-full pb-32">
      {/* HEADER SECTION */}
      {!activeTool && (
        <div className="text-center py-8 animate-fade-in flex flex-col items-center gap-4">
           <h2 className="text-5xl font-black text-white tracking-tighter mb-3 neon-text">WORKSTATION</h2>
           
           <div className="flex items-center gap-3 bg-slate-800/50 p-2 rounded-full border border-white/10">
              <button 
                onClick={() => setIsSeriousMode(false)}
                className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${!isSeriousMode ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Gia Sư
              </button>
              <button 
                onClick={() => setIsSeriousMode(true)}
                className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${isSeriousMode ? 'bg-amber-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <BrainCircuit size={14} /> Chuyên Gia
              </button>
           </div>

           <p className="text-slate-500 font-bold max-w-md mx-auto text-sm">
             {isSeriousMode 
               ? "Chế độ Chuyên Gia: AI sẽ trả lời cực kỳ chi tiết, học thuật và nghiêm túc." 
               : "Chế độ Gia Sư: AI sẽ giải thích gần gũi, dễ hiểu và trẻ trung."}
           </p>
        </div>
      )}

      {/* ORACLE WIDGET */}
      {!activeTool && (
        <div className="relative group overflow-hidden rounded-[2.5rem] shadow-2xl transition-all hover:scale-[1.02] border border-white/10">
           <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 animate-gradient-xy opacity-80"></div>
           <div className="relative p-8 flex items-center justify-between text-white">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-inner border border-white/20">
                    <Eye size={24} className="text-white animate-pulse" />
                 </div>
                 <div>
                    <h3 className="font-black text-lg">Academic Oracle</h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">Dự đoán vận hạn học tập</p>
                 </div>
              </div>
              <button onClick={summonOracle} className="px-6 py-3 bg-white text-indigo-900 rounded-xl font-black text-xs uppercase tracking-widest shadow-[0_0_15px_rgba(255,255,255,0.4)] hover:bg-slate-100 transition-all active:scale-95">
                 {loading ? <Loader2 className="animate-spin"/> : 'Triệu hồi'}
              </button>
           </div>
           
           {/* Oracle Result Overlay */}
           {showOracle && (
             <div className="bg-slate-900/90 backdrop-blur-md absolute inset-0 z-20 flex flex-col items-center justify-center p-8 text-center animate-in fade-in">
                {oracleCard ? (
                  <div className="animate-slide-up space-y-4">
                     <Gem size={48} className="text-amber-400 mx-auto animate-bounce drop-shadow-[0_0_10px_rgba(245,158,11,0.8)]"/>
                     <h3 className="text-2xl font-black text-white">{oracleCard.cardName}</h3>
                     <p className="text-indigo-200 text-sm font-medium italic">"{oracleCard.message}"</p>
                     <div className="flex gap-2 justify-center mt-4">
                        <span className="bg-white/10 px-3 py-1 rounded-full text-[10px] text-white font-black uppercase border border-white/10">Item: {oracleCard.luckyItem}</span>
                        <span className="bg-white/10 px-3 py-1 rounded-full text-[10px] text-white font-black uppercase border border-white/10">Buff: {oracleCard.buff}</span>
                     </div>
                     <button onClick={() => setShowOracle(false)} className="mt-6 text-slate-400 hover:text-white text-xs font-black uppercase tracking-widest transition-colors">Đóng</button>
                  </div>
                ) : (
                  <Loader2 className="animate-spin text-white" size={32} />
                )}
             </div>
           )}
        </div>
      )}

      {/* TOOL GRID */}
      {!activeTool ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-stagger-in">
           {TOOLS_CONFIG.map(tool => (
             <ToolCard key={tool.id} tool={tool} onClick={setActiveTool} />
           ))}
        </div>
      ) : (
        <div className="animate-slide-in">
           {/* TOOL WORKSPACE */}
           <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <button onClick={handleBack} className="w-10 h-10 bg-slate-800/50 rounded-xl border border-white/10 flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white transition-all shadow-inner">
                   <ArrowLeft size={20} />
                </button>
                <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                   <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${currentToolConfig?.fromColor} ${currentToolConfig?.toColor} flex items-center justify-center text-white shadow-sm`}>
                      {currentToolConfig && <currentToolConfig.icon size={16} />}
                   </div>
                   {currentToolConfig?.name}
                </h2>
              </div>

              <button 
                onClick={() => setIsSeriousMode(!isSeriousMode)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${isSeriousMode ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-slate-800 text-slate-500 border-white/10'}`}
              >
                <BrainCircuit size={14} /> {isSeriousMode ? 'Chuyên Gia ON' : 'Gia Sư'}
              </button>
           </div>

           <div className="glass-card rounded-[2.5rem] border border-white/10 shadow-xl p-8 mb-8">
              {activeTool === 'exam_bank' || activeTool === 'quiz_creator' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Môn học / Chủ đề</label>
                      {activeTool === 'quiz_creator' ? (
                        <input 
                          value={input} 
                          onChange={e => setInput(e.target.value)} 
                          placeholder="Toán, Lý, Hóa, Lịch sử..."
                          className="w-full p-4 bg-slate-900/50 text-white rounded-2xl font-medium outline-none border border-white/10 focus:border-indigo-500/50 transition-colors"
                        />
                      ) : (
                        <select value={filters.subject} onChange={e => setFilters({...filters, subject: e.target.value})} className="w-full p-4 bg-slate-900/50 text-white rounded-2xl font-medium outline-none border border-white/10 focus:border-indigo-500/50 transition-colors">
                           {['Toán học', 'Ngữ văn', 'Tiếng Anh', 'Vật lý', 'Hóa học', 'Sinh học', 'Lịch sử', 'Địa lý'].map(s => <option key={s} value={s} className="bg-slate-900">{s}</option>)}
                        </select>
                      )}
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Lớp</label>
                        <select value={filters.grade} onChange={e => setFilters({...filters, grade: e.target.value})} className="w-full p-4 bg-slate-900/50 text-white rounded-2xl font-medium outline-none border border-white/10 focus:border-indigo-500/50 transition-colors">
                           {['12', '11', '10', '9', '8', '7', '6'].map(g => <option key={g} value={g} className="bg-slate-900">Lớp {g}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">{activeTool === 'quiz_creator' ? 'Độ khó' : 'Năm thi'}</label>
                        {activeTool === 'quiz_creator' ? (
                          <select value={filters.difficulty} onChange={e => setFilters({...filters, difficulty: e.target.value})} className="w-full p-4 bg-slate-900/50 text-white rounded-2xl font-medium outline-none border border-white/10 focus:border-indigo-500/50 transition-colors">
                             {['Dễ', 'Trung bình', 'Khó', 'Cực khó'].map(d => <option key={d} value={d} className="bg-slate-900">{d}</option>)}
                          </select>
                        ) : (
                          <select value={filters.year} onChange={e => setFilters({...filters, year: e.target.value})} className="w-full p-4 bg-slate-900/50 text-white rounded-2xl font-medium outline-none border border-white/10 focus:border-indigo-500/50 transition-colors">
                             {['2024', '2023', '2022', '2021'].map(y => <option key={y} value={y} className="bg-slate-900">{y}</option>)}
                          </select>
                        )}
                      </div>
                   </div>
                </div>
              ) : (
                <div className="space-y-4 mb-6">
                   <textarea 
                     value={input} 
                     onChange={e => setInput(e.target.value)} 
                     placeholder={currentToolConfig?.placeholder}
                     className="w-full h-40 bg-slate-900/50 text-white rounded-[2rem] p-6 text-lg font-medium outline-none border border-white/10 focus:border-indigo-500/50 resize-none shadow-inner placeholder:text-slate-600 transition-colors"
                   />
                   {activeTool === 'essay_grader' && (
                     <input 
                       value={subInput} 
                       onChange={e => setSubInput(e.target.value)} 
                       placeholder="Chủ đề hoặc yêu cầu cụ thể..."
                       className="w-full p-4 bg-slate-900/50 text-white rounded-2xl font-medium outline-none border border-white/10 focus:border-indigo-500/50 transition-colors"
                     />
                   )}
                </div>
              )}

              <button 
                onClick={handleRunTool} 
                disabled={loading}
                className="w-full py-5 bg-indigo-600 text-white rounded-[1.8rem] font-black text-lg shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:bg-indigo-500 transition-all disabled:opacity-50 flex justify-center items-center gap-3"
              >
                 {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={24} />}
                 {loading ? 'ĐANG XỬ LÝ...' : 'BẮT ĐẦU NGAY'}
              </button>
           </div>

           {/* RESULTS AREA */}
           {error && (
             <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-[2rem] flex items-center gap-4 text-rose-400 animate-in fade-in">
                <AlertCircle size={24} />
                <p className="font-bold text-sm">{error}</p>
             </div>
           )}

           {loading && (
             <div className="py-20 flex flex-col items-center gap-4 text-slate-500">
                <Loader2 size={48} className="animate-spin" />
                <p className="font-black text-xs uppercase tracking-[0.3em]">AI đang tính toán...</p>
             </div>
           )}

           {result && (
             <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                {activeTool === 'flashcard' ? (
                  <FlashcardDeck cards={result} />
                ) : activeTool === 'mindmap' ? (
                  <div className="glass-card rounded-[3rem] border border-white/10 p-10 shadow-xl overflow-x-auto no-scrollbar">
                     <MindMapNode node={result} />
                  </div>
                ) : activeTool === 'quiz_creator' ? (
                   <div className="space-y-6">
                      {result.map((q: any, i: number) => (
                        <div key={i} className="glass-card rounded-[2.5rem] border border-white/10 p-8 shadow-xl">
                           <div className="flex items-start gap-4 mb-6">
                              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black shrink-0 shadow-lg">{i + 1}</div>
                              <h4 className="text-lg font-black text-white leading-tight pt-1">{q.question}</h4>
                           </div>
                           <div className="grid grid-cols-1 gap-3 mb-6">
                              {q.options.map((opt: string, optIdx: number) => {
                                const isSelected = userAnswers[i] === optIdx;
                                const isCorrect = optIdx === q.correctAnswerIndex;
                                const showResult = isQuizSubmitted;
                                
                                return (
                                  <button 
                                    key={optIdx} 
                                    disabled={isQuizSubmitted}
                                    onClick={() => setUserAnswers(prev => ({...prev, [i]: optIdx}))}
                                    className={`p-4 rounded-2xl border font-bold text-sm transition-all text-left flex items-center gap-3 ${
                                      showResult
                                        ? isCorrect
                                          ? 'bg-green-500/10 border-green-500/30 text-green-400'
                                          : isSelected
                                            ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                                            : 'bg-slate-900/50 border-white/5 text-slate-500'
                                        : isSelected
                                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg'
                                          : 'bg-slate-900/50 border-white/5 text-slate-400 hover:border-white/20'
                                    }`}
                                  >
                                     <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${isSelected ? 'bg-white text-indigo-600' : 'bg-white/10 text-slate-400'}`}>
                                        {String.fromCharCode(65 + optIdx)}
                                     </span>
                                     {opt}
                                     {showResult && isCorrect && <CheckCircle2 size={16} className="ml-auto" />}
                                     {showResult && isSelected && !isCorrect && <AlertCircle size={16} className="ml-auto" />}
                                  </button>
                                );
                              })}
                           </div>
                           {isQuizSubmitted && (
                             <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-2xl p-5 animate-in slide-in-from-top-2">
                                <div className="flex items-center gap-2 text-indigo-400 font-black text-[10px] uppercase tracking-widest mb-2">
                                   <Sparkles size={14} /> Giải thích chuyên sâu
                                </div>
                                <p className="text-slate-300 text-sm leading-relaxed font-medium">{q.explanation}</p>
                             </div>
                           )}
                        </div>
                      ))}
                      
                      {!isQuizSubmitted && (
                        <button 
                          onClick={() => setIsQuizSubmitted(true)}
                          className="w-full py-4 bg-green-600 text-white rounded-2xl font-black text-lg shadow-lg hover:bg-green-500 transition-all"
                        >
                          NỘP BÀI & XEM ĐÁP ÁN
                        </button>
                      )}
                      
                      {isQuizSubmitted && (
                        <div className="glass-card rounded-[2.5rem] border border-white/10 p-8 text-center">
                           <h3 className="text-xl font-black text-white mb-2">Kết quả của bạn</h3>
                           <div className="text-4xl font-black text-indigo-400 mb-4">
                              {Object.entries(userAnswers).filter(([idx, ans]) => result[parseInt(idx)].correctAnswerIndex === ans).length} / {result.length}
                           </div>
                           <button 
                             onClick={handleRunTool}
                             className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest"
                           >
                             LÀM ĐỀ KHÁC
                           </button>
                        </div>
                      )}
                   </div>
                 ) : activeTool === 'essay_grader' ? (
                   <div className="glass-card rounded-[3rem] border border-white/10 p-10 shadow-xl space-y-8">
                      <div className="flex items-center justify-between">
                         <h3 className="text-2xl font-black text-white tracking-tight">Kết quả chấm bài</h3>
                         <div className="flex flex-col items-end">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Điểm số</span>
                            <div className="text-5xl font-black text-indigo-400 drop-shadow-[0_0_10px_rgba(99,102,241,0.5)]">{result.score}<span className="text-xl text-slate-600">/10</span></div>
                         </div>
                      </div>
                      
                      <div className="space-y-4">
                         <div className="flex items-center gap-2 text-indigo-400 font-black text-[10px] uppercase tracking-widest">
                            <CheckCircle2 size={16} /> Nhận xét chi tiết
                         </div>
                         <div className="text-slate-300 text-sm leading-relaxed font-medium bg-slate-900/50 p-6 rounded-3xl border border-white/5">
                            <MarkdownText text={result.feedback} />
                         </div>
                      </div>

                      <div className="space-y-4">
                         <div className="flex items-center gap-2 text-amber-400 font-black text-[10px] uppercase tracking-widest">
                            <Wand2 size={16} /> Đề xuất nâng cấp
                         </div>
                         <div className="text-slate-300 text-sm leading-relaxed font-medium bg-amber-500/5 p-6 rounded-3xl border border-amber-500/10">
                            <MarkdownText text={result.improvements} />
                         </div>
                      </div>
                   </div>
                 ) : (
                  <div className="glass-card rounded-[3rem] border border-white/10 p-10 shadow-xl">
                     <MarkdownText text={typeof result === 'string' ? result : JSON.stringify(result, null, 2)} />
                  </div>
                )}
             </div>
           )}

           {examLinks.length > 0 && (
             <div className="grid grid-cols-1 gap-3 animate-in fade-in">
                {examLinks.map((link, i) => (
                  <a 
                    key={i} 
                    href={link.web?.uri || link.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-6 glass-card border border-white/10 rounded-3xl hover:border-indigo-500/50 hover:shadow-[0_0_20px_rgba(99,102,241,0.1)] transition-all group"
                  >
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all border border-indigo-500/20 shadow-inner">
                          <FileText size={20} />
                       </div>
                       <span className="font-bold text-slate-200 group-hover:text-white transition-colors">{link.web?.title || link.title}</span>
                    </div>
                    <Download size={18} className="text-slate-500 group-hover:text-indigo-400 transition-colors" />
                  </a>
                ))}
             </div>
           )}
        </div>
      )}
    </div>
  );
};

export default StudyTools;
