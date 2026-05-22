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
  ArrowUpRight
} from "lucide-react";

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

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
      <section className="relative z-10 flex flex-col items-center justify-center min-h-[110vh] px-8 text-center pt-40 pb-20 overflow-hidden">
        <motion.div 
          style={{ scale: heroScale, opacity: heroOpacity }}
          className="flex flex-col items-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-3 px-8 py-3 mb-16 rounded-full airra-glass text-[10px] font-black uppercase tracking-[0.3em] text-airra-muted"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-airra-primary animate-pulse" />
            Neural Harmony Engine v5.0
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            className="max-w-[1500px] font-display font-black text-airra-hero leading-[0.85] text-airra-text dark:text-white mb-16 tracking-tighter uppercase"
          >
            Handcrafted <br />
            <span className="font-serif italic font-normal text-airra-primary dark:text-airra-dark-glow normal-case tracking-tight px-3 md:px-6 block md:inline-block md:translate-y-2">Serenity</span>.
          </motion.h1>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 2 }}
            className="mb-16 italic font-serif text-airra-primary/60 dark:text-airra-dark-glow/40 text-xl md:text-2xl"
          >
            "Within calmness lies the power to recreate yourself."
          </motion.div>

          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
            className="max-w-2xl text-xl md:text-2xl text-airra-muted dark:text-airra-dark-muted mb-20 font-medium leading-relaxed tracking-tight"
          >
            The world's most sophisticated AI wellness architect. Built for those who demand both clinical excellence and therapeutic luxury.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-8 w-full max-w-2xl"
          >
            <Link to="/login" state={{ mode: 'signup' }} className="flex-1 h-24 rounded-3xl bg-airra-text dark:bg-white text-airra-bg dark:text-zinc-950 shadow-airra-xl text-[11px] font-black uppercase tracking-[0.4em] flex items-center justify-center gap-6 hover:scale-[1.02] active:scale-[0.98] transition-all group overflow-hidden relative border border-white/10">
              <span className="relative z-10">Start The Journey</span>
              <ArrowRight size={18} className="relative z-10 group-hover:translate-x-3 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-r from-airra-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
            <button className="flex-1 h-24 rounded-3xl airra-glass border-2 border-airra-text/10 dark:border-white/10 text-airra-text dark:text-white text-[11px] font-black uppercase tracking-[0.4em] hover:bg-airra-text hover:text-airra-bg dark:hover:bg-white dark:hover:text-zinc-950 transition-all flex items-center justify-center gap-6 group">
              Explore AIRRA
              <ChevronRight size={18} className="group-hover:translate-x-2 transition-transform duration-500" />
            </button>
          </motion.div>
        </motion.div>

        {/* Ambient Floating Elements */}
        <div className="absolute bottom-0 left-0 right-0 h-96 bg-gradient-to-t from-airra-bg dark:from-airra-dark-bg to-transparent z-20 pointer-events-none" />
      </section>

      {/* Philosophy Section */}
      <section className="relative z-30 px-8 py-40 bg-airra-surface dark:bg-airra-dark-surface">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-32 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
              viewport={{ once: true }}
              className="space-y-12"
            >
              <div className="inline-flex items-center gap-4 px-5 py-2 rounded-full airra-bg dark:bg-airra-dark-bg border border-airra-border/50 dark:border-white/5 text-[10px] font-bold uppercase tracking-widest text-airra-primary">
                The AIRRA Thesis
              </div>
              <h2 className="text-6xl md:text-8xl font-display font-black leading-[0.85] uppercase">
                A Symphony <br /> of <span className="italic font-serif normal-case text-airra-primary">Intelligence</span>.
              </h2>
              <p className="text-2xl text-airra-muted dark:text-airra-dark-muted font-medium leading-relaxed">
                AIRRA isn't just an interface; it's a living emotional ecosystem. Through deep-neural analysis of your sentiment, we architect a sanctuary that evolves alongside your consciousness.
              </p>
              <div className="grid grid-cols-2 gap-10 pt-10">
                <div className="space-y-4">
                  <div className="text-5xl font-black text-airra-text dark:text-white leading-none">94%</div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-airra-muted">Emotional Precision</p>
                </div>
                <div className="space-y-4">
                  <div className="text-5xl font-black text-airra-text dark:text-white leading-none">0.2s</div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-airra-muted">Interaction Latency</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              viewport={{ once: true }}
              className="relative aspect-square"
            >
              <div className="absolute inset-0 bg-airra-primary/10 dark:bg-airra-dark-glow/10 blur-[120px] rounded-full animate-breathe" />
              <div className="relative h-full w-full rounded-[4rem] overflow-hidden border border-airra-border/50 dark:border-white/10 shadow-airra-xl">
                 <img 
                   src="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=1200" 
                   className="w-full h-full object-cover opacity-80 dark:opacity-60 scale-110 hover:scale-100 transition-transform duration-1000"
                   alt="Wellness Sanctuary"
                 />
                 <div className="absolute bottom-10 left-10 p-8 airra-glass max-w-sm">
                    <p className="text-sm font-medium text-airra-text dark:text-white leading-relaxed">
                       "The most profound shift in wellness technology I've experienced. It feels truly handcrafted for the soul."
                    </p>
                    <div className="mt-4 flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-airra-primary" />
                       <p className="text-[10px] font-black uppercase tracking-widest text-airra-muted">Alexander Thorne, VP of Design</p>
                    </div>
                 </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid: The Modern Core */}
      <section className="relative z-30 px-8 py-60">
        <div className="max-w-7xl mx-auto space-y-32">
          <div className="text-center space-y-8 max-w-3xl mx-auto">
            <h2 className="text-5xl md:text-7xl font-display font-black uppercase tracking-tighter">The Experience Arch.</h2>
            <p className="text-xl text-airra-muted dark:text-airra-dark-muted font-medium">Every module is a masterclass in psychological ergonomics.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <FeatureCard 
              icon={<Brain className="w-10 h-10" />}
              title="Neural Pulse"
              label="Real-time Sentiment"
              desc="Our proprietary LLM analyzes 20+ emotional vectors in your voice and text to map your cognitive climate."
            />
            <FeatureCard 
              icon={<Wind className="w-10 h-10" />}
              title="Atmosphere"
              label="Responsive Ambience"
              desc="Dynamic UI shifts in real-time, adjusting color, sound, and density to match your therapeutic needs."
            />
            <FeatureCard 
              icon={<ShieldCheck className="w-10 h-10" />}
              title="Sovereign"
              label="Clinical Privacy"
              desc="Biometric-only access and zero-knowledge storage ensure your sanctuary remains private and impenetrable."
            />
          </div>
        </div>
      </section>

      {/* Wellness & Experience Section */}
      <section className="relative z-30 px-8 py-40 border-t border-airra-border/50 dark:border-white/5">
        <div className="max-w-7xl mx-auto space-y-24">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-12">
            <div className="space-y-8">
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-airra-primary">Guided Experiences</div>
              <h2 className="text-6xl md:text-8xl font-display font-black uppercase leading-none">Curated <br /> Journeys.</h2>
            </div>
            <button className="h-16 px-10 rounded-2xl border border-airra-border dark:border-white/10 text-[10px] font-black uppercase tracking-widest text-airra-muted hover:text-airra-text dark:hover:text-white transition-all flex items-center gap-4">
              Browse All Experiences <ArrowRight size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
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
        </div>
      </section>

      {/* Community Section */}
      <section className="relative z-30 px-8 py-60 bg-airra-bg dark:bg-airra-dark-forest">
        <div className="max-w-4xl mx-auto text-center space-y-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="w-24 h-24 rounded-[2rem] bg-airra-primary dark:bg-airra-dark-glow mx-auto flex items-center justify-center text-white"
          >
            <Users size={40} />
          </motion.div>
          <div className="space-y-8">
            <h2 className="text-6xl md:text-8xl font-display font-black uppercase tracking-tighter leading-none">The Collective <br /> Consciousness.</h2>
            <p className="text-2xl text-airra-muted dark:text-airra-dark-muted font-medium max-w-2xl mx-auto leading-relaxed">
              Experience anonymous healing. Join thousands in safe, AI-moderated circles where empathy is the only currency.
            </p>
          </div>
          <button className="h-20 px-12 rounded-[2rem] bg-airra-text dark:bg-white text-airra-bg dark:text-zinc-950 text-xs font-black uppercase tracking-[0.25em] shadow-airra-xl hover:scale-105 transition-all">
            Join The Circle
          </button>
        </div>
      </section>

      {/* Footer: The Grand Exit */}
      <footer className="relative z-30 px-8 py-40 border-t border-airra-border/50 dark:border-white/5 bg-white dark:bg-airra-dark-bg">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-20">
          <div className="md:col-span-1 space-y-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-airra-text dark:bg-white flex items-center justify-center text-airra-bg dark:text-zinc-950 font-black italic">A</div>
              <span className="text-2xl font-display font-black uppercase tracking-tighter">Airra</span>
            </div>
            <p className="text-sm text-airra-muted dark:text-airra-dark-muted font-medium leading-relaxed">
              Handcrafting cognitive sanctuaries through deep-neural intelligence.
            </p>
            <div className="flex gap-6">
              <Link to="#" className="w-12 h-12 rounded-xl bg-airra-bg dark:bg-zinc-900 flex items-center justify-center text-airra-muted hover:text-airra-text dark:hover:text-white transition-all"><Star size={20} /></Link>
              <Link to="#" className="w-12 h-12 rounded-xl bg-airra-bg dark:bg-zinc-900 flex items-center justify-center text-airra-muted hover:text-airra-text dark:hover:text-white transition-all"><Compass size={20} /></Link>
              <Link to="#" className="w-12 h-12 rounded-xl bg-airra-bg dark:bg-zinc-900 flex items-center justify-center text-airra-muted hover:text-airra-text dark:hover:text-white transition-all"><Activity size={20} /></Link>
            </div>
          </div>

          <div className="space-y-10">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-airra-muted">Architecture</p>
            <nav className="flex flex-col gap-6">
               <Link to="#" className="text-sm font-black uppercase tracking-widest hover:text-airra-primary transition-all">Neuroscience</Link>
               <Link to="#" className="text-sm font-black uppercase tracking-widest hover:text-airra-primary transition-all">The AI Model</Link>
               <Link to="#" className="text-sm font-black uppercase tracking-widest hover:text-airra-primary transition-all">Sovereignty</Link>
               <Link to="#" className="text-sm font-black uppercase tracking-widest hover:text-airra-primary transition-all">Handcrafting</Link>
            </nav>
          </div>

          <div className="space-y-10">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-airra-muted">Sectors</p>
            <nav className="flex flex-col gap-6">
               <Link to="/consultation" className="text-sm font-black uppercase tracking-widest hover:text-airra-primary transition-all">Therapy Sync</Link>
               <Link to="/journals" className="text-sm font-black uppercase tracking-widest hover:text-airra-primary transition-all">The Journal</Link>
               <Link to="/analytics" className="text-sm font-black uppercase tracking-widest hover:text-airra-primary transition-all">Analytics Hub</Link>
               <Link to="/community" className="text-sm font-black uppercase tracking-widest hover:text-airra-primary transition-all">Collective</Link>
            </nav>
          </div>

          <div className="space-y-10">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-airra-muted">Synthesis</p>
            <div className="p-8 airra-bg dark:bg-zinc-900 rounded-[2rem] border border-airra-border dark:border-white/5 space-y-6">
               <p className="text-xs font-medium text-airra-muted leading-relaxed">Subscribe to our weekly philosophical meditation on technology and wellness.</p>
               <div className="relative">
                  <input 
                    type="email" 
                    placeholder="E-mail"
                    className="w-full h-14 bg-white dark:bg-zinc-800 rounded-xl px-6 text-xs font-black uppercase tracking-widest text-airra-text dark:text-white border border-airra-border dark:border-white/5 focus:outline-none focus:border-airra-primary transition-all"
                  />
                  <button className="absolute right-2 top-2 h-10 w-10 bg-airra-text dark:bg-white text-airra-bg dark:text-zinc-950 rounded-lg flex items-center justify-center hover:opacity-90 transition-opacity">
                    <ArrowUpRight size={18} />
                  </button>
               </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-40 flex flex-col md:flex-row items-center justify-between border-t border-airra-border/20 dark:border-white/5 gap-8">
           <p className="text-[10px] font-black uppercase tracking-[0.3em] text-airra-muted/40">© 2026 AIRRA NEURAL SYSTEMS. ALL EQUITY RESERVED.</p>
           <div className="flex gap-10">
              <Link to="#" className="text-[10px] font-black uppercase tracking-widest text-airra-muted/40 hover:text-airra-text transition-all">Security Protocol</Link>
              <Link to="#" className="text-[10px] font-black uppercase tracking-widest text-airra-muted/40 hover:text-airra-text transition-all">Ethical AI</Link>
              <Link to="#" className="text-[10px] font-black uppercase tracking-widest text-airra-muted/40 hover:text-airra-text transition-all">Privacy Sanctuary</Link>
           </div>
        </div>
      </footer>
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
    <nav className={`fixed top-0 left-0 right-0 z-[100] px-8 py-10 transition-all duration-700 ${scrolled ? 'py-6' : ''}`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-4 group">
          <div className="w-14 h-14 rounded-2xl bg-airra-text dark:bg-white flex items-center justify-center text-airra-bg dark:text-zinc-950 font-black italic shadow-airra-lg group-hover:scale-105 transition-all border border-white/10 ring-4 ring-airra-primary/5">A</div>
          <div className="flex flex-col">
            <span className="text-2xl font-display font-black tracking-[-0.05em] dark:text-white uppercase leading-none">Airra</span>
            <span className="text-[9px] font-black tracking-[0.5em] text-airra-primary uppercase leading-tight mt-1 opacity-80">Neural Systems</span>
          </div>
        </Link>

        <div className="hidden lg:flex items-center gap-12 bg-white/60 dark:bg-zinc-900/40 backdrop-blur-3xl border border-white/20 dark:border-white/5 px-12 py-5 rounded-3xl shadow-airra-lg">
           {['Philosophy', 'Protocols', 'Science', 'Pricing'].map((item) => (
             <Link key={item} to="#" className="text-[9px] font-black uppercase tracking-[0.3em] hover:text-airra-primary transition-all relative group/item">
               {item}
               <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-airra-primary group-hover/item:w-full transition-all duration-500" />
             </Link>
           ))}
        </div>

        <div className="flex items-center gap-8">
          <Link to="/login" className="text-[9px] font-black uppercase tracking-[0.3em] text-airra-muted hover:text-airra-text dark:hover:text-white transition-all hidden sm:block">Access Portal</Link>
          <Link to="/login" state={{ mode: 'signup' }} className="h-14 px-8 rounded-2xl bg-airra-text dark:bg-white text-airra-bg dark:text-zinc-950 text-[10px] font-black uppercase tracking-widest shadow-airra-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center border border-white/10">
            Join AIRRA
          </Link>
        </div>
      </div>
    </nav>
  );
}

