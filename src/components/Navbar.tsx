import { motion } from "motion/react";
import { Sparkles } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/src/context/AuthContext";

export default function Navbar() {
  const { user } = useAuth();
  const location = useLocation();

  // Hide main nav if in dashboard or any app shell page
  const appShellRoutes = ['/dashboard', '/journals', '/consultation', '/analytics', '/community', '/profile', '/onboarding'];
  const isExcluded = appShellRoutes.some(route => location.pathname.startsWith(route)) || location.pathname === '/login' || location.pathname === '/';
  if (isExcluded) return null;

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-8 mx-auto max-w-7xl"
    >
      <Link to="/" className="flex items-center gap-2 group">
        <div className="flex items-center justify-center p-2.5 rounded-2xl bg-airra-text dark:bg-white shadow-xl shadow-black/5 group-hover:scale-110 transition-all">
          <Sparkles className="w-5 h-5 text-airra-bg dark:text-zinc-950" />
        </div>
        <span className="text-xl font-display font-black tracking-tighter text-airra-text dark:text-white uppercase">Airra</span>
      </Link>

      <div className="hidden px-1 py-1 rounded-full md:flex airra-glass border-airra-border/50">
        <Link to="/" className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest transition-colors rounded-full hover:bg-airra-bg dark:hover:bg-zinc-800 text-airra-text dark:text-white">Home</Link>
        <Link to="/#features" className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest transition-colors rounded-full hover:bg-airra-bg dark:hover:bg-zinc-800 text-airra-muted">Features</Link>
        <Link to="/pricing" className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest transition-colors rounded-full hover:bg-airra-bg dark:hover:bg-zinc-800 text-airra-muted">Pricing</Link>
      </div>

      <div className="flex items-center gap-6">
        {user ? (
          <Link to="/dashboard" className="px-8 py-3.5 text-[10px] font-black uppercase tracking-[0.2em] text-airra-bg dark:text-zinc-950 bg-airra-text dark:bg-white rounded-2xl transition-all active:scale-95 shadow-airra-lg hover:opacity-90">
            Open App
          </Link>
        ) : (
          <>
            <Link 
              to="/login" 
              state={{ mode: 'login' }}
              className="text-[10px] font-black uppercase tracking-widest text-airra-muted hover:text-airra-text dark:hover:text-white transition-colors"
            >
              Login
            </Link>
            <Link 
              to="/login" 
              state={{ mode: 'signup' }}
              className="px-8 py-3.5 text-[10px] font-black uppercase tracking-[0.2em] text-airra-bg dark:text-zinc-950 bg-airra-text dark:bg-white rounded-2xl transition-all active:scale-95 shadow-airra-lg hover:opacity-90"
            >
              Sign Up
            </Link>
          </>
        )}
      </div>
    </motion.nav>
  );
}
