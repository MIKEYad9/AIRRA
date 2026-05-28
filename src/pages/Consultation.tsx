import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "../lib/supabase";
import { useUserStore } from "../services/useUserStore";
import { Coach } from "../types";
import { 
  User, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  ChevronRight, 
  CheckCircle2, 
  Star, 
  CreditCard, 
  ArrowLeft, 
  Heart, 
  Anchor, 
  Zap, 
  FileText, 
  Download, 
  Eye, 
  Search,
  Filter,
  Sparkles,
  ArrowUpRight,
  Stethoscope,
  Sliders,
  TrendingUp,
  BrainCircuit,
  Activity,
  MessageSquare
} from "lucide-react";
import { Link } from "react-router-dom";

// Hardcoded premium practitioners to secure elegant fallback representations 
// in any deployment environment.
const LOCAL_SPECIALISTS: Coach[] = [
  {
    id: "sc-01",
    name: "Dr. Evelyn Vance",
    specialty: "Cognitive Flow & Deep Creativity",
    bio: "Pioneering therapeutic protocols to raise high-amplitude alpha brainwave states of peak intellectual mastery and neuroplastic flow.",
    avatar_url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400",
    price: 180
  },
  {
    id: "sc-02",
    name: "Dr. Aris Thorne",
    specialty: "Autonomic Balance & Vagal Regulation",
    bio: "Clinical psychologist specializing in biofeedback mapping and sensory de-escalation for deep stress, hyper-arousal, and somatic relief.",
    avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400",
    price: 150
  },
  {
    id: "sc-03",
    name: "Dr. Liam Kincaid",
    specialty: "Circadian Rhythm & Sleep Architecture",
    bio: "Circadian researcher specialized in non-pharmacological delta-wave entrainment, bio-luminance timing, and deep nocturnal repair.",
    avatar_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400",
    price: 165
  },
  {
    id: "sc-04",
    name: "Dr. Naida Sterling",
    specialty: "Emotional Sovereignty & Resilience",
    bio: "Helping high-performance creators design safe mental capsules, resolve deep sentiment blocks, and construct stable personal boundaries.",
    avatar_url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=400",
    price: 195
  }
];

const PRESET_GOALS = [
  "Optimizing cognitive flow and deep creativity",
  "Stress Management",
  "Holistic Optimization",
  "Sleep Hygiene & Circadian Restoration",
  "Emotional Balancing & Resilience"
];

const CLINICAL_REPORTS = [
  { id: "NW-4829-01", label: "Neuro-Wellness Assessment (Alpha Sync Focus)" },
  { id: "CTA-4829-04", label: "Cognitive Trend Analysis (Prefrontal Load Focus)" },
  { id: "SAR-4829-09", label: "Sleep Architecture Report (Vagal Wave Coherence)" },
  { id: "none", label: "None (General Directory Integration)" }
];

