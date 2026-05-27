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
  ShieldCheck,
  Target,
  Maximize2,
  Minimize2,
  Clock,
  X
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceDot,
  Label,
  ReferenceLine
} from "recharts";
import { 
  calculateRealtimeBiometrics, 
  fetchHistoricalHealthData, 
  HealthDayData 
} from "@/src/services/healthService";
import { synther } from "@/src/lib/synthEngine";

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
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [showBpmSeries, setShowBpmSeries] = useState<boolean>(true);
  const [showHrvSeries, setShowHrvSeries] = useState<boolean>(true);
  const [showGuidancePath, setShowGuidancePath] = useState<boolean>(false);
  const [showPeaks, setShowPeaks] = useState<boolean>(true);
  const [showBaseline, setShowBaseline] = useState<boolean>(true);
  const [zoomRange, setZoomRange] = useState<[number, number]>([0, 100]);

  // Integrated Health State
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [healthProvider, setHealthProvider] = useState<"Apple Health" | "Fitbit" | "Garmin" | null>(null);
  const [historicalData, setHistoricalData] = useState<HealthDayData[]>([]);
  const [activeTab, setActiveTab] = useState<"live" | "history">("live");

  // Biometric Manual Sync Modal States
  const [isSyncModalOpen, setIsSyncModalOpen] = useState<boolean>(false);
  const [syncProvider, setSyncProvider] = useState<"Apple Health" | "Fitbit" | "Garmin" | null>(null);
  const [syncStep, setSyncStep] = useState<number>(0); // 0: Idle, 1: Connecting, 2: Fetching telemetry, 3: Analyzing baseline, 4: Aligning, 5: Completed
  const [syncProgress, setSyncProgress] = useState<number>(0);
  const [syncLog, setSyncLog] = useState<string[]>([]);

  const startManualSync = (selectedPvName?: "Apple Health" | "Fitbit" | "Garmin") => {
    const pv = selectedPvName || syncProvider || "Apple Health";
    setSyncProvider(pv);
    setSyncStep(1);
    setSyncProgress(10);
    setSyncLog(["Establishing encrypted biometric link...", `Handshaking gateway credentials for ${pv}...`]);

    // Step 1 -> 2
    setTimeout(() => {
      setSyncStep(2);
      setSyncProgress(35);
      setSyncLog(prev => [...prev, "Biometric token verified securely.", `Querying ${pv} health database for cardiorespiratory telemetry...`, "Downloading recent heart rate time-series data..."]);
    }, 1200);

    // Step 2 -> 3
    setTimeout(() => {
      setSyncStep(3);
      setSyncProgress(65);
      setSyncLog(prev => [...prev, "Telemetry records downloaded successfully.", "Analyzing heart rate variability baseline spectrum...", "Calculating successive difference metrics (RMSSD)...", "Resolving parasympathetic coherence indexes..."]);
    }, 2400);

    // Step 3 -> 4
    setTimeout(() => {
      setSyncStep(4);
      setSyncProgress(85);
      setSyncLog(prev => [...prev, "Baseline RMSSD verified at 54 ms (+8.3% stability improvement).", "Optimizing parasympathetic feedback calibration...", "Aligning local Solfeggio carrier frequency models..."]);
    }, 3600);

    // Step 4 -> 5 (Completed)
    setTimeout(() => {
      setSyncStep(5);
      setSyncProgress(100);
      setSyncLog(prev => [...prev, "Symphonic carrier line lock secured.", "Synchronizing local digital registries...", "Verification complete. Biometric sync fully optimized!"]);
      
      setIsConnected(true);
      setHealthProvider(pv);
      
      // Update historical data: boost Sunday data slightly to show real-time changes
      setHistoricalData(prev => 
        prev.map(item => 
          item.day === "Sun" ? { ...item, avgHRV: Math.min(100, item.avgHRV + 4) } : item
        )
      );
    }, 4800);
  };

  // Real-time biometrics tracking
  const [biometrics, setBiometrics] = useState({ bpm: 72, hrv: 48, coherence: 15 });
  const [liveTelemetry, setLiveTelemetry] = useState<{
    time: string;
    bpm: number;
    hrv: number;
    coherence: number;
    phase?: string;
    id?: number;
    guidance?: number;
  }[]>([]);

  // HRV goal setting and baseline parameters
  const [targetHrvImprovement, setTargetHrvImprovement] = useState<number>(20);
  const [initialHrv] = useState<number>(48);

  // Ambient Soundscape Backdrop Options
  const SOUNDSCAPES = [
    { id: "none", name: "No Soundscape", url: "", info: "Silent deep breathing focus" },
    { id: "serene", name: "Serene Meadow", url: "https://assets.mixkit.co/music/preview/mixkit-serene-view-443.mp3", info: "Lush strings and soft ambient pads" },
    { id: "zen", name: "Zen Temple", url: "https://assets.mixkit.co/music/preview/mixkit-meditation-soft-601.mp3", info: "Soft bamboo flute and peaceful drone" },
    { id: "celestial", name: "Celestial Dream", url: "https://assets.mixkit.co/music/preview/mixkit-dreaming-big-31.mp3", info: "Celestial atmospheric space soundscape" },
    { id: "wellness", name: "Wellness Retreat", url: "https://assets.mixkit.co/music/preview/mixkit-wellness-vibe-305.mp3", info: "Ethereal crystal-bowl harmony" }
  ];

  const [audioUrl, setAudioUrl] = useState<string>("");
  const ambientAudioRef = useRef<HTMLAudioElement | null>(null);

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

  const playHarmonicSound = (type: "chime" | "gong") => {
    if (!soundEnabled) return;
    initAudio();
    const ctx = audioCtxRef.current;
    if (!ctx || ctx.state === "closed") return;

    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const now = ctx.currentTime;
    const chimeGain = ctx.createGain();
    chimeGain.connect(ctx.destination);
    chimeGain.gain.setValueAtTime(0.001, now);

    if (type === "chime") {
      // Gentle warm chime chord (E Major: E5, G#5, B5, E6)
      chimeGain.gain.linearRampToValueAtTime(0.08, now + 0.08);
      chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 3.0);

      const freqs = [659.25, 830.61, 987.77, 1318.51];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now);
        osc.detune.setValueAtTime((idx - 1.5) * 5, now);

        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(1500, now);

        const bandGain = ctx.createGain();
        bandGain.gain.setValueAtTime(0.05 / freqs.length, now);
        bandGain.gain.exponentialRampToValueAtTime(0.001, now + (3.0 - idx * 0.3));

        osc.connect(filter);
        filter.connect(bandGain);
        bandGain.connect(chimeGain);

        osc.start(now);
        osc.stop(now + 3.5);
      });
    } else {
      // Deep resonant bronze gong sound (A2, E3, A3, C#4)
      chimeGain.gain.linearRampToValueAtTime(0.12, now + 0.15);
      chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 4.5);

      const freqs = [110.00, 164.81, 220.00, 277.18];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        osc.type = idx % 2 === 0 ? "sine" : "triangle";
        osc.frequency.setValueAtTime(freq, now);
        osc.detune.setValueAtTime((idx - 1.5) * 4, now);

        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(450, now);

        const bandGain = ctx.createGain();
        bandGain.gain.setValueAtTime(0.05 / freqs.length, now);
        bandGain.gain.exponentialRampToValueAtTime(0.001, now + (4.5 - idx * 0.4));

        osc.connect(filter);
        filter.connect(bandGain);
        bandGain.connect(chimeGain);

        osc.start(now);
        osc.stop(now + 5.0);
      });
    }
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
    if (ambientAudioRef.current) {
      ambientAudioRef.current.pause();
      ambientAudioRef.current.currentTime = 0;
    }
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
              playHarmonicSound("chime");
              return HOLD_DURATION;
            } else if (phase === "hold") {
              setPhase("exhale");
              playPhaseSound("exhale");
              playHarmonicSound("gong");
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
          const tickIndex = prev.length;
          const period = 19; // 19s resonant wave frequency
          const waveVal = Math.sin((2 * Math.PI * tickIndex) / period);
          const hrvGuidance = Math.round(70 + waveVal * 15); // beautifully swings between 55ms and 85ms

          const updated = [
            ...prev,
            {
              time: label,
              bpm: computed.bpm,
              hrv: computed.hrv,
              coherence: computed.coherence,
              phase: phase,
              id: prev.length,
              guidance: hrvGuidance
            }
          ];
          return updated.slice(-150); // Keep up to 150 seconds (2.5 mins) of high-resolution telemetry log
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

  // Manage Ambient Soundscape Backdrops
  useEffect(() => {
    if (!audioUrl) {
      if (ambientAudioRef.current) {
        ambientAudioRef.current.pause();
        ambientAudioRef.current = null;
      }
      synther.stop();
      return;
    }

    const scName = SOUNDSCAPES.find(sc => sc.url === audioUrl)?.name || "Ambient";

    if (!ambientAudioRef.current) {
      const audio = new Audio(audioUrl);
      audio.loop = true;
      audio.volume = 0.25; // Soft backdrop volume so it doesn't overpower chimes
      
      audio.onerror = (e) => {
        console.warn(`[Breathing Timer] Failed to load offline backdrop ${scName}. Initiating local synth fallback.`);
        synther.start(scName);
      };

      audio.play().catch(err => {
        console.warn(`[Breathing Timer] Play blocked or offline for ${scName}. Initiating local synth fallback:`, err);
        synther.start(scName);
      });

      ambientAudioRef.current = audio;
    } else {
      const wasPlaying = !ambientAudioRef.current.paused;
      ambientAudioRef.current.pause();
      synther.stop();

      ambientAudioRef.current.src = audioUrl;
      ambientAudioRef.current.onerror = () => {
        console.warn(`[Breathing Timer] Resource error switching to ${scName}. Using local synth.`);
        synther.start(scName);
      };

      try {
        ambientAudioRef.current.load();
        if (wasPlaying) {
          ambientAudioRef.current.play().catch(err => {
            console.log("Ambient autoplay delayed, launching synth fallback:", err);
            synther.start(scName);
          });
        }
      } catch (err) {
        console.warn("Exception in loading media. Starting fallback synth:", err);
        synther.start(scName);
      }
    }

    if (ambientAudioRef.current) {
      ambientAudioRef.current.muted = !soundEnabled;
    }

    if (isPlaying) {
      if (ambientAudioRef.current) {
        ambientAudioRef.current.play().catch(err => {
          console.log("Play failed, triggering fallback synthesis:", err);
          synther.start(scName);
        });
      } else {
        synther.start(scName);
      }
    } else {
      if (ambientAudioRef.current) {
        ambientAudioRef.current.pause();
      }
      synther.stop();
    }
  }, [audioUrl, isPlaying]);

  useEffect(() => {
    if (ambientAudioRef.current) {
      ambientAudioRef.current.muted = !soundEnabled;
    }
  }, [soundEnabled]);

  useEffect(() => {
    return () => {
      if (ambientAudioRef.current) {
        ambientAudioRef.current.pause();
        ambientAudioRef.current = null;
      }
      synther.stop();
    };
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

  // Computed HRV target goals metrics
  const currentImprovement = Math.max(0, biometrics.hrv - initialHrv);
  const progressPercent = Math.min(100, Math.round((currentImprovement / targetHrvImprovement) * 100));
  const goalAchieved = currentImprovement >= targetHrvImprovement;

  // Real-time HRV improvement ratio (0 to 1) for fluid color transition
  const hrvRatio = targetHrvImprovement > 0 ? Math.min(1, currentImprovement / targetHrvImprovement) : 0;

  // Cool Indigo baseline: RGB(99, 102, 241) (#6366f1)
  // Warm Gold target: RGB(245, 158, 11) (#f59e0b)
  const rVal = Math.round(99 + hrvRatio * (245 - 99));
  const gVal = Math.round(102 + hrvRatio * (158 - 102));
  const bVal = Math.round(241 + hrvRatio * (11 - 241));

  // Dynamically computed autonomic resonance color tones
  const dynamicColor = `rgb(${rVal}, ${gVal}, ${bVal})`;
  const dynamicBgColor = `rgba(${rVal}, ${gVal}, ${bVal}, ${phase === "ready" ? 0.05 : 0.12})`;
  const dynamicBorderColor = `rgba(${rVal}, ${gVal}, ${bVal}, 0.55)`;
  const baseGlowRadius = phase === "ready" ? 0 : 25 + hrvRatio * 25;
  const dynamicBoxShadow = isPlaying 
    ? `0 0 ${baseGlowRadius}px rgba(${rVal}, ${gVal}, ${bVal}, ${0.25 + hrvRatio * 0.15})` 
    : "0 0 0px rgba(0,0,0,0)";

  const visual = getVisualStyles();

  // Smooth progress ratio calculation for 4-7-8 breathing circle to prevent snaps
  const getProgressRatio = () => {
    if (phase === "ready") return 0;
    if (phase === "inhale") return (INHALE_DURATION - timeLeft) / INHALE_DURATION;
    if (phase === "hold") return 1.0;
    if (phase === "exhale") return timeLeft / EXHALE_DURATION;
    return 0;
  };
  const progressRatio = getProgressRatio();

  // Animated pulse rate for the visual heart indicator (calculated speed relative to current BPM)
  const pulseDuration = biometrics.bpm > 0 ? (60 / biometrics.bpm).toFixed(2) : "0.8";

  // Session duration in seconds tracking
  const sessionDurationSec = cycleCount * 19 + (phase !== "ready" ? (phase === "inhale" ? (4 - timeLeft) : phase === "hold" ? (4 + 7 - timeLeft) : (4 + 7 + 8 - timeLeft)) : 0);
  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.round(sec % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Live session statistics compiled on the fly from telemetry points
  const statLowestBpm = liveTelemetry.length > 0 ? Math.min(...liveTelemetry.map((t) => t.bpm)) : 72;
  const statPeakBpm = liveTelemetry.length > 0 ? Math.max(...liveTelemetry.map((t) => t.bpm)) : 72;
  const statAverageHrv = liveTelemetry.length > 0 ? Math.round(liveTelemetry.reduce((sum, t) => sum + t.hrv, 0) / liveTelemetry.length) : biometrics.hrv;
  const statPeakHrv = liveTelemetry.length > 0 ? Math.max(...liveTelemetry.map((t) => t.hrv)) : biometrics.hrv;
  const statAverageCoherence = liveTelemetry.length > 0 ? Math.round(liveTelemetry.reduce((sum, t) => sum + t.coherence, 0) / liveTelemetry.length) : biometrics.coherence;
  const calmingPercent = Math.min(100, Math.round((statAverageCoherence / 25) * 100));

  // Dynamic instructional microcopy matching our Psychology Design Guidelines
  const getMicrocopy = () => {
    if (phase === "ready") return "Sit comfortably, lengthen your spine, and initiate respiration to sync nerves.";
    if (phase === "inhale") return "Fill your lungs completely from the belly up. Let the clean energy pool inside.";
    if (phase === "hold") return "Absolute stillness. Relax your shoulders. Let cardiac oscillations align in rest.";
    if (phase === "exhale") return "Sigh out thoroughly. Drop all residuals. The vagal break is actively slowing down your pulse.";
    return "";
  };

  // Memoized interactive zoom calculation for HRV telemetry
  const displayedTelemetry = React.useMemo(() => {
    if (liveTelemetry.length <= 5) return liveTelemetry;
    const startIndex = Math.floor((zoomRange[0] / 100) * liveTelemetry.length);
    const endIndex = Math.min(
      liveTelemetry.length,
      Math.ceil((zoomRange[1] / 100) * liveTelemetry.length)
    );
    // Guarantee at least 3 points are shown to keep chart stable
    if (endIndex - startIndex < 3) {
      return liveTelemetry.slice(Math.max(0, endIndex - 3), endIndex);
    }
    return liveTelemetry.slice(startIndex, endIndex);
  }, [liveTelemetry, zoomRange]);

  // Identify physiological coherence peaks in HRV stream
  const peaks = React.useMemo(() => {
    const list: typeof liveTelemetry = [];
    if (liveTelemetry.length < 3) return list;

    // Detect local maxima where HRV rises and then falls
    for (let i = 1; i < liveTelemetry.length - 1; i++) {
      const prev = liveTelemetry[i - 1].hrv;
      const curr = liveTelemetry[i].hrv;
      const next = liveTelemetry[i + 1].hrv;

      // Classify as peak if local maximum and hrv exceeds threshold
      if (curr > prev && curr > next && curr > 50) {
        list.push(liveTelemetry[i]);
      }
    }

    // Return the top 3 highest intensity coherence peaks in the session to avoid layout clutter
    return [...list].sort((a, b) => b.hrv - a.hrv).slice(0, 3);
  }, [liveTelemetry]);

  // Filter peaks to only those within the current visual viewport/zoom slice
  const visiblePeaks = React.useMemo(() => {
    return peaks.filter((peak: any) => 
      displayedTelemetry.some((item: any) => item.id === peak.id)
    );
  }, [peaks, displayedTelemetry]);

  // Custom interactive tooltip rendered when user hovers on telemetry trends in expanded mode
  const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={`p-3 max-w-[200px] rounded-xl border shadow-lg backdrop-blur-md font-sans text-[11px] transition-all duration-150 ${
          isDark 
            ? "bg-zinc-950/95 border-zinc-800 text-white shadow-black/40" 
            : "bg-white/95 border-emerald-500/15 text-slate-800 shadow-slate-200/50"
        }`}>
          <div className="font-semibold text-slate-400 dark:text-zinc-500 mb-1.5 border-b border-slate-100 dark:border-zinc-800 pb-1.5 flex justify-between items-center">
            <span className="uppercase tracking-widest text-[9.5px] font-black">Timeline</span>
            <span className="font-mono text-[9.5px] font-bold">{label}s</span>
          </div>
          <div className="space-y-1.5">
            {payload.map((entry: any, index: number) => {
              const isBpm = entry.dataKey === "bpm";
              const isGuidance = entry.dataKey === "guidance";
              return (
                <div key={index} className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-1.5 text-slate-500 dark:text-zinc-400 font-medium">
                    <span 
                      className="w-1.5 h-1.5 rounded-full inline-block shrink-0" 
                      style={{ backgroundColor: entry.stroke }}
                    />
                    <span>{isBpm ? "Heart Rate" : isGuidance ? "Guidance Rhythm" : "Vagal Tone"}</span>
                  </span>
                  <span className="font-mono font-bold tabular-nums" style={{ color: entry.stroke }}>
                    {entry.value}{isBpm ? " BPM" : " ms"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

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
                <button
                  id="breathing-expand"
                  onClick={() => setIsExpanded(true)}
                  className="p-2.5 rounded-xl border border-emerald-500/10 text-airra-primary bg-emerald-500/5 hover:bg-emerald-500/10 dark:text-emerald-400 max-h-10 transition-all"
                  title="Expand Fullscreen Biofeedback Monitor"
                >
                  <Maximize2 size={16} />
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
              
              {/* Outer Circular Progress Track */}
              <svg className="absolute w-48 h-48 pointer-events-none transform -rotate-90 z-10 overflow-visible">
                {/* Background Track Circle */}
                <circle
                  cx="96"
                  cy="96"
                  r="86"
                  fill="none"
                  stroke={isDark ? "rgba(255, 255, 255, 0.04)" : "rgba(45, 106, 79, 0.04)"}
                  strokeWidth="3"
                />
                {/* Active Dynamic Progress Arc */}
                <motion.circle
                  cx="96"
                  cy="96"
                  r="86"
                  fill="none"
                  stroke={dynamicColor}
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 86}`}
                  animate={{ 
                    pathLength: progressRatio 
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 40,
                    damping: 15,
                    mass: 0.8
                  }}
                />
              </svg>

              {/* Pulsating background feedback rays with dynamic autonomic color shift */}
              {phase !== "ready" && isPlaying && (
                <motion.div
                  animate={{
                    scale: [visual.scale, visual.scale * 1.15, visual.scale],
                    opacity: [0.08, 0.22, 0.08],
                    borderColor: dynamicColor
                  }}
                  transition={{
                    scale: {
                      repeat: Infinity,
                      duration: phase === "hold" ? 1.75 : 3.0,
                      ease: "easeInOut"
                    },
                    opacity: {
                      repeat: Infinity,
                      duration: phase === "hold" ? 1.75 : 3.0,
                      ease: "easeInOut"
                    },
                    borderColor: { duration: 0.8 }
                  }}
                  style={{ color: dynamicColor }}
                  className="w-32 h-32 rounded-full border absolute transition-colors"
                />
              )}

              {/* Main Core Target with responsive size, color & background dynamics */}
              <motion.div
                animate={{ 
                  scale: visual.scale,
                  backgroundColor: dynamicBgColor,
                  borderColor: dynamicBorderColor,
                  boxShadow: dynamicBoxShadow,
                  color: dynamicColor
                }}
                transition={{
                  scale: { type: "spring", stiffness: 35, damping: 14, mass: 0.8 },
                  backgroundColor: { duration: 0.8 },
                  borderColor: { duration: 0.8 },
                  boxShadow: { type: "spring", stiffness: 35, damping: 14 },
                  color: { duration: 0.8 }
                }}
                className="w-32 h-32 rounded-full border-2 flex flex-col items-center justify-center relative z-20"
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
                      <Wind 
                        className="w-10 h-10 animate-pulse" 
                        style={{ color: dynamicColor }} 
                      />
                    ) : (
                      <>
                        <div 
                          className="text-[9px] font-black uppercase tracking-[0.25em] opacity-60"
                          style={{ color: dynamicColor }}
                        >
                          {visual.label}
                        </div>
                        <div 
                          className="text-3xl font-extrabold tracking-tighter mt-0.5"
                          style={{ color: dynamicColor }}
                        >
                          {visual.progressText}s
                        </div>
                      </>
                    )}
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            </div>

            {/* Horizontal Sequential Phase Progress Capsules */}
            {phase !== "ready" && (
              <div className="w-full max-w-xs grid grid-cols-3 gap-3.5 px-4 animate-fade-in">
                {/* Capsule 1: Inhale */}
                <div className="space-y-1">
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden relative border border-slate-200/20 dark:border-white/5">
                    <motion.div
                      animate={{
                        width: phase === "inhale"
                          ? `${Math.round(((INHALE_DURATION - timeLeft) / INHALE_DURATION) * 100)}%`
                          : (phase === "hold" || phase === "exhale") ? "100%" : "0%"
                      }}
                      transition={{ type: "tween", ease: "linear", duration: 0.1 }}
                      className="h-full bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.2)] rounded-full"
                    />
                  </div>
                  <div className={`text-[8.5px] font-black uppercase tracking-wider text-center transition-colors duration-300 ${phase === "inhale" ? "text-teal-600 dark:text-teal-400 font-extrabold" : "text-slate-400 dark:text-zinc-500 font-medium"}`}>
                    Inhale (4s)
                  </div>
                </div>

                {/* Capsule 2: Hold */}
                <div className="space-y-1">
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden relative border border-slate-200/20 dark:border-white/5">
                    <motion.div
                      animate={{
                        width: phase === "hold"
                          ? `${Math.round(((HOLD_DURATION - timeLeft) / HOLD_DURATION) * 100)}%`
                          : phase === "exhale" ? "100%" : "0%"
                      }}
                      transition={{ type: "tween", ease: "linear", duration: 0.1 }}
                      className="h-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.2)] rounded-full"
                    />
                  </div>
                  <div className={`text-[8.5px] font-black uppercase tracking-wider text-center transition-colors duration-300 ${phase === "hold" ? "text-amber-600 dark:text-amber-400 font-extrabold" : "text-slate-400 dark:text-zinc-500 font-medium"}`}>
                    Hold (7s)
                  </div>
                </div>

                {/* Capsule 3: Exhale */}
                <div className="space-y-1">
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden relative border border-slate-200/20 dark:border-white/5">
                    <motion.div
                      animate={{
                        width: phase === "exhale"
                          ? `${Math.round(((EXHALE_DURATION - timeLeft) / EXHALE_DURATION) * 100)}%`
                          : "0%"
                      }}
                      transition={{ type: "tween", ease: "linear", duration: 0.1 }}
                      className="h-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.2)] rounded-full"
                    />
                  </div>
                  <div className={`text-[8.5px] font-black uppercase tracking-wider text-center transition-colors duration-300 ${phase === "exhale" ? "text-indigo-600 dark:text-indigo-400 font-extrabold" : "text-slate-400 dark:text-zinc-500 font-medium"}`}>
                    Exhale (8s)
                  </div>
                </div>
              </div>
            )}

            {/* Ambient Soundscapes Selector */}
            <div className="w-full max-w-xs space-y-2 px-4 text-left">
              <label 
                id="ambient-soundscape-label"
                className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-zinc-500 block flex items-center gap-1"
              >
                <Volume2 size={10} className="text-emerald-600 dark:text-emerald-400" />
                Atmospheric Soundscape
              </label>
              <div className="relative">
                <select
                  id="ambient-soundscape-dropdown"
                  value={audioUrl}
                  onChange={(e) => setAudioUrl(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white/40 dark:bg-zinc-900/60 text-xs text-slate-800 dark:text-white focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F] transition-all outline-none cursor-pointer font-medium appearance-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%2310B981' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E")`,
                    backgroundPosition: 'right 0.75rem center',
                    backgroundSize: '1.25rem',
                    backgroundRepeat: 'no-repeat',
                    paddingRight: '2.5rem'
                  }}
                >
                  {SOUNDSCAPES.map((sc) => (
                    <option key={sc.id} value={sc.url} className="bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100">
                      {sc.name}
                    </option>
                  ))}
                </select>
                <div className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1 italic font-medium leading-relaxed">
                  {SOUNDSCAPES.find(sc => sc.url === audioUrl)?.info || "Silent deep breathing focus"}
                </div>
              </div>
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
          <style>{`
            @keyframes hrvPulse {
              0% {
                stroke-width: 2.5px;
                filter: drop-shadow(0 0 2px rgba(20, 184, 166, 0.4));
              }
              50% {
                stroke-width: 3.5px;
                filter: drop-shadow(0 0 12px rgba(20, 184, 166, 0.95)) drop-shadow(0 0 5px rgba(20, 184, 166, 0.6));
              }
              100% {
                stroke-width: 2.5px;
                filter: drop-shadow(0 0 2px rgba(20, 184, 166, 0.4));
              }
            }
            @keyframes hrvTrailPulse {
              0% {
                stroke-width: 5px;
                opacity: 0.15;
              }
              50% {
                stroke-width: 7.5px;
                opacity: 0.35;
              }
              100% {
                stroke-width: 5px;
                opacity: 0.15;
              }
            }
            .active-hrv-line path.recharts-curve {
              animation: hrvPulse 2.5s infinite ease-in-out;
            }
            .active-hrv-trail path.recharts-curve {
              animation: hrvTrailPulse 2.5s infinite ease-in-out;
            }
          `}</style>

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
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="airra-glass border-emerald-300/30 text-emerald-800 dark:text-emerald-300 px-3 py-1.5 rounded-lg text-[9px] font-black tracking-wider uppercase flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    Connected to {healthProvider}
                  </div>
                  <button 
                    id="manual-resync-button"
                    onClick={() => {
                      setSyncProvider(healthProvider);
                      setSyncStep(0); // reset sync state so user can trigger manually
                      setIsSyncModalOpen(true);
                    }}
                    className="px-2.5 py-1.5 rounded-md text-[8px] font-black uppercase tracking-wider bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 transition-all cursor-pointer flex items-center gap-1"
                    title="Manually re-trigger biometric sensor synchronization"
                  >
                    <RefreshCw size={10} className="animate-pulse" /> Re-sync
                  </button>
                  <button 
                    id="disconnect-health-button"
                    onClick={disconnectProvider}
                    className="text-[9px] font-semibold text-[rgb(120,120,120)] hover:text-rose-500 transition-all font-mono px-2 py-1 bg-slate-50 dark:bg-zinc-900 rounded-lg border border-slate-200/50 dark:border-white/5 cursor-pointer"
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
                      onClick={() => {
                        setSyncProvider("Apple Health");
                        setSyncStep(0);
                        setIsSyncModalOpen(true);
                      }}
                      className="px-2.5 py-1.5 rounded-md text-[8px] font-black uppercase tracking-wider bg-slate-50 hover:bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-zinc-300 transition-all cursor-pointer"
                    >
                      Apple Health
                    </button>
                    <button
                      id="connect-fitbit"
                      onClick={() => {
                        setSyncProvider("Fitbit");
                        setSyncStep(0);
                        setIsSyncModalOpen(true);
                      }}
                      className="px-2.5 py-1.5 rounded-md text-[8px] font-black uppercase tracking-wider bg-slate-50 hover:bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-zinc-300 transition-all cursor-pointer"
                    >
                      Fitbit
                    </button>
                    <button
                      id="connect-garmin"
                      onClick={() => {
                        setSyncProvider("Garmin");
                        setSyncStep(0);
                        setIsSyncModalOpen(true);
                      }}
                      className="px-2.5 py-1.5 rounded-md text-[8px] font-black uppercase tracking-wider bg-slate-50 hover:bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-zinc-300 transition-all cursor-pointer"
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

          {/* HRV Session Target & Goal Progression Section */}
          <div className="bg-[#E8F0EC]/50 dark:bg-emerald-950/[0.08] p-5 rounded-xl border border-emerald-500/10 flex flex-col md:flex-row items-stretch justify-between gap-6">
            {/* Controls Side */}
            <div className="flex-grow space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-[#2D6A4F] dark:text-emerald-400">
                  <Target size={16} />
                </div>
                <div>
                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-200">
                    Target HRV Session Goal
                  </h5>
                  <span className="text-[9.5px] text-slate-400 dark:text-zinc-500 font-medium">
                    Adjust target milliseconds improvement to trigger vagal feedback loop.
                  </span>
                </div>
              </div>

              {/* Slider and Input combo */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600 dark:text-zinc-300 font-semibold font-mono">
                    Target: +{targetHrvImprovement} ms HRV Improvement
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Baseline: {initialHrv} ms → Target: {initialHrv + targetHrvImprovement} ms
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input 
                    id="hrv-target-slider"
                    type="range" 
                    min="5" 
                    max="50" 
                    step="5"
                    value={targetHrvImprovement} 
                    onChange={(e) => setTargetHrvImprovement(Number(e.target.value))}
                    className="flex-1 accent-emerald-700 dark:accent-emerald-400 h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>

              {/* Preset quick pills */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[10, 20, 30, 40].map((preset) => {
                  let label = "Gentle";
                  if (preset === 20) label = "Optimal";
                  if (preset === 30) label = "Deep Calm";
                  if (preset === 40) label = "Resonance";
                  return (
                    <button
                      key={preset}
                      id={`preset-hrv-${preset}`}
                      onClick={() => setTargetHrvImprovement(preset)}
                      className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border ${
                        targetHrvImprovement === preset
                          ? "bg-emerald-700 border-emerald-700 text-white dark:bg-emerald-500 dark:border-emerald-500"
                          : "bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-white/10"
                      }`}
                    >
                      +{preset} ms ({label})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Progress Tracker Side */}
            <div className="w-full md:w-64 bg-white/40 dark:bg-black/10 border border-slate-200/50 dark:border-white/5 p-4 rounded-xl flex flex-col justify-between space-y-3">
              <div className="flex justify-between items-start text-xs">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">Session Progress</span>
                  <span id="current-hrv-improvement" className="font-mono text-base font-extrabold text-slate-800 dark:text-zinc-100">
                    +{currentImprovement} ms <span className="text-xs font-normal text-slate-400 dark:text-zinc-500">reached</span>
                  </span>
                </div>
                <div>
                  {goalAchieved ? (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider animate-pulse flex items-center gap-1">
                      <Check size={10} strokeWidth={3} /> Goal Achieved!
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-mono">
                      {progressPercent}% Complete
                    </span>
                  )}
                </div>
              </div>

              {/* The Linear Progress Bar */}
              <div className="space-y-1.5">
                <div className="w-full bg-slate-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden border border-slate-200/30 dark:border-white/5">
                  <motion.div 
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ type: "spring", stiffness: 45, damping: 15 }}
                    className={`h-full rounded-full transition-all duration-300 ${
                      goalAchieved 
                        ? "bg-gradient-to-r from-emerald-500 to-teal-500 shadow-[0_0_12px_rgba(16,185,129,0.3)] animate-pulse" 
                        : "bg-emerald-600 dark:bg-emerald-400"
                    }`}
                  />
                </div>

                <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  <span>Current: +{currentImprovement}ms</span>
                  <span>Goal: +{targetHrvImprovement}ms</span>
                </div>
              </div>

              {/* Micro-encouragement based on progress */}
              <p className="text-[9.5px] italic text-slate-500 dark:text-zinc-400 leading-snug">
                {goalAchieved 
                  ? "Superb! Your lung expansion and visual timer matches vagal balance perfectly. Keep breathing."
                  : progressPercent > 60
                  ? "Almost there. Focus on long, relaxed sighs. The vagal reflex is actively stabilizing."
                  : progressPercent > 20
                  ? "Nice flow. Your autonomic nervous system is settling. Keep synchronized with the pacer."
                  : "Let's begin. Relax your throat and stomach. Progress improves with each deep cycle."}
              </p>
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
                      <LineChart data={liveTelemetry.slice(-15)} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                        <defs>
                          <filter id="hrv-line-glow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation={isPlaying ? "3.5" : "0.1"} result="blur" />
                            <feMerge>
                              <feMergeNode in="blur" />
                              <feMergeNode in="SourceGraphic" />
                            </feMerge>
                          </filter>
                        </defs>
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
                        {/* Glow/trail backdrop line when active */}
                        {isPlaying && (
                          <Line
                            key="hrv-active-trail"
                            name="HRV Resonance Trail"
                            type="monotone"
                            dataKey="hrv"
                            stroke="#14B8A6"
                            strokeWidth={5.5}
                            opacity={0.3}
                            dot={false}
                            activeDot={false}
                            className="active-hrv-trail"
                            legendType="none"
                          />
                        )}
                        <Line
                          name="HRV (Parasympathetic Tone)"
                          type="monotone"
                          dataKey="hrv"
                          stroke="#14B8A6"
                          strokeWidth={2.5}
                          dot={false}
                          activeDot={{ r: 6 }}
                          className={isPlaying ? "active-hrv-line" : ""}
                          filter={isPlaying ? "url(#hrv-line-glow)" : undefined}
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

      {/* Expanded Interactive Fullscreen Overlay */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            id="breathing-mechanics-expanded-overlay"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", duration: 0.45 }}
            className={`fixed inset-0 z-50 flex flex-col justify-between overflow-y-auto ${
              isDark 
                ? "bg-zinc-950/98 text-white text-zinc-100" 
                : "bg-[#F7F4EF]/98 text-slate-800"
            } p-6 md:p-12 backdrop-blur-xl`}
          >
            {/* Header Suite */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-200/40 dark:border-white/10 pb-6 mb-8 gap-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#2D6A4F] dark:text-emerald-400">
                  Efferent Vagal Biofeedback Suite
                </span>
                <h2 className="text-2xl md:text-3xl font-display font-black uppercase tracking-tight mt-1">
                  Cardiorespiratory Coherence Monitor
                </h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-xl">
                  Real-time visual monitoring of respiratory sinus arrhythmia (RSA), heart rate variability (HRV) tuning, and autonomic nervous system realignment.
                </p>
              </div>
              
              <button
                id="breathing-minimize"
                onClick={() => setIsExpanded(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-xs font-black uppercase tracking-widest flex items-center gap-2 active:scale-95 transition-all self-end md:self-auto"
                title="Minimize Biofeedback Overlay"
              >
                <Minimize2 size={16} /> Minimize Monitor
              </button>
            </div>

            {/* Immersive Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch flex-1">
              
              {/* Left Column: Synchronized Visual Respirator Panel */}
              <div className="lg:col-span-5 flex flex-col justify-between items-center bg-white/40 dark:bg-zinc-900/40 border border-slate-200/50 dark:border-white/5 rounded-2xl p-6 md:p-8 space-y-6">
                
                <div className="text-center w-full">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-zinc-500">
                    Acoustic Calibration Active
                  </span>
                  <div className="flex justify-center gap-2 mt-2">
                    <button
                      id="expanded-toggle-sound"
                      onClick={() => setSoundEnabled(!soundEnabled)}
                      className="p-2.5 rounded-md border border-emerald-500/10 text-airra-primary bg-emerald-500/5 hover:bg-emerald-500/10 dark:text-emerald-400 transition-all text-xs flex items-center gap-1.5"
                    >
                      {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                      <span className="text-[9px] font-bold uppercase tracking-wider">Acoustics: {soundEnabled ? "ON" : "OFF"}</span>
                    </button>
                  </div>
                </div>

                {/* Main Pulsating Visual Stage */}
                <div className="h-72 w-full flex items-center justify-center relative">
                  {/* Outer Circular Progress Track */}
                  <svg className="absolute w-56 h-56 pointer-events-none transform -rotate-90 z-10 overflow-visible">
                    <circle
                      cx="112"
                      cy="112"
                      r="100"
                      fill="none"
                      stroke={isDark ? "rgba(255, 255, 255, 0.04)" : "rgba(45, 106, 79, 0.04)"}
                      strokeWidth="3.5"
                    />
                    <motion.circle
                      cx="112"
                      cy="112"
                      r="100"
                      fill="none"
                      stroke={dynamicColor}
                      strokeWidth="5.5"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 100}`}
                      animate={{ 
                        pathLength: progressRatio 
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 45,
                        damping: 15,
                        mass: 0.8
                      }}
                    />
                  </svg>

                  {/* Pulsating background feedback rays */}
                  {phase !== "ready" && isPlaying && (
                    <motion.div
                      animate={{
                        scale: [visual.scale, visual.scale * 1.18, visual.scale],
                        opacity: [0.08, 0.24, 0.08],
                        borderColor: dynamicColor
                      }}
                      transition={{
                        scale: {
                          repeat: Infinity,
                          duration: phase === "hold" ? 1.75 : 3.0,
                          ease: "easeInOut"
                        },
                        opacity: {
                          repeat: Infinity,
                          duration: phase === "hold" ? 1.75 : 3.0,
                          ease: "easeInOut"
                        }
                      }}
                      style={{ color: dynamicColor }}
                      className="w-40 h-40 rounded-full border absolute transition-colors"
                    />
                  )}

                  {/* Micro-Target with responsive visual dynamics */}
                  <motion.div
                    animate={{ 
                      scale: visual.scale,
                      backgroundColor: dynamicBgColor,
                      borderColor: dynamicBorderColor,
                      boxShadow: dynamicBoxShadow,
                      color: dynamicColor
                    }}
                    transition={{
                      scale: { type: "spring", stiffness: 35, damping: 14, mass: 0.8 },
                      backgroundColor: { duration: 0.8 },
                      borderColor: { duration: 0.8 },
                      boxShadow: { type: "spring", stiffness: 35, damping: 14 }
                    }}
                    className="w-40 h-40 rounded-full border-2 flex flex-col items-center justify-center relative z-20"
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
                          <Wind 
                            className="w-14 h-14 animate-pulse mx-auto" 
                            style={{ color: dynamicColor }} 
                          />
                        ) : (
                          <>
                            <div 
                              className="text-[10px] font-black uppercase tracking-[0.25em] opacity-60"
                              style={{ color: dynamicColor }}
                            >
                              {visual.label}
                            </div>
                            <div 
                              className="text-4xl font-extrabold tracking-tighter mt-1"
                              style={{ color: dynamicColor }}
                            >
                              {visual.progressText}s
                            </div>
                          </>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </motion.div>
                </div>

                {/* Horizontal sequential capsules for active phase pacing */}
                {phase !== "ready" && (
                  <div className="w-full max-w-sm grid grid-cols-3 gap-3.5 px-2">
                    {/* Capsule 1: Inhale */}
                    <div className="space-y-1">
                      <div className="h-1.5 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden relative border border-slate-200/20 dark:border-white/5">
                        <motion.div
                          animate={{
                            width: phase === "inhale"
                              ? `${Math.round(((INHALE_DURATION - timeLeft) / INHALE_DURATION) * 100)}%`
                              : (phase === "hold" || phase === "exhale") ? "100%" : "0%"
                          }}
                          transition={{ type: "tween", ease: "linear", duration: 0.1 }}
                          className="h-full bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.3)] rounded-full"
                        />
                      </div>
                      <div className={`text-[8px] font-black uppercase tracking-wider text-center transition-colors duration-300 ${phase === "inhale" ? "text-teal-600 dark:text-teal-400 font-extrabold" : "text-slate-400 dark:text-zinc-500 font-medium"}`}>
                        Inhale (4s)
                      </div>
                    </div>

                    {/* Capsule 2: Hold */}
                    <div className="space-y-1">
                      <div className="h-1.5 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden relative border border-slate-200/20 dark:border-white/5">
                        <motion.div
                          animate={{
                            width: phase === "hold"
                              ? `${Math.round(((HOLD_DURATION - timeLeft) / HOLD_DURATION) * 100)}%`
                              : phase === "exhale" ? "100%" : "0%"
                          }}
                          transition={{ type: "tween", ease: "linear", duration: 0.1 }}
                          className="h-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.3)] rounded-full"
                        />
                      </div>
                      <div className={`text-[8px] font-black uppercase tracking-wider text-center transition-colors duration-300 ${phase === "hold" ? "text-amber-600 dark:text-amber-400 font-extrabold" : "text-slate-400 dark:text-zinc-500 font-medium"}`}>
                        Hold (7s)
                      </div>
                    </div>

                    {/* Capsule 3: Exhale */}
                    <div className="space-y-1">
                      <div className="h-1.5 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden relative border border-slate-200/20 dark:border-white/5">
                        <motion.div
                          animate={{
                            width: phase === "exhale"
                              ? `${Math.round(((EXHALE_DURATION - timeLeft) / EXHALE_DURATION) * 100)}%`
                              : "0%"
                          }}
                          transition={{ type: "tween", ease: "linear", duration: 0.1 }}
                          className="h-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.3)] rounded-full"
                        />
                      </div>
                      <div className={`text-[8px] font-black uppercase tracking-wider text-center transition-colors duration-300 ${phase === "exhale" ? "text-indigo-600 dark:text-indigo-400 font-extrabold" : "text-slate-400 dark:text-zinc-500 font-medium"}`}>
                        Exhale (8s)
                      </div>
                    </div>
                  </div>
                )}

                {/* Descriptive Copywriting Instructions (Design Guide Microcopy) */}
                <div className="h-14 flex flex-col items-center justify-center text-center max-w-sm">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={phase}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="space-y-1"
                    >
                      <p className="text-sm font-serif italic text-slate-700 dark:text-zinc-200">
                        {getMicrocopy()}
                      </p>
                      {cycleCount > 0 && (
                        <div className="text-[8.5px] font-black uppercase tracking-widest text-[#2D6A4F] dark:text-emerald-400 flex items-center justify-center gap-1.5 animate-pulse">
                          <Sparkles size={11} className="fill-current" />
                          RESPIRATORY CYCLE {cycleCount} COMPLETE
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Direct Control Actions */}
                <div className="flex gap-3 w-full justify-center">
                  <button
                    id="expanded-reset-breathing"
                    onClick={handleReset}
                    disabled={phase === "ready"}
                    className="h-11 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 active:scale-95 transition-all flex items-center gap-1.5 text-slate-500 disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <RotateCcw size={13} /> Reset
                  </button>
                  
                  <button
                    id="expanded-toggle-pacer"
                    onClick={handleStartStop}
                    className={`h-11 px-7 rounded-xl text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all flex items-center gap-2 text-white ${
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

              {/* Right Column: HRV trends telemetry and deep-dive breathing stats */}
              <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
                
                {/* Visual HRV Resonance Graph */}
                <div className="bg-white/40 dark:bg-zinc-900/40 border border-slate-200/50 dark:border-white/5 rounded-2xl p-6 flex flex-col h-[340px]">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-[#2D6A4F] dark:text-emerald-400">
                        Visualizing Respiratory Sinus Arrhythmia
                      </span>
                      <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-200">
                        Sympathovagal Balancing Trends
                      </h4>
                    </div>
                    {liveTelemetry.length > 0 && (
                      <span className="text-[10px] bg-[#E8F0EC]/80 dark:bg-emerald-950/40 text-[#2D6A4F] dark:text-emerald-400 border border-emerald-500/10 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1.5 font-mono">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                        Live Streaming Bio-Data Feed
                      </span>
                    )}
                  </div>

                  {/* Series Visibility Control Bar */}
                  <div className="flex flex-wrap gap-2 items-center mb-4 pb-3 border-b border-slate-100 dark:border-zinc-800/40 text-[10px]">
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500 mr-1">
                      Data Streams:
                    </span>
                    
                    <button
                      id="toggle-bpm-series"
                      onClick={() => setShowBpmSeries(!showBpmSeries)}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 border ${
                        showBpmSeries
                          ? isDark
                            ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                            : "bg-rose-50 border-rose-200 text-rose-700"
                          : "bg-slate-50 dark:bg-zinc-800/20 border-slate-200/50 dark:border-zinc-800/50 text-slate-400 dark:text-zinc-600 hover:bg-slate-100 dark:hover:bg-zinc-800/30"
                      }`}
                    >
                      <span 
                        style={{ fontSize: "11px" }}
                        className={`w-1.5 h-1.5 rounded-full ${showBpmSeries ? "bg-rose-500" : "bg-slate-300 dark:bg-zinc-700"}`} 
                      />
                      Heart Rate (BPM)
                    </button>

                    <button
                      id="toggle-hrv-series"
                      onClick={() => setShowHrvSeries(!showHrvSeries)}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 border ${
                        showHrvSeries
                          ? isDark
                            ? "bg-teal-500/10 border-teal-500/30 text-teal-400"
                            : "bg-teal-50 border-teal-200 text-teal-700"
                          : "bg-slate-50 dark:bg-zinc-800/20 border-slate-200/50 dark:border-zinc-800/50 text-slate-400 dark:text-zinc-600 hover:bg-slate-100 dark:hover:bg-zinc-800/30"
                      }`}
                    >
                      <span 
                        style={{ fontSize: "11px" }}
                        className={`w-1.5 h-1.5 rounded-full ${showHrvSeries ? "bg-teal-500" : "bg-slate-300 dark:bg-zinc-700"}`} 
                      />
                      Vagal Tone (HRV)
                    </button>

                    <button
                      id="toggle-guidance-path"
                      onClick={() => setShowGuidancePath(!showGuidancePath)}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 border ${
                        showGuidancePath
                          ? isDark
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                            : "bg-[#E8F0EC] border-emerald-300/60 text-[#2D6A4F] font-bold"
                            : "bg-slate-50 dark:bg-zinc-800/20 border-slate-200/50 dark:border-zinc-800/50 text-slate-400 dark:text-zinc-600 hover:bg-slate-100 dark:hover:bg-zinc-800/30"
                      }`}
                    >
                      <span 
                        style={{ fontSize: "11px" }}
                        className={`w-1.5 h-1.5 rounded-full ${showGuidancePath ? "bg-emerald-500 dark:bg-emerald-400 animate-pulse" : "bg-slate-300 dark:bg-zinc-700"}`} 
                      />
                      Guidance Path (Ideal Rhythm)
                    </button>

                    <button
                      id="toggle-coherence-peaks"
                      onClick={() => setShowPeaks(!showPeaks)}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 border ${
                        showPeaks
                          ? isDark
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                            : "bg-emerald-50 border-emerald-200 text-emerald-700"
                          : "bg-slate-50 dark:bg-zinc-800/20 border-slate-200/50 dark:border-zinc-800/50 text-slate-400 dark:text-zinc-600 hover:bg-slate-100 dark:hover:bg-zinc-800/30"
                      }`}
                    >
                      <span 
                        style={{ fontSize: "11px" }}
                        className={`w-1.5 h-1.5 rounded-full ${showPeaks ? "bg-emerald-500" : "bg-slate-300 dark:bg-zinc-700"}`} 
                      />
                      Coherence Peaks
                    </button>

                    <label
                      htmlFor="toggle-hrv-baseline"
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-2 border cursor-pointer select-none ${
                        showBaseline
                          ? isDark
                            ? "bg-teal-500/10 border-teal-500/30 text-teal-400 font-bold"
                            : "bg-[#E8F0EC] border-emerald-300/60 text-[#2D6A4F] font-bold"
                          : "bg-slate-50 dark:bg-zinc-800/20 border-slate-200/50 dark:border-zinc-800/50 text-slate-400 dark:text-zinc-600 hover:bg-slate-100 dark:hover:bg-zinc-800/30"
                      }`}
                    >
                      <input
                        type="checkbox"
                        id="toggle-hrv-baseline"
                        checked={showBaseline}
                        onChange={(e) => setShowBaseline(e.target.checked)}
                        className="rounded border-slate-300 dark:border-zinc-750 text-[#2D6A4F] dark:text-teal-400 bg-transparent focus:ring-0 cursor-pointer h-3 w-3 accent-teal-500"
                      />
                      <span>HRV Baseline</span>
                    </label>
                  </div>

                  <div className="flex-1 w-full flex items-center justify-center">
                    {liveTelemetry.length === 0 ? (
                      <div className="text-center p-6 text-slate-400 dark:text-zinc-500 max-w-sm space-y-2">
                        <Activity className="mx-auto text-emerald-500/40 animate-pulse" size={32} />
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Resonance Loop Active
                        </p>
                        <p className="text-[10px] leading-relaxed">
                          Click "Start Breathwork" to open live telemetry tracks. Heart rate variability (HRV) and heart rate (BPM) will map onto this full-sized vector canvas as you breathe.
                        </p>
                      </div>
                    ) : (
                      <div className="w-full h-full min-h-[220px] flex flex-col justify-between">
                        <div className="flex-1 w-full min-h-[180px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={displayedTelemetry} margin={{ top: 25, right: 25, left: -20, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#2A2A2A" : "#ECEEEB"} />
                              <XAxis dataKey="time" stroke="#94A3B8" fontSize={9} tickLine={false} />
                              <YAxis stroke="#94A3B8" fontSize={9} domain={[40, 110]} tickLine={false} />
                              <Tooltip content={<CustomChartTooltip />} />
                              {showBaseline && (
                                <ReferenceLine
                                  y={historicalData.length > 0 
                                    ? Math.round(historicalData.reduce((acc, d) => acc + d.hrv, 0) / historicalData.length) 
                                    : 58} 
                                  stroke={isDark ? "rgba(20, 184, 166, 0.45)" : "rgba(45, 106, 79, 0.45)"}
                                  strokeDasharray="4 4"
                                  strokeWidth={1.5}
                                >
                                  <Label
                                    value={`7-Day HRV Baseline (${historicalData.length > 0 
                                      ? Math.round(historicalData.reduce((acc, d) => acc + d.hrv, 0) / historicalData.length) 
                                      : 58} ms)`}
                                    position="insideBottomRight"
                                    offset={6}
                                    fill={isDark ? "#2DD4BF" : "#0D9488"}
                                    fontSize={8}
                                    fontWeight={800}
                                    className="font-mono tracking-widest text-[8px] uppercase opacity-75"
                                  />
                                </ReferenceLine>
                              )}
                              {showBpmSeries && (
                                <Line
                                  name="BPM (Heart Rate Resonance)"
                                  type="monotone"
                                  dataKey="bpm"
                                  stroke={isDark ? "#FB7185" : "#E11D48"}
                                  strokeWidth={3}
                                  dot={false}
                                  activeDot={{ 
                                    r: 7, 
                                    stroke: isDark ? "#FB7185" : "#E11D48", 
                                    strokeWidth: 2, 
                                    fill: isDark ? "#09090b" : "#ffffff" 
                                  }}
                                />
                              )}
                              {showHrvSeries && (
                                <Line
                                  name="HRV (Parasympathetic Feedback)"
                                  type="monotone"
                                  dataKey="hrv"
                                  stroke="#14B8A6"
                                  strokeWidth={3.2}
                                  dot={false}
                                  activeDot={{ 
                                    r: 7, 
                                    stroke: "#14B8A6", 
                                    strokeWidth: 2, 
                                    fill: isDark ? "#09090b" : "#ffffff" 
                                  }}
                                />
                              )}
                              {showGuidancePath && (
                                <Line
                                  name="Optimal Coherence Rhythm"
                                  type="monotone"
                                  dataKey="guidance"
                                  stroke="#10B981"
                                  strokeDasharray="5 5"
                                  strokeWidth={2.5}
                                  dot={false}
                                  activeDot={{ 
                                    r: 6, 
                                    stroke: "#10B981", 
                                    strokeWidth: 2, 
                                    fill: isDark ? "#09090b" : "#ffffff" 
                                  }}
                                />
                              )}

                              {/* Physiological Annotations showing when major HRV spikes occur relative to breathing phase */}
                              {showPeaks && showHrvSeries && visiblePeaks.map((peak: any, idx: number) => (
                                <ReferenceDot
                                  key={`coherence-peak-${idx}`}
                                  x={peak.time}
                                  y={peak.hrv}
                                  r={6}
                                  fill="#2D6A4F"
                                  stroke="#14B8A6"
                                  strokeWidth={2}
                                >
                                  <Label
                                    value={`Coherence Peak (${String(peak.phase).toUpperCase()})`}
                                    position="top"
                                    offset={10}
                                    fill={isDark ? "#2DD4BF" : "#0D9488"}
                                    fontSize={8.5}
                                    fontWeight={800}
                                    className="font-sans font-black tracking-wide uppercase"
                                  />
                                </ReferenceDot>
                              ))}
                            </LineChart>
                          </ResponsiveContainer>
                        </div>

                        {/* Interactive Range Slider (Zoom subsection of the breathing session) */}
                        <div id="chart-zoom-controls" className="mt-4 px-2 select-none border-t border-slate-100 dark:border-zinc-800/40 pt-3">
                          <div className="flex justify-between items-center text-[9.5px] font-mono text-slate-400 dark:text-zinc-500">
                            <span className="flex items-center gap-1.5 font-bold">
                              <span>🔍 View Window Segment:</span>
                              <span className="text-[#2D6A4F] dark:text-emerald-400 font-extrabold bg-[#E8F0EC]/80 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/10">
                                {zoomRange[0]}% — {zoomRange[1]}%
                              </span>
                            </span>
                            <span>Drag sliders to adjust high-resolution focus</span>
                          </div>

                          <div className="relative w-full h-2 bg-slate-200/60 dark:bg-zinc-800/60 rounded-full mt-2.5 mb-2.5">
                            {/* Visual Highlight indicator for active area */}
                            <div 
                              className="absolute h-full bg-[#2D6A4F]/25 dark:bg-emerald-400/25 rounded-full transition-all duration-75"
                              style={{ 
                                left: `${zoomRange[0]}%`, 
                                width: `${zoomRange[1] - zoomRange[0]}%` 
                              }}
                            />
                            
                            {/* Start Handle Input */}
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={zoomRange[0]}
                              onChange={(e) => {
                                const val = Math.min(Number(e.target.value), zoomRange[1] - 5);
                                setZoomRange([val, zoomRange[1]]);
                              }}
                              className="absolute inset-0 pointer-events-none appearance-none w-full h-full bg-transparent accent-[#2D6A4F] dark:accent-emerald-400 [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto"
                              id="zoom-slider-start"
                            />
                            
                            {/* End Handle Input */}
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={zoomRange[1]}
                              onChange={(e) => {
                                const val = Math.max(Number(e.target.value), zoomRange[0] + 5);
                                setZoomRange([zoomRange[0], val]);
                              }}
                              className="absolute inset-0 pointer-events-none appearance-none w-full h-full bg-transparent accent-[#2D6A4F] dark:accent-emerald-400 [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto"
                              id="zoom-slider-end"
                            />
                          </div>

                          <div className="flex justify-between items-center text-[8.5px] font-mono text-slate-400">
                            <span>0% (Start)</span>
                            <button
                              id="reset-expanded-zoom"
                              onClick={() => setZoomRange([0, 100])}
                              disabled={zoomRange[0] === 0 && zoomRange[1] === 100}
                              className="font-black uppercase tracking-widest text-[#2D6A4F] dark:text-emerald-400 disabled:opacity-30 disabled:cursor-not-allowed hover:underline flex items-center gap-1 active:scale-95 transition-all"
                            >
                              Reset Zoom View
                            </button>
                            <span>100% (End)</span>
                          </div>
                        </div>

                      </div>
                    )}
                  </div>
                </div>

                {/* Real-time Session Goals Tuning Block inside Expanded panel */}
                <div className="bg-[#E8F0EC]/30 dark:bg-emerald-950/[0.05] p-5 rounded-2xl border border-emerald-500/15">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Target size={15} className="text-[#2D6A4F] dark:text-emerald-400" />
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-200">
                          Active Vagal Stimulation Target
                        </span>
                      </div>
                      <input 
                        id="expanded-hrv-target-slider"
                        type="range" 
                        min="5" 
                        max="50" 
                        step="5"
                        value={targetHrvImprovement} 
                        onChange={(e) => setTargetHrvImprovement(Number(e.target.value))}
                        className="w-full accent-emerald-700 dark:accent-emerald-400 h-1.5 bg-slate-200/50 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                        <span>Target: +{targetHrvImprovement} ms HRV boost</span>
                        <span>Coherence threshold setup</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 sm:w-64 justify-start sm:justify-end items-center content-center pt-2 sm:pt-0">
                      {[10, 20, 30, 40].map((preset) => (
                        <button
                          key={preset}
                          id={`expanded-preset-hrv-${preset}`}
                          onClick={() => setTargetHrvImprovement(preset)}
                          className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all border ${
                            targetHrvImprovement === preset
                              ? "bg-emerald-700 border-emerald-700 text-white dark:bg-emerald-500 dark:border-emerald-500"
                              : "bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-white/10"
                          }`}
                        >
                          +{preset}ms
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Session deep-dive stats 4-bento-grid config */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  
                  {/* Card 1: Vagal Tone Growth (HRV RMSSD) */}
                  <div className="bg-[#F7F4EF] dark:bg-zinc-900/40 p-4 rounded-xl border border-emerald-500/5 flex flex-col justify-between min-h-24">
                    <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-wider text-slate-400">
                      <span>Vagal Gain</span>
                      <Activity size={12} className="text-teal-500" />
                    </div>
                    <div>
                      <div className="text-2xl font-mono font-black text-teal-600 dark:text-teal-400">
                        +{currentImprovement}ms
                      </div>
                      <div className="text-[9px] text-slate-400 font-bold mt-0.5">
                        {currentImprovement >= targetHrvImprovement ? "✓ Target Hit!" : `Goal: +${targetHrvImprovement}ms`}
                      </div>
                    </div>
                    <div className="text-[8px] text-slate-400">
                      Average: {statAverageHrv}ms
                    </div>
                  </div>

                  {/* Card 2: Pulse Variance (BPM) */}
                  <div className="bg-[#F7F4EF] dark:bg-zinc-900/40 p-4 rounded-xl border border-emerald-500/5 flex flex-col justify-between min-h-24">
                    <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-wider text-slate-400">
                      <span>Pulse Drift</span>
                      <motion.div
                        animate={{ scale: [1, 1.25, 1] }}
                        transition={{ repeat: Infinity, duration: parseFloat(pulseDuration), ease: "easeInOut" }}
                        className="text-rose-500"
                      >
                        <Heart size={12} className="fill-current" />
                      </motion.div>
                    </div>
                    <div>
                      <div className="text-2xl font-mono font-black text-slate-800 dark:text-zinc-100">
                        {biometrics.bpm}
                      </div>
                      <div className="text-[9px] text-slate-400 font-bold mt-0.5">
                        Min: {statLowestBpm} / Max: {statPeakBpm}
                      </div>
                    </div>
                    <div className="text-[8px] text-slate-400">
                      Resonant RSA active
                    </div>
                  </div>

                  {/* Card 3: Neural Coherence Ratio */}
                  <div className="bg-[#F7F4EF] dark:bg-zinc-900/40 p-4 rounded-xl border border-emerald-500/5 flex flex-col justify-between min-h-24">
                    <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-wider text-slate-400">
                      <span>Coherence</span>
                      <Sparkles size={12} className="text-amber-500" />
                    </div>
                    <div>
                      <div className="text-2xl font-mono font-black text-amber-600 dark:text-amber-400">
                        {biometrics.coherence}%
                      </div>
                      <div className="text-[9px] text-amber-600 dark:text-amber-400 font-bold mt-0.5 uppercase tracking-wide">
                        {biometrics.coherence > 18 ? "Optimal Resonance" : biometrics.coherence > 10 ? "Moderate Flow" : "Calibrating"}
                      </div>
                    </div>
                    <div className="text-[8px] text-slate-400">
                      Average: {statAverageCoherence}%
                    </div>
                  </div>

                  {/* Card 4: Resp Dynamics */}
                  <div className="bg-[#F7F4EF] dark:bg-zinc-900/40 p-4 rounded-xl border border-emerald-500/5 flex flex-col justify-between min-h-24">
                    <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-wider text-slate-400">
                      <span>Respiration Stats</span>
                      <Clock size={12} className="text-indigo-500" />
                    </div>
                    <div>
                      <div className="text-2xl font-mono font-black text-indigo-600 dark:text-indigo-400">
                        {formatDuration(sessionDurationSec)}
                      </div>
                      <div className="text-[9px] text-slate-400 font-bold mt-0.5">
                        Cycles: {cycleCount}
                      </div>
                    </div>
                    <div className="text-[8px] text-slate-400">
                      Autonomic realignment
                    </div>
                  </div>

                </div>

              </div>

            </div>

            {/* Footer Status Indicators */}
            <div className="flex justify-between items-center border-t border-slate-200/40 dark:border-white/10 pt-4 mt-8 text-[9px] text-slate-400 dark:text-zinc-500 font-mono">
              <span className="flex items-center gap-1.5 p-1 px-3 border border-slate-200/30 dark:border-white/5 rounded-lg bg-slate-50/50 dark:bg-zinc-900/10">
                <ShieldCheck size={13} className="text-emerald-500" />
                Dual-channel proxy real-time biosensor loop (v1.1) • End-to-end local security active
              </span>
              <span>
                SYSTEM STATE: {phase === "ready" ? "STANDBY" : `${phase.toUpperCase()} ACTIVATED`}
              </span>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* Biometric Manual Sync Modal */}
      <AnimatePresence>
        {isSyncModalOpen && (
          <div className="fixed inset-0 z-[150] overflow-y-auto">
            {/* Overlay backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => syncStep !== 5 && syncStep > 0 ? null : setIsSyncModalOpen(false)}
              className="fixed inset-0 bg-slate-950/40 dark:bg-zinc-950/80 backdrop-blur-md cursor-pointer"
            />
            
            {/* Modal Body container to center content */}
            <div className="flex min-h-screen items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className={`relative w-full max-w-xl rounded-3xl border p-6 sm:p-8 text-left shadow-2xl overflow-hidden focus:outline-none ${
                  isDark 
                    ? "bg-[#09090b] border-white/10 text-white" 
                    : "bg-[#FAFAFA] border-slate-200 text-slate-800"
                }`}
              >
                {/* Close Button */}
                {(syncStep === 0 || syncStep === 5) && (
                  <button
                    onClick={() => setIsSyncModalOpen(false)}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-200/50 dark:hover:bg-white/5 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-100 transition-colors cursor-pointer"
                    aria-label="Close sync modal"
                  >
                    <X size={16} />
                  </button>
                )}

                {/* Subtitle / Category Tag */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[9px] font-black uppercase tracking-wider mb-4">
                  <ShieldCheck size={12} />
                  Secure Biometric Pipeline
                </div>

                {/* Main Heading */}
                <h3 className="text-xl sm:text-2xl font-display font-black tracking-tight uppercase leading-none mb-1">
                  Biometric Sync Engine
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed mb-6">
                  Establish a real-time cardiorespiratory data handshake with your mobile health node to calibrate autonomic relaxation metrics.
                </p>

                {/* Provider Selector Card Deck */}
                <div className="mb-6 space-y-2.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                    Select Device Synchronizer Hub
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {(["Apple Health", "Fitbit", "Garmin"] as const).map((prov) => {
                      const isSelected = syncProvider === prov;
                      return (
                        <button
                          key={prov}
                          disabled={syncStep > 0}
                          onClick={() => setSyncProvider(prov)}
                          className={`p-3 rounded-2xl border text-center transition-all ${
                            syncStep > 0 ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
                          } ${
                            isSelected
                              ? "bg-emerald-500/10 border-emerald-500 text-emerald-800 dark:text-emerald-400 shadow-sm"
                              : "bg-white dark:bg-zinc-900/30 hover:bg-slate-50 dark:hover:bg-zinc-900/50 border-slate-200 dark:border-white/5 text-slate-600 dark:text-zinc-300"
                          }`}
                        >
                          <Smartphone size={16} className={`mx-auto mb-1 rounded ${isSelected ? "text-emerald-500 animate-pulse" : "text-slate-400"}`} />
                          <div className="text-[10px] font-black tracking-wide uppercase truncate">
                            {prov}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Sync Progress Indicator */}
                {syncStep > 0 && (
                  <div className="mb-6 space-y-3 p-5 rounded-2xl bg-white dark:bg-zinc-900/40 border border-slate-200/50 dark:border-white/5 shadow-inner">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
                        {syncStep === 1 && "Verifying Security Link"}
                        {syncStep === 2 && "Accessing Raw Pulse Data"}
                        {syncStep === 3 && "Analyzing HRV Spectral Baseline"}
                        {syncStep === 4 && "Calibrating Neural Synthesis"}
                        {syncStep === 5 && "Synchronicity Lock Established"}
                      </span>
                      <span className="font-mono text-emerald-500 font-bold">{syncProgress}%</span>
                    </div>

                    {/* Progress Bar Track */}
                    <div className="h-2 w-full bg-slate-100 dark:bg-zinc-950 rounded-full overflow-hidden border border-slate-200/20 dark:border-white/5">
                      <motion.div
                        initial={{ width: "0%" }}
                        animate={{ width: `${syncProgress}%` }}
                        transition={{ duration: 0.4 }}
                        className="h-full bg-emerald-500 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.5)]"
                      />
                    </div>

                    {/* Progressive Step Checkpoints */}
                    <div className="grid grid-cols-4 gap-1.5 pt-1.5">
                      {[1, 2, 3, 4].map((stepIdx) => {
                        const isDone = syncStep > stepIdx;
                        const isActive = syncStep === stepIdx;
                        return (
                          <div key={stepIdx} className="flex flex-col items-center gap-1 text-center">
                            <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-black ${
                              isDone 
                                ? "bg-emerald-500 text-white animate-bounce" 
                                : isActive 
                                ? "bg-emerald-500/20 text-emerald-500 border border-emerald-500/40 animate-pulse" 
                                : "bg-slate-100 dark:bg-zinc-900 text-slate-400 dark:text-zinc-600 border border-transparent"
                            }`}>
                              {isDone ? "✓" : stepIdx}
                            </div>
                            <span className={`text-[7px] font-black uppercase tracking-wider ${
                              isDone ? "text-emerald-500 font-bold" : isActive ? "text-slate-800 dark:text-zinc-200 font-bold" : "text-slate-400"
                            }`}>
                              {stepIdx === 1 ? "Link" : stepIdx === 2 ? "Tele" : stepIdx === 3 ? "Anal" : "Align"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Console System Logging */}
                {syncStep > 0 && (
                  <div className="mb-6">
                    <div className="p-4 rounded-xl bg-white dark:bg-zinc-950 border border-slate-200/50 dark:border-white/5 font-mono text-[10px] space-y-1.5 max-h-[140px] overflow-y-auto shadow-inner">
                      <div className="text-slate-400 dark:text-zinc-500 uppercase font-bold tracking-wider mb-2 border-b border-slate-100 dark:border-white/5 pb-1 flex justify-between items-center text-[8px]">
                        <span>Co-Processor System Log</span>
                        {syncStep < 5 && <RefreshCw size={8} className="animate-spin text-emerald-500" />}
                      </div>
                      {syncLog.map((logLine, index) => (
                        <motion.div
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.2 }}
                          key={index}
                          className="text-slate-600 dark:text-zinc-300 flex items-start gap-1.5 break-words"
                        >
                          <span className="text-emerald-500 font-bold">▶</span>
                          <span>{logLine}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Complete Dashboard Summary */}
                {syncStep === 5 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/25 space-y-3"
                  >
                    <div className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Baseline Alignment Parameters</div>
                    <div className="grid grid-cols-2 gap-3.5">
                      <div className="p-3 bg-white dark:bg-zinc-900/40 rounded-xl border border-emerald-500/10">
                        <div className="text-[8px] text-slate-400 dark:text-zinc-500 font-black uppercase tracking-widest">Resting Heart Rate</div>
                        <div className="text-lg font-mono font-black text-slate-800 dark:text-zinc-100 mt-1 flex items-baseline gap-1">
                          68 <span className="text-[9px] text-slate-400 uppercase font-sans">BPM</span>
                        </div>
                      </div>
                      <div className="p-3 bg-white dark:bg-zinc-900/40 rounded-xl border border-emerald-500/10">
                        <div className="text-[8px] text-slate-400 dark:text-zinc-500 font-black uppercase tracking-widest">Stabilized HRV</div>
                        <div className="text-lg font-mono font-black text-slate-800 dark:text-zinc-100 mt-1 flex items-baseline gap-1">
                          54 <span className="text-[9px] text-emerald-500 uppercase font-sans font-bold">+8.3%</span>
                        </div>
                      </div>
                      <div className="p-3 bg-white dark:bg-zinc-900/40 rounded-xl border border-emerald-500/10">
                        <div className="text-[8px] text-slate-400 dark:text-zinc-500 font-black uppercase tracking-widest">RSA Match Coherence</div>
                        <div className="text-lg font-mono font-black text-slate-800 dark:text-zinc-100 mt-1 flex items-baseline gap-1">
                          96% <span className="text-[9px] text-slate-400 uppercase font-sans">Index</span>
                        </div>
                      </div>
                      <div className="p-3 bg-white dark:bg-zinc-900/40 rounded-xl border border-emerald-500/10">
                        <div className="text-[8px] text-slate-400 dark:text-zinc-500 font-black uppercase tracking-widest">Security Token</div>
                        <div className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold mt-1.5 truncate">
                          AES_256_ACTIVE
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* CTA Action Buttons */}
                <div className="flex gap-3 mt-6">
                  {syncStep === 0 ? (
                    <>
                      <button
                        onClick={() => setIsSyncModalOpen(false)}
                        className="flex-1 py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-slate-200/55 dark:border-white/5 text-slate-700 dark:text-zinc-300 text-xs font-bold tracking-wide transition-all cursor-pointer text-center"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => startManualSync()}
                        disabled={!syncProvider}
                        className={`flex-[2_2_0%] py-3 px-4 rounded-2xl text-xs font-bold tracking-wide uppercase transition-all flex items-center justify-center gap-2 ${
                          syncProvider
                            ? "bg-slate-800 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:shadow-airra-md cursor-pointer"
                            : "bg-slate-100 dark:bg-zinc-900 text-slate-400 cursor-not-allowed border border-slate-200/40 dark:border-white/5"
                        }`}
                      >
                        <RefreshCw size={14} /> Synchronize Nodes
                      </button>
                    </>
                  ) : syncStep === 5 ? (
                    <button
                      onClick={() => {
                        setIsSyncModalOpen(false);
                        setSyncStep(0); // reset state back to idle for subsequent trigger
                      }}
                      className="w-full py-3 px-4 rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700 font-bold tracking-wide text-xs uppercase shadow-lg shadow-emerald-600/10 transition-all cursor-pointer"
                    >
                      Commit Baseline Alignment
                    </button>
                  ) : (
                    <button
                      disabled
                      className="w-full py-3 px-4 rounded-2xl bg-slate-100 dark:bg-zinc-900 text-slate-400 dark:text-zinc-600 border border-slate-200/20 dark:border-white/5 text-xs font-bold tracking-wide cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <RefreshCw className="animate-spin text-emerald-500" size={14} /> 
                      Engaging Biometric Channels...
                    </button>
                  )}
                </div>

              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
