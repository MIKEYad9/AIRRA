import { motion } from "motion/react";
import { Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 mx-auto max-w-7xl"
    >
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center p-2 rounded-xl bg-gradient-to-br from-orange-500 to-rose-500 shadow-lg shadow-orange-500/20">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-semibold tracking-tight text-white">AIRRA</span>
      </div>

      <div className="hidden px-1 py-1 rounded-full md:flex glass bg-white/5 border-white/10">
        <Link to="/" className="px-5 py-2 text-sm font-medium transition-colors rounded-full hover:bg-white/10">Home</Link>
        <Link to="#" className="px-5 py-2 text-sm font-medium transition-colors rounded-full hover:bg-white/10 text-white/60">Features</Link>
        <Link to="#" className="px-5 py-2 text-sm font-medium transition-colors rounded-full hover:bg-white/10 text-white/60">Pricing</Link>
      </div>

      <div className="flex items-center gap-4">
        <button className="px-5 py-2 text-sm font-medium transition-colors rounded-full hover:text-white text-white/70">
          Login
        </button>
        <button className="px-5 py-2.5 text-sm font-medium text-black bg-white rounded-full transition-transform active:scale-95 hover:bg-white/90">
          Get Started
        </button>
      </div>
    </motion.nav>
  );
}
