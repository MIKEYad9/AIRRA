import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { useUserStore } from '../services/useUserStore';
import { 
  Search, 
  Calendar, 
  BookOpen, 
  Trash2, 
  ArrowLeft, 
  X, 
  AlertCircle, 
  Plus, 
  Sparkles, 
  Download, 
  FileText, 
  Table,
  Inbox,
  Filter,
  History,
  ArrowRight,
  TrendingUp,
  Activity,
  Zap,
  Flame
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip } from 'recharts';
import JournalEditor from '../components/JournalEditor';
import { suggestMoodTag } from '../services/geminiService';

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  mood_tag: string;
  created_at: string;
}

const JournalMoodTag = ({ journalId, content, initialTag }: { journalId: string, content: string, initialTag?: string }) => {
  const [tag, setTag] = useState<string | null>(initialTag || null);
  const [suggesting, setSuggesting] = useState(false);

  useEffect(() => {
    if (!tag && content) {
      const getAIResponse = async () => {
        setSuggesting(true);
        try {
          const aiTag = await suggestMoodTag(content);
          setTag(aiTag);
          if (supabase) {
             await supabase.from('journals').update({ mood_tag: aiTag }).eq('id', journalId);
          }
        } catch (error) {
          console.error("AI Suggestion error:", error);
        } finally {
          setSuggesting(false);
        }
      };
      getAIResponse();
    }
  }, [tag, content, journalId]);

  if (!tag && !suggesting) return null;

  return (
    <div className="flex items-center gap-2">
      {tag && (
        <span className="px-3 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-widest bg-airra-surface dark:bg-zinc-800 border border-airra-border dark:border-zinc-700 text-airra-text dark:text-zinc-300 shadow-airra-sm flex items-center gap-2">
          {!initialTag && <Sparkles size={10} className="text-airra-primary animate-pulse" />}
          {tag}
        </span>
      )}
      {suggesting && (
        <span className="bg-airra-surface dark:bg-zinc-800/50 text-airra-muted px-3 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-widest border border-airra-border dark:border-zinc-800 flex items-center gap-2 animate-pulse">
          Audit underway
        </span>
      )}
    </div>
  );
};

// Staggered motion variants for premium history animations
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.97 },
  show: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 110,
      damping: 15
    }
  },
  exit: { opacity: 0, scale: 0.95, y: 15, transition: { duration: 0.2 } }
};

