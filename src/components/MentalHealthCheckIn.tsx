import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useUserStore } from '../services/useUserStore';
import { BrainCircuit, Cloud, Sun, Moon, Wind, Leaf, Sparkles, ChevronRight, CheckCircle2 } from 'lucide-react';

export default function MentalHealthCheckIn({ onLogged }: { onLogged?: () => void }) {
  const { profile } = useUserStore();
  const [selectedMoods, setSelectedMoods] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();
  
  const moods = [
    { icon: <Cloud />, label: 'Overcast', intensity: 3, desc: 'Heavy cognitive load' },
    { icon: <Wind />, label: 'Turbulent', intensity: 4, desc: 'High neural activity' },
    { icon: <Leaf />, label: 'Grounded', intensity: 6, desc: 'Balanced baseline' },
    { icon: <Sun />, label: 'Radiant', intensity: 9, desc: 'Peak clarity achieved' },
    { icon: <Sparkles />, label: 'Flow', intensity: 10, desc: 'Optimal state' }
  ];

  const handleMoodToggle = (idx: number) => {
    setSelectedMoods(prev => {
      if (prev.includes(idx)) {
        return prev.filter(i => i !== idx);
      } else {
        return [...prev, idx];
      }
    });
  };

  const handleSyncSubmit = async () => {
    if (selectedMoods.length === 0) return;
    setLoading(true);

    try {
      if (profile && supabase) {
        const rows = selectedMoods.map(idx => ({
          user_id: profile.id,
          mood: moods[idx].label,
          intensity: moods[idx].intensity,
          created_at: new Date().toISOString()
        }));

        await supabase
          .from('mood_logs')
          .insert(rows);
      }
    } catch (e) {
      console.error("Failed to insert multi mood logs:", e);
    }

    setSubmitted(true);
    if (onLogged) onLogged();
    setTimeout(() => {
      setSubmitted(false);
      setSelectedMoods([]);
    }, 5000);
    
    setLoading(false);
  };

  return (
    <div className="airra-card p-6 sm:p-12 md:p-16 relative overflow-hidden group border-white/10 dark:border-white/5 bg-white/40 dark:bg-airra-dark-forest/40 backdrop-blur-3xl shadow-airra-xl">
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
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 sm:mb-20 gap-8 sm:gap-12">
              <div className="max-w-2xl space-y-6 sm:space-y-8">
                <div className="inline-flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-1.5 sm:py-2 rounded-full airra-glass border border-airra-border/50 dark:border-white/5">
                  <div className="w-2 h-2 rounded-full bg-airra-primary dark:bg-airra-dark-glow animate-pulse shadow-[0_0_10px_rgba(45,106,79,0.5)]" />
                  <span className="text-[9px] sm:text-[10px] font-black tracking-[0.15em] sm:tracking-[0.4em] uppercase text-airra-muted">Neural Health Diagnostic</span>
                </div>
                <h2 className="text-3xl sm:text-5xl md:text-7xl font-display font-black text-airra-text dark:text-white leading-[0.85] tracking-tighter uppercase whitespace-normal break-words">
                  Current <br />
                  <span className="font-serif italic font-normal text-airra-primary dark:text-airra-dark-glow normal-case tracking-tight">Vibration</span>.
                </h2>
                <p className="text-airra-muted dark:text-airra-dark-muted font-medium text-lg sm:text-xl leading-relaxed max-w-xl">
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
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-5 mb-10">
              {moods.map((mood, idx) => {
                const isSelected = selectedMoods.includes(idx);
                return (
                  <button
                    key={idx}
                    onClick={() => handleMoodToggle(idx)}
                    disabled={loading}
                    className={`flex flex-col items-center p-5 sm:p-6 rounded-[2rem] transition-all duration-300 group/item relative overflow-hidden border ${
                      isSelected 
                        ? 'bg-airra-text dark:bg-white border-transparent text-airra-bg dark:text-zinc-900 shadow-airra-lg scale-[1.03]' 
                        : 'bg-airra-bg/20 dark:bg-zinc-900/20 border-airra-border/10 dark:border-white/5 hover:bg-white/60 dark:hover:bg-zinc-805/60 hover:scale-[1.02]'
                    } ${loading ? 'opacity-30 cursor-not-allowed' : ''}`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3.5 transition-all duration-300 ${
                       isSelected ? 'bg-airra-bg/10 dark:bg-zinc-900/10' : 'bg-white dark:bg-zinc-800 group-hover/item:scale-105 shadow-sm'
                    }`}>
                      {React.cloneElement(mood.icon as React.ReactElement, { size: 20, strokeWidth: 1.5, className: isSelected ? 'text-zinc-950 dark:text-zinc-900' : 'text-airra-text dark:text-white' })}
                    </div>
                    <div className="text-center space-y-1">
                      <span className={`text-[11px] font-black uppercase tracking-[0.15em] ${isSelected ? 'text-inherit' : 'text-airra-text dark:text-white'}`}>
                        {mood.label}
                      </span>
                      <p className={`text-[8px] font-medium opacity-50 uppercase tracking-wider leading-none ${isSelected ? 'text-inherit' : ''}`}>
                        {mood.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-end gap-4 mb-12">
              <button
                onClick={handleSyncSubmit}
                disabled={loading || selectedMoods.length === 0}
                className={`px-6 py-3.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-md flex items-center gap-2 ${
                  selectedMoods.length > 0
                    ? 'bg-airra-primary hover:bg-emerald-600 text-white active:scale-95 cursor-pointer hover:translate-y-[-1px]'
                    : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-650 cursor-not-allowed opacity-50'
                }`}
              >
                <span>Synchronize Baseline</span>
                <ChevronRight size={12} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-12 pt-12 sm:pt-16 border-t border-airra-border/20 dark:border-white/5">
              <div className="airra-glass p-6 sm:p-10 rounded-[2.5rem] sm:rounded-[3rem] border-emerald-500/10 flex flex-col justify-between h-auto min-h-[11rem] sm:h-48 group cursor-none">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-2">
                  <span className="text-[10px] sm:text-xs font-black tracking-wider text-airra-muted">Neural continuity</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(i => <div key={i} className={`w-1.5 h-6 rounded-full bg-emerald-500/20 active:bg-emerald-500 transition-colors delay-${i * 100}`} />)}
                  </div>
                </div>
                <div className="space-y-3 sm:space-y-4 mt-6 sm:mt-0">
                  <div className="flex justify-between text-[10px] sm:text-[11px] font-black tracking-wider">
                    <span className="text-airra-muted">Longitudinal stability</span>
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

              <div 
                onClick={() => navigate('/diagnostic')}
                className="w-full col-span-1 md:col-span-2 airra-glass px-4 py-6 sm:p-10 rounded-[2.5rem] sm:rounded-[3rem] border-emerald-500/10 flex flex-col sm:flex-row items-center sm:items-center gap-6 sm:gap-8 hover:border-emerald-500/30 transition-all cursor-pointer relative overflow-hidden group/diag active:scale-[0.98] select-none shadow-[0_0_20px_rgba(16,185,129,0.02)]"
              >
                {/* Loading Shimmer Animation overlay */}
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/5 to-transparent -translate-x-full animate-[shimmer_2.5s_infinite] pointer-events-none" />

                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-[1.5rem] bg-airra-text dark:bg-white/5 border border-white/10 shadow-airra-xl flex items-center justify-center flex-shrink-0 relative overflow-hidden group-hover/diag:scale-105 transition-transform duration-500">
                   {/* Inner glow */}
                   <div className="absolute inset-0 bg-emerald-500/10 opacity-30 animate-pulse pointer-events-none" />
                   <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-500 dark:text-emerald-400 relative z-10 animate-[bounce_3s_infinite]" />
                </div>
                <div className="space-y-1.5 sm:space-y-2 relative z-10 text-center sm:text-left flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-3 justify-center sm:justify-start">
                    <h4 className="text-base sm:text-lg font-display font-black text-airra-text dark:text-white uppercase tracking-tighter leading-[1.1] group-hover/diag:text-emerald-400 transition-colors">
                      Diagnostic<br />Analysis
                    </h4>
                    <span className="text-[7px] sm:text-[8px] font-black tracking-widest text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase animate-pulse flex-shrink-0">Live link</span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-airra-muted dark:text-airra-dark-muted font-medium leading-relaxed italic max-w-xs sm:max-w-none break-words">
                    AIRRA is processing your signal against 48.2 billion neural markers. Tap here to view full diagnostic reports.
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
