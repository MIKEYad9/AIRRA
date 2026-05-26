import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Trophy, ShieldAlert, Award, Compass, Heart, Activity } from "lucide-react";
import { PROFILE_MILESTONES, ProfileMilestone } from "./AchievementBadges";

interface AchievementBadgeProps {
  currentStreak: number;
}

export default function AchievementBadge({ currentStreak }: AchievementBadgeProps) {
  const [hovered, setHovered] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  // Find all earned milestones
  const unlocked = PROFILE_MILESTONES.filter((m) => currentStreak >= m.days);
  
  // Highest milestone
  const highest = unlocked.length > 0 ? unlocked[unlocked.length - 1] : PROFILE_MILESTONES[0];
  const hasEarnedAny = unlocked.length > 0;

  // Let's create an elegant theme customization object for "unique and attractive badges"
  const badgeThemes: Record<number, {
    primaryGlow: string;
    particleColor: string;
    cardStyle: string;
    ringAnimation: string;
    backgroundPattern: string;
    titleAccent: string;
  }> = {
    1: {
      primaryGlow: "rgba(59, 130, 246, 0.45)",
      particleColor: "bg-blue-400",
      cardStyle: "from-slate-900 via-indigo-950 to-blue-950 border-blue-500/40 text-blue-100",
      ringAnimation: "border-blue-500/20",
      backgroundPattern: "radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.15) 0%, transparent 60%)",
      titleAccent: "from-blue-400 to-cyan-300"
    },
    3: {
      primaryGlow: "rgba(245, 158, 11, 0.45)",
      particleColor: "bg-amber-400",
      cardStyle: "from-zinc-950 via-stone-900 to-amber-950 border-amber-500/40 text-amber-100",
      ringAnimation: "border-amber-500/20",
      backgroundPattern: "radial-gradient(circle at 80% 20%, rgba(245, 158, 11, 0.15) 0%, transparent 60%)",
      titleAccent: "from-amber-400 to-orange-400"
    },
    5: {
      primaryGlow: "rgba(209, 213, 219, 0.45)",
      particleColor: "bg-teal-300",
      cardStyle: "from-slate-950 via-zinc-900 to-teal-950 border-teal-500/30 text-teal-100",
      ringAnimation: "border-teal-500/20",
      backgroundPattern: "radial-gradient(circle at 80% 20%, rgba(13, 148, 136, 0.15) 0%, transparent 60%)",
      titleAccent: "from-teal-300 to-slate-200"
    },
    7: {
      primaryGlow: "rgba(234, 179, 8, 0.55)",
      particleColor: "bg-yellow-400",
      cardStyle: "from-zinc-950 via-slate-900 to-yellow-950/80 border-yellow-500/40 text-yellow-100",
      ringAnimation: "border-yellow-500/30",
      backgroundPattern: "radial-gradient(circle at 80% 20%, rgba(234, 179, 8, 0.18) 0%, transparent 60%)",
      titleAccent: "from-yellow-400 to-amber-300"
    },
    10: {
      primaryGlow: "rgba(168, 85, 247, 0.6)",
      particleColor: "bg-purple-400",
      cardStyle: "from-zinc-950 via-indigo-950/90 to-purple-950 border-purple-500/50 text-purple-100",
      ringAnimation: "border-purple-500/30",
      backgroundPattern: "radial-gradient(circle at 80% 20%, rgba(168, 85, 247, 0.22) 0%, transparent 60%)",
      titleAccent: "from-purple-400 to-pink-300"
    }
  };

  const theme = badgeThemes[highest.days] || badgeThemes[1];

  return (
    <div id="highest-milestone-spotlight" className="relative select-none w-full">
      {/* Absolute Ambient Background Shadow matching Highest badge color */}
      <div 
        className="absolute inset-x-8 -inset-y-4 rounded-[3.5rem] opacity-30 blur-[40px] pointer-events-none transition-all duration-700" 
        style={{
          background: `radial-gradient(circle, ${theme.primaryGlow} 0%, transparent 70%)`
        }}
      />

      {/* Floating Framer Motion Card Container */}
      <motion.div
        animate={{
          y: hovered ? [0, -15, 0] : [0, -8, 0],
          rotateX: hovered ? 2 : 0,
          rotateY: hovered ? -2 : 0,
        }}
        transition={{
          y: {
            repeat: Infinity,
            duration: hovered ? 3.5 : 4.5,
            ease: "easeInOut",
          },
          default: { duration: 0.4 }
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => setShowExplanation(!showExplanation)}
        className={`relative p-5 sm:p-8 md:p-10 rounded-[20px] bg-gradient-to-br ${theme.cardStyle} border border-white/10 backdrop-blur-md overflow-hidden shadow-2xl transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.4)] cursor-pointer w-full`}
      >
        {/* Decorative Grid Mesh & Dynamic background spot */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.06] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:14px_14px]" />
        <div 
          className="absolute inset-0 pointer-events-none transition-all duration-700"
          style={{ backgroundImage: theme.backgroundPattern }}
        />

        {/* Shimmer overlay sweep */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-[1.5s]" />

        {/* Top-Right active/inactive Badge */}
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 md:top-8 md:right-8 flex items-center gap-1.5 max-w-[110px] sm:max-w-[180px]">
          {hasEarnedAny ? (
            <span className="flex items-center gap-1 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full bg-emerald-950/70 border border-[#3DB88A]/60 text-[#3DB88A] text-[7px] sm:text-[9px] font-black uppercase tracking-widest font-mono truncate max-w-full">
              <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-emerald-400 animate-ping inline-block shrink-0" />
              <span className="truncate overflow-hidden text-ellipsis whitespace-nowrap">Sovereign</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full bg-slate-900/70 border border-slate-500/20 text-slate-400 text-[7px] sm:text-[9px] font-black uppercase tracking-widest font-mono truncate max-w-full">
              <span className="truncate overflow-hidden text-ellipsis whitespace-nowrap">Pending Sync</span>
            </span>
          )}
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4 sm:gap-8 relative z-10 text-center md:text-left pt-6 md:pt-0">
          {/* Animated Halo around Badge Emoji */}
          <div className="relative w-24 h-24 sm:w-32 sm:h-32 flex items-center justify-center shrink-0">
            {/* Pulsing energy rings */}
            <motion.div
              animate={{ 
                scale: [1, 1.15, 1],
                rotate: 360 
              }}
              transition={{ 
                scale: { duration: 3.5, repeat: Infinity, ease: "easeInOut" },
                rotate: { duration: 25, repeat: Infinity, ease: "linear" }
              }}
              className={`absolute inset-0 rounded-full border border-dashed ${theme.ringAnimation}`}
            />
            <motion.div
              animate={{ 
                scale: [1, 1.08, 1],
                rotate: -360 
              }}
              transition={{ 
                scale: { duration: 2.5, repeat: Infinity, ease: "easeInOut" },
                rotate: { duration: 15, repeat: Infinity, ease: "linear" }
              }}
              className="absolute inset-2 sm:inset-3 rounded-full border border-double border-white/10"
            />
            
            {/* Ambient shadow back-light */}
            <div 
              className="absolute inset-3 rounded-full filter blur-xl opacity-60 pointer-events-none"
              style={{ backgroundColor: theme.primaryGlow }}
            />

            {/* Float badge icon */}
            <motion.div 
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-black/45 backdrop-blur-md border border-white/10 flex items-center justify-center text-3xl sm:text-5xl shadow-inner relative z-10 select-none cursor-pointer"
            >
              {highest.emoji}
            </motion.div>

            {/* Glowing particle dots revolving around badge */}
            <div className={`absolute top-1 left-4 w-2 h-2 rounded-full ${theme.particleColor} blur-[1px] animate-pulse`} />
            <div className={`absolute bottom-2 right-4 w-1.5 h-1.5 rounded-full ${theme.particleColor} blur-[1.5px] animate-bounce`} />
          </div>

          <div className="space-y-2 sm:space-y-3 flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5 sm:gap-3">
              <span className={`text-[8px] sm:text-[9px] font-black tracking-[0.2em] sm:tracking-[0.3em] uppercase bg-black/40 px-2.5 py-1 rounded-full border border-white/5 font-mono ${highest.textColor} truncate max-w-full`}>
                {highest.badge}
              </span>
              <span className="text-[8px] sm:text-[9px] font-mono text-slate-400 dark:text-zinc-500 uppercase tracking-widest font-bold">
                Level {highest.days} Metric
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl md:text-3xl font-display font-black text-white uppercase tracking-tight leading-tight break-words">
              {hasEarnedAny ? (
                <span>Highest Achieved: <span className={`bg-gradient-to-r ${theme.titleAccent} bg-clip-text text-transparent`}>{highest.title}</span></span>
              ) : (
                <span className="text-slate-400">Quantum Singularity Tracker</span>
              )}
            </h3>

            <p className="text-xs sm:text-sm text-zinc-300 font-medium leading-relaxed max-w-xl">
              {highest.description}
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3 sm:gap-6 text-[8px] sm:text-[10px] font-mono font-semibold tracking-wider text-[#3DB88A] dark:text-[#3DB88A]/90">
              <span className="flex items-center gap-1.5 uppercase bg-[#2D7A5F]/20 px-2.5 py-1 rounded-xl border border-[#2D7A5F]/30 shadow-sm">
                <Sparkles className="w-3 h-3 text-emerald-400 animate-pulse sm:w-3.5 sm:h-3.5" />
                {highest.days} Days Unlocked
              </span>
              <span className="text-zinc-500 uppercase whitespace-nowrap">
                Aura Strength Level: {(highest.days * 18.5).toFixed(0)}%
              </span>
            </div>
          </div>
        </div>

        {/* Collapsible details pane inside the card */}
        <AnimatePresence>
          {showExplanation && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-8 pt-8 border-t border-white/10 relative z-20 text-left"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-black/30 p-5 rounded-2xl border border-white/5">
                <div>
                  <h4 className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                    <Activity className="w-3 h-3 text-[#3DB88A]" /> Clinical Diagnostic Metrics
                  </h4>
                  <p className="text-xs text-zinc-350 font-medium leading-relaxed">
                    {highest.technicalSpecs}
                  </p>
                </div>
                <div>
                  <h4 className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                    <Heart className="text-pink-400 w-3 h-3" /> Cognitive Integration Code
                  </h4>
                  <p className="text-xs text-emerald-400 italic font-serif leading-relaxed">
                    "{highest.quote}"
                  </p>
                </div>
              </div>
              <p className="text-[9px] text-zinc-500 mt-4 text-center font-semibold tracking-widest uppercase block">
                ✦ Click Card Again to Collapse Diagnostic Data Terminal ✦
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hint text at bottom of card */}
        {!showExplanation && (
          <div className="mt-4 text-center">
            <span className="text-[9px] font-bold tracking-[0.2em] text-zinc-500 uppercase animate-pulse select-none">
              ✦ Click card to explore biometric telemetry specifications ✦
            </span>
          </div>
        )}
      </motion.div>
    </div>
  );
}
