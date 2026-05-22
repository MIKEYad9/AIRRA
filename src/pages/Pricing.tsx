import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/src/lib/supabase";
import { useAuth } from "@/src/context/AuthContext";
import { useUserStore } from "@/src/services/useUserStore";
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
