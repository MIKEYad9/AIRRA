import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Wind, 
  Moon, 
  Zap, 
  Play, 
  Pause, 
  Volume2, 
  ArrowLeft, 
  Sparkles, 
  ChevronRight, 
  Clock, 
  Music,
  Cloud,
  Sun,
  Leaf,
  Droplets,
  Waves,
  Activity,
  X
} from "lucide-react";
import { Link } from "react-router-dom";
import BreathingTimer from "@/src/components/BreathingTimer";
import { synther } from "../lib/synthEngine";
import { supabase } from "../lib/supabase";

const EXPERIENCES = [
  {
    id: "meditation",
    title: "Deep Presence",
    type: "Digital Zen",
    duration: "12 min",
    icon: <Sun />,
    color: "bg-indigo-500",
    image: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&q=80&w=600",
    audioUrl: "https://assets.mixkit.co/music/preview/mixkit-serene-view-443.mp3",
    benefits: "Enhances attention span, reduces serum cortisol levels, and promotes neuroplasticity in the prefrontal cortex.",
    science: "Studies from Harvard Medical School indicate that consistent mindfulness meditation leads to increased gray-matter density in the hippocampus, known for its role in memory and learning.",
    researchLink: "https://news.harvard.edu/gazette/story/2011/01/eight-weeks-to-a-better-brain/"
  },
  {
    id: "breathing",
    title: "Vital Rhythm",
    type: "Neural Sync",
    duration: "5 min",
    icon: <Wind />,
    color: "bg-teal-500",
    image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=600",
    audioUrl: "https://assets.mixkit.co/music/preview/mixkit-meditation-soft-601.mp3",
    benefits: "Instant activation of the parasympathetic nervous system, leading to immediate heart rate variability (HRV) improvement.",
    science: "Controlled breathing, or 'Cyclic Sighing', has been shown in Stanford research to be more effective than standard meditation for improving mood and reducing physiological arousal in real-time.",
    researchLink: "https://hubermanlab.com/the-science-of-breathing-for-health-and-performance/"
  },
  {
    id: "sleep",
    title: "Dream Architecture",
    type: "Sleep Therapy",
    duration: "45 min",
    icon: <Moon />,
    color: "bg-purple-500",
    image: "https://images.unsplash.com/photo-1495195129352-aec325a55b65?auto=format&fit=crop&q=80&w=600",
    audioUrl: "https://assets.mixkit.co/music/preview/mixkit-dreaming-big-31.mp3",
    benefits: "Facilitates transition into N3 deep sleep (Slow Wave Sleep), essential for hormonal regulation and cellular repair.",
    science: "Pink noise and specific harmonic frequencies are utilized to synchronize brainwave patterns, which has been shown to prolong the duration of deep sleep stages and improve metabolic waste clearance in the brain via the glymphatic system.",
    researchLink: "https://www.nature.com/articles/s41598-019-45191-0"
  },
  {
    id: "focus",
    title: "Gamma Resonance",
    type: "Cognitive Flow",
    duration: "60 min",
    icon: <Zap />,
    color: "bg-amber-500",
    image: "https://images.unsplash.com/photo-1493612276216-ee3925520721?auto=format&fit=crop&q=80&w=600",
    audioUrl: "https://assets.mixkit.co/music/preview/mixkit-wellness-vibe-305.mp3",
    benefits: "Maximizes word retrieval speed, increases working memory capacity, and enables 'Hyper-focus' states.",
    science: "40Hz Gamma frequency stimulation has been observed to enhance synaptic connectivity and synchronous firing between neuronal clusters responsible for high-level information processing and perceptual binding.",
    researchLink: "https://www.mit.edu/news/2016/visual-stimulation-treatment-alzheimers-1207"
  }
];

const SOUND_TRACKS: Record<string, string> = {
  Rainfall: "https://assets.mixkit.co/music/preview/mixkit-forest-rain-with-birds-and-creek-1215.mp3",
  "Soft Wind": "https://assets.mixkit.co/music/preview/mixkit-wind-blowing-through-trees-1221.mp3",
  "Cave Reverb": "https://assets.mixkit.co/music/preview/mixkit-ethereal-tech-475.mp3",
  "Ocean Sync": "https://assets.mixkit.co/music/preview/mixkit-wellness-vibe-305.mp3"
};

