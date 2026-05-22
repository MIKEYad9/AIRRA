import React from "react";
import Sidebar from "./Sidebar";
import { motion, AnimatePresence } from "motion/react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-airra-bg dark:bg-airra-dark-bg selection:bg-airra-primary/10">
      <Sidebar />
      <main className="transition-all duration-700 ease-in-out md:pl-48 pb-32 md:pb-20 min-h-screen relative overflow-x-hidden">
        <motion.div
           initial={{ opacity: 0, scale: 0.98 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
           className="max-w-[1600px] mx-auto px-8 md:px-20 pt-10 md:pt-24"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
