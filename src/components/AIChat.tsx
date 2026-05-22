import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, User, Bot, Sparkles, Mic, Volume2, Activity, Info, RefreshCcw, ArrowRight, History, Plus, X, MessageSquare, ChevronLeft } from 'lucide-react';
import { getGemini, SYSTEM_PROMPT, generateFollowUpSuggestions } from '../services/geminiService';
import { supabase } from '../lib/supabase';
import { useUserStore } from '../services/useUserStore';
import { useNavigate } from 'react-router-dom';
import { ChatMessage, Conversation } from '../types';

const SUGGESTIONS = [
  "How can I process today's stress?",
  "Refine my focus protocols",
  "Synchronize my sleep pattern",
  "AI Guided Breathing Session"
];

export default function AIChat() {
  const { profile, subscription } = useUserStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [empathyState, setEmpathyState] = useState('Attuned');
  const [history, setHistory] = useState<Conversation[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>(SUGGESTIONS);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const isPremium = subscription?.plan_type === 'premium' || subscription?.plan_type === 'lifetime';

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isTyping]);

  useEffect(() => {
    async function loadLatestConversation() {
      if (!profile || !supabase) return;

      const { data: conversations } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', profile.id)
        .order('updated_at', { ascending: false })
        .limit(1);

      if (conversations && conversations.length > 0) {
        const conv = conversations[0];
        setConversationId(conv.id);
        
        const { data: msgs } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: true });
        
        if (msgs) {
          setMessages(msgs);
          const newSuggestions = await generateFollowUpSuggestions(msgs);
          setSuggestions(newSuggestions);
        }
      }
    }
    loadLatestConversation();
    loadHistory();
  }, [profile]);

  async function loadHistory() {
    if (!profile || !supabase) return;
    const { data } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', profile.id)
      .order('updated_at', { ascending: false });
    if (data) setHistory(data);
  }

  async function selectConversation(id: string) {
    if (!supabase) return;
    setConversationId(id);
    setIsHistoryOpen(false);
    const { data: msgs } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true });
    if (msgs) {
      setMessages(msgs);
      setIsGeneratingSuggestions(true);
      const newSuggestions = await generateFollowUpSuggestions(msgs);
      setSuggestions(newSuggestions);
      setIsGeneratingSuggestions(false);
    }
  }

  function startNewChat() {
    setConversationId(null);
    setMessages([]);
    setSuggestions(SUGGESTIONS);
    setIsHistoryOpen(false);
  }

  async function deleteConversation(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!supabase || !profile) return;
    
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error("Delete error:", error);
      return;
    }

    if (conversationId === id) {
      startNewChat();
    }
    loadHistory();
  }

  const handleSend = async (text?: string) => {
    const contentToSend = text || input.trim();
    if (!contentToSend || isTyping || !profile || !supabase) return;

    if (!isPremium && messages.length >= 10) {
      alert("You've reached the free chat limit. Upgrade for unlimited sessions.");
      navigate('/pricing');
      return;
    }

    setInput('');
    setIsTyping(true);
    setEmpathyState('Reflecting');

    try {
      let currentConvId = conversationId;

      if (!currentConvId) {
        const { data: newConv, error: convError } = await supabase
          .from('conversations')
          .insert({ 
            user_id: profile.id, 
            title: contentToSend.substring(0, 40) + (contentToSend.length > 40 ? '...' : '') 
          })
          .select()
          .single();
        
        if (convError || !newConv) throw new Error("Could not create conversation");
        currentConvId = newConv.id;
        setConversationId(currentConvId);
      }

      const { data: userMsg, error: userMsgError } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: currentConvId,
          role: 'user',
          content: contentToSend
        })
        .select()
        .single();

      if (userMsgError) throw userMsgError;
      setMessages(prev => [...prev, userMsg]);

      const ai = getGemini();
      const chat = ai.chats.create({
        model: "gemini-3-flash-preview",
        config: { systemInstruction: SYSTEM_PROMPT },
        history: messages.map(m => ({
          role: m.role,
          parts: [{ text: m.content }]
        }))
      });

      const response = await chat.sendMessage({ message: contentToSend });
      const aiContent = response.text || "I'm listening closely. Could you elaborate on that?";

      const { data: aiMsg, error: aiMsgError } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: currentConvId,
          role: 'model',
          content: aiContent
        })
        .select()
        .single();

      if (aiMsgError) throw aiMsgError;
      setMessages(prev => [...prev, aiMsg]);
      setEmpathyState('Calibrated');

      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', currentConvId);

      loadHistory();
      
      setIsGeneratingSuggestions(true);
      const newSuggestions = await generateFollowUpSuggestions([...messages, userMsg, aiMsg]);
      setSuggestions(newSuggestions);
      setIsGeneratingSuggestions(false);

    } catch (error) {
      console.error("AI Chat Error:", error);
      setEmpathyState('Error');
    } finally {
      setIsTyping(false);
      setTimeout(() => setEmpathyState('Attuned'), 3000);
    }
  };

  return (
    <div className="flex flex-col h-[800px] airra-card overflow-hidden shadow-airra-xl bg-white/40 dark:bg-airra-dark-forest/40 backdrop-blur-3xl group relative">
      
      {/* History Sidebar/Drawer */}
      <AnimatePresence>
        {isHistoryOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsHistoryOpen(false)}
              className="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm z-[60]"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute top-0 left-0 bottom-0 w-80 bg-white dark:bg-zinc-950 z-[70] border-r border-airra-border/40 dark:border-white/5 p-8 flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between mb-10">
                <h4 className="text-xl font-display font-black text-airra-text dark:text-white uppercase tracking-tighter">History</h4>
                <button 
                  onClick={() => setIsHistoryOpen(false)}
                  className="p-2 text-airra-muted hover:text-airra-text dark:hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <button 
                onClick={startNewChat}
                className="w-full h-14 rounded-2xl bg-airra-primary/10 text-airra-primary border border-airra-primary/20 flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest hover:bg-airra-primary hover:text-white transition-all mb-8 active:scale-95"
              >
                <Plus size={16} /> New Session
              </button>

              <div className="flex-grow overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                {history.map((conv) => (
                  <button 
                    key={conv.id}
                    onClick={() => selectConversation(conv.id)}
                    className={`w-full p-6 bg-airra-bg dark:bg-white/5 rounded-2xl text-left border transition-all group flex items-center justify-between ${
                      conversationId === conv.id ? 'border-airra-primary/50 ring-1 ring-airra-primary/20' : 'border-transparent hover:border-airra-primary/30'
                    }`}
                  >
                    <div className="flex items-start gap-4 flex-grow min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                        conversationId === conv.id ? 'bg-airra-primary text-white' : 'bg-white dark:bg-zinc-900 text-airra-muted group-hover:text-airra-primary'
                      }`}>
                         <MessageSquare size={16} />
                      </div>
                      <div className="flex-grow min-w-0">
                        <p className={`text-xs font-bold leading-tight line-clamp-1 dark:text-zinc-100 ${conversationId === conv.id ? 'text-zinc-950' : 'text-airra-text'}`}>
                          {conv.title || "Untitled Session"}
                        </p>
                        <p className="text-[9px] text-airra-muted font-bold uppercase tracking-widest mt-1">
                          {new Date(conv.updated_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => deleteConversation(conv.id, e)}
                      className="p-2 text-airra-muted hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <X size={14} />
                    </button>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="p-10 border-b border-white/10 dark:border-white/5 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setIsHistoryOpen(true)}
            className="w-16 h-16 rounded-[40%] bg-airra-bg dark:bg-white/5 flex items-center justify-center border border-airra-border/50 dark:border-white/5 text-airra-muted hover:text-airra-primary hover:border-airra-primary transition-all relative group/hist"
          >
            <History className="w-7 h-7" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-airra-primary rounded-full border-2 border-white dark:border-zinc-950" />
          </button>
          <div className="flex items-center gap-6">
            <div className="relative group/avatar">
            <div className="w-16 h-16 rounded-[40%] bg-airra-text dark:bg-white flex items-center justify-center shadow-airra-lg overflow-hidden transition-all duration-700 group-hover/avatar:rotate-12">
               <Sparkles className="w-8 h-8 text-airra-bg dark:text-zinc-950" />
            </div>
            <motion.div 
               animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
               transition={{ repeat: Infinity, duration: 4 }}
               className="absolute -inset-2 bg-airra-primary/10 rounded-[40%] blur-xl pointer-events-none"
            />
          </div>
          <div>
            <div className="flex items-center gap-3">
               <h3 className="text-2xl font-display font-black text-airra-text dark:text-white uppercase tracking-tighter">AIRRA Assistant</h3>
               <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border transition-colors ${
                 empathyState === 'Reflecting' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                 empathyState === 'Calibrated' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                 'bg-airra-primary/10 text-airra-primary border-airra-primary/20'
               }`}>
                 {empathyState}
               </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
               <div className="flex gap-1">
                 {[1, 2, 3].map(i => (
                   <div key={i} className={`w-1 h-3 rounded-full bg-airra-primary/40 animate-pulse`} style={{ animationDelay: `${i * 0.2}s` }} />
                 ))}
               </div>
               <p className="text-[9px] text-airra-muted dark:text-airra-dark-muted font-black uppercase tracking-[0.3em]">
                 Neural Link Synchronized
               </p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex gap-4">
          <button 
            onClick={startNewChat}
            className="h-12 px-6 flex items-center justify-center gap-2 text-airra-primary hover:bg-airra-primary hover:text-white transition-all airra-bg dark:bg-white/5 rounded-2xl border border-airra-primary/20 text-[9px] font-black uppercase tracking-widest"
          >
            <Plus size={14} /> New
          </button>
          <button className="h-12 w-12 flex items-center justify-center text-airra-muted hover:text-airra-text dark:hover:text-white transition-all airra-bg dark:bg-white/5 rounded-2xl border border-airra-border/50 dark:border-white/5">
            <RefreshCcw size={18} />
          </button>
          <button className="h-12 w-12 flex items-center justify-center text-airra-muted hover:text-airra-text dark:hover:text-white transition-all airra-bg dark:bg-white/5 rounded-2xl border border-airra-border/50 dark:border-white/5">
            <Activity size={18} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-grow overflow-y-auto p-12 space-y-16 scrollbar-hide relative z-10"
      >
        {messages.length === 0 && !isTyping && (
          <div className="h-full flex flex-col items-center justify-center text-center px-12">
            <div className="w-32 h-32 rounded-[2.5rem] bg-airra-bg dark:bg-zinc-900 flex items-center justify-center mb-12 shadow-inner scale-110 relative">
               <Bot className="w-16 h-16 text-airra-muted opacity-10" />
               <motion.div 
                 animate={{ rotate: 360 }}
                 transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                 className="absolute inset-2 border-2 border-dashed border-airra-primary/20 rounded-[2.5rem]"
               />
            </div>
            <h4 className="text-4xl font-display font-black text-airra-text dark:text-white mb-6 tracking-tighter uppercase leading-[0.85]">Disseminate Your <br /> Cognitive State.</h4>
            <p className="text-airra-muted dark:text-airra-dark-muted text-lg font-medium leading-relaxed max-w-sm">
              AIRRA is calibrated and awaiting your signal. How is your internal environment manifesting at this moment?
            </p>
            
            <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-xl">
               {suggestions.map((s, i) => (
                 <button 
                  key={i}
                  onClick={() => handleSend(s)}
                  className="p-6 rounded-[1.5rem] airra-glass text-[10px] font-black uppercase tracking-widest text-airra-muted hover:text-airra-text dark:hover:text-white hover:bg-white dark:hover:bg-white/5 transition-all text-left flex items-center justify-between group"
                 >
                   {s}
                   <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
                 </button>
               ))}
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg, idx) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-8 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-14 h-14 rounded-[1.5rem] flex items-center justify-center flex-shrink-0 shadow-airra-md border border-white/10 ${
                  msg.role === 'user' ? 'bg-airra-text dark:bg-white' : 'bg-airra-primary dark:bg-airra-dark-glow'
                }`}>
                  {msg.role === 'user' ? <User className="w-6 h-6 text-airra-bg dark:text-zinc-950" /> : <Sparkles className="w-6 h-6 text-white dark:text-black" />}
                </div>
                <div className={`relative px-10 py-8 text-lg font-medium leading-[1.6] shadow-airra-xl transition-all ${
                  msg.role === 'user' 
                  ? "bg-airra-text dark:bg-white text-white dark:text-zinc-950 rounded-[3rem] rounded-tr-none" 
                  : "bg-white dark:bg-zinc-900 border border-airra-border/50 dark:border-white/5 text-airra-text dark:text-zinc-100 rounded-[3rem] rounded-tl-none"
                }`}>
                  {msg.content}
                </div>
              </div>
            </motion.div>
          ))}
          
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="flex gap-8">
                <div className="w-14 h-14 rounded-[1.5rem] bg-airra-primary/20 dark:bg-airra-dark-glow/20 flex items-center justify-center animate-pulse">
                  <Bot className="w-7 h-7 text-airra-primary" />
                </div>
                <div className="bg-white dark:bg-zinc-900 border border-airra-border/50 dark:border-white/5 px-12 py-8 rounded-[3rem] rounded-tl-none flex items-center gap-4 shadow-inner">
                  <motion.div animate={{ height: [8, 16, 8] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1 bg-airra-primary rounded-full" />
                  <motion.div animate={{ height: [12, 24, 12] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1 bg-airra-primary rounded-full" />
                  <motion.div animate={{ height: [8, 16, 8] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1 bg-airra-primary rounded-full" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-airra-muted ml-4">Refining Link</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input */}
      <form 
        onSubmit={(e) => { e.preventDefault(); handleSend(); }} 
        className="p-12 bg-white/60 dark:bg-zinc-950/60 border-t border-airra-border/40 dark:border-white/5 backdrop-blur-3xl relative z-10"
      >
        <AnimatePresence>
          {!isRecording && messages.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-wrap items-center gap-3 mb-6 max-w-5xl mx-auto"
            >
              <div className="flex items-center gap-2 mr-2">
                <Sparkles size={12} className="text-airra-primary" />
                <span className="text-[8px] font-black uppercase tracking-widest text-airra-muted">Pathways:</span>
              </div>
              {isGeneratingSuggestions ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-8 w-24 rounded-full bg-airra-bg dark:bg-white/5 animate-pulse" />
                ))
              ) : (
                suggestions.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSend(s)}
                    className="px-5 py-2.5 rounded-full airra-glass border border-airra-border/30 dark:border-white/5 text-[9px] font-black uppercase tracking-widest text-airra-muted hover:text-airra-primary hover:border-airra-primary/50 transition-all active:scale-95 whitespace-nowrap"
                  >
                    {s}
                  </button>
                ))
              )}
            </motion.div>
          )}
          {isRecording && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute top-0 left-0 right-0 -translate-y-full bg-airra-primary text-white p-8 rounded-t-[3rem] flex items-center justify-between"
            >
               <div className="flex items-center gap-6">
                  <div className="flex items-end gap-1 h-8 px-4">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <motion.div 
                        key={i}
                        animate={{ height: [4, Math.random() * 24 + 8, 4] }}
                        transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.05 }}
                        className="w-1.5 bg-white rounded-full"
                      />
                    ))}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest">Listening to Cognitive Pulse...</span>
               </div>
               <button 
                 type="button"
                 onClick={() => setIsRecording(false)}
                 className="h-12 px-6 rounded-xl bg-white text-airra-primary text-[10px] font-black uppercase tracking-widest shadow-lg"
               >
                 Stop & Process
               </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative flex items-center gap-6 max-w-5xl mx-auto">
          <div className="relative flex-grow group">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="What is manifesting in your internal environment?"
              className="w-full h-24 bg-airra-bg dark:bg-zinc-900 border border-airra-border/50 dark:border-white/5 rounded-[2rem] py-6 pl-10 pr-32 text-airra-text dark:text-white placeholder:text-airra-muted/40 focus:outline-none focus:border-airra-primary transition-all font-medium text-xl shadow-inner group-hover:bg-white dark:group-hover:bg-zinc-800"
            />
            <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2">
               <button 
                 type="button" 
                 onClick={() => setIsRecording(!isRecording)}
                 className={`h-14 w-14 rounded-2xl flex items-center justify-center transition-all ${isRecording ? 'bg-rose-500 text-white animate-pulse' : 'text-airra-muted hover:text-airra-primary hover:bg-airra-bg dark:hover:bg-white/5'}`}
               >
                  <Mic size={24} />
               </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="w-24 h-24 bg-airra-text dark:bg-white text-airra-bg dark:text-zinc-950 rounded-[2rem] flex items-center justify-center hover:scale-105 disabled:opacity-30 transition-all active:scale-95 group shadow-airra-xl"
          >
            <Send size={32} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          </button>
        </div>
      </form>
      
      {/* Aesthetic Grain Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
    </div>
  );
}
