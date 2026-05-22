import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { useUserStore } from '../services/useUserStore';
import { BrainCircuit, Cloud, Sun, Moon, Wind, Leaf, Sparkles, ChevronRight, CheckCircle2 } from 'lucide-react';

export default function MentalHealthCheckIn({ onLogged }: { onLogged?: () => void }) {
  const { profile } = useUserStore();
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const moods = [
    { icon: <Cloud />, label: 'Overcast', intensity: 3, desc: 'Heavy cognitive load' },
    { icon: <Wind />, label: 'Turbulent', intensity: 4, desc: 'High neural activity' },
    { icon: <Leaf />, label: 'Grounded', intensity: 6, desc: 'Balanced baseline' },
    { icon: <Sun />, label: 'Radiant', intensity: 9, desc: 'Peak clarity achieved' },
    { icon: <Sparkles />, label: 'Flow', intensity: 10, desc: 'Optimal state' }
  ];

  const handleMoodSelect = async (idx: number) => {
    if (!profile || !supabase || loading) return;
    setSelectedMood(idx);
    setLoading(true);

    const moodObj = moods[idx];

    const { error } = await supabase
      .from('mood_logs')
      .insert({
        user_id: profile.id,
        mood: moodObj.label,
        intensity: moodObj.intensity,
        created_at: new Date().toISOString()
      });

    if (!error) {
      setSubmitted(true);
      if (onLogged) onLogged();
      setTimeout(() => {
        setSubmitted(false);
        setSelectedMood(null);
      }, 5000);
    }
    
    setLoading(false);
  };

  return (
    <div className="airra-card p-12 md:p-16 relative overflow-hidden group border-white/10 dark:border-white/5 bg-white/40 dark:bg-airra-dark-forest/40 backdrop-blur-3xl shadow-airra-xl">
      {/* Cinematic Ambient Glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-airra-primary/10 dark:bg-airra-dark-glow/10 blur-[150px] rounded-full pointer-events-none group-hover:bg-airra-primary/20 transition-all duration-[2000ms]" />
      <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none" />
      
      <AnimatePresence mode="wait">
        {!submitted ? (
          <motion.div 
            key="checkin"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative z-10"
          >
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-12">
              <div className="max-w-2xl space-y-8">
                <div className="inline-flex items-center gap-4 px-6 py-2 rounded-full airra-glass border border-airra-border/50 dark:border-white/5">
                  <div className="w-2 h-2 rounded-full bg-airra-primary dark:bg-airra-dark-glow animate-pulse shadow-[0_0_10px_rgba(45,106,79,0.5)]" />
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-airra-muted">Neural Health Diagnostic</span>
                </div>
                <h2 className="text-airra-title font-display font-black text-airra-text dark:text-white leading-[0.85] tracking-tighter uppercase">
                  Current <br />
                  <span className="font-serif italic font-normal text-airra-primary dark:text-airra-dark-glow normal-case tracking-tight">Vibration</span>.
                </h2>
                <p className="text-airra-muted dark:text-airra-dark-muted font-medium text-xl leading-relaxed max-w-xl">
                  AIRRA requires a manual signal of your internal environment. How is your cognitive state manifesting at this moment?
                </p>
              </div>
              <div className="hidden xl:flex items-center gap-6 p-6 rounded-[2rem] airra-glass border-white/20">
                 <div className="w-20 h-20 rounded-[1.5rem] bg-airra-text dark:bg-white flex items-center justify-center shadow-airra-xl">
                   <BrainCircuit className="w-10 h-10 text-airra-bg dark:text-zinc-950" />
                 </div>
                 <div className="space-y-1">
                   <p className="text-[10px] font-black uppercase tracking-widest text-airra-muted">Link Sensitivity</p>
                   <p className="text-lg font-bold text-airra-text dark:text-white">ULTRA-WIDE</p>
                 </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-8 mb-20">
              {moods.map((mood, idx) => (
                <button
                  key={idx}
                  onClick={() => handleMoodSelect(idx)}
                  disabled={loading}
                  className={`flex flex-col items-center p-12 rounded-[3.5rem] transition-all duration-700 group/item relative overflow-hidden border-2 ${
                    selectedMood === idx 
                      ? 'bg-airra-text dark:bg-white border-transparent text-airra-bg dark:text-zinc-900 shadow-airra-xl scale-105' 
                      : 'bg-airra-bg/40 dark:bg-zinc-900/40 border-airra-border/20 dark:border-white/5 hover:bg-white dark:hover:bg-zinc-800 hover:scale-105'
                  } ${loading ? 'opacity-30 cursor-not-allowed' : ''}`}
                >
                  <div className={`w-20 h-20 rounded-[1.5rem] flex items-center justify-center mb-8 transition-all duration-700 ${
                     selectedMood === idx ? 'bg-airra-bg/10 dark:bg-zinc-900/10' : 'bg-white dark:bg-zinc-800 group-hover/item:scale-110 shadow-airra-md'
                  }`}>
                    {React.cloneElement(mood.icon as React.ReactElement, { size: 36, strokeWidth: 1.5, className: selectedMood === idx ? 'text-zinc-950' : 'text-airra-text dark:text-white' })}
                  </div>
                  <div className="text-center space-y-2">
                    <span className={`text-xs font-black uppercase tracking-[0.2em] ${selectedMood === idx ? 'text-inherit' : 'text-airra-text dark:text-white'}`}>
                      {mood.label}
                    </span>
                    <p className={`text-[9px] font-medium opacity-40 uppercase tracking-widest leading-none ${selectedMood === idx ? 'text-inherit' : ''}`}>
                      {mood.desc}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-16 border-t border-airra-border/20 dark:border-white/5">
              <div className="airra-glass p-10 rounded-[3rem] border-emerald-500/10 flex flex-col justify-between h-48 group cursor-none">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-airra-muted">Neural Continuity</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(i => <div key={i} className={`w-1.5 h-6 rounded-full bg-emerald-500/20 active:bg-emerald-500 transition-colors delay-${i * 100}`} />)}
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between text-[11px] font-black uppercase tracking-widest">
                    <span className="text-airra-muted">Longitudinal Stability</span>
                    <span className="text-emerald-500">88%</span>
                  </div>
                  <div className="w-full bg-airra-bg dark:bg-zinc-900 h-2 rounded-full overflow-hidden shadow-inner">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '88%' }}
                      transition={{ duration: 3, ease: [0.16, 1, 0.3, 1] }}
                      className="bg-emerald-500 h-full rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                    />
                  </div>
                </div>
              </div>

              <div className="airra-glass p-10 rounded-[3rem] border-amber-500/10 flex items-center gap-10">
                <div className="w-24 h-24 rounded-[2rem] bg-airra-text dark:bg-white shadow-airra-xl flex items-center justify-center flex-shrink-0 animate-breathe">
                   <div className="size-12 rounded-full border-4 border-airra-bg dark:border-zinc-200 border-t-transparent animate-spin" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-xl font-display font-black text-airra-text dark:text-white uppercase tracking-tighter leading-none">Diagnostic Analysis</h4>
                  <p className="text-[11px] text-airra-muted dark:text-airra-dark-muted font-medium leading-relaxed italic">
                    AIRRA is processing your signal against 48.2 billion neural markers to calibrate your current experience.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center space-y-12"
          >
             <div className="w-40 h-40 bg-emerald-500 rounded-[3.5rem] flex items-center justify-center text-white shadow-2xl shadow-emerald-500/30 animate-float">
                <CheckCircle2 size={72} strokeWidth={1} />
             </div>
             <div className="space-y-6">
                <h2 className="text-airra-display font-display font-black dark:text-white uppercase tracking-tighter leading-none">Diagnostics <br /> Captured.</h2>
                <p className="text-airra-muted dark:text-airra-dark-muted font-medium text-2xl max-w-xl italic">
                  Neural baseline synchronized. Your sanctuary is now calibrated for maximal restoration.
                </p>
             </div>
             <button 
               onClick={() => setSubmitted(false)}
               className="h-16 px-12 rounded-2xl bg-airra-bg dark:bg-zinc-800 text-[10px] font-black uppercase tracking-widest text-airra-muted hover:text-airra-text transition-all"
             >
               Dismiss Diagnostic
             </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
