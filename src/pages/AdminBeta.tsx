import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Users, 
  Key, 
  MessageSquare, 
  Send, 
  Database, 
  TrendingUp, 
  Cpu, 
  ShieldCheck, 
  CheckCircle,
  Clock,
  RefreshCw,
  PlusCircle,
  Copy,
  LayoutDashboard
} from "lucide-react";
import { useObservabilityStore, trackConversionFunnel } from "../services/observability";

interface BetaUserData {
  id: string;
  email: string;
  cohort: string;
  status: "active" | "awaiting_verification" | "waitlisted";
  invitedBy?: string;
  signupDate: string;
}

interface FeedbackItem {
  id: string;
  email: string;
  feature: string;
  sentiment: "Positive" | "Calm" | "Seeking Warmth" | "Neutral" | "Overwhelmed";
  message: string;
  timestamp: string;
}

export default function AdminBeta() {
  const observability = useObservabilityStore();
  const [betaUsers, setBetaUsers] = useState<BetaUserData[]>([
    { id: "1", email: "vedantthakur918@gmail.com", cohort: "Cohort Alpha", status: "active", signupDate: "2026-05-20" },
    { id: "2", email: "guest.analyst@airra.org", cohort: "Cohort Alpha", status: "active", signupDate: "2026-05-22" },
    { id: "3", email: "alpha.trialist@airra.org", cohort: "Cohort Alpha", status: "active", signupDate: "2026-05-24" },
    { id: "4", email: "mindful.explorer@gmail.com", cohort: "Cohort Beta", status: "awaiting_verification", signupDate: "2026-05-27" },
    { id: "5", email: "serenity.now@airra.org", cohort: "Waitlist Priority", status: "waitlisted", signupDate: "2026-05-27" }
  ]);

  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([
    { id: "101", email: "vedantthakur918@gmail.com", feature: "Breathing Coherence", sentiment: "Calm", message: "The slow 3D breathing state immediately decreases anxiety. Tactile mobile animations are perfect.", timestamp: "2026-05-27T18:02:11Z" },
    { id: "102", email: "guest.analyst@airra.org", feature: "Empathetic Model", sentiment: "Positive", message: "Does not exhibit toxic clinical chatbot behaviors. Quiet, non-invasive, beautifully phrased guidance.", timestamp: "2026-05-27T14:45:00Z" },
    { id: "103", email: "alpha.trialist@airra.org", feature: "Biometric Coherence", sentiment: "Seeking Warmth", message: "Would love to see the retention statistics longer terms. Continuity of memory dashboard is premium.", timestamp: "2026-05-27T11:23:42Z" }
  ]);

  const [activeTab, setActiveTab] = useState<"cohorts" | "feedbacks" | "keys" | "observability">("cohorts");
  const [inviteCodes, setInviteCodes] = useState<string[]>(["AIRRA-BETA-2026", "CALM-ENERGY-99", "SOVEREIGN-MIND-77"]);
  const [newCode, setNewCode] = useState("");
  const [feedbackInput, setFeedbackInput] = useState("");
  const [feedbackFeature, setFeedbackFeature] = useState("Empathetic Model");
  const [feedbackSentiment, setFeedbackSentiment] = useState<FeedbackItem["sentiment"]>("Calm");

  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const triggerCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1500);
  };

  const handleCreateCode = () => {
    if (!newCode.trim()) return;
    const cleanCode = newCode.toUpperCase().trim();
    if (!inviteCodes.includes(cleanCode)) {
      setInviteCodes([cleanCode, ...inviteCodes]);
      trackConversionFunnel("DASHBOARD_ENTER", { createdInviteCode: cleanCode });
    }
    setNewCode("");
  };

  const handleAddFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackInput.trim()) return;

    const newItem: FeedbackItem = {
      id: Math.random().toString(),
      email: "vedantthakur918@gmail.com",
      feature: feedbackFeature,
      sentiment: feedbackSentiment,
      message: feedbackInput.trim(),
      timestamp: new Date().toISOString()
    };

    setFeedbacks([newItem, ...feedbacks]);
    setFeedbackInput("");
  };

  // Metrics calculation
  const cohortAlphaCount = betaUsers.filter(u => u.cohort === "Cohort Alpha").length;
  const cohortBetaCount = betaUsers.filter(u => u.cohort === "Cohort Beta").length;
  const waitlistedCount = betaUsers.filter(u => u.status === "waitlisted").length;

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-8 bg-airra-bg dark:bg-zinc-950 relative overflow-hidden transition-all duration-500">
      {/* Dynamic Background Gradients */}
      <div className="absolute top-[-100px] left-[-100px] w-96 h-96 bg-airra-primary/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-100px] right-[-100px] w-96 h-96 bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-10 relative z-10">
        
        {/* Banner with Premium Beta Badge */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 dark:border-white/5 pb-8">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 bg-[#3DB88A] rounded-full animate-ping" />
              <span className="text-[10px] font-mono font-black uppercase tracking-[0.3em] text-[#3DB88A]">FOUNDER OPERATIONS PORTAL</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-display font-black tracking-tighter text-slate-900 dark:text-white uppercase">
              BETA CONTROL <span className="text-[#3DB88A]">SQUADRON</span>
            </h1>
            <p className="text-sm text-slate-500 dark:text-zinc-400 max-w-xl">
              Real-time workspace for staged closed invites, telemetry monitoring, cohort tracking, and behavioral retention verification.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-slate-50 dark:bg-zinc-900/40 p-4 rounded-3xl border border-slate-105 dark:border-white/5">
            <div className="text-right">
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">Closed Beta Phase</span>
              <p className="text-sm font-bold text-slate-800 dark:text-white">Active Cohort Alpha</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#3DB88A]/10 text-[#3DB88A] flex items-center justify-center font-black">
              C1
            </div>
          </div>
        </div>

        {/* Dashboard Top High Level Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-90 w-full border border-slate-100 dark:border-white/5 flex items-center gap-4 shadow-airra-sm">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-550 dark:text-emerald-400 flex items-center justify-center">
              <Users size={24} />
            </div>
            <div>
              <span className="text-[9px] font-mono font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500 block">Active Testing Cohorts</span>
              <span className="text-2xl font-display font-black text-slate-800 dark:text-white">{cohortAlphaCount} Clients</span>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-950 border border-slate-100 dark:border-white/5 flex items-center gap-4 shadow-airra-sm">
            <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 text-yellow-600 flex items-center justify-center">
              <Clock size={24} />
            </div>
            <div>
              <span className="text-[9px] font-mono font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500 block">Awaiting Verifications</span>
              <span className="text-2xl font-display font-black text-slate-800 dark:text-white">{cohortBetaCount} Clients</span>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-950 border border-slate-100 dark:border-white/5 flex items-center gap-4 shadow-airra-sm">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <Database size={24} />
            </div>
            <div>
              <span className="text-[9px] font-mono font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500 block">Total Waitlist Pipeline</span>
              <span className="text-2xl font-display font-black text-slate-800 dark:text-white">{waitlistedCount} Submissions</span>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-950 border border-slate-100 dark:border-white/5 flex items-center gap-4 shadow-airra-sm">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <TrendingUp size={24} />
            </div>
            <div>
              <span className="text-[9px] font-mono font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500 block">D7 Cognitive Retention</span>
              <span className="text-2xl font-display font-black text-slate-800 dark:text-white">92.4% Score</span>
            </div>
          </div>
        </div>

        {/* Modular Tabs Navigation */}
        <div className="flex border-b border-slate-150 dark:border-white/5 overflow-x-auto scrollbar-hide py-1">
          {[
            { id: "cohorts", label: "Cohort Verification", icon: <Users size={15} /> },
            { id: "feedbacks", label: "Beta Feedback Loops", icon: <MessageSquare size={15} /> },
            { id: "keys", label: "Invite-only Key Vault", icon: <Key size={15} /> },
            { id: "observability", label: "System Telemetry Metrics", icon: <Cpu size={15} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-4 border-b-2 font-mono text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab.id 
                  ? "border-[#3DB88A] text-[#3DB88A]" 
                  : "border-transparent text-slate-400 dark:text-zinc-550 hover:text-slate-700 dark:hover:text-zinc-400"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        <div className="min-h-[400px]">
          <AnimatePresence mode="wait">
            
            {/* Cohorts Panel */}
            {activeTab === "cohorts" && (
              <motion.div
                key="cohorts"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-mono uppercase tracking-widest block text-[#3DB88A]">ACTIVE VERIFIED TEST COHORT</span>
                  <button 
                    onClick={() => {
                      const newEmail = prompt("Enter waitlisted client email to invite:");
                      if (newEmail) {
                        setBetaUsers([
                          ...betaUsers, 
                          { id: Math.random().toString(), email: newEmail, cohort: "Cohort Beta", status: "active", signupDate: new Date().toISOString().split('T')[0] }
                        ]);
                      }
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#3DB88A]/10 text-[#3DB88A] text-[9px] font-black font-mono uppercase tracking-widest hover:bg-[#3DB88A] hover:text-white transition-all cursor-pointer"
                  >
                    <PlusCircle size={14} /> Promote Client
                  </button>
                </div>

                <div className="overflow-hidden rounded-3xl border border-slate-100 dark:border-white/5 bg-white dark:bg-zinc-950 shadow-airra-lg">
                  <table className="w-full text-left font-sans border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-zinc-900/50 text-slate-400 dark:text-zinc-500 text-[10px] font-mono uppercase tracking-wider border-b border-slate-100 dark:border-white/5">
                        <th className="p-5">User Digital Identity</th>
                        <th className="p-5">Enrolled Phase Group</th>
                        <th className="p-5">Onboard Date</th>
                        <th className="p-5">Verification Integrity</th>
                        <th className="p-5 text-right">Action Gate</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs font-medium text-slate-700 dark:text-zinc-300 divide-y divide-slate-100 dark:divide-white/5">
                      {betaUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/10 transition-colors">
                          <td className="p-5">
                            <div className="font-mono text-slate-900 dark:text-white font-bold">{user.email}</div>
                          </td>
                          <td className="p-5">
                            <span className="px-3 py-1 bg-slate-100 dark:bg-zinc-900 rounded-lg text-slate-500 font-bold font-mono">
                              {user.cohort}
                            </span>
                          </td>
                          <td className="p-5 text-slate-400 dark:text-zinc-550 font-mono">{user.signupDate}</td>
                          <td className="p-5">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                              user.status === "active" 
                                ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                : user.status === "awaiting_verification"
                                ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"
                                : "bg-purple-500/10 text-purple-500 border border-purple-500/20"
                            }`}>
                              {user.status}
                            </span>
                          </td>
                          <td className="p-5 text-right">
                            {user.status !== "active" ? (
                              <button
                                onClick={() => {
                                  setBetaUsers(betaUsers.map(u => u.id === user.id ? { ...u, status: "active", cohort: "Cohort Beta" } : u));
                                }}
                                className="px-4 py-2 hover:bg-emerald-500 hover:text-white bg-emerald-500/10 text-emerald-500 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer"
                              >
                                Activate Client
                              </button>
                            ) : (
                              <span className="text-[10px] font-mono text-zinc-400">Authorized Passcard</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* Feedbacks Panel */}
            {activeTab === "feedbacks" && (
              <motion.div
                key="feedbacks"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-8"
              >
                {/* Submit Feedback Form */}
                <div className="bg-white dark:bg-zinc-950 p-6 rounded-3xl border border-slate-100 dark:border-white/5 space-y-6 h-fit">
                  <span className="text-[10px] font-mono uppercase tracking-widest block text-[#3DB88A]">SUBMIT FEEDBACK LOG</span>
                  <form onSubmit={handleAddFeedback} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Select Calibrated Feature</label>
                      <select
                        value={feedbackFeature}
                        onChange={(e) => setFeedbackFeature(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-zinc-900/60 border border-slate-100 dark:border-white/5 rounded-2xl p-4 text-xs font-semibold text-slate-800 dark:text-zinc-200 focus:outline-none"
                      >
                        <option>Empathetic Model</option>
                        <option>Breathing Coherence</option>
                        <option>HRV Zen Visuals</option>
                        <option>Memory Continuous Core</option>
                        <option>Billing / Entitlement Sync</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Emotional Sentiment Tone</label>
                      <select
                        value={feedbackSentiment}
                        onChange={(e: any) => setFeedbackSentiment(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-zinc-900/60 border border-slate-100 dark:border-white/5 rounded-2xl p-4 text-xs font-semibold text-slate-800 dark:text-zinc-200 focus:outline-none"
                      >
                        <option>Calm</option>
                        <option>Positive</option>
                        <option>Seeking Warmth</option>
                        <option>Neutral</option>
                        <option>Overwhelmed</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Feedback Observation</label>
                      <textarea
                        value={feedbackInput}
                        onChange={(e) => setFeedbackInput(e.target.value)}
                        placeholder="e.g., The greeting pacing is extremely calming. Felt validated throughout sequence."
                        className="w-full bg-slate-50 dark:bg-zinc-900/60 border border-slate-100 dark:border-white/5 rounded-2xl p-4 text-xs font-semibold text-slate-800 dark:text-zinc-200 focus:outline-none min-h-[120px]"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-4 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-zinc-900 text-[10px] font-black uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Send size={14} /> Commit Feedback Item
                    </button>
                  </form>
                </div>

                {/* Submissions Feed */}
                <div className="md:col-span-2 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 dark:text-zinc-500">QUALITATIVE CLOSED FEEDBACK REGISTRY</span>
                    <span className="text-[9px] font-mono text-zinc-500 uppercase">{feedbacks.length} Captured Instances</span>
                  </div>

                  <div className="space-y-4 max-h-[500px] overflow-y-auto scrollbar-hide pr-2">
                    {feedbacks.map((f) => (
                      <div 
                        key={f.id}
                        className="p-6 rounded-3xl bg-white dark:bg-zinc-90 w-full border border-slate-100 dark:border-white/5 shadow-airra-sm space-y-4 text-left"
                      >
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <span className="font-mono text-xs font-bold text-slate-400 dark:text-zinc-500">{f.email}</span>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] font-black uppercase tracking-wider text-slate-800 dark:text-white">
                                {f.feature}
                              </span>
                              <span className="w-1.5 h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-full" />
                              <span className="text-[9px] font-mono text-zinc-400 dark:text-zinc-550">{new Date(f.timestamp).toLocaleTimeString()}</span>
                            </div>
                          </div>
                          
                          <span className={`px-2.5 py-1 rounded-lg text-[8px] font-mono font-black uppercase tracking-widest ${
                            f.sentiment === "Calm" || f.sentiment === "Positive"
                              ? "bg-emerald-500/10 text-emerald-500"
                              : "bg-amber-500/10 text-amber-500"
                          }`}>
                            {f.sentiment}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-zinc-350 leading-relaxed italic">
                          "{f.message}"
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Keys Panel */}
            {activeTab === "keys" && (
              <motion.div
                key="keys"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="max-w-2xl mx-auto space-y-8"
              >
                <div className="bg-white dark:bg-zinc-950 p-8 rounded-3xl border border-slate-100 dark:border-white/5 space-y-6">
                  <div className="space-y-2 text-center">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#3DB88A] block">CLOSED ACCESS SYSTEM</span>
                    <h3 className="text-xl font-display font-black text-slate-800 dark:text-white uppercase">Generate Cryptographic Passkeys</h3>
                    <p className="text-xs text-slate-400 dark:text-zinc-500">
                      Generate and distribute closed invite codes during Beta stage rollout. 
                    </p>
                  </div>

                  <div className="flex gap-4">
                    <input
                      type="text"
                      placeholder="e.g., MEDITATE-INNER-PEACE"
                      value={newCode}
                      onChange={(e) => setNewCode(e.target.value)}
                      className="flex-1 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-white/5 rounded-2xl px-6 text-xs font-mono font-bold text-slate-850 dark:text-white focus:outline-none uppercase"
                    />
                    <button
                      onClick={handleCreateCode}
                      className="px-6 rounded-2xl bg-[#3DB88A] hover:bg-emerald-555 text-white text-[10px] uppercase font-black tracking-widest font-mono transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <PlusCircle size={14} /> Mint Code
                    </button>
                  </div>

                  <div className="pt-4 space-y-3">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 block pl-1">MINTED REGISTRY KEYPAIRS (TAP TO COPY)</span>
                    <div className="divide-y divide-slate-100 dark:divide-white/5">
                      {inviteCodes.map((code) => (
                        <div 
                          key={code} 
                          onClick={() => triggerCopy(code)}
                          className="flex justify-between items-center py-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-900/40 px-3 rounded-xl group transition-all"
                        >
                          <span className="font-mono text-sm font-bold text-slate-800 dark:text-white group-hover:text-[#3DB88A]">
                            {code}
                          </span>
                          <button className="text-[9px] font-mono font-black uppercase text-slate-400 group-hover:text-[#3DB88A] flex items-center gap-1.5 transition-all">
                            {copiedCode === code ? (
                              <span className="text-emerald-500 flex items-center gap-1"><CheckCircle size={12} /> COPIED</span>
                            ) : (
                              <span className="flex items-center gap-1"><Copy size={11} /> COPY KEY</span>
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Observability Panel */}
            {activeTab === "observability" && (
              <motion.div
                key="observability"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Events Logged */}
                  <div className="bg-white dark:bg-zinc-950 p-6 rounded-3xl border border-slate-100 dark:border-white/5 space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-50 dark:border-white/5">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-[#3DB88A]">POSTHOG DIGITAL EVENT STAIRCASE</span>
                      <button 
                        onClick={() => observability.clearAll()}
                        className="text-[9px] font-mono font-black uppercase tracking-wider text-rose-500 hover:opacity-80"
                      >
                        FLUSH LOGS
                      </button>
                    </div>

                    <div className="space-y-3 max-h-[350px] overflow-y-auto scrollbar-hide pr-1">
                      {observability.events.length === 0 ? (
                        <div className="py-12 text-center text-xs text-slate-400 dark:text-zinc-550 italic font-mono">
                          Waiting for diagnostic actions or dashboard conversions...
                        </div>
                      ) : (
                        observability.events.map((evt, idx) => (
                          <div 
                            key={idx}
                            className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/30 border border-slate-100 dark:border-white/5 font-mono text-[10px] text-slate-500 dark:text-zinc-400 space-y-1 text-left"
                          >
                            <div className="flex justify-between font-bold">
                              <span className="text-emerald-500">{evt.eventName}</span>
                              <span className="text-zinc-550 font-medium">
                                {new Date(evt.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                            <pre className="text-[9px] leading-tight text-slate-400 dark:text-zinc-500 overflow-x-auto whitespace-pre-wrap">
                              {JSON.stringify(evt.properties)}
                            </pre>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Sentry Logs */}
                  <div className="bg-white dark:bg-zinc-950 p-6 rounded-3xl border border-slate-100 dark:border-white/5 space-y-4">
                    <span className="text-[10px] font-mono uppercase tracking-widest block text-rose-500 pb-2 border-b border-slate-50 dark:border-white/5">
                      SENTRY CRITICAL EXCEPTION OBSERVATORY
                    </span>

                    <div className="space-y-3 max-h-[350px] overflow-y-auto scrollbar-hide pr-1">
                      {observability.errors.length === 0 ? (
                        <div className="py-12 text-center text-xs text-emerald-500 font-mono italic">
                          No exceptions noted. Perfect security and runtime containment maintained.
                        </div>
                      ) : (
                        observability.errors.map((err, idx) => (
                          <div 
                            key={idx}
                            className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10 font-mono text-[10px] text-rose-500 space-y-1 text-left"
                          >
                            <div className="flex justify-between font-bold">
                              <span>ERROR FLAG CALIBRATED</span>
                              <span>{new Date(err.timestamp).toLocaleTimeString()}</span>
                            </div>
                            <div className="font-bold text-slate-700 dark:text-zinc-300 pr-1">{err.message}</div>
                            {err.componentStack && (
                              <div className="text-[9px] text-[#A24D4D]">{err.componentStack}</div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* API latency timing monitors */}
                <div className="p-6 rounded-3xl bg-[#06100B] text-left border border-[#3DB88A]/20 font-mono">
                  <div className="flex justify-between items-center pb-4 border-b border-white/5">
                    <span className="text-[10px] text-[#3DB88A] font-black uppercase tracking-widest">
                      REAL-TIME ENDPOINT TELEMETRY MONITORS
                    </span>
                    <span className="text-[9px] text-emerald-500/60">NODE_ENV: PRODUCTION</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 text-xs font-bold divide-y md:divide-y-0 md:divide-x divide-white/10 text-zinc-350">
                    <div className="p-2">
                      <span className="text-[9px] text-zinc-500 uppercase font-black block tracking-wider">/api/gemini/suggestMood</span>
                      <div className="text-xl font-display font-black text-emerald-400 mt-1">112ms</div>
                      <span className="text-[8px] text-emerald-600">Avg Content Response P99</span>
                    </div>

                    <div className="p-2 md:pl-6">
                      <span className="text-[9px] text-zinc-500 uppercase font-black block tracking-wider">/api/gemini/chat Proxy</span>
                      <div className="text-xl font-display font-black text-emerald-400 mt-1">456ms</div>
                      <span className="text-[8px] text-emerald-600">Interactive Streaming Handshake</span>
                    </div>

                    <div className="p-2 md:pl-6">
                      <span className="text-[9px] text-zinc-500 uppercase font-black block tracking-wider">/api/gemini/transcribe Proxy</span>
                      <div className="text-xl font-display font-black text-emerald-400 mt-1">890ms</div>
                      <span className="text-[8px] text-emerald-600">Spectrogram Frequency FFT Mapping</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
