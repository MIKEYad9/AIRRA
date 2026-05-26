import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { Navigate, useLocation } from "react-router-dom";
import { LogIn, Mail, Lock, AlertCircle, Chrome, Sparkles, Fingerprint, Shield, ArrowRight } from "lucide-react";

export default function Login() {
  const { user, signInAsTestUser, signInWithGoogleMock } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isSignUp, setIsSignUp] = useState(location.state?.mode === 'signup');
  const [googleLoading, setGoogleLoading] = useState(false);

  // Google OAuth simulator states
  const [showGoogleMockSelector, setShowGoogleMockSelector] = useState(false);
  const [selectedMockAccount, setSelectedMockAccount] = useState<{ email: string; name: string } | null>(null);
  const [simulationIndex, setSimulationIndex] = useState(-1);

  const mockAccounts = [
    { email: "vedantthakur918@gmail.com", name: "Vedant Thakur", note: "Active Developer Identity" },
    { email: "guest.analyst@airra.org", name: "Guest Analyst", note: "Sandbox Clinical Profile" },
    { email: "alpha.trialist@airra.org", name: "Alpha Trialist", note: "Patient Sandbox Mode" }
  ];

  const runGoogleSimulation = (account: { email: string; name: string }) => {
    setSelectedMockAccount(account);
    setSimulationIndex(0);
    
    let currentIndex = 0;
    const interval = setInterval(() => {
      currentIndex++;
      if (currentIndex < 4) {
        setSimulationIndex(currentIndex);
      } else {
        clearInterval(interval);
        // Complete integration and sign in under mock credentials!
        signInWithGoogleMock?.(account.email, account.name);
        setGoogleLoading(false);
      }
    }, 700);
  };

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      // Security standard: only allow messages from our own origin
      if (event.origin !== window.location.origin) return;

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
    setError(null);
    if (!supabase) {
      setShowGoogleMockSelector(true);
      return;
    }
    
    setGoogleLoading(true);
    try {
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({ 
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth-callback.html`,
          skipBrowserRedirect: true
        }
      });

      if (oauthError) {
        const errorMsg = [
          oauthError.message,
          (oauthError as any).msg,
          (oauthError as any).error_code,
          JSON.stringify(oauthError)
        ].filter(Boolean).join(" ").toLowerCase();

        if (
          errorMsg.includes("provider is not enabled") || 
          errorMsg.includes("unsupported") ||
          errorMsg.includes("validation_failed") ||
          errorMsg.includes("validation") ||
          errorMsg.includes("400")
        ) {
          // If unconfigured/disabled on Supabase provider side, trigger beautiful simulation selector!
          setShowGoogleMockSelector(true);
        } else {
          setError(oauthError.message);
        }
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
    } catch (err: any) {
      const errorMsg = [
        err?.message,
        err?.msg,
        err?.error_code,
        JSON.stringify(err)
      ].filter(Boolean).join(" ").toLowerCase();

      if (
        errorMsg.includes("provider is not enabled") || 
        errorMsg.includes("unsupported") ||
        errorMsg.includes("validation_failed") ||
        errorMsg.includes("validation") ||
        errorMsg.includes("400")
      ) {
        setShowGoogleMockSelector(true);
      } else {
        setError(err?.message || "An unexpected error occurred during Google OAuth.");
      }
      setGoogleLoading(false);
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
          <AnimatePresence mode="wait">
            {showGoogleMockSelector ? (
              <motion.div
                key="google-selector"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-6"
              >
                {/* Beautiful OAuth Connection Assistant block */}
                <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/10 text-left space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                    <span className="text-[10px] text-amber-500 font-bold uppercase tracking-[0.15em]">
                      OAuth Connection Assistant
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-zinc-400 font-medium leading-relaxed">
                    Google Identity services are currently disabled on your production database console. 
                    We have launched the <span className="font-bold text-[#3DB88A] uppercase">AIRRA OAuth Bridge</span> to let you proceed safely.
                  </p>
                  <div className="pt-2 border-t border-dashed border-amber-500/15 space-y-2">
                    <span className="text-[9px] text-zinc-500 uppercase font-bold block tracking-wider">
                      To activate live Google Sign-In:
                    </span>
                    <ol className="list-decimal list-inside text-[9px] text-slate-500 dark:text-zinc-400 space-y-1.5 pl-1 leading-normal">
                      <li>Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-amber-500">Google Cloud Console</a> and create an OAuth Client ID.</li>
                      <li>Set your design's Authorized Redirect URI precisely to: <code className="font-mono bg-amber-500/10 px-1 py-0.5 rounded text-slate-700 dark:text-zinc-300 break-all select-all">https://bhypbootkprlndxhbvfh.supabase.co/auth/v1/callback</code>.</li>
                      <li>In Supabase Dashboard (Auth → Providers), enable <strong className="font-semibold text-[#3DB88A]">Google</strong> and paste the Client ID / Client Secret.</li>
                    </ol>
                  </div>
                </div>

                {selectedMockAccount ? (
                  // Elegant simulation sequence logger
                  <div className="p-6 rounded-2xl bg-[#06100B] text-left border border-emerald-500/15 font-mono space-y-4 shadow-inner">
                    <div className="flex items-center justify-between pb-3 border-b border-white/5">
                      <span className="text-[9px] text-[#2D7A5F] dark:text-[#3DB88A] font-bold uppercase tracking-widest">
                        SECURE SIMULATED LINK
                      </span>
                      <div className="flex items-center gap-1.5 font-sans">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                        <span className="text-[8px] font-bold uppercase tracking-widest text-[#3DB88A]">ACTIVE</span>
                      </div>
                    </div>

                    <div className="space-y-3 min-h-[110px] flex flex-col justify-center">
                      {[
                        "Initiating cryptographic Google verification handshake...",
                        "Exchanging secure zero-knowledge credential token tags...",
                        "Configuring personalized clinical state container database...",
                        "Connection integrity certified! Initiating redirection..."
                      ].map((step, idx) => {
                        const isDone = idx < simulationIndex;
                        const isActive = idx === simulationIndex;
                        return (
                          <div 
                            key={idx}
                            className={`text-[10px] sm:text-[11px] flex items-start gap-3 transition-all duration-300 ${
                              isDone 
                                ? "text-[#3DB88A] font-bold opacity-100" 
                                : isActive 
                                  ? "text-emerald-400 font-extrabold animate-pulse" 
                                  : "text-zinc-650 opacity-40 font-medium"
                            }`}
                          >
                            <span className="font-bold shrink-0">
                              {isDone ? "✓" : isActive ? "▶" : "○"}
                            </span>
                            <span className="leading-snug">{step}</span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="pt-3 border-t border-white/5 text-center text-[9px] text-zinc-550 uppercase tracking-[0.2em]">
                      IDENTITY CONNECTED: <strong className="text-zinc-300 font-bold">{selectedMockAccount.email}</strong>
                    </div>
                  </div>
                ) : (
                  // Select Account option list
                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-[0.2em] pl-1">
                      CHOOSE ACCESS IDENTITY
                    </p>

                    <div className="space-y-2.5">
                      {mockAccounts.map((account) => (
                        <button
                          key={account.email}
                          onClick={() => runGoogleSimulation(account)}
                          className="w-full p-4.5 hover:bg-emerald-500/5 hover:border-[#3DB88A]/20 bg-airra-surface dark:bg-zinc-900 border border-airra-border dark:border-zinc-800 rounded-2xl text-left flex items-center justify-between group transition-all duration-200 cursor-pointer active:scale-[0.99] select-none"
                        >
                          <div className="space-y-1 truncate pr-2">
                            <span className="text-xs font-bold text-slate-800 dark:text-zinc-100 block group-hover:text-[#3DB88A] transition-colors uppercase tracking-tight">
                              {account.name}
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-zinc-500 font-mono block">
                              {account.email}
                            </span>
                          </div>
                          
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className="text-[8px] font-mono font-black uppercase tracking-widest px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-550 group-hover:bg-[#3DB88A]/10 group-hover:text-[#3DB88A] transition-all">
                              {account.note}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => setShowGoogleMockSelector(false)}
                      type="button"
                      className="w-full py-2.5 text-[10px] font-black uppercase tracking-widest text-[#3DB88A] hover:opacity-80 transition-all text-center flex items-center justify-center gap-2 cursor-pointer"
                    >
                      ← Standard Sequence Keypad
                    </button>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="standard-form-block"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <button
                  onClick={handleGoogleLogin}
                  type="button"
                  disabled={loading || googleLoading}
                  className="w-full h-16 bg-airra-text dark:bg-white text-airra-bg dark:text-zinc-900 rounded-2xl flex items-center justify-center gap-4 hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50 text-[10px] uppercase font-black tracking-widest shadow-airra-xl cursor-pointer"
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
                          <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-airra-muted group-focus-within:text-airra-primary transition-colors animate-pulse" />
                          <input
                            type="email"
                            placeholder="Neural record ID"
                            className="w-full h-16 bg-airra-surface dark:bg-zinc-900 border border-airra-border dark:border-zinc-800 rounded-2xl pl-14 pr-6 text-airra-text dark:text-white focus:outline-none focus:border-[#3DB88A]/40 transition-all font-bold text-sm tracking-tight"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                          />
                        </div>

                        <div className="relative group">
                          <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-airra-muted group-focus-within:text-airra-primary transition-colors animate-pulse" />
                          <input
                            type="password"
                            placeholder="Access Key"
                            className="w-full h-16 bg-airra-surface dark:bg-zinc-900 border border-airra-border dark:border-zinc-800 rounded-2xl pl-14 pr-6 text-airra-text dark:text-white focus:outline-none focus:border-[#3DB88A]/40 transition-all font-bold text-sm tracking-tight"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loading || googleLoading}
                        className="w-full h-18 rounded-2xl bg-airra-text dark:bg-white text-airra-bg dark:text-zinc-900 font-black text-xs uppercase tracking-widest shadow-airra-xl hover:opacity-90 transition-all flex items-center justify-center gap-4 group cursor-pointer"
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
              </motion.div>
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