function FeatureCard({ icon, title, label, desc }: { icon: React.ReactNode, title: string, label: string, desc: string }) {
  return (
    <motion.div 
      whileHover={{ y: -10 }}
      className="airra-card p-12 space-y-10 hover:bg-airra-bg/40 dark:hover:bg-white/5 transition-all duration-500 group relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-airra-primary/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="w-20 h-20 rounded-[2rem] bg-airra-bg dark:bg-zinc-900 flex items-center justify-center text-airra-primary group-hover:scale-110 transition-transform duration-700 shadow-inner">
        {React.cloneElement(icon as React.ReactElement, { className: "w-10 h-10" })}
      </div>
      <div className="space-y-6">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-airra-muted mb-2">{label}</p>
          <h3 className="text-4xl font-display font-black text-airra-text dark:text-white uppercase tracking-tighter leading-none">{title}</h3>
        </div>
        <p className="text-airra-muted dark:text-airra-dark-muted font-medium text-lg leading-relaxed">{desc}</p>
      </div>
      <div className="pt-6">
         <button className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-airra-primary group-hover:gap-5 transition-all duration-500">
           Technical Whitepaper <ArrowRight size={14} />
         </button>
      </div>
    </motion.div>
  );
}

function ExperienceCard({ img, title, duration, type, icon }: { img: string, title: string, duration: string, type: string, icon: React.ReactNode }) {
  return (
    <motion.div 
      whileHover={{ scale: 0.98 }}
      className="group cursor-pointer"
    >
      <div className="relative aspect-[3/4] rounded-[3rem] overflow-hidden shadow-airra-lg border border-airra-border/50 dark:border-white/5">
        <img src={img} className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110" alt={title} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
        
        <div className="absolute top-6 left-6 flex gap-3">
           <div className="h-10 px-4 rounded-xl airra-glass flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-white">
             {duration}
           </div>
           <div className="w-10 h-10 rounded-xl airra-glass flex items-center justify-center">
             {icon}
           </div>
        </div>

        <div className="absolute bottom-10 left-10 right-10 flex items-end justify-between">
           <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-2">{type}</p>
              <h4 className="text-3xl font-display font-black text-white uppercase tracking-tighter leading-none">{title}</h4>
           </div>
           <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center bg-white/10 backdrop-blur-xl group-hover:bg-white group-hover:text-black transition-all">
              <Play size={18} fill="currentColor" className="ml-1" />
           </div>
        </div>
      </div>
    </motion.div>
  );
}
