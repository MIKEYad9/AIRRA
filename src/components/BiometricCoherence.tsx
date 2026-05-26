import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  fetchHistoricalHealthData, 
  HealthDayData 
} from "../services/healthService";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid 
} from "recharts";
import { 
  Activity, 
  Heart, 
  TrendingUp, 
  Zap, 
  RefreshCw, 
  ShieldCheck, 
  Info,
  Sliders
} from "lucide-react";

export default function BiometricCoherence() {
  const [data, setData] = useState<HealthDayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [activeMetric, setActiveMetric] = useState<"bpm" | "hrv">("hrv");
  const [selectedDayInfo, setSelectedDayInfo] = useState<HealthDayData | null>(null);

  // Load initial historical biometric data
  const loadData = async () => {
    setLoading(true);
    try {
      const result = await fetchHistoricalHealthData();
      setData(result);
      // Set the default detail display to the most recent day (Sunday)
      if (result.length > 0) {
        setSelectedDayInfo(result[result.length - 1]);
      }
    } catch (err) {
      console.error("Failed to fetch biometric baseline telemetry:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Sync interaction simulating pulling newer bio-telemetry with beautiful motion effects
  const handleSyncBiometrics = async () => {
    setSyncing(true);
    // Add tiny random deviations or slight improvements representing progressive calibration
    setTimeout(() => {
      setData((prev) => 
        prev.map((item) => ({
          ...item,
          avgHeartRate: Math.max(55, Math.min(95, item.avgHeartRate + (Math.random() > 0.5 ? 1 : -1))),
          avgHRV: Math.max(35, Math.min(110, item.avgHRV + (Math.random() > 0.4 ? Math.floor(Math.random() * 3) + 1 : -1)))
        }))
      );
      setSyncing(false);
      // Re-initialize active day info element
      if (data.length > 0) {
        setSelectedDayInfo(data[data.length - 1]);
      }
    }, 1200);
  };

  // Compute calculated metrics
  const avgHRVValue = data.length > 0 
    ? Math.round(data.reduce((acc, d) => acc + d.avgHRV, 0) / data.length) 
    : 0;
  const avgBPMValue = data.length > 0 
    ? Math.round(data.reduce((acc, d) => acc + d.avgHeartRate, 0) / data.length) 
    : 0;

  // Gauge overall coherence score based on average HRV (higher hrv = higher autonomic balance)
  const coherenceScore = Math.min(100, Math.round(avgHRVValue * 1.6));

  // Determine stress resistance level
  let resiliencyLevel = "Standard Dynamic Balance";
  let resiliencyColor = "text-blue-500 dark:text-blue-400";
  if (coherenceScore >= 85) {
    resiliencyLevel = "Optimal Vagal Resonance";
    resiliencyColor = "text-emerald-500 dark:text-emerald-400";
  } else if (coherenceScore >= 70) {
    resiliencyLevel = "High Coherent Synergy";
    resiliencyColor = "text-teal-500 dark:text-teal-400 animate-pulse";
  } else if (coherenceScore < 60) {
    resiliencyLevel = "Mild Autonomic Exhaustion";
    resiliencyColor = "text-amber-500 dark:text-amber-400";
  }

  // Set colors / properties based on active metric tab
  const metricConfig = {
    bpm: {
      label: "Heart Rate Baseline",
      unit: "BPM",
      color: "#F43F5E", // Soft scarlet/rose red
      gradient: ["rgba(244, 63, 94, 0.2)", "rgba(244, 63, 94, 0)"],
      description: "Average resting heart rate. Lower baseline values typically state superior physiological recovery & cardiac optimization.",
    },
    hrv: {
      label: "Vagal Coherence (HRV)",
      unit: "ms",
      color: "#3DB88A", // Emerald green
      gradient: ["rgba(61, 184, 138, 0.2)", "rgba(61, 184, 138, 0)"],
      description: "Heart Rate Variability (vagal tone). High fluctuation interval represents superior physical resilience, reduced cortisol, and immediate calm alignment.",
    }
  };

  // Custom Recharts rendering styling
  const config = metricConfig[activeMetric];

  // Custom tooltips with beautiful alignment
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item: HealthDayData = payload[0].payload;
      return (
        <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white/95 dark:bg-zinc-950/95 backdrop-blur shadow-xl text-left select-none space-y-1">
          <p className="text-[10px] font-mono font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
            Diagnostic: {item.day}
          </p>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: config.color }} />
            <span className="text-sm font-black text-slate-800 dark:text-white uppercase font-sans">
              {activeMetric === "bpm" ? `${item.avgHeartRate} BPM` : `${item.avgHRV} ms`}
            </span>
          </div>
          <p className="text-[9px] text-slate-500 font-mono">
            {activeMetric === "bpm" ? "Resting Pulse Rate" : "Standard RMSSD Metric"}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div id="biometric-coherence-terminal" className="space-y-6 sm:space-y-8 text-left">
      
      {/* Title block */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-white/5">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-[#3DB88A]/15 text-[#3DB88A] border border-[#3DB88A]/20 shrink-0">
            <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800 dark:text-zinc-200">
              Biometric Coherence Analysis
            </h4>
            <p className="text-[8px] sm:text-[10px] font-mono text-slate-400 dark:text-zinc-500 uppercase tracking-widest mt-0.5">
              Heart Rate & Autonomic Vagal Tone Baselines
            </p>
          </div>
        </div>

        {/* Sync Trigger button */}
        <button
          type="button"
          onClick={handleSyncBiometrics}
          disabled={loading || syncing}
          className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-slate-200 dark:border-white/5 text-[8px] sm:text-[9px] font-mono font-black uppercase tracking-widest text-[#3D7A5D] dark:text-[#3DB88A] flex items-center justify-center gap-1.5 sm:gap-2 transition-all active:scale-95 cursor-pointer disabled:opacity-40 w-full sm:w-auto"
        >
          <RefreshCw className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? "Gathering Telementry..." : "Trigger Metric Sync"}
        </button>
      </div>

      {loading ? (
        <div className="p-20 text-center space-y-4">
          <div className="w-10 h-10 border-4 border-[#3DB88A] border-t-transparent rounded-full animate-spin mx-auto" />
          <span className="text-xs font-mono font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest block animate-pulse">
            Connecting medical interfaces...
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Chart Column */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Action Tabs for HR VS HRV */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-1 rounded-xl bg-slate-100/60 dark:bg-zinc-900/40 border border-slate-200/50 dark:border-white/5 gap-2">
              <div className="flex gap-1 sm:gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setActiveMetric("hrv")}
                  className={`flex-1 sm:flex-initial px-2.5 sm:px-4 py-1.5 rounded-lg text-[8px] sm:text-[9px] font-black uppercase tracking-wider sm:tracking-widest transition-all cursor-pointer truncate ${
                    activeMetric === "hrv"
                      ? "bg-white dark:bg-zinc-800 text-[#3DB88A] shadow-sm font-black border border-[#3DB88A]/10"
                      : "text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-100"
                  }`}
                >
                  Variability (HRV)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMetric("bpm")}
                  className={`flex-1 sm:flex-initial px-2.5 sm:px-4 py-1.5 rounded-lg text-[8px] sm:text-[9px] font-black uppercase tracking-wider sm:tracking-widest transition-all cursor-pointer truncate ${
                    activeMetric === "bpm"
                      ? "bg-white dark:bg-zinc-800 text-rose-500 shadow-sm font-black border border-rose-500/10"
                      : "text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-100"
                  }`}
                >
                  Baseline (BPM)
                </button>
              </div>

              {/* Realtime dynamic tracking badge right */}
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 font-mono text-[9px] text-[#2D7A5F] dark:text-[#3DB88A] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3DB88A] animate-ping" />
                Live baseline analysis active
              </div>
            </div>

            {/* Glowing Chart Visual Component */}
            <div className="relative p-3 sm:p-6 rounded-2xl sm:rounded-[2rem] bg-gradient-to-b from-white/25 to-slate-50/10 dark:from-zinc-950/40 dark:to-zinc-950/20 border border-slate-200/60 dark:border-white/5 shadow-inner">
              
              {/* Overlay scanning laser line when syncing telemetry */}
              <AnimatePresence>
                {syncing && (
                  <motion.div 
                    initial={{ top: "0%" }}
                    animate={{ top: "100%" }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#3DB88A] to-transparent z-10 pointer-events-none shadow-[0_0_10px_#3DB88A]"
                  />
                )}
              </AnimatePresence>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={data}
                    margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                    onClick={(state: any) => {
                      if (state && state.activePayload && state.activePayload.length > 0) {
                        setSelectedDayInfo(state.activePayload[0].payload);
                      }
                    }}
                  >
                    <defs>
                      <linearGradient id="activeMetricGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={config.color} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={config.color} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid 
                      strokeDasharray="4 4" 
                      vertical={false} 
                      stroke="rgba(128,128,128,0.08)" 
                    />
                    <XAxis 
                      dataKey="day" 
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "#94a3b8", fontSize: 10, fontFamily: "monospace", fontWeight: "700" }}
                    />
                    <YAxis 
                      tickLine={false}
                      axisLine={false}
                      domain={activeMetric === "bpm" ? [50, 100] : [30, 80]}
                      tick={{ fill: "#94a3b8", fontSize: 10, fontFamily: "monospace" }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey={activeMetric === "bpm" ? "avgHeartRate" : "avgHRV"}
                      stroke={config.color}
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#activeMetricGrad)"
                      activeDot={{ r: 6, strokeWidth: 0, fill: config.color }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Bottom explanatory block for chart values */}
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5 flex items-start gap-3">
                <Info size={14} className="text-[#3DB88A] shrink-0 mt-0.5" />
                <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium leading-relaxed">
                  <strong>{config.label} Dynamics:</strong> {config.description} Click point values on the chart node map to inspect deep alignment and autonomic resonance scores.
                </p>
              </div>
            </div>

          </div>

          {/* Right Summary Metrics Panel */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Card Showing Avg HRV metrics */}
            <div className={`p-4 sm:p-6 rounded-2xl border text-left bg-gradient-to-br from-white/30 to-slate-50/10 dark:from-zinc-950/20 dark:to-zinc-950/5 relative overflow-hidden flex flex-col justify-between h-fit space-y-4 sm:space-y-6`}>
              <div className="space-y-3 sm:space-y-4">
                <span className="text-[8px] sm:text-[9px] font-black tracking-widest uppercase text-slate-400 dark:text-zinc-500 font-mono">
                  Weekly Aggregate
                </span>
                
                <div className="space-y-0.5 sm:space-y-1">
                  <h3 className="text-2xl sm:text-3xl font-display font-black text-slate-900 dark:text-white uppercase tracking-tight">
                    {avgHRVValue} ms
                  </h3>
                  <p className="text-[9px] sm:text-[10px] font-mono font-bold text-[#3DB88A] uppercase tracking-widest">
                    Vagal Nerve Tone Score
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-white/5">
                <div className="flex justify-between items-center text-[9px] sm:text-[10px] font-mono font-semibold">
                  <span className="text-slate-400">BIOMETRIC SYNERGY</span>
                  <span className={resiliencyColor}>{coherenceScore}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${coherenceScore}%` }}
                    transition={{ duration: 1 }}
                    className="h-full bg-gradient-to-r from-emerald-500 to-[#3DB88A] rounded-full"
                  />
                </div>
                <div className="flex justify-between items-center text-[8px] sm:text-[9px] text-slate-400 dark:text-zinc-500 pt-0.5 font-mono">
                  <span>Vagal Baseline: 50ms</span>
                  <span className="font-bold truncate max-w-[150px]">{resiliencyLevel}</span>
                </div>
              </div>
            </div>

            {/* Selected day deep detail inspect block */}
            <div className="p-4 sm:p-6 rounded-2xl border border-slate-200/60 dark:border-white/5 bg-slate-50/10 dark:bg-zinc-950/20 text-left space-y-3 sm:space-y-4">
              <span className="text-[8px] sm:text-[9px] font-black tracking-widest uppercase text-slate-400 dark:text-zinc-500 font-mono block">
                Detail Node: {selectedDayInfo?.day || "Sun"}
              </span>

              {selectedDayInfo ? (
                <div className="space-y-2 font-mono text-xs select-none">
                  <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-white/5 items-center gap-2">
                    <span className="text-slate-400 uppercase font-black text-[9px] sm:text-[10px] truncate">Heart Rate (BPM)</span>
                    <strong className="text-rose-500 font-bold text-xs sm:text-sm shrink-0">{selectedDayInfo.avgHeartRate} bpm</strong>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-white/5 items-center gap-2">
                    <span className="text-slate-400 uppercase font-black text-[9px] sm:text-[10px] truncate">Vagal Variability (HRV)</span>
                    <strong className="text-[#3DB88A] font-bold text-xs sm:text-sm shrink-0">{selectedDayInfo.avgHRV} ms</strong>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-white/5 items-center gap-2">
                    <span className="text-slate-400 uppercase font-black text-[9px] sm:text-[10px] truncate">Symmetry Status</span>
                    <span className="text-blue-400 font-bold uppercase tracking-wider text-xs sm:text-sm shrink-0">
                      {selectedDayInfo.avgHRV > 50 ? "Balanced ⚡" : "Coherent ✓"}
                    </span>
                  </div>
                  <div className="text-[8px] sm:text-[9px] text-slate-400 leading-normal pt-2 font-sans font-medium">
                    This profile segment represents deep sleep baseline synchronization metrics gathered through connected external smart telemetry devices.
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-450 dark:text-zinc-500 font-medium">
                  Select any day element on the chart grid layout to read deep diagnostic telemetry.
                </p>
              )}
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
