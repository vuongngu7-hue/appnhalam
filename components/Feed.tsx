
import React, { useState, useEffect, useCallback, memo } from 'react';
import { 
  Plus, Heart, Sparkles, MessageSquare, X, Send, 
  ShieldCheck, Share2, Flame, Zap, Image as ImageIcon, Trash2,
  Camera
} from 'lucide-react';
import { Post, UserProfile, PostType } from '../types';
import { checkVibePost, suggestHashtags } from '../services/geminiService';
import MarkdownText from './MarkdownText';

const Feed: React.FC<{ userData: UserProfile; onExp: (n: number) => void }> = ({ userData, onExp }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<PostType | 'all'>('all');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Load posts once
  useEffect(() => {
    try {
      const saved = localStorage.getItem('studygram_posts');
      if (saved) {
        const parsed = JSON.parse(saved);
        const validatedPosts = parsed.map((p: any) => ({
          ...p,
          likes: Array.isArray(p.likes) ? p.likes : [],
          comments: Array.isArray(p.comments) ? p.comments : [],
          hashtags: Array.isArray(p.hashtags) ? p.hashtags : [],
          aiAnalysis: p.aiAnalysis || ''
        }));
        setPosts(validatedPosts);
      } else {
        const initial = [{
          id: 'p1', uid: 'admin', userName: 'Hệ thống StudyGram 🛡️', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Admin',
          content: 'Chào mừng các học giả tới phiên bản **StudyGram V7 Performance**! 🚀\n\nĐã tối ưu hóa tốc độ xử lý, giảm lag và tăng trải nghiệm lướt siêu mượt. Hãy chia sẻ kiến thức ngay nào! 🔥', category: 'Thông báo', type: 'event' as PostType, mood: '🚀', createdAt: Date.now(), likes: [], comments: [], isPinned: true, aiAnalysis: 'Hệ thống đang hoạt động với hiệu suất tối đa!'
        }];
        setPosts(initial);
      }
    } catch (e) {
      console.error("Error loading posts:", e);
      setPosts([]);
    }
  }, []);

  // Save posts to localStorage whenever they change
  useEffect(() => {
    if (posts.length > 0) {
      localStorage.setItem('studygram_posts', JSON.stringify(posts));
    }
  }, [posts]);

  const filteredPosts = posts.filter(p => activeTab === 'all' || p.type === activeTab);

  const handleAddPost = async (data: Partial<Post>) => {
    setIsAnalyzing(true);
    try {
      // Async operations
      const hashtags = await suggestHashtags(data.content!);
      const vibeData = await checkVibePost(data.content!);
      
      const newPost: Post = {
        id: Date.now().toString(), uid: userData.uid, userName: userData.name, avatar: userData.avatar,
        content: data.content!, category: data.category!, type: data.type || 'knowledge', mood: data.mood || '📚',
        createdAt: Date.now(), likes: [], comments: [], hashtags, aiAnalysis: vibeData.comment,
        image: data.image
      };
      
      setPosts(prev => [newPost, ...prev]);
      onExp(25);
      setIsModalOpen(false);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Optimize: useCallback ensures function reference implies stability
  const handleLike = useCallback((id: string) => {
    setPosts(currentPosts => 
      currentPosts.map(p => 
        p.id === id 
          ? { ...p, likes: p.likes.includes(userData.uid) ? p.likes.filter(u => u !== userData.uid) : [...p.likes, userData.uid] } 
          : p
      )
    );
  }, [userData.uid]);

  // Optimize: useCallback
  const handleComment = useCallback((id: string, text: string) => {
    if (!text.trim()) return;
    setPosts(currentPosts => 
      currentPosts.map(p => 
        p.id === id 
          ? { ...p, comments: [...p.comments, { id: Date.now().toString(), userName: userData.name, avatar: userData.avatar, content: text, createdAt: Date.now(), isAuthor: true }] } 
          : p
      )
    );
    onExp(5);
  }, [userData.name, userData.avatar, onExp]);

  const handleDeletePost = useCallback((id: string) => {
    if (window.confirm('Bạn có chắc muốn xóa bài viết này?')) {
      setPosts(prev => prev.filter(p => p.id !== id));
    }
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] animate-slide-up max-w-2xl mx-auto w-full">
      {/* Sticky Header Section */}
      <div className="space-y-6 pb-6 px-1">
        {/* Create Post Trigger */}
        <div className="glass-card p-6 rounded-[2rem] flex items-center gap-6 cursor-pointer hover:shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all group transform-gpu" onClick={() => setIsModalOpen(true)}>
          <div className="relative shrink-0">
            <img src={userData.avatar} className="w-14 h-14 rounded-[1.2rem] border-2 border-white/20 shadow-sm group-hover:rotate-6 transition-transform" />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-slate-800 rounded-full"></div>
          </div>
          <div className="flex-1 text-slate-400 font-bold text-lg tracking-tight group-hover:text-slate-300 transition-colors">Chia sẻ tri thức mới...</div>
          <div className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.5)] group-hover:scale-110 transition-transform"><Plus size={24} strokeWidth={3}/></div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 p-1.5 bg-slate-800/50 backdrop-blur-md rounded-2xl w-full overflow-x-auto no-scrollbar border border-white/10 shadow-inner transform-gpu">
          {['all', 'knowledge', 'meme', 'event'].map(t => (
            <button 
              key={t} 
              onClick={() => setActiveTab(t as any)} 
              className={`flex-1 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 whitespace-nowrap ${activeTab === t ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              {t === 'all' ? 'Tất cả' : t}
            </button>
          ))}
        </div>
      </div>

      {/* Standard Scrollable List */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-32 space-y-6 px-1">
        {filteredPosts.map((post) => (
          <PostCard 
            key={post.id}
            post={post} 
            userData={userData} 
            onLike={handleLike} 
            onComment={handleComment} 
            onDelete={handleDeletePost}
          />
        ))}
        {filteredPosts.length === 0 && (
          <div className="text-center py-20 opacity-50 font-bold text-slate-400">Chưa có bài viết nào...</div>
        )}
      </div>

      {isModalOpen && (
        <CreatePostModal onClose={() => setIsModalOpen(false)} onSubmit={handleAddPost} userData={userData} isAnalyzing={isAnalyzing} />
      )}
    </div>
  );
};

// Optimized PostCard with Custom Comparison to prevent re-renders when parent state (like EXP) changes
const PostCard = memo(({ post, userData, onLike, onComment, onDelete }: { post: Post, userData: UserProfile, onLike: (id: string) => void, onComment: (id: string, txt: string) => void, onDelete: (id: string) => void }) => {
  const [showComments, setShowComments] = useState(false);
  const [input, setInput] = useState('');
  const [justShared, setJustShared] = useState(false);

  const likes = post.likes || [];
  const comments = post.comments || [];
  const hasLiked = likes.includes(userData.uid);

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareText = `${post.userName} trên StudyGram:\n\n${post.content}\n\n#StudyGram #V7`;
    try {
      if (navigator.share) await navigator.share({ title: `Bài viết của ${post.userName}`, text: shareText, url: window.location.href });
      else {
        await navigator.clipboard.writeText(shareText);
        setJustShared(true); setTimeout(() => setJustShared(false), 2000);
      }
    } catch (err) {}
  };

  return (
    // Performance: Use solid bg-white instead of transparent glass for list items
    <div className="glass-card rounded-[3rem] p-6 md:p-10 border border-white/10 shadow-lg relative overflow-hidden group transform-gpu transition-all hover:shadow-[0_0_30px_rgba(99,102,241,0.15)] hover:border-indigo-500/30">
      <div className="flex gap-4 mb-6">
        <div className="relative shrink-0">
          <img src={post.avatar} className="w-14 h-14 rounded-[1.8rem] border-2 border-white/20 shadow-sm" loading="lazy" />
          <div className="absolute -bottom-1 -right-1 bg-slate-800 w-7 h-7 rounded-xl flex items-center justify-center text-sm shadow-sm border border-white/10">{post.mood}</div>
        </div>
        <div className="flex flex-col justify-center min-w-0">
          <h4 className="font-black text-white text-base flex items-center gap-2 tracking-tight leading-none truncate">
            {post.userName} 
            {post.type === 'event' && <ShieldCheck size={16} className="text-amber-400 shrink-0" fill="currentColor"/>}
          </h4>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">#{post.category}</span>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest truncate">{new Date(post.createdAt).toLocaleDateString('vi-VN')}</span>
          </div>
        </div>
      </div>

      <div className="text-base md:text-lg leading-relaxed mb-6 font-medium text-slate-300 whitespace-pre-wrap tracking-tight">
        <MarkdownText text={post.content} />
      </div>

      {post.image && (
        <div className="mb-6 rounded-[2rem] overflow-hidden border border-white/10 shadow-inner">
          <img src={post.image} className="w-full h-auto max-h-[400px] object-cover" loading="lazy" />
        </div>
      )}

      {post.aiAnalysis && (
        <div className="p-5 bg-indigo-500/10 rounded-[2rem] mb-6 border border-indigo-500/20 flex gap-4 items-start shadow-inner">
           <div className="w-8 h-8 bg-indigo-500/20 rounded-[0.8rem] flex items-center justify-center text-indigo-400 shadow-sm shrink-0 border border-indigo-500/30"><Sparkles size={16} strokeWidth={2.5}/></div>
           <div className="text-xs font-medium text-indigo-300 italic leading-relaxed pt-0.5 flex-1">
             <MarkdownText text={post.aiAnalysis} />
           </div>
        </div>
      )}

      <div className="flex items-center gap-6 pt-5 border-t border-white/10">
        <button onClick={() => onLike(post.id)} className={`flex items-center gap-2 text-sm font-black transition-transform active:scale-125 ${hasLiked ? 'text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]' : 'text-slate-400 hover:text-rose-400'}`}>
          <Heart size={22} fill={hasLiked ? 'currentColor' : 'none'} strokeWidth={hasLiked ? 0 : 2.5} /> 
          <span className="mt-0.5">{likes.length}</span>
        </button>
        <button onClick={() => setShowComments(!showComments)} className={`flex items-center gap-2 text-sm font-black transition-colors ${showComments ? 'text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.8)]' : 'text-slate-400 hover:text-indigo-400'}`}>
          <MessageSquare size={22} strokeWidth={2.5} /> 
          <span className="mt-0.5">{comments.length}</span>
        </button>
        <button onClick={handleShare} className={`flex items-center gap-2 text-sm font-black transition-colors ${justShared ? 'text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.8)]' : 'text-slate-400 hover:text-cyan-400'}`}>
          <Share2 size={22} strokeWidth={2.5} /> 
        </button>
        {(post.uid === userData.uid || userData.isAdmin) && (
          <button onClick={() => onDelete(post.id)} className="flex items-center gap-2 text-sm font-black text-slate-400 hover:text-rose-500 transition-colors ml-auto">
            <Trash2 size={20} strokeWidth={2.5} />
          </button>
        )}
      </div>

      {showComments && (
        <div className="mt-6 space-y-4 animate-in">
          <div className="bg-slate-900/50 p-4 rounded-[2rem] border border-white/5 space-y-3 max-h-[250px] overflow-y-auto shadow-inner custom-scrollbar">
            {comments.map((c: any) => (
              <div key={c.id} className={`flex gap-3 ${c.userName === userData.name ? 'flex-row-reverse' : ''}`}>
                <img src={c.avatar} className="w-8 h-8 rounded-[0.8rem] border border-white/20 shadow-sm shrink-0 self-end mb-1" loading="lazy" />
                <div className={`p-3 rounded-[1.5rem] text-xs font-medium shadow-sm leading-relaxed ${c.userName === userData.name ? 'bg-indigo-600 text-white rounded-br-none shadow-[0_0_10px_rgba(99,102,241,0.3)]' : 'bg-slate-800 text-slate-300 rounded-bl-none border border-white/10'}`}>
                  {c.content}
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 bg-slate-800/50 p-1.5 rounded-[1.8rem] border border-white/10 focus-within:border-indigo-500/50 transition-colors shadow-inner">
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (onComment(post.id, input), setInput(''))} placeholder="Bình luận..." className="flex-1 bg-transparent px-4 py-2 text-sm font-medium text-white outline-none placeholder:text-slate-500" />
            <button onClick={() => { if(input) { onComment(post.id, input); setInput(''); } }} className="w-10 h-10 bg-indigo-600 text-white rounded-[1.2rem] flex items-center justify-center active:scale-90 transition-transform shadow-[0_0_10px_rgba(99,102,241,0.5)]"><Send size={18}/></button>
          </div>
        </div>
      )}
    </div>
  );
}, (prev, next) => {
  // Custom comparator: Only re-render if post data differs or user identity changes
  // This ignores changes to 'onLike'/'onComment' references and generic 'userData' updates (like exp)
  return prev.post === next.post && prev.userData.uid === next.userData.uid;
});

const CreatePostModal: React.FC<any> = memo(({ onClose, onSubmit, userData, isAnalyzing }) => {
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('📚');
  const [image, setImage] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-6 transform-gpu">
      <div className="glass-card w-full max-w-xl rounded-[4rem] p-8 space-y-6 animate-slide-up relative shadow-2xl border border-white/10">
        <div className="flex justify-between items-center">
          <h3 className="text-2xl font-black text-white tracking-tighter neon-text">Đăng bài 🧬</h3>
          <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl transition-colors"><X size={20}/></button>
        </div>
        
        <div className="space-y-4">
          <textarea 
            value={content} 
            onChange={e => setContent(e.target.value)} 
            placeholder="Fen học được gì hay ho?" 
            className="w-full h-32 bg-slate-900/50 rounded-[2.5rem] p-6 text-lg font-medium text-white outline-none border border-white/10 focus:border-indigo-500/50 resize-none shadow-inner placeholder:text-slate-500 transition-colors" 
          />
          
          {image && (
            <div className="relative inline-block animate-in zoom-in duration-300">
              <img src={image} className="w-24 h-24 rounded-2xl border-2 border-white/20 shadow-lg object-cover" />
              <button onClick={() => setImage(null)} className="absolute -top-2 -right-2 bg-rose-500 text-white p-1 rounded-lg shadow-lg"><X size={12}/></button>
            </div>
          )}

          <div className="flex items-center gap-4">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-white/10 text-slate-300 rounded-xl border border-white/10 transition-all text-xs font-black uppercase tracking-widest"
            >
              <Camera size={16} /> {image ? 'Đổi ảnh' : 'Thêm ảnh'}
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
          </div>
        </div>

        <button 
          onClick={() => onSubmit({ content, mood, category: 'Kiến thức', type: 'knowledge', image })} 
          disabled={!content.trim() || isAnalyzing} 
          className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-lg shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:bg-indigo-500 transition-all disabled:opacity-50 flex justify-center items-center gap-2"
        >
           {isAnalyzing && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
          {isAnalyzing ? 'ĐANG PHÂN TÍCH...' : 'ĐĂNG NGAY 🚀'}
        </button>
      </div>
    </div>
  );
});

export default Feed;
