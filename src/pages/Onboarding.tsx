import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { useUserStore } from "../services/useUserStore";
import { 
  Sparkles, 
  ArrowRight, 
  Brain, 
  Zap, 
  Wand2, 
  ShieldCheck, 
  Moon, 
  Wind, 
  Smile, 
  Activity,
  Fingerprint,
  Users
} from "lucide-react";

export default function Onboarding() {
  const { user } = useAuth();
  const { profile, setProfile } = useUserStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleFinish = async (goal?: string) => {
    if (!user || loading) return;
    setLoading(true);

    if (supabase) {
      try {
        const updatedProfile = { 
          ...profile,
          id: user.id,
          onboarding_completed: true, 
          mood_goal: goal || "Holistic Optimization",
          updated_at: new Date().toISOString()
        };
        
        setProfile(updatedProfile as any);

        await supabase
          .from('profiles')
          .update({ 
            onboarding_completed: true, 
            mood_goal: goal || "Holistic Optimization",
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);
      } catch (err) {
        console.error("Onboarding update failed:", err);
      }
    }
    
    // Step 4: Engine Optimization (Calming Delay)
    setCurrentStep(4);
    setTimeout(() => {
       navigate("/dashboard");
    }, 4000);
  };

  const firstName = user?.email?.split('@')[0] || 'Seeker';

  return (
    <div className="min-h-screen airra-bg dark:bg-airra-dark-bg flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Cinematic Ambient Glows */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-airra-primary/5 blur-[150px] pointer-events-none" />
      <div className="absolute -left-40 -bottom-40 w-[600px] h-[600px] bg-emerald-500/5 blur-[120px] pointer-events-none" />
      
      <AnimatePresence mode="wait">
        {currentStep === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05, y: -20 }}
            className="relative z-10 w-full max-w-4xl text-center space-y-16"
          >
             <div className="space-y-10">
                <div className="flex justify-center">
                   <div className="w-24 h-24 rounded-[2.5rem] bg-airra-text dark:bg-white flex items-center justify-center shadow-airra-xl animate-float">
                      <Fingerprint className="w-10 h-10 text-airra-bg dark:text-zinc-950" />
                   </div>
                </div>
                <div className="space-y-6">
                   <h1 className="text-airra-display font-display font-black tracking-tighter uppercase leading-[0.85] text-airra-text dark:text-white">
                      Welcome, <br />
                      <span className="font-serif italic font-normal text-airra-primary dark:text-airra-dark-glow normal-case tracking-tight lowercase">{firstName}</span>.
                   </h1>
                   <p className="text-airra-muted dark:text-airra-dark-muted font-medium text-2xl md:text-3xl max-w-2xl mx-auto leading-relaxed tracking-tight">
                      Take a deep breath. You are entering a <span className="italic font-serif font-normal text-airra-text dark:text-white">Sovereign Safe Space</span>.
                   </p>
                </div>
             </div>
             
             <div className="flex justify-center pt-8">
                <button 
                  onClick={() => setCurrentStep(2)}
                  className="h-24 px-16 rounded-[2.5rem] bg-airra-text dark:bg-white text-airra-bg dark:text-zinc-950 text-xs font-black uppercase tracking-[0.4em] shadow-airra-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-8 group"
                >
                  Initialize Neural Link
                  <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />
                </button>
             </div>
             <div className="flex items-center justify-center gap-3">
                <ShieldCheck size={16} className="text-emerald-500" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-airra-muted">Biometric Privacy Lock Active</span>
             </div>
          </motion.div>
        )}

        {currentStep === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative z-10 w-full max-w-5xl text-center space-y-20"
          >
             <div className="space-y-6">
                <h2 className="text-5xl font-display font-black uppercase tracking-tighter text-airra-text dark:text-white">Identify Your Objective</h2>
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-airra-muted">Select your primary neural target</p>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <ObjectiveCard 
                  icon={<Wind />} 
                  title="Reduce Anxiety" 
                  desc="Calibrate your neural rhythm for deeper calm."
                  onClick={() => handleFinish("Reduce Anxiety")}
                />
                <ObjectiveCard 
                  icon={<Moon />} 
                  title="Improve Sleep" 
                  desc="Architect your nocturnal restoration cycles."
                  onClick={() => handleFinish("Improve Sleep")}
                />
                <ObjectiveCard 
                  icon={<Users />} 
                  title="Talk to Someone" 
                  desc="Direct synchronization with elite specialists."
                  onClick={() => handleFinish("Therapy")}
                />
             </div>
          </motion.div>
        )}

        {currentStep === 4 && (
          <motion.div
            key="step4"
            className="relative z-10 w-full max-w-3xl text-center space-y-16 overflow-hidden break-words px-4"
          >
             <div className="flex justify-center">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                  className="w-40 h-40 rounded-[3rem] border-2 border-dashed border-airra-primary/30 flex items-center justify-center"
                >
                   <div className="w-24 h-24 bg-airra-primary/10 rounded-full flex items-center justify-center">
                      <div className="w-12 h-12 bg-airra-primary rounded-full animate-breathe" />
                   </div>
                </motion.div>
             </div>
             <div className="space-y-6">
                <h2 className="text-[clamp(2rem,8vw,3.5rem)] font-display font-black text-airra-text dark:text-white uppercase tracking-tighter animate-pulse leading-[0.95] sm:leading-[0.85]">Personalizing <br /> Your Safe <br /> Space...</h2>
                <p className="text-airra-muted dark:text-airra-dark-muted font-medium text-xl italic max-w-md mx-auto">
                   Synchronizing diagnostic models with your chosen neural objectives.
                </p>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Aesthetic Grain Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
    </div>
  );
}

function ObjectiveCard({ icon, title, desc, onClick }: { icon: React.ReactNode, title: string, desc: string, onClick: () => void }) {
  return (
    <motion.button
      whileHover={{ y: -12, scale: 1.02 }}
      onClick={onClick}
      className="airra-card p-12 text-center space-y-10 group hover:bg-airra-text dark:hover:bg-white hover:text-airra-bg dark:hover:text-zinc-950 transition-all duration-700 h-full border-white/10 dark:border-white/5"
    >
       <div className="w-20 h-20 rounded-[1.5rem] bg-airra-bg dark:bg-zinc-800 flex items-center justify-center mx-auto text-airra-primary group-hover:bg-white/10 group-hover:text-white dark:group-hover:text-zinc-950 group-hover:scale-110 transition-all duration-700 shadow-inner">
          {React.cloneElement(icon as React.ReactElement, { size: 36, strokeWidth: 1.5 })}
       </div>
        <div className="space-y-4">
          <h3 className="text-2xl font-display font-black uppercase tracking-tighter group-hover:text-inherit transition-colors">{title}</h3>
          <p className="text-base font-medium leading-relaxed italic text-airra-text dark:text-zinc-300 group-hover:text-airra-bg dark:group-hover:text-zinc-950 transition-colors">{desc}</p>
       </div>
       <div className="pt-6 opacity-0 group-hover:opacity-100 transition-opacity">
          <Activity size={24} className="mx-auto animate-pulse" />
       </div>
    </motion.button>
  );
}
