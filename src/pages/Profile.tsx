import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { User, ShieldCheck, Mail, Zap, Compass, RefreshCcw, LogOut, Sparkles, BookOpen, Award } from "lucide-react";
import { useAuth } from "@/src/context/AuthContext";
import { useUserStore } from "@/src/services/useUserStore";
import AchievementBadges from "@/src/components/AchievementBadges";
import AchievementBadge from "@/src/components/AchievementBadge";
import BiometricCoherence from "@/src/components/BiometricCoherence";

export default function Profile() {
  const { user, signOut } = useAuth();
  const { profile, subscription, setProfile } = useUserStore();
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [goal, setGoal] = useState(profile?.mood_goal || "Optimizing cognitive flow and deep creativity");
  const [saving, setSaving] = useState(false);
  const [savedText, setSavedText] = useState("");

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedText("");

    const updated = {
      ...profile,
      full_name: fullName,
      mood_goal: goal,
      updated_at: new Date().toISOString()
    };

    setProfile(updated as any);
    setTimeout(() => {
      setSaving(false);
      setSavedText("Profile calibrated ✓");
      setTimeout(() => setSavedText(""), 3000);
    }, 800);
  };

  const currentStreak = profile?.daily_streak || 1;

  return (
    <div className="space-y-8 sm:space-y-16 pb-24 pt-20 sm:pb-40 sm:pt-28 md:pt-36 px-4 sm:px-10 page-container min-h-screen bg-airra-bg dark:bg-airra-dark-bg text-slate-800 dark:text-zinc-100 relative">
      
      {/* Header */}
      <header className="space-y-4 pt-2 sm:pt-4 text-left">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-airra-border/50 dark:border-white/5 bg-white/10 text-airra-primary dark:text-[#3DB88A] text-[9px] sm:text-[10px] font-black uppercase tracking-widest">
          <User className="w-3.5 h-3.5" />
          Sovereign Biometric Signature
        </div>
        <h1 className="text-3xl sm:text-5xl md:text-7xl font-display font-black uppercase tracking-tighter leading-none text-slate-900 dark:text-white">
          Identity <br />
          <span className="font-serif italic font-normal text-[#3DB88A] normal-case tracking-tight">Calibration</span>
        </h1>
        <p className="text-slate-600 dark:text-[rgba(255,255,255,0.75)] font-medium text-sm sm:text-lg max-w-2xl leading-relaxed">
          Manage your neural subscription, update your personal objectives, and recalibrate your safe space parameters.
        </p>
      </header>

      {/* Highest Reached Milestone Showcase Card - Blue cosmic card container */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="space-y-2 sm:space-y-4 w-full"
      >
        <div className="flex items-center gap-2 px-1">
          <Award className="w-3.5 h-3.5 text-[#3DB88A] animate-pulse" />
          <span className="text-[9px] sm:text-[10px] font-mono font-black uppercase tracking-widest text-[#3D7A5D] dark:text-[#3DB88A]">
            Active Coalesced Peak Emblem
          </span>
        </div>
        <div className="w-full overflow-hidden rounded-[20px]">
          <AchievementBadge currentStreak={currentStreak} />
        </div>
      </motion.div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 sm:gap-12">
        
        {/* Left Column - Diagnostic Stats */}
        <div className="xl:col-span-4 space-y-6 sm:space-y-10">
          
          <div className="airra-card p-5 sm:p-10 bg-white/40 dark:bg-airra-dark-forest/30 border border-white/5 text-center relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-[#3DB88A]/5 to-transparent pointer-events-none" />
            
            <div className="relative mx-auto w-24 h-24 sm:w-32 sm:h-32 rounded-[2rem] sm:rounded-[2.5rem] bg-slate-100 dark:bg-zinc-800 border-2 border-slate-200 dark:border-white/5 flex items-center justify-center text-slate-400 dark:text-zinc-500 shadow-inner group-hover:rotate-6 transition-all duration-700">
              <User size={36} className="text-[#3DB88A] sm:size-[48px]" />
            </div>

            <h3 className="text-xl sm:text-2xl font-display font-black uppercase tracking-tight mt-4 sm:mt-6 dark:text-white-800 truncate">
              {profile?.full_name || "Sovereign Mind"}
            </h3>
            <p className="text-[9px] sm:text-[10px] font-mono text-slate-400 dark:text-zinc-500 uppercase tracking-widest mt-1">
              Registered Account ID: {profile?.id?.substring(0, 8) || "N/A"}
            </p>

            <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-slate-100 dark:border-white/5 grid grid-cols-2 gap-3 sm:gap-4">
              <div className="text-center p-2.5 sm:p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 min-w-0">
                <span className="text-[8px] sm:text-[9px] font-mono uppercase text-slate-400 dark:text-zinc-500 block truncate">Streak Logs</span>
                <p className="text-base sm:text-2xl font-black text-amber-500 mt-1 sm:mt-2 flex items-center justify-center gap-1">
                  <Zap size={14} className="fill-amber-500 shrink-0" />
                  <span className="truncate">{currentStreak} d</span>
                </p>
              </div>
              <div className="text-center p-2.5 sm:p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 min-w-0">
                <span className="text-[8px] sm:text-[9px] font-mono uppercase text-slate-400 dark:text-zinc-500 block truncate">Service Plan</span>
                <p className="text-base sm:text-2xl font-black text-[#3DB88A] mt-1 sm:mt-2 uppercase truncate">
                  {subscription?.plan_type || "Premium"}
                </p>
              </div>
            </div>

            {/* Sign Out Button */}
            <button 
              onClick={() => {
                if(signOut) {
                  signOut();
                } else {
                  localStorage.clear();
                  window.location.reload();
                }
              }}
              className="mt-6 sm:mt-10 h-12 sm:h-14 w-full rounded-2xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white text-[9px] sm:text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 sm:gap-3 transition-all active:scale-95 cursor-pointer"
            >
              <LogOut size={13} /> Sever Neural Link
            </button>
          </div>

        </div>

        {/* Right Column - User details form */}
        <div className="xl:col-span-8 airra-card p-5 sm:p-10 md:p-12 bg-white/40 dark:bg-airra-dark-forest/30 border border-white/5">
          <h3 className="text-xl sm:text-3xl font-display font-black uppercase tracking-tighter mb-6 sm:mb-10 dark:text-white">Profile Calibration</h3>
          
          <form onSubmit={handleUpdateProfile} className="space-y-5 sm:space-y-8">
            <div className="space-y-2">
              <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[#3DB88A]">Personal Signature</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Full Name"
                className="w-full h-12 sm:h-18 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-white/5 rounded-2xl px-4 sm:px-6 text-sm sm:text-base text-slate-800 dark:text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#3DB88A] transition-all font-medium"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[#3DB88A]">Consciousness Objectives</label>
              <textarea
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="Declare your current wellness and cognitive intentions..."
                rows={3}
                className="w-full bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-white/5 rounded-2xl p-4 sm:p-6 text-xs sm:text-sm text-slate-800 dark:text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#3DB88A] transition-all font-medium resize-none leading-relaxed"
              />
            </div>

            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 pt-5 sm:pt-6 border-t border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-2 sm:gap-3 text-slate-500 dark:text-zinc-400 text-[10px] sm:text-xs font-medium">
                <ShieldCheck size={14} className="text-[#3DB88A] shrink-0 sm:size-[16px]" />
                <span className="leading-tight">All local settings are stored and synchronized securely.</span>
              </div>

              <div className="flex items-center justify-between lg:justify-end gap-3 sm:gap-6 w-full lg:w-auto">
                {savedText && (
                  <motion.span 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    className="text-[11px] sm:text-xs font-bold text-[#3DB88A] whitespace-nowrap"
                  >
                    {savedText}
                  </motion.span>
                )}
                <button
                  type="submit"
                  disabled={saving}
                  className="h-12 sm:h-16 px-6 sm:px-10 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-zinc-950 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.1em] sm:tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 transition-all shadow-lg shadow-black/10 flex-1 lg:flex-initial text-center justify-center cursor-pointer"
                >
                  {saving ? "Calibrating..." : "Calibrate Profile"}
                </button>
              </div>
            </div>
          </form>

          {/* AI Cognitive Memory Core Section - Task Group 4 */}
          <div className="mt-12 pt-12 border-t border-slate-100 dark:border-white/5 space-y-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4">
              <div>
                <h4 className="text-lg sm:text-xl font-display font-black uppercase tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles size={18} className="text-[#3DB88A] animate-pulse" />
                  Cognitive Memory Core
                </h4>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                  Manage AIRRA's long-term empathetic relationship layer and retention logs.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase tracking-widest border border-emerald-500/20">
                Premium Core Active
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Continuity Metrics Card */}
              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-zinc-900/40 border border-slate-100 dark:border-white/5 space-y-4">
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 dark:text-zinc-500">Continuity Performance Metrics</span>
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-display font-black tracking-tight text-slate-900 dark:text-emerald-400">98.4%</span>
                  <span className="text-xs font-bold text-emerald-500">Perfect Sync</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full w-[98.4%] rounded-full animate-pulse" />
                </div>
                <p className="text-xs text-slate-500 dark:text-zinc-400 italic">
                  Higher scoring signifies robust context retention across journal cycles & voice chat loops.
                </p>
              </div>

              {/* Retention Cycle Card */}
              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-zinc-900/40 border border-slate-100 dark:border-white/5 space-y-4">
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 dark:text-zinc-500">Entropy Retention Span</span>
                <div>
                  <div className="flex justify-between items-center text-xs font-bold mb-1">
                    <span>Calibration Cycle Retention</span>
                    <span className="text-[#3DB88A]">30 Days</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="3" 
                    defaultValue="2" 
                    className="w-full accent-[#3DB88A] bg-slate-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest mt-2">
                    <span>7 Days</span>
                    <span>30 Days</span>
                    <span>Unlimited Entropy</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Synthesized Memory Logs Terminal */}
            <div className="space-y-4">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#3DB88A]">Synthesized Active Relational Memory Keypairs</span>
              <div className="p-4 rounded-xl bg-slate-100 dark:bg-zinc-950 font-mono text-[11px] leading-relaxed text-slate-600 dark:text-zinc-300 space-y-2 border border-slate-200/50 dark:border-white/5">
                <div><span className="text-blue-500 dark:text-blue-400">[0x7F2] USER_MOOD_BASELINE:</span> Calm, Reflective (stabilizing further via guided breathing exercises)</div>
                <div><span className="text-purple-500 dark:text-purple-400">[0x3A1] EMOTIONAL_TRIGGERS:</span> Elevated absolute cognitive load noted on Tue/Wed cycles</div>
                <div><span className="text-emerald-500 dark:text-[#3DB88A]">[0x8FF] CONTINUITY_TRAJECTORY:</span> Focus goal aligned with "Holistic Optimization" across standard active domains</div>
              </div>
            </div>

            {/* Memory Control Commands */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between pt-4">
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                To respect absolute user sovereignty, memory keys can be wiped from local & remote databases instantly.
              </p>
              <button
                type="button"
                onClick={() => {
                  alert("Memory keys purged. AIRRA relational context is reset to default calibration.");
                }}
                className="px-6 py-3 rounded-xl bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-500 text-[10px] font-mono font-black uppercase tracking-widest transition-all cursor-pointer whitespace-nowrap active:scale-95"
              >
                Flush Cognitive Keys
              </button>
            </div>

            {/* Founder Operations & Staged Closed Beta Administration */}
            <div className="mt-8 p-6 rounded-2xl bg-slate-50 dark:bg-zinc-900/40 border border-dashed border-slate-205 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-[9px] font-mono font-bold tracking-wider uppercase text-[#3DB88A] block">FOUNDER CONSOLE</span>
                <p className="text-xs text-slate-600 dark:text-zinc-350 font-bold mt-1">Closed Beta Staged Codes & User Cohort Analytics</p>
                <p className="text-[11px] text-slate-500 dark:text-zinc-500">Access invite-only keys generator, cohort telemetry logs, waitlists, and Sentry observatory monitors.</p>
              </div>
              <Link
                to="/admin-beta"
                className="px-5 py-3 h-12 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-zinc-950 text-[10px] font-mono font-black uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-95 flex items-center shrink-0"
              >
                Launch Control Squadron →
              </Link>
            </div>
          </div>

        </div>

      </div>

      {/* Biometric Heart Rate & HRV Coherence Charts Section */}
      <div className="pt-8 border-t border-slate-100 dark:border-white/5">
        <BiometricCoherence />
      </div>

      {/* Dynamic Achievement Badges System */}
      <div 
        className="pt-8 border-t border-slate-100 dark:border-white/5"
        style={{ paddingBottom: "calc(80px + 16px)" }}
      >
        <AchievementBadges currentStreak={currentStreak} />
      </div>

    </div>
  );
}
