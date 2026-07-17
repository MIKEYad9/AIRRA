import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/src/context/AuthContext";
import { useUserStore } from "@/src/services/useUserStore";
import { supabase } from "@/src/lib/supabase";
import AIChat from "@/src/components/AIChat";
import MentalHealthCheckIn from "@/src/components/MentalHealthCheckIn";
import JournalEditor from "@/src/components/JournalEditor";
import BreathingTimer from "@/src/components/BreathingTimer";
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
  Focus,
  FileText,
  CheckCircle2,
  Wind,
  X
} from "lucide-react";
import { Link } from "react-router-dom";

export interface Milestone {
  days: number;
  title: string;
  badge: string;
  description: string;
  color: string;
  glowColor: string;
  emoji: string;
}

export const MILESTONES: Record<number, Milestone> = {
  3: {
    days: 3,
    title: "Consistent Mindset",
    badge: "BRONZE STREAK 🥉",
    description: "3 consecutive days of checking in with your mind. Focus is forming.",
    color: "from-amber-600/20 to-amber-950/40 border-amber-500/30 text-amber-500",
    glowColor: "rgba(245, 158, 11, 0.4)",
    emoji: "🥉"
  },
  5: {
    days: 5,
    title: "Mental Equilibrium",
    badge: "SILVER STREAK 🥈",
    description: "5 days of consistent self-care. Deep autonomic balance is active.",
    color: "from-slate-400/20 to-slate-800/40 border-slate-300/30 text-slate-300",
    glowColor: "rgba(209, 213, 219, 0.4)",
    emoji: "🥈"
  },
  7: {
    days: 7,
    title: "Perfect Balance Array",
    badge: "GOLD STREAK 🥇",
    description: "A full week of complete alignment. Autonomical resonance established.",
    color: "from-yellow-500/20 to-amber-900/30 border-yellow-400/40 text-yellow-400",
    glowColor: "rgba(234, 179, 8, 0.5)",
    emoji: "🥇"
  },
  10: {
    days: 10,
    title: "Deca-Resonance Domain",
    badge: "COSMIC STREAK 🌌",
    description: "10 days of mindfulness. Transformative calm has fully emerged.",
    color: "from-purple-500/20 to-indigo-950/40 border-purple-400/40 text-purple-400",
    glowColor: "rgba(168, 85, 247, 0.5)",
    emoji: "🌌"
  }
};

