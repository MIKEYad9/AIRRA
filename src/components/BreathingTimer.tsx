import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Wind, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Info, 
  Heart, 
  Activity, 
  Check, 
  RefreshCw, 
  Smartphone,
  TrendingUp,
  Zap,
  HelpCircle,
  ShieldCheck
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from "recharts";
import { 
  calculateRealtimeBiometrics, 
  fetchHistoricalHealthData, 
  HealthDayData 
} from "@/src/services/healthService";

const INHALE_DURATION = 4;
const HOLD_DURATION = 7;
const EXHALE_DURATION = 8;

export default function BreathingTimer({ isDark = false }: { isDark?: boolean }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [phase, setPhase] = useState<"ready" | "inhale" | "hold" | "exhale">("ready");
  const [timeLeft, setTimeLeft] = useState<number>(INHALE_DURATION);
  const [cycleCount, setCycleCount] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showGuide, setShowGuide] = useState<boolean>(false);

  // Integrated Health State
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [healthProvider, setHealthProvider] = useState<"Apple Health" | "Fitbit" | "Garmin" | null>(null);
  const [historicalData, setHistoricalData] = useState<HealthDayData[]>([]);
  const [activeTab, setActiveTab] = useState<"live" | "history">("live");

  // Real-time biometrics tracking
  const [biometrics, setBiometrics] = useState({ bpm: 72, hrv: 48, coherence: 15 });
  const [liveTelemetry, setLiveTelemetry] = useState<{
    time: string;
    bpm: number;
    hrv: number;
    coherence: number;
  }[]>([]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorsRef = useRef<{
    inhaleOsc1?: OscillatorNode;
    inhaleOsc2?: OscillatorNode;
    holdDrone?: OscillatorNode;
    masterGain?: GainNode;
  }>({});

  const lastSecRef = useRef<number>(-1);

  // Initialize Web Audio Context gently on first user interaction
  const initAudio = () => {
    if (audioCtxRef.current) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const gain = ctx.createGain();
      gain.gain.value = 0.2; // default safe volume
      gain.connect(ctx.destination);
      
      audioCtxRef.current = ctx;
      oscillatorsRef.current.masterGain = gain;
    } catch (e) {
      console.warn("Web Audio API not supported:", e);
    }
  };

  const stopPhaseSounds = () => {
    const { inhaleOsc1, inhaleOsc2, holdDrone } = oscillatorsRef.current;
    
    // Smoothly ramp down former sounds to avoid clicks
    const ctx = audioCtxRef.current;
    if (ctx && ctx.state !== "closed") {
      const g = oscillatorsRef.current.masterGain;
      if (g) {
        g.gain.setValueAtTime(g.gain.value, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      }
    }

    setTimeout(() => {
      try {
        if (inhaleOsc1) { inhaleOsc1.stop(); inhaleOsc1.disconnect(); }
        if (inhaleOsc2) { inhaleOsc2.stop(); inhaleOsc2.disconnect(); }
        if (holdDrone) { holdDrone.stop(); holdDrone.disconnect(); }
      } catch (e) {}
      
      oscillatorsRef.current.inhaleOsc1 = undefined;
      oscillatorsRef.current.inhaleOsc2 = undefined;
      oscillatorsRef.current.holdDrone = undefined;
    }, 120);
  };

  const playPhaseSound = (currentPhase: "inhale" | "hold" | "exhale") => {
    if (!soundEnabled) return;
    initAudio();
    const ctx = audioCtxRef.current;
    const gain = oscillatorsRef.current.masterGain;
    if (!ctx || !gain) return;

    if (ctx.state === "suspended") {
      ctx.resume();
    }

    // Stop current sounds
    stopPhaseSounds();

    // Reset gain to nominal
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.2);

    if (currentPhase === "inhale") {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      
      osc1.type = "sine";
      osc2.type = "sine";
      
      osc1.frequency.setValueAtTime(174.61, ctx.currentTime); // F3
      osc1.frequency.exponentialRampToValueAtTime(261.63, ctx.currentTime + INHALE_DURATION); // C4
      
      osc2.frequency.setValueAtTime(220.00, ctx.currentTime); // A3
      osc2.frequency.exponentialRampToValueAtTime(329.63, ctx.currentTime + INHALE_DURATION); // E4

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 400;

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);

      osc1.start();
      osc2.start();

      oscillatorsRef.current.inhaleOsc1 = osc1;
      oscillatorsRef.current.inhaleOsc2 = osc2;

    } else if (currentPhase === "hold") {
      const drone = ctx.createOscillator();
      drone.type = "triangle";
      drone.frequency.setValueAtTime(110.00, ctx.currentTime); // A2

      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 1.5; // 1.5Hz gentle swell
      lfoGain.gain.value = 15; // 15Hz frequency shift

      lfo.connect(lfoGain);
      lfoGain.connect(drone.frequency);
      
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 180;

      drone.connect(filter);
      filter.connect(gain);
      
      lfo.start();
      drone.start();

      oscillatorsRef.current.holdDrone = drone;

    } else if (currentPhase === "exhale") {
      const osc1 = ctx.createOscillator();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(220.00, ctx.currentTime); // A3
      osc1.frequency.exponentialRampToValueAtTime(110.00, ctx.currentTime + EXHALE_DURATION); // A2

      const osc2 = ctx.createOscillator();
      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(164.81, ctx.currentTime); // E3
      osc2.frequency.exponentialRampToValueAtTime(82.41, ctx.currentTime + EXHALE_DURATION); // E2

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 250;

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + EXHALE_DURATION);

      osc1.start();
      osc2.start();

      oscillatorsRef.current.inhaleOsc1 = osc1;
      oscillatorsRef.current.inhaleOsc2 = osc2;
    }
  };

  const handleStartStop = () => {
    initAudio();
    if (isPlaying) {
      setIsPlaying(false);
      stopPhaseSounds();
      if (timerRef.current) clearInterval(timerRef.current);
    } else {
      setIsPlaying(true);
      if (phase === "ready") {
        setPhase("inhale");
        setTimeLeft(INHALE_DURATION);
        setCycleCount(1);
        playPhaseSound("inhale");
      } else {
        playPhaseSound(phase);
      }
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setPhase("ready");
    setTimeLeft(INHALE_DURATION);
    setCycleCount(0);
    setBiometrics({ bpm: 72, hrv: 48, coherence: 15 });
    setLiveTelemetry([]);
    lastSecRef.current = -1;
    stopPhaseSounds();
    if (timerRef.current) clearInterval(timerRef.current);
  };

  // Timer effect
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          const nextVal = Number((prev - 0.1).toFixed(1));
          if (nextVal <= 0) {
            if (phase === "inhale") {
              setPhase("hold");
              playPhaseSound("hold");
              return HOLD_DURATION;
            } else if (phase === "hold") {
              setPhase("exhale");
              playPhaseSound("exhale");
              return EXHALE_DURATION;
            } else {
              setPhase("inhale");
              setCycleCount((prevCount) => prevCount + 1);
              playPhaseSound("inhale");
              return INHALE_DURATION;
            }
          }
          return nextVal;
        });
      }, 100);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, phase, soundEnabled]);

  // Feed real-time calculated biometrics derived on active breathing states
  useEffect(() => {
    const computed = calculateRealtimeBiometrics(phase, timeLeft, cycleCount);
    setBiometrics(computed);

    // Append to live session telemetry rolling log at clean integer updates
    if (isPlaying && phase !== "ready") {
      const currentSecondIndex = Math.floor(timeLeft);
      if (currentSecondIndex !== lastSecRef.current) {
        lastSecRef.current = currentSecondIndex;
        
        let label = "";
        if (phase === "inhale") label = `In ${INHALE_DURATION - currentSecondIndex}s`;
        if (phase === "hold") label = `Hold ${HOLD_DURATION - currentSecondIndex}s`;
        if (phase === "exhale") label = `Out ${EXHALE_DURATION - currentSecondIndex}s`;

        setLiveTelemetry((prev) => {
          const updated = [
            ...prev,
            {
              time: label,
              bpm: computed.bpm,
              hrv: computed.hrv,
              coherence: computed.coherence
            }
          ];
          return updated.slice(-15); // keep a neat window of 15 data steps
        });
      }
    }
  }, [phase, timeLeft, cycleCount, isPlaying]);

  // Load historical mock health data on simulation mount
  useEffect(() => {
    fetchHistoricalHealthData().then((data) => {
      setHistoricalData(data);
    });
    return () => stopPhaseSounds();
  }, []);

  // Connect provider simulation
  const connectHealthProvider = (providerName: "Apple Health" | "Fitbit" | "Garmin") => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsConnected(true);
      setHealthProvider(providerName);
      setIsSyncing(false);
      setActiveTab("history"); // shift to historical to display fetched sync points
    }, 1500);
  };

  const disconnectProvider = () => {
    setIsConnected(false);
    setHealthProvider(null);
    setActiveTab("live");
  };

  // Compute animated scale and colors
  const getVisualStyles = () => {
    if (phase === "ready") return { scale: 1.0, color: "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-400" };
    
    let progress = 0;
    if (phase === "inhale") {
      progress = (INHALE_DURATION - timeLeft) / INHALE_DURATION;
      const scale = 1.0 + progress * 0.8; // 1.0 to 1.8
      return { 
        scale, 
        color: "bg-teal-500/10 border-teal-500/40 shadow-[0_0_50px_rgba(20,184,166,0.3)] text-teal-800 dark:text-teal-400",
        label: "Inhale",
        instruction: "Breathe in deeply through your nose",
        progressText: `${Math.ceil(timeLeft)}`
      };
    }
    
    if (phase === "hold") {
      progress = (HOLD_DURATION - timeLeft) / HOLD_DURATION;
      const pulse = 1.8 + Math.sin(progress * Math.PI * 4) * 0.04;
      return { 
        scale: pulse, 
        color: "bg-amber-500/10 border-amber-500/40 shadow-[0_0_50px_rgba(245,158,11,0.3)] text-amber-800 dark:text-amber-400",
        label: "Hold",
        instruction: "Suspend your breath, rest in stillness",
        progressText: `${Math.ceil(timeLeft)}`
      };
    }
    
    if (phase === "exhale") {
      progress = timeLeft / EXHALE_DURATION;
      const scale = 1.0 + progress * 0.8; // 1.8 down to 1.0
      return { 
        scale, 
        color: "bg-indigo-500/10 border-indigo-500/40 shadow-[0_0_50px_rgba(99,102,241,0.3)] text-indigo-800 dark:text-indigo-400",
        label: "Exhale",
        instruction: "Sigh out thoroughly through your mouth",
        progressText: `${Math.ceil(timeLeft)}`
      };
    }

    return { scale: 1.0, color: "bg-emerald-500/10 border-emerald-500/30", label: "", instruction: "", progressText: "" };
  };

  const visual = getVisualStyles();

  // Animated pulse rate for the visual heart indicator (calculated speed relative to current BPM)
  const pulseDuration = biometrics.bpm > 0 ? (60 / biometrics.bpm).toFixed(2) : "0.8";

  return (
    <div className={`p-1 pt-2 w-full max-w-7xl mx-auto rounded-3xl ${isDark ? "text-white" : ""}`}>
      
      {/* Dynamic Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* LEFT COLUMN: Pacing & Respiration Mechanics (5 out of 12 width) */}
        <div 
          id="breathing-mechanics-panel"
          className={`lg:col-span-5 airra-card p-6 md:p-8 flex flex-col justify-between items-center relative overflow-hidden h-full ${
            isDark ? "bg-zinc-950/60 border-white/5" : "bg-white dark:bg-zinc-950 border-emerald-100/30 shadow-md"
          }`}
        >
          {/* Subtle backgrounds */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.06] dark:opacity-10">
            <div className="absolute -top-10 -left-10 w-64 h-64 bg-emerald-500 rounded-full blur-[60px]" />
            <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-indigo-500 rounded-full blur-[60px]" />
          </div>

          <div className="w-full relative z-10 flex flex-col items-center justify-between h-full space-y-6">
            
            {/* Header controls inside leftmost grid */}
            <div className="flex justify-between items-center w-full">
              <div className="text-left">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-800 dark:text-emerald-400">Respiratory Pacer</span>
                <h3 className="text-xl font-display font-black uppercase tracking-tight mt-0.5">4-7-8 Calibration</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  id="toggle-breathing-sound"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="p-2.5 rounded-xl border border-emerald-500/10 text-airra-primary bg-emerald-500/5 hover:bg-emerald-500/10 dark:text-emerald-400 max-h-10 transition-all"
                  title={soundEnabled ? "Mute Acoustic Guide" : "Unmute Acoustic Guide"}
                >
                  {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                </button>
                <button
                  id="breathing-info"
                  onClick={() => setShowGuide(!showGuide)}
                  className="p-2.5 rounded-xl border border-emerald-500/10 text-airra-primary bg-emerald-500/5 hover:bg-emerald-500/10 dark:text-emerald-400 max-h-10 transition-all"
                  title="Learn 4-7-8 Pranayama"
                >
                  <Info size={16} />
                </button>
              </div>
            </div>

            {/* Informative Collapse */}
            <AnimatePresence>
              {showGuide && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden bg-emerald-500/[0.02] dark:bg-white/[0.01] border border-emerald-500/10 rounded-xl p-4 text-left text-xs text-slate-500 dark:text-zinc-400 space-y-2 leading-relaxed w-full"
                >
                  <p className="font-semibold text-slate-800 dark:text-zinc-200">The 4-7-8 Pacing Cycle (Andrew Weil, MD):</p>
                  <p>A natural autonomic nervous system quietener. Acts like an instant chemical catalyst to diminish sympathetic stress spikes.</p>
                  <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-[9px] font-bold">
                    <div className="border border-teal-500/10 p-2 rounded-lg bg-teal-500/[0.01]">
                      <span className="text-teal-600 dark:text-teal-400 block mb-0.5">1. IN (4s)</span>
                      Inhale calmly through nose.
                    </div>
                    <div className="border border-amber-500/10 p-2 rounded-lg bg-amber-500/[0.01]">
                      <span className="text-amber-600 dark:text-amber-400 block mb-0.5">2. HOLD (7s)</span>
                      Rest completely. Hold.
                    </div>
                    <div className="border border-indigo-500/10 p-2 rounded-lg bg-indigo-500/[0.01]">
                      <span className="text-indigo-600 dark:text-indigo-400 block mb-0.5">3. OUT (8s)</span>
                      Sigh out audibly.
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Dynamic Visual Breathing Circle */}
            <div className="h-64 w-full flex items-center justify-center relative my-4">
              
              {/* Pulsating background feedback rays */}
              {phase !== "ready" && isPlaying && (
                <motion.div
                  animate={{
                    scale: [visual.scale, visual.scale * 1.15, visual.scale],
                    opacity: [0.08, 0.22, 0.08]
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: phase === "hold" ? 1.75 : 3.0,
                    ease: "easeInOut"
                  }}
                  className={`w-32 h-32 rounded-full border border-current absolute transition-colors duration-1000 ${
                    phase === "inhale" ? "text-teal-400" : phase === "hold" ? "text-amber-400" : "text-indigo-400"
                  }`}
                />
              )}

              {/* Main Core Target */}
              <motion.div
                animate={{ 
                  scale: visual.scale,
                  boxShadow: phase === "inhale" 
                    ? "0 0 35px rgba(20, 184, 166, 0.2)" 
                    : phase === "hold"
                    ? "0 0 45px rgba(245, 158, 11, 0.25)" 
                    : phase === "exhale"
                    ? "0 0 25px rgba(99, 102, 241, 0.2)" 
                    : "0 0 0px rgba(0,0,0,0)"
                }}
                transition={{
                  scale: { type: "spring", stiffness: 35, damping: 14, mass: 0.8 },
                  boxShadow: { type: "spring", stiffness: 35, damping: 14 }
                }}
                className={`w-32 h-32 rounded-full border-2 flex flex-col items-center justify-center relative z-20 transition-colors duration-1000 ${visual.color}`}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={phase + visual.progressText}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.15 }}
                    className="text-center font-mono"
                  >
                    {phase === "ready" ? (
                      <Wind className="w-10 h-10 text-emerald-600 dark:text-emerald-400 animate-pulse" />
                    ) : (
                      <>
                        <div className="text-[9px] font-black uppercase tracking-[0.25em] opacity-50">
                          {visual.label}
                        </div>
                        <div className="text-3xl font-extrabold tracking-tighter mt-0.5">
                          {visual.progressText}s
                        </div>
                      </>
                    )}
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            </div>

            {/* Instruction Context Section */}
            <div className="h-16 flex flex-col items-center justify-center text-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={phase}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="space-y-1"
                >
                  <p className="text-base md:text-lg font-serif italic text-slate-700 dark:text-zinc-200">
                    {phase === "ready" ? "Activate respiration to coordinate neural networks." : visual.instruction}
                  </p>
                  {cycleCount > 0 && (
                    <div className="text-[9px] font-black uppercase tracking-widest text-[#2D6A4F] dark:text-emerald-400 flex items-center justify-center gap-1.5 animate-pulse">
                      <Sparkles size={11} className="fill-current" />
                      CYCLE {cycleCount} COMPLETE
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Actions Interface */}
            <div className="flex gap-3 w-full justify-center pt-2">
              <button
                id="reset-breathing-control"
                onClick={handleReset}
                disabled={phase === "ready"}
                className="h-12 px-5 rounded-xl text-[9px] font-black uppercase tracking-widest border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 active:scale-95 transition-all flex items-center gap-1.5 text-slate-500 disabled:opacity-30 disabled:pointer-events-none"
              >
                <RotateCcw size={13} /> Reset
              </button>
              
              <button
                id="toggle-breathing-pacer"
                onClick={handleStartStop}
                className={`h-12 px-8 rounded-xl text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all flex items-center gap-2 text-white ${
                  isPlaying 
                    ? "bg-slate-700 hover:bg-slate-800 dark:bg-zinc-800" 
                    : "bg-[#2D6A4F] hover:bg-[#1B4332] shadow-sm"
                }`}
              >
                {isPlaying ? (
                  <>
                    <Pause size={13} fill="white" /> Pause Pacer
                  </>
                ) : (
                  <>
                    <Play size={13} fill="white" className="ml-0.5" /> 
                    {phase === "ready" ? "Start Breathwork" : "Resume Calibration"}
                  </>
                )}
              </button>
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN: Biometrics Integration Suite (7 out of 12 width) */}
        <div 
          id="biometrics-suite-panel"
          className={`lg:col-span-7 airra-card p-6 md:p-8 flex flex-col justify-between space-y-6 ${
            isDark ? "bg-zinc-950/60 border-white/5" : "bg-white dark:bg-zinc-950 border-emerald-100/30 shadow-md"
          }`}
        >
          {/* Section 1: Health App Connection Hub */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-white/5 gap-4">
            <div className="text-left">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-800 dark:text-emerald-400">Sensory Co-processing</span>
              <h4 className="text-lg font-display font-black tracking-tight uppercase flex items-center gap-1.5 mt-0.5">
                <Smartphone size={16} /> Biometric Integration
              </h4>
            </div>

            {/* Provider Sync Interface */}
            <div>
              {isConnected ? (
                <div className="flex items-center gap-2">
                  <div className="airra-glass border-emerald-300/30 text-emerald-800 dark:text-emerald-300 px-3 py-1.5 rounded-lg text-[9px] font-black tracking-wider uppercase flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    Connected to {healthProvider}
                  </div>
                  <button 
                    id="disconnect-health-button"
                    onClick={disconnectProvider}
                    className="text-[9px] font-semibold text-slate-400 hover:text-rose-500 transition-all font-mono"
                  >
                    Disconnect
                  </button>
                </div>
              ) : isSyncing ? (
                <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
                  <RefreshCw size={14} className="animate-spin text-airra-primary" />
                  <span className="tracking-wide animate-pulse">Syncing credential vaults...</span>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium mr-2 hidden sm:inline">Stream real-time HRV baseline:</span>
                  <div className="flex gap-1.5">
                    <button
                      id="connect-apple-health"
                      onClick={() => connectHealthProvider("Apple Health")}
                      className="px-2.5 py-1.5 rounded-md text-[8px] font-black uppercase tracking-wider bg-slate-50 hover:bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-zinc-300 transition-all"
                    >
                      Apple Health
                    </button>
                    <button
                      id="connect-fitbit"
                      onClick={() => connectHealthProvider("Fitbit")}
                      className="px-2.5 py-1.5 rounded-md text-[8px] font-black uppercase tracking-wider bg-slate-50 hover:bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-zinc-300 transition-all"
                    >
                      Fitbit
                    </button>
                    <button
                      id="connect-garmin"
                      onClick={() => connectHealthProvider("Garmin")}
                      className="px-2.5 py-1.5 rounded-md text-[8px] font-black uppercase tracking-wider bg-slate-50 hover:bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-zinc-300 transition-all"
                    >
                      Garmin
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Real-time Live Biosensors */}
          <div className="grid grid-cols-3 gap-3">
            
            {/* Sensor A: Live HR (BPM) */}
            <div className="bg-[#F7F4EF] dark:bg-zinc-900/40 p-4 rounded-xl border border-emerald-500/5 relative overflow-hidden flex flex-col justify-between min-h-24">
              <div className="flex justify-between items-start">
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500">Autonomic Pulse</span>
                
                {/* Dynamically pulse the heart icon to match simulated pulse duration */}
                <motion.div
                  animate={{ scale: [1, 1.25, 1] }}
                  transition={{ repeat: Infinity, duration: parseFloat(pulseDuration), ease: "easeInOut" }}
                  className="text-rose-500 flex-shrink-0"
                >
                  <Heart size={14} className="fill-current" />
                </motion.div>
              </div>

              <div>
                <span className="text-3xl font-mono font-black text-slate-800 dark:text-zinc-100">
                  {biometrics.bpm}
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider ml-1">BPM</span>
              </div>
              
              <div className="text-[8px] text-slate-400 font-medium">
                {phase === "inhale" ? "RSA Peak Scaling" : phase === "exhale" ? "Vagal Drop Activation" : "Resting Rate steady"}
              </div>
            </div>

            {/* Sensor B: Heart Rate Variability (HRV - RMSSD) */}
            <div className="bg-[#F7F4EF] dark:bg-zinc-900/40 p-4 rounded-xl border border-emerald-500/5 relative overflow-hidden flex flex-col justify-between min-h-24">
              <div className="flex justify-between items-start">
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500">CNS Variability</span>
                <span className="text-teal-500">
                  <Activity size={14} className="animate-pulse" />
                </span>
              </div>

              <div>
                <span className="text-3xl font-mono font-black text-teal-700 dark:text-teal-400">
                  {biometrics.hrv}
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider ml-1">ms</span>
              </div>

              <div className="text-[8px] text-teal-600 dark:text-teal-400 font-bold flex items-center gap-0.5">
                <TrendingUp size={10} />
                +{Math.round(((biometrics.hrv - 48)/48)*100)}% vagal tone
              </div>
            </div>

            {/* Sensor C: Autonomic Resonance Coherence Index */}
            <div className="bg-[#F7F4EF] dark:bg-zinc-900/40 p-4 rounded-xl border border-emerald-500/5 relative overflow-hidden flex flex-col justify-between min-h-24">
              <div className="flex justify-between items-start">
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500">Reson Coherence</span>
                <span className="text-amber-500">
                  <Sparkles size={14} />
                </span>
              </div>

              <div>
                <span className="text-3xl font-mono font-black text-amber-600 dark:text-amber-400">
                  {biometrics.coherence}%
                </span>
              </div>

              <div className="text-[8px] text-slate-400 font-medium">
                Sync coefficient feedback
              </div>
            </div>

          </div>

          {/* Section 3: Graphical Diagnostics Hub (Tabs + Recharts Wrapper) */}
          <div className="flex-1 flex flex-col bg-slate-50/50 dark:bg-white/[0.01] p-4 rounded-xl border border-slate-100 dark:border-white/5 relative min-h-[260px]">
            
            {/* Tabs control */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex gap-1.5">
                <button
                  id="live-telemetry-tab"
                  onClick={() => setActiveTab("live")}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                    activeTab === "live"
                      ? "bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  Active HRV Resonance
                </button>
                <button
                  id="historical-telemetry-tab"
                  disabled={!isConnected}
                  onClick={() => {
                    if (isConnected) setActiveTab("history");
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all gap-1 sm:flex items-center ${
                    !isConnected 
                      ? "opacity-40 cursor-not-allowed text-slate-400" 
                      : activeTab === "history"
                      ? "bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                  title={!isConnected ? "Connect health provider first to view baseline" : ""}
                >
                  7-Day Health Baseline
                  {!isConnected && <span className="text-[7px] text-slate-400 uppercase hidden sm:inline border border-slate-300 rounded px-1">Locked</span>}
                </button>
              </div>
              
              <div className="text-[10px] text-slate-400 font-semibold font-mono">
                {activeTab === "live" ? "Real-time rolling feed" : "7-Day integrated audit"}
              </div>
            </div>

            {/* Render Tab Contents */}
            <div className="flex-1 min-h-[180px] w-full flex items-center justify-center">
              {activeTab === "live" ? (
                liveTelemetry.length === 0 ? (
                  <div className="text-center p-6 text-slate-400 dark:text-zinc-500 max-w-xs space-y-2">
                    <Zap className="mx-auto text-slate-300 dark:text-zinc-700 animate-pulse" size={24} />
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Resonance Loop Inactive</p>
                    <p className="text-[10px] leading-relaxed">
                      Press "Start Breathwork" to initialize direct telemetry capture. Heart rate curves and vagal tones will overlay dynamically with your breath cycles.
                    </p>
                  </div>
                ) : (
                  <div className="w-full h-full min-h-[180px] max-h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={liveTelemetry} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#2A2A2A" : "#F1F1F1"} />
                        <XAxis dataKey="time" stroke="#94A3B8" fontSize={9} tickLine={false} />
                        <YAxis stroke="#94A3B8" fontSize={9} domain={[40, 110]} tickLine={false} />
                        <Tooltip 
                          contentStyle={{ 
                            background: isDark ? "#121212" : "#FFFFFF", 
                            borderColor: "rgba(45,106,79,0.2)",
                            borderRadius: "12px",
                            fontSize: "10px"
                          }} 
                        />
                        <Line
                          name="BPM (Autonomic Rate)"
                          type="monotone"
                          dataKey="bpm"
                          stroke={isDark ? "#FB7185" : "#E11D48"}
                          strokeWidth={2.5}
                          dot={false}
                          activeDot={{ r: 6 }}
                        />
                        <Line
                          name="HRV (Parasympathetic Tone)"
                          type="monotone"
                          dataKey="hrv"
                          stroke="#14B8A6"
                          strokeWidth={2.5}
                          dot={false}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )
              ) : (
                // Historical baseline chart
                <div className="w-full h-full min-h-[180px] max-h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={historicalData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#2A2A2A" : "#F1F1F1"} />
                      <XAxis dataKey="day" stroke="#94A3B8" fontSize={9} tickLine={false} />
                      <YAxis stroke="#94A3B8" fontSize={9} domain={[30, 85]} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ 
                          background: isDark ? "#121212" : "#FFFFFF", 
                          borderColor: "rgba(45,106,79,0.2)",
                          borderRadius: "12px",
                          fontSize: "10px"
                        }} 
                      />
                      <Line
                        name="Resting HR (BPM)"
                        type="monotone"
                        dataKey="avgHeartRate"
                        stroke="#64748B"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                      <Line
                        name="Resting HRV (ms)"
                        type="monotone"
                        dataKey="avgHRV"
                        stroke="#2D6A4F"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Integration disclaimer feedback loop */}
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[8px] text-slate-400 dark:text-zinc-500">
              <span className="flex items-center gap-1">
                {isConnected ? <ShieldCheck size={12} className="text-emerald-500 fill-emerald-500/10" /> : <HelpCircle size={12} />}
                {isConnected 
                  ? `Active connection: Secure direct proxy to ${healthProvider} Health Store with AES-256 validation.` 
                  : "Sensor loop offline: Pair your provider credential above to integrate daily HRV statistics."}
              </span>
              <span className="font-mono">Co-process (v1.1)</span>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
