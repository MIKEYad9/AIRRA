import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/src/lib/supabase";
import { useAuth } from "@/src/context/AuthContext";
import { useUserStore } from "@/src/services/useUserStore";
import { trackConversionFunnel } from "@/src/services/observability";
import { Check, ShieldCheck, Zap, Star, ArrowLeft, Cpu, Infinity, Sparkles } from "lucide-react";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const plans = [
  {
    name: "Standard Archive",
    id: "free",
    price: "0",
    period: "Forever",
    features: ["Limited AI sequences", "Neural mood logs", "Standard text portal"],
    desc: "Baseline cognitive maintenance.",
    icon: <Cpu size={24} />,
    color: "bg-airra-surface dark:bg-zinc-900 border-airra-border dark:border-zinc-800",
    button: "Synced",
    popular: false
  },
  {
    name: "Advanced Cognition",
    id: "premium",
    price: "499",
    period: "Monthly Cycle",
    features: ["Unlimited memory", "Deep-layer insights", "Audio-neural journaling", "Priority processing"],
    desc: "Optimized mental architecture.",
    icon: <Sparkles size={24} />,
    color: "bg-airra-text dark:bg-white text-airra-bg dark:text-zinc-950 shadow-airra-xl",
    button: "Initialize Access",
    popular: true
  },
  {
    name: "Infinite Resonance",
    id: "lifetime",
    price: "4999",
    period: "Entropy Lock",
    features: ["Global lifetime access", "Founding Node Status", "Exclusive module beta", "Zero maintenance fees"],
    desc: "The ultimate wellness pact.",
    icon: <Infinity size={24} />,
    color: "bg-airra-surface dark:bg-zinc-900 border-airra-border dark:border-zinc-800",
    button: "Permanent Sync",
    popular: false
  }
];

