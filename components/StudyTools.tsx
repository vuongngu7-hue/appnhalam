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
  generateMindMap, getOfficialExamLinks, generateExamPaper, 
  getOracleReading
} from '../services/geminiService';
import MarkdownText from './MarkdownText';
import { parseTutorReply } from './AITutor';

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
    id: 'mindmap', 
    name: 'Mindmap', 
    desc: 'Hệ thống hóa kiến thức', 
    icon: Network, 
    fromColor: 'from-emerald-400', 
    toColor: 'to-teal-600',
    placeholder: 'Nhập chủ đề gốc...',
    suggestions: ['Chiến tranh lạnh', 'Quang hợp ở thực vật']
  }
];

const ToolCard = memo(({ tool, onClick }: { tool: any, onClick: (id: string) => void }) => (
  <button 
    id={`tool-card-btn-${tool.id}`}
    onClick={() => onClick(tool.id)} 
    className="group relative overflow-hidden glass-card rounded-[2rem] border border-white/10 p-6 text-left shadow-sm hover:shadow-[0_0_30px_rgba(99,102,241,0.2)] hover:-translate-y-1 hover:border-indigo-500/30 transition-all duration-300 animate-fade-in"
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
        id={`mindmap-node-trigger-${node.name || 'node'}`}
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



const parseQuestionsFromHTML = (htmlString: string) => {
  if (!htmlString || typeof htmlString !== 'string') return [];
  
  let cleanHtml = htmlString;
  const match = htmlString.match(/```html([\s\S]*?)```/);
  if (match) {
    cleanHtml = match[1];
  } else {
    cleanHtml = htmlString.replace(/```/g, '');
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(cleanHtml, 'text/html');
    const questionElements = doc.querySelectorAll('.question');
    
    return Array.from(questionElements).map((el, i) => {
      const h3 = el.querySelector('h3');
      const p = el.querySelector('p');
      const buttons = el.querySelectorAll('button');
      
      const correct = (el.getAttribute('data-correct') || 'A').trim().toUpperCase();
      const explanation = el.getAttribute('data-explanation') || '';
      
      const options = Array.from(buttons).map((btn, btnIdx) => {
        let text = btn.textContent || '';
        let optionLetter = String.fromCharCode(65 + btnIdx);
        const matchLetter = text.trim().match(/^([A-D])\s*[\.\:\-]/i);
        if (matchLetter) {
          optionLetter = matchLetter[1].toUpperCase();
        } else {
          // If the text does not start with letter prefix, add it manually
          text = `${optionLetter}. ${text}`;
        }
        return {
          option: optionLetter,
          text: text
        };
      });

      return {
        title: h3?.textContent?.trim() || `Câu ${i + 1}`,
        questionText: p?.textContent?.trim() || '',
        options: options,
        correct: correct,
        explanation: explanation
      };
    });
  } catch (e) {
    console.error("HTML parsing error", e);
    return [];
  }
};

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
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [isQuizSubmitted, setIsQuizSubmitted] = useState(false);
  const [oracleCard, setOracleCard] = useState<any>(null);
  const [showOracle, setShowOracle] = useState(false);

  const currentToolConfig = useMemo(() => TOOLS_CONFIG.find(t => t.id === activeTool), [activeTool]);

  const parsedQuestions = useMemo(() => {
    if (activeTool !== 'quiz_creator' || !result || typeof result !== 'string') return [];
    return parseQuestionsFromHTML(result);
  }, [result, activeTool]);

  const handleRunTool = useCallback(async () => {
    // Validate inputs
    if (activeTool !== 'exam_bank' && !input.trim() && activeTool !== 'quiz_creator') {
       setError("Vui lòng nhập nội dung!");
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
          if (!res || typeof res !== 'string' || res.trim().length === 0) {
             setError("AI chưa tạo được câu hỏi. Hệ thống đang quá tải, hãy thử lại!");
          } else {
             setResult(res);
             onExp(30);
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
                id="btn-giasu-mode"
                onClick={() => setIsSeriousMode(false)}
                className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${!isSeriousMode ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Gia Sư
              </button>
              <button 
                id="btn-chuyengia-mode"
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
           <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 animate-gradient-xy opacity-80 animate-pulse"></div>
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
              <button id="btn-summon-oracle" onClick={summonOracle} className="px-6 py-3 bg-white text-indigo-900 rounded-xl font-black text-xs uppercase tracking-widest shadow-[0_0_15px_rgba(255,255,255,0.4)] hover:bg-slate-100 transition-all active:scale-95">
                 {loading ? <Loader2 className="animate-spin"/> : 'Triệu hồi'}
              </button>
           </div>
           
           {/* Oracle Result Overlay */}
           {showOracle && (
             <div id="oracle-overlay-panel" className="bg-slate-900/90 backdrop-blur-md absolute inset-0 z-20 flex flex-col items-center justify-center p-8 text-center animate-in fade-in">
                 {oracleCard ? (
                   <div className="animate-slide-up space-y-4">
                      <Gem size={48} className="text-amber-400 mx-auto animate-bounce drop-shadow-[0_0_10px_rgba(245,158,11,0.8)]"/>
                      <h3 className="text-2xl font-black text-white">{oracleCard.cardName}</h3>
                      <p className="text-indigo-200 text-sm font-medium italic">"{oracleCard.message}"</p>
                      <div className="flex gap-2 justify-center mt-4">
                         <span className="bg-white/10 px-3 py-1 rounded-full text-[10px] text-white font-black uppercase border border-white/10">Item: {oracleCard.luckyItem}</span>
                         <span className="bg-white/10 px-3 py-1 rounded-full text-[10px] text-white font-black uppercase border border-white/10">Buff: {oracleCard.buff}</span>
                      </div>
                      <button id="btn-close-oracle" onClick={() => setShowOracle(false)} className="mt-6 text-slate-400 hover:text-white text-xs font-black uppercase tracking-widest transition-colors animate-pulse">Đóng</button>
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
                 <button id="btn-workspace-back" onClick={handleBack} className="w-10 h-10 bg-slate-800/50 rounded-xl border border-white/10 flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white transition-all shadow-inner">
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
                id="btn-workspace-seriousness-toggle"
                onClick={() => setIsSeriousMode(!isSeriousMode)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${isSeriousMode ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-slate-800 text-slate-500 border-white/10'}`}
              >
                <BrainCircuit size={14} /> {isSeriousMode ? 'Chuyên Gia ON' : 'Gia Sư'}
              </button>
           </div>

           {/* INPUT CARD CONTAINER */}
           <div className="glass-card rounded-[2.5rem] border border-white/10 shadow-xl p-8 mb-8">
              {activeTool === 'exam_bank' ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 animate-fade-in">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Môn học</label>
                       <select id="select-exambank-subject" value={filters.subject} onChange={e => setFilters({...filters, subject: e.target.value})} className="w-full p-4 bg-slate-900/50 text-white rounded-2xl font-medium outline-none border border-white/10 focus:border-indigo-500/50 transition-colors">
                          {['Toán học', 'Ngữ văn', 'Tiếng Anh', 'Vật lý', 'Hóa học', 'Sinh học', 'Lịch sử', 'Địa lý'].map(s => <option key={s} value={s} className="bg-slate-900">{s}</option>)}
                       </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Lớp</label>
                         <select id="select-exambank-grade" value={filters.grade} onChange={e => setFilters({...filters, grade: e.target.value})} className="w-full p-4 bg-slate-900/50 text-white rounded-2xl font-medium outline-none border border-white/10 focus:border-indigo-500/50 transition-colors">
                            {['12', '11', '10', '9', '8', '7', '6'].map(g => <option key={g} value={g} className="bg-slate-900">Lớp {g}</option>)}
                         </select>
                       </div>
                       <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Năm thi</label>
                         <select id="select-exambank-year" value={filters.year} onChange={e => setFilters({...filters, year: e.target.value})} className="w-full p-4 bg-slate-900/50 text-white rounded-2xl font-medium outline-none border border-white/10 focus:border-indigo-500/50 transition-colors">
                            {['2024', '2023', '2022', '2021'].map(y => <option key={y} value={y} className="bg-slate-900">{y}</option>)}
                         </select>
                       </div>
                    </div>
                 </div>
              ) : activeTool === 'quiz_creator' ? (
                 <div className="space-y-4 mb-6 animate-fade-in">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Nguồn đề, tài liệu hoặc chủ đề thi cần phân tích & thiết kế lại đề mới</label>
                       <textarea 
                         id="textarea-quizcreator-input"
                         value={input} 
                         onChange={e => setInput(e.target.value)} 
                         placeholder="Cung cấp tài liệu, đề thi cần phân tích cấu trúc HOẶC chỉ đơn giản gõ chủ đề (Toán mũ Logarit, Lịch sử 11, etc.) để AI tự động thiết kế một bộ đề trắc nghiệm hoàn toàn mới..."
                         className="w-full h-40 bg-slate-900/50 text-white rounded-[2rem] p-6 text-sm font-medium outline-none border border-white/10 focus:border-indigo-500/50 resize-none shadow-inner placeholder:text-slate-600 transition-colors"
                       />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Lớp học</label>
                         <select id="select-quizcreator-grade" value={filters.grade} onChange={e => setFilters({...filters, grade: e.target.value})} className="w-full p-4 bg-slate-900/50 text-white rounded-2xl font-medium outline-none border border-white/10 focus:border-indigo-500/50 transition-colors">
                            {['12', '11', '10', '9', '8', '7', '6'].map(g => <option key={g} value={g} className="bg-slate-900">Lớp {g}</option>)}
                         </select>
                       </div>
                       <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Độ khó mục tiêu</label>
                         <select id="select-quizcreator-difficulty" value={filters.difficulty} onChange={e => setFilters({...filters, difficulty: e.target.value})} className="w-full p-4 bg-slate-900/50 text-white rounded-2xl font-medium outline-none border border-white/10 focus:border-indigo-500/50 transition-colors">
                            {['Dễ', 'Trung bình', 'Khó', 'Cực khó'].map(d => <option key={d} value={d} className="bg-slate-900">{d}</option>)}
                         </select>
                       </div>
                    </div>
                 </div>
              ) : (
                 <div className="space-y-4 mb-6 animate-fade-in">
                    <textarea 
                      id={`textarea-generic-input-${activeTool}`}
                      value={input} 
                      onChange={e => setInput(e.target.value)} 
                      placeholder={currentToolConfig?.placeholder}
                      className="w-full h-40 bg-slate-900/50 text-white rounded-[2rem] p-6 text-lg font-medium outline-none border border-white/10 focus:border-indigo-500/50 resize-none shadow-inner placeholder:text-slate-600 transition-colors"
                    />
                    {activeTool === 'essay_grader' && (
                      <input 
                        id="input-essay-topic"
                        value={subInput} 
                        onChange={e => setSubInput(e.target.value)} 
                        placeholder="Chủ đề hoặc yêu cầu cụ thể..."
                        className="w-full p-4 bg-slate-900/50 text-white rounded-2xl font-medium outline-none border border-white/10 focus:border-indigo-500/50 transition-colors"
                      />
                    )}
                 </div>
              )}

              {/* ACTION EXECUTION BUTTON */}
              <button 
                id="btn-workspace-trigger-action"
                onClick={handleRunTool} 
                disabled={loading}
                className={`w-full py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 transition-all transform hover:-translate-y-0.5 active:scale-95 ${
                  loading 
                    ? 'bg-slate-800 text-slate-600 cursor-not-allowed border border-white/5' 
                    : `bg-gradient-to-r ${currentToolConfig?.fromColor} ${currentToolConfig?.toColor} text-white shadow-indigo-500/20`
                }`}
              >
                {loading ? (
                  <>
                     <Loader2 className="animate-spin" size={18} />
                     Đang xử lý với Gemini AI...
                  </>
                ) : (
                  <>
                     <Wand2 size={18} />
                     Kích hoạt {currentToolConfig?.name}
                  </>
                )}
              </button>

              {/* SUGGESTIONS PILLS */}
              {currentToolConfig?.suggestions && currentToolConfig.suggestions.length > 0 && (
                <div className="mt-6">
                   <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5"><Sparkles size={12}/> Gợi ý nhanh</div>
                   <div className="flex flex-wrap gap-2">
                      {currentToolConfig.suggestions.map((s, index) => (
                         <button 
                           id={`btn-suggestion-${index}`}
                           key={index} 
                           onClick={() => setInput(s)} 
                           className="text-xs bg-white/5 hover:bg-white/10 hover:border-white/20 border border-white/5 text-slate-300 font-bold px-4 py-2.5 rounded-full transition-all"
                         >
                            {s}
                         </button>
                      ))}
                   </div>
                </div>
              )}
           </div>

           {/* ERROR WRAPPER */}
           {error && (
             <div id="error-message-banner" className="glass-card border border-rose-500/20 bg-rose-500/10 rounded-[2rem] p-6 text-rose-400 text-sm font-bold flex items-center gap-3 mb-8 animate-in slide-in-from-top-4">
                <AlertCircle size={20} className="shrink-0" />
                <p>{error}</p>
             </div>
           )}

           {/* DYNAMIC RESULTS CONTAINER */}
           {(result || examLinks.length > 0) && (
              <div id="container-dynamic-results" className="space-y-6">
                 {activeTool === 'mindmap' && result ? (
                    <div id="result-mindmap" className="glass-card rounded-[3rem] border border-white/10 p-10 shadow-xl overflow-x-auto custom-scrollbar flex flex-col items-center justify-center min-h-[400px]">
                       <MindMapNode node={result} />
                    </div>
                 ) : activeTool === 'quiz_creator' && result ? (
                    <div id="result-quiz-creator" className="space-y-6">
                       {/* DIAGNOSTIC PANEL */}
                       <div id="quiz-diagnostic-panel" className="glass-card rounded-[2.5rem] border border-white/10 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl animate-fade-in">
                          <div className="space-y-2">
                             <div className="flex items-center gap-2">
                                <span className="text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-widest bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">Phân tích từ AI</span>
                                <span className="text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-widest bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 flex items-center gap-1">
                                   Độ khó: {filters.difficulty}
                                </span>
                             </div>
                             <div className="flex flex-wrap gap-1.5 pt-1">
                                {[filters.subject].map((topic: string, index: number) => (
                                   <span key={index} className="text-[10px] font-bold text-slate-400 bg-slate-800/60 px-2.5 py-1 rounded-lg border border-white/5">
                                      #{topic}
                                   </span>
                                ))}
                             </div>
                          </div>
                          <div className="bg-indigo-600/10 px-4 py-3 rounded-2xl border border-indigo-500/20 text-center md:text-right">
                             <div className="text-[9px] text-slate-400 uppercase tracking-widest font-black">Số câu hỏi</div>
                             <div className="text-2xl font-black text-indigo-400">{parsedQuestions.length} Câu</div>
                          </div>
                       </div>

                       {/* QUESTIONS LIST */}
                       {parsedQuestions.map((q: any, i: number) => {
                         const correctLetter = q.correct.trim().toUpperCase();
                         const correctOptIdx = -1 // deprecated;
                         
                         return (
                           <div key={i} id={`quiz-question-card-${i}`} className="glass-card rounded-[2.5rem] border border-white/10 p-8 shadow-xl animate-fade-in">
                              <div className="flex items-start gap-4 mb-6">
                                 <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black shrink-0 shadow-lg">{i + 1}</div>
                                 <h4 className="text-lg font-black text-white leading-tight pt-1">{q.title}</h4><p className="text-slate-300 text-sm leading-relaxed font-semibold mt-2">{q.questionText}</p>
                              </div>
                              <div className="grid grid-cols-1 gap-3 mb-6">
                                 {(q.options || []).map((opt: any, optIdx: number) => {
                                   const isSelected = userAnswers[i] === opt.option;
                                   const isCorrect = opt.option === correctLetter;
                                   const showResult = isQuizSubmitted;
                                   
                                   return (
                                     <button 
                                       id={`question-${i}-opt-${opt.option}`}
                                       key={optIdx} 
                                       disabled={isQuizSubmitted}
                                       onClick={() => setUserAnswers(prev => ({...prev, [i]: opt.option}))}
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
                                           {opt.option}
                                        </span>
                                        {opt.text}
                                        {showResult && isCorrect && <CheckCircle2 size={16} className="ml-auto text-green-400" />}
                                        {showResult && isSelected && !isCorrect && <AlertCircle size={16} className="ml-auto text-rose-400" />}
                                     </button>
                                   );
                                 })}
                              </div>
                              {isQuizSubmitted && q.explanation && (() => {
                                const parsed = parseTutorReply(q.explanation);
                                if (parsed.isParsed) {
                                  const isUnverified = parsed.source.toLowerCase().includes("chưa xác minh") || parsed.source.toLowerCase().includes("chua xac minh");
                                  const pctMatch = parsed.confidence.match(/(\d+)\s*%/);
                                  const percentValue = pctMatch ? parseInt(pctMatch[1]) : null;

                                  return (
                                    <div id={`quiz-explanation-${i}`} className="bg-indigo-500/5 border border-indigo-500/10 rounded-2xl p-5 animate-in slide-in-from-top-2 space-y-4">
                                       <div className="flex items-center gap-2 text-indigo-400 font-black text-[10px] uppercase tracking-widest">
                                          <Sparkles size={14} /> Giải thích đáp án & Lời giải
                                       </div>
                                       
                                       <div className="text-slate-300 text-sm leading-relaxed font-semibold">
                                          <MarkdownText text={parsed.mainContent} />
                                       </div>

                                       <div className="border-t border-white/5 pt-3 mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                          {/* Nguồn */}
                                          <div className={`p-3 rounded-xl border ${
                                            isUnverified 
                                              ? 'bg-rose-500/5 border-rose-500/15 text-rose-300' 
                                              : 'bg-emerald-500/5 border-emerald-500/15 text-emerald-300'
                                          }`}>
                                             <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[8px] mb-1 text-slate-400">
                                                {isUnverified ? <AlertCircle size={12} className="text-rose-400" /> : <CheckCircle2 size={12} className="text-emerald-400" />}
                                                Nguồn kiểm chứng
                                             </div>
                                             <p className="font-semibold text-slate-200">{parsed.source}</p>
                                          </div>

                                          {/* Độ tin cậy */}
                                          <div className="p-3 rounded-xl border border-indigo-500/15 bg-indigo-500/5 text-slate-300">
                                             <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[8px] mb-1 text-slate-400">
                                                <BrainCircuit size={12} className="text-indigo-400" />
                                                Độ tin cậy học thuật
                                             </div>
                                             <p className="font-semibold text-slate-200">{parsed.confidence}</p>
                                             {percentValue !== null && (
                                                <div className="w-full bg-slate-800 rounded-full h-1 mt-1.5 overflow-hidden">
                                                   <div 
                                                      className="h-full bg-indigo-400 rounded-full transition-all duration-1000" 
                                                      style={{ width: `${percentValue}%` }}
                                                   />
                                                </div>
                                             )}
                                          </div>
                                       </div>
                                    </div>
                                  );
                                } else {
                                  return (
                                    <div id={`quiz-explanation-${i}`} className="bg-indigo-500/5 border border-indigo-500/10 rounded-2xl p-5 animate-in slide-in-from-top-2">
                                       <div className="flex items-center gap-2 text-indigo-400 font-black text-[10px] uppercase tracking-widest mb-2">
                                          <Sparkles size={14} /> Giải thích đáp án & Lời giải
                                       </div>
                                       <div className="text-slate-300 text-sm leading-relaxed font-semibold">
                                          <MarkdownText text={q.explanation} />
                                       </div>
                                    </div>
                                  );
                                }
                              })()}
                           </div>
                         );
                       })}
                       
                       {!isQuizSubmitted && parsedQuestions.length > 0 && (
                         <button 
                           id="btn-quiz-submit"
                           onClick={() => setIsQuizSubmitted(true)}
                           className="w-full py-4 bg-green-600 text-white rounded-2xl font-black text-lg shadow-lg hover:bg-green-500 transition-all transform active:scale-[0.98]"
                         >
                           NỘP BÀI & XEM ĐÁP ÁN
                         </button>
                       )}
                       
                       {isQuizSubmitted && (
                         <div id="quiz-final-scorecard" className="glass-card rounded-[2.5rem] border border-white/10 p-8 text-center animate-in zoom-in-95">
                            <h3 className="text-xl font-black text-white mb-2">Kết quả của bạn</h3>
                            <div className="text-4xl font-black text-indigo-400 mb-4">
                               {Object.entries(userAnswers).filter(([idx, ansIndex]) => {
                                 const qIndex = parseInt(idx);
                                 const correctLetter = parsedQuestions[qIndex] ? parsedQuestions[qIndex].correct.trim().toUpperCase() : 'A';
                                 const chosenLetter = ansIndex;
                                 return chosenLetter === correctLetter;
                               }).length} / {parsedQuestions.length}
                            </div>
                            <button 
                              id="btn-quiz-restart"
                              onClick={handleRunTool}
                              className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-550 transition-colors"
                            >
                              LÀM ĐỀ KHÁC
                            </button>
                         </div>
                       )}
                    </div>
                 ) : null}
              </div>
           )}

           {/* EXAM LINKS LIST */}
           {examLinks.length > 0 && (
              <div id="container-exam-links-list" className="grid grid-cols-1 gap-3 animate-in fade-in py-8">
                 <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Tìm thấy {examLinks.length} Đề thi từ Bộ KH / Các Sở:</div>
                 {examLinks.map((link, i) => (
                   <a 
                     id={`exam-external-link-${i}`}
                     key={i} 
                     href={link.web?.uri || link.url} 
                     target="_blank" 
                     rel="noopener noreferrer"
                     className="flex items-center justify-between p-6 glass-card border border-white/10 rounded-3xl hover:border-indigo-500/50 hover:shadow-[0_0_20px_rgba(99,102,241,0.1)] transition-all group bg-slate-900/20"
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
