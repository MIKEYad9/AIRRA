import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { Navigate, useLocation } from "react-router-dom";
import { LogIn, Mail, Lock, AlertCircle, Chrome, Sparkles, Fingerprint, Shield, ArrowRight } from "lucide-react";

export default function Login() {
  const { user, signInAsTestUser } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isSignUp, setIsSignUp] = useState(location.state?.mode === 'signup');
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (!event.origin.endsWith('.run.app') && !event.origin.includes('localhost')) return;

      if (event.data?.type === 'OAUTH_AUTH_SUCCESS' && event.data.hash) {
        setGoogleLoading(true);
        const hash = event.data.hash.substring(1);
        const params = new URLSearchParams(hash);
        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');
        
        if (access_token && refresh_token && supabase) {
          const { error: sessionError } = await supabase.auth.setSession({ access_token, refresh_token });
          if (sessionError) setError(sessionError.message);
        }
        setGoogleLoading(false);
      } else if (event.data?.type === 'OAUTH_AUTH_ERROR') {
        setError(event.data.message || "OAuth failed");
        setGoogleLoading(false);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  if (user) return <Navigate to="/dashboard" replace />;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setError("Cloud infrastructure synchronization failed.");
      return;
    }
    setLoading(true);
    setError(null);

    const redirectUrl = window.location.origin;

    try {
      const { error: authError } = isSignUp 
        ? await supabase.auth.signUp({ 
            email, 
            password,
            options: { emailRedirectTo: redirectUrl }
          })
        : await supabase.auth.signInWithPassword({ email, password });

      if (authError) {
        setError(authError.message);
      } else if (isSignUp) {
        setError("CONFIRMATION_SENT");
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!supabase) return;
    setGoogleLoading(true);
    const { data, error: oauthError } = await supabase.auth.signInWithOAuth({ 
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth-callback.html`,
        skipBrowserRedirect: true
      }
    });

    if (oauthError) {
      setError(oauthError.message);
      setGoogleLoading(false);
      return;
    }

    if (data?.url) {
      const popup = window.open(data.url, 'AIRRA Login', 'width=600,height=700');
      if (!popup) {
        setError("Popup blocked. Please authorize the window.");
        setGoogleLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-airra-bg dark:bg-zinc-950 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-airra-primary/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md airra-card p-10 md:p-12 shadow-airra-xl relative z-10 space-y-10"
      >
        <div className="text-center space-y-4">
          <div className="w-20 h-20 rounded-3xl bg-airra-text dark:bg-white mx-auto flex items-center justify-center text-airra-bg dark:text-zinc-900 shadow-airra-md">
            <Fingerprint size={40} strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-4xl font-display font-extrabold tracking-tighter dark:text-white uppercase">Vault Access</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-airra-muted">Neural Security Protocol 4.0</p>
          </div>
        </div>

        <div className="flex bg-airra-surface dark:bg-zinc-900 p-1.5 rounded-2xl border border-airra-border dark:border-zinc-800">
          <button 
            onClick={() => { setIsSignUp(false); setError(null); }}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!isSignUp ? 'bg-airra-bg dark:bg-zinc-800 text-airra-text dark:text-white shadow-airra-md' : 'text-airra-muted hover:text-airra-text'}`}
          >
            Authenticate
          </button>
          <button 
            onClick={() => { setIsSignUp(true); setError(null); }}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isSignUp ? 'bg-airra-bg dark:bg-zinc-800 text-airra-text dark:text-white shadow-airra-md' : 'text-airra-muted hover:text-airra-text'}`}
          >
            Register
          </button>
        </div>

        <div className="space-y-6">
          <button
            onClick={handleGoogleLogin}
            type="button"
            disabled={loading || googleLoading}
            className="w-full h-16 bg-airra-text dark:bg-white text-airra-bg dark:text-zinc-900 rounded-2xl flex items-center justify-center gap-4 hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50 text-[10px] uppercase font-black tracking-widest shadow-airra-xl"
          >
            {googleLoading ? (
              <div className="w-5 h-5 border-2 border-current/20 border-t-current rounded-full animate-spin" />
            ) : (
              <>
                <Chrome size={18} />
                Continuity with Google
              </>
            )}
          </button>

          <div className="flex items-center gap-4 text-airra-border">
            <div className="h-px flex-1 bg-current opacity-50" />
            <span className="text-[9px] uppercase tracking-[0.3em] font-black">Digital Identity</span>
            <div className="h-px flex-1 bg-current opacity-50" />
          </div>

          <AnimatePresence mode="wait">
            {error === "CONFIRMATION_SENT" ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-8 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 text-center space-y-4"
              >
                <div className="w-14 h-14 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto text-emerald-500">
                  <Mail size={24} />
                </div>
                <div className="space-y-1">
                   <h3 className="text-sm font-bold dark:text-zinc-200">Dispatched.</h3>
                   <p className="text-[11px] text-zinc-500 font-medium">Verify your portal via the link sent to your inbox.</p>
                </div>
              </motion.div>
            ) : (
              <motion.form 
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onSubmit={handleAuth} 
                className="space-y-4"
              >
                {error && (
                  <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10 text-[10px] font-bold uppercase tracking-widest text-red-500 flex items-center justify-center gap-2">
                    <AlertCircle size={14} />
                    {error}
                  </div>
                )}

                <div className="space-y-4">
                  <div className="relative group">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-airra-muted group-focus-within:text-airra-primary transition-colors" />
                    <input
                      type="email"
                      placeholder="Neural record ID"
                      className="w-full h-16 bg-airra-surface dark:bg-zinc-900 border border-airra-border dark:border-zinc-800 rounded-2xl pl-14 pr-6 text-airra-text dark:text-white focus:outline-none focus:border-airra-primary/20 transition-all font-bold text-sm tracking-tight"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="relative group">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-airra-muted group-focus-within:text-airra-primary transition-colors" />
                    <input
                      type="password"
                      placeholder="Access Key"
                      className="w-full h-16 bg-airra-surface dark:bg-zinc-900 border border-airra-border dark:border-zinc-800 rounded-2xl pl-14 pr-6 text-airra-text dark:text-white focus:outline-none focus:border-airra-primary/20 transition-all font-bold text-sm tracking-tight"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || googleLoading}
                  className="w-full h-18 rounded-2xl bg-airra-text dark:bg-white text-airra-bg dark:text-zinc-900 font-black text-xs uppercase tracking-widest shadow-airra-xl hover:opacity-90 transition-all flex items-center justify-center gap-4 group"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-current/20 border-t-current rounded-full animate-spin" />
                  ) : (
                    <>
                      {isSignUp ? "Initialize Profile" : "Synchronize Session"}
                      <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        <div className="pt-8 border-t border-airra-border dark:border-zinc-900 text-center space-y-6">
          <p className="text-[10px] font-black text-airra-muted uppercase tracking-[0.4em]">Sandbox Environment</p>
          <button
            onClick={() => signInAsTestUser()}
            className="w-full h-16 rounded-2xl border-2 border-dashed border-airra-border dark:border-zinc-800 text-airra-muted hover:text-airra-text hover:border-airra-primary transition-all text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-4 group"
          >
            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse group-hover:scale-125 transition-transform" />
            Guest Sequence
          </button>
        </div>
      </motion.div>
    </div>
  );
}
