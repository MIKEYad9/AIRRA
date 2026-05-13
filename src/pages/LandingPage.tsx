import { motion } from "motion/react";
import { 
  Heart, 
  Brain, 
  ShieldCheck, 
  ArrowRight,
  ChevronRight,
  MessageCircle,
  Activity
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen atmosphere-bg overflow-clip">
      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center min-h-[90vh] px-6 text-center pt-24">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.6 }}
           className="inline-flex items-center gap-2 px-3 py-1 mb-8 text-xs font-medium rounded-full glass text-orange-200"
        >
          <span className="flex w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
          Powered by Gemini AI
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-4xl font-serif text-6xl leading-[1.1] md:text-8xl text-white text-glow mb-8"
        >
          Peace of mind, <br />
          <span className="italic font-normal opacity-70">powered by AI.</span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="max-w-2xl text-lg md:text-xl text-white/50 mb-12 font-light leading-relaxed"
        >
          Experience a new dimension of mental wellness. AIRRA combines empathetic AI with proven psychological frameworks to guide you toward a calmer, more balanced life.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <button className="flex items-center justify-center gap-2 px-8 py-4 text-white bg-orange-600 rounded-full group hover:bg-orange-500 transition-all shadow-xl shadow-orange-900/40">
            Start Your Journey 
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
          <button className="flex items-center justify-center gap-2 px-8 py-4 text-white rounded-full glass hover:bg-white/10 transition-all">
            See How It Works
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 1 }}
          className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-8 opacity-40 hover:opacity-100 transition-opacity"
        >
          {['Psychology Today', 'Nature', 'Well+Good', 'Healthline'].map((brand) => (
             <span key={brand} className="text-sm font-semibold tracking-widest uppercase">{brand}</span>
          ))}
        </motion.div>
      </section>

      {/* Feature Grid */}
      <section className="py-32 px-6 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-3 gap-6">
          <FeatureCard 
            icon={<Brain className="w-6 h-6" />}
            title="AI Empathy"
            description="Our models are trained on thousands of therapeutic conversations to provide genuinely caring support."
          />
          <FeatureCard 
            icon={<MessageCircle className="w-6 h-6" />}
            title="Real-time Chat"
            description="Available 24/7. No appointments, no waiting lists. Just immediate support when you need it."
            active
          />
          <FeatureCard 
            icon={<ShieldCheck className="w-6 h-6" />}
            title="Pure Privacy"
            description="Your data is end-to-end encrypted. We believe your mental health journey is for your eyes only."
          />
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description, active = false }: { icon: any, title: string, description: string, active?: boolean }) {
  return (
    <div className={`p-8 rounded-[32px] transition-all group ${active ? 'glass bg-orange-500/10 border-orange-500/20' : 'glass hover:bg-white/10'}`}>
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-colors ${active ? 'bg-orange-500 text-white' : 'bg-white/10 text-white/50 group-hover:text-white'}`}>
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-3">{title}</h3>
      <p className="text-white/40 leading-relaxed font-light">{description}</p>
      <div className="mt-6 flex items-center gap-1 text-sm font-medium text-orange-400 opacity-0 group-hover:opacity-100 transition-opacity">
        Learn more <ChevronRight className="w-4 h-4" />
      </div>
    </div>
  );
}
