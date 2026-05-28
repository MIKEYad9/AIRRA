import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Mail, X } from "lucide-react";
import { useLocation } from "react-router-dom";

export default function GlobalInactivityModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const location = useLocation();

  useEffect(() => {
    // If we are on the landing page, we rely on the specific 60s inactivity modal there.
    // If the modal was already seen/interacted with in this session, don't show it again.
    const isSeen = sessionStorage.getItem("airra_global_inactivity_modal_seen");
    if (isSeen === "true" || location.pathname === "/") {
      return;
    }

    let inactivityTimer: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      // Trigger after 5 minutes of inactivity (300,000 ms)
      inactivityTimer = setTimeout(() => {
        const alreadySeen = sessionStorage.getItem("airra_global_inactivity_modal_seen");
        if (alreadySeen !== "true" && location.pathname !== "/") {
          setIsOpen(true);
        }
      }, 300000); 
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
  }, [location.pathname]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setStatus("error");
      setMessage("Please enter a valid email address.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setStatus("error");
      setMessage("Please enter a valid email address.");
      return;
    }

    setStatus("loading");
    setMessage("");

    setTimeout(() => {
      const existing = localStorage.getItem("airra_subscribers");
      let list = [];
      if (existing) {
        try {
          list = JSON.parse(existing);
        } catch (err) {}
      }
      if (!list.includes(email.trim().toLowerCase())) {
        list.push(email.trim().toLowerCase());
        localStorage.setItem("airra_subscribers", JSON.stringify(list));
      }

      setStatus("success");
      setMessage("Somatic wellness subscription registered.");
      setEmail("");
      sessionStorage.setItem("airra_global_inactivity_modal_seen", "true");

      setTimeout(() => {
        setIsOpen(false);
      }, 2000);
    }, 800);
  };

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem("airra_global_inactivity_modal_seen", "true");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div id="global-inactivity-modal" className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-zinc-950/80 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="relative w-full max-w-lg rounded-[2.5rem] bg-white dark:bg-zinc-900 border border-airra-border dark:border-white/10 p-8 sm:p-10 shadow-airra-xl z-20 space-y-6 text-center"
          >
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-6 right-6 p-2 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Icon & Title */}
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 text-[9px] font-mono font-black uppercase text-[#2D6A4F] dark:text-emerald-400 bg-[#E8F0EC]/80 dark:bg-emerald-950/40 px-3.5 py-1.5 rounded-full mx-auto">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 animate-pulse" /> Wellness Chrono
              </div>
              <h3 className="text-xl sm:text-2xl font-display font-black uppercase tracking-tight text-slate-800 dark:text-white leading-tight">
                Align Your Digital Pace
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed font-sans font-medium px-4">
                You have been static for a while. Take a deep, intentional breath. Join the AIRRA circle to receive curated weekly insights into somatic science, neuro-ergonomics, and private mental hygiene.
              </p>
            </div>

            {/* Newsletter Subscription input */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  placeholder="Enter email address..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={status === "loading"}
                  className="w-full h-12 bg-slate-50 dark:bg-zinc-800 text-slate-850 dark:text-white rounded-xl pl-12 pr-4 text-xs font-bold uppercase tracking-widest border border-airra-border dark:border-white/10 focus:outline-none focus:border-[#3DB88A] transition-all disabled:opacity-50 text-left"
                />
              </div>

              {message && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`text-[10px] font-bold uppercase tracking-wider ${
                    status === "success"
                      ? "text-[#2D6A4F] dark:text-emerald-450"
                      : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {message}
                </motion.p>
              )}

              <div className="flex flex-col gap-2.5 pt-2">
                <button
                  type="submit"
                  disabled={status === "loading" || status === "success"}
                  className="w-full h-12 bg-[#3DB88A] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-95 transition-opacity disabled:opacity-50 shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  {status === "loading" ? (
                    "Registering..."
                  ) : status === "success" ? (
                    "Successfully Enrolled"
                  ) : (
                    <span>Weekly Somatic Dispatch</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleClose}
                  className="text-[9px] text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200 transition-colors uppercase font-mono font-black tracking-widest pt-1"
                >
                  No, preserve current flow
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
