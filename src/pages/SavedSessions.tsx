import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Heart, Play, Trash2, ArrowRight, Sparkles, Sliders, Volume2, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SavedSession {
  id: string;
  title: string;
  category: "breath" | "binaural" | "ambient";
  duration: string;
  config: string;
  desc: string;
}

const INITIAL_SAVED: SavedSession[] = [
  {
    id: "fs-1",
    title: "Vagal Calm Calibration",
    category: "breath",
    duration: "12 min",
    config: "Inhale: 4s | Hold: 7s | Exhale: 8s",
    desc: "Parasympathetic trigger designed to rapidly reduce amygdala hyper-activity."
  },
  {
    id: "fs-2",
    title: "Alpha Coherence Synchronizer",
    category: "binaural",
    duration: "15 min",
    config: "Binaural Carrier: 200Hz | Beat Offset: 10Hz",
    desc: "Targeted Alpha wave focus builder for coding, planning, or clinical reflection."
  },
  {
    id: "fs-3",
    title: "Sub-Audible Dream Lattice",
    category: "ambient",
    duration: "45 min",
    config: "Theta Dreamscape Overlay + Cave Reverb mix",
    desc: "Continuous dream stage support designed to induce deep delta sleep."
  }
];

export default function SavedSessions() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<SavedSession[]>(INITIAL_SAVED);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessions(prev => prev.filter(s => s.id !== id));
  };

  const handleTogglePlay = (id: string) => {
    if (playingId === id) {
      setPlayingId(null);
    } else {
      setPlayingId(id);
    }
  };

  return (
    <div className="space-y-16 pb-20 pt-28 md:pt-36 min-h-screen bg-airra-bg dark:bg-airra-dark-bg text-slate-800 dark:text-zinc-100 px-4 sm:px-8">
      
      {/* Header */}
      <header className="space-y-6 pt-[calc(88px+16px)]">
        <div className="text-[11px] font-mono font-bold text-[#3DB88A] tracking-[0.1em] uppercase block mb-1">
          OFFLINE SANCTUARY MODE
        </div>
        <h1 className="text-5xl md:text-7xl font-display font-black uppercase tracking-tighter leading-none text-slate-900 dark:text-white">
          Saved <br />
          <span className="font-serif italic font-normal text-[#3DB88A] normal-case tracking-tight">Prescriptions</span>
        </h1>
        <p className="saved-body-text text-slate-600 dark:text-[rgba(255,255,255,0.75)] font-medium text-lg max-w-2xl leading-relaxed">
          Your personal catalog of highly-tuned focus and breathwork sequences. Play directly from this page to lock in customized calibrations.
        </p>
      </header>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence>
          {sessions.map((session, idx) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              whileHover={{ y: -6 }}
              key={session.id || idx}
              className={`airra-card p-8 flex flex-col justify-between min-h-[340px] transition-all relative overflow-hidden bg-white/40 dark:bg-airra-dark-forest/30 border-2 ${playingId === session.id ? 'border-[#3DB88A] shadow-[0_0_20px_rgba(61,184,138,0.2)]' : 'border-transparent'}`}
            >
              {/* Category tag & Delete full width card row with 16px padding */}
              <div className="w-full bg-slate-100/60 dark:bg-[#07110C]/90 p-4 rounded-xl flex justify-between items-center mb-4 shrink-0 border border-slate-200/55 dark:border-white/10 overflow-visible shadow-sm">
                <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#3DB88A] px-3.5 py-1.5 bg-emerald-500/10 rounded-full font-black">
                  {session.category}
                </span>
                <button 
                  onClick={(e) => handleDelete(session.id, e)}
                  className="p-2.5 text-rose-500 hover:text-rose-700 transition-colors rounded-lg bg-rose-500/5 hover:bg-rose-500/15 cursor-pointer flex items-center justify-center border border-rose-500/10 shrink-0"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              {/* Title & Desc */}
              <div className="space-y-4 pt-1 flex-grow">
                <h3 className="text-2xl font-display font-black uppercase tracking-tight leading-none text-slate-900 dark:text-white">
                  {session.title}
                </h3>
                <p className="saved-body-text text-xs text-slate-500 dark:text-[rgba(255,255,255,0.75)] font-medium leading-relaxed font-sans line-clamp-3">
                  {session.desc}
                </p>
                <div className="pt-2 text-[10px] font-mono text-slate-400 dark:text-zinc-500 flex items-center gap-2">
                  <Sliders size={12} className="text-[#3DB88A]" />
                  {session.config}
                </div>
              </div>

              {/* Play & duration Row */}
              <div className="flex justify-between items-center pt-8 border-t border-slate-100 dark:border-white/5 mt-6">
                <div className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
                  Duration: {session.duration}
                </div>
                <button 
                  onClick={() => handleTogglePlay(session.id)}
                  className="h-12 px-6 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-zinc-950 text-[9px] font-black uppercase tracking-widest flex items-center gap-3 transition-all active:scale-95 shadow-lg"
                >
                  {playingId === session.id ? (
                    <>
                      <Volume2 size={13} className="animate-bounce" /> Unlink
                    </>
                  ) : (
                    <>
                      <Play size={13} className="fill-current" /> Lock In
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          ))}

          {/* Add custom session card */}
          <motion.div 
            whileHover={{ y: -6 }}
            onClick={() => navigate("/experience")}
            className="airra-card p-10 flex flex-col items-center justify-center min-h-[320px] bg-slate-50/50 dark:bg-zinc-900/10 border-2 border-dashed border-slate-300 dark:border-white/10 hover:border-[#3DB88A] hover:bg-white/40 dark:hover:bg-airra-dark-forest/10 cursor-pointer group transition-all"
          >
            <div className="w-16 h-16 rounded-[40%] bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-400 dark:text-zinc-500 group-hover:scale-110 group-hover:text-[#3DB88A] group-hover:bg-[#3DB88A]/10 transition-all shadow-inner">
              <Plus size={24} />
            </div>
            <div className="text-center space-y-2 mt-6">
              <span className="text-xs font-black uppercase tracking-widest text-[#3DB88A]">Configure Alignment</span>
              <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium uppercase tracking-widest">Tune new custom protocol metrics</p>
            </div>
          </motion.div>

        </AnimatePresence>
      </div>

    </div>
  );
}
