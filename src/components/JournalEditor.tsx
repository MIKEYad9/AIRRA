import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { useUserStore } from '../services/useUserStore';
import { Save, X, Feather, Tag, Sparkles, Wand2, Info, ChevronRight, PenTool, Mic, MicOff } from 'lucide-react';
import { suggestMoodTag, transcribeAudio } from '../services/geminiService';

export default function JournalEditor({ onSave, onCancel }: { onSave: () => void; onCancel: () => void }) {
  const { profile } = useUserStore();
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [moodTag, setMoodTag] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [transcribing, setTranscribing] = useState(false);

  // Debounced AI mood auto-suggestion (Proactive)
  useEffect(() => {
    // Only auto-suggest if moodTag is empty and content has enough substance
    // Substantial entry defined as > 100 characters for better context
    if (!content.trim() || content.length < 100 || moodTag) {
      // If user typing prevents auto-suggest, clear any existing suggestion that wasn't applied
      if (aiSuggestion && moodTag) setAiSuggestion(null);
      return;
    }

    // Proactive suggestion after 5 seconds of inactivity
    const timer = setTimeout(async () => {
      if (suggesting || aiSuggestion) return;
      
      setSuggesting(true);
      try {
        const suggestion = await suggestMoodTag(content);
        // Double check moodTag is still empty before showing
        if (suggestion && !moodTag) {
          setAiSuggestion(suggestion);
        }
      } catch (error) {
        console.error("Auto-suggest error:", error);
      } finally {
        setSuggesting(false);
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [content, moodTag, aiSuggestion, suggesting]);

  // Handle manual mood tag entry
  const handleMoodTagChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMoodTag(value);
    // Ensure AI suggestion is cleared when user manually enters a tag
    if (aiSuggestion) {
      setAiSuggestion(null);
    }
  };

  const handleApplySuggestion = () => {
    if (aiSuggestion) {
      setMoodTag(aiSuggestion);
      setAiSuggestion(null);
    }
  };

  const handleSuggestMood = async () => {
    if (!content.trim()) return;
    setSuggesting(true);
    setAiSuggestion(null); // Clear previous suggestion
    try {
      const suggestion = await suggestMoodTag(content);
      if (suggestion) {
        setAiSuggestion(suggestion);
      }
    } catch (err) {
      console.error("Manual suggest error:", err);
    } finally {
      setSuggesting(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          setTranscribing(true);
          try {
            const transcription = await transcribeAudio(base64Audio, 'audio/webm');
            if (transcription) {
              setContent(prev => {
                const separator = prev.length > 0 ? '\n\n' : '';
                return prev + separator + transcription;
              });
            }
          } catch (err) {
            console.error("Transcription failed:", err);
          } finally {
            setTranscribing(false);
          }
        };
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access denied or error:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  const handleSave = async () => {
    if (!profile || !supabase || !content.trim()) return;
    setLoading(true);

    let finalMoodTag = moodTag.trim();
    if (!finalMoodTag && aiSuggestion) {
      finalMoodTag = aiSuggestion;
    } else if (!finalMoodTag) {
      finalMoodTag = 'Neural Fragment';
    }

    const { error } = await supabase
      .from('journals')
      .insert({
        user_id: profile.id,
        title: title.trim() || 'Untitled Reflection',
        content: content.trim(),
        mood_tag: finalMoodTag,
        created_at: new Date().toISOString()
      });

    if (!error) {
      onSave();
    }
    setLoading(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-zinc-950/40 backdrop-blur-xl"
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.98, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 30 }}
        className="w-full max-w-2xl bg-airra-bg dark:bg-zinc-900 border border-airra-border dark:border-zinc-800 rounded-[2.5rem] shadow-airra-xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Navigation / Header */}
        <div className="flex items-center justify-between p-8 md:p-10 border-b border-airra-border/50 dark:border-zinc-800/50">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-airra-text dark:bg-zinc-800 flex items-center justify-center text-airra-bg dark:text-zinc-200">
              <PenTool size={26} />
            </div>
            <div>
              <h3 className="text-2xl font-bold dark:text-white tracking-tight">Reflect.</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-airra-muted">Encrypted session</p>
            </div>
          </div>
          <button 
            onClick={onCancel}
            className="w-12 h-12 rounded-xl hover:bg-airra-bg dark:hover:bg-zinc-800 flex items-center justify-center text-airra-muted transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content Layer */}
        <div className="flex-1 overflow-y-auto airra-scrollbar p-8 md:p-10 space-y-10">
          <div className="space-y-4">
             <input 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="A title for this moment..."
                className="w-full bg-transparent border-none text-4xl font-display font-extrabold tracking-tight text-airra-text dark:text-white placeholder:text-airra-border dark:placeholder:text-zinc-800 focus:outline-none"
             />
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="relative flex-1">
                  <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-airra-muted" size={14} />
                  <input 
                    value={moodTag}
                    onChange={handleMoodTagChange}
                    placeholder="Mood tag..."
                    className="w-full h-11 bg-airra-bg dark:bg-zinc-800 border border-airra-border dark:border-zinc-700 rounded-xl pl-10 pr-10 text-xs font-bold uppercase tracking-widest text-airra-text dark:text-zinc-300 focus:outline-none focus:border-airra-primary/20 transition-all"
                  />
                  {moodTag && (
                    <button 
                      onClick={() => { setMoodTag(''); setAiSuggestion(null); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-airra-muted hover:text-airra-text transition-colors"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                <button 
                  onClick={handleSuggestMood}
                  disabled={suggesting || !content.trim()}
                  className="h-11 px-6 rounded-xl bg-airra-surface dark:bg-zinc-800 border border-airra-border dark:border-zinc-700 text-[10px] font-black uppercase tracking-widest text-airra-muted hover:text-airra-primary disabled:opacity-30 transition-all flex items-center justify-center gap-2 group"
                >
                  {suggesting ? (
                    <div className="w-3 h-3 border border-current/20 border-t-current rounded-full animate-spin" />
                  ) : (
                    <Sparkles size={14} className="group-hover:rotate-12 transition-transform" />
                  )}
                  Suggest
                </button>
                <button 
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={transcribing}
                  className={`h-11 w-11 rounded-xl border flex items-center justify-center transition-all ${
                    isRecording 
                    ? 'bg-red-500/10 border-red-500/50 text-red-500 animate-pulse' 
                    : 'bg-airra-surface dark:bg-zinc-800 border-airra-border dark:border-zinc-700 text-airra-muted hover:text-airra-primary'
                  } disabled:opacity-30`}
                  title={isRecording ? "Stop recording" : "Record audio"}
                >
                  {transcribing ? (
                    <div className="w-4 h-4 border-2 border-current/20 border-t-current rounded-full animate-spin" />
                  ) : isRecording ? (
                    <MicOff size={18} />
                  ) : (
                    <Mic size={18} />
                  )}
                </button>
             </div>

             <AnimatePresence>
                {aiSuggestion && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="p-5 rounded-[1.5rem] bg-airra-surface dark:bg-zinc-800 border border-airra-border dark:border-zinc-700 flex items-center justify-between shadow-airra-md group"
                  >
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-airra-primary/10 flex items-center justify-center text-airra-primary">
                         <Sparkles size={18} />
                       </div>
                       <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-airra-muted mb-0.5">Atmospheric Insight</p>
                          <p className="text-sm font-bold text-airra-text dark:text-white leading-none">
                             "{aiSuggestion}"
                          </p>
                       </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                         onClick={handleApplySuggestion}
                         className="h-10 px-5 rounded-xl bg-airra-text dark:bg-white text-airra-bg dark:text-zinc-900 text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all flex items-center gap-2 active:scale-95"
                      >
                         Apply <ChevronRight size={14} />
                      </button>
                      <button 
                         onClick={() => setAiSuggestion(null)}
                         className="w-10 h-10 rounded-xl bg-airra-bg dark:bg-zinc-900 border border-airra-border dark:border-zinc-700 flex items-center justify-center text-airra-muted hover:text-rose-500 transition-colors"
                         title="Dismiss suggestion"
                      >
                         <X size={14} />
                      </button>
                    </div>
                  </motion.div>
                )}
             </AnimatePresence>
          </div>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's unfolding in your mind?"
            className="w-full min-h-[300px] bg-transparent border-none text-airra-text dark:text-white placeholder:text-airra-muted/40 dark:placeholder:text-zinc-700 focus:outline-none resize-none font-serif text-2xl leading-relaxed italic"
            autoFocus={!isRecording}
          />
        </div>

        {/* Action Layer */}
        <div className="p-8 md:p-10 bg-airra-surface dark:bg-zinc-800/30 border-t border-airra-border dark:border-zinc-800/50 flex flex-col md:flex-row items-center gap-4">
           <button 
             onClick={onCancel}
             className="w-full md:w-auto px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest text-airra-muted hover:text-airra-text transition-colors"
           >
             Cancel
           </button>
           <button 
             onClick={handleSave}
             disabled={loading || !content.trim()}
             className="w-full md:flex-1 h-16 rounded-2xl bg-airra-text dark:bg-airra-dark-text text-airra-bg dark:text-airra-dark-bg font-black text-xs uppercase tracking-widest shadow-airra-xl hover:opacity-90 disabled:opacity-30 transition-all flex items-center justify-center gap-3"
           >
             {loading ? (
                <div className="w-5 h-5 border-2 border-current/20 border-t-current rounded-full animate-spin" />
             ) : (
                <>
                  <Save size={18} />
                  Synchronize record
                </>
             )}
           </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

