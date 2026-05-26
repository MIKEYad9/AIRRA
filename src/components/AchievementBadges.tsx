import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Award, Lock, CheckCircle2, Star, Calendar, Flame, Sparkles, ChevronRight, X } from "lucide-react";

export interface ProfileMilestone {
  days: number;
  title: string;
  badge: string;
  description: string;
  technicalSpecs: string;
  color: string;
  borderColor: string;
  textColor: string;
  glowColor: string;
  emoji: string;
  quote: string;
}

export const PROFILE_MILESTONES: ProfileMilestone[] = [
  {
    days: 1,
    title: "Quantum Singularity",
    badge: "NOVICE ALIGNMENT 🪐",
    description: "Your very first conscious self-care diagnostic check-in. The sovereign journey begins here.",
    technicalSpecs: "Initial neural loop verified. Biometric telemetry connection online.",
    color: "from-blue-500/10 to-indigo-950/20",
    borderColor: "border-blue-500/30",
    textColor: "text-blue-400",
    glowColor: "rgba(59, 130, 246, 0.2)",
    emoji: "🪐",
    quote: "A single breath is the nucleus of ultimate cognitive clarity."
  },
  {
    days: 3,
    title: "Consistent Mindset",
    badge: "BRONZE STREAK 🥉",
    description: "3 consecutive days of checking in with your mind. Healthy sub-conscious habits are beginning to coalesce.",
    technicalSpecs: "Habit baseline detected. HRV variance shows signs of systemic autonomic dampening.",
    color: "from-amber-650/10 to-orange-950/25",
    borderColor: "border-amber-500/30",
    textColor: "text-amber-500",
    glowColor: "rgba(245, 158, 11, 0.25)",
    emoji: "🥉",
    quote: "Action repeated becomes second nature; focus repeated becomes absolute flow."
  },
  {
    days: 5,
    title: "Mental Equilibrium",
    badge: "SILVER STREAK 🥈",
    description: "5 days of consistent self-care. Deep autonomic balance active. Cortisol indicators show steady grounding.",
    technicalSpecs: "Parasympathetic reinforcement dominant. Resonance score optimization exceeding 80%.",
    color: "from-slate-400/10 to-slate-800/20",
    borderColor: "border-slate-300/30",
    textColor: "text-slate-300",
    glowColor: "rgba(209, 213, 219, 0.2)",
    emoji: "🥈",
    quote: "Calm is not the absence of storm, but the alignment of the core."
  },
  {
    days: 7,
    title: "Perfect Balance Array",
    badge: "GOLD STREAK 🥇",
    description: "A full week of complete mental alignment. Autonomical resonance established with clinical precision.",
    technicalSpecs: "Longitudinal neural evolution stable. Standard deviation of breath cycles normalized.",
    color: "from-yellow-500/10 to-amber-950/20",
    borderColor: "border-yellow-400/40",
    textColor: "text-yellow-400",
    glowColor: "rgba(234, 179, 8, 0.35)",
    emoji: "🥇",
    quote: "Seven days of devotion. You have anchored yourself in the present."
  },
  {
    days: 10,
    title: "Deca-Resonance Domain",
    badge: "COSMIC STREAK 🌌",
    description: "10 days of perfect mindfulness integration. Transformative calm has fully emerged as a cognitive default.",
    technicalSpecs: "Highly synchronized bio-reserves verified. High-performance recovery levels activated.",
    color: "from-purple-500/10 to-indigo-950/35",
    borderColor: "border-purple-400/40",
    textColor: "text-purple-400",
    glowColor: "rgba(168, 85, 247, 0.35)",
    emoji: "🌌",
    quote: "Ten cycles. The boundary of self expands into universal stillness."
  }
];

interface AchievementBadgesProps {
  currentStreak: number;
}

