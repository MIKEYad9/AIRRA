import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "@/src/lib/supabase";
import { useUserStore } from "@/src/services/useUserStore";
import { 
  Heart, 
  MessageSquare, 
  Send, 
  Sparkles, 
  User, 
  ShieldCheck, 
  ArrowRight, 
  Fingerprint, 
  Globe,
  Smile,
  ShieldAlert,
  Zap,
  Info
} from "lucide-react";

interface Post {
  id: string;
  user_id: string;
  content: string;
  author_name: string;
  likes_count: number;
  created_at: string;
  is_liked?: boolean;
}

export default function Community() {
  const { profile } = useUserStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!supabase) {
      // Offline / Test mode fallback
      const MOCK_COMMUNITY_POSTS: Post[] = [
        {
          id: "mock_1",
          user_id: "mock_user_1",
          author_name: "Anonymous Identity 4a2b",
          content: "Remember that taking a deep breath isn't a distraction from your work; it is the fuel for your clarity. Holding space for all of you today.",
          likes_count: 14,
          is_liked: false,
          created_at: new Date(Date.now() - 3600000 * 2).toISOString()
        },
        {
          id: "mock_2",
          user_id: "mock_user_2",
          author_name: "Anonymous Identity b8e1",
          content: "Just completed a 10-minute coherence breathing session. My autonomic tension index went from High to completely relaxed. This platform is a lifesaver.",
          likes_count: 28,
          is_liked: true,
          created_at: new Date(Date.now() - 3600000 * 8).toISOString()
        },
        {
          id: "mock_3",
          user_id: "mock_user_3",
          author_name: "Anonymous Identity f9c3",
          content: "Sovereign reflection is the only way to heal. Glad to have a place where my journal entries are 100% mine, encrypted, and completely wipeable.",
          likes_count: 9,
          is_liked: false,
          created_at: new Date(Date.now() - 3600000 * 24).toISOString()
        }
      ];

      const local = localStorage.getItem('airra_offline_posts');
      if (local) {
        setPosts(JSON.parse(local));
      } else {
        localStorage.setItem('airra_offline_posts', JSON.stringify(MOCK_COMMUNITY_POSTS));
        setPosts(MOCK_COMMUNITY_POSTS);
      }
      return;
    }

    let channel: any = null;

    // Initial load
    const fetchPosts = async () => {
      try {
        const { data: postsData } = await supabase
          .from('community_posts')
          .select(`*, post_likes(user_id)`)
          .order('created_at', { ascending: false });

        if (postsData) {
          const formatted = postsData.map((p: any) => ({
            ...p,
            is_liked: p.post_likes?.some((l: any) => l.user_id === profile?.id)
          }));
          setPosts(formatted);
        }
      } catch (err) {
        console.warn("Could not fetch community posts cleanly:", err);
      }
    };

    try {
      fetchPosts();

      // Real-time subscription
      channel = supabase
        .channel('community_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'community_posts' }, () => {
          fetchPosts();
        })
        .subscribe();
    } catch (err) {
      console.warn("Could not establish community real-time subscription channel:", err);
    }

    return () => {
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch (err) {
          console.warn("Error removing community channel:", err);
        }
      }
    };
  }, [profile]);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !input.trim()) return;
    setLoading(true);

    if (!supabase) {
      const newPost: Post = {
        id: 'local_' + Math.random().toString(36).substring(2, 9),
        user_id: profile.id,
        content: input.trim(),
        author_name: 'Anonymous Identity ' + profile.id.substring(0, 4),
        likes_count: 0,
        is_liked: false,
        created_at: new Date().toISOString()
      };
      const updated = [newPost, ...posts];
      setPosts(updated);
      localStorage.setItem('airra_offline_posts', JSON.stringify(updated));
      setInput("");
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from('community_posts')
      .insert({
        user_id: profile.id,
        content: input.trim(),
        author_name: 'Anonymous Identity ' + profile.id.substring(0, 4)
      });

    if (!error) {
      setInput("");
    }
    setLoading(false);
  };

  const toggleLike = async (post: Post) => {
    if (!profile) return;

    if (!supabase) {
      const updated = posts.map(p => {
        if (p.id === post.id) {
          const nextLiked = !p.is_liked;
          return {
            ...p,
            is_liked: nextLiked,
            likes_count: nextLiked ? p.likes_count + 1 : Math.max(0, p.likes_count - 1)
          };
        }
        return p;
      });
      setPosts(updated);
      localStorage.setItem('airra_offline_posts', JSON.stringify(updated));
      return;
    }

    if (post.is_liked) {
      await supabase
        .from('post_likes')
        .delete()
        .match({ user_id: profile.id, post_id: post.id });
      
      // Update count
      await supabase
        .from('community_posts')
        .update({ likes_count: Math.max(0, post.likes_count - 1) })
        .eq('id', post.id);
    } else {
      await supabase
        .from('post_likes')
        .insert({ user_id: profile.id, post_id: post.id });
      
      await supabase
        .from('community_posts')
        .update({ likes_count: post.likes_count + 1 })
        .eq('id', post.id);
    }
  };

  return (
    <div className="space-y-24 pb-40 max-w-6xl mx-auto">
      {/* Immersive Community Header */}
      <header className="space-y-12 pt-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-4 px-6 py-2 rounded-full airra-glass border border-airra-border/50 dark:border-white/5 text-airra-primary dark:text-airra-dark-glow text-[10px] font-black uppercase tracking-widest">
              <Globe size={18} />
              The Collective Consciousness
            </div>
            <h1 className="text-airra-display font-display font-black tracking-tighter text-airra-text dark:text-white leading-[0.8] uppercase">
              Neuro <br />
              <span className="font-serif italic font-normal text-airra-primary dark:text-airra-dark-glow normal-case tracking-tight">Circle</span>.
            </h1>
            <p className="text-airra-muted dark:text-airra-dark-muted font-medium text-xl md:text-2xl max-w-xl leading-relaxed tracking-tight">
              A sovereign safe-space for anonymous healing and synchronization.
            </p>
          </div>
          
          <div className="p-8 airra-glass border-emerald-500/10 space-y-4 max-w-xs">
             <div className="flex items-center gap-3 text-emerald-500">
                <ShieldCheck size={20} />
                <span className="text-[10px] font-black uppercase tracking-widest">AI Moderation Active</span>
             </div>
             <p className="text-[11px] text-airra-muted leading-relaxed font-medium">
                Our Neural Sentinel automatically scans all transmissions to ensure a psychologically safe sanctuary.
             </p>
          </div>
        </div>
      </header>

      {/* Broadcast Terminal - Enhanced */}
      <form onSubmit={handlePost} className="airra-card p-12 md:p-16 space-y-12 bg-white/40 dark:bg-airra-dark-forest/40 backdrop-blur-3xl group overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-airra-primary/5 blur-[100px] pointer-events-none group-hover:opacity-100 transition-opacity" />
        
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-black uppercase tracking-[0.4em] text-airra-muted pl-1">Initialize Broadcast Node</label>
            <div className="text-[9px] font-black text-airra-primary uppercase tracking-widest flex items-center gap-2">
               <Fingerprint size={12} /> Symmetric Identity Masking Enabled
            </div>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Disseminate a neural encouragement or thought sequence..."
            className="w-full bg-transparent border-none text-airra-text dark:text-white placeholder:text-airra-muted/40 focus:outline-none resize-none font-medium leading-relaxed text-3xl md:text-5xl min-h-[160px] tracking-tight"
          />
        </div>
        
        <div className="flex flex-col sm:flex-row justify-between items-center gap-10 pt-12 border-t border-airra-border/30 dark:border-white/5">
          <div className="flex items-center gap-6">
              <div className="flex items-center gap-3 px-5 py-2 rounded-xl airra-bg dark:bg-zinc-800 text-airra-muted">
                 <Smile size={18} />
                 <span className="text-[9px] font-black uppercase tracking-widest">Shared Empathy</span>
              </div>
              <div className="flex items-center gap-3 px-5 py-2 rounded-xl airra-bg dark:bg-zinc-800 text-airra-muted">
                 <Zap size={18} />
                 <span className="text-[9px] font-black uppercase tracking-widest">Instant Sync</span>
              </div>
          </div>
          <button
            disabled={!input.trim() || loading}
            className="w-full sm:w-auto h-20 px-12 rounded-[2rem] bg-airra-text dark:bg-white text-airra-bg dark:text-zinc-950 font-black text-xs uppercase tracking-[0.3em] transition-all hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-6 group shadow-airra-xl"
          >
            {loading ? (
              <div className="w-8 h-8 border-4 border-current/20 border-t-current rounded-full animate-spin" />
            ) : (
              <>
                Broadcast Node
                <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Synchronized Feed */}
      <div className="space-y-16">
        <div className="flex items-center gap-6 text-airra-border px-8">
          <div className="h-[2px] flex-1 bg-current opacity-20" />
          <span className="text-[10px] font-black uppercase tracking-[0.6em] text-airra-muted">Global Pulse Feed</span>
          <div className="h-[2px] flex-1 bg-current opacity-20" />
        </div>

        <div className="grid grid-cols-1 gap-12">
          <AnimatePresence>
            {posts.map((post, i) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 30, scale: 0.98 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="airra-card p-12 md:p-16 space-y-12 hover:bg-white dark:hover:bg-zinc-900 transition-all duration-700 relative group overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="flex items-start justify-between relative z-10">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-airra-bg dark:bg-zinc-800 flex items-center justify-center text-airra-muted shadow-inner group-hover:scale-110 transition-transform duration-1000">
                      <User size={28} />
                    </div>
                    <div>
                      <h4 className="text-xl font-display font-black text-airra-text dark:text-white uppercase tracking-tight">{post.author_name}</h4>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-airra-primary uppercase tracking-widest">Active Node</span>
                        <div className="w-1 h-1 rounded-full bg-airra-border" />
                        <span className="text-[10px] font-black text-airra-muted uppercase tracking-widest">{new Date(post.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase tracking-[0.2em] border border-emerald-500/20">
                    <ShieldCheck size={12} /> Sanitized
                  </div>
                </div>
                
                <p className="text-2xl md:text-4xl font-medium text-airra-text dark:text-white leading-[1.3] tracking-tight relative z-10">
                  {post.content}
                </p>

                <div className="flex items-center gap-12 pt-12 border-t border-airra-border/30 dark:border-white/5 relative z-10">
                  <button 
                    onClick={() => toggleLike(post)}
                    className={`flex items-center gap-4 transition-all group ${
                      post.is_liked ? 'text-rose-500' : 'text-airra-muted hover:text-rose-500'
                    }`}
                  >
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${post.is_liked ? 'bg-rose-500/10 shadow-lg shadow-rose-500/20' : 'bg-airra-bg dark:bg-zinc-800 group-hover:bg-rose-500/10'}`}>
                      <Heart size={24} className={post.is_liked ? 'fill-current' : ''} />
                    </div>
                    <div className="flex flex-col items-start">
                       <span className="text-sm font-black uppercase tracking-widest">{post.likes_count}</span>
                       <span className="text-[9px] font-bold uppercase tracking-widest opacity-40">Resonance</span>
                    </div>
                  </button>
                  <button className="flex items-center gap-4 text-airra-muted hover:text-airra-primary transition-all group">
                    <div className="w-14 h-14 rounded-2xl bg-airra-bg dark:bg-zinc-800 group-hover:bg-airra-primary/10 transition-all flex items-center justify-center">
                      <MessageSquare size={24} />
                    </div>
                    <div className="flex flex-col items-start text-left">
                       <span className="text-sm font-black uppercase tracking-widest">Support</span>
                       <span className="text-[9px] font-bold uppercase tracking-widest opacity-40">Transmit Resonance</span>
                    </div>
                  </button>
                  <div className="flex-1" />
                  <button className="text-airra-muted hover:text-airra-text dark:hover:text-white transition-all">
                    <Info size={18} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
