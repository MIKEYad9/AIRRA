import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { ArrowLeft, Sparkles, ShieldCheck, Activity, BrainCircuit, Heart, Compass, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function DiagnosticScreen() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [networkLogs, setNetworkLogs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"baseline" | "spectrum">("baseline");

  // Generate mock dynamic brainwave data
  const chartData = Array.from({ length: 40 }).map((_, i) => ({
    tick: i,
    alpha: Math.sin(i * 0.4) * 20 + 50 + (Math.random() - 0.5) * 8,
    theta: Math.cos(i * 0.2) * 15 + 40 + (Math.random() - 0.5) * 5,
    gamma: Math.sin(i * 0.7) * 10 + 25 + (Math.random() - 0.5) * 4,
  }));

  const logs = [
    "Establishing encrypted biometric pipeline...",
    "Querying latest state logs from Supabase...",
    "Correlating 48.2 billion localized neural parameters...",
    "Validating parasympathetic vagal stimulation markers...",
    "Applying real-time Heart Rate Variability (HRV) offsets...",
    "Synthesizing customized AI diagnostic blueprint...",
    "AIRRA Link stable. Diagnostic compile complete."
  ];

  useEffect(() => {
    // Simulate real-time console log prints before showing report
    let logIndex = 0;
    const interval = setInterval(() => {
      if (logIndex < logs.length) {
        setNetworkLogs(prev => [...prev, logs[logIndex]]);
        logIndex++;
      } else {
        clearInterval(interval);
        setTimeout(() => setLoading(false), 800);
      }
    }, 250);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-16 pb-32 pt-28 md:pt-36 px-6 sm:px-10 page-container min-h-screen bg-airra-bg dark:bg-airra-dark-bg text-slate-800 dark:text-zinc-100">
      
      {/* Back to Pulse Link */}
      <div className="pt-4">
        <button 
          onClick={() => navigate("/dashboard")}
          className="inline-flex items-center gap-3 text-airra-muted hover:text-airra-text dark:hover:text-white transition-all group pointer-events-auto h-12"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em]">Return to Pulse Dashboard</span>
        </button>
      </div>

      {loading ? (
        <div className="airra-card p-12 bg-white/40 dark:bg-airra-dark-forest/40 border border-white/5 backdrop-blur-3xl rounded-[32px] min-h-[500px] flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex items-center gap-4 text-airra-primary">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-current border-t-transparent" />
              <span className="text-[11px] font-mono uppercase tracking-[0.3em]">biometric diagnostic pending...</span>
            </div>
            
            <div className="font-mono text-xs text-slate-500 dark:text-zinc-400 space-y-2 mt-8 max-w-2xl leading-relaxed">
              {networkLogs.map((log, idx) => (
                <motion.p 
                  initial={{ opacity: 0, x: -10 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  key={idx}
                  className="flex items-center gap-2"
                >
                  <span className="text-[#3DB88A]">&gt;</span> {log}
                </motion.p>
              ))}
            </div>
          </div>

          <div className="w-full bg-slate-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: "0%" }} 
              animate={{ width: "100%" }} 
              transition={{ duration: 2.2, ease: "easeInOut" }} 
              className="bg-[#3DB88A] h-full"
            />
          </div>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-12"
        >
          
          {/* Header */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-4 px-6 py-2 rounded-full border border-airra-border/50 dark:border-white/5 bg-white/10 text-airra-primary dark:text-airra-dark-glow text-[10px] font-black uppercase tracking-widest">
              <ShieldCheck size={16} />
              Sovereign Report Verified
            </div>
            <h1 className="text-5xl md:text-7xl font-display font-black uppercase tracking-tighter leading-none">
              Diagnostic <br />
              <span className="font-serif italic font-normal text-[#3DB88A] normal-case tracking-tight">Synthesis</span>
            </h1>
            <p className="text-airra-muted dark:text-zinc-400 font-medium text-lg max-w-2xl leading-relaxed">
              Real-time deep physiological diagnostic. Your neurological signal is mapped directly against localized feedback markers.
            </p>
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
            
            {/* Left Pane - Physiological Charts */}
            <div className="xl:col-span-8 airra-card p-10 bg-white/40 dark:bg-airra-dark-forest/30 border border-white/5 backdrop-blur-3xl shadow-airra-xl space-y-10">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div>
                  <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-[#3DB88A]">Real-Time Feed</span>
                  <h3 className="text-2xl font-display font-black uppercase tracking-tight text-slate-800 dark:text-white mt-1">Neurological Waves</h3>
                </div>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setActiveTab("baseline")}
                    className={`h-11 px-6 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'baseline' ? 'bg-[#3DB88A] text-white' : 'bg-white/10 text-slate-500 hover:text-white'}`}
                  >
                    Coherence Timeline
                  </button>
                  <button 
                    onClick={() => setActiveTab("spectrum")}
                    className={`h-11 px-6 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'spectrum' ? 'bg-[#3DB88A] text-white' : 'bg-white/10 text-slate-500 hover:text-white'}`}
                  >
                    Oscillator Density
                  </button>
                </div>
              </div>

              {/* Chart Area */}
              <div className="h-[350px] w-full pt-6 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <XAxis dataKey="tick" stroke="#666" fontSize={9} tickLine={false} />
                    <YAxis stroke="#666" fontSize={9} tickLine={false} domain={[0, 100]} />
                    <Tooltip contentStyle={{ background: "#111", border: "1px solid #222", color: "#fff" }} />
                    <Line type="monotone" dataKey="alpha" stroke="#3DB88A" strokeWidth={2} dot={false} name="Alpha Activity" />
                    {activeTab === "spectrum" && (
                      <>
                        <Line type="monotone" dataKey="theta" stroke="#818CF8" strokeWidth={1.5} dot={false} name="Theta Sync" />
                        <Line type="monotone" dataKey="gamma" stroke="#FBBF24" strokeWidth={1.5} dot={false} name="Gamma Coherence" />
                      </>
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Card Footer Legend */}
              <div className="grid grid-cols-3 gap-6 pt-8 border-t border-white/5">
                <div className="text-left space-y-1">
                  <span className="text-[9px] text-[#3DB88A] font-bold uppercase tracking-widest">Alpha Rhythm</span>
                  <p className="text-xl font-bold dark:text-white">88% Match</p>
                </div>
                <div className="text-left space-y-1">
                  <span className="text-[9px] text-[#818CF8] font-bold uppercase tracking-widest">Vagal Stimulation</span>
                  <p className="text-xl font-bold dark:text-white">Active (Gain 4.8)</p>
                </div>
                <div className="text-left space-y-1">
                  <span className="text-[9px] text-[#FBBF24] font-bold uppercase tracking-widest">Spectral Density</span>
                  <p className="text-xl font-bold dark:text-white">Stable Floor</p>
                </div>
              </div>

            </div>

            {/* Right Pane - Diagnostic Analysis and Biometrics */}
            <div className="xl:col-span-4 space-y-10">
              
              <div className="airra-card p-10 bg-white/40 dark:bg-airra-dark-forest/30 border border-white/5 space-y-8">
                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-[#3DB88A]">Metrics Analysis</h3>
                
                <div className="space-y-6">
                  <div className="flex justify-between items-center py-4 border-b border-slate-200 dark:border-white/5">
                    <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">Heart Rate Variability</span>
                    <span className="font-mono text-sm font-black text-slate-800 dark:text-white">92 ms</span>
                  </div>
                  <div className="flex justify-between items-center py-4 border-b border-slate-200 dark:border-white/5">
                    <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">Autonomic Tension</span>
                    <span className="font-mono text-sm font-black text-emerald-500">Low (Relaxed)</span>
                  </div>
                  <div className="flex justify-between items-center py-4 border-b border-slate-200 dark:border-white/5">
                    <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">Cognitive Load Index</span>
                    <span className="font-mono text-sm font-black text-slate-800 dark:text-white">3.1 / 10</span>
                  </div>
                  <div className="flex justify-between items-center py-4">
                    <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">Frontal Coherence</span>
                    <span className="font-mono text-sm font-black text-slate-800 dark:text-white">0.94 Hz</span>
                  </div>
                </div>
              </div>

              <div className="airra-card p-10 bg-[#132218] border border-[#2D7A5F]/20 text-white space-y-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#3DB88A] blur-[80px] opacity-20 pointer-events-none" />
                <div className="flex items-center gap-3">
                  <Sparkles size={18} className="text-[#3DB88A]" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">AIRRA Diagnostics</span>
                </div>
                <p className="text-sm font-medium leading-relaxed italic opacity-85 text-emerald-200/90">
                  "Your prefrontal cortex displays high amplitude alpha synchronization. Your neural baseline has undergone a complete shift toward parasympathetic control, clearing outstanding tension markers safely."
                </p>
              </div>

            </div>

          </div>

        </motion.div>
      )}

    </div>
  );
}