export default function Pricing() {
  const { user } = useAuth();
  const { subscription, setSubscription } = useUserStore();
  const [loading, setLoading] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    trackConversionFunnel("PRICING_VIEW", { currentPlan: subscription?.plan_type || "free" });
    // Dynamic Page-Level SEO Metadata Updates
    document.title = "AIRRA Pricing | AI Digital Wellbeing Plans & Premium Subscriptions";
    let metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", "Explore AIRRA Sanctuary pricing plans for immersive AI-powered digital wellbeing, neural logs, dynamic diagnostics, and priority premium interactions.");
    } else {
      const meta = document.createElement('meta');
      meta.name = "description";
      meta.content = "Explore AIRRA Sanctuary pricing plans for immersive AI-powered digital wellbeing, neural logs, dynamic diagnostics, and priority premium interactions.";
      document.head.appendChild(meta);
    }
  }, [subscription]);

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async (plan: typeof plans[0]) => {
    if (!user || !supabase) return;
    if (plan.id === 'free') return;
    
    setLoading(plan.id);
    trackConversionFunnel("UPGRADE_INITIALIZE", { planId: plan.id, price: plan.price });

    const res = await loadRazorpay();

    if (!res) {
      alert('Razorpay SDK failed to load. Are you online?');
      setLoading(null);
      return;
    }

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
      amount: parseInt(plan.price) * 100,
      currency: "INR",
      name: "AIRRA Sanctuary",
      description: `Neural Upgrade: ${plan.name}`,
      image: "/logo.png",
      handler: async function (response: any) {
        trackConversionFunnel("UPGRADE_SUCCESS", { planId: plan.id, price: plan.price });
        const { error } = await supabase
          .from('subscriptions')
          .insert({
            user_id: user.id,
            razorpay_payment_id: response.razorpay_payment_id,
            plan_type: plan.id,
            status: 'active',
            amount: parseInt(plan.price),
            expires_at: plan.id === 'lifetime' 
              ? new Date('2099-12-31').toISOString() 
              : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          });

        if (!error) {
           setSubscription({
             id: 'new',
             user_id: user.id,
             plan_type: plan.id as any,
             status: 'active',
             expires_at: null
           });
           navigate('/dashboard');
        }
      },
      prefill: {
        name: user.email?.split('@')[0],
        email: user.email,
      },
      theme: {
        color: "#2D6A4F",
      },
    };

    const paymentObject = new window.Razorpay(options);
    paymentObject.open();
    setLoading(null);
  };

  return (
    <div className="min-h-screen bg-airra-bg dark:bg-zinc-950 py-24 px-6 relative overflow-hidden">
      {/* Background Atmosphere */}
      <div className="absolute top-[-20%] left-[-10%] w-[80vw] h-[80vw] bg-airra-primary/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[60vw] h-[60vw] bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10 space-y-24">
        <header className="text-center space-y-8">
           <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-airra-muted hover:text-airra-text transition-colors group mb-8"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest">Return Home</span>
          </Link>
          <div className="space-y-4">
             <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-airra-surface dark:bg-zinc-900 border border-airra-border dark:border-zinc-800 text-airra-primary text-[10px] font-black uppercase tracking-widest">
              <Star size={12} className="fill-current" />
              Sovereign Access
            </div>
            <h1 className="text-6xl md:text-8xl font-display font-extrabold tracking-tighter text-airra-text dark:text-white uppercase leading-[0.85]">
              Neural <br />
              <span className="font-serif italic font-normal airra-gradient-text opacity-90">Subscription</span>.
            </h1>
            <p className="text-airra-muted dark:text-airra-dark-muted font-medium text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
               Secure your emotional architecture with a long-term wellness pact. Choose the cycle that resonates with your journey.
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, i) => {
            const isCurrent = subscription?.plan_type === plan.id;
            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`airra-card p-12 flex flex-col relative overflow-hidden group ${plan.color}`}
              >
                {plan.popular && (
                  <div className="absolute top-8 right-[-35px] rotate-45 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-[0.2em] px-10 py-1 shadow-xl">
                    Peak Focus
                  </div>
                )}
                
                <div className="mb-12 space-y-6">
                  <div className="w-14 h-14 rounded-2xl bg-current opacity-10 flex items-center justify-center">
                     {plan.icon}
                  </div>
                  <div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-2">{plan.name}</h3>
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-display font-black tracking-tighter">₹{plan.price}</span>
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{plan.period}</span>
                    </div>
                    <p className="text-sm font-medium mt-4 opacity-70 leading-relaxed">{plan.desc}</p>
                  </div>
                </div>

                <div className="space-y-4 mb-12 flex-grow">
                  {plan.features.map(f => (
                    <div key={f} className="flex gap-4 text-sm font-medium opacity-80">
                      <Check className="w-5 h-5 flex-shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-8 border-t border-current/10">
                  <button
                    onClick={() => handlePayment(plan)}
                    disabled={plan.id === 'free' || loading !== null || isCurrent}
                    className={`w-full h-16 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-3 ${
                      plan.id === 'premium' 
                      ? 'bg-airra-bg dark:bg-zinc-950 text-airra-text dark:text-white' 
                      : 'bg-airra-text dark:bg-white text-airra-bg dark:text-zinc-950'
                    } disabled:opacity-50`}
                  >
                    {loading === plan.id ? (
                       <div className="w-5 h-5 border-2 border-current/20 border-t-current rounded-full animate-spin" />
                    ) : (
                      <>
                        {isCurrent ? "Active Frequency" : plan.button}
                        {!isCurrent && plan.id !== 'free' && <ShieldCheck size={18} />}
                      </>
                    )}
                  </button>
                    {plan.id === 'free' && (
                       <p className="text-center text-[10px] font-bold uppercase tracking-widest mt-4 opacity-40">Baseline synchronization active.</p>
                    )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Rich SEO Content, Feature Comparison, and FAQ Section */}
        <div className="border-t border-airra-border/20 dark:border-white/5 pt-20 space-y-20">
          
          {/* Detailed Platform Benefits */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <span className="font-mono text-xs text-emerald-500 uppercase tracking-widest font-bold">Aesthetic Architecture</span>
              <h2 className="text-3xl md:text-5xl font-display font-extrabold tracking-tight text-airra-text dark:text-white uppercase">
                The Science of Digital Wellness
              </h2>
              <p className="text-zinc-700 dark:text-zinc-300 font-medium leading-relaxed">
                AIRRA is built from the ground up to restore cognitive balance in an over-connected world. Our plans provide users with dedicated server-side neural nodes that run our specialized non-clinical emotional sanctuary model. By choosing a plan, you support the continuous handcrafting and hosting of privacy-first, zero-surveillance artificial intelligence.
              </p>
              <p className="text-zinc-700 dark:text-zinc-300 font-medium leading-relaxed">
                Unlike standard hyperactive platforms designed to capture and monetize user attention, AIRRA aims to decrease screen fatigue through spacious design, silent focus tools, visual grounding modules, and highly restricted AI pacing. Every interaction has breathing room, ensuring you log off feeling centered rather than overstimulated.
              </p>
            </div>
            
            <div className="bg-airra-surface dark:bg-zinc-900 border border-airra-border/40 dark:border-zinc-800 rounded-[2.5rem] p-8 md:p-12 space-y-8">
              <h3 className="text-xl font-display font-black text-airra-text dark:text-white uppercase tracking-tight">Key Platform Foundations</h3>
              <ul className="space-y-6">
                <li className="flex gap-4">
                  <span className="font-mono text-emerald-500 font-bold">01</span>
                  <div>
                    <h4 className="font-bold text-zinc-900 dark:text-zinc-100">Cognitive Sovereignty</h4>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">Full control of your neural archives. No automated selling, mining, or public exposure of your diagnostic history.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="font-mono text-emerald-500 font-bold">02</span>
                  <div>
                    <h4 className="font-bold text-zinc-900 dark:text-zinc-100">Neural Mood Calibration</h4>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">Real-time tone customization matching biometric sentiment vectors for ultimate interactive resonance.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="font-mono text-emerald-500 font-bold">03</span>
                  <div>
                    <h4 className="font-bold text-zinc-900 dark:text-zinc-100">Pure Deceleration Hub</h4>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">No infinity scrolls, badges, gamification noise, or attention-grabbing notifications.</p>
                  </div>
                </li>
              </ul>
            </div>
          </section>

          {/* Feature Matrix Grid */}
          <section className="space-y-8">
            <div className="text-center space-y-4">
              <span className="font-mono text-xs text-emerald-500 uppercase tracking-widest font-bold">Comprehensive Outlines</span>
              <h2 className="text-2xl md:text-3xl font-display font-extrabold text-airra-text dark:text-white uppercase tracking-tight">Technical Feature Comparison Matrix</h2>
            </div>
            
            <div className="overflow-x-auto rounded-[2rem] border border-airra-border/40 dark:border-zinc-800 bg-airra-surface/50 dark:bg-zinc-900/40">
              <table className="w-full text-left border-collapse min-w-[600px] text-sm">
                <thead>
                  <tr className="border-b border-airra-border/40 dark:border-zinc-800 bg-airra-surface dark:bg-zinc-900">
                    <th className="p-6 font-display font-black uppercase text-xs tracking-wider">Features & Capabilities</th>
                    <th className="p-6 font-display font-black uppercase text-xs tracking-wider">Standard Archive</th>
                    <th className="p-6 font-display font-black uppercase text-xs tracking-wider text-emerald-500">Advanced Cognition</th>
                    <th className="p-6 font-display font-black uppercase text-xs tracking-wider">Infinite Resonance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-airra-border/40 dark:divide-zinc-800">
                  <tr>
                    <td className="p-6 font-bold">Daily AI Interaction sequences</td>
                    <td className="p-6 text-zinc-600 dark:text-zinc-400">10 daily queries</td>
                    <td className="p-6 font-bold text-emerald-500">Unlimited sessions</td>
                    <td className="p-6">Unlimited + Founding priority</td>
                  </tr>
                  <tr>
                    <td className="p-6 font-bold">Cognitive Mood Mapping Vector</td>
                    <td className="p-6 text-zinc-600 dark:text-zinc-400">Basic tracker</td>
                    <td className="p-6 font-bold text-emerald-500">Full multidimensional mapping</td>
                    <td className="p-6">Full historic trend logs</td>
                  </tr>
                  <tr>
                    <td className="p-6 font-bold">End-to-End Cryptography</td>
                    <td className="p-6">Standard AES-256</td>
                    <td className="p-6 font-bold text-emerald-500">Zero-knowledge host isolation</td>
                    <td className="p-6 font-bold">Lifetime absolute trust protocol</td>
                  </tr>
                  <tr>
                    <td className="p-6 font-bold">Audio & Spatial Meditation Loops</td>
                    <td className="p-6 text-zinc-600 dark:text-zinc-400">Incompatible</td>
                    <td className="p-6 font-bold text-emerald-500">Complete access catalog</td>
                    <td className="p-6">Complete + Custom requests</td>
                  </tr>
                  <tr>
                    <td className="p-6 font-bold">Priority Update Access Node</td>
                    <td className="p-6 text-zinc-600 dark:text-zinc-400">Standard cycle</td>
                    <td className="p-6 font-bold text-emerald-500">Active priority cluster</td>
                    <td className="p-6 font-extrabold text-emerald-400">Immediate beta-tier sync</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Deep-dive FAQ Accordion/Grid */}
          <section className="space-y-12">
            <div className="space-y-4 text-center">
              <span className="font-mono text-xs text-emerald-500 uppercase tracking-widest font-bold">Answering Questions</span>
              <h2 className="text-3xl md:text-5xl font-display font-extrabold text-zinc-900 dark:text-white uppercase tracking-tight">Frequently Asked Questions</h2>
              <p className="text-sm text-zinc-650 dark:text-zinc-400 max-w-xl mx-auto">Explore detailed technical and ethical disclosures regarding our subscription nodes and cognitive wellness structures.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-8 rounded-[2rem] bg-airra-surface/80 dark:bg-zinc-900 border border-airra-border/40 dark:border-zinc-800 space-y-3">
                <h4 className="font-display font-black text-base uppercase text-zinc-900 dark:text-white tracking-tight">How does AIRRA guarantee emotional cognitive privacy?</h4>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  AIRRA utilizes zero-knowledge database tunnels integrated over secure end-to-end cloud containers. Your personal expressions, cognitive logs, daily deep reflections, and session reports are entirely encapsulated at the host-node layer. No telemetry trackers, profiling cookies, or external advertising scripts are integrated. Our models run on decentralized non-coercive architectures where your data remains exclusively yours under standard AES-256 standards.
                </p>
              </div>

              <div className="p-8 rounded-[2rem] bg-airra-surface/80 dark:bg-zinc-900 border border-airra-border/40 dark:border-zinc-800 space-y-3">
                <h4 className="font-display font-black text-base uppercase text-zinc-900 dark:text-white tracking-tight">What are AI sequences and neural logs exactly?</h4>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  AI sequences are carefully modulated real-time token outputs that generate calming biofeedback loops, interactive wellness practices, and personalized meditation journeys. A neural mood log is a deep multidimensional vector representing your current psychological focus, sentiment trend, and ambient resonance, allowing the application to adjust color tones, advice frequency, and visual soundscapes automatically.
                </p>
              </div>

              <div className="p-8 rounded-[2rem] bg-airra-surface/80 dark:bg-zinc-900 border border-airra-border/40 dark:border-zinc-800 space-y-3">
                <h4 className="font-display font-black text-base uppercase text-zinc-900 dark:text-white tracking-tight">Is there any contracts, lock-ins, or payment latency?</h4>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  No. Our subscription models are designed for sovereign control. You may alter or decouple your active access frequency at any time directly through the profile interface. All transitions and premium updates processed via our Razorpay integration update instantly, initializing your elevated cognitive sequences across server nodes within seconds.
                </p>
              </div>

              <div className="p-8 rounded-[2rem] bg-airra-surface/80 dark:bg-zinc-900 border border-airra-border/40 dark:border-zinc-800 space-y-3">
                <h4 className="font-display font-black text-base uppercase text-zinc-900 dark:text-white tracking-tight">How do the wellness plans translate to mental longevity?</h4>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Wellness is more than an absence of stress—it is the active alignment of focus, breath, and digital interaction. Daily micro-reflections, intentional physical diagnostics, and custom journaling prompts help prevent screen-time fatigue and visual sensory overload typical of modern high-engagement communication platforms.
                </p>
              </div>
            </div>
            
            <div className="text-center pt-6">
              <p className="text-xs text-emerald-500 font-bold font-mono">STILL CURIOUS? CONTACT ACCESS PROTOCOLS AT WELCOME@AIRRA-BERYL.VERCEL.APP</p>
            </div>
          </section>
          
        </div>

        <footer className="text-center space-y-6 pt-12">
          <div className="flex items-center justify-center gap-6 grayscale opacity-40">
             <div className="h-6 w-px bg-airra-border" />
             <span className="text-[10px] font-black uppercase tracking-[0.4em] text-airra-muted flex items-center gap-3">
               <ShieldCheck size={16} />
               AES-256 Encryption Secured
             </span>
             <div className="h-6 w-px bg-airra-border" />
          </div>
          <p className="text-airra-muted text-[10px] font-bold uppercase tracking-widest max-w-md mx-auto leading-relaxed">
            Payment transactions processed via encrypted global nodes. Cycle synchronization takes 2-5 seconds.
          </p>
        </footer>
      </div>
    </div>
  );
}
