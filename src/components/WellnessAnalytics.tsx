import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { format, subDays, isSameDay } from 'date-fns';
import { supabase } from '../lib/supabase';
import { useUserStore } from '../services/useUserStore';
import { Brain, Heart, Zap, TrendingUp, Activity, BarChart3, Fingerprint, Moon, Target, ShieldCheck } from 'lucide-react';

const MOCK_SLEEP_DATA = [
  { day: 'Mon', shallow: 2, deep: 5, rem: 1 },
  { day: 'Tue', shallow: 3, deep: 4, rem: 1.5 },
  { day: 'Wed', shallow: 2.5, deep: 4.5, rem: 1.2 },
  { day: 'Thu', shallow: 2, deep: 6, rem: 1.8 },
  { day: 'Fri', shallow: 3, deep: 5, rem: 1.3 },
  { day: 'Sat', shallow: 4, deep: 3, rem: 2 },
  { day: 'Sun', shallow: 3, deep: 4, rem: 1.5 }
];

export default function WellnessAnalytics() {
  const { profile } = useUserStore();
  const [moodData, setMoodData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      if (!profile || !supabase) return;

      const sevenDaysAgo = subDays(new Date(), 7).toISOString();
      const { data: logs } = await supabase
        .from('mood_logs')
        .select('*')
        .eq('user_id', profile.id)
        .gte('created_at', sevenDaysAgo)
        .order('created_at', { ascending: true });

      if (logs) {
        const processed = Array.from({ length: 7 }).map((_, i) => {
          const date = subDays(new Date(), 6 - i);
          const dayLogs = logs.filter(log => isSameDay(new Date(log.created_at), date));
          
          return {
            date: format(date, 'MMM dd'),
            intensity: dayLogs.length > 0 
              ? dayLogs.reduce((acc, log) => acc + (log.intensity || 5), 0) / dayLogs.length 
              : 0,
            stress: Math.random() * 5 + 2 // Mock stress data
          };
        });
        setMoodData(processed);
      }
      setLoading(false);
    }
    fetchAnalytics();
  }, [profile]);

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center airra-card gap-6">
        <div className="w-12 h-12 border-4 border-airra-primary/20 border-t-airra-primary rounded-full animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-airra-muted">Synchronizing Neural Metrics</p>
      </div>
    );
  }

  return (
    <div className="space-y-16">
      {/* Topology Header */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 airra-card p-12 space-y-12">
           <div className="flex justify-between items-end">
              <div className="space-y-3">
                 <h3 className="text-4xl font-display font-black uppercase tracking-tighter">Neuro-Equilibrium</h3>
                 <p className="text-airra-muted font-medium text-lg italic">Longitudinal cognitive stability index</p>
              </div>
              <div className="text-right">
                 <div className="text-5xl font-display font-black text-airra-primary">84%</div>
                 <p className="text-[9px] font-black uppercase tracking-widest text-emerald-500">+12% vs last cycle</p>
              </div>
           </div>
           
           <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={moodData}>
                <defs>
                  <linearGradient id="colorIntensity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2D6A4F" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#2D6A4F" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'rgba(100,116,139,0.6)', fontSize: 10, fontWeight: 900 }}
                  dy={20}
                />
                <YAxis hide domain={[0, 10]} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#07110C', 
                    border: '1px solid #1B2921',
                    borderRadius: '24px',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
                    padding: '20px'
                  }}
                  itemStyle={{ color: '#F5F4EE', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em' }}
                  labelStyle={{ display: 'none' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="intensity" 
                  stroke="#2D6A4F" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorIntensity)" 
                  animationDuration={2000}
                />
                <Area 
                  type="monotone" 
                  dataKey="stress" 
                  stroke="#5C7C52" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  fill="transparent" 
                />
              </AreaChart>
            </ResponsiveContainer>
           </div>
        </div>

        <div className="space-y-10">
           <CardStat 
             icon={<Moon />} 
             title="Sleep Architecture" 
             value="7.4 hrs" 
             desc="Deep Sleep (N3) increased by 14%" 
             color="text-indigo-400"
           />
           <CardStat 
             icon={<Target />} 
             title="Focus Persistence" 
             value="122 min" 
             desc="Sustained attention peak at cycle 04" 
             color="text-amber-500"
           />
           <CardStat 
             icon={<Activity />} 
             title="HRV Symmetry" 
             value="78 ms" 
             desc="Parasympathetic dominance confirmed" 
             color="text-rose-400"
           />
        </div>
      </div>

      {/* Sleep & Focus Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
         <div className="airra-card p-12 space-y-10">
            <h4 className="text-2xl font-display font-black uppercase tracking-tighter flex items-center gap-4">
              <Moon size={24} className="text-indigo-400" /> Sleep Phases
            </h4>
            <div className="h-64 w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={MOCK_SLEEP_DATA}>
                     <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'rgba(100,116,139,0.5)', fontSize: 10, fontWeight: 900 }} />
                     <Tooltip 
                        contentStyle={{ backgroundColor: '#000', border: 'none', borderRadius: '16px' }}
                        itemStyle={{ color: '#fff', fontSize: '10px', fontWeight: 900 }}
                     />
                     <Bar dataKey="deep" stackId="a" fill="#2D6A4F" radius={[0, 0, 0, 0]} />
                     <Bar dataKey="rem" stackId="a" fill="#5C7C52" radius={[0, 0, 0, 0]} />
                     <Bar dataKey="shallow" stackId="a" fill="#8A9A8E" radius={[12, 12, 0, 0]} />
                  </BarChart>
               </ResponsiveContainer>
            </div>
            <div className="flex gap-8 justify-center pt-4">
               <LegendItem color="bg-[#2D6A4F]" label="Deep" />
               <LegendItem color="bg-[#5C7C52]" label="REM" />
               <LegendItem color="bg-[#8A9A8E]" label="Shallow" />
            </div>
         </div>

         <div className="airra-card p-12 space-y-10 bg-airra-text dark:bg-white text-airra-bg dark:text-zinc-950 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-60 h-60 bg-airra-primary blur-[100px] opacity-20 pointer-events-none" />
            <div className="relative z-10 space-y-10">
               <div className="flex justify-between items-center">
                  <h4 className="text-2xl font-display font-black uppercase tracking-tighter">AI Prediction Brief</h4>
                  <ShieldCheck size={24} className="opacity-40" />
               </div>
               <div className="space-y-6">
                  <p className="text-3xl font-serif italic leading-tight">
                    "Cognitive load analysis suggests a pending focus decay in cycle 08. Pre-empt with 5-minute <span className="airra-gradient-text">Neural Calibration</span>."
                  </p>
                  <div className="p-8 airra-bg dark:bg-zinc-800/20 rounded-3xl border border-white/10 space-y-4">
                     <span className="text-[10px] font-black uppercase tracking-widest text-airra-primary">Suggested Action</span>
                     <p className="text-sm font-medium leading-relaxed opacity-60">Initialize Gamma-wave binaural sync for 12 minutes to maintain equilibrium.</p>
                  </div>
               </div>
               <button className="w-full h-18 rounded-[1.5rem] bg-airra-bg dark:bg-zinc-950 text-airra-text dark:text-white text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-4 hover:scale-105 transition-all shadow-xl">
                  Execute Protocol <Zap size={16} />
               </button>
            </div>
         </div>
      </div>
    </div>
  );
}

function CardStat({ icon, title, value, desc, color }: { icon: React.ReactNode, title: string, value: string, desc: string, color: string }) {
  return (
    <div className="airra-card p-10 flex items-center gap-8 group hover:bg-white dark:hover:bg-zinc-900 transition-all duration-700">
      <div className={`w-16 h-16 rounded-[1.5rem] bg-airra-bg dark:bg-zinc-800 flex items-center justify-center ${color} shadow-inner group-hover:scale-110 transition-transform`}>
        {React.cloneElement(icon as React.ReactElement, { size: 28 })}
      </div>
      <div>
         <p className="text-[9px] font-black uppercase tracking-[0.2em] text-airra-muted mb-1">{title}</p>
         <div className="flex items-baseline gap-2">
            <span className="text-4xl font-display font-black text-airra-text dark:text-white leading-none">{value}</span>
         </div>
         <p className="text-[10px] font-medium text-airra-muted leading-tight mt-2">{desc}</p>
      </div>
    </div>
  );
}

function LegendItem({ color, label }: { color: string, label: string }) {
  return (
    <div className="flex items-center gap-2">
       <div className={`w-2 h-2 rounded-full ${color}`} />
       <span className="text-[9px] font-black uppercase tracking-widest text-airra-muted">{label}</span>
    </div>
  );
}