export default function AchievementBadges({ currentStreak }: AchievementBadgesProps) {
  const [selectedMilestone, setSelectedMilestone] = useState<ProfileMilestone | null>(null);

  // Filter unlocked milestones
  const unlockedMilestones = PROFILE_MILESTONES.filter(m => currentStreak >= m.days);
  
  // Highest achieved milestone
  const highestMilestone = unlockedMilestones.length > 0 
    ? unlockedMilestones[unlockedMilestones.length - 1] 
    : null;

  // Next target milestone
  const nextMilestone = PROFILE_MILESTONES.find(m => currentStreak < m.days);

  return (
    <div id="achievement-badge-system" className="space-y-6 sm:space-y-8">
      {/* Title block */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/5 gap-3 flex-wrap">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="p-2 rounded-lg sm:p-2.5 sm:rounded-xl bg-[#2D7A5F]/15 text-[#2D7A5F] dark:text-emerald-400 border border-[#2D7A5F]/20 shrink-0">
            <Award className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="text-left">
            <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800 dark:text-zinc-200">
              Coalesced Milestones
            </h4>
            <p className="text-[8px] sm:text-[10px] font-mono text-slate-400 dark:text-zinc-500 uppercase tracking-widest mt-0.5">
              Streak synchronization and alignment emblems
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-100 dark:bg-zinc-900 px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-lg sm:rounded-xl border border-slate-200/50 dark:border-white/5 select-none shrink-0">
          <Flame className="w-3 h-3 sm:w-4 sm:h-4 text-amber-500 animate-pulse fill-amber-500" />
          <span className="text-[9px] sm:text-[11px] font-mono font-black text-slate-700 dark:text-zinc-300">
            STREAK: {currentStreak} DAYS
          </span>
        </div>
      </div>

      {/* Highest Achievement Spotlight Card */}
      {highestMilestone ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`relative p-5 sm:p-8 rounded-2xl md:rounded-[2rem] border overflow-hidden bg-gradient-to-br ${highestMilestone.color} ${highestMilestone.borderColor} flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8`}
          style={{ boxShadow: `0 10px 40px -15px ${highestMilestone.glowColor}` }}
        >
          {/* Spotlight highlight aura */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 blur-[100px] pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 relative z-10 text-center sm:text-left w-full">
            <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-full bg-black/35 backdrop-blur-md border border-white/10 flex items-center justify-center text-3xl sm:text-5xl shadow-xl select-none relative group shrink-0">
              <span className="animate-bounce" style={{ animationDuration: "3s" }}>
                {highestMilestone.emoji}
              </span>
              <div className="absolute -top-0.5 -right-0.5 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-emerald-500 flex items-center justify-center border border-slate-900 shadow">
                <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
              </div>
            </div>

            <div className="space-y-1 sm:space-y-2 min-w-0 flex-1">
              <span className={`text-[8px] sm:text-[9px] font-black tracking-[0.2em] sm:tracking-[0.3em] uppercase bg-black/45 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full border border-white/5 font-mono ${highestMilestone.textColor} block w-fit mx-auto sm:mx-0`}>
                ACTIVE PROFILE SOVEREIGN EMBLEM
              </span>
              <h3 className="text-lg sm:text-2xl font-display font-black text-slate-900 dark:text-white uppercase tracking-tight break-words">
                {highestMilestone.title}
              </h3>
              <p className="text-xs text-slate-600 dark:text-zinc-300 font-medium leading-relaxed max-w-xl">
                {highestMilestone.description}
              </p>
            </div>
          </div>

          <div className="shrink-0 relative z-10 w-full md:w-auto text-center">
            <button
              onClick={() => setSelectedMilestone(highestMilestone)}
              className="h-10 sm:h-12 px-5 sm:px-6 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-zinc-950 text-[8px] sm:text-[9px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-md w-full md:w-auto cursor-pointer"
            >
              Examine Telemetry
            </button>
          </div>
        </motion.div>
      ) : (
        <div className="p-5 sm:p-8 rounded-2xl md:rounded-[2rem] border border-dashed border-slate-300/40 dark:border-white/5 text-center bg-slate-50/20 dark:bg-white/[0.01]">
          <Award className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-slate-350 dark:text-zinc-600 mb-3 stroke-[1.5]" />
          <h4 className="text-sm sm:text-base font-bold text-slate-700 dark:text-zinc-300">Initial Milestone In Progress</h4>
          <p className="text-xs text-slate-400 dark:text-zinc-500 max-w-sm mx-auto mt-2 leading-relaxed">
            Log your first mood on the dashboard today to establish your <strong className="text-emerald-500">1-day Quantum Singularity</strong> milestone and trigger biometric telemetry synthesis options.
          </p>
        </div>
      )}

      {/* Grid of Milestones */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {PROFILE_MILESTONES.map((m, index) => {
          const isUnlocked = currentStreak >= m.days;
          
          return (
            <motion.div
              key={m.days}
              whileHover={{ y: -3, scale: 1.01 }}
              onClick={() => setSelectedMilestone(m)}
              className={`p-3.5 sm:p-5 rounded-xl sm:rounded-[1.5rem] border text-left flex flex-col justify-between cursor-pointer relative overflow-hidden transition-all min-w-0 ${
                isUnlocked 
                  ? `bg-gradient-to-b ${m.color} ${m.borderColor} shadow-[0_4px_15px_-8px_rgba(16,185,129,0.1)]` 
                  : 'bg-slate-50/40 dark:bg-white/[0.01] border-slate-200/50 dark:border-white/5 opacity-55 hover:opacity-85'
              }`}
            >
              {/* Backer decoration numbers */}
              <span className="absolute -bottom-3 -right-1 text-5xl sm:text-7xl font-display font-black text-slate-350/[0.05] dark:text-white/[0.02] select-none pointer-events-none">
                {m.days}d
              </span>

              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between">
                  <div className={`w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-[1rem] bg-black/25 flex items-center justify-center text-lg sm:text-2xl select-none ${!isUnlocked && 'grayscale filter'}`}>
                    {m.emoji}
                  </div>
                  {isUnlocked ? (
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
                      <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-slate-200 dark:bg-zinc-800 flex items-center justify-center text-slate-400 dark:text-zinc-600">
                      <Lock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    </div>
                  )}
                </div>

                <div className="space-y-0.5 sm:space-y-1">
                  <h4 className="text-xs sm:text-sm font-display font-black tracking-tight text-slate-900 dark:text-white uppercase line-clamp-1">
                    {m.title}
                  </h4>
                  <p className="text-[8px] sm:text-[9px] font-mono tracking-widest text-[#2D7A5F] dark:text-emerald-400 font-bold uppercase">
                    {m.days} DAY STREAK
                  </p>
                </div>
              </div>

              <div className="pt-3 sm:pt-4 mt-3 sm:mt-4 border-t border-slate-100 dark:border-white/[0.04] flex items-center justify-between text-[8px] sm:text-[10px]">
                <span className="font-mono text-slate-400 dark:text-zinc-500 uppercase font-semibold">
                  {isUnlocked ? "UNLOCKED" : `LOCKED`}
                </span>
                <ChevronRight className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${isUnlocked ? m.textColor : "text-slate-400"}`} />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Interactive Detail modal popups */}
      <AnimatePresence>
        {selectedMilestone && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className={`relative max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 sm:p-8 md:p-10 rounded-2xl sm:rounded-[2.5rem] border bg-gradient-to-b ${selectedMilestone.color} ${selectedMilestone.borderColor} text-left space-y-4 sm:space-y-6 shadow-2xl overflow-x-hidden`}
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedMilestone(null)}
                className="absolute top-4 right-4 sm:top-6 sm:right-6 p-1.5 sm:p-2 rounded-full bg-black/40 hover:bg-black/60 border border-white/5 active:scale-95 transition-all text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>

              <div className="flex items-center gap-4 sm:gap-5 pt-2">
                <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-3xl sm:text-4xl shadow-lg select-none shrink-0">
                  {selectedMilestone.emoji}
                </div>
                <div className="space-y-1 sm:space-y-1.5 min-w-0">
                  <span className={`text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] bg-black/50 px-2.5 py-0.5 sm:px-3.5 sm:py-1 rounded-full border border-white/5 font-mono ${selectedMilestone.textColor} inline-block truncate max-w-full`}>
                    {selectedMilestone.badge}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-display font-black text-slate-905 dark:text-white uppercase tracking-tight break-words">
                    {selectedMilestone.title}
                  </h3>
                </div>
              </div>

              <div className="w-full h-[1px] bg-slate-200/20 dark:bg-white/[0.04] my-2" />

              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500 font-mono">
                    Calibration Impact
                  </label>
                  <p className="text-xs sm:text-sm text-slate-800 dark:text-zinc-200 leading-relaxed font-medium mt-1">
                    {selectedMilestone.description}
                  </p>
                </div>

                <div className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-black/35 border border-white/5 space-y-2 sm:space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className={`w-3.5 h-3.5 ${currentStreak >= selectedMilestone.days ? "text-emerald-400" : "text-zinc-500"}`} />
                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-white-505 font-mono">
                      Telemetry Specifications
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-zinc-300 font-medium leading-relaxed">
                    {selectedMilestone.technicalSpecs}
                  </p>
                </div>

                <div className="text-center pt-1 italic text-xs text-[#2D7A5F] dark:text-emerald-400 font-medium font-serif opacity-80 leading-relaxed px-2 sm:px-4">
                  "{selectedMilestone.quote}"
                </div>
              </div>

              <div className="pt-3 sm:pt-4 flex gap-4">
                <button
                  type="button"
                  onClick={() => setSelectedMilestone(null)}
                  className="flex-1 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-[#2D7A5F] hover:bg-[#389676] text-slate-100 dark:text-slate-100 text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all active:scale-[0.97] cursor-pointer text-center"
                >
                  Dismiss Telemetry
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