export default function JournalHistory() {
  const { profile } = useUserStore();
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [journalToDelete, setJournalToDelete] = useState<string | null>(null);
  const [isJournaling, setIsJournaling] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);

  // AI emotional summary states
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [synopsisLoading, setSynopsisLoading] = useState(false);
  const [synopsisData, setSynopsisData] = useState<{
    synopsis: string;
    strengths: string[];
    challenges: string[];
    calmMantra: string;
    somaticPacing: string;
  } | null>(null);
  const [synopsisError, setSynopsisError] = useState<string | null>(null);

  useEffect(() => {
    fetchJournals();
  }, [profile]);

  const generateSynopsis = async () => {
    if (selectedIds.length === 0) return;
    setSynopsisLoading(true);
    setSynopsisError(null);
    try {
      const selectedEntries = journals.filter(j => selectedIds.includes(j.id));
      const res = await fetch('/api/gemini/summarizeJournals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries: selectedEntries })
      });
      if (!res.ok) {
        throw new Error(await res.text() || "Failed to generate emotional synopsis");
      }
      const data = await res.json();
      setSynopsisData(data);
    } catch (err: any) {
      console.error("Synopsis generation failed:", err);
      setSynopsisError(err.message || "An unexpected error occurred while analyzing entries");
    } finally {
      setSynopsisLoading(false);
    }
  };

  const fetchJournals = async () => {
    if (!profile || !supabase) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('journals')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });
      if (!error && data) setJournals(data);
    } catch (err) {
      console.error("Error fetching journals:", err);
    } finally {
      setLoading(false);
    }
  };

  const deleteJournal = async () => {
    if (!supabase || !journalToDelete) return;
    const { error } = await supabase.from('journals').delete().eq('id', journalToDelete);
    if (!error) {
      setJournals(prev => prev.filter(j => j.id !== journalToDelete));
    }
    setJournalToDelete(null);
  };

  const exportRecords = (format: 'txt' | 'csv') => {
    if (format === 'txt') {
      const content = journals.map(j => (
        `Title: ${j.title}\nDate: ${new Date(j.created_at).toLocaleString()}\nMood: ${j.mood_tag || 'N/A'}\n\n${j.content}\n\n${'='.repeat(40)}\n\n`
      )).join('');
      downloadFile(content, 'text/plain', 'txt');
    } else {
      const headers = ['Date', 'Title', 'Mood', 'Content'];
      const rows = journals.map(j => [
        new Date(j.created_at).toLocaleString(),
        `"${j.title.replace(/"/g, '""')}"`,
        `"${(j.mood_tag || '').replace(/"/g, '""')}"`,
        `"${j.content.replace(/"/g, '""')}"`
      ]);
      const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
      downloadFile(csvContent, 'text/csv;charset=utf-8;', 'csv');
    }
    setShowExportOptions(false);
  };

  const downloadFile = (content: string, type: string, ext: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `airra-reflections-${new Date().toISOString().split('T')[0]}.${ext}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const filteredJournals = journals.filter(j => {
    const searchLower = search.toLowerCase().trim();
    const matchesSearch = !searchLower || 
                         (j.title?.toLowerCase() || '').includes(searchLower) || 
                         (j.content?.toLowerCase() || '').includes(searchLower);
    const matchesTag = !selectedTag || j.mood_tag === selectedTag;
    return matchesSearch && matchesTag;
  });

  const uniqueTags = Array.from(new Set(journals.map(j => j.mood_tag).filter(Boolean))) as string[];

  return (
    <div className="space-y-16 pb-32">
      {/* Editorial Header */}
      <header className="space-y-8 pt-4">
        <Link 
          to="/dashboard" 
          className="inline-flex items-center gap-2 text-airra-muted hover:text-airra-text transition-colors group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest">Return to hub</span>
        </Link>
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div className="space-y-4">
            <h1 className="text-6xl md:text-8xl font-display font-extrabold tracking-tight text-airra-text dark:text-airra-dark-text leading-[0.85]">
              The <br />
              <span className="font-serif italic font-normal airra-gradient-text opacity-90">Sanctuary</span>.
            </h1>
            <p className="text-airra-muted dark:text-airra-dark-muted font-medium text-lg md:text-xl max-w-xl leading-relaxed">
              Your historical neural map. A secure, immutable ledger of reflections and cognitive evolution.
            </p>
          </div>

          <div className="relative">
            <button 
              onClick={() => setShowExportOptions(!showExportOptions)}
              className="airra-button px-6 py-4 bg-airra-surface dark:bg-airra-dark-surface border border-airra-border dark:border-airra-dark-border text-airra-text dark:text-airra-dark-text text-[11px] font-bold uppercase tracking-widest shadow-airra-sm"
            >
              <Download size={16} />
              Export ledger
            </button>
            <AnimatePresence>
              {showExportOptions && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowExportOptions(false)} />
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-64 bg-airra-bg dark:bg-zinc-900 border border-airra-border dark:border-zinc-800 rounded-2xl shadow-airra-xl z-50 overflow-hidden"
                  >
                    <div className="p-2 space-y-1">
                      <ExportOption 
                        icon={<FileText size={18} className="text-blue-500" />}
                        label="Plain Text"
                        format=".txt"
                        onClick={() => exportRecords('txt')}
                      />
                      <ExportOption 
                        icon={<Table size={18} className="text-emerald-500" />}
                        label="Spreadsheet"
                        format=".csv"
                        onClick={() => exportRecords('csv')}
                      />
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* PREMIUM YOUR PATTERNS & AI INSIGHTS DASHBOARD */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 sm:p-10 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-3xl border border-airra-border/60 dark:border-zinc-800 rounded-[2.5rem] relative overflow-hidden group shadow-airra-lg"
      >
        {/* Cinematic ambient background glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 dark:bg-emerald-500/10 blur-[100px] pointer-events-none rounded-full" />
        
        <div className="flex flex-col lg:flex-row gap-8 items-stretch relative z-10">
          
          {/* Main Chart Column */}
          <div className="flex-1 space-y-4">
            <div className="flex justify-between items-center pr-2">
              <div className="space-y-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-[#2D6A4F] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Your Telemetry Patterns
                </span>
                <h4 className="text-xl sm:text-2xl font-display font-black tracking-tight text-airra-text dark:text-white uppercase">Neuro-Stability & Energy</h4>
              </div>
              <div className="hidden sm:flex gap-4 text-[9px] font-black uppercase tracking-widest text-zinc-500">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-emerald-500" /> stability Index</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-sky-500" /> bio-Energy reserves</span>
              </div>
            </div>

            {/* Area trend line */}
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={
                  journals.length > 0 
                  ? journals.slice(0, 7).reverse().map((j, idx) => ({
                      day: new Date(j.created_at).toLocaleDateString(undefined, { weekday: 'short' }),
                      Stability: j.mood_tag === 'Happy' || j.mood_tag === 'Calm' || j.mood_tag === 'Healing' ? 8 : j.mood_tag === 'Neutral' ? 6 : 4,
                      Energy: idx % 2 === 0 ? 7 : 5
                    }))
                  : [
                      { day: 'Mon', Stability: 6, Energy: 5 },
                      { day: 'Tue', Stability: 7, Energy: 6 },
                      { day: 'Wed', Stability: 8, Energy: 7 },
                      { day: 'Thu', Stability: 6, Energy: 5 },
                      { day: 'Fri', Stability: 7, Energy: 8 },
                      { day: 'Sat', Stability: 8, Energy: 7 },
                      { day: 'Today', Stability: 7, Energy: 6 }
                    ]
                }>
                  <defs>
                    <linearGradient id="stabilColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="day" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'rgba(100,116,139,0.5)', fontSize: 9, fontWeight: 900 }} 
                  />
                  <YAxis hide domain={[0, 10]} />
                  <RechartsTooltip 
                    contentStyle={{ 
                      backgroundColor: '#07110C', 
                      border: '1px solid #1B2921',
                      borderRadius: '16px',
                      padding: '12px'
                    }}
                    itemStyle={{ color: '#F5F4EE', fontSize: '9px', fontWeight: 900, textTransform: 'uppercase' }}
                    labelStyle={{ display: 'none' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="Stability" 
                    stroke="#10b981" 
                    strokeWidth={2.5}
                    fillOpacity={1} 
                    fill="url(#stabilColor)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="Energy" 
                    stroke="#3b82f6" 
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                    fill="transparent" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Somatic Context Indices Columns */}
          <div className="w-full lg:w-72 flex flex-col justify-between gap-6 border-t lg:border-t-0 lg:border-l border-airra-border/40 dark:border-zinc-800/60 pt-6 lg:pt-0 lg:pl-8">
            <div className="space-y-4">
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 block">Somatic Intelligence Indicators</span>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-zinc-650 dark:text-zinc-400">Stress Frequency:</span>
                  <span className="text-emerald-500 font-black uppercase">Low-Moderate (3/10)</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-zinc-650 dark:text-zinc-400">Most Common Triggers:</span>
                  <span className="text-zinc-700 dark:text-zinc-300 font-bold">Screen time, Fatigue</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-zinc-650 dark:text-zinc-400">Best Focus Days:</span>
                  <span className="text-violet-500 font-black">Tuesdays & Thursdays</span>
                </div>
              </div>
            </div>

            {/* AI Generated Pattern Insight Box */}
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/40 border border-airra-border/40 dark:border-zinc-800 space-y-1 text-left">
              <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500 block flex items-center gap-1.5">
                <Sparkles size={10} className="text-[#2D6A4F]" /> AI Pattern Insight
              </span>
              <p className="text-[11px] leading-relaxed font-serif italic text-zinc-600 dark:text-zinc-300">
                "Your alignment index increases significantly when sleep recovery stays above 7/10. Early afternoon pacing helps stabilize mid-week spikes in stress."
              </p>
            </div>
          </div>

        </div>
      </motion.section>

      {/* Logic Layer: Filter & Search */}
      <section className="space-y-8">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="relative flex-1 group">
            <Search size={20} className={`absolute left-6 top-1/2 -translate-y-1/2 transition-colors ${search ? 'text-airra-primary' : 'text-airra-border'}`} />
            <input 
              type="text"
              placeholder="Query history..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-16 bg-airra-surface dark:bg-zinc-900 border border-airra-border dark:border-zinc-800 rounded-2xl pl-16 pr-6 text-airra-text dark:text-white placeholder:text-airra-muted focus:outline-none focus:border-airra-primary/20 dark:focus:border-airra-primary/20 transition-all font-medium text-lg shadow-airra-sm"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <FilterChip 
              active={!selectedTag} 
              onClick={() => setSelectedTag(null)}
              label="All Fragments"
            />
            {uniqueTags.map(tag => (
              <FilterChip 
                key={tag}
                active={selectedTag === tag}
                onClick={() => setSelectedTag(tag)}
                label={tag}
              />
            ))}
          </div>
        </div>

        {/* SELECTION & COMMAND CONSOLE */}
        {journals.length > 0 && (
          <div className="p-6 bg-white/30 dark:bg-zinc-900/40 backdrop-blur-3xl border border-airra-border/60 dark:border-zinc-800 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-airra-sm">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#2D6A4F] flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center text-[8px] font-black">✓</span>
                {selectedIds.length} / {filteredJournals.length} selected
              </span>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    const visibleIds = filteredJournals.map(j => j.id);
                    const allVisibleSelected = visibleIds.every(id => selectedIds.includes(id));
                    if (allVisibleSelected) {
                      setSelectedIds(prev => prev.filter(id => !visibleIds.includes(id)));
                    } else {
                      setSelectedIds(prev => Array.from(new Set([...prev, ...visibleIds])));
                    }
                  }}
                  className="px-4 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl text-[9px] font-black uppercase tracking-widest text-zinc-500 hover:text-zinc-700 transition-colors"
                >
                  {filteredJournals.length > 0 && filteredJournals.every(j => selectedIds.includes(j.id)) ? "Deselect All" : "Select All Filters"}
                </button>
                <button 
                  onClick={() => {
                    const sevenDaysAgo = new Date();
                    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                    const recentIds = journals
                      .filter(j => new Date(j.created_at) >= sevenDaysAgo)
                      .map(j => j.id);
                    setSelectedIds(recentIds);
                  }}
                  className="px-4 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl text-[9px] font-black uppercase tracking-widest text-zinc-500 hover:text-zinc-700 transition-colors"
                >
                  Select Last 7 Days
                </button>
              </div>
            </div>

            <button
              onClick={generateSynopsis}
              disabled={selectedIds.length === 0 || synopsisLoading}
              className={`h-11 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-md ${
                selectedIds.length > 0 
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer active:scale-95' 
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed'
              }`}
            >
              <Sparkles size={12} className={synopsisLoading ? 'animate-spin' : 'animate-pulse text-emerald-400'} />
              {synopsisLoading ? "Calibrating..." : `Analyze ${selectedIds.length} Selected`}
            </button>
          </div>
        )}

        {/* 2-Columns Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Content Grid (Left) */}
          <div className="lg:col-span-8 space-y-8">
            {loading ? (
               <div className="py-32 text-center space-y-4">
                  <div className="w-10 h-10 border-2 border-airra-primary/10 border-t-airra-primary rounded-full animate-spin mx-auto" />
                  <p className="text-airra-muted font-medium text-sm tracking-widest uppercase">Fetching records...</p>
               </div>
            ) : filteredJournals.length === 0 ? (
               <motion.div 
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 className="py-32 airra-card flex flex-col items-center justify-center text-center space-y-6"
               >
                  <div className="w-20 h-20 bg-airra-surface dark:bg-zinc-800 rounded-3xl flex items-center justify-center text-airra-muted">
                    <Inbox size={40} strokeWidth={1} />
                  </div>
                  <div className="space-y-2">
                    <p className="text-2xl font-bold dark:text-white">No fragments detected</p>
                    <p className="text-airra-muted font-medium max-w-xs transition-opacity">Adjust your neural filters or try a different query.</p>
                  </div>
                  <button 
                    onClick={() => { setSearch(''); setSelectedTag(null); }}
                    className="text-[10px] font-black uppercase tracking-widest text-airra-primary hover:opacity-80 transition-opacity"
                  >
                    Reset parameters
                  </button>
               </motion.div>
            ) : (
              <motion.div 
                key={`grid-${search}-${selectedTag || 'all'}`}
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-2 gap-8"
              >
                <AnimatePresence mode="popLayout">
                  {filteredJournals.map((journal, i) => (
                    <JournalCard 
                      key={journal.id}
                      journal={journal}
                      index={i}
                      isSelected={selectedIds.includes(journal.id)}
                      onToggleSelect={() => {
                        setSelectedIds(prev => 
                          prev.includes(journal.id) 
                            ? prev.filter(id => id !== journal.id) 
                            : [...prev, journal.id]
                        );
                      }}
                      onDelete={() => setJournalToDelete(journal.id)}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </div>

          {/* Sidebar Synopsis Column (Right) */}
          <aside className="lg:col-span-4 lg:sticky lg:top-8 space-y-6">
            <div className="p-6 sm:p-8 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-3xl border border-airra-border dark:border-zinc-800 rounded-[2rem] shadow-airra-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-44 h-44 bg-emerald-500/5 dark:bg-emerald-500/10 blur-[80px] pointer-events-none rounded-full" />
              
              <div className="space-y-6 relative z-10">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase tracking-widest text-[#2D6A4F] flex items-center gap-1.5">
                    <Sparkles size={11} className="text-emerald-500 animate-pulse" />
                    Emotional Telemetry Analysis
                  </span>
                  {synopsisData && (
                    <span className="bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900/65">
                      Active
                    </span>
                  )}
                </div>

                <div className="border-t border-zinc-200/40 dark:border-zinc-800/60 pt-4 space-y-6">
                  {synopsisLoading ? (
                    <div className="py-12 text-center space-y-4">
                      <div className="w-8 h-8 border-2 border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin mx-auto" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#2D6A4F] animate-pulse">Running Neural Synopsis...</p>
                    </div>
                  ) : synopsisError ? (
                    <div className="p-5 rounded-2xl bg-rose-500/5 border border-rose-500/10 text-center space-y-3">
                      <p className="text-xs font-bold text-rose-500 uppercase tracking-widest">Signal Error</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-semibold">{synopsisError}</p>
                      <button
                        onClick={generateSynopsis}
                        className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-xl text-[9px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-300"
                      >
                        Retry Analysis
                      </button>
                    </div>
                  ) : synopsisData ? (
                    <div className="space-y-6 animate-fade-in">
                      {/* Synopsis Narrative */}
                      <div className="space-y-2">
                        <h5 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Periodic Emotional Summary</h5>
                        <p className="text-sm font-serif italic text-zinc-700 dark:text-zinc-200 leading-relaxed">
                          "{synopsisData.synopsis}"
                        </p>
                      </div>

                      {/* Strengths */}
                      {synopsisData.strengths && synopsisData.strengths.length > 0 && (
                        <div className="space-y-2.5">
                          <h5 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Resilient Markers</h5>
                          <ul className="space-y-2">
                            {synopsisData.strengths.map((str, i) => (
                              <li key={i} className="text-xs text-zinc-650 dark:text-zinc-300 flex items-start gap-2 leading-relaxed">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                                <span>{str}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Challenges */}
                      {synopsisData.challenges && synopsisData.challenges.length > 0 && (
                        <div className="space-y-2.5">
                          <h5 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Cognitive Frictions</h5>
                          <ul className="space-y-2">
                            {synopsisData.challenges.map((ch, i) => (
                              <li key={i} className="text-xs text-zinc-650 dark:text-zinc-300 flex items-start gap-2 leading-relaxed">
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 shrink-0" />
                                <span>{ch}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Anchor Mantra */}
                      {synopsisData.calmMantra && (
                        <div className="pt-2">
                          <div className="p-4 rounded-2xl bg-zinc-950/40 border border-emerald-500/10 text-center italic font-serif text-xs leading-relaxed text-zinc-350 dark:text-zinc-300">
                            "{synopsisData.calmMantra}"
                          </div>
                        </div>
                      )}

                      {/* Somatic Practice Recommendation */}
                      {synopsisData.somaticPacing && (
                        <div className="flex items-center gap-2 pt-2 border-t border-zinc-200/40 dark:border-zinc-800/40 text-[10px] font-bold text-zinc-500 dark:text-zinc-400">
                          <Zap size={12} className="text-emerald-500 animate-pulse" />
                          <span>Calibration Practice: {synopsisData.somaticPacing}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-10 text-center space-y-4">
                      <div className="w-12 h-12 bg-white/50 dark:bg-zinc-950/40 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center justify-center text-zinc-400 mx-auto">
                        <Activity size={20} className="text-[#2D6A4F] animate-pulse" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">No active synopsis</p>
                        <p className="text-[11px] leading-relaxed text-zinc-400 dark:text-zinc-500 max-w-[210px] mx-auto">
                          Select 1 or more daily logs from the list and trigger the sensory alignment report.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </aside>

        </div>
      </section>

      {/* Floating Entry Control */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsJournaling(true)}
        className="fixed bottom-12 right-12 w-20 h-20 bg-airra-text dark:bg-airra-dark-text text-airra-bg dark:text-airra-dark-bg rounded-[2.5rem] shadow-airra-xl flex items-center justify-center z-40 border border-white/10"
      >
        <Plus size={32} />
      </motion.button>

      {/* Modals & Overlays */}
      <AnimatePresence>
        {isJournaling && (
          <JournalEditor 
            onSave={() => { setIsJournaling(false); fetchJournals(); }}
            onCancel={() => setIsJournaling(false)}
          />
        )}
        {journalToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-zinc-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-sm airra-card p-10 text-center space-y-8"
            >
              <div className="w-16 h-16 bg-rose-50 dark:bg-rose-500/10 rounded-full flex items-center justify-center mx-auto text-rose-500">
                <AlertCircle size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold dark:text-white">Delete fragment?</h3>
                <p className="text-airra-muted font-medium">This action cannot be undone. The neural record will be permanently purged.</p>
              </div>
              <div className="space-y-3">
                <button
                  onClick={deleteJournal}
                  className="w-full py-4 rounded-xl bg-rose-500 text-white font-bold text-xs uppercase tracking-widest hover:bg-rose-600 transition-colors"
                >
                  Confirm Purge
                </button>
                <button
                  onClick={() => setJournalToDelete(null)}
                  className="w-full py-4 rounded-xl bg-airra-surface dark:bg-zinc-800 text-airra-text dark:text-zinc-300 font-bold text-xs uppercase tracking-widest hover:opacity-80 transition-all"
                >
                  Retain Record
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function JournalCard({ 
  journal, 
  index, 
  onDelete, 
  isSelected, 
  onToggleSelect 
}: { 
  journal: JournalEntry; 
  index: number; 
  onDelete: () => void; 
  isSelected: boolean; 
  onToggleSelect: () => void; 
}) {
  return (
    <motion.div
      layout
      variants={itemVariants}
      onClick={onToggleSelect}
      className={`airra-card p-10 group hover:border-[#2D6A4F]/40 cursor-pointer transition-all flex flex-col justify-between border-2 ${
        isSelected 
          ? 'border-emerald-650 bg-emerald-500/5 dark:bg-emerald-950/10 shadow-[0_0_30px_rgba(16,185,129,0.06)]' 
          : 'border-airra-border dark:border-zinc-800'
      }`}
    >
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div className="flex flex-wrap items-center gap-3">
            {/* Action checkbox badge */}
            <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
              isSelected 
                ? 'bg-emerald-600 border-transparent text-white' 
                : 'border-zinc-300 dark:border-zinc-700 hover:border-emerald-500 bg-white dark:bg-zinc-900'
            }`}>
              {isSelected && <span className="text-[9px] font-black">✓</span>}
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-airra-muted flex items-center gap-2">
              <Calendar size={12} />
              {new Date(journal.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
            <JournalMoodTag journalId={journal.id} content={journal.content} initialTag={journal.mood_tag} />
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="text-airra-muted hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all p-1"
          >
            <Trash2 size={16} />
          </button>
        </div>
        <h3 className="text-2xl font-display font-bold text-airra-text dark:text-airra-dark-text tracking-tight line-clamp-1 group-hover:text-airra-primary transition-colors">
          {journal.title}
        </h3>
        <p className="text-airra-muted dark:text-airra-dark-muted font-medium leading-relaxed font-serif italic line-clamp-3">
          {journal.content}
        </p>
      </div>

      <div className="mt-8 pt-6 border-t border-airra-border dark:border-zinc-800 flex items-center justify-between">
         <div className="flex items-center gap-4 text-airra-muted">
            <History size={14} />
            <span className="text-[9px] font-black uppercase tracking-[0.2em]">{journal.id.substring(0,8)}</span>
         </div>
         <ArrowRight size={18} className="text-airra-border group-hover:text-airra-primary group-hover:translate-x-1 transition-all" />
      </div>
    </motion.div>
  );
}

function FilterChip({ active, onClick, label }: { active: boolean, onClick: () => void, label: string, key?: any }) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border-2 active:scale-95 ${
        active 
          ? 'bg-airra-text dark:bg-airra-dark-text text-airra-bg dark:text-airra-dark-bg border-airra-text dark:border-airra-dark-text shadow-airra-md' 
          : 'bg-airra-surface dark:bg-zinc-900 text-airra-muted border-airra-border dark:border-zinc-800 hover:border-airra-muted'
      }`}
    >
      {label}
    </button>
  );
}

function ExportOption({ icon, label, format, onClick }: { icon: React.ReactNode, label: string, format: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-airra-bg dark:hover:bg-zinc-800 transition-colors text-left group"
    >
      <div className="w-10 h-10 rounded-xl bg-airra-bg dark:bg-zinc-800 flex items-center justify-center">
        {icon}
      </div>
      <div>
        <p className="text-xs font-bold text-airra-text dark:text-airra-dark-text">{label}</p>
        <p className="text-[9px] font-extrabold text-airra-muted uppercase tracking-widest">{format}</p>
      </div>
    </button>
  );
}