export default function WellnessPage() {
  const [selectedExp, setSelectedExp] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeAudioId, setActiveAudioId] = useState<string | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const oscillatorUrl = "https://assets.mixkit.co/music/preview/mixkit-ethereal-tech-475.mp3";

  // sound tile active states
  const [activeSound, setActiveSound] = useState<string | null>(null);
  const [soundPlaying, setSoundPlaying] = useState(false);
  const soundRef = React.useRef<HTMLAudioElement | null>(null);

  // oscillator calibration controls
  const [isOscillatorConfigOpen, setIsOscillatorConfigOpen] = useState(false);
  const [carrierFreq, setCarrierFreq] = useState(136.1);
  const [targetFreq, setTargetFreq] = useState(8.5);
  const [hemisphericRatio, setHemisphericRatio] = useState(50);

  const handleSelectSound = async (label: string) => {
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
      await fetch("/api/session/sound", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": await getAuthHeader()
        },
        body: JSON.stringify({ type: label.toLowerCase().replace(" ", "_") })
      });
    } catch (e) {
      console.warn("POST /api/session/sound failed but continuing locally:", e);
    }

    if (activeSound === label) {
      if (soundPlaying) {
        if (soundRef.current) {
          soundRef.current.pause();
        }
        synther.stop();
        setSoundPlaying(false);
      } else {
        if (soundRef.current) {
          soundRef.current.play().then(() => {
            setSoundPlaying(true);
          }).catch(err => {
            console.warn("Retrying native sound failed. Using live synthesis fallback:", err);
            synther.start(label);
            setSoundPlaying(true);
          });
        } else {
          synther.start(label);
          setSoundPlaying(true);
        }
      }
    } else {
      if (soundRef.current) {
        soundRef.current.pause();
      }
      synther.stop();
      
      const newUrl = SOUND_TRACKS[label];
      if (newUrl) {
        const audio = new Audio(newUrl);
        audio.loop = true;
        soundRef.current = audio;
        
        audio.onerror = (e) => {
          console.warn(`[Wellness Soundscape] failed to load ${newUrl}. Initiating live synthesis fallback.`);
          synther.start(label);
          setSoundPlaying(true);
        };

        audio.play().then(() => {
          setSoundPlaying(true);
        }).catch(err => {
          console.warn("[Wellness Soundscape] Play blocked or offline. Activating live synthesis fallback:", err);
          synther.start(label);
          setSoundPlaying(true);
        });
        setActiveSound(label);
      }
    }
  };

  React.useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.pause();
      }
      synther.stop();
    };
  }, []);

  const togglePlay = (expId: string, audioUrl: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (activeAudioId === expId) {
      if (isPlaying) {
        if (audioRef.current) {
          audioRef.current.pause();
        }
        synther.stop();
        setIsPlaying(false);
      } else {
        if (audioRef.current) {
          audioRef.current.play().then(() => {
            setIsPlaying(true);
          }).catch(err => {
            console.warn("Autoplay blocked. Resuming via synthesized waves:", err);
            synther.start(expId);
            setIsPlaying(true);
          });
        } else {
          synther.start(expId);
          setIsPlaying(true);
        }
      }
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      synther.stop();
      
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.onerror = () => {
        console.warn(`[Wellness Experience] failed to load ${audioUrl}. Activating bio-harmonic synthesizer fallback.`);
        synther.start(expId);
        setIsPlaying(true);
      };

      audio.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.warn("[Wellness Experience] Play prevented. Activating bio-harmonic synthesizer fallback:", err);
        synther.start(expId);
        setIsPlaying(true);
      });
      
      setActiveAudioId(expId);
      
      audio.onended = () => {
        setIsPlaying(false);
        setActiveAudioId(null);
      };
    }
  };

  React.useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      synther.stop();
    };
  }, []);

  return (
    <div className="space-y-24 pb-40">
      {/* Cinematic Header */}
      <header className="space-y-12 pt-8">
        <Link 
          to="/dashboard" 
          className="inline-flex items-center gap-3 text-airra-muted hover:text-airra-text dark:hover:text-white transition-all group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em]">Synapse Hub</span>
        </Link>
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-16">
          <div className="space-y-8 max-w-4xl">
            <div className="inline-flex items-center gap-4 px-6 py-2 rounded-full airra-glass border border-airra-border/50 dark:border-white/5 text-airra-primary dark:text-airra-dark-glow text-[10px] font-black uppercase tracking-widest">
              <Sparkles size={18} />
              Sensory Optimization
            </div>
            <h1 className="text-airra-display font-display font-black tracking-tighter text-airra-text dark:text-white leading-[0.8] uppercase">
              Mindful <br />
              <span className="font-serif italic font-normal text-airra-primary dark:text-airra-dark-glow normal-case tracking-tight">Immersion</span>.
            </h1>
            <p className="text-airra-muted dark:text-airra-dark-muted font-medium text-2xl md:text-3xl max-w-2xl leading-relaxed tracking-tight">
              Calibrate your internal environment through curated <span className="italic font-serif font-normal text-airra-text dark:text-white">Neural Experiences</span>. High-fidelity wellness architectural for the modern mind.
            </p>
          </div>
        </div>
      </header>

      {/* Primary Experiences Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
         {EXPERIENCES.map((exp, idx) => (
           <motion.div
             key={exp.id}
             whileHover={{ y: -10 }}
             onClick={() => setSelectedExp(exp.id)}
             className="airra-card h-[500px] relative overflow-hidden group cursor-pointer border-none shadow-airra-xl"
           >
              {/* Background Image with Cinematic Overlay */}
              <img src={exp.image} alt={exp.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-airra-bg via-airra-bg/40 to-transparent dark:from-zinc-950 dark:via-zinc-950/40 opacity-90 group-hover:opacity-80 transition-opacity" />
              
              <div className="absolute inset-0 p-12 flex flex-col justify-between">
                 <div className="flex justify-between items-start">
                    <div className="w-16 h-16 rounded-[1.5rem] airra-glass flex items-center justify-center text-white backdrop-blur-3xl border border-white/20">
                       {React.cloneElement(exp.icon as React.ReactElement, { size: 28 })}
                    </div>
                    <div className="flex gap-4">
                       <span className="px-5 py-2 rounded-full airra-glass text-[9px] font-black uppercase tracking-widest text-white border border-white/10">
                         {exp.type}
                       </span>
                    </div>
                 </div>

                 <div className="space-y-6">
                    <div className="space-y-2">
                       <h3 className="text-5xl font-display font-black text-white uppercase tracking-tighter leading-none group-hover:tracking-normal transition-all duration-700">{exp.title}</h3>
                       <p className="text-white/60 font-medium text-lg italic">Calibrate your neural rhythm through sonic architecture.</p>
                    </div>
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3 text-white/50">
                          <Clock size={16} />
                          <span className="text-xs font-black uppercase tracking-widest">{exp.duration} Session</span>
                       </div>
                       <button 
                         onClick={(e) => togglePlay(exp.id, exp.audioUrl, e)}
                         className={`w-16 h-16 rounded-full bg-airra-primary/90 text-white flex items-center justify-center shadow-2xl transition-all duration-700 ${activeAudioId === exp.id ? 'scale-100' : 'scale-0 group-hover:scale-100 hover:scale-110 active:scale-95'}`}
                       >
                          {activeAudioId === exp.id && isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
                       </button>
                    </div>
                 </div>
              </div>
           </motion.div>
         ))}
      </div>

      {/* 4-7-8 Breathwork Calibrator */}
      <section className="space-y-8">
        <div className="space-y-4">
          <h2 className="text-4xl font-display font-black uppercase text-slate-800 dark:text-white tracking-tight">Tactile Respiration Calibrator</h2>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium text-lg max-w-2xl">
            Structure your heart rate variability (HRV) and activate parasympathetic response through the therapeutic 4-7-8 pacing technique.
          </p>
        </div>
        <BreathingTimer />
      </section>

      {/* Focus Audio Interface */}
      <div className="airra-card p-12 md:p-20 bg-airra-text dark:bg-white text-airra-bg dark:text-zinc-950 flex flex-col lg:flex-row items-center gap-16 overflow-hidden relative">
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-airra-primary blur-[150px] opacity-20 pointer-events-none" />
         
         <div className="relative z-10 w-full lg:w-1/3">
            <div className="w-full aspect-square rounded-[3rem] bg-airra-bg dark:bg-zinc-800 flex items-center justify-center relative overflow-hidden group">
               <Music size={120} className="text-airra-muted/20 group-hover:scale-110 transition-transform duration-[3000ms]" />
               <motion.div 
                 animate={{ rotate: 360 }}
                 transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                 className="absolute inset-8 border-2 border-dashed border-airra-primary/20 rounded-full"
               />
               <div className="absolute inset-0 flex items-center justify-center">
                  <button 
                    onClick={(e) => togglePlay('oscillator', oscillatorUrl, e)}
                    className="w-24 h-24 rounded-full bg-airra-primary text-white flex items-center justify-center shadow-airra-xl hover:scale-110 transition-all active:scale-95"
                  >
                    {activeAudioId === 'oscillator' && isPlaying ? <Pause size={40} /> : <Play size={40} className="ml-2" />}
                  </button>
               </div>
            </div>
         </div>

         <div className="relative z-10 flex-grow space-y-12">
            <div className="space-y-4">
               <h3 
                 onClick={() => setIsOscillatorConfigOpen(true)}
                 className="text-3xl sm:text-4xl md:text-5xl font-display font-black uppercase tracking-tighter leading-none cursor-pointer hover:text-emerald-500 dark:hover:text-[#3DB88A] transition-colors flex items-center gap-3 select-none flex-wrap whitespace-normal overflow-hidden"
               >
                 Neural Wave Oscillator.
                 <span className="text-[9px] font-black tracking-widest text-[#3DB88A] bg-[#3DB88A]/10 border border-[#3DB88A]/20 px-2.5 py-1 rounded-full uppercase animate-pulse">Configure</span>
               </h3>
               <p className="text-lg md:text-xl font-medium opacity-60 leading-relaxed max-w-xl italic">Generate real-time binaural soundscapes optimized for your current diagnostic metrics. Click title to calibrate oscillators.</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
               <AudioAction icon={<Cloud />} label="Rainfall" isActive={activeSound === "Rainfall"} isPlaying={soundPlaying} onSelect={() => handleSelectSound("Rainfall")} />
               <AudioAction icon={<Leaf />} label="Soft Wind" isActive={activeSound === "Soft Wind"} isPlaying={soundPlaying} onSelect={() => handleSelectSound("Soft Wind")} />
               <AudioAction icon={<Droplets />} label="Cave Reverb" isActive={activeSound === "Cave Reverb"} isPlaying={soundPlaying} onSelect={() => handleSelectSound("Cave Reverb")} />
               <AudioAction icon={<Waves />} label="Ocean Sync" isActive={activeSound === "Ocean Sync"} isPlaying={soundPlaying} onSelect={() => handleSelectSound("Ocean Sync")} />
            </div>

            <div className="space-y-6 pt-10 border-t border-airra-bg/10 dark:border-zinc-200">
               <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Frequency Mix</span>
                  <div className="flex items-center gap-2">
                     <Volume2 size={16} className="opacity-40" />
                     <div className="w-40 h-1 bg-airra-bg/10 dark:bg-zinc-100 rounded-full overflow-hidden relative">
                        <motion.div 
                          animate={{ width: isPlaying ? '70%' : '30%' }}
                          className="absolute inset-y-0 left-0 bg-airra-primary rounded-full transition-all duration-1000"
                        />
                     </div>
                  </div>
               </div>
               <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full bg-airra-primary ${activeAudioId === 'oscillator' && isPlaying ? 'animate-pulse' : ''}`} />
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Synchronizing: Alpha-Gamma 40Hz Harmonic</span>
               </div>
            </div>
         </div>
      </div>

      {/* Fullscreen Experience Modal (Mock) */}
      <AnimatePresence>
        {selectedExp && (() => {
          const exp = EXPERIENCES.find(e => e.id === selectedExp);
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-zinc-950 overflow-y-auto"
            >
              <div className="min-h-screen p-8 md:p-20 flex flex-col items-center">
                 <button 
                   onClick={() => setSelectedExp(null)}
                   className="absolute top-8 left-8 md:top-12 md:left-12 h-16 px-10 rounded-[1.5rem] bg-white/5 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-4 z-50"
                 >
                   <ArrowLeft size={16} /> Exit Immersion
                 </button>

                 <div className="max-w-6xl w-full space-y-32 py-20 relative">
                    {/* Hero Section */}
                    <div className="space-y-12 text-center">
                       <motion.div 
                         initial={{ scale: 0.9, opacity: 0 }}
                         animate={{ scale: 1, opacity: 1 }}
                         transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                         className="space-y-6"
                       >
                         <div className="inline-flex items-center gap-4 px-6 py-2 rounded-full border border-white/10 text-airra-primary text-[10px] font-black uppercase tracking-widest">
                           {exp?.type}
                         </div>
                         <h2 className="text-7xl md:text-[10rem] font-display font-black text-white uppercase tracking-tighter leading-none">{exp?.title}</h2>
                         
                         <div className="flex justify-center pt-8">
                            <button 
                              onClick={(e) => exp && togglePlay(exp.id, exp.audioUrl, e)}
                              className="w-32 h-32 rounded-full bg-airra-primary text-white flex items-center justify-center shadow-[0_0_50px_rgba(45,106,79,0.4)] hover:scale-110 transition-all active:scale-95 group"
                            >
                               {activeAudioId === exp?.id && isPlaying ? <Pause size={48} /> : <Play size={48} className="ml-2" />}
                            </button>
                         </div>
                       </motion.div>

                       <div className="flex justify-center gap-12">
                          <div className="flex flex-col items-center gap-2">
                             <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Intensity</span>
                             <span className="text-2xl font-bold text-white">Soft</span>
                          </div>
                          <div className="flex flex-col items-center gap-2 border-l border-white/10 pl-12">
                             <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Neural State</span>
                             <span className="text-2xl font-bold text-white">Alpha Sync</span>
                          </div>
                          <div className="flex flex-col items-center gap-2 border-l border-white/10 pl-12">
                             <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Duration</span>
                             <span className="text-2xl font-bold text-white">{exp?.duration}</span>
                          </div>
                       </div>
                    </div>

                    {/* Visual Pulse / Breathing Timer */}
                    {exp?.id === 'breathing' ? (
                      <div className="max-w-2xl mx-auto w-full">
                        <BreathingTimer isDark={true} />
                      </div>
                    ) : (
                      <div className="flex justify-center items-center gap-16 py-12 relative h-40">
                         <div className="absolute inset-0 bg-airra-primary/5 blur-[100px] rounded-full" />
                         {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                           <motion.div 
                              key={i}
                              animate={activeAudioId === exp?.id && isPlaying ? { 
                                scale: [1, 1.8, 1],
                                opacity: [0.2, 0.8, 0.2] 
                              } : { scale: 1, opacity: 0.2 }}
                              transition={{ 
                                repeat: Infinity, 
                                duration: 3, 
                                delay: i * 0.4,
                                ease: "easeInOut"
                              }}
                              className="w-5 h-5 rounded-full bg-airra-primary shadow-[0_0_20px_rgba(45,106,79,0.5)]"
                           />
                         ))}
                      </div>
                    )}

                    {/* Detailed Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-20">
                       <motion.div 
                         initial={{ opacity: 0, x: -30 }}
                         animate={{ opacity: 1, x: 0 }}
                         transition={{ delay: 0.5 }}
                         className="space-y-8 p-12 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-xl"
                       >
                          <div className="flex items-center gap-4 text-airra-primary">
                             <Sparkles size={24} />
                             <h4 className="text-xs font-black uppercase tracking-[0.3em]">Therapeutic Benefits</h4>
                          </div>
                          <p className="text-2xl md:text-3xl font-medium text-white/90 leading-relaxed tracking-tight">
                            {exp?.benefits}
                          </p>
                       </motion.div>

                       <motion.div 
                         initial={{ opacity: 0, x: 30 }}
                         animate={{ opacity: 1, x: 0 }}
                         transition={{ delay: 0.7 }}
                         className="space-y-8 p-12 rounded-[2.5rem] bg-airra-primary/10 border border-airra-primary/20 backdrop-blur-xl"
                       >
                          <div className="flex items-center gap-4 text-airra-primary">
                             <Activity size={24} />
                             <h4 className="text-xs font-black uppercase tracking-[0.3em]">Clinical Science</h4>
                          </div>
                          <div className="space-y-6">
                            <p className="text-lg md:text-xl font-medium text-white/70 leading-relaxed italic font-serif">
                              "{exp?.science}"
                            </p>
                            {exp?.researchLink && (
                              <a 
                                href={exp.researchLink} 
                                target="_blank" 
                                rel="noreferrer"
                                className="inline-flex items-center gap-3 text-airra-primary hover:text-white transition-colors group pt-4"
                              >
                                <span className="text-[10px] font-black uppercase tracking-widest">Read Clinical Research</span>
                                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                              </a>
                            )}
                          </div>
                       </motion.div>
                    </div>

                    <div className="text-center pt-20">
                       <p className="text-white/30 font-serif italic text-2xl animate-pulse">Initialize breathing protocols. Focus on the resonance.</p>
                    </div>
                 </div>
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      <AnimatePresence>
        {isOscillatorConfigOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOscillatorConfigOpen(false)}
              className="fixed inset-0 bg-zinc-950/80 backdrop-blur-md z-[100] cursor-pointer"
            />
            <motion.div 
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-zinc-950 border-l border-white/5 z-[110] p-10 flex flex-col justify-between text-white shadow-2xl overflow-y-auto"
            >
              <div className="space-y-8">
                 <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black tracking-[0.3em] text-[#3DB88A] bg-[#3DB88A]/10 border border-[#3DB88A]/20 px-2.5 py-1 rounded-full">CALIBRATOR CONSOLE</span>
                    <button 
                      onClick={() => setIsOscillatorConfigOpen(false)}
                      className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                    >
                      <X size={18} />
                    </button>
                 </div>
                 <div className="space-y-2">
                    <h2 className="text-4xl font-display font-black uppercase tracking-tighter text-white leading-none">OSCILLATOR <br /> CONFIG.</h2>
                    <p className="text-xs text-zinc-400 leading-relaxed italic">Tune the carrier waves and binaural beats offset directly against your active biometric link.</p>
                 </div>

                 <div className="space-y-10 pt-8 border-t border-white/5">
                    {/* Carrier wave */}
                    <div className="space-y-4">
                       <div className="flex justify-between items-center">
                          <label className="text-[10px] font-black uppercase tracking-widest text-[#3DB88A]">Carrier Frequency</label>
                          <span className="text-xs font-mono font-bold">{carrierFreq} Hz (Solfeggio)</span>
                       </div>
                       <input 
                         type="range"
                         min="100"
                         max="528"
                         step="0.1"
                         value={carrierFreq}
                         onChange={(e) => setCarrierFreq(parseFloat(e.target.value))}
                         className="w-full accent-[#3DB88A] bg-zinc-800"
                       />
                       <div className="flex justify-between text-[8px] font-black tracking-widest text-zinc-500 uppercase">
                          <span>174 Hz (Ground)</span>
                          <span>285 Hz (Cell)</span>
                          <span>528 Hz (Repair)</span>
                       </div>
                    </div>

                    {/* Binaural beat target */}
                    <div className="space-y-4">
                       <div className="flex justify-between items-center">
                          <label className="text-[10px] font-black uppercase tracking-widest text-[#3DB88A]">Binaural Offset</label>
                          <span className="text-xs font-mono font-bold">{targetFreq} Hz ({targetFreq < 4 ? 'Delta' : targetFreq < 8 ? 'Theta' : targetFreq < 12 ? 'Alpha' : 'Beta'})</span>
                       </div>
                       <input 
                         type="range"
                         min="1"
                         max="20"
                         step="0.1"
                         value={targetFreq}
                         onChange={(e) => setTargetFreq(parseFloat(e.target.value))}
                         className="w-full accent-[#3DB88A] bg-zinc-800"
                       />
                       <div className="flex justify-between text-[8px] font-black tracking-widest text-zinc-500 uppercase">
                          <span>Delta (1-4Hz)</span>
                          <span>Theta (4-8Hz)</span>
                          <span>Alpha (8-12Hz)</span>
                          <span>Beta (12-20Hz)</span>
                       </div>
                    </div>

                    {/* Hemispheric ratio */}
                    <div className="space-y-4">
                       <div className="flex justify-between items-center">
                          <label className="text-[10px] font-black uppercase tracking-widest text-[#3DB88A]">Hemispheric Synchronization</label>
                          <span className="text-xs font-mono font-bold">{hemisphericRatio}:{100 - hemisphericRatio} L/R</span>
                       </div>
                       <input 
                         type="range"
                         min="0"
                         max="100"
                         value={hemisphericRatio}
                         onChange={(e) => setHemisphericRatio(parseInt(e.target.value))}
                         className="w-full accent-[#3DB88A] bg-zinc-800 animate-none cursor-pointer"
                       />
                    </div>
                 </div>
              </div>

              <div className="pt-10 border-t border-white/5 flex gap-4">
                 <button 
                   onClick={() => setIsOscillatorConfigOpen(false)}
                   className="flex-1 h-14 bg-[#3DB88A] text-zinc-950 font-black uppercase tracking-widest text-[9px] rounded-2xl shadow-[0_4px_20px_rgba(61,184,138,0.25)] hover:bg-[#3DB88A]/95 hover:-translate-y-px transition-all cursor-pointer"
                 >
                   Lock Alignment
                 </button>
                 <button 
                   onClick={() => {
                     setCarrierFreq(136.1);
                     setTargetFreq(8.5);
                     setHemisphericRatio(50);
                   }}
                   className="h-14 px-6 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest border border-white/10 cursor-pointer"
                 >
                   Reset
                 </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function AudioAction({ icon, label, isActive, isPlaying, onSelect }: { icon: React.ReactNode, label: string, isActive: boolean, isPlaying: boolean, onSelect: () => void }) {
  return (
    <button 
      onClick={onSelect}
      className={`flex flex-col items-center gap-4 p-6 rounded-3xl transition-all duration-500 relative overflow-hidden active:scale-[0.96] border-2 cursor-pointer w-full group ${
        isActive 
          ? 'bg-emerald-500/15 dark:bg-emerald-400/5 text-[#3DB88A] border-[#3DB88A] shadow-[0_0_20px_rgba(61,184,138,0.2)]' 
          : 'bg-airra-bg dark:bg-zinc-800 border-transparent text-airra-muted hover:bg-white dark:hover:bg-zinc-800/10'
      }`}
    >
       <div className={`w-12 h-12 flex items-center justify-center transition-all ${
         isActive ? 'text-[#3DB88A] scale-110 drop-shadow-[0_0_8px_rgba(61,184,138,0.6)] animate-pulse' : 'text-zinc-400 group-hover:text-white'
       }`}>
          {React.cloneElement(icon as React.ReactElement, { size: 28 })}
       </div>
       <span className={`text-[9px] font-black uppercase tracking-widest leading-none mt-1 ${
         isActive ? 'text-[#3DB88A]' : 'text-airra-muted group-hover:text-airra-text'
       }`}>{label}</span>

       {/* Waveform indicator */}
       {isActive && isPlaying && (
         <div className="absolute bottom-2.5 left-0 right-0 flex justify-center items-end gap-[2px] h-3">
           {[1, 2, 3, 4, 5].map((i) => (
             <span 
               key={i} 
               className="w-[1.5px] bg-[#3DB88A] rounded-full animate-pulse" 
               style={{ 
                 height: `${Math.sin(i + 1) * 6 + 7}px`
               }} 
             />
           ))}
         </div>
       )}
    </button>
  );
}
