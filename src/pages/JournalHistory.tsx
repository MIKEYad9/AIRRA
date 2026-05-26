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
  TrendingUp
} from 'lucide-react';
import { Link } from 'react-router-dom';
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

  useEffect(() => {
    fetchJournals();
  }, [profile]);

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

        {/* Dynamic Content Grid */}
        <div className="grid grid-cols-1 gap-8">
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
                    onDelete={() => setJournalToDelete(journal.id)}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
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

function JournalCard({ journal, index, onDelete }: { journal: JournalEntry, index: number, onDelete: () => void, key?: any }) {
  return (
    <motion.div
      layout
      variants={itemVariants}
      className="airra-card p-10 group hover:border-airra-primary/20 transition-all flex flex-col justify-between"
    >
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-airra-muted flex items-center gap-2">
              <Calendar size={12} />
              {new Date(journal.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
            <JournalMoodTag journalId={journal.id} content={journal.content} initialTag={journal.mood_tag} />
          </div>
          <button 
            onClick={onDelete}
            className="text-airra-muted hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
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
