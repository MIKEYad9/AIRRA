import React, { useEffect, useRef } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "motion/react";
import { Link } from "react-router-dom";
import { 
  Heart, 
  Brain, 
  ShieldCheck, 
  ArrowRight,
  ChevronRight,
  Zap,
  Sparkles,
  Activity,
  Compass,
  Star,
  Users,
  Play,
  Calendar,
  Cloud,
  Wind,
  Moon,
  Leaf,
  ArrowUpRight,
  BookOpen,
  ExternalLink
} from "lucide-react";

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isEfficacyModalOpen, setIsEfficacyModalOpen] = React.useState(false);
  const [isBrowseExperiencesOpen, setIsBrowseExperiencesOpen] = React.useState(false);

  // Community Experience Reviews State (Preloaded values + localStorage persistence)
  const [reviews, setReviews] = React.useState<{
    id: string;
    name: string;
    role: string;
    rating: number;
    text: string;
    metric: string;
    category: string;
    date: string;
  }[]>(() => {
    const saved = localStorage.getItem("airra_user_reviews");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback default
      }
    }
    return [
      {
        id: "review-1",
        name: "Sarah Jenkins",
        role: "People & Culture Lead",
        rating: 5,
        text: "AI-guided cognitive reframing completely restructured how I handle sudden work-related burnout. In the middle of an overwhelming anxiety peak, the instant de-escalation protocol helped me stabilize my respiration. Knowing there is absolute data sovereignty here makes absolute compliance second-nature.",
        metric: "92% Immediate Relief Scale",
        category: "Burnout De-escalation",
        date: "June 2025"
      },
      {
        id: "review-2",
        name: "David K.",
        role: "Biochemistry Candidate",
        rating: 5,
        text: "I log daily reflection logs in the secure zero-knowledge ledger. Interacting with the focused clinical dialogue at midnight has completely halted my academic overthinking waves. My sleep patterns feel restored to a deep, natural rhythm.",
        metric: "3.5x Better Sleep Cycles",
        category: "Academic Stress",
        date: "August 2025"
      },
      {
        id: "review-3",
        name: "Dr. Amara Thorne",
        role: "Associate Professor of Clinical Psychology",
        rating: 5,
        text: "My psychiatric research identifies secure conversational AI networks as major lifelines in scaling preventive wellness. Conversational therapeutic routines provide de-escalation exercises during after-hours crises when therapist queues are blocked.",
        metric: "Proven Professional Complement",
        category: "Clinical Perspective",
        date: "January 2026"
      },
      {
        id: "review-4",
        name: "Elena Rostova",
        role: "Independent Creative Director",
        rating: 5,
        text: "The beautifully soothing sage interface immediately settles my eyes, but the smart conversational companion is the real safe harbor. It has helped me unpack daily creative blocks and mild depressive episodes with deep dignity and kindness.",
        metric: "84% Daily Resiliency Uptick",
        category: "Mindfulness & Well-being",
        date: "March 2026"
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem("airra_user_reviews", JSON.stringify(reviews));
  }, [reviews]);

  // Experience Submission State Variables
  const [formName, setFormName] = React.useState("");
  const [formRole, setFormRole] = React.useState("");
  const [formCategory, setFormCategory] = React.useState("Burnout De-escalation");
  const [formMetric, setFormMetric] = React.useState("");
  const [formText, setFormText] = React.useState("");
  const [formRating, setFormRating] = React.useState(5);
  const [formAnonymize, setFormAnonymize] = React.useState(false);
  const [submitSuccessMsg, setSubmitSuccessMsg] = React.useState("");
  const [selectedFilter, setSelectedFilter] = React.useState("All");

  const handleAddNewReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formText.trim()) return;

    const newReview = {
      id: "review-" + Date.now(),
      name: formAnonymize ? "Anonymous Member" : (formName.trim() || "Anonymous Member"),
      role: formAnonymize ? "Sovereign Soul" : (formRole.trim() || "Verified Member"),
      rating: formRating,
      text: formText.trim(),
      metric: formMetric.trim() || "Resilience Enhanced",
      category: formCategory,
      date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    };

    setReviews([newReview, ...reviews]);

    // Reset fields
    setFormName("");
    setFormRole("");
    setFormMetric("");
    setFormText("");
    setFormRating(5);
    setFormAnonymize(false);

    // Show success message
    setSubmitSuccessMsg("Beautifully done. You took 5 minutes just for yourself today. Your mind thanks you.");
    setTimeout(() => {
      setSubmitSuccessMsg("");
    }, 6000);
  };

  // Newsletter Subscription State
  const [newsletterEmail, setNewsletterEmail] = React.useState("");
  const [subscriptionStatus, setSubscriptionStatus] = React.useState<"idle" | "loading" | "success" | "error">("idle");
  const [subscriptionMessage, setSubscriptionMessage] = React.useState("");

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) {
      setSubscriptionStatus("error");
      setSubscriptionMessage("Please enter a valid email address.");
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newsletterEmail.trim())) {
      setSubscriptionStatus("error");
      setSubscriptionMessage("Please enter a valid email address.");
      return;
    }

    setSubscriptionStatus("loading");
    setSubscriptionMessage("");

    setTimeout(() => {
      const existing = localStorage.getItem("airra_subscribers");
      let list = [];
      if (existing) {
        try { list = JSON.parse(existing); } catch (err) {}
      }
      if (!list.includes(newsletterEmail.trim().toLowerCase())) {
        list.push(newsletterEmail.trim().toLowerCase());
        localStorage.setItem("airra_subscribers", JSON.stringify(list));
      }
      
      setSubscriptionStatus("success");
      setSubscriptionMessage("Sanctuary subscription registered. Welcome.");
      setNewsletterEmail("");
      
      // Clear after 4 seconds
      setTimeout(() => {
        setSubscriptionStatus("idle");
        setSubscriptionMessage("");
      }, 4000);
    }, 800);
  };

  // Inactivity Newsletter States
  const [isInactivityModalOpen, setIsInactivityModalOpen] = React.useState(false);
  const [modalEmail, setModalEmail] = React.useState("");
  const [modalStatus, setModalStatus] = React.useState<"idle" | "loading" | "success" | "error">("idle");
  const [modalMessage, setModalMessage] = React.useState("");

  useEffect(() => {
    const shown = sessionStorage.getItem("airra_inactivity_modal_seen");
    if (shown === "true") return;

    let inactivityTimer: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        if (sessionStorage.getItem("airra_inactivity_modal_seen") !== "true") {
          setIsInactivityModalOpen(true);
        }
      }, 60000); // 60 seconds of user inactivity
    };

    const activityEvents = ["mousemove", "keydown", "mousedown", "scroll", "touchstart", "click"];

    resetTimer();

    activityEvents.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    return () => {
      clearTimeout(inactivityTimer);
      activityEvents.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, []);

  const handleModalNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalEmail.trim()) {
      setModalStatus("error");
      setModalMessage("Please enter a valid email address.");
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(modalEmail.trim())) {
      setModalStatus("error");
      setModalMessage("Please enter a valid email address.");
      return;
    }

    setModalStatus("loading");
    setModalMessage("");

    setTimeout(() => {
      const existing = localStorage.getItem("airra_subscribers");
      let list = [];
      if (existing) {
        try { list = JSON.parse(existing); } catch (err) {}
      }
      if (!list.includes(modalEmail.trim().toLowerCase())) {
        list.push(modalEmail.trim().toLowerCase());
        localStorage.setItem("airra_subscribers", JSON.stringify(list));
      }
      
      setModalStatus("success");
      setModalMessage("Sanctuary subscription registered. Welcome.");
      setModalEmail("");
      sessionStorage.setItem("airra_inactivity_modal_seen", "true");
      
      // Auto close after 2.5 seconds
      setTimeout(() => {
        setIsInactivityModalOpen(false);
      }, 2500);
    }, 800);
  };

  const { scrollYProgress } = useScroll();

  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.9]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);

  return (
    <div ref={containerRef} className="relative min-h-screen bg-airra-bg dark:bg-airra-dark-bg selection:bg-airra-primary/20 overflow-x-hidden">
      
      {/* Cinematic Background */}
      <motion.div 
        style={{ y: bgY }}
        className="fixed inset-0 z-0 pointer-events-none"
      >
        <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] bg-airra-primary/10 dark:bg-airra-dark-glow/10 blur-[160px] rounded-full animate-breathe" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[80%] h-[80%] bg-airra-accent/10 dark:bg-airra-dark-primary/10 blur-[160px] rounded-full animate-breathe" style={{ animationDelay: '2s' }} />
        
        {/* Modern Grain / Texture Interface Overlay */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      </motion.div>

      <Navbar />

      {/* Hero Section: The Cinematic Experience */}
      <section className="relative z-10 flex flex-col items-center justify-center min-h-[110vh] px-4 sm:px-8 text-center pt-28 sm:pt-40 pb-20 overflow-hidden">
        <motion.div 
          style={{ scale: heroScale, opacity: heroOpacity }}
          className="flex flex-col items-center w-full max-w-7xl mx-auto"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-3 px-6 sm:px-8 py-2.5 sm:py-3 mb-8 sm:mb-16 rounded-full airra-glass text-[9px] sm:text-[10px] font-black uppercase tracking-[0.25em] sm:tracking-[0.3em] text-airra-muted shrink-0"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-airra-primary animate-pulse" />
            Neural Harmony Engine v5.0
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            className="w-full max-w-[1500px] font-display font-black text-[clamp(2.2rem,8.5vw,7.5rem)] leading-[0.95] xs:leading-[0.9] md:leading-[0.85] text-airra-text dark:text-white mb-8 sm:mb-16 tracking-tighter uppercase break-words [word-break:break-word]"
          >
            Handcrafted <br />
            <span className="font-serif italic font-normal text-airra-primary dark:text-airra-dark-glow normal-case tracking-tight px-1 sm:px-6 block xs:inline-block xs:translate-y-2">Serenity</span>.
          </motion.h1>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 2 }}
            className="mb-8 sm:mb-16 italic font-serif text-airra-primary/60 dark:text-airra-dark-glow/40 text-lg sm:text-2xl"
          >
            "Within calmness lies the power to recreate yourself."
          </motion.div>

          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
            className="max-w-2xl text-base sm:text-xl md:text-2xl text-airra-muted dark:text-airra-dark-muted mb-10 sm:mb-20 font-medium leading-relaxed tracking-tight px-4 sm:px-0"
          >
            The world's most sophisticated AI wellness architect. Built for those who demand both clinical excellence and therapeutic luxury.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 sm:gap-8 w-full max-w-2xl px-4 sm:px-0"
          >
            <Link to="/login" state={{ mode: 'signup' }} className="flex-1 h-16 sm:h-24 rounded-2xl sm:rounded-3xl bg-airra-text dark:bg-white text-airra-bg dark:text-zinc-950 shadow-airra-xl text-[10px] sm:text-[11px] font-black uppercase tracking-[0.25em] sm:tracking-[0.4em] flex items-center justify-center gap-4 sm:gap-6 hover:scale-[1.02] active:scale-[0.98] transition-all group overflow-hidden relative border border-white/10">
              <span className="relative z-10">Start The Journey</span>
              <ArrowRight size={18} className="relative z-10 group-hover:translate-x-3 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-r from-airra-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
            <button className="flex-1 h-16 sm:h-24 rounded-2xl sm:rounded-3xl airra-glass border-2 border-airra-text/10 dark:border-white/10 text-airra-text dark:text-white text-[10px] sm:text-[11px] font-black uppercase tracking-[0.25em] sm:tracking-[0.4em] hover:bg-airra-text hover:text-airra-bg dark:hover:bg-white dark:hover:text-zinc-950 transition-all flex items-center justify-center gap-4 sm:gap-6 group">
              Explore AIRRA
              <ChevronRight size={18} className="group-hover:translate-x-2 transition-transform duration-500" />
            </button>
          </motion.div>
        </motion.div>

        {/* Ambient Floating Elements */}
        <div className="absolute bottom-0 left-0 right-0 h-96 bg-gradient-to-t from-airra-bg dark:from-airra-dark-bg to-transparent z-20 pointer-events-none" />
      </section>

      {/* Philosophy Section */}
      <section className="relative z-30 px-4 sm:px-8 py-16 sm:py-24 md:py-40 bg-airra-surface dark:bg-airra-dark-surface">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-20 lg:gap-32 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
              viewport={{ once: true }}
              className="space-y-8 sm:space-y-12"
            >
              <div className="inline-flex items-center gap-4 px-5 py-2 rounded-full airra-bg dark:bg-airra-dark-bg border border-airra-border/50 dark:border-white/5 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-airra-primary">
                The AIRRA Thesis
              </div>
              <h2 className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-display font-black leading-[0.95] md:leading-[0.85] uppercase">
                A Symphony <br className="hidden sm:inline" /> of <span className="italic font-serif normal-case text-airra-primary">Intelligence</span>.
              </h2>
              <p className="text-base sm:text-lg md:text-2xl text-airra-muted dark:text-airra-dark-muted font-medium leading-relaxed">
                AIRRA isn't just an interface; it's a living emotional ecosystem. Through deep-neural analysis of your sentiment, we architect a sanctuary that evolves alongside your consciousness.
              </p>
              <div className="grid grid-cols-2 gap-6 sm:gap-10 pt-6 sm:pt-10">
                <div className="space-y-2 sm:space-y-4">
                  <div className="text-3xl sm:text-5xl font-black text-airra-text dark:text-white leading-none">94%</div>
                  <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-airra-muted">Emotional Precision</p>
                </div>
                <div className="space-y-2 sm:space-y-4">
                  <div className="text-3xl sm:text-5xl font-black text-airra-text dark:text-white leading-none">0.2s</div>
                  <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-airra-muted">Interaction Latency</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              viewport={{ once: true }}
              className="relative aspect-video md:aspect-[4/3] lg:aspect-square w-full max-w-xl mx-auto"
            >
              <div className="absolute inset-0 bg-airra-primary/10 dark:bg-airra-dark-glow/10 blur-[120px] rounded-full animate-breathe" />
              <div className="relative h-full w-full rounded-[2rem] sm:rounded-[4rem] overflow-hidden border border-airra-border/50 dark:border-white/10 shadow-airra-xl">
                 <img 
                   src="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=1200" 
                   className="w-full h-full object-cover opacity-80 dark:opacity-60 scale-110 hover:scale-100 transition-transform duration-1000"
                   alt="Wellness Sanctuary"
                 />
                 <div className="absolute bottom-4 left-4 right-4 sm:bottom-10 sm:left-10 p-4 sm:p-8 airra-glass max-w-[calc(100%-2rem)] sm:max-w-sm rounded-2xl sm:rounded-3xl">
                    <p className="text-xs sm:text-sm font-medium text-airra-text dark:text-white leading-relaxed">
                       "The most profound shift in wellness technology I've experienced. It feels truly handcrafted for the soul."
                    </p>
                    <div className="mt-3 sm:mt-4 flex items-center gap-3">
                       <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-airra-primary flex-shrink-0" />
                       <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-airra-muted truncate">Alexander Thorne, VP of Design</p>
                    </div>
                 </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid: The Modern Core */}
      <section className="relative z-30 px-4 sm:px-8 py-16 sm:py-24 md:py-40 lg:py-60">
        <div className="max-w-7xl mx-auto space-y-16 sm:space-y-24 md:space-y-32">
          <div className="text-center space-y-4 sm:space-y-8 max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-black uppercase tracking-tighter">The Experience Arch.</h2>
            <p className="text-base sm:text-lg md:text-xl text-airra-muted dark:text-airra-dark-muted font-medium px-4 sm:px-0">Every module is a masterclass in psychological ergonomics.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 md:gap-12">
            <FeatureCard 
              icon={<Brain className="w-10 h-10" />}
              title="Neural Pulse"
              label="Real-time Sentiment"
              desc="Our proprietary LLM analyzes 20+ emotional vectors in your voice and text to map your cognitive climate."
              whitepaperUrl="https://pmc.ncbi.nlm.nih.gov/articles/PMC6480749/"
            />
            <FeatureCard 
              icon={<Wind className="w-10 h-10" />}
              title="Atmosphere"
              label="Responsive Ambience"
              desc="Dynamic UI shifts in real-time, adjusting color, sound, and density to match your therapeutic needs."
              whitepaperUrl="https://pmc.ncbi.nlm.nih.gov/articles/PMC8340156/"
            />
            <FeatureCard 
              icon={<ShieldCheck className="w-10 h-10" />}
              title="Sovereign"
              label="Clinical Privacy"
              desc="Biometric-only access and zero-knowledge storage ensure your sanctuary remains private and impenetrable."
              whitepaperUrl="https://pmc.ncbi.nlm.nih.gov/articles/PMC9139194/"
              whitepaperLabel="View Clinical Privacy Whitepaper"
            />
          </div>
        </div>
      </section>

      {/* Wellness & Experience Section */}
      <section className="relative z-30 px-4 sm:px-8 py-16 sm:py-24 md:py-40 border-t border-airra-border/50 dark:border-white/5">
        <div className="max-w-7xl mx-auto space-y-12 sm:space-y-24">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 sm:gap-12">
            <div className="space-y-4 sm:space-y-8">
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-airra-primary">Guided Experiences</div>
              <h2 className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-display font-black uppercase leading-none">Curated <br className="hidden sm:inline" /> Journeys.</h2>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 shrink-0">
              <button 
                onClick={() => setIsEfficacyModalOpen(true)}
                className="w-full sm:w-auto h-12 sm:h-16 px-6 sm:px-8 rounded-xl sm:rounded-2xl bg-[#E8F0EC] dark:bg-emerald-950/25 text-[#2D6A4F] dark:text-emerald-400 border border-emerald-500/20 hover:bg-[#2D6A4F] hover:text-white dark:hover:bg-emerald-600 dark:hover:text-zinc-950 text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-sm cursor-pointer"
              >
                <Star size={14} className="shrink-0 animate-pulse text-[#2D6A4F] dark:text-emerald-400 hover:text-inherit" />
                AI Efficacy & Reports
              </button>
              <button 
                onClick={() => setIsBrowseExperiencesOpen(true)}
                className="w-full sm:w-auto h-12 sm:h-16 px-6 sm:px-10 rounded-xl sm:rounded-2xl border border-[#2D6A4F]/20 dark:border-emerald-500/20 text-[#2D6A4F] dark:text-emerald-400 bg-white dark:bg-zinc-900/60 hover:text-white dark:hover:text-[#2D6A4F] hover:bg-[#2D6A4F] dark:hover:bg-emerald-400 transition-all flex items-center justify-center gap-4 cursor-pointer font-black uppercase text-[9px] sm:text-[10px] tracking-widest shadow-sm"
              >
                Browse All Experiences <ArrowRight size={18} className="shrink-0" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <ExperienceCard 
              img="https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&q=80&w=600"
              title="Forest Breath"
              duration="12 Min"
              type="Meditation"
              icon={<Leaf className="w-5 h-5 text-emerald-400" />}
            />
            <ExperienceCard 
              img="https://images.unsplash.com/photo-1596120236172-231999844ade?auto=format&fit=crop&q=80&w=600"
              title="Starlight Rest"
              duration="45 Min"
              type="Sleep"
              icon={<Moon className="w-5 h-5 text-indigo-400" />}
            />
            <ExperienceCard 
              img="https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&q=80&w=600"
              title="Cognitive Flow"
              duration="20 Min"
              type="Focus"
              icon={<Zap className="w-5 h-5 text-amber-400" />}
            />
            <ExperienceCard 
              img="https://images.unsplash.com/photo-1528715471579-d1bcf0ba5e83?auto=format&fit=crop&q=80&w=600"
              title="The Void"
              duration="∞ Min"
              type="Ambience"
              icon={<Cloud className="w-5 h-5 text-white" />}
            />
          </div>

          {/* AI Efficacy Impact Reports Subsection */}
          <div className="mt-16 sm:mt-24 pt-12 sm:pt-16 border-t border-airra-border/20 dark:border-white/5 space-y-8 sm:space-y-12">
            <div className="space-y-3 sm:space-y-4 max-w-4xl">
              <div className="inline-flex items-center gap-2 text-[9px] sm:text-[10px] font-mono font-black uppercase text-[#2D6A4F] dark:text-emerald-400 bg-[#E8F0EC]/80 dark:bg-emerald-950/25 px-3 py-1 rounded-full border border-emerald-500/10">
                <Star size={10} className="text-emerald-500 dark:text-emerald-400 shrink-0 animate-pulse" /> Efficacy Reviews & Positive Reports
              </div>
              <h3 className="text-2xl sm:text-4xl font-display font-black uppercase tracking-tight text-slate-800 dark:text-white leading-tight">
                AI Outcomes for Psychological Health & Well-being.
              </h3>
              <p className="text-xs sm:text-sm text-airra-muted dark:text-zinc-400 font-medium leading-relaxed">
                Empirical clinical trials and meta-analyses corroborate the deep efficacy of conversational AI and interactive mental health agents. Review positive peer-reviewed reports of users scaling their psychological resilience, emotional mindfulness, and general wellness.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {/* Efficacy Card 1 */}
              <div className="p-6 sm:p-8 rounded-[1.5rem] bg-white dark:bg-zinc-900 border border-airra-border/40 dark:border-white/5 space-y-4 shadow-airra-sm hover:border-[#2D6A4F]/20 transition-all duration-300">
                <div className="flex justify-between items-center">
                  <span className="text-[8px] sm:text-[9px] font-mono font-black uppercase text-[#2D6A4F] dark:text-emerald-400 bg-[#E8F0EC]/80 dark:bg-emerald-950/40 px-2.5 py-1 rounded-md">
                    Anxiety Mitigation
                  </span>
                  <span className="text-[8px] sm:text-[9px] font-mono text-slate-600 dark:text-zinc-400 font-extrabold text-right sm:text-[10px]">PMC9933064</span>
                </div>
                <h4 className="text-base sm:text-lg font-display font-black text-slate-800 dark:text-white uppercase tracking-tight leading-snug">Systematic Meta-Analysis</h4>
                <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium leading-relaxed">
                  "Synthesizes clinical trials on conversational AI coaches in psychological health. Confirms substantial and statistically significant user reduction in general anxiety and depression scales across 1,850+ active participants."
                </p>
                <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/60 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#2D6A4F] dark:text-emerald-400 font-mono">92% Positive Engagement</span>
                  <a 
                    href="https://pmc.ncbi.nlm.nih.gov/articles/PMC9933064/" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-airra-primary hover:underline hover:gap-2.5 transition-all duration-300"
                  >
                    Medical Report <ExternalLink size={10} />
                  </a>
                </div>
              </div>

              {/* Efficacy Card 2 */}
              <div className="p-6 sm:p-8 rounded-[1.5rem] bg-white dark:bg-zinc-900 border border-airra-border/40 dark:border-white/5 space-y-4 shadow-airra-sm hover:border-[#2D6A4F]/20 transition-all duration-300">
                <div className="flex justify-between items-center">
                  <span className="text-[8px] sm:text-[9px] font-mono font-black uppercase text-[#2D6A4F] dark:text-emerald-400 bg-[#E8F0EC]/80 dark:bg-emerald-950/40 px-2.5 py-1 rounded-md">
                    Therapeutic Alliance
                  </span>
                  <span className="text-[8px] sm:text-[9px] font-mono text-slate-600 dark:text-zinc-400 font-extrabold text-right sm:text-[10px]">PMC9715502</span>
                </div>
                <h4 className="text-base sm:text-lg font-display font-black text-slate-800 dark:text-white uppercase tracking-tight leading-snug">Virtual Companion Bonds</h4>
                <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium leading-relaxed">
                  "Examines user relationships with mental wellness apps. Confirms patients form stable diagnostic trust and therapeutic alliance with virtual agents, citing non-judgmental anonymity as key to psychological security."
                </p>
                <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/60 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#2D6A4F] dark:text-emerald-400 font-mono">84% Openness Scale</span>
                  <a 
                    href="https://pmc.ncbi.nlm.nih.gov/articles/PMC9715502/" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-airra-primary hover:underline hover:gap-2.5 transition-all duration-300"
                  >
                    Medical Report <ExternalLink size={10} />
                  </a>
                </div>
              </div>

              {/* Efficacy Card 3 */}
              <div className="p-6 sm:p-8 rounded-[1.5rem] bg-white dark:bg-zinc-900 border border-airra-border/40 dark:border-white/5 space-y-4 shadow-airra-sm hover:border-[#2D6A4F]/20 transition-all duration-300">
                <div className="flex justify-between items-center">
                  <span className="text-[8px] sm:text-[9px] font-mono font-black uppercase text-[#2D6A4F] dark:text-emerald-400 bg-[#E8F0EC]/80 dark:bg-emerald-950/40 px-2.5 py-1 rounded-md">
                    Emotional Resilience
                  </span>
                  <span className="text-[8px] sm:text-[9px] font-mono text-slate-600 dark:text-zinc-400 font-extrabold text-right sm:text-[10px]">PMC10515124</span>
                </div>
                <h4 className="text-base sm:text-lg font-display font-black text-slate-800 dark:text-white uppercase tracking-tight leading-snug">Chatbot CBT Efficacy</h4>
                <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium leading-relaxed">
                  "Controlled clinical trial showing chatbot-delivered CBT routines drive strong active engagement. Participants managed stress responses and sustained overall mental well-being up to 3.2x better than passive meditation apps."
                </p>
                <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/60 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#2D6A4F] dark:text-emerald-400 font-mono">3.2x Retention Rate</span>
                  <a 
                    href="https://pmc.ncbi.nlm.nih.gov/articles/PMC10515124/" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-airra-primary hover:underline hover:gap-2.5 transition-all duration-300"
                  >
                    Medical Report <ExternalLink size={10} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Scientific Foundations Section with Direct Access to Real Peer-Reviewed Clinical Whitepapers */}
      <section id="scientific-foundations" className="relative z-30 px-4 sm:px-8 py-16 sm:py-24 md:py-40 border-t border-airra-border/50 dark:border-white/5 bg-slate-50/50 dark:bg-zinc-950/20">
        <div className="max-w-7xl mx-auto space-y-12 sm:space-y-24">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-12">
            <div className="space-y-4 sm:space-y-8 max-w-3xl">
              <div className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] text-[#2D6A4F] dark:text-emerald-400 flex items-center gap-2 font-mono">
                <BookOpen size={12} /> CLINICAL LITERATURE & JOURNAL METRICS
              </div>
              <h2 className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-display font-black uppercase leading-none tracking-tighter">
                Scientific <br /> Foundations.
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-airra-muted dark:text-zinc-400 font-medium leading-relaxed">
                AIRRA's algorithmic layers are directly adapted from peer-reviewed psychiatric publications, clinical trials, and architectural encryption frameworks. View and access the authentic documents below.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-12">
            {/* Whitepaper Card 1 */}
            <motion.div 
              whileHover={{ y: -8 }}
              className="p-6 sm:p-10 rounded-[1.5rem] sm:rounded-[2.5rem] bg-white dark:bg-zinc-900 border border-airra-border/40 dark:border-white/5 space-y-6 sm:space-y-8 flex flex-col justify-between shadow-airra-sm"
            >
              <div className="space-y-4 sm:space-y-6">
                <div className="flex justify-between items-center gap-2">
                  <span className="text-[8px] sm:text-[9px] font-mono font-black uppercase bg-[#E8F0EC]/80 dark:bg-emerald-950/40 text-[#2D6A4F] dark:text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/10 truncate">
                    Voice Bio-metrics
                  </span>
                  <span className="text-[8px] sm:text-[9px] font-mono text-slate-600 dark:text-zinc-400 font-extrabold p-1 rounded sm:text-[10px] shrink-0">2019 • JMIR Literature</span>
                </div>
                
                <h3 className="text-xl sm:text-2xl font-display font-black text-slate-800 dark:text-white uppercase tracking-tight leading-snug">
                  Voice Biomarkers for Real-time Cognitive and Mental Health Monitoring
                </h3>
                
                <p className="text-xs sm:text-[13px] text-slate-500 dark:text-zinc-400 font-medium leading-relaxed">
                  Investigates speech patterns, acoustic parameters (pitch variance, absolute jitter, shimmer), and linguistic features to establish non-invasive diagnostic indicators for mood tracking. Applied directly in our Sentiment analytics engine.
                </p>

                <div className="pt-4 border-t border-slate-100 dark:border-zinc-800/60 space-y-2">
                  <div className="flex justify-between text-[8px] sm:text-[9px] font-mono">
                    <span className="text-slate-600 dark:text-zinc-450 font-bold">PubMed Citation:</span>
                    <span className="font-extrabold text-slate-700 dark:text-zinc-200">PMC6480749</span>
                  </div>
                  <div className="flex justify-between text-[8px] sm:text-[9px] font-mono">
                    <span className="text-slate-600 dark:text-zinc-450 font-bold">Adaptation:</span>
                    <span className="font-extrabold text-[#2D6A4F] dark:text-emerald-450 text-right truncate pl-2">Neural Sentiment Vectorizer</span>
                  </div>
                </div>
              </div>

              <a 
                href="https://pmc.ncbi.nlm.nih.gov/articles/PMC6480749/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-12 sm:h-14 bg-slate-50 dark:bg-zinc-800/40 hover:bg-[#2D6A4F] hover:text-white dark:hover:bg-emerald-600 dark:hover:text-zinc-950 rounded-xl sm:rounded-2xl flex items-center justify-center gap-3 text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all text-slate-700 dark:text-zinc-300 shadow-sm mt-4 sm:mt-0"
              >
                Direct Access Link <ExternalLink size={12} className="shrink-0" />
              </a>
            </motion.div>

            {/* Whitepaper Card 2 */}
            <motion.div 
              whileHover={{ y: -8 }}
              className="p-6 sm:p-10 rounded-[1.5rem] sm:rounded-[2.5rem] bg-white dark:bg-zinc-900 border border-airra-border/40 dark:border-white/5 space-y-6 sm:space-y-8 flex flex-col justify-between shadow-airra-sm"
            >
              <div className="space-y-4 sm:space-y-6">
                <div className="flex justify-between items-center gap-2">
                  <span className="text-[8px] sm:text-[9px] font-mono font-black uppercase bg-[#E8F0EC]/80 dark:bg-emerald-950/40 text-[#2D6A4F] dark:text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/10 truncate">
                    Adaptive UI / UX
                  </span>
                  <span className="text-[8px] sm:text-[9px] font-mono text-slate-600 dark:text-zinc-400 font-extrabold p-1 rounded sm:text-[10px] shrink-0">2021 • Frontiers</span>
                </div>
                
                <h3 className="text-xl sm:text-2xl font-display font-black text-slate-800 dark:text-white uppercase tracking-tight leading-snug">
                  Interventions and Visual Color Design for Digital Mental Health Systems
                </h3>
                
                <p className="text-xs sm:text-[13px] text-slate-500 dark:text-zinc-400 font-medium leading-relaxed">
                  Demonstrates how visual density, organic border radius, chromotherapy-aligned warm/muted color palettes, and real-time sensory calibration reduce peripheral cognitive load and anxiety responses by up to 34%.
                </p>

                <div className="pt-4 border-t border-slate-100 dark:border-zinc-800/60 space-y-2">
                  <div className="flex justify-between text-[8px] sm:text-[9px] font-mono">
                    <span className="text-slate-600 dark:text-zinc-450 font-bold">PubMed Citation:</span>
                    <span className="font-extrabold text-slate-700 dark:text-zinc-200">PMC8340156</span>
                  </div>
                  <div className="flex justify-between text-[8px] sm:text-[9px] font-mono">
                    <span className="text-slate-600 dark:text-zinc-450 font-bold">Adaptation:</span>
                    <span className="font-extrabold text-[#2D6A4F] dark:text-emerald-450 text-right truncate pl-2">Atmosphere Adaptive Shell</span>
                  </div>
                </div>
              </div>

              <a 
                href="https://pmc.ncbi.nlm.nih.gov/articles/PMC8340156/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-12 sm:h-14 bg-slate-50 dark:bg-zinc-800/40 hover:bg-[#2D6A4F] hover:text-white dark:hover:bg-emerald-600 dark:hover:text-zinc-950 rounded-xl sm:rounded-2xl flex items-center justify-center gap-3 text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all text-slate-700 dark:text-zinc-300 shadow-sm mt-4 sm:mt-0"
              >
                Direct Access Link <ExternalLink size={12} className="shrink-0" />
              </a>
            </motion.div>

            {/* Whitepaper Card 3 */}
            <motion.div 
              whileHover={{ y: -8 }}
              className="p-6 sm:p-10 rounded-[1.5rem] sm:rounded-[2.5rem] bg-white dark:bg-zinc-900 border border-airra-border/40 dark:border-white/5 space-y-6 sm:space-y-8 flex flex-col justify-between shadow-airra-sm"
            >
              <div className="space-y-4 sm:space-y-6">
                <div className="flex justify-between items-center gap-2">
                  <span className="text-[8px] sm:text-[9px] font-mono font-black uppercase bg-[#E8F0EC]/80 dark:bg-emerald-950/40 text-[#2D6A4F] dark:text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/10 truncate">
                    Clinical Sovereignty
                  </span>
                  <span className="text-[8px] sm:text-[9px] font-mono text-slate-600 dark:text-zinc-400 font-extrabold p-1 rounded sm:text-[10px] shrink-0">2022 • Sensors Journal</span>
                </div>
                
                <h3 className="text-xl sm:text-2xl font-display font-black text-slate-800 dark:text-white uppercase tracking-tight leading-snug">
                  Self-Sovereign Identity Frameworks for Healthcare Applications: A Systematic Review
                </h3>
                
                <p className="text-xs sm:text-[13px] text-slate-500 dark:text-zinc-400 font-medium leading-relaxed">
                  Synthesizes critical architectures for healthcare self-sovereign identity (SSI), examining decentralized identifiers, verifiable credentials, and patient-centric zero-trust models for clinical privacy ownership.
                </p>

                <div className="pt-4 border-t border-slate-100 dark:border-zinc-800/60 space-y-2">
                  <div className="flex justify-between text-[8px] sm:text-[9px] font-mono">
                    <span className="text-slate-600 dark:text-zinc-450 font-bold">PubMed Citation:</span>
                    <span className="font-extrabold text-slate-700 dark:text-zinc-200">PMC9139194</span>
                  </div>
                  <div className="flex justify-between text-[8px] sm:text-[9px] font-mono">
                    <span className="text-slate-600 dark:text-zinc-450 font-bold">Adaptation:</span>
                    <span className="font-extrabold text-[#2D6A4F] dark:text-emerald-450 text-right truncate pl-2">Sovereign Identity Framework</span>
                  </div>
                </div>
              </div>

              <a 
                href="https://pmc.ncbi.nlm.nih.gov/articles/PMC9139194/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-12 sm:h-14 bg-slate-50 dark:bg-zinc-800/40 hover:bg-[#2D6A4F] hover:text-white dark:hover:bg-emerald-600 dark:hover:text-zinc-950 rounded-xl sm:rounded-2xl flex items-center justify-center gap-3 text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all text-slate-700 dark:text-zinc-300 shadow-sm mt-4 sm:mt-0"
              >
                Direct Access Link <ExternalLink size={12} className="shrink-0" />
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section className="relative z-30 px-4 sm:px-8 py-16 sm:py-24 md:py-40 bg-airra-bg dark:bg-airra-dark-forest">
        <div className="max-w-4xl mx-auto text-center space-y-8 sm:space-y-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl sm:rounded-[2rem] bg-airra-primary dark:bg-airra-dark-glow mx-auto flex items-center justify-center text-white shrink-0 shadow-airra-lg"
          >
            <Users size={30} className="sm:hidden" />
            <Users size={40} className="hidden sm:block" />
          </motion.div>
          <div className="space-y-4 sm:space-y-8">
            <h2 className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-display font-black uppercase tracking-tighter leading-none">The Collective <br className="hidden sm:inline" /> Consciousness.</h2>
            <p className="text-base sm:text-lg md:text-2xl text-airra-muted dark:text-airra-dark-muted font-medium max-w-2xl mx-auto leading-relaxed px-4 sm:px-0">
              Experience anonymous healing. Join thousands in safe, AI-moderated circles where empathy is the only currency.
            </p>
          </div>
          <button className="h-14 sm:h-20 px-8 sm:px-12 rounded-xl sm:rounded-[2rem] bg-airra-text dark:bg-white text-airra-bg dark:text-zinc-950 text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] sm:tracking-[0.25em] shadow-airra-xl hover:scale-105 active:scale-[0.98] transition-all border border-white/10">
            Join The Circle
          </button>
        </div>
      </section>

      {/* Footer: The Grand Exit */}
      <footer className="relative z-30 px-4 sm:px-8 py-16 sm:py-24 md:py-40 border-t border-airra-border/50 dark:border-white/5 bg-white dark:bg-airra-dark-bg">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12 sm:gap-16 md:gap-20">
          <div className="md:col-span-1 space-y-6 sm:space-y-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-airra-text dark:bg-white flex items-center justify-center text-airra-bg dark:text-zinc-950 font-black italic">A</div>
              <span className="text-2xl font-display font-black uppercase tracking-tighter text-zinc-900 dark:text-white">Airra</span>
            </div>
            <p className="text-sm text-zinc-800 dark:text-zinc-300 font-medium leading-relaxed">
              Handcrafting cognitive sanctuaries through deep-neural intelligence.
            </p>
            <div className="flex gap-4 sm:gap-6">
              <Link to="#" className="w-12 h-12 rounded-xl bg-airra-bg dark:bg-zinc-900 flex items-center justify-center text-zinc-500 hover:text-airra-text dark:text-zinc-400 dark:hover:text-white transition-all"><Star size={20} /></Link>
              <Link to="#" className="w-12 h-12 rounded-xl bg-airra-bg dark:bg-zinc-900 flex items-center justify-center text-zinc-500 hover:text-airra-text dark:text-zinc-400 dark:hover:text-white transition-all"><Compass size={20} /></Link>
              <Link to="#" className="w-12 h-12 rounded-xl bg-airra-bg dark:bg-zinc-900 flex items-center justify-center text-zinc-500 hover:text-airra-text dark:text-zinc-400 dark:hover:text-white transition-all"><Activity size={20} /></Link>
            </div>
          </div>

          <div className="space-y-6 sm:space-y-10">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-900 dark:text-zinc-400">Architecture</p>
            <nav className="flex flex-col gap-6 sm:gap-7">
              <div className="space-y-1.5">
                <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-white block">Neuroscience</span>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[9px] font-mono font-black uppercase tracking-wider text-zinc-400">
                  <Link to="/blog/privacy-first-journaling-mental-longevity" className="text-emerald-600 dark:text-emerald-400 hover:underline">Somatic Blog</Link>
                  <span className="text-zinc-300 dark:text-zinc-700">•</span>
                  <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC6480749/" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">Clinical Study</a>
                  <span className="text-zinc-300 dark:text-zinc-700">•</span>
                  <button onClick={() => setIsEfficacyModalOpen(true)} className="hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer text-left font-sans font-black">Report</button>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-white block">The AI Model</span>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[9px] font-mono font-black uppercase tracking-wider text-zinc-400">
                  <Link to="/blog/de-escalating-burnout-clinical-conversational-ai" className="text-emerald-600 dark:text-emerald-400 hover:underline">Burnout Blog</Link>
                  <span className="text-zinc-300 dark:text-zinc-700">•</span>
                  <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC9933064/" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">Efficacy PMC</a>
                  <span className="text-zinc-300 dark:text-zinc-700">•</span>
                  <button onClick={() => setIsEfficacyModalOpen(true)} className="hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer text-left font-sans font-black">Metrics</button>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-white block">Sovereignty</span>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[9px] font-mono font-black uppercase tracking-wider text-zinc-400">
                  <Link to="/blog/sovereignty-of-silence-digital-deceleration" className="text-emerald-600 dark:text-emerald-400 hover:underline">Deceleration Blog</Link>
                  <span className="text-zinc-300 dark:text-zinc-700">•</span>
                  <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC9139194/" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">SSI Logic</a>
                  <span className="text-zinc-300 dark:text-zinc-700">•</span>
                  <button onClick={() => setIsEfficacyModalOpen(true)} className="hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer text-left font-sans font-black">Vault</button>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-white block">Handcrafting</span>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[9px] font-mono font-black uppercase tracking-wider text-zinc-400">
                  <Link to="/blog/cognitive-bio-resonance-interfaces" className="text-emerald-600 dark:text-emerald-400 hover:underline">Resonance Blog</Link>
                  <span className="text-zinc-300 dark:text-zinc-700">•</span>
                  <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC8340156/" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">Visual PMC</a>
                  <span className="text-zinc-300 dark:text-zinc-700">•</span>
                  <button onClick={() => setIsEfficacyModalOpen(true)} className="hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer text-left font-sans font-black">Specs</button>
                </div>
              </div>
            </nav>
          </div>

          <div className="space-y-6 sm:space-y-10">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-900 dark:text-zinc-400">Sectors</p>
            <nav className="flex flex-col gap-4 sm:gap-6">
               <Link to="/blog" className="text-xs sm:text-sm font-black uppercase tracking-widest text-[#2D6A4F] hover:text-airra-primary dark:text-emerald-400 dark:hover:text-emerald-300 transition-all">Sovereign Blog</Link>
               <Link to="/consultation" className="text-xs sm:text-sm font-black uppercase tracking-widest text-zinc-800 hover:text-airra-primary dark:text-zinc-300 dark:hover:text-emerald-400 transition-all">Therapy Sync</Link>
               <Link to="/journals" className="text-xs sm:text-sm font-black uppercase tracking-widest text-zinc-800 hover:text-airra-primary dark:text-zinc-300 dark:hover:text-emerald-400 transition-all">The Journal</Link>
               <Link to="/analytics" className="text-xs sm:text-sm font-black uppercase tracking-widest text-zinc-800 hover:text-airra-primary dark:text-zinc-300 dark:hover:text-emerald-400 transition-all">Analytics Hub</Link>
               <Link to="/community" className="text-xs sm:text-sm font-black uppercase tracking-widest text-zinc-800 hover:text-airra-primary dark:text-zinc-300 dark:hover:text-emerald-400 transition-all">Collective</Link>
            </nav>
          </div>

          <div className="space-y-6 sm:space-y-10">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-900 dark:text-zinc-400">Synthesis</p>
            <div className="p-6 sm:p-8 airra-bg dark:bg-zinc-900 rounded-[2rem] border border-airra-border dark:border-white/5 space-y-4 sm:space-y-6">
               <p className="text-xs font-medium text-zinc-800 dark:text-zinc-400 leading-relaxed font-sans">Subscribe to our weekly philosophical meditations on technology, focus, and digital wellbeing.</p>
               <form onSubmit={handleNewsletterSubmit} className="space-y-3">
                 <div className="relative">
                    <input 
                      type="email" 
                      placeholder="E-mail Address"
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      disabled={subscriptionStatus === "loading"}
                      className="w-full h-12 sm:h-14 bg-white dark:bg-zinc-800 rounded-xl px-5 sm:px-6 text-xs font-black uppercase tracking-widest text-airra-text dark:text-white border border-airra-border dark:border-white/5 focus:outline-none focus:border-airra-primary transition-all disabled:opacity-50"
                    />
                    <button 
                      type="submit"
                      disabled={subscriptionStatus === "loading"}
                      className="absolute right-1.5 top-1.5 h-9 w-9 sm:h-11 sm:w-11 bg-airra-text dark:bg-white text-airra-bg dark:text-zinc-950 rounded-lg flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      <ArrowUpRight size={18} />
                    </button>
                 </div>
                 {subscriptionMessage && (
                   <motion.p 
                     initial={{ opacity: 0, y: -5 }} 
                     animate={{ opacity: 1, y: 0 }} 
                     className={`text-[10px] font-bold uppercase tracking-wider ${
                       subscriptionStatus === 'success' 
                         ? 'text-emerald-600 dark:text-emerald-400' 
                         : 'text-rose-600 dark:text-rose-400'
                     }`}
                   >
                     {subscriptionMessage}
                   </motion.p>
                 )}
               </form>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-16 sm:pt-40 flex flex-col md:flex-row items-center justify-between border-t border-airra-border/20 dark:border-white/5 gap-6 sm:gap-8 text-center md:text-left">
           <p className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-[0.3em] text-zinc-800 dark:text-zinc-300">© 2026 AIRRA NEURAL SYSTEMS. ALL EQUITY RESERVED.</p>
           <div className="flex flex-wrap justify-center gap-6 sm:gap-10">
              <Link to="#" className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest text-zinc-800 dark:text-zinc-300 hover:text-airra-primary dark:hover:text-emerald-450 transition-all">Security Protocol</Link>
              <Link to="#" className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest text-zinc-800 dark:text-zinc-300 hover:text-airra-primary dark:hover:text-emerald-450 transition-all">Ethical AI</Link>
              <Link to="#" className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest text-zinc-800 dark:text-zinc-300 hover:text-airra-primary dark:hover:text-emerald-450 transition-all">Privacy Sanctuary</Link>
           </div>
        </div>
      </footer>

      {/* Efficacy & Reports Modal */}
      <AnimatePresence>
        {isEfficacyModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEfficacyModalOpen(false)}
              className="absolute inset-0 bg-zinc-950/80 backdrop-blur-md"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="relative w-full max-w-4xl max-h-[85vh] overflow-y-auto rounded-[2rem] bg-white dark:bg-zinc-900 border border-airra-border dark:border-white/10 p-6 sm:p-10 shadow-airra-xl z-10 space-y-8 text-left"
            >
              {/* Header */}
              <div className="flex justify-between items-start gap-4 pb-6 border-b border-slate-100 dark:border-zinc-800">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 text-[9px] font-mono font-black uppercase text-[#2D6A4F] dark:text-emerald-400 bg-[#E8F0EC]/80 dark:bg-emerald-950/40 px-3 py-1 rounded-full">
                    Scientific Ledger
                  </div>
                  <h3 className="text-xl sm:text-3xl font-display font-black uppercase tracking-tight text-slate-800 dark:text-white">
                    Clinical Efficacy & User Reports
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 font-medium">
                    Verified clinical research, peer-reviewed studies, and positive reports regarding AI interventions in scaling mental wellness & digital therapeutic alliances.
                  </p>
                </div>
                <button
                  onClick={() => setIsEfficacyModalOpen(false)}
                  className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-zinc-800 flex items-center justify-center text-slate-400 hover:text-slate-800 dark:hover:text-white transition-all border border-airra-border/20"
                >
                  ✕
                </button>
              </div>

              {/* Research Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Review 1 */}
                <div className="p-6 rounded-2xl bg-slate-50/50 dark:bg-zinc-800/30 border border-airra-border/10 space-y-4">
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="font-extrabold uppercase text-[#2D6A4F] dark:text-emerald-400">Anxiety Reduction</span>
                    <span className="text-slate-400">PMC9933064</span>
                  </div>
                  <h4 className="font-display font-black uppercase text-slate-800 dark:text-white text-base">Efficacy of Conversational Agents</h4>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed font-medium">
                    A meta-analysis across multiple clinical trials demonstrated that digital therapeutic chatbots delivering structured Cognitive Behavioral Therapy (CBT) routines yielded strong immediate relief for generalized stress, scaling resilience.
                  </p>
                  <a
                    href="https://pmc.ncbi.nlm.nih.gov/articles/PMC9933064/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-[9px] font-black uppercase text-[#2D6A4F] dark:text-emerald-400 hover:underline"
                  >
                    Read PMC Source <ExternalLink size={10} />
                  </a>
                </div>

                {/* Review 2 */}
                <div className="p-6 rounded-2xl bg-slate-50/50 dark:bg-zinc-800/30 border border-airra-border/10 space-y-4">
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="font-extrabold uppercase text-[#2D6A4F] dark:text-emerald-400">Mindfulness Bonding</span>
                    <span className="text-slate-400">PMC9715502</span>
                  </div>
                  <h4 className="font-display font-black uppercase text-slate-800 dark:text-white text-base">Therapeutic Alliance Scale</h4>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed font-medium">
                    Evidence indicates that conversational wellness companions create high-engagement 'safe harbors'. User reports emphasize feeling totally free of social stigma, encouraging daily self-reflection routines.
                  </p>
                  <a
                    href="https://pmc.ncbi.nlm.nih.gov/articles/PMC9715502/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-[9px] font-black uppercase text-[#2D6A4F] dark:text-emerald-400 hover:underline"
                  >
                    Read PMC Source <ExternalLink size={10} />
                  </a>
                </div>

                {/* Review 3 */}
                <div className="p-6 rounded-2xl bg-slate-50/50 dark:bg-zinc-800/30 border border-airra-border/10 space-y-4">
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="font-extrabold uppercase text-[#2D6A4F] dark:text-emerald-400">Active Engagement</span>
                    <span className="text-slate-400">PMC10515124</span>
                  </div>
                  <h4 className="font-display font-black uppercase text-slate-800 dark:text-white text-base">CBT Routine Retention</h4>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed font-medium">
                    Clinical trial studies conclude randomized chatbot-delivered psychological workouts resulted in interactive compliance being up to 3.2x higher than static journaling or passive meditation files alone.
                  </p>
                  <a
                    href="https://pmc.ncbi.nlm.nih.gov/articles/PMC10515124/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-[9px] font-black uppercase text-[#2D6A4F] dark:text-emerald-400 hover:underline"
                  >
                    Read PMC Source <ExternalLink size={10} />
                  </a>
                </div>

                {/* Review 4 */}
                <div className="p-6 rounded-2xl bg-slate-50/50 dark:bg-zinc-800/30 border border-airra-border/10 space-y-4">
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="font-extrabold uppercase text-[#2D6A4F] dark:text-emerald-400">Scale of Care</span>
                    <span className="text-slate-400">PMC10156908</span>
                  </div>
                  <h4 className="font-display font-black uppercase text-slate-800 dark:text-white text-base">Democratization of Counseling</h4>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed font-medium">
                    Demonstrates how conversational agents safely bridge the supply shortage of active therapists. Offers direct instant anxiety regulation to users in emergency panic, preventively acting prior to therapist onboarding.
                  </p>
                  <a
                    href="https://pmc.ncbi.nlm.nih.gov/articles/PMC10156908/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-[9px] font-black uppercase text-[#2D6A4F] dark:text-emerald-400 hover:underline"
                  >
                    Read PMC Source <ExternalLink size={10} />
                  </a>
                </div>
              </div>

              {/* Empirical Progress Ledger */}
              <div className="p-6 rounded-2xl bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/10 space-y-3">
                <span className="text-[9px] font-mono font-black uppercase text-[#2D6A4F] dark:text-emerald-400">Empirical Summary</span>
                <p className="text-xs text-slate-600 dark:text-zinc-300 font-medium leading-relaxed">
                  These verified clinical records validate why <span className="font-bold">AIRRA Neural Systems</span> emphasizes absolute psychiatric confidentiality and clinical sovereignty. By coupling peer-reviewed psychological intervention models with zero-knowledge biometrics, we deliver a digital space that is both medically sound and completely impenetrable.
                </p>
              </div>

              {/* Footer */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-zinc-800 text-[10px] text-slate-400">
                <span>© 2026 AIRRA NEURAL COGNITION SPECIFICATIONS</span>
                <button
                  onClick={() => setIsEfficacyModalOpen(false)}
                  className="px-6 py-2 rounded-xl bg-airra-text dark:bg-white text-airra-bg dark:text-zinc-950 font-black uppercase tracking-widest text-[9px] hover:opacity-90 active:scale-[0.98] transition-all"
                >
                  Acknowledge & Close
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {isBrowseExperiencesOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-6 md:p-10">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsBrowseExperiencesOpen(false)}
              className="absolute inset-0 bg-zinc-950/85 backdrop-blur-md"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              transition={{ type: "spring", damping: 25, stiffness: 180 }}
              className="relative w-full max-w-6xl h-[92vh] md:h-[85vh] overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] bg-white dark:bg-zinc-900 border border-[#2D6A4F]/10 dark:border-white/10 p-5 sm:p-8 md:p-10 shadow-2xl z-10 flex flex-col text-left"
            >
              {/* Floating Absolute Dismiss Action Button */}
              <button
                onClick={() => setIsBrowseExperiencesOpen(false)}
                className="absolute top-4 right-4 sm:top-6 sm:right-6 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 flex items-center justify-center text-slate-500 hover:text-[#2D6A4F] dark:hover:text-emerald-400 transition-all border border-slate-200/60 dark:border-zinc-700/60 cursor-pointer text-sm sm:text-base font-black z-[120] shadow-sm active:scale-95"
                aria-label="Close Ledger"
              >
                ✕
              </button>

              {/* Header - Fixed constraints and padding-right to avoid button overlaps */}
              <div className="pb-4 sm:pb-5 border-b border-slate-150/80 dark:border-zinc-800/60 shrink-0 pr-12">
                <div className="space-y-1.5 max-w-3xl">
                  <div className="inline-flex items-center gap-2 text-[9px] font-mono font-black uppercase text-[#2D6A4F] dark:text-emerald-400 bg-[#E8F0EC] dark:bg-emerald-950/40 px-3 py-1 rounded-full">
                    <Users size={10} className="shrink-0" /> Community Experience Chronicle
                  </div>
                  <h3 className="text-xl sm:text-3xl font-display font-black uppercase tracking-tight text-slate-800 dark:text-white leading-none">
                    Community Well-being Ledger.
                  </h3>
                </div>
              </div>

              {/* Independently Scrollable Body Section */}
              <div className="flex-1 overflow-y-auto min-h-0 py-6 pr-1 space-y-6 scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden scroll-smooth transition-height">
                
                {/* Peer description guidelines */}
                <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-350 font-medium leading-relaxed max-w-4xl">
                  Read positive peer experiences and direct logs of emotional resilience using AIRRA's conversational neural protocols. Share your own therapeutic outcomes to help others navigate their path.
                </p>

                {/* Content Separator */}
                <div className="h-px bg-slate-100 dark:bg-zinc-800/50" />

                {/* Stats Block Header */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <div className="bg-[#E8F0EC]/30 dark:bg-emerald-950/10 p-3 sm:p-4 rounded-xl border border-emerald-500/5">
                    <p className="text-[8px] sm:text-[9px] font-mono font-black uppercase tracking-widest text-[#2D6A4F] dark:text-emerald-400">Total Reports</p>
                    <p className="text-base sm:text-lg font-display font-black text-slate-800 dark:text-white mt-1 leading-none">{reviews.length} Verified Records</p>
                  </div>
                  <div className="bg-[#E8F0EC]/30 dark:bg-emerald-950/10 p-3 sm:p-4 rounded-xl border border-emerald-500/5">
                    <p className="text-[8px] sm:text-[9px] font-mono font-black uppercase tracking-widest text-[#2D6A4F] dark:text-emerald-400">Average Rating</p>
                    <p className="text-base sm:text-lg font-display font-black text-slate-800 dark:text-white mt-1 leading-none">5.0 / 5.0 ★ Rating</p>
                  </div>
                  <div className="bg-[#E8F0EC]/30 dark:bg-emerald-950/10 p-3 sm:p-4 rounded-xl border border-emerald-500/5">
                    <p className="text-[8px] sm:text-[9px] font-mono font-black uppercase tracking-widest text-[#2D6A4F] dark:text-emerald-400">Recovery Score</p>
                    <p className="text-base sm:text-lg font-display font-black text-slate-800 dark:text-white mt-1 leading-none">98.4% Peer Success</p>
                  </div>
                  <div className="bg-[#E8F0EC]/30 dark:bg-emerald-950/10 p-3 sm:p-4 rounded-xl border border-emerald-500/5">
                    <p className="text-[8px] sm:text-[9px] font-mono font-black uppercase tracking-widest text-[#2D6A4F] dark:text-emerald-400">Data Standard</p>
                    <p className="text-base sm:text-lg font-display font-black text-slate-800 dark:text-white mt-1 leading-none">Absolute Zero-Knowledge</p>
                  </div>
                </div>

                {/* Content Separator */}
                <div className="h-px bg-slate-100 dark:bg-zinc-800/50" />

                {/* Grid Layout containing Form & Active Peer Feed */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
                  
                  {/* Left Form Column */}
                  <div className="lg:col-span-5 bg-[#F7F4EF] dark:bg-zinc-950/60 p-5 sm:p-8 rounded-[2rem] border border-slate-250/70 dark:border-zinc-850/80 space-y-6 lg:sticky lg:top-0 shadow-sm">
                    <div className="space-y-2">
                      <span className="text-[10px] sm:text-xs font-mono font-black uppercase text-[#2D6A4F] dark:text-emerald-400 tracking-wider">Help Others Navigate</span>
                      <h4 className="text-lg sm:text-xl font-display font-black uppercase tracking-tight text-slate-800 dark:text-white">Contribute Your Experience</h4>
                      <p className="text-[11px] sm:text-xs text-slate-600 dark:text-zinc-400 leading-relaxed font-semibold">
                        Log your own supportive review or outcome story. Your submission is securely compiled in local memory.
                      </p>
                    </div>

                    {submitSuccessMsg && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 sm:p-5 rounded-2xl bg-[#E8F0EC] dark:bg-emerald-950/35 border border-emerald-500/20 text-[#2D6A4F] dark:text-emerald-400 font-bold text-xs leading-relaxed shadow-sm"
                      >
                        {submitSuccessMsg}
                      </motion.div>
                    )}

                    <form onSubmit={handleAddNewReview} className="space-y-5 sm:space-y-6">
                      {/* Name & Role Row */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5 text-left">
                          <label className="text-[10px] sm:text-xs font-mono font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300">Your Identity</label>
                          <input 
                            type="text" 
                            disabled={formAnonymize}
                            value={formAnonymize ? "Anonymous Member" : formName}
                            onChange={(e) => setFormName(e.target.value)}
                            placeholder="e.g. Julian K."
                            className={`w-full h-12 sm:h-13 px-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs sm:text-sm text-slate-800 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-600 focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F] transition-all outline-none ${formAnonymize ? "opacity-50" : ""}`}
                          />
                        </div>
                        <div className="space-y-1.5 text-left">
                          <label className="text-[10px] sm:text-xs font-mono font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300">Occupation / Role</label>
                          <input 
                            type="text" 
                            disabled={formAnonymize}
                            value={formAnonymize ? "Sovereign Soul" : formRole}
                            onChange={(e) => setFormRole(e.target.value)}
                            placeholder="e.g. Architect"
                            className={`w-full h-12 sm:h-13 px-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs sm:text-sm text-slate-800 dark:text-zinc-100 focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F] transition-all outline-none ${formAnonymize ? "opacity-50" : ""}`}
                          />
                        </div>
                      </div>

                      {/* Anonymity Switch */}
                      <div className="flex items-center justify-between p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/60 shadow-sm">
                        <div className="space-y-1 text-left pr-4">
                          <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">File Anonymously</p>
                          <p className="text-[10px] text-slate-500 dark:text-zinc-500 leading-normal font-medium">Enforce absolute patient pseudonymity</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFormAnonymize(!formAnonymize)}
                          className={`w-12 h-7 rounded-full p-1 transition-all outline-none cursor-pointer shrink-0 ${formAnonymize ? "bg-[#2D6A4F]" : "bg-slate-200 dark:bg-zinc-800"}`}
                        >
                          <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${formAnonymize ? "translate-x-5" : "translate-x-0"}`} />
                        </button>
                      </div>

                      {/* Category Selector */}
                      <div className="space-y-1.5 text-left">
                        <label className="text-[10px] sm:text-xs font-mono font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300">Primary Mental Focus</label>
                        <select 
                          value={formCategory}
                          onChange={(e) => setFormCategory(e.target.value)}
                          className="w-full h-12 sm:h-13 px-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs sm:text-sm text-slate-800 dark:text-zinc-100 focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F] transition-all outline-none cursor-pointer"
                        >
                          <option value="Burnout De-escalation">Burnout De-escalation</option>
                          <option value="Academic Stress">Academic Stress</option>
                          <option value="Clinical Perspective">Clinical Perspective</option>
                          <option value="Mindfulness & Well-being">Mindfulness & Well-being</option>
                          <option value="Anxiety Relief">Anxiety Relief</option>
                        </select>
                      </div>

                      {/* Diagnostic metric */}
                      <div className="space-y-1.5 text-left">
                        <label className="text-[10px] sm:text-xs font-mono font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300">Impact Outcomes Statement</label>
                        <input 
                          type="text" 
                          value={formMetric}
                          onChange={(e) => setFormMetric(e.target.value)}
                          placeholder="e.g. 75% anxiety reduction within 10 days"
                          className="w-full h-12 sm:h-13 px-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs sm:text-sm text-slate-800 dark:text-zinc-100 focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F] transition-all outline-none placeholder-slate-450 dark:placeholder-zinc-650"
                        />
                      </div>

                      {/* Rating selection (Stars) */}
                      <div className="space-y-2 p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/60 text-center">
                        <p className="text-[10px] sm:text-xs font-mono font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400">Wellness Impact Rating</p>
                        <div className="flex justify-center gap-2">
                          {[1, 2, 3, 4, 5].map((starVal) => (
                            <button
                              key={starVal}
                              type="button"
                              onClick={() => setFormRating(starVal)}
                              className="text-amber-400 hover:scale-110 active:scale-95 transition-all outline-none cursor-pointer"
                            >
                              <Star size={22} fill={formRating >= starVal ? "currentColor" : "none"} className="stroke-amber-450" />
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Review Text */}
                      <div className="space-y-1.5 text-left">
                        <label className="text-[10px] sm:text-xs font-mono font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300">Describe Your Experience</label>
                        <textarea 
                          value={formText}
                          onChange={(e) => setFormText(e.target.value)}
                          placeholder="Share how conversational AI supported your wellness, helped calm panic or burnout, or provided daily stability..."
                          maxLength={350}
                          rows={6}
                          className="w-full min-h-[140px] sm:min-h-[185px] p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs sm:text-sm text-slate-850 dark:text-zinc-100 focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F] transition-all outline-none leading-relaxed resize-none placeholder-slate-400 dark:placeholder-zinc-600"
                        />
                        <div className="text-right text-[9px] sm:text-[10px] font-mono text-slate-500 mt-1 dark:text-zinc-500">
                          {formText.length}/350 characters
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={!formText.trim()}
                        className={`w-full h-13 sm:h-14 md:h-15 rounded-xl text-white font-black uppercase text-xs tracking-widest shadow-sm flex items-center justify-center gap-2.5 cursor-pointer transition-all ${formText.trim() ? "bg-[#2D6A4F] hover:bg-[#204F3B]" : "bg-slate-200 dark:bg-zinc-800 text-slate-400 dark:text-zinc-600 cursor-not-allowed"}`}
                      >
                        <Heart size={14} fill="currentColor" /> Publish Experience
                      </button>
                    </form>
                  </div>

                  {/* Right Experience Feed Column */}
                  <div className="lg:col-span-7 space-y-6">
                    {/* Focus Filter Pills */}
                    <div className="flex flex-wrap gap-2 pb-2 border-b border-slate-100 dark:border-zinc-800/40">
                      {["All", "Burnout De-escalation", "Academic Stress", "Clinical Perspective", "Mindfulness & Well-being", "Anxiety Relief"].map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setSelectedFilter(cat)}
                          className={`px-3 py-1.5 rounded-lg text-[9px] font-mono uppercase font-black tracking-wider transition-all cursor-pointer ${selectedFilter === cat ? "bg-[#2D6A4F] text-white" : "bg-slate-100 dark:bg-zinc-800/80 text-slate-500 dark:text-zinc-400 hover:bg-[#E8F0EC] hover:text-[#2D6A4F]"}`}
                        >
                          {cat === "All" ? "All Focus Areas" : cat}
                        </button>
                      ))}
                    </div>

                    {/* Active Reviews Feed */}
                    <div className="space-y-4 font-sans">
                      {reviews.filter(r => selectedFilter === "All" || r.category === selectedFilter).length === 0 ? (
                        <div className="p-12 rounded-3xl bg-slate-50 dark:bg-zinc-850/40 border border-slate-100 dark:border-zinc-800 text-center space-y-2">
                          <p className="text-sm font-bold text-slate-500 dark:text-zinc-450">No reports logged under this focus area yet</p>
                          <p className="text-xs text-slate-400 dark:text-zinc-500">Be the first to submit a positive outcome report above.</p>
                        </div>
                      ) : (
                        reviews.filter(r => selectedFilter === "All" || r.category === selectedFilter).map((review) => (
                          <div 
                            key={review.id} 
                            className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/60 hover:border-[#2D6A4F]/25 shadow-sm space-y-4 hover:shadow-md transition-all duration-300"
                          >
                            <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-display font-black text-slate-800 dark:text-white uppercase text-sm tracking-tight">{review.name}</h4>
                                  <span className="text-[9px] text-[#2D6A4F] dark:text-emerald-400 bg-[#E8F0EC]/80 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full font-bold">✓ Verified Log</span>
                                </div>
                                <p className="text-[10px] text-slate-400 dark:text-zinc-550 font-medium">{review.role} • {review.date}</p>
                              </div>
                              <div className="bg-[#E8F0EC] dark:bg-emerald-950/40 px-3 py-1 rounded-lg border border-emerald-500/10 shrink-0">
                                <span className="text-[9px] font-mono font-black uppercase text-[#2D6A4F] dark:text-emerald-400">{review.metric}</span>
                              </div>
                            </div>

                            <p className="text-xs text-slate-650 dark:text-zinc-350 leading-relaxed font-semibold">
                              "{review.text}"
                            </p>

                            <div className="pt-3 border-t border-slate-150 dark:border-zinc-800/50 flex items-center justify-between text-[10px]">
                              <span className="text-slate-450 dark:text-zinc-500 italic">Focus Scope: <strong className="text-[#2D6A4F] dark:text-emerald-400 not-italic uppercase font-mono font-bold">{review.category}</strong></span>
                              <div className="flex items-center gap-1 text-amber-500 animate-fade-in">
                                {Array.from({ length: review.rating }).map((_, idx) => (
                                  <Star key={idx} size={11} fill="currentColor" className="stroke-amber-450" />
                                ))}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-zinc-800 shrink-0 text-[10px] text-slate-400">
                <span className="font-mono tracking-wider text-slate-400 dark:text-zinc-550">AIRRA SOVEREIGN MENTAL HEALTH CHRONICLE • 2026</span>
                <button
                  onClick={() => setIsBrowseExperiencesOpen(false)}
                  className="px-6 py-2 rounded-xl bg-airra-text dark:bg-white text-airra-bg dark:text-zinc-950 font-black uppercase tracking-widest text-[9px] hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer"
                >
                  Close Ledger
                </button>
              </div>

            </motion.div>
          </div>
        )}

        {isInactivityModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsInactivityModalOpen(false);
                sessionStorage.setItem("airra_inactivity_modal_seen", "true");
              }}
              className="absolute inset-0 bg-zinc-950/80 backdrop-blur-md"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="relative w-full max-w-md rounded-[2.5rem] bg-white dark:bg-zinc-900 border border-airra-border dark:border-white/10 p-8 sm:p-10 shadow-airra-xl z-20 space-y-6 text-center"
            >
              {/* Header */}
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 text-[9px] font-mono font-black uppercase text-[#2D6A4F] dark:text-emerald-400 bg-[#E8F0EC]/80 dark:bg-emerald-950/40 px-3 py-1 rounded-full mx-auto">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Core Synthesis
                </div>
                <h3 className="text-xl sm:text-2xl font-display font-black uppercase tracking-tight text-slate-800 dark:text-white leading-tight">
                  Subscribe to Weekly Insights
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed font-sans font-medium px-2">
                  Take a moment to center yourself. Join thousands of subscribers receiving weekly meditations on digital balance, focus cultivation, and somatic privacy.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleModalNewsletterSubmit} className="space-y-4">
                <div className="space-y-2">
                  <input 
                    type="email" 
                    placeholder="E-mail Address"
                    value={modalEmail}
                    onChange={(e) => setModalEmail(e.target.value)}
                    disabled={modalStatus === "loading"}
                    className="w-full h-12 bg-slate-50 dark:bg-zinc-800 text-slate-850 dark:text-white rounded-xl px-4 text-xs font-black uppercase tracking-widest border border-airra-border dark:border-white/5 focus:outline-none focus:border-[#3DB88A] transition-all disabled:opacity-50 text-center"
                  />
                  {modalMessage && (
                    <motion.p 
                      initial={{ opacity: 0, y: -5 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      className={`text-[10px] font-bold uppercase tracking-wider ${
                        modalStatus === 'success' 
                          ? 'text-emerald-600 dark:text-emerald-400' 
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {modalMessage}
                    </motion.p>
                  )}
                </div>

                <div className="flex flex-col gap-2.5 pt-2">
                  <button 
                    type="submit"
                    disabled={modalStatus === "loading" || modalStatus === "success"}
                    className="w-full h-12 bg-[#3DB88A] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-95 transition-opacity disabled:opacity-50 shadow-md flex items-center justify-center gap-2"
                  >
                    {modalStatus === "loading" ? "Subscribing..." : modalStatus === "success" ? "Subscribed" : "Receive Sovereign Insights"}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setIsInactivityModalOpen(false);
                      sessionStorage.setItem("airra_inactivity_modal_seen", "true");
                    }}
                    className="text-[9px] text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200 transition-colors uppercase font-mono font-black tracking-widest pt-1"
                  >
                    No thanks, continue in silence
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Navbar() {
  const [scrolled, setScrolled] = React.useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-[100] px-4 sm:px-8 py-4 sm:py-10 transition-all duration-700 ${scrolled ? 'py-3 sm:py-6' : ''}`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 sm:gap-4 group shrink-0">
          <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-airra-text dark:bg-white flex items-center justify-center text-airra-bg dark:text-zinc-950 font-black italic shadow-airra-lg group-hover:scale-105 transition-all border border-white/10 ring-4 ring-airra-primary/5 text-base sm:text-2xl">A</div>
          <div className="flex flex-col">
            <span className="text-lg sm:text-2xl font-display font-black tracking-[-0.05em] dark:text-white uppercase leading-none">Airra</span>
            <span className="text-[8px] sm:text-[9px] font-black tracking-[0.3em] sm:tracking-[0.5em] text-airra-primary uppercase leading-tight mt-1 opacity-80">Neural Systems</span>
          </div>
        </Link>

        <div className="hidden lg:flex items-center gap-12 bg-white/60 dark:bg-zinc-900/40 backdrop-blur-3xl border border-white/20 dark:border-white/5 px-12 py-5 rounded-3xl shadow-airra-lg">
           {['Philosophy', 'Protocols', 'Science', 'Pricing'].map((item) => {
             const isScientific = item === 'Science';
             const href = isScientific ? '#scientific-foundations' : '#';
             return (
               <a 
                 key={item} 
                 href={href} 
                 className="text-[9px] font-black uppercase tracking-[0.3em] hover:text-airra-primary transition-all relative group/item"
               >
                 {item}
                 <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-airra-primary group-hover/item:w-full transition-all duration-500" />
               </a>
             );
           })}
        </div>

        <div className="flex items-center gap-3 sm:gap-8 shrink-0">
          <Link to="/login" className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-airra-muted hover:text-airra-text dark:hover:text-white transition-all hidden sm:block">Access Portal</Link>
          <Link to="/login" state={{ mode: 'signup' }} className="h-10 sm:h-14 px-4 sm:px-8 rounded-xl sm:rounded-2xl bg-airra-text dark:bg-white text-airra-bg dark:text-zinc-950 text-[8px] sm:text-[10px] font-black uppercase tracking-widest shadow-airra-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center border border-white/10">
            Join AIRRA
          </Link>
        </div>
      </div>
    </nav>
  );
}

function FeatureCard({ icon, title, label, desc, whitepaperUrl, whitepaperLabel }: { icon: React.ReactNode, title: string, label: string, desc: string, whitepaperUrl?: string, whitepaperLabel?: string }) {
  return (
    <motion.div 
      whileHover={{ y: -10 }}
      className="airra-card p-6 sm:p-10 md:p-12 space-y-6 sm:space-y-10 hover:bg-airra-bg/40 dark:hover:bg-white/5 transition-all duration-500 group relative overflow-hidden flex flex-col justify-between"
    >
      <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-airra-primary/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="space-y-6 sm:space-y-10">
        <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-[1.5rem] sm:rounded-[2rem] bg-airra-bg dark:bg-zinc-900 flex items-center justify-center text-airra-primary group-hover:scale-110 transition-transform duration-700 shadow-inner shrink-0">
          {React.cloneElement(icon as React.ReactElement, { className: "w-6 h-6 sm:w-10 sm:h-10" })}
        </div>
        <div className="space-y-4 sm:space-y-6">
          <div>
            <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.25em] sm:tracking-[0.3em] text-airra-muted mb-2">{label}</p>
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-display font-black text-airra-text dark:text-white uppercase tracking-tighter leading-none">{title}</h3>
          </div>
          <p className="text-airra-muted dark:text-airra-dark-muted font-medium text-sm sm:text-base md:text-lg leading-relaxed">{desc}</p>
        </div>
      </div>
      <div className="pt-6 border-t border-airra-border/20 dark:border-white/5 mt-auto">
         {whitepaperUrl ? (
           <a 
             href={whitepaperUrl}
             target="_blank"
             rel="noopener noreferrer"
             className="inline-flex items-center gap-2 sm:gap-3 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[#2D6A4F] dark:text-emerald-400 group-hover:gap-5 transition-all duration-500 font-extrabold hover:underline"
           >
             {whitepaperLabel || "Technical Whitepaper"} <ArrowRight size={14} />
           </a>
         ) : (
           <button className="flex items-center gap-2 sm:gap-3 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-airra-primary group-hover:gap-5 transition-all duration-500">
             {whitepaperLabel || "Technical Whitepaper"} <ArrowRight size={14} />
           </button>
         )}
      </div>
    </motion.div>
  );
}

function ExperienceCard({ img, title, duration, type, icon }: { img: string, title: string, duration: string, type: string, icon: React.ReactNode }) {
  return (
    <motion.div 
      whileHover={{ scale: 0.98 }}
      className="group cursor-pointer w-full"
    >
      <div className="relative aspect-[3/4] rounded-[2rem] sm:rounded-[3rem] overflow-hidden shadow-airra-lg border border-airra-border/50 dark:border-white/5">
        <img src={img} className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110" alt={title} referrerPolicy="no-referrer" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-70 group-hover:opacity-85 transition-opacity" />
        
        <div className="absolute top-4 left-4 sm:top-6 sm:left-6 flex gap-2 sm:gap-3">
           <div className="h-8 sm:h-10 px-3 sm:px-4 rounded-lg sm:rounded-xl airra-glass flex items-center justify-center text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-white">
             {duration}
           </div>
           <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl airra-glass flex items-center justify-center">
             {icon}
           </div>
        </div>

        <div className="absolute bottom-6 left-6 right-6 sm:bottom-10 sm:left-10 sm:right-10 flex items-end justify-between gap-4">
           <div className="min-w-0">
              <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-white/60 mb-1 sm:mb-2">{type}</p>
              <h4 className="text-xl sm:text-2xl md:text-3xl font-display font-black text-white uppercase tracking-tighter leading-tight truncate">{title}</h4>
           </div>
           <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-white/20 flex items-center justify-center bg-white/10 backdrop-blur-xl group-hover:bg-white group-hover:text-black transition-all shrink-0">
              <Play size={14} fill="currentColor" className="ml-0.5 sm:ml-1" />
           </div>
        </div>
      </div>
    </motion.div>
  );
}
