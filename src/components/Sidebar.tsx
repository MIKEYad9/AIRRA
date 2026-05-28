import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  TrendingUp, 
  Heart, 
  User, 
  LogOut, 
  Moon,
  Sun,
  Sparkles,
  Feather,
  Wind,
  Workflow
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { signOut } = useAuth();
  const location = useLocation();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    if (newTheme) {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
    }
  };

  const navItems = [
    { to: "/dashboard", icon: <LayoutDashboard />, label: "Pulse" },
    { to: "/workspace", icon: <Workflow />, label: "Sync" },
    { to: "/journals", icon: <Feather />, label: "Log" },
    { to: "/experience", icon: <Wind />, label: "Zen" },
    { to: "/community", icon: <Users />, label: "Circle" },
    { to: "/analytics", icon: <TrendingUp />, label: "Metrics" },
    { to: "/saved", icon: <Heart />, label: "Saved" },
    { to: "/profile", icon: <User />, label: "Identity" },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed left-10 top-10 bottom-10 w-28 flex-col items-center py-6 bg-white/40 dark:bg-airra-dark-forest/40 backdrop-blur-3xl border border-airra-border/50 dark:border-white/5 rounded-[44px] z-50 shadow-airra-xl overflow-hidden">
        <div className="mb-4 text-airra-text dark:text-white animate-float flex-shrink-0">
           <div className="w-12 h-12 rounded-2xl bg-airra-text dark:bg-white shadow-airra-md flex items-center justify-center text-airra-bg dark:text-zinc-950 font-black italic text-xl">
              A
           </div>
        </div>

        <nav className="flex-1 w-full flex flex-col gap-3 items-center overflow-y-auto scrollbar-hide py-2 px-3">
          {navItems.map((item) => (
            <SidebarItem 
              key={item.to} 
              to={item.to}
              icon={item.icon}
              label={item.label}
              active={location.pathname === item.to} 
            />
          ))}
        </nav>

        <div className="flex flex-col gap-4 pt-4 border-t border-airra-border/20 dark:border-white/5 flex-shrink-0 mt-auto w-full items-center">
          <button 
            onClick={toggleTheme}
            className="w-11 h-11 flex items-center justify-center rounded-2xl text-zinc-800 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all active:scale-90"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button 
            onClick={() => signOut()}
            className="w-11 h-11 flex items-center justify-center rounded-2xl text-zinc-800 dark:text-zinc-400 hover:text-rose-500 transition-all active:scale-90"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Mobile Nav Bar */}
      <nav className="md:hidden fixed bottom-6 left-4 right-4 h-20 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-3xl border border-white/20 dark:border-zinc-800/10 shadow-airra-xl rounded-[28px] z-50 flex items-center justify-between px-2.5">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <Link 
              key={item.to} 
              to={item.to} 
              className={`flex-1 flex flex-col items-center gap-1 transition-all duration-300 ${isActive ? 'text-emerald-500 dark:text-emerald-400 font-extrabold' : 'text-zinc-800 dark:text-zinc-400'}`}
            >
              <div className={`p-2 rounded-xl transition-all ${isActive ? 'bg-emerald-500/10 dark:bg-emerald-400/10 scale-[1.08] shadow-inner border border-emerald-400/20' : ''}`}>
                {React.cloneElement(item.icon as React.ReactElement, { size: 18 })}
              </div>
            </Link>
          );
        })}
      </nav>
    </>
  );
}

function SidebarItem({ to, icon, label, active }: { to: string, icon: React.ReactNode, label: string, active: boolean, key?: string }) {
  return (
    <Link 
      to={to} 
      className="group relative"
    >
      <div className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all duration-500 ${
        active 
          ? 'bg-airra-text dark:bg-white text-airra-bg dark:text-zinc-950 shadow-airra-lg scale-110' 
          : 'text-zinc-800 dark:text-zinc-400 hover:text-airra-text dark:hover:text-white hover:bg-white dark:hover:bg-zinc-800'
      }`}>
        {React.cloneElement(icon as React.ReactElement, { size: 20 })}
      </div>
      
      {/* Tooltip */}
      <div className="absolute left-[calc(100%+16px)] top-1/2 -translate-y-1/2 px-4 py-2 bg-airra-text dark:bg-white text-airra-bg dark:text-zinc-950 text-[9px] font-black tracking-[0.2em] uppercase rounded-xl opacity-0 group-hover:opacity-100 translate-x-[-10px] group-hover:translate-x-0 transition-all pointer-events-none hidden md:block shadow-airra-xl z-[60]">
        {label}
      </div>
    </Link>
  );
}
