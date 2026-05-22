import React, { useState } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/src/context/AuthContext";
import { useUserStore } from "@/src/services/useUserStore";
import { supabase } from "@/src/lib/supabase";
import AIChat from "@/src/components/AIChat";
import MentalHealthCheckIn from "@/src/components/MentalHealthCheckIn";
import JournalEditor from "@/src/components/JournalEditor";
import { 
  Sparkles, 
  BrainCircuit, 
  Zap, 
  Target, 
  Heart, 
  Feather,
  ArrowUpRight,
  ShieldCheck,
  ChevronRight,
  Activity,
  Compass,
  User,
  Users,
  ArrowRight,
  Moon,
  Clock,
  Focus
} from "lucide-react";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { user } = useAuth();
  const { profile, setProfile } = useUserStore();
  const [isJournaling, setIsJournaling] = useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!profile) return;

    const isTestMode = localStorage.getItem('test_mode') === 'true';
    const now = new Date();
    const lastUpdate = profile.updated_at ? new Date(profile.updated_at) : null;
    
    // Default starting streak to 1 if not set
    const currentStreak = typeof profile.daily_streak === 'number'
      ? profile.daily_streak 
      : 1;

    let newStreak = currentStreak;
    let shouldUpdate = false;

    if (!lastUpdate) {
      newStreak = 1;
      shouldUpdate = true;
    } else {
      const isToday = now.getFullYear() === lastUpdate.getFullYear() &&
                      now.getMonth() === lastUpdate.getMonth() &&
                      now.getDate() === lastUpdate.getDate();

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const isYesterday = yesterday.getFullYear() === lastUpdate.getFullYear() &&
                          yesterday.getMonth() === lastUpdate.getMonth() &&
                          yesterday.getDate() === lastUpdate.getDate();

      if (!isToday) {
        if (isYesterday) {
          newStreak = currentStreak + 1;
        } else {
          newStreak = 1; // broken streak
        }
        shouldUpdate = true;
      }
    }

    if (shouldUpdate) {
      const updatedProfile = {
        ...profile,
        daily_streak: newStreak,
        updated_at: now.toISOString()
      };
      
      setProfile(updatedProfile);

      if (!isTestMode && supabase) {
        supabase
          .from('profiles')
          .update({
            daily_streak: newStreak,
            updated_at: now.toISOString()
          })
          .eq('id', profile.id)
          .then(({ error }) => {
            if (error) console.error("Failed to persist daily streak update:", error);
          });
      }
    }
  }, [profile, setProfile]);

  const firstName = profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Guest';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Morning' : hour < 18 ? 'Afternoon' : 'Evening';

  return (
    <div className="space-y-20 pb-20">
      {/* Cinematic Header */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-12 pt-8">
        <motion.div
           initial={{ opacity: 0, x: -30 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
           className="max-w-4xl space-y-8"
        >
          <div className="flex flex-wrap gap-4 items-center">
            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full airra-glass border border-airra-border/50 dark:border-white/5 text-airra-primary dark:text-airra-dark-glow text-[9px] font-black uppercase tracking-[0.3em]">
              <ShieldCheck size={14} />
              Neural Sanctum: Active
            </div>
            
            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-[0.2em] shadow-sm animate-pulse">
              <Zap size={14} className="text-amber-500 fill-amber-500" />
              {profile?.daily_streak || 1} Day Streak
            </div>
          </div>
          <h1 className="text-airra-display font-display font-black tracking-tighter leading-[0.75] text-airra-text dark:text-white uppercase">
            Good {greeting}, <br />
            <span className="font-serif italic font-normal text-airra-primary dark:text-airra-dark-glow normal-case tracking-tight">{firstName}</span>.
          </h1>
          <p className="text-airra-muted dark:text-airra-dark-muted font-medium text-xl md:text-2xl max-w-2xl leading-relaxed tracking-tight">
            Your consciousness environment is <span className="text-airra-text dark:text-white underline decoration-airra-primary/30 decoration-8 underline-offset-12">optimized</span>. Synthesizing <span className="italic font-serif font-normal text-airra-text dark:text-white px-1">Clarity</span> and <span className="italic font-serif font-normal text-airra-text dark:text-white px-1">Restoration</span>.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="flex items-center gap-6"
        >
          <button 
            onClick={() => setIsJournaling(true)}
            className="h-20 px-10 rounded-[2rem] bg-airra-text dark:bg-white text-airra-bg dark:text-zinc-950 font-black text-[10px] uppercase tracking-[0.2em] shadow-airra-xl hover:scale-105 transition-all flex items-center justify-center gap-4 group"
          >
            <Feather size={20} className="group-hover:-rotate-12 transition-transform" />
            Capture Logic
          </button>
          <Link to="/profile" className="w-20 h-20 rounded-[2rem] bg-white dark:bg-zinc-900 border border-airra-border dark:border-white/5 shadow-airra-lg flex items-center justify-center transition-all hover:scale-110 overflow-hidden relative group">
             {profile?.avatar_url ? (
               <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
             ) : (
               <div className="w-full h-full bg-airra-primary/5 dark:bg-airra-dark-forest flex items-center justify-center text-airra-primary dark:text-airra-dark-glow">
                 <User size={32} />
               </div>
             )}
             <div className="absolute inset-0 bg-airra-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        </motion.div>
      </header>

      {/* Daily Streak Hub */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="airra-card p-8 md:p-10 border-emerald-100/30 dark:border-white/5 bg-gradient-to-r from-emerald-50/50 to-teal-50/20 dark:from-emerald-950/20 dark:to-zinc-900/10 flex flex-col md:flex-row items-center justify-between gap-8 shadow-airra-lg"
      >
        <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-inner flex-shrink-0">
            <Zap size={28} className="fill-amber-500 animate-bounce" />
          </div>
          <div>
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-emerald-800 dark:text-emerald-400 bg-emerald-100/60 dark:bg-emerald-950/40 px-3 py-1 rounded-full">Consecutive Engagement</span>
            <h2 className="text-2xl font-display font-black text-slate-800 dark:text-white mt-3 uppercase tracking-tight">
              {profile?.daily_streak || 1} Day Streak
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 font-medium">
              You are harmonizing perfectly. Keep updating your logs every day to maintain this flow.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white/45 dark:bg-white/5 p-5 rounded-2xl border border-emerald-100/10 max-w-sm w-full shadow-inner">
          <div className="flex-1 space-y-2.5">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400">
              <span>Weekly Resilience</span>
              <span className="text-emerald-700 dark:text-emerald-400 font-bold">{(profile?.daily_streak || 1) % 7 || 7} / 7 days</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-600 dark:bg-emerald-500 h-full rounded-full transition-all duration-1000" 
                style={{ width: `${Math.min(100, (((profile?.daily_streak || 1) % 7 || 7) / 7) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Wellness Overview - New Cinematic Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard title="Wellness Score" value="84" unit="/100" trend="+4" icon={<Sparkles />} color="text-airra-primary" />
        <StatCard title="Sleep Depth" value="7.2" unit="hrs" trend="-0.5" icon={<Moon />} color="text-indigo-400" />
        <StatCard title="Neural Clarity" value="92" unit="%" trend="+12" icon={<BrainCircuit />} color="text-emerald-400" />
        <StatCard title="Focus Index" value="0.8" unit="μs" trend="stable" icon={<Activity />} color="text-amber-400" />
      </section>

      {/* Main Grid System */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
        
        {/* Left Column - Core Interactions */}
        <div className="xl:col-span-8 space-y-20">
          <section>
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-airra-muted flex items-center gap-4">
                <div className="w-8 h-[1px] bg-airra-border" />
                State Assessment Node
              </h2>
            </div>
            <MentalHealthCheckIn />
          </section>

          {/* Emotional Heatmap & Analytics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 airra-card p-12 space-y-10">
               <div className="flex justify-between items-center">
                  <h3 className="text-3xl font-display font-black uppercase tracking-tighter">Emotional Heatmap</h3>
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-airra-primary/20" />
                    <div className="w-3 h-3 rounded-full bg-airra-primary/40" />
                    <div className="w-3 h-3 rounded-full bg-airra-primary" />
                  </div>
               </div>
               <div className="grid grid-cols-7 gap-3">
                  {Array.from({ length: 49 }).map((_, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.01 }}
                      className={`aspect-square rounded-lg ${
                        i % 7 === 0 ? 'bg-airra-primary shadow-inner' :
                        i % 3 === 0 ? 'bg-airra-primary/40' :
                        i % 5 === 0 ? 'bg-airra-primary/60' :
                        'bg-airra-bg dark:bg-zinc-900 border border-airra-border/40 dark:border-white/5'
                      } hover:scale-125 hover:z-10 transition-transform cursor-crosshair`}
                    />
                  ))}
               </div>
               <div className="flex justify-between pt-4 border-t border-airra-border/30 dark:border-white/5">
                  <p className="text-[9px] font-black uppercase tracking-widest text-airra-muted">Cycle: 49 Days Synchronized</p>
                  <p className="text-[9px] font-black uppercase tracking-widest text-airra-primary">High Correlation Detected</p>
               </div>
            </div>

            <div className="airra-card p-12 bg-airra-text dark:bg-white text-airra-bg dark:text-zinc-950 flex flex-col justify-between group overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-airra-primary blur-[80px] opacity-20 pointer-events-none group-hover:opacity-40 transition-opacity" />
               <div className="space-y-6 relative z-10">
                  <div className="w-16 h-16 rounded-[1.5rem] bg-white/10 dark:bg-black/5 flex items-center justify-center border border-white/10">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <h3 className="text-4xl font-display font-black leading-none tracking-tighter uppercase">AI <br /> Insights.</h3>
               </div>
               <div className="space-y-8 relative z-10 pt-10">
                  <p className="text-sm font-medium opacity-60 leading-relaxed italic">
                    "Your pattern suggests high neural resilience today. Initialize Deep Focus protocols for maximum creative output."
                  </p>
                  <button className="w-full h-16 rounded-[1.5rem] bg-airra-bg dark:bg-zinc-950 text-airra-text dark:text-white text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:translate-y-[-2px] transition-all">
                    Apply Protocol <ArrowRight size={14} />
                  </button>
               </div>
            </div>
          </div>

          <section>
             <div className="flex items-center justify-between mb-10">
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-airra-muted flex items-center gap-4">
                <div className="w-8 h-[1px] bg-airra-border" />
                Neural Sync Interface
              </h2>
            </div>
            <AIChat />
          </section>
        </div>

        {/* Right Column - Secondary Actions & Insights */}
        <div className="xl:col-span-4 space-y-20">
          {/* Appointment Call to Action: Sync Section */}
          <section className="airra-card p-12 bg-airra-primary dark:bg-airra-dark-primary text-white relative overflow-hidden group">
            <div className="absolute top-[-10%] right-[-10%] w-60 h-60 bg-white blur-[120px] opacity-10 pointer-events-none group-hover:opacity-30 transition-opacity animate-breathe" />
            <div className="relative z-10 space-y-12">
              <div className="w-16 h-16 rounded-[1.5rem] bg-white/10 flex items-center justify-center border border-white/20 group-hover:rotate-12 transition-transform">
                <Users className="w-8 h-8" />
              </div>
              <div className="space-y-6">
                <h3 className="text-5xl font-display font-black leading-[0.85] tracking-tighter uppercase">Logic <br /> Sync <br /> Active.</h3>
                <p className="text-white/60 font-medium text-lg leading-relaxed">Engage with elite human-AI hybrid protocols for deep cognitive clearing.</p>
              </div>
              <button 
                onClick={() => navigate('/consultation')}
                className="w-full h-20 rounded-[2rem] bg-white text-airra-primary font-black text-[10px] uppercase tracking-[0.3em] transition-all active:scale-[0.98] flex items-center justify-center gap-4 hover:shadow-airra-xl"
              >
                Launch Sequence
                <ArrowUpRight size={18} />
              </button>
            </div>
          </section>

          {/* Operational Insights */}
          <section className="space-y-12">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-airra-muted flex items-center gap-4">
              <div className="w-8 h-[1px] bg-airra-border" />
              System Metrics
            </h2>
            <div className="space-y-6">
              <InsightItem 
                icon={<Clock className="text-airra-primary" />}
                title="Active Session"
                value="42 min"
                desc="Reflection density is optimal"
              />
              <InsightItem 
                icon={<Activity className="text-emerald-400" />}
                title="Heart Rate Var."
                value="72 ms"
                desc="Sympathetic balance detected"
              />
              <InsightItem 
                icon={<Moon className="text-indigo-400" />}
                title="Dream Cycles"
                value="4 Stage"
                desc="REM restoration confirmed"
              />
              <InsightItem 
                icon={<Zap className="text-amber-400" />}
                title="Neural Flux"
                value="Stable"
                desc="Cognitive drift minimized"
              />
            </div>

            <div className="p-10 airra-glass border-airra-border/40 dark:border-white/5 space-y-6">
               <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-lg bg-airra-text dark:bg-white flex items-center justify-center text-airra-bg dark:text-zinc-950 font-black italic text-xs">A</div>
                 <span className="text-[10px] font-black uppercase tracking-[0.2em]">Sovereign Note</span>
               </div>
               <p className="text-sm font-medium text-airra-muted dark:text-airra-dark-muted italic leading-relaxed">
                 "Every neural signal captured within this sanctum is encrypted at the biometric level. Your data remains your own, forever."
               </p>
            </div>
          </section>
        </div>
      </div>

      {isJournaling && (
        <JournalEditor 
          onSave={() => setIsJournaling(false)} 
          onCancel={() => setIsJournaling(false)} 
        />
      )}
    </div>
  );
}

function StatCard({ title, value, unit, trend, icon, color }: { title: string, value: string, unit: string, trend: string, icon: React.ReactNode, color: string }) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="airra-card p-10 space-y-6 group overflow-hidden relative"
    >
       <div className={`absolute -right-8 -bottom-8 w-32 h-32 ${color.replace('text', 'bg')}/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity`} />
       <div className="flex justify-between items-start">
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-airra-muted">{title}</p>
          <div className={`w-10 h-10 rounded-xl bg-airra-bg dark:bg-zinc-900 flex items-center justify-center ${color} shadow-inner`}>
            {React.cloneElement(icon as React.ReactElement, { size: 20 })}
          </div>
       </div>
       <div className="flex items-baseline gap-3">
          <span className="text-6xl font-display font-black tracking-tighter text-airra-text dark:text-white leading-none">{value}</span>
          <span className="text-xl font-bold text-airra-muted opacity-40">{unit}</span>
       </div>
       <div className="flex items-center gap-2">
          <div className={`h-1.5 w-1.5 rounded-full ${trend.startsWith('+') ? 'bg-emerald-500' : trend === 'stable' ? 'bg-airra-primary' : 'bg-rose-500'}`} />
          <span className={`text-[10px] font-black uppercase tracking-widest ${trend.startsWith('+') ? 'text-emerald-500' : 'text-airra-muted'}`}>
            {trend} from cycle 01
          </span>
       </div>
    </motion.div>
  );
}

function InsightItem({ icon, title, value, desc }: { icon: React.ReactNode, title: string, value: string, desc: string }) {
  return (
    <div className="airra-card p-8 flex items-center gap-6 group hover:border-airra-primary/20 transition-all cursor-pointer">
      <div className="w-14 h-14 rounded-2xl bg-airra-bg dark:bg-zinc-800 flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0 shadow-inner">
        {React.cloneElement(icon as React.ReactElement, { size: 22 })}
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-black text-airra-text dark:text-white tracking-widest uppercase">{title}</h4>
          <span className="text-[10px] font-black uppercase text-airra-primary dark:text-airra-dark-glow tracking-widest">{value}</span>
        </div>
        <p className="text-[11px] text-airra-muted dark:text-airra-dark-muted font-medium mt-1 leading-tight">{desc}</p>
      </div>
      <ArrowUpRight size={16} className="text-airra-border group-hover:text-airra-primary transition-all opacity-0 group-hover:opacity-100" />
    </div>
  );
}
