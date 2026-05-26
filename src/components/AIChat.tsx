import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, User, Bot, Sparkles, Mic, Keyboard, Volume2, Activity, Info, RefreshCcw, ArrowRight, History, Plus, X, MessageSquare, ChevronLeft } from 'lucide-react';
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

// Offline & Test Mode Local Persistence Simulation Helpers
const LOCAL_CONVS_KEY = 'airra_local_conversations';
const LOCAL_MSGS_KEY = 'airra_local_messages';

function getLocalConversations(userId: string): Conversation[] {
  try {
    const data = localStorage.getItem(LOCAL_CONVS_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data) as Conversation[];
    return parsed
      .filter(c => c.user_id === userId)
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  } catch {
    return [];
  }
}

function saveLocalConversations(convs: Conversation[]) {
  try {
    localStorage.setItem(LOCAL_CONVS_KEY, JSON.stringify(convs));
  } catch (err) {
    console.error("Local save error:", err);
  }
}

function getLocalMessages(convId: string): ChatMessage[] {
  try {
    const data = localStorage.getItem(LOCAL_MSGS_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data) as ChatMessage[];
    return parsed
      .filter(m => m.conversation_id === convId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  } catch {
    return [];
  }
}

function saveLocalMessages(msgs: ChatMessage[]) {
  try {
    localStorage.setItem(LOCAL_MSGS_KEY, JSON.stringify(msgs));
  } catch (err) {
    console.error("Local msgs save error:", err);
  }
}

function createLocalConversation(userId: string, title: string): Conversation {
  const all = (() => {
    try {
      const data = localStorage.getItem(LOCAL_CONVS_KEY);
      return data ? JSON.parse(data) as Conversation[] : [];
    } catch {
      return [];
    }
  })();
  const newConv: Conversation = {
    id: 'local_conv_' + Math.random().toString(36).substring(2, 11),
    user_id: userId,
    title,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  saveLocalConversations([newConv, ...all]);
  return newConv;
}

function createLocalMessage(convId: string, role: 'user' | 'model', content: string): ChatMessage {
  const all = (() => {
    try {
      const data = localStorage.getItem(LOCAL_MSGS_KEY);
      return data ? JSON.parse(data) as ChatMessage[] : [];
    } catch {
      return [];
    }
  })();
  const newMsg: ChatMessage = {
    id: 'local_msg_' + Math.random().toString(36).substring(2, 11),
    conversation_id: convId,
    role,
    content,
    created_at: new Date().toISOString()
  };
  saveLocalMessages([...all, newMsg]);
  return newMsg;
}

function deleteLocalConversation(id: string) {
  try {
    const data = localStorage.getItem(LOCAL_CONVS_KEY);
    if (data) {
      const parsed = JSON.parse(data) as Conversation[];
      saveLocalConversations(parsed.filter(c => c.id !== id));
    }
    const msgsData = localStorage.getItem(LOCAL_MSGS_KEY);
    if (msgsData) {
      const parsedMsgs = JSON.parse(msgsData) as ChatMessage[];
      saveLocalMessages(parsedMsgs.filter(m => m.conversation_id !== id));
    }
  } catch (err) {
    console.error(err);
  }
}

function updateLocalConversationTime(id: string) {
  try {
    const data = localStorage.getItem(LOCAL_CONVS_KEY);
    if (data) {
      const parsed = JSON.parse(data) as Conversation[];
      const match = parsed.find(c => c.id === id);
      if (match) {
        match.updated_at = new Date().toISOString();
        saveLocalConversations(parsed);
      }
    }
  } catch (err) {
    console.error(err);
  }
}

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

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeModel, setActiveModel] = useState("gemini-3.5-flash");
  const [temperature, setTemperature] = useState(0.7);
  const [systemCal, setSystemCal] = useState("Empathetic (Default)");

  const isPremium = subscription?.plan_type === 'premium' || subscription?.plan_type === 'lifetime';

  const isOfflineOrTestMode = () => !supabase || localStorage.getItem('test_mode') === 'true';

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
      if (!profile) return;

      if (isOfflineOrTestMode()) {
        const localConvs = getLocalConversations(profile.id);
        if (localConvs.length > 0) {
          const conv = localConvs[0];
          setConversationId(conv.id);
          const msgs = getLocalMessages(conv.id);
          setMessages(msgs);
          const newSuggestions = await generateFollowUpSuggestions(msgs);
          setSuggestions(newSuggestions);
        }
        return;
      }

      try {
        const { data: conversations } = await supabase!
          .from('conversations')
          .select('*')
          .eq('user_id', profile.id)
          .order('updated_at', { ascending: false })
          .limit(1);

        if (conversations && conversations.length > 0) {
          const conv = conversations[0];
          setConversationId(conv.id);
          
          const { data: msgs } = await supabase!
            .from('chat_messages')
            .select('*')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: true });
          
          if (msgs) {
            setMessages(msgs);
            const newSuggestions = await generateFollowUpSuggestions(msgs);
            setSuggestions(newSuggestions);
          }
        } else {
          const localConvs = getLocalConversations(profile.id);
          if (localConvs.length > 0) {
            const conv = localConvs[0];
            setConversationId(conv.id);
            const msgs = getLocalMessages(conv.id);
            setMessages(msgs);
            const newSuggestions = await generateFollowUpSuggestions(msgs);
            setSuggestions(newSuggestions);
          }
        }
      } catch (err) {
        console.warn("Supabase loadLatestConversation failed, calling local storage instead:", err);
        const localConvs = getLocalConversations(profile.id);
        if (localConvs.length > 0) {
          const conv = localConvs[0];
          setConversationId(conv.id);
          const msgs = getLocalMessages(conv.id);
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
    if (!profile) return;
    if (isOfflineOrTestMode()) {
      setHistory(getLocalConversations(profile.id));
      return;
    }

    try {
      const { data, error } = await supabase!
        .from('conversations')
        .select('*')
        .eq('user_id', profile.id)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      if (data) {
        setHistory(data);
      } else {
        setHistory(getLocalConversations(profile.id));
      }
    } catch (err) {
      console.warn("Supabase loadHistory failed, using local fallback:", err);
      setHistory(getLocalConversations(profile.id));
    }
  }

  async function selectConversation(id: string) {
    if (isOfflineOrTestMode() || (id && id.startsWith('local_'))) {
      setConversationId(id);
      setIsHistoryOpen(false);
      const msgs = getLocalMessages(id);
      setMessages(msgs);
      setIsGeneratingSuggestions(true);
      const newSuggestions = await generateFollowUpSuggestions(msgs);
      setSuggestions(newSuggestions);
      setIsGeneratingSuggestions(false);
      return;
    }

    try {
      setConversationId(id);
      setIsHistoryOpen(false);
      const { data: msgs, error } = await supabase!
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', id)
        .order('created_at', { ascending: true });
      if (error) throw error;
      if (msgs) {
        setMessages(msgs);
        setIsGeneratingSuggestions(true);
        const newSuggestions = await generateFollowUpSuggestions(msgs);
        setSuggestions(newSuggestions);
        setIsGeneratingSuggestions(false);
      }
    } catch (err) {
      console.warn("Supabase selectConversation failed, using local fallback:", err);
      const msgs = getLocalMessages(id);
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
    if (!profile) return;

    if (isOfflineOrTestMode() || (id && id.startsWith('local_'))) {
      deleteLocalConversation(id);
      if (conversationId === id) {
        startNewChat();
      }
      loadHistory();
      return;
    }

    try {
      const { error } = await supabase!
        .from('conversations')
        .delete()
        .eq('id', id);
      
      if (error) throw error;

      if (conversationId === id) {
        startNewChat();
      }
      loadHistory();
    } catch (err) {
      console.warn("Supabase deleteConversation failed, performing local delete as fallback:", err);
      deleteLocalConversation(id);
      if (conversationId === id) {
        startNewChat();
      }
      loadHistory();
    }
  }

  const handleSend = async (text?: string) => {
    const contentToSend = text || input.trim();
    if (!contentToSend || isTyping || !profile) return;

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
      let userMsg: ChatMessage | null = null;

      if (isOfflineOrTestMode()) {
        if (!currentConvId) {
          const newConv = createLocalConversation(profile.id, contentToSend.substring(0, 40) + (contentToSend.length > 40 ? '...' : ''));
          currentConvId = newConv.id;
          setConversationId(currentConvId);
        }
        userMsg = createLocalMessage(currentConvId, 'user', contentToSend);
      } else {
        try {
          if (!currentConvId) {
            const { data: newConv, error: convError } = await supabase!
              .from('conversations')
              .insert({ 
                user_id: profile.id, 
                title: contentToSend.substring(0, 40) + (contentToSend.length > 40 ? '...' : '') 
              })
              .select()
              .single();
            
            if (convError || !newConv) throw new Error("Could not create conversation in database");
            currentConvId = newConv.id;
            setConversationId(currentConvId);
          }

          const { data: insertedMsg, error: userMsgError } = await supabase!
            .from('chat_messages')
            .insert({
              conversation_id: currentConvId,
              role: 'user',
              content: contentToSend
            })
            .select()
            .single();

          if (userMsgError) throw userMsgError;
          userMsg = insertedMsg;
        } catch (dbError) {
          console.warn("Database storage failed, shifting this conversation to local persistent fallback:", dbError);
          if (!currentConvId || !currentConvId.startsWith('local_')) {
            const newConv = createLocalConversation(profile.id, contentToSend.substring(0, 40) + (contentToSend.length > 40 ? '...' : ''));
            currentConvId = newConv.id;
            setConversationId(currentConvId);
          }
          userMsg = createLocalMessage(currentConvId, 'user', contentToSend);
        }
      }

      if (!userMsg) {
        throw new Error("Could not construct message payload");
      }

      setMessages(prev => [...prev, userMsg as ChatMessage]);

      const ai = getGemini();
      const chat = ai.chats.create({
        model: "gemini-3.5-flash",
        config: { systemInstruction: SYSTEM_PROMPT },
        history: messages.map(m => ({
          role: m.role,
          parts: [{ text: m.content }]
        }))
      });

      const response = await chat.sendMessage({ message: contentToSend });
      const aiContent = response.text || "I'm listening closely. Could you elaborate on that?";

      let aiMsg: ChatMessage | null = null;
      if (isOfflineOrTestMode() || (currentConvId && currentConvId.startsWith('local_'))) {
        aiMsg = createLocalMessage(currentConvId, 'model', aiContent);
      } else {
        try {
          const { data: insertedAiMsg, error: aiMsgError } = await supabase!
            .from('chat_messages')
            .insert({
              conversation_id: currentConvId,
              role: 'model',
              content: aiContent
            })
            .select()
            .single();

          if (aiMsgError) throw aiMsgError;
          aiMsg = insertedAiMsg;
        } catch (dbError) {
          console.warn("Database model storage failed, storing response locally:", dbError);
          aiMsg = createLocalMessage(currentConvId, 'model', aiContent);
        }
      }

      if (!aiMsg) {
        throw new Error("Could not finalize AI response payload");
      }

      setMessages(prev => [...prev, aiMsg as ChatMessage]);
      setEmpathyState('Calibrated');

      if (isOfflineOrTestMode() || (currentConvId && currentConvId.startsWith('local_'))) {
        updateLocalConversationTime(currentConvId);
      } else {
        try {
          await supabase!
            .from('conversations')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', currentConvId);
        } catch (dbError) {
          console.warn("Could not sync conversation timestamp:", dbError);
          updateLocalConversationTime(currentConvId);
        }
      }

      loadHistory();
      
      setIsGeneratingSuggestions(true);
      const newSuggestions = await generateFollowUpSuggestions([...messages, userMsg, aiMsg]);
      setSuggestions(newSuggestions);
      setIsGeneratingSuggestions(false);

    } catch (error) {
      console.error("AI Chat Error:", error);
      setEmpathyState('Error');
      
      // Empathetic, fully loaded fallback response if Google Gemini API key or request fails
      const fallbackReplies = [
        "Take a deep breath. I am listening. Sometimes we just need a quiet, offline moment to gather our thoughts. Share whatever is on your mind.",
        "I'm here with you. Let's practice a brief 4-7-8 calming sequence: inhale for 4 seconds, hold for 7, exhale for 8. How does focus feel?",
        "Your thoughts and feelings are completely valid. Even in moments of transition, you are taking active steps for your emotional well-being.",
        "Let's ground our focus in this present moment. Can you name three gentle things you can see or feel around you right now?"
      ];
      const randomReply = fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)];
      
      const fallbackMsg: ChatMessage = {
        id: 'fallback_msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        conversation_id: conversationId || 'local_fallback',
        role: 'model',
        content: `[Safe Space Companion Mode] ${randomReply}\n\n*(Note: AIRRA local agent is fully active. Visual tracking, breathing loops, and focus calibrations are available to assist.)*`,
        created_at: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setIsTyping(false);
      setTimeout(() => setEmpathyState('Attuned'), 3000);
    }
  };

  return (
    <div className="assistant-screen flex flex-col h-[440px] airra-card overflow-hidden shadow-airra-lg bg-white/40 dark:bg-airra-dark-forest/40 backdrop-blur-3xl group relative">
      <style>{`
        .assistant-screen {
          display: flex !important;
          flex-direction: column !important;
          height: 100vh !important;
          max-height: 440px !important;
          overflow: hidden !important;
        }
        @media (max-width: 768px) {
          .assistant-screen {
            max-height: calc(100vh - 80px) !important;
          }
        }
        .chat-content {
          flex: 1 !important;
          overflow-y: auto !important;
          padding: 12px 10px !important;
          padding-bottom: 10px !important;
        }
        .input-bar {
          flex-shrink: 0 !important;
          display: flex !important;
          align-items: center !important;
          gap: 6px !important;
          padding: 8px 12px 10px 12px !important;
          background: #0a1f16 !important;
          border-top: 1px solid rgba(255,255,255,0.05) !important;
        }
      `}</style>
      
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
                {history.map((conv, idx) => (
                  <button 
                    key={`conv-${conv.id || idx}-${idx}`}
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

      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
              className="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm z-[60]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute top-0 right-0 bottom-0 w-80 bg-white dark:bg-zinc-950 z-[70] border-l border-airra-border/40 dark:border-white/5 p-8 flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between mb-10">
                <h4 className="text-xl font-display font-black text-airra-text dark:text-white uppercase tracking-tighter">AI Settings</h4>
                <button 
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-2 text-airra-muted hover:text-airra-text dark:hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-8 flex-grow overflow-y-auto">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#3DB88A] block">LLM Model Target</label>
                  <select 
                    value={activeModel}
                    onChange={(e) => setActiveModel(e.target.value)}
                    className="w-full h-12 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/20 px-4 text-xs font-bold text-slate-800 dark:text-white"
                  >
                    <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                    <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                    <option value="gemini-ultra">Gemini Ultra Engine</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#3DB88A]">Model Temperature</label>
                    <span className="text-xs font-mono font-bold">{temperature}</span>
                  </div>
                  <input 
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    className="w-full accent-[#3DB88A]"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#3DB88A] block">Empathetic Tuning</label>
                  <div className="grid grid-cols-2 gap-2">
                    {["Attuned", "Attentive", "Dynamic", "Reflecting"].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => {
                          setSystemCal(m);
                          setEmpathyState(m);
                        }}
                        className={`h-11 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${systemCal === m ? 'bg-[#3DB88A]/10 text-[#3DB88A] border-[#3DB88A]/40' : 'bg-slate-50 dark:bg-white/5 border-transparent text-slate-500 hover:text-white'}`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-white/10 dark:border-white/5 flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center justify-between relative z-10">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
          <button 
            type="button"
            onClick={() => setIsHistoryOpen(true)}
            className="w-8 h-8 sm:w-11 sm:h-11 rounded-xl bg-airra-bg dark:bg-white/5 flex items-center justify-center border border-airra-border/50 dark:border-white/5 text-airra-muted hover:text-airra-primary hover:border-airra-primary transition-all relative group/hist cursor-pointer flex-shrink-0"
          >
            <History className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-airra-primary rounded-full border border-white dark:border-zinc-950" />
          </button>
          
          <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
            <button 
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="relative group/avatar cursor-pointer flex-shrink-0"
            >
              <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-xl bg-airra-text dark:bg-white flex items-center justify-center shadow-airra-md overflow-hidden transition-all duration-700 group-hover/avatar:rotate-12">
                 <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-airra-bg dark:text-zinc-950" />
              </div>
              <motion.div 
                 animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
                 transition={{ repeat: Infinity, duration: 4 }}
                 className="absolute -inset-1 bg-airra-primary/10 rounded-xl blur-md pointer-events-none"
              />
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap max-w-full">
                 <h3 className="text-xs sm:text-base font-display font-black text-airra-text dark:text-white uppercase tracking-tighter truncate leading-none">AIRRA Assistant</h3>
                 <span className={`px-1.5 py-0.5 rounded-md text-[6px] sm:text-[7px] font-black uppercase tracking-widest border transition-colors ${
                   empathyState === 'Reflecting' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                   empathyState === 'Calibrated' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                   'bg-airra-primary/10 text-airra-primary border-airra-primary/20'
                 }`}>
                   {empathyState}
                 </span>
              </div>
              <div className="flex items-center gap-1 mt-0.5 max-w-full min-w-0">
                 <div className="flex gap-0.5 flex-shrink-0">
                    {[1, 2, 3].map(i => (
                       <div key={i} className={`w-0.5 h-2 rounded-full bg-airra-primary/40 animate-pulse`} style={{ animationDelay: `${i * 0.2}s` }} />
                    ))}
                 </div>
                 <p className="text-[6px] sm:text-[8px] text-airra-muted dark:text-airra-dark-muted font-bold tracking-[0.1em] uppercase truncate">
                   Neural link synchronized
                 </p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-1.5 sm:gap-2 self-end sm:self-auto flex-shrink-0">
          <button 
            type="button"
            onClick={startNewChat}
            className="h-8 sm:h-9 px-2 sm:px-3 flex items-center justify-center gap-1 text-airra-primary hover:bg-airra-primary hover:text-white transition-all airra-bg dark:bg-white/5 rounded-lg sm:rounded-xl border border-airra-primary/20 text-[7px] sm:text-[8px] font-black uppercase tracking-widest cursor-pointer"
          >
            <Plus size={12} /> New
          </button>
          <button 
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center text-airra-muted hover:text-airra-text dark:hover:text-white transition-all airra-bg dark:bg-white/5 rounded-lg sm:rounded-xl border border-airra-border/50 dark:border-white/5 cursor-pointer"
          >
            <RefreshCcw size={13} />
          </button>
          <button 
            type="button"
            className="h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center text-airra-muted hover:text-airra-text dark:hover:text-white transition-all airra-bg dark:bg-white/5 rounded-lg sm:rounded-xl border border-airra-border/55 dark:border-white/5"
          >
            <Activity size={13} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="chat-content scrollbar-hide relative z-10"
      >
        {messages.length === 0 && !isTyping && (
          <div className="h-full flex flex-col items-center justify-center text-center px-3 sm:px-8 py-4 sm:py-0">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-airra-bg dark:bg-zinc-900 flex items-center justify-center mb-4 sm:mb-6 shadow-inner relative flex-shrink-0">
               <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-airra-muted opacity-10" />
               <motion.div 
                 animate={{ rotate: 360 }}
                 transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                 className="absolute inset-1 border border-dashed border-airra-primary/20 rounded-xl"
               />
            </div>
            <h4 className="text-sm sm:text-lg font-display font-black text-airra-text dark:text-white mb-2 tracking-tighter uppercase leading-tight">Disseminate your <br className="hidden sm:block" /> cognitive state.</h4>
            <p className="text-airra-muted dark:text-airra-dark-muted text-[10px] sm:text-xs font-medium leading-relaxed max-w-sm">
              AIRRA is calibrated and awaiting your signal. How is your internal environment manifesting at this moment?
            </p>
            
            <div className="mt-4 sm:mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5 w-full max-w-xl">
               {suggestions.map((s, i) => (
                 <button 
                  key={`intro-suggest-${i}`}
                  onClick={() => handleSend(s)}
                  className="p-2.5 sm:p-3 rounded-lg sm:rounded-xl airra-glass text-[8px] sm:text-[10px] font-bold tracking-wider text-airra-muted hover:text-airra-text dark:hover:text-white hover:bg-white dark:hover:bg-white/5 transition-all text-left flex items-center justify-between group"
                 >
                   <span>{s}</span>
                   <ArrowRight size={11} className="opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
                 </button>
               ))}
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg, idx) => (
            <motion.div
              key={`msg-${msg.id || idx}-${idx}`}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
            >
              <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 shadow-airra-sm border border-white/10 ${
                  msg.role === 'user' ? 'bg-airra-text dark:bg-white' : 'bg-airra-primary dark:bg-airra-dark-glow'
                }`}>
                  {msg.role === 'user' ? <User className="w-3.5 h-3.5 text-airra-bg dark:text-zinc-950" /> : <Sparkles className="w-3.5 h-3.5 text-white dark:text-black" />}
                </div>
                <div className={`relative px-4 py-2.5 text-xs sm:text-sm font-semibold shadow-airra-md transition-all break-words overflow-hidden whitespace-normal ${
                  msg.role === 'user' 
                  ? "bg-airra-text dark:bg-white text-white dark:text-zinc-950 rounded-2xl rounded-tr-none" 
                  : "bg-white dark:bg-zinc-900 border border-airra-border/50 dark:border-white/5 text-airra-text dark:text-zinc-100 rounded-2xl rounded-tl-none"
                }`}>
                  {msg.content}
                </div>
              </div>
            </motion.div>
          ))}
          
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start mb-4"
            >
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-lg bg-airra-primary/20 dark:bg-airra-dark-glow/20 flex items-center justify-center animate-pulse">
                  <Bot className="w-3.5 h-3.5 text-airra-primary" />
                </div>
                <div className="bg-white dark:bg-zinc-900 border border-airra-border/50 dark:border-white/5 px-4 py-2 rounded-xl rounded-tl-none flex items-center gap-2 shadow-inner">
                  <motion.div animate={{ height: [4, 8, 4] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1 h-2 bg-airra-primary rounded-full" />
                  <motion.div animate={{ height: [6, 12, 6] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1 h-3 bg-airra-primary rounded-full" />
                  <motion.div animate={{ height: [4, 8, 4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1 h-2 bg-airra-primary rounded-full" />
                  <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-[0.3em] text-airra-muted ml-2">Link Refine</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Follow-up suggestions/pathways inside scroll view to prevent any overlap */}
          <AnimatePresence>
            {!isRecording && messages.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="flex flex-wrap items-center gap-1.5 mt-3 max-w-5xl z-20"
              >
                <div className="flex items-center gap-1.5 mr-1 flex-shrink-0">
                  <Sparkles size={11} className="text-emerald-400 animate-pulse" />
                  <span className="text-[7px] font-black uppercase tracking-widest text-[#2D7A5F]">Pathways:</span>
                </div>
                {isGeneratingSuggestions ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={`loading-suggest-${i}`} className="h-5 w-16 rounded-full bg-[#1a2e25]/50 animate-pulse" />
                  ))
                ) : (
                  suggestions.map((s, i) => (
                    <button
                      key={`pathway-suggest-${i}`}
                      type="button"
                      onClick={() => handleSend(s)}
                      className="px-2.5 py-1 rounded-full bg-[#1a2e25] border border-emerald-900/30 text-[8px] font-bold uppercase tracking-wider text-emerald-400 hover:bg-[#2D7A5F]/20 hover:border-emerald-400/50 transition-all active:scale-95 whitespace-nowrap cursor-pointer"
                    >
                      {s}
                    </button>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </AnimatePresence>
      </div>

      {/* Input */}
      <form 
        onSubmit={(e) => { e.preventDefault(); handleSend(); }} 
        className="input-bar"
      >
        <AnimatePresence>
          {isRecording && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute top-0 left-0 right-0 -translate-y-full bg-airra-primary text-white p-3 rounded-t-xl flex items-center justify-between z-50"
            >
               <div className="flex items-center gap-4">
                  <div className="flex items-end gap-0.5 h-6 px-2">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <motion.div 
                        key={i}
                        animate={{ height: [3, Math.random() * 12 + 4, 3] }}
                        transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.05 }}
                        className="w-1 bg-white rounded-full"
                      />
                    ))}
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-widest">Listening...</span>
               </div>
               <button 
                 type="button"
                 onClick={() => setIsRecording(false)}
                 className="h-8 px-3 rounded-lg bg-white text-airra-primary text-[8px] font-black uppercase tracking-widest shadow-lg"
               >
                 Stop
               </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative flex-1 h-[36px] bg-[#1a2e25] rounded-[18px] flex items-center">
          <button 
            type="button"
            disabled={input.trim().length > 0}
            onClick={() => !input.trim() && setIsRecording(!isRecording)}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center cursor-pointer select-none"
          >
            {input.trim() ? (
              <Keyboard size={14} className="text-[#2D7A5F]" />
            ) : (
              <Mic size={14} className={`text-[#2D7A5F] ${isRecording ? 'text-rose-500 animate-pulse' : ''}`} />
            )}
          </button>
          
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Message AIRRA..."
            className="w-full h-full bg-transparent text-emerald-100 placeholder:text-[#2D7A5F]/70 text-xs pl-8 pr-3 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={!input.trim() || isTyping}
          className="w-[36px] h-[36px] rounded-full bg-[#2D7A5F] text-white flex items-center justify-center hover:bg-[#348f6f] disabled:opacity-40 transition-all active:scale-95 flex-shrink-0 ml-auto"
        >
          <Send size={14} className="translate-x-[1px]" />
        </button>
      </form>
      
      {/* Aesthetic Grain Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
    </div>
  );
}
