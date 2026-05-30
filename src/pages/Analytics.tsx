import React from "react";
import { motion } from "motion/react";
import WellnessAnalytics from "@/src/components/WellnessAnalytics";
import { 
  Sparkles, 
  ArrowLeft, 
  Download, 
  Cpu, 
  ChevronRight, 
  Zap, 
  ShieldCheck, 
  FileText, 
  ArrowUpRight,
  Stethoscope,
  Activity,
  History
} from "lucide-react";
import { Link } from "react-router-dom";

export default function AnalyticsPage() {
  return (
    <div className="space-y-24 pb-40">
      {/* Immersive Medical Header */}
      <header className="space-y-12 pt-8">
        <Link 
          to="/dashboard" 
          className="inline-flex items-center gap-3 text-airra-muted hover:text-airra-text dark:hover:text-white transition-all group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em]">Return to Core Hub</span>
        </Link>
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-16">
          <div className="space-y-8 max-w-4xl">
            <div className="inline-flex items-center gap-4 px-6 py-2 rounded-full airra-glass border border-airra-border/50 dark:border-white/5 text-airra-primary dark:text-airra-dark-glow text-[10px] font-black uppercase tracking-widest">
              <Activity size={18} />
              Real-time Neural Diagnostics
            </div>
            <h1 className="text-airra-display font-display font-black tracking-tighter text-airra-text dark:text-white leading-[0.8] uppercase">
              Neural <br />
              <span className="font-serif italic font-normal text-airra-primary dark:text-airra-dark-glow normal-case tracking-tight">Diagnostics</span>.
            </h1>
            <p className="text-airra-muted dark:text-airra-dark-muted font-medium text-2xl md:text-3xl max-w-2xl leading-relaxed tracking-tight">
              Clinical-grade analysis of your <span className="italic font-serif font-normal text-airra-text dark:text-white">Emotional Architecture</span>. Deciphering the silent metrics of your cognitive evolution.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            <button className="h-16 px-6 sm:px-10 rounded-[1.5rem] bg-airra-surface dark:bg-zinc-900 border border-airra-border/50 dark:border-white/5 text-[10px] font-black uppercase tracking-widest text-airra-muted hover:text-airra-text dark:hover:text-white transition-all flex items-center justify-center gap-3 sm:gap-4 shadow-inner w-full sm:w-auto">
              <Download size={18} className="shrink-0" />
              <span className="truncate">Export Dossier</span>
            </button>
            <button className="h-16 px-6 sm:px-10 rounded-[1.5rem] bg-airra-text dark:bg-white text-airra-bg dark:text-zinc-950 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 sm:gap-4 shadow-airra-xl hover:scale-105 transition-all w-full sm:w-auto">
              <FileText size={18} className="shrink-0" />
              <span className="truncate">Full Synthesis</span>
            </button>
          </div>
        </div>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      >
        <WellnessAnalytics />
      </motion.div>

      {/* Advanced Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        <MetricBrief 
          title="Detected Patterns" 
          icon={<Cpu />}
          items={[
            { label: "Peak Resilience", value: "09:00 — 11:30" },
            { label: "Cognitive Fatigue", value: "Cycle 16:40" },
            { label: "Recovery Velocity", value: "+18.2%" }
          ]}
        />
        <MetricBrief 
          title="Clinical Markers" 
          icon={<Stethoscope />}
          items={[
            { label: "Stress Amplitude", value: "Moderate" },
            { label: "Sleep Coherence", value: "High Symmetry" },
            { label: "Mood Periodicity", value: "7.2 Days" }
          ]}
        />
        <MetricBrief 
          title="Bio-Sync Status" 
          icon={<History />}
          items={[
            { label: "Sync Fidelity", value: "99.4%" },
            { label: "Neural Drift", value: "Minimal" },
            { label: "Uptime Cycle", value: "14 Days" }
          ]}
        />
      </div>

      {/* Medical Grade Disclaimer/Seal */}
      <div className="p-16 airra-glass border-airra-primary/10 rounded-[3rem] flex flex-col md:flex-row items-center justify-between gap-12">
         <div className="flex items-center gap-8">
            <div className="w-24 h-24 rounded-[2.5rem] bg-airra-primary/10 flex items-center justify-center text-airra-primary">
               <ShieldCheck size={48} />
            </div>
            <div className="space-y-2">
               <h3 className="text-3xl font-display font-black uppercase tracking-tighter">Verified Clinical Data</h3>
               <p className="text-airra-muted font-medium text-lg italic max-w-sm">All diagnostic metrics follow HIPAA-compliant encryption standards.</p>
            </div>
         </div>
         <div className="flex items-center gap-6">
            <span className="text-[10px] font-black uppercase tracking-widest opacity-30">SECURE NODE ID: 4892-A-DX</span>
            <div className="w-1 h-1 rounded-full bg-airra-border" />
            <span className="text-[10px] font-black uppercase tracking-widest opacity-30">ENCRYPTED AT REST</span>
         </div>
      </div>
    </div>
  );
}

function MetricBrief({ title, icon, items }: { title: string, icon: React.ReactNode, items: { label: string, value: string }[] }) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="airra-card p-12 space-y-10 group bg-white/40 dark:bg-zinc-900/40"
    >
       <div className="flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-airra-bg dark:bg-zinc-800 flex items-center justify-center text-airra-primary transition-transform group-hover:scale-110 duration-700">
             {React.cloneElement(icon as React.ReactElement, { size: 24 })}
          </div>
          <h4 className="text-2xl font-display font-black text-airra-text dark:text-white uppercase tracking-tighter">{title}</h4>
       </div>
       <div className="space-y-6">
          {items.map((item, idx) => (
            <div key={idx} className="flex justify-between items-end pb-4 border-b border-airra-border/20 dark:border-white/5">
               <span className="text-[9px] font-black uppercase tracking-widest text-airra-muted">{item.label}</span>
               <span className="text-lg font-bold text-airra-text dark:text-zinc-200">{item.value}</span>
            </div>
          ))}
       </div>
       <button className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-airra-primary hover:gap-4 transition-all">
          View Detailed Analytics <ArrowUpRight size={14} />
       </button>
    </motion.div>
  );
}