export default function Consultation() {
  const { profile } = useUserStore();
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);
  const [bookingDate, setBookingDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'specialists' | 'reports'>('specialists');

  // AI Recommendation Diagnostic State
  const [selectedGoal, setSelectedGoal] = useState<string>(
    profile?.mood_goal || "Optimizing cognitive flow and deep creativity"
  );
  const [selectedReportId, setSelectedReportId] = useState<string>("NW-4829-01");
  const [autonomicStress, setAutonomicStress] = useState<"low" | "moderate" | "high">("moderate");
  const [cognitiveLoad, setCognitiveLoad] = useState<"low" | "moderate" | "high">("moderate");
  const [sleepQuality, setSleepQuality] = useState<"good" | "restless" | "severe_disruption">("restless");
  const [interactionLog, setInteractionLog] = useState<string>("");

  useEffect(() => {
    async function loadCoaches() {
      let list = [...LOCAL_SPECIALISTS];
      if (supabase) {
        try {
          const { data } = await supabase.from('coaches').select('*');
          if (data && data.length > 0) {
            list = data;
          }
        } catch (err) {
          console.warn("Could not retrieve online coaches. Relying on verified local practitioners.");
        }
      }
      setCoaches(list);
    }
    loadCoaches();
  }, [profile]);

  // Synchronize from medical report card click
  const handleReportMatch = (id: string) => {
    setSelectedReportId(id);
    // Auto preset sliders and text to represent the selected report telemetry for natural feedback
    if (id === "NW-4829-01") {
       setCognitiveLoad("low");
       setAutonomicStress("moderate");
       setInteractionLog("Reviewing prefrontal alpha waveforms and localized EEG coherence markers.");
    } else if (id === "CTA-4829-04") {
       setCognitiveLoad("high");
       setAutonomicStress("high");
       setInteractionLog("Elevated sensory workload detected. Focusing on attention span recovery and high fatigue levels.");
    } else if (id === "SAR-4829-09") {
       setSleepQuality("severe_disruption");
       setAutonomicStress("high");
       setInteractionLog("Disrupted sleep patterns correlated with poor vagal regulation and late night neural arousal.");
    }
    setActiveTab('specialists');
    // Scroll smoothly to matches area
    const element = document.getElementById("matching-hub");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Live dynamic match score calculation core
  const calculateMatchScore = (coach: Coach) => {
    let score = 75; // Baseline match index

    // 1. Goal Based Alignments
    const goalLower = selectedGoal.toLowerCase();
    if (coach.id === "sc-01") { // Dr. Evelyn Vance - Cognitive Flow Specialist
      if (goalLower.includes("creativity") || goalLower.includes("cognitive") || goalLower.includes("flow") || goalLower.includes("creativity")) {
        score += 12;
      }
    } else if (coach.id === "sc-02") { // Dr. Aris Thorne - Autonomic Balance
      if (goalLower.includes("stress") || goalLower.includes("anxiety") || goalLower.includes("tension") || goalLower.includes("calm")) {
        score += 12;
      }
    } else if (coach.id === "sc-03") { // Dr. Liam Kincaid - Sleep Architecture
      if (goalLower.includes("sleep") || goalLower.includes("circadian") || goalLower.includes("hygiene") || goalLower.includes("nocturnal")) {
        score += 12;
      }
    } else if (coach.id === "sc-04") { // Dr. Naida Sterling - Emotional Sovereignty
      if (goalLower.includes("emotional") || goalLower.includes("sovereign") || goalLower.includes("resilience") || goalLower.includes("holistic")) {
        score += 10;
      }
    }

    // 2. Verified Report Selection Alignments
    if (selectedReportId === "NW-4829-01") { // Neuro-Wellness
      if (coach.id === "sc-01") score += 10;
      if (coach.id === "sc-02") score += 5;
    } else if (selectedReportId === "CTA-4829-04") { // Cognitive Trend
      if (coach.id === "sc-01") score += 15;
      if (coach.id === "sc-04") score += 6;
    } else if (selectedReportId === "SAR-4829-09") { // Sleep Architecture
      if (coach.id === "sc-03") score += 15;
      if (coach.id === "sc-02") score += 8;
    }

    // 3. Current Diagnostic Stress/Fatigue Alignments
    if (coach.id === "sc-01") {
      if (cognitiveLoad === "high") score += 10;
      if (cognitiveLoad === "moderate") score += 5;
    } else if (coach.id === "sc-02") {
      if (autonomicStress === "high") score += 12;
      if (autonomicStress === "moderate") score += 6;
    } else if (coach.id === "sc-03") {
      if (sleepQuality === "severe_disruption") score += 12;
      if (sleepQuality === "restless") score += 6;
    } else if (coach.id === "sc-04") {
      if (autonomicStress === "high" || cognitiveLoad === "high") score += 8;
    }

    // 4. Clinical Semantic Text Parsing
    const textLower = interactionLog.toLowerCase();
    if (textLower.trim()) {
      if (coach.id === "sc-01") {
        const words = ["focus", "creativity", "distracted", "study", "work", "efficient", "brain", "overload", "productivity", "mental block"];
        words.forEach(w => { if (textLower.includes(w)) score += 3.5; });
      } else if (coach.id === "sc-02") {
        const words = ["stress", "tense", "tension", "body", "anxious", "anxiety", "vagal", "heart", "physio", "burnout", "tight", "breath"];
        words.forEach(w => { if (textLower.includes(w)) score += 3.5; });
      } else if (coach.id === "sc-03") {
        const words = ["sleep", "tired", "awake", "disruption", "circadian", "insomnia", "nocturnal", "night", "hour", "restless"];
        words.forEach(w => { if (textLower.includes(w)) score += 3.5; });
      } else if (coach.id === "sc-04") {
        const words = ["feeling", "grief", "sad", "relationship", "boundaries", "emotion", "sovereign", "trust", "identity"];
        words.forEach(w => { if (textLower.includes(w)) score += 3.5; });
      }
    }

    // Bind scores to realistic medical accuracy bounds
    return parseFloat(Math.min(99.8, Math.max(68.0, score)).toFixed(1));
  };

  const getMatchReason = (coach: Coach, score: number) => {
    if (score >= 93) {
      if (coach.id === "sc-01") return "Core Match: High prefrontal workload and focus-drain logs strongly align with Dr. Vance's custom alpha brainwave entrainment protocols.";
      if (coach.id === "sc-02") return "Urgent fit: High-amplitude autonomic stress registers and structural tension indicate vagus nerve decompensation. Somatic balancing recommended.";
      if (coach.id === "sc-03") return "Severe mismatch corrected: Disturbed sleep telemetry directly indexes circadian cycle disruption. Delta-wave architectural recovery advised.";
      return "Synergistic support: Matches your emotional resilience goals and custom sentiment check-ins. Promotes secure clinical boundaries.";
    } else if (score >= 84) {
      if (coach.id === "sc-01") return "Recommended fit to expand creative neural pathways and streamline daily brain productivity.";
      if (coach.id === "sc-02") return "Excellent fit to counter cognitive friction and restore baseline tension markers.";
      if (coach.id === "sc-03") return "Strongly suggested to align internal circadian timing with digital screen interactions.";
      return "Valuable fit to cultivate emotional sovereignty, journaling focus, and mindful agency.";
    }
    return "Standard capability: Certified to assist in general longitudinal wellness and clinical check-in maintenance.";
  };

  // Dynamically map and sort specialists based on real-time calculated match percentages
  const sortedCoaches = [...coaches].map(coach => {
    const score = calculateMatchScore(coach);
    return { ...coach, matchScore: score };
  }).sort((a, b) => b.matchScore - a.matchScore);

  const handleBook = async () => {
    if (!profile || !selectedCoach || !bookingDate || !supabase) return;
    setLoading(true);

    // Simulate Payment Gateway Checkout
    setTimeout(async () => {
      const { error } = await supabase
        .from('consultation_bookings')
        .insert({
          user_id: profile.id,
          coach_id: selectedCoach.id,
          booking_date: new Date(bookingDate).toISOString(),
          status: 'pending'
        });

      if (!error) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setSelectedCoach(null);
          setBookingDate("");
        }, 4000);
      }
      setLoading(false);
    }, 2000);
  };

  return (
    <div className="space-y-24 pb-40">
      {/* Immersive Header */}
      <header className="space-y-12 pt-8">
        <Link 
          to="/dashboard" 
          className="inline-flex items-center gap-3 text-airra-muted hover:text-airra-text dark:hover:text-white transition-all group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em]">Neural Hub Access</span>
        </Link>
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-16">
          <div className="space-y-8 max-w-4xl">
            <div className="inline-flex items-center gap-4 px-6 py-2 rounded-full airra-glass border border-airra-border/50 dark:border-white/5 text-airra-primary dark:text-airra-dark-glow text-[10px] font-black uppercase tracking-widest">
              <ShieldCheck size={18} />
              Elite Practitioner Network
            </div>
            <h1 className="text-airra-display font-display font-black tracking-tighter text-airra-text dark:text-white leading-[0.8] uppercase">
              Expert <br />
              <span className="font-serif italic font-normal text-airra-primary dark:text-airra-dark-glow normal-case tracking-tight">Syncing</span>.
            </h1>
            <p className="text-airra-muted dark:text-airra-dark-muted font-medium text-2xl md:text-3xl max-w-2xl leading-relaxed tracking-tight">
              Synchronize with world-class psychologists and neuro-wellness architects. Curated for your unique <span className="italic font-serif font-normal text-airra-text dark:text-white">Neural Blueprint</span>.
            </p>
          </div>

          <div className="flex bg-white/40 dark:bg-zinc-900/40 p-2 rounded-[2.5rem] border border-airra-border dark:border-white/5 backdrop-blur-2xl shadow-inner">
             <button 
               onClick={() => setActiveTab('specialists')}
               className={`px-10 py-5 rounded-[2.2rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'specialists' ? 'bg-airra-text dark:bg-white text-airra-bg dark:text-zinc-950 shadow-airra-lg' : 'text-airra-muted hover:text-airra-text'}`}
             >
               Specialists
             </button>
             <button 
               onClick={() => setActiveTab('reports')}
               className={`px-10 py-5 rounded-[2.2rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'reports' ? 'bg-airra-text dark:bg-white text-airra-bg dark:text-zinc-950 shadow-airra-lg' : 'text-airra-muted hover:text-airra-text'}`}
             >
               Medical Reports
             </button>
          </div>
        </div>
      </header>

      {activeTab === 'specialists' ? (
        <div className="space-y-16">
          {/* Dynamic AI Neural Recommendation Command Center */}
          <div id="matching-hub" className="airra-card p-10 bg-[#E8F0EC]/20 dark:bg-zinc-950/40 border border-[#2D6A4F]/15 dark:border-white/5 rounded-[2.5rem] space-y-10">
            <div className="flex items-start gap-4 flex-col lg:flex-row lg:justify-between">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 text-[9px] font-mono font-black uppercase tracking-widest text-[#2D6A4F] dark:text-emerald-400 bg-[#E8F0EC] dark:bg-emerald-950/40 px-3.5 py-1.5 rounded-full">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 animate-pulse" /> Diagnostic Resonance Matching Calculator
                </div>
                <h3 className="text-2xl font-display font-black uppercase text-slate-800 dark:text-white">Neural Alignment Engine</h3>
                <p className="text-airra-muted font-medium text-xs">Specialists match levels dynamically re-sort as you configure active goals, clinical logs, and biometric status.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 pt-4 border-t border-slate-200/50 dark:border-white/5">
              {/* Column 1: Core Goal & Connect Report */}
              <div className="space-y-6">
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-airra-muted block mb-3">
                    Active Well-Being Objective
                  </label>
                  <select 
                    value={selectedGoal} 
                    onChange={(e) => setSelectedGoal(e.target.value)}
                    className="w-full h-11 bg-white dark:bg-zinc-900 border border-airra-border/60 dark:border-white/10 rounded-xl px-4 text-[10px] font-black uppercase tracking-wider focus:outline-none focus:border-[#3DB88A] text-slate-700 dark:text-white"
                  >
                    {PRESET_GOALS.map((g, idx) => (
                      <option key={idx} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-airra-muted block mb-3">
                    Correlate Verified Report
                  </label>
                  <select
                    value={selectedReportId}
                    onChange={(e) => handleReportMatch(e.target.value)}
                    className="w-full h-11 bg-white dark:bg-zinc-900 border border-airra-border/60 dark:border-white/10 rounded-xl px-4 text-[10px] font-black uppercase tracking-wider focus:outline-none focus:border-[#3DB88A] text-slate-700 dark:text-white"
                  >
                    {CLINICAL_REPORTS.map((r) => (
                      <option key={r.id} value={r.id}>{r.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Column 2: Multi-Slider / Biometric Metrics Indicators */}
              <div className="space-y-5">
                <div>
                  <div className="flex justify-between items-center mb-1 bg-transparent">
                    <span className="text-[9px] font-black uppercase tracking-widest text-airra-muted">Autonomic Stress Index</span>
                    <span className="text-[10px] font-mono font-black uppercase text-[#2D6A4F] dark:text-emerald-450">{autonomicStress}</span>
                  </div>
                  <div className="flex gap-2">
                    {(['low', 'moderate', 'high'] as const).map((level) => (
                      <button
                        key={level}
                        onClick={() => setAutonomicStress(level)}
                        className={`flex-1 h-9 rounded-lg text-[9px] font-black uppercase tracking-widest transform transition-all cursor-pointer ${
                          autonomicStress === level 
                            ? 'bg-[#2D6A4F] text-white shadow-sm' 
                            : 'bg-white/40 dark:bg-zinc-900 text-airra-muted border border-airra-border/30 dark:border-white/5 hover:bg-white/80'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1 bg-transparent">
                    <span className="text-[9px] font-black uppercase tracking-widest text-airra-muted">Cognitive Performance Index</span>
                    <span className="text-[10px] font-mono font-black uppercase text-[#2D6A4F] dark:text-emerald-450">{cognitiveLoad}</span>
                  </div>
                  <div className="flex gap-2">
                    {(['low', 'moderate', 'high'] as const).map((level) => (
                      <button
                        key={level}
                        onClick={() => setCognitiveLoad(level)}
                        className={`flex-1 h-9 rounded-lg text-[9px] font-black uppercase tracking-widest transform transition-all cursor-pointer ${
                          cognitiveLoad === level
                            ? 'bg-[#2D6A4F] text-white shadow-sm'
                            : 'bg-white/40 dark:bg-zinc-900 text-airra-muted border border-airra-border/30 dark:border-white/5 hover:bg-white/80'
                        }`}
                      >
                        {level === 'low' ? 'Refreshed' : level === 'moderate' ? 'Balanced' : 'Fatigued'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1 bg-transparent">
                    <span className="text-[9px] font-black uppercase tracking-widest text-airra-muted">Nocturnal Sleep Quality</span>
                    <span className="text-[10px] font-mono font-black uppercase text-[#2D6A4F] dark:text-emerald-450">
                      {sleepQuality === 'good' ? 'Good' : sleepQuality === 'restless' ? 'Restless' : 'Severe'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {(['good', 'restless', 'severe_disruption'] as const).map((level) => (
                      <button
                        key={level}
                        onClick={() => setSleepQuality(level)}
                        className={`flex-1 h-9 rounded-lg text-[9px] font-black uppercase tracking-widest transform transition-all cursor-pointer ${
                          sleepQuality === level
                            ? 'bg-[#2D6A4F] text-white shadow-sm'
                            : 'bg-white/40 dark:bg-zinc-900 text-airra-muted border border-airra-border/30 dark:border-white/5 hover:bg-white/80'
                        }`}
                      >
                        {level === 'good' ? 'Deep' : level === 'restless' ? 'Light' : 'Disrupted'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Column 3: Semantic Interaction Logger NLP Input */}
              <div className="flex flex-col justify-between">
                <div className="space-y-3">
                  <span className="text-[9px] font-black uppercase tracking-widest text-airra-muted flex items-center gap-2">
                    <MessageSquare className="w-3.5 h-3.5" /> Recent Interaction Logs / Symptom Narrative
                  </span>
                  <textarea
                    value={interactionLog}
                    onChange={(e) => setInteractionLog(e.target.value)}
                    placeholder="Type words like: sleep, stress, tired, brain, focus, body-tension to dynamically trigger tailored matching weight vectors..."
                    className="w-full h-24 p-4 text-xs bg-white dark:bg-zinc-900 border border-airra-border/60 dark:border-white/10 rounded-xl focus:outline-none focus:border-[#3DB88A] resize-none text-slate-800 dark:text-white"
                  />
                </div>
                {interactionLog.trim() && (
                  <div className="flex justify-between items-center text-[8px] font-mono tracking-wider text-[#2D6A4F] dark:text-emerald-450 uppercase mt-2">
                    <span>NLP parser analyzing text...</span>
                    <span>Weights adjusted</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-16">
            {/* Professional Directory */}
            <div className="xl:col-span-8 space-y-16">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                 {sortedCoaches.map((coach, idx) => {
                   const score = coach.matchScore || 75.0;
                   return (
                    <motion.div
                      key={coach.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      whileHover={{ y: -8 }}
                      onClick={() => setSelectedCoach(coach)}
                      className={`airra-card p-12 cursor-pointer group transition-all duration-700 relative overflow-hidden ${
                        selectedCoach?.id === coach.id 
                        ? 'border-airra-primary dark:border-airra-dark-glow/60 shadow-airra-xl bg-slate-50 dark:bg-zinc-900' 
                        : 'hover:bg-white dark:hover:bg-zinc-900 border-airra-border/40 dark:border-white/5'
                      }`}
                    >
                      {/* AI Resonance Matching score visual display */}
                      <div className={`absolute top-0 left-0 right-0 py-2 px-8 text-[9px] font-black uppercase tracking-[0.4em] text-center z-20 ${
                        score >= 90 
                          ? 'bg-gradient-to-r from-[#2D6A4F] to-[#3DB88A] text-white' 
                          : score >= 80 
                            ? 'bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-950' 
                            : 'bg-zinc-300 text-slate-700 dark:bg-zinc-800 dark:text-zinc-400'
                      }`}>
                         Neural Match: {score}% {score >= 90 && "★ HIGHLY RECOMMENDED"}
                      </div>

                      <div className="space-y-10 relative z-10 pt-4">
                         <div className="flex items-center gap-8">
                            <div className="relative">
                              <div className="w-24 h-24 rounded-[2rem] overflow-hidden border border-airra-border/50 dark:border-zinc-800 shadow-airra-lg transition-transform group-hover:scale-105 duration-1000">
                                 <img src={coach.avatar_url} alt={coach.name} className="w-full h-full object-cover" />
                              </div>
                              <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-emerald-500 border-4 border-white dark:border-zinc-900 shadow-lg flex items-center justify-center">
                                 <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                              </div>
                            </div>
                            <div className="space-y-2">
                               <h3 className="text-3xl font-display font-black text-airra-text dark:text-white uppercase tracking-tighter">{coach.name}</h3>
                               <div className="flex items-center gap-3">
                                  <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map(s => <Star key={s} size={10} className="fill-airra-primary text-airra-primary" />)}
                                  </div>
                                  <span className="text-[9px] font-black text-airra-muted uppercase tracking-widest">(260+ SESSIONS)</span>
                               </div>
                            </div>
                         </div>

                         <div className="space-y-6">
                            <div className="flex flex-wrap gap-3">
                               <span className="px-5 py-2 rounded-full airra-bg dark:bg-zinc-800 text-[9px] font-black uppercase tracking-widest text-[#2D6A4F] dark:text-emerald-450 border border-airra-border/40">
                                 {coach.specialty}
                               </span>
                               <span className="px-5 py-2 rounded-full airra-bg dark:bg-zinc-800 text-[9px] font-black uppercase tracking-widest text-airra-muted border border-airra-border/40">
                                 Expert Practitioner
                               </span>
                            </div>
                            
                            {/* Rich matching reasoning text */}
                            <div className="p-4 rounded-xl bg-white/50 dark:bg-zinc-900/60 border border-slate-200/50 dark:border-white/5 space-y-1">
                              <span className="text-[8px] font-mono font-black uppercase text-[#2D6A4F] dark:text-emerald-400">Match Reason</span>
                              <p className="text-[11px] text-slate-600 dark:text-zinc-300 font-bold leading-relaxed">{getMatchReason(coach, score)}</p>
                            </div>

                            <p className="text-airra-muted dark:text-airra-dark-muted font-medium text-lg leading-relaxed line-clamp-2 italic">
                               "{coach.bio}"
                            </p>
                         </div>

                         <div className="pt-10 border-t border-airra-border/30 dark:border-white/5 flex items-end justify-between">
                            <div className="space-y-1">
                              <p className="text-[9px] font-black text-airra-muted uppercase tracking-widest">Investment</p>
                              <div className="flex items-baseline gap-2">
                                 <span className="text-5xl font-display font-black text-airra-text dark:text-white leading-none">${coach.price}</span>
                                 <span className="text-xs font-bold text-airra-muted opacity-40 uppercase">/ session</span>
                              </div>
                            </div>
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-700 ${
                              selectedCoach?.id === coach.id ? 'bg-airra-primary text-white scale-110 rotate-45' : 'bg-airra-bg dark:bg-zinc-800 text-airra-muted group-hover:scale-110'
                            }`}>
                               <ChevronRight size={28} />
                            </div>
                         </div>
                      </div>
                      {/* Decorative Elements */}
                      <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-[#3DB88A]/5 blur-[80px] rounded-full pointer-events-none group-hover:bg-airra-primary/10 transition-colors" />
                    </motion.div>
                  );
                 })}
              </div>
            </div>

            {/* Booking / Checkout Logic: Premium Integrated View */}
            <div className="xl:col-span-4">
              <div className="sticky top-12">
                <AnimatePresence mode="wait">
                  {selectedCoach ? (
                    <motion.div
                      key="booking"
                      initial={{ opacity: 0, scale: 0.95, y: 30 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 30 }}
                      className="airra-card p-12 space-y-12 shadow-airra-xl border-airra-primary dark:border-airra-dark-glow relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-60 h-60 bg-airra-primary blur-[120px] opacity-10 pointer-events-none animate-breathe" />
                      
                      {success ? (
                        <div className="text-center py-20 space-y-12 relative z-10">
                           <motion.div 
                             initial={{ scale: 0 }}
                             animate={{ scale: 1 }}
                             className="w-32 h-32 bg-emerald-500 rounded-[2.5rem] flex items-center justify-center mx-auto text-white shadow-2xl shadow-emerald-500/20"
                           >
                              <CheckCircle2 size={56} />
                           </motion.div>
                           <div className="space-y-6">
                              <h2 className="text-5xl font-display font-black dark:text-white uppercase tracking-tighter leading-none">Session <br /> Attuned.</h2>
                              <p className="text-airra-muted dark:text-airra-dark-muted font-medium text-lg leading-relaxed">
                                Access details have been disseminated to your secure vault. Preparation protocols are now active.
                              </p>
                           </div>
                           <button 
                             onClick={() => setSuccess(false)}
                             className="w-full h-16 rounded-2xl bg-airra-bg dark:bg-zinc-800 text-airra-text dark:text-white text-[10px] font-black uppercase tracking-widest"
                           >
                             Dismiss Sync
                           </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex flex-col items-center text-center space-y-6 pb-12 border-b border-airra-border/40 dark:border-white/5 relative z-10">
                            <div className="w-32 h-32 rounded-[2.5rem] overflow-hidden shadow-airra-xl border-4 border-white dark:border-zinc-800 group cursor-none">
                               <img src={selectedCoach.avatar_url} alt={selectedCoach.name} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                            </div>
                            <div className="space-y-2">
                              <h2 className="text-4xl font-display font-black dark:text-white uppercase tracking-tighter leading-none">Initialize <br /> with {selectedCoach.name.split(' ')[0]}</h2>
                              <p className="text-[10px] font-black uppercase text-[#2D6A4F] dark:text-emerald-450 tracking-[0.3em]">{selectedCoach.specialty}</p>
                            </div>
                          </div>

                          <div className="space-y-12 relative z-10">
                            <div className="space-y-6">
                              <label className="text-[10px] font-black uppercase tracking-[0.4em] text-airra-muted ml-1 flex items-center gap-3">
                                <Clock size={14} /> Chronos Scheduling
                              </label>
                              <div className="relative">
                                <Calendar size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-airra-primary animate-pulse" />
                                <input 
                                  type="datetime-local" 
                                  value={bookingDate}
                                  onChange={(e) => setBookingDate(e.target.value)}
                                  className="w-full h-20 bg-airra-bg dark:bg-zinc-900 border border-airra-border/40 dark:border-white/5 rounded-3xl pl-16 pr-8 text-airra-text dark:text-white font-black uppercase tracking-widest focus:outline-none focus:border-airra-primary transition-all text-sm shadow-inner"
                                />
                              </div>
                            </div>

                            <div className="p-10 rounded-[2.5rem] bg-airra-text dark:bg-white text-airra-bg dark:text-zinc-950 space-y-8 shadow-airra-lg">
                               <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.3em] opacity-40">
                                  <span>Quantum Sync Fee</span>
                                  <CreditCard size={18} />
                               </div>
                               <div className="flex justify-between items-end">
                                  <span className="text-2xl font-medium tracking-tight">Investment</span>
                                  <span className="text-5xl font-display font-black tracking-tighter">${selectedCoach.price}</span>
                                </div>
                               <div className="flex items-center gap-4 pt-6 border-t border-white/10 dark:border-zinc-200">
                                  <div className="w-3 h-3 bg-airra-primary rounded-full animate-pulse shadow-[0_0_15px_rgba(45,106,79,0.8)]" />
                                  <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">RAZORPAY SECURE ACTIVE</span>
                               </div>
                            </div>

                            <button
                              onClick={handleBook}
                              disabled={loading || !bookingDate}
                              className="w-full h-24 rounded-[2.5rem] bg-airra-primary dark:bg-airra-dark-glow text-white dark:text-zinc-950 font-black text-xs uppercase tracking-[0.4em] shadow-airra-xl hover:scale-105 active:scale-[0.98] transition-all disabled:opacity-30 disabled:scale-100 flex items-center justify-center gap-6 group cursor-pointer"
                            >
                              {loading ? <div className="w-8 h-8 border-4 border-current/20 border-t-current rounded-full animate-spin" /> : (
                                <>
                                  Sync Session
                                  <ArrowUpRight size={24} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                </>
                              )}
                            </button>
                          </div>
                        </>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="airra-card border-dashed p-20 flex flex-col items-center justify-center text-center space-y-12 bg-transparent opacity-40 hover:opacity-100 transition-opacity"
                    >
                      <div className="w-28 h-28 rounded-[2.5rem] bg-airra-bg dark:bg-zinc-800 flex items-center justify-center text-airra-muted relative overflow-hidden group">
                         <Stethoscope className="w-12 h-12 stroke-1 group-hover:scale-110 transition-transform duration-1000" />
                         <motion.div 
                          animate={{ scale: [1, 1.5, 1], opacity: [0.1, 0.3, 0.1] }}
                          transition={{ repeat: Infinity, duration: 4 }}
                          className="absolute inset-0 bg-airra-primary rounded-full blur-2xl"
                         />
                      </div>
                      <div className="space-y-4">
                        <h3 className="text-3xl font-display font-black uppercase tracking-tighter">Practitioner <br /> Selection.</h3>
                        <p className="text-airra-muted dark:text-airra-dark-muted font-medium text-lg leading-relaxed max-w-xs">
                          Select an elite specialist to initialize your therapeutic roadmap synchronization.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-16">
           <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12"
           >
              <ReportCard 
                title="Neuro-Wellness Assessment"
                date="May 12, 2026"
                id="NW-4829-01"
                onMatch={handleReportMatch}
              />
              <ReportCard 
                title="Cognitive Trend Analysis"
                date="May 05, 2026"
                id="CTA-4829-04"
                onMatch={handleReportMatch}
              />
              <ReportCard 
                title="Sleep Architecture Report"
                date="April 28, 2026"
                id="SAR-4829-09"
                onMatch={handleReportMatch}
              />
           </motion.div>
           
           <div className="p-6 sm:p-10 md:p-14 lg:p-16 airra-card bg-airra-text dark:bg-white text-airra-bg dark:text-zinc-950 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-8 sm:gap-10 md:gap-12 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-80 h-80 bg-airra-primary blur-[120px] opacity-10 pointer-events-none" />
              <div className="space-y-4 relative z-10">
                <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-black uppercase tracking-tighter leading-tight md:leading-none break-words">Comprehensive <br className="hidden sm:inline" /> PDF Synthesis.</h3>
                <p className="font-medium opacity-60 text-sm sm:text-base md:text-lg max-w-xl leading-relaxed">Generate a complete longitudinal study of your neural evolution for clinical export.</p>
              </div>
              <button className="h-14 sm:h-16 md:h-20 px-6 sm:px-10 md:px-12 w-full md:w-auto rounded-xl sm:rounded-[2rem] bg-airra-primary dark:bg-airra-dark-glow text-white dark:text-zinc-950 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] shadow-airra-xl hover:scale-105 transition-all relative z-10 whitespace-normal sm:whitespace-nowrap flex items-center justify-center flex-shrink-0">
                Generate Full Vault PDF
              </button>
           </div>
        </div>
      )}
    </div>
  );
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.05
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 90,
      damping: 14
    }
  }
};

interface ReportCardProps {
  title: string;
  date: string;
  id: string;
  onMatch: (id: string) => void;
}

function ReportCard({ title, date, id, onMatch }: ReportCardProps) {
  return (
    <motion.div 
      variants={cardVariants}
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
      className="airra-card p-12 space-y-10 group"
    >
       <div className="flex justify-between items-start">
          <div className="w-16 h-16 rounded-[1.5rem] bg-airra-bg dark:bg-zinc-800 flex items-center justify-center text-airra-primary shadow-inner">
             <FileText className="w-8 h-8" />
          </div>
          <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full">Secure</span>
       </div>
       <div className="space-y-2">
          <h4 className="text-3xl font-display font-black text-airra-text dark:text-white uppercase tracking-tighter leading-none">{title}</h4>
          <p className="text-[10px] font-black text-[#2D6A4F] dark:text-emerald-450 uppercase tracking-widest">{date} • ID: {id}</p>
       </div>
       <div className="grid grid-cols-2 gap-4">
          <button className="h-14 rounded-xl border border-airra-border/50 dark:border-white/5 text-[9px] font-black uppercase tracking-widest text-[#2D6A4F] hover:bg-airra-bg dark:hover:bg-white/5 transition-all flex items-center justify-center gap-2">
             <Eye size={14} /> Preview
          </button>
          <button className="h-14 rounded-xl bg-airra-text dark:bg-white text-airra-bg dark:text-zinc-950 text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 transition-all">
             <Download size={14} /> Export
          </button>
       </div>
       <button 
         onClick={() => onMatch(id)}
         className="w-full h-11 rounded-xl bg-[#E8F0EC]/80 dark:bg-emerald-950/20 text-[#2D6A4F] dark:text-emerald-400 hover:bg-[#E8F0EC] dark:hover:bg-emerald-950/40 text-[9px] font-mono font-black uppercase tracking-widest border border-emerald-500/10 transition-all flex items-center justify-center gap-2 cursor-pointer"
       >
         <Sparkles className="w-3.5 h-3.5" /> Synchronize Specialists
       </button>
    </motion.div>
  );
}