export default function Dashboard() {
  const { user } = useAuth();
  const { profile, setProfile } = useUserStore();
  const [isJournaling, setIsJournaling] = useState(false);
  const [isBreathingOpen, setIsBreathingOpen] = useState(false);
  const navigate = useNavigate();

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeMilestoneAlert, setActiveMilestoneAlert] = useState<Milestone | null>(null);
  const [insightsExpanded, setInsightsExpanded] = useState<boolean>(false);
  const [insightsLoading, setInsightsLoading] = useState<boolean>(false);
  const [insightsError, setInsightsError] = useState<boolean>(false);

  const [hasLoggedToday, setHasLoggedToday] = useState(false);
  const [animateStreak, setAnimateStreak] = useState(false);

  const [forceStreakSaver, setForceStreakSaver] = useState<boolean>(false);
  const [timeLeftStr, setTimeLeftStr] = useState<string>("");
  const [isStreakSaverTime, setIsStreakSaverTime] = useState<boolean>(false);

  const [isDark, setIsDark] = useState(true);
  React.useEffect(() => {
    const checkDark = () => {
      const darkActive = document.documentElement.classList.contains("dark") || localStorage.getItem("theme") === "dark";
      setIsDark(darkActive);
    };
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    const updateTimeLeft = () => {
      const now = new Date();
      const hours = now.getHours();
      
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      const diffMs = midnight.getTime() - now.getTime();
      
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      setTimeLeftStr(`${diffHrs}h ${diffMins}m`);
      setIsStreakSaverTime(hours >= 22);
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleApplyProtocol = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setInsightsLoading(true);
    setInsightsError(false);

    const getAuthHeader = async () => {
      if (localStorage.getItem('test_mode') === 'true') {
        return "Bearer mock-test-token";
      }
      if (supabase) {
        const { data } = await supabase.auth.getSession();
        if (data?.session?.access_token) {
          return `Bearer ${data.session.access_token}`;
        }
      }
      return "";
    };

    try {
      const res = await fetch("/api/protocol/apply", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": await getAuthHeader()
        },
        body: JSON.stringify({ protocolId: "deep-focus" })
      });
      setToastMessage("Protocol Applied ✓");
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      console.error(err);
      setInsightsError(true);
      setTimeout(() => setInsightsError(false), 2000);
    } finally {
      setInsightsLoading(false);
    }
  };

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

      // If they hit a milestone on load, celebrate!
      if (MILESTONES[newStreak]) {
        setTimeout(() => {
          setActiveMilestoneAlert(MILESTONES[newStreak]);
          setToastMessage(`🏆 Milestone Reached: ${MILESTONES[newStreak].badge}!`);
          setTimeout(() => setToastMessage(null), 5000);
        }, 1200);
      }

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

  React.useEffect(() => {
    const checkTodayLog = async () => {
      if (!profile) return;
      const isTestMode = localStorage.getItem('test_mode') === 'true';
      if (isTestMode || !supabase) {
        if (profile.updated_at) {
          const now = new Date();
          const lastUpdate = new Date(profile.updated_at);
          const isToday = now.getFullYear() === lastUpdate.getFullYear() &&
                          now.getMonth() === lastUpdate.getMonth() &&
                          now.getDate() === lastUpdate.getDate();
          if (isToday) {
            setHasLoggedToday(true);
          }
        }
        return;
      }

      try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const { data, error } = await supabase
          .from('mood_logs')
          .select('id')
          .eq('user_id', profile.id)
          .gte('created_at', todayStart.toISOString())
          .limit(1);

        if (!error && data && data.length > 0) {
          setHasLoggedToday(true);
        }
      } catch (err) {
        console.warn("Failed to check daily mood log:", err);
      }
    };

    checkTodayLog();
  }, [profile]);

  const handleMoodLogged = () => {
    if (!hasLoggedToday) {
      setHasLoggedToday(true);
      setAnimateStreak(true);
      if (profile) {
        const nextStreak = (profile.daily_streak || 1) + 1;
        setProfile({
          ...profile,
          daily_streak: nextStreak
        });

        // Trigger milestone check after setting state
        if (MILESTONES[nextStreak]) {
          setTimeout(() => {
            setActiveMilestoneAlert(MILESTONES[nextStreak]);
            setToastMessage(`🏆 Milestone Reached: ${MILESTONES[nextStreak].badge}!`);
            setTimeout(() => setToastMessage(null), 5000);
          }, 800);
        } else {
          setToastMessage(`Wellness Checked In ✓ +1 Day Streak!`);
          setTimeout(() => setToastMessage(null), 3500);
        }
      }
      setTimeout(() => {
        setAnimateStreak(false);
      }, 4000);
    }
  };

  // Dynamic resonance matching algorithm
  const getRecommendedSpecialists = () => {
    const goal = profile?.mood_goal?.toLowerCase() || "";
    // default matching scores
    let drVanceScore = 82;
    let drThorneScore = 80;
    let drKincaidScore = 78;
    let drSterlingScore = 85;

    if (goal.includes("creativity") || goal.includes("focus") || goal.includes("cognitive") || goal.includes("flow")) {
      drVanceScore += 16;
    }
    if (goal.includes("stress") || goal.includes("tension") || goal.includes("calm") || goal.includes("anxiety")) {
      drThorneScore += 18;
    }
    if (goal.includes("sleep") || goal.includes("rest") || goal.includes("insomnia") || goal.includes("circadian")) {
      drKincaidScore += 19;
    }
    if (goal.includes("emotional") || goal.includes("resilience") || goal.includes("trauma") || goal.includes("boundaries")) {
      drSterlingScore += 15;
    }

    const specialists = [
      {
        id: "sc-01",
        name: "Dr. Evelyn Vance",
        specialty: "Cognitive Flow & Deep Creativity",
        bio: "Pioneering therapeutic protocols to raise high-amplitude alpha brainwave states of peak intellectual mastery and neuroplastic flow.",
        avatar_url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400",
        score: Math.min(99, drVanceScore),
        tag: "Alpha Harmony Resonance",
        reason: "Highly attuned with your Cognitive Flow focus and alpha-symmetry targets.",
        report: "Neuro-Wellness Assessment (Alpha Sync Focus)"
      },
      {
        id: "sc-02",
        name: "Dr. Aris Thorne",
        specialty: "Autonomic Balance & Vagal Regulation",
        bio: "Clinical psychologist specializing in biofeedback mapping and sensory de-escalation for deep stress, hyper-arousal, and somatic relief.",
        avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400",
        score: Math.min(99, drThorneScore),
        tag: "Vagal Autonomic Attunement",
        reason: "Optimal alignment for autonomic restoration index and vagal toning.",
        report: "Cognitive Trend Analysis (Prefrontal Load)"
      },
      {
        id: "sc-03",
        name: "Dr. Liam Kincaid",
        specialty: "Circadian Rhythm & Sleep Architecture",
        bio: "Circadian researcher specialized in non-pharmacological delta-wave entrainment, bio-luminance timing, and deep nocturnal repair.",
        avatar_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400",
        score: Math.min(99, drKincaidScore),
        tag: "Delta Restorative Synapse",
        reason: "Highest cohesion to optimize sleep cycles and nocturnal recovery indexes.",
        report: "Sleep Architecture Report (Vagal Coherence)"
      },
      {
        id: "sc-04",
        name: "Dr. Naida Sterling",
        specialty: "Emotional Sovereignty & Resilience",
        bio: "Helping high-performance creators design safe mental capsules, resolve deep sentiment blocks, and construct stable personal boundaries.",
        avatar_url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=400",
        score: Math.min(99, drSterlingScore),
        tag: "Sovereign Emotional Integration",
        reason: "Deep alignment with emotional processing goals and self-boundary resilience.",
        report: "Diagnostic Sovereignty Profile"
      }
    ];

    return specialists.sort((a, b) => b.score - a.score);
  };

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
            
            <motion.div 
              animate={animateStreak ? {
                scale: [1, 1.15, 0.95, 1.05, 1],
                backgroundColor: [
                  "rgba(245, 158, 11, 0.1)",
                  "rgba(16, 185, 129, 0.25)",
                  "rgba(16, 185, 129, 0.15)",
                  "rgba(245, 158, 11, 0.15)",
                  "rgba(245, 158, 11, 0.1)"
                ],
                borderColor: [
                  "rgba(245, 158, 11, 0.2)",
                  "rgba(16, 185, 129, 0.6)",
                  "rgba(16, 185, 129, 0.4)",
                  "rgba(245, 158, 11, 0.4)",
                  "rgba(245, 158, 11, 0.2)"
                ],
              } : {}}
              transition={{ duration: 1.5, cubicBezier: [0.16, 1, 0.3, 1] }}
              className={`inline-flex items-center gap-3 px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-[0.2em] shadow-sm ${
                animateStreak 
                  ? 'text-emerald-500 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.25)]' 
                  : 'bg-amber-500/10 dark:bg-amber-500/5 border-amber-500/20 text-amber-600 dark:text-amber-400 animate-pulse'
              }`}
            >
              <Zap size={14} className={animateStreak ? "text-emerald-500 fill-emerald-500" : "text-amber-500 fill-amber-500"} />
              {profile?.daily_streak || 1} Day Streak
            </motion.div>
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
          className="flex flex-wrap items-center gap-4 sm:gap-6"
        >
          <button 
            onClick={() => setIsBreathingOpen(true)}
            className="h-20 px-8 rounded-[2rem] bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-airra-xl hover:scale-105 transition-all flex items-center justify-center gap-4 group cursor-pointer border border-emerald-500/20"
          >
            <Wind size={20} className="group-hover:scale-110 transition-transform animate-pulse text-emerald-100" />
            Quick Breath
          </button>
          <button 
            onClick={() => setIsJournaling(true)}
            className="h-20 px-8 rounded-[2rem] bg-airra-text dark:bg-white text-airra-bg dark:text-zinc-950 font-black text-[10px] uppercase tracking-[0.2em] shadow-airra-xl hover:scale-105 transition-all flex items-center justify-center gap-4 group cursor-pointer"
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

      {/* Simulation Trigger Panel (Subtle & Beautiful) */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-100/30 dark:bg-zinc-900/20 border border-slate-200/50 dark:border-white/5 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isStreakSaverTime ? "bg-amber-500 animate-ping" : "bg-zinc-500"}`} />
          <span>Real-time Clock: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (Streak Saver Active after 10:00 PM: {isStreakSaverTime ? "YES [≥ 22:00]" : "NO [< 22:00]"})</span>
        </div>
        <button
          type="button"
          onClick={() => setForceStreakSaver(!forceStreakSaver)}
          className={`px-3 py-1.5 rounded-xl border transition-all active:scale-95 text-[9px] cursor-pointer ${
            forceStreakSaver 
              ? "bg-[#2D7A5F] border-[#3DB88A] text-white" 
              : "bg-slate-200/50 dark:bg-zinc-900/60 border-slate-300/30 dark:border-white/5 hover:bg-slate-200 hover:text-slate-800 dark:hover:bg-white/5"
          }`}
        >
          {forceStreakSaver ? "⚡ SIMULATION: ACTIVE" : "⚙️ Simulate After-10:00PM Alert"}
        </button>
      </div>

      {/* Streak Saver Guardian Dynamic Alert */}
      <AnimatePresence>
        {(isStreakSaverTime || forceStreakSaver) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ type: "spring", damping: 15 }}
            className={`airra-card p-6 sm:p-8 md:p-10 border overflow-hidden relative shadow-lg ${
              hasLoggedToday 
                ? 'border-emerald-500/20 bg-gradient-to-br from-emerald-50/20 to-teal-50/10 dark:from-emerald-950/10 dark:to-teal-950/5' 
                : 'border-amber-500/30 dark:border-amber-400/20 bg-gradient-to-br from-amber-50/40 via-orange-50/10 to-red-50/5 dark:from-amber-950/25 dark:via-orange-950/10 dark:to-red-950/5'
            }`}
          >
            {/* Ambient Background Aura Lights */}
            <div className={`absolute -right-20 -top-20 w-60 h-60 blur-3xl pointer-events-none transition-colors duration-1000 ${
              hasLoggedToday ? 'bg-emerald-500/10' : 'bg-amber-500/15'
            }`} />

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
              <div className="flex items-start gap-4 sm:gap-6">
                {/* Dynamic Icon */}
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border shadow-inner ${
                  hasLoggedToday 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' 
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-500 animate-pulse animate-[bounce_2s_infinite]'
                }`}>
                  {hasLoggedToday ? (
                    <ShieldCheck size={28} className="text-emerald-500" />
                  ) : (
                    <Clock size={28} className="text-amber-500" />
                  )}
                </div>

                <div className="space-y-1 text-left">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-[9px] font-black uppercase tracking-[0.25em] px-2.5 py-1 rounded-full font-mono ${
                      hasLoggedToday 
                        ? 'bg-emerald-100/60 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400' 
                        : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                    }`}>
                      {hasLoggedToday ? "STREAK LOCKED IN" : "STREAK GUARDIAN: PENDING"}
                    </span>
                    {!hasLoggedToday && (
                      <span className="text-[9px] font-mono font-bold text-red-500 dark:text-red-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                        PAST 10:00 PM LIMIT
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-lg sm:text-xl font-display font-black uppercase tracking-tight text-slate-900 dark:text-white pt-2.5">
                    {hasLoggedToday 
                      ? "Success! Your daily momentum is preserved." 
                      : "Strict Action Required (Muted 10:00 PM Alert)"
                    }
                  </h3>
                  
                  <p className="text-xs text-slate-550 dark:text-zinc-350 leading-relaxed max-w-xl font-medium">
                    {hasLoggedToday 
                      ? `Splendid work today! Your alignment check-in is verified and your ${profile?.daily_streak || 1}-day streak is secured for tomorrow.` 
                      : `It is currently past 10:00 PM and no neural state diagnostics have been registered. Activate the direct "Streak Saver" routine or select your current status manually below to preserve your consecutive daily alignment score.`
                    }
                  </p>
                </div>
              </div>

              {/* Dynamic Actions Block */}
              <div className="w-full md:w-auto shrink-0 flex flex-col sm:flex-row md:flex-col gap-3">
                {hasLoggedToday ? (
                  <button
                    type="button"
                    disabled
                    className="h-14 px-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 select-none"
                  >
                    <ShieldCheck size={16} /> SECURED
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!profile) return;
                        const isTestMode = localStorage.getItem('test_mode') === 'true';
                        
                        if (!isTestMode && supabase) {
                          try {
                            await supabase
                              .from('mood_logs')
                              .insert({
                                user_id: profile.id,
                                mood: 'Grounded',
                                intensity: 6,
                                created_at: new Date().toISOString()
                              });
                          } catch (err) {
                            console.warn("Failed to insert streak saver log:", err);
                          }
                        }
                        
                        // Execute mood logged handler which updates state and shows celebratory milestone modals/shimmer
                        handleMoodLogged();
                        setToastMessage("🛡️ Streak Saved! Grounded vibration logged 🌿✨");
                        setTimeout(() => setToastMessage(null), 4000);
                      }}
                      className="h-14 px-8 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2 border border-amber-400/40"
                    >
                      <span>Streak Saver</span> 🛡️
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const target = document.getElementById("state-assessment-node");
                        if (target) {
                          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          setToastMessage("🎯 Focus centered on Mood Check-in Node");
                          setTimeout(() => setToastMessage(null), 3500);
                        }
                      }}
                      className="text-center text-[10px] font-mono hover:underline text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200 tracking-wider py-1 cursor-pointer"
                    >
                      Or select manually below
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Daily Streak Hub */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="airra-card p-8 md:p-10 border-emerald-100/30 dark:border-white/5 bg-gradient-to-r from-emerald-50/50 to-teal-50/20 dark:from-emerald-950/20 dark:to-zinc-900/10 flex flex-col md:flex-row items-center justify-between gap-8 shadow-airra-lg"
      >
        <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
          <motion.div 
            animate={animateStreak ? {
              scale: [1, 1.25, 0.9, 1.1, 1],
              backgroundColor: [
                "rgba(245, 158, 11, 0.1)",
                "rgba(16, 185, 129, 0.25)",
                "rgba(16, 185, 129, 0.15)",
                "rgba(245, 158, 11, 0.15)",
                "rgba(245, 158, 11, 0.1)"
              ],
              borderColor: [
                "rgba(245, 158, 11, 0.2)",
                "rgba(16, 185, 129, 0.6)",
                "rgba(16, 185, 129, 0.4)",
                "rgba(245, 158, 11, 0.4)",
                "rgba(245, 158, 11, 0.2)"
              ]
            } : {}}
            transition={{ duration: 2, cubicBezier: [0.16, 1, 0.3, 1] }}
            className={`w-16 h-16 rounded-2xl flex items-center justify-center border shadow-inner flex-shrink-0 transition-colors duration-1000 ${
              animateStreak 
                ? 'text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]' 
                : 'bg-amber-500/10 border-amber-500/20 text-amber-500'
            }`}
          >
            <Zap size={28} className={`fill-current ${animateStreak ? 'animate-none' : 'animate-bounce'}`} />
          </motion.div>
          <div>
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-emerald-800 dark:text-emerald-400 bg-emerald-100/60 dark:bg-emerald-950/40 px-3 py-1 rounded-full">Consecutive Engagement</span>
            <motion.h2 
              animate={animateStreak ? {
                scale: [1, 1.1, 0.98, 1.02, 1],
                textShadow: [
                  "0 0 0px rgba(16,185,129,0)",
                  "0 0 15px rgba(16,185,129,0.6)",
                  "0 0 5px rgba(16,185,129,0.3)",
                  "0 0 0px rgba(16,185,129,0)"
                ]
              } : {}}
              transition={{ duration: 2.5 }}
              className={`text-2xl font-display font-black mt-3 uppercase tracking-tight transition-colors duration-1000 ${
                animateStreak ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-800 dark:text-white'
              }`}
            >
              {profile?.daily_streak || 1} Day Streak
            </motion.h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 font-medium select-none">
              {animateStreak 
                ? "First mood logged today! Your daily alignment is active."
                : "You are harmonizing perfectly. Keep updating your logs every day to maintain this flow."
              }
            </p>

            {/* Streak Milestone Achievements Grid */}
            <div className="flex flex-wrap items-center gap-3 mt-4">
              <span className="text-[9px] font-black uppercase tracking-widest text-[#2D7A5F] dark:text-emerald-400">Milestones:</span>
              <div className="flex items-center gap-2">
                {Object.values(MILESTONES).map((m) => {
                  const isUnlocked = (profile?.daily_streak || 1) >= m.days;
                  return (
                    <button
                      key={m.days}
                      type="button"
                      onClick={() => {
                        if (isUnlocked) {
                          setActiveMilestoneAlert(m);
                          setToastMessage(`🏆 Displaying: ${m.title}`);
                          setTimeout(() => setToastMessage(null), 3000);
                        } else {
                          setToastMessage(`🔒 Reach ${m.days} day streak to unlock "${m.badge}"`);
                          setTimeout(() => setToastMessage(null), 3000);
                        }
                      }}
                      className={`relative w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                        isUnlocked 
                          ? 'bg-gradient-to-br from-emerald-950/50 to-[#2D7A5F]/40 border border-[#3DB88A] text-[#3DB88A] shadow-[0_0_10px_rgba(61,184,138,0.25)] scale-105 active:scale-95 cursor-pointer hover:scale-110' 
                          : 'bg-slate-200/50 dark:bg-zinc-900/40 border border-slate-300/30 dark:border-white/5 text-slate-400 opacity-40 cursor-help'
                      }`}
                      title={`${m.title} (${m.days} Days)`}
                    >
                      <span className="text-sm select-none">{m.emoji}</span>
                      {isUnlocked && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-black/50 animate-ping" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
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
          <section id="state-assessment-node">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-airra-muted flex items-center gap-4">
                <div className="w-8 h-[1px] bg-airra-border" />
                State Assessment Node
              </h2>
            </div>
            <MentalHealthCheckIn onLogged={handleMoodLogged} />
          </section>

          {/* Emotional Heatmap & Analytics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-stretch">
            <div className="md:col-span-2 airra-card p-6 sm:p-8 lg:p-10 space-y-6 sm:space-y-8 flex flex-col justify-between">
               <div className="flex justify-between items-center">
                  <h3 className="text-2xl sm:text-3xl font-display font-black uppercase tracking-tighter">Emotional Heatmap</h3>
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-airra-primary/20" />
                    <div className="w-3 h-3 rounded-full bg-airra-primary/40" />
                    <div className="w-3 h-3 rounded-full bg-airra-primary" />
                  </div>
               </div>
               <div className="grid grid-cols-7 gap-1.5 sm:gap-2 md:gap-2.5">
                  {Array.from({ length: 49 }).map((_, i) => (
                    <motion.div 
                      key={`heatmap-cell-${i}`}
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

            <div 
              onClick={() => setInsightsExpanded(!insightsExpanded)}
              className={`airra-card p-6 sm:p-8 lg:p-10 bg-airra-text dark:bg-white text-airra-bg dark:text-zinc-950 flex flex-col justify-between group overflow-hidden cursor-pointer border-2 transition-all duration-500 h-full min-h-[365px] sm:min-h-[390px] lg:min-h-[410px] relative ${
                insightsExpanded ? 'border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'border-transparent'
              } ${insightsError ? 'border-rose-500 animate-pulse' : ''} ${insightsLoading ? 'opacity-50' : ''}`}
            >
               <div className="absolute top-0 right-0 w-32 h-32 bg-airra-primary blur-[80px] opacity-20 pointer-events-none group-hover:opacity-40 transition-opacity" />
               <div className="space-y-4 relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-white/10 dark:bg-black/5 flex items-center justify-center border border-white/10">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl sm:text-3xl lg:text-4xl font-display font-black leading-[1.05] tracking-tighter uppercase">AI <br /> Insights.</h3>
               </div>
               <div className="space-y-5 relative z-10 pt-6">
                  <p className={`text-xs sm:text-sm font-medium leading-relaxed italic transition-all duration-700 ${insightsExpanded ? 'blur-0 opacity-90' : 'blur-[3px] opacity-35 select-none'}`}>
                    "Your pattern suggests high neural resilience today. Initialize Deep Focus protocols for maximum creative output."
                  </p>
                  <button 
                    onClick={handleApplyProtocol}
                    disabled={insightsLoading}
                    className="w-full h-14 rounded-2xl bg-airra-bg dark:bg-zinc-950 text-airra-text dark:text-white text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:translate-y-[-2px] transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {insightsLoading ? "CONNECTING..." : "APPLY PROTOCOL"} <ArrowRight size={12} />
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
          </section>

          {/* Specialist Resonance Alignment Section */}
          <section className="space-y-10 mb-20">
            <div className="flex items-center justify-between">
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-airra-muted flex items-center gap-4">
                <div className="w-8 h-[1px] bg-airra-border" />
                Resonant Specialist Match Engine
              </h2>
              <span className="text-[9px] font-mono font-black uppercase tracking-widest text-[#3DB88A] bg-[#3DB88A]/10 px-2.5 py-1 rounded-full border border-[#3DB88A]/20 font-bold">
                ACTIVE COHERENCE MATCH
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {getRecommendedSpecialists().slice(0, 2).map((specialist, idx) => {
                const isPrimary = idx === 0;
                return (
                  <motion.div
                    key={specialist.id}
                    whileHover={{ y: -6 }}
                    className={`airra-card p-8 md:p-10 border relative overflow-hidden flex flex-col justify-between group h-full transition-all duration-300 ${
                      isPrimary 
                        ? 'border-emerald-500/20 bg-gradient-to-br from-[#0C1B14] to-zinc-950 text-white shadow-[0_0_30px_rgba(16,185,129,0.1)]' 
                        : 'border-airra-border/45 dark:border-white/5 bg-white dark:bg-zinc-900/40 text-slate-800 dark:text-zinc-100'
                    }`}
                  >
                    {/* Glowing background spheres for high-level resonance feeling */}
                    <div className={`absolute -right-16 -bottom-16 w-48 h-48 rounded-full blur-[90px] pointer-events-none transition-opacity duration-300 group-hover:opacity-100 ${
                      isPrimary ? 'bg-emerald-500/10' : 'bg-airra-primary/5'
                    }`} />

                    <div className="space-y-6 relative z-10">
                      {/* Top status bar */}
                      <div className="flex items-center justify-between gap-3">
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full font-mono ${
                          isPrimary 
                            ? 'bg-emerald-950/60 border border-emerald-800/20 text-[#3DB88A]' 
                            : 'bg-slate-100 dark:bg-zinc-950 text-slate-500 dark:text-zinc-400 border border-slate-200/50 dark:border-white/5'
                        }`}>
                          {specialist.tag}
                        </span>
                        <div className="flex items-baseline gap-1">
                          <span className={`text-2xl font-display font-black leading-none ${isPrimary ? 'text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                            {specialist.score}%
                          </span>
                          <span className={`text-[8px] font-mono font-bold uppercase ${isPrimary ? 'text-emerald-500/70' : 'text-slate-400'}`}>
                            Match
                          </span>
                        </div>
                      </div>

                      {/* Specialist Info */}
                      <div className="flex items-center gap-4 pt-3 text-left">
                        <div className="relative shrink-0">
                          <img 
                            src={specialist.avatar_url} 
                            alt={specialist.name} 
                            referrerPolicy="no-referrer"
                            className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-200 dark:border-white/10 group-hover:scale-105 transition-transform duration-300"
                          />
                          {isPrimary && (
                            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-zinc-950 flex items-center justify-center text-[7px] font-black text-white">✓</span>
                          )}
                        </div>
                        <div className="text-left space-y-1">
                          <h3 className={`text-lg font-display font-black uppercase tracking-tight ${isPrimary ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                            {specialist.name}
                          </h3>
                          <p className={`text-[10px] font-mono font-bold uppercase tracking-widest ${isPrimary ? 'text-emerald-350 dark:text-emerald-450' : 'text-airra-primary'}`}>
                            {specialist.specialty}
                          </p>
                        </div>
                      </div>

                      {/* Dynamic Matching Logic Callout */}
                      <div className={`p-4 rounded-2xl border text-[11px] leading-relaxed select-none text-left ${
                        isPrimary 
                          ? 'bg-emerald-950/30 border-emerald-900/30 text-emerald-200/80 font-medium' 
                          : 'bg-slate-50 dark:bg-zinc-950/60 border-slate-200/50 dark:border-white/5 text-slate-600 dark:text-zinc-400 font-medium'
                      }`}>
                        <div className="flex items-center gap-1.5 font-bold uppercase text-[8px] tracking-widest mb-1 font-mono text-[#3DB88A] shrink-0">
                          <BrainCircuit size={10} /> Resonance Reason
                        </div>
                        {specialist.reason}
                      </div>

                      {/* Scientific Report Affinity */}
                      <div className="flex items-center gap-2 pt-1 font-mono text-[9px] uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                        <FileText size={12} className={isPrimary ? "text-[#3DB88A]" : "text-slate-400"} />
                        <span>Affinitive Report: <strong>{specialist.report}</strong></span>
                      </div>
                    </div>

                    <div className="pt-8 relative z-10 mt-auto">
                      <button
                        onClick={() => navigate("/consultation")}
                        className={`w-full h-14 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer transition-all duration-300 active:scale-[0.98] ${
                          isPrimary
                            ? 'bg-[#3DB88A] hover:bg-[#32a479] text-white shadow-lg shadow-emerald-950/20'
                            : 'bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200'
                        }`}
                      >
                        Request Alignment Sync
                        <ArrowRight size={12} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </section>

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

      <AnimatePresence>
        {activeMilestoneAlert && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6"
          >
            {/* Absolute Background Particle Spray */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-1/4 left-1/4 w-[250px] h-[250px] rounded-full bg-emerald-500/20 blur-[100px] animate-pulse" />
              <div className="absolute bottom-1/4 right-1/4 w-[250px] h-[250px] rounded-full bg-teal-500/20 blur-[100px] animate-pulse" />
            </div>

            <motion.div 
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              transition={{ type: "spring", damping: 20, stiffness: 100 }}
              className={`relative max-w-lg w-full p-10 rounded-[3rem] border bg-gradient-to-b ${activeMilestoneAlert.color} text-center space-y-8 shadow-[0_0_80px_rgba(16,185,129,0.15)] overflow-hidden`}
            >
              {/* Spinning/pulsing aura badge backer */}
              <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 rounded-full border border-dashed border-emerald-500/40"
                />
                <motion.div 
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-2 rounded-full border border-double border-emerald-400/20"
                />
                <span className="text-6xl relative z-10 select-none animate-bounce">{activeMilestoneAlert.emoji}</span>
              </div>

              <div className="space-y-3">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-400 bg-emerald-950/65 px-4 py-1.5 rounded-full border border-emerald-800/30 font-mono">
                  {activeMilestoneAlert.badge}
                </span>
                <h2 className="text-3xl font-display font-black text-white uppercase tracking-tight pt-2">
                  {activeMilestoneAlert.title}
                </h2>
                <div className="w-16 h-[2.5px] bg-emerald-500/30 mx-auto rounded-full my-4 animate-pulse" />
                <p className="text-zinc-300 font-medium text-sm leading-relaxed px-4">
                  {activeMilestoneAlert.description}
                </p>
              </div>

              <div className="bg-black/40 backdrop-blur-md p-6 rounded-2xl border border-white/5 space-y-1">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-zinc-500">CONSISTENCY STATUS</span>
                  <span className="text-emerald-400 font-bold tracking-widest">LEVEL UP ✓</span>
                </div>
                <div className="text-left text-[10px] text-zinc-400 leading-normal pt-2 font-medium">
                  Perfect bio-reserves maintenance. Continued log integration helps lock in behavioral patterns and neural stability. Keep daily checks active!
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setActiveMilestoneAlert(null);
                    setToastMessage("Aura Synchronized! 🌌✨");
                    setTimeout(() => setToastMessage(null), 3000);
                  }}
                  className="flex-1 py-4 px-8 rounded-2xl bg-[#2D7A5F] hover:bg-[#389676] active:scale-95 transition-all text-white text-xs font-black uppercase tracking-widest shadow-lg cursor-pointer"
                >
                  Absorb Aura
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-10 right-10 z-[100] px-8 py-4 rounded-full bg-[#132218] text-white border border-[#2D7A5F] shadow-2xl flex items-center gap-3 font-mono text-xs uppercase font-bold tracking-widest"
          >
            <Sparkles className="text-[#3DB88A]" size={16} />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Persistent Quick Breath Floating Action Button */}
      <div className="fixed bottom-28 right-10 z-40">
        <motion.button
          whileHover={{ scale: 1.05, y: -4 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsBreathingOpen(true)}
          className="h-14 px-6 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(16,185,129,0.35)] hover:shadow-[0_12px_35px_rgba(16,185,129,0.5)] border border-emerald-400/30 flex items-center gap-3 transition-all cursor-pointer"
          title="Immediate Breathwork Relief"
        >
          <Wind size={18} className="animate-pulse" />
          <span>Quick Breath</span>
        </motion.button>
      </div>

      {/* Quick Breath Modal */}
      <AnimatePresence>
        {isBreathingOpen && (
          <div id="quick-breath-modal" className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsBreathingOpen(false)}
              className="absolute inset-0 bg-zinc-950/85 backdrop-blur-md"
            />

            {/* Modal Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              transition={{ type: "spring", damping: 25, stiffness: 180 }}
              className="relative w-full max-w-6xl rounded-[2.5rem] bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 shadow-airra-xl z-20 overflow-hidden flex flex-col my-8 max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-8 py-6 border-b border-slate-150 dark:border-white/5 bg-slate-50/50 dark:bg-zinc-950/40 shrink-0">
                <div className="flex items-center gap-3">
                  <span className="text-[9px] font-black uppercase tracking-[0.25em] text-[#2D6A4F] dark:text-emerald-400 bg-[#E8F0EC]/80 dark:bg-emerald-950/40 px-3.5 py-1.5 rounded-full flex items-center gap-2 font-mono">
                    <Wind size={12} className="animate-pulse" /> Immediate Relief Node
                  </span>
                  <h3 className="text-xl font-display font-black uppercase tracking-tight text-slate-800 dark:text-white">
                    Quick Breathing Pacer
                  </h3>
                </div>
                <button
                  onClick={() => setIsBreathingOpen(false)}
                  className="p-2.5 rounded-full border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Core Content Scroll Area */}
              <div className="p-4 sm:p-6 md:p-8 overflow-y-auto flex-1">
                <BreathingTimer isDark={isDark} />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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
