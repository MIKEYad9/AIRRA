import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  linkGoogleWorkspace, 
  getGoogleSheetValues, 
  getGoogleCalendarEvents, 
  getRecentGmailMessages,
  fetchSyncHistory,
  getActiveWorkspaceToken,
  getActiveFirebaseUser,
  auth
} from "../services/workspaceService";
import { 
  Database, 
  Chrome, 
  Calendar as CalendarIcon, 
  Mail, 
  FileSpreadsheet, 
  Activity, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle,
  Clock,
  ExternalLink,
  ChevronRight,
  UserCheck,
  Workflow
} from "lucide-react";

export default function WorkspacePortal() {
  const [loading, setLoading] = useState(false);
  const [workspaceUser, setWorkspaceUser] = useState<any>(null);
  const [tokenPresent, setTokenPresent] = useState(false);
  
  // App states
  const [syncLogs, setSyncLogs] = useState<any[]>([]);
  const [sheetId, setSheetId] = useState("");
  const [sheetRange, setSheetRange] = useState("Sheet1!A1:D10");
  const [sheetData, setSheetData] = useState<any>(null);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [gmailMessages, setGmailMessages] = useState<any[]>([]);

  // Errors / Success Messages
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Active Tab for features
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<"sheets" | "gmail" | "calendar" | "firestore">("sheets");

  useEffect(() => {
    // Check initial user authentication state
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setWorkspaceUser(user);
        setTokenPresent(!!getActiveWorkspaceToken());
        loadSyncLogs();
      } else {
        setWorkspaceUser(null);
        setTokenPresent(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const loadSyncLogs = async () => {
    try {
      const logs = await fetchSyncHistory();
      setSyncLogs(logs);
    } catch (err) {
      console.error("Failed loading sync logs", err);
    }
  };

  const handleConnect = async () => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const result = await linkGoogleWorkspace();
      setWorkspaceUser(result.user);
      setTokenPresent(true);
      setSuccessMsg("Connected to Google Workspace & registered in Firebase Firestore!");
      await loadSyncLogs();
    } catch (err: any) {
      setError(err?.message || "Workspace connection failed. Verify Google API OAuth configuration.");
    } finally {
      setLoading(false);
    }
  };

  const handleSyncSheets = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sheetId) {
      setError("Please provide a valid Google Spreadsheet ID.");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const data = await getGoogleSheetValues(sheetId, sheetRange);
      setSheetData(data);
      setSuccessMsg(`Successfully imported Google Sheets data! (${data.values?.length || 0} rows found)`);
      await loadSyncLogs();
    } catch (err: any) {
      setError(err?.message || "Failed to fetch Sheet values. Ensure Spreadsheet ID is correct and accessible.");
    } finally {
      setLoading(false);
    }
  };

  const handleSyncCalendar = async () => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const events = await getGoogleCalendarEvents();
      setCalendarEvents(events);
      setSuccessMsg(`Fetched ${events.length} upcoming events from primary Google Calendar!`);
      await loadSyncLogs();
    } catch (err: any) {
      setError(err?.message || "Failed retrieving Google Calendar events.");
    } finally {
      setLoading(false);
    }
  };

  const handleSyncGmail = async () => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const messages = await getRecentGmailMessages();
      setGmailMessages(messages);
      setSuccessMsg(`Retrieved ${messages.length} recent messages from Gmail account!`);
      await loadSyncLogs();
    } catch (err: any) {
      setError(err?.message || "Failed retrieving Gmail headers.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-16 pb-40 px-6 sm:px-10 page-container min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 relative">
      
      {/* Header Banner */}
      <header className="space-y-6 pt-4 text-left">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-[#3DB88A]/10 text-[#3DB88A] rounded-xl flex items-center justify-center animate-pulse">
                <Workflow className="w-5 h-5" />
              </span>
              <span className="text-[10px] font-mono tracking-[0.2em] uppercase font-bold text-[#3DB88A]">
                Dual Integration Hub
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-black tracking-tighter text-slate-900 dark:text-white uppercase">
              Workspace Portal
            </h1>
            <p className="text-xs md:text-sm text-slate-500 dark:text-zinc-400 font-medium max-w-2xl leading-relaxed">
              Synchronize your clinics, journal worksheets, and medical reminders in real-time. Power your Airra dashboard using live clinical records backed by Google Calendar, Gmail, Sheets, and Firebase Firestore.
            </p>
          </div>

          <div className="flex items-center gap-4">
            {workspaceUser ? (
              <div className="flex items-center gap-3.5 bg-white dark:bg-zinc-900 border border-emerald-500/10 dark:border-emerald-500/20 px-5 py-3 rounded-2xl shadow-sm">
                <img 
                  src={workspaceUser.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${workspaceUser.displayName}`}
                  alt="Profile" 
                  className="w-10 h-10 rounded-xl border border-emerald-500/25 shrink-0"
                />
                <div className="text-left">
                  <span className="text-[10px] font-black uppercase text-emerald-500 tracking-wider flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5" /> Synchronized
                  </span>
                  <p className="text-xs font-bold text-slate-800 dark:text-white leading-tight uppercase truncate max-w-[150px]">
                    {workspaceUser.displayName}
                  </p>
                </div>
              </div>
            ) : (
              <button
                onClick={handleConnect}
                disabled={loading}
                className="px-6 py-4.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all text-[11px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/15 cursor-pointer disabled:opacity-50 select-none"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Chrome className="w-4 h-4" />
                    Connect Google Identity
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Messages */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-5 bg-red-500/5 border border-red-500/25 rounded-2xl text-left flex items-start gap-3.5"
          >
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest block">Connection Log Fault</span>
              <p className="text-xs text-red-600/90 dark:text-red-400 font-mono leading-relaxed">{error}</p>
            </div>
          </motion.div>
        )}

        {successMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-5 bg-emerald-500/5 border border-emerald-550/25 rounded-2xl text-left flex items-start gap-4"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5 animate-bounce" />
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest block">Transaction Certified</span>
              <p className="text-xs text-slate-600 dark:text-zinc-300 font-medium leading-relaxed">{successMsg}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!workspaceUser && (
        <div className="p-10 text-center space-y-5 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 shadow-xl max-w-2xl mx-auto">
          <Workflow className="w-14 h-14 mx-auto text-slate-300 dark:text-zinc-700 animate-pulse" />
          <div className="space-y-2">
            <h3 className="text-lg font-bold uppercase tracking-tight text-slate-800 dark:text-white">Workspace Offline</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
              Access sheets, emails, calendar reminders, and cloud-backed logs. Please sign in with your Google identity to allocate secure access credentials.
            </p>
          </div>
          <button
            onClick={handleConnect}
            className="px-8 py-4.5 bg-slate-900 hover:bg-black dark:bg-white dark:text-zinc-950 text-white rounded-2xl flex items-center justify-center gap-3 mx-auto transition-all active:scale-95 text-[10px] font-black uppercase tracking-widest shadow-md cursor-pointer cursor-hand select-none"
          >
            <Chrome className="w-4 h-4" />
            Launch Secure Session
          </button>
        </div>
      )}

      {workspaceUser && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Navigation Control Column */}
          <div className="lg:col-span-3 space-y-4 text-left">
            <span className="text-[10px] font-mono tracking-[0.2em] font-black text-slate-400 dark:text-zinc-550 pl-1 uppercase">
              WORKSPACE SERVICES
            </span>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => { setActiveWorkspaceTab("sheets"); setError(null); }}
                className={`p-4 rounded-2xl flex items-center gap-3.5 transition-all text-left uppercase tracking-tight text-xs font-bold leading-none cursor-pointer border ${
                  activeWorkspaceTab === "sheets" 
                    ? "bg-[#3DB88A]/5 border-[#3DB88A] text-[#3DB88A]" 
                    : "bg-white dark:bg-zinc-900 border-slate-150 dark:border-zinc-850 hover:border-[#3DB88A]/40 text-slate-700 dark:text-zinc-300"
                }`}
              >
                <FileSpreadsheet className="w-4 h-4 shrink-0" />
                Google Sheets
              </button>

              <button
                onClick={() => { setActiveWorkspaceTab("gmail"); setError(null); }}
                className={`p-4 rounded-2xl flex items-center gap-3.5 transition-all text-left uppercase tracking-tight text-xs font-bold leading-none cursor-pointer border ${
                  activeWorkspaceTab === "gmail" 
                    ? "bg-[#3DB88A]/5 border-[#3DB88A] text-[#3DB88A]" 
                    : "bg-white dark:bg-zinc-900 border-slate-150 dark:border-zinc-850 hover:border-[#3DB88A]/40 text-slate-700 dark:text-zinc-300"
                }`}
              >
                <Mail className="w-4 h-4 shrink-0" />
                Gmail Records
              </button>

              <button
                onClick={() => { setActiveWorkspaceTab("calendar"); setError(null); }}
                className={`p-4 rounded-2xl flex items-center gap-3.5 transition-all text-left uppercase tracking-tight text-xs font-bold leading-none cursor-pointer border ${
                  activeWorkspaceTab === "calendar" 
                    ? "bg-[#3DB88A]/5 border-[#3DB88A] text-[#3DB88A]" 
                    : "bg-white dark:bg-zinc-900 border-slate-150 dark:border-zinc-850 hover:border-[#3DB88A]/40 text-slate-700 dark:text-zinc-300"
                }`}
              >
                <CalendarIcon className="w-4 h-4 shrink-0" />
                Calendar Slots
              </button>

              <button
                onClick={() => { setActiveWorkspaceTab("firestore"); setError(null); loadSyncLogs(); }}
                className={`p-4 rounded-2xl flex items-center gap-3.5 transition-all text-left uppercase tracking-tight text-xs font-bold leading-none cursor-pointer border ${
                  activeWorkspaceTab === "firestore" 
                    ? "bg-[#3DB88A]/05 border-[#3DB88A] text-[#3DB88A]" 
                    : "bg-white dark:bg-zinc-900 border-slate-150 dark:border-zinc-850 hover:border-[#3DB88A]/40 text-slate-700 dark:text-zinc-300"
                }`}
              >
                <Database className="w-4 h-4 shrink-0" />
                Firestore Logs
              </button>
            </div>

            <div className="p-5.5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-850 text-left space-y-3.5">
              <span className="text-[9px] font-black text-slate-400 dark:text-zinc-550 uppercase tracking-[0.2em]">
                System Architecture
              </span>
              <div className="space-y-2 text-[10px] sm:text-[11px] font-mono leading-relaxed text-slate-500 dark:text-zinc-400">
                <div>
                  <strong className="text-slate-800 dark:text-zinc-100">Auth System:</strong> Firebase Auth (Standard Google Provider)
                </div>
                <div>
                  <strong className="text-slate-800 dark:text-zinc-100">Storage:</strong> Firebase Enterprise Firestore Asia-Southeast1
                </div>
                <div>
                  <strong className="text-slate-800 dark:text-zinc-100">Sync Status:</strong> Ready
                </div>
              </div>
            </div>
          </div>

          {/* Module Panel Detail Box */}
          <div className="lg:col-span-9">
            <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-850 rounded-3xl p-6 md:p-8 shadow-sm">
              <AnimatePresence mode="wait">
                
                {/* 1. Google Sheets Tab */}
                {activeWorkspaceTab === "sheets" && (
                  <motion.div
                    key="tab-sheets"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6 text-left"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-4">
                      <div className="space-y-1">
                        <span className="text-[10px] text-teal-500 font-bold uppercase tracking-widest block">
                          Service Integrator
                        </span>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white uppercase flex items-center gap-2">
                          <FileSpreadsheet className="w-5 h-5 text-teal-400" />
                          Worksheets Importer
                        </h2>
                      </div>
                    </div>

                    <form onSubmit={handleSyncSheets} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        <div className="md:col-span-7 space-y-1.5">
                          <label className="text-[10px] font-mono font-black uppercase text-slate-400 tracking-wider">
                            Google Spreadsheet ID
                          </label>
                          <input 
                            type="text"
                            placeholder="e.g. 1BxiMVs0XRA5nFMdKv1a39y05Npu..."
                            value={sheetId}
                            onChange={(e) => setSheetId(e.target.value)}
                            className="w-full text-xs font-mono p-4 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-[#3DB88A]/50 text-slate-800 dark:text-white"
                          />
                        </div>
                        <div className="md:col-span-3 space-y-1.5">
                          <label className="text-[10px] font-mono font-black uppercase text-slate-400 tracking-wider">
                            Sheet Range
                          </label>
                          <input 
                            type="text"
                            placeholder="e.g. Sheet1!A1:D10"
                            value={sheetRange}
                            onChange={(e) => setSheetRange(e.target.value)}
                            className="w-full text-xs font-mono p-4 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-[#3DB88A]/50 text-slate-800 dark:text-white"
                          />
                        </div>
                        <div className="md:col-span-2 flex items-end">
                          <button
                            type="submit"
                            disabled={loading || !sheetId}
                            className="w-full py-4.5 bg-[#3DB88A] hover:bg-[#2e956f] text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-40"
                          >
                            Read Sheet
                          </button>
                        </div>
                      </div>

                      <div className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">
                        ✦ Need a placeholder spreadsheet ID to test? Create a public or shared Sheet in Google Drive, copy the ID between the slashes (e.g. <code className="bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 px-1 py-0.5 rounded font-mono select-all">/d/&lt;SPREADSHEET_ID&gt;/edit</code>), and query details immediately.
                      </div>
                    </form>

                    {sheetData ? (
                      <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-zinc-800">
                        <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-widest pl-1 font-mono">
                          <span>Extracted Cells</span>
                          <span className="text-[#3DB88A]">Success ✓</span>
                        </div>

                        <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-zinc-800 max-h-[300px]">
                          <table className="w-full text-left text-xs font-mono border-collapse">
                            <thead>
                              <tr className="bg-slate-50 dark:bg-zinc-950/50 border-b border-slate-100 dark:border-zinc-800">
                                {sheetData.values?.[0]?.map((col: string, idx: number) => (
                                  <th key={idx} className="p-3 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                                    {col || `Col ${idx + 1}`}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {sheetData.values?.slice(1).map((row: any[], rIdx: number) => (
                                <tr key={rIdx} className="border-b border-slate-100 dark:border-zinc-800/50 hover:bg-slate-50/50 dark:hover:bg-zinc-950/20">
                                  {row.map((cell: any, cIdx: number) => (
                                    <td key={cIdx} className="p-3 text-slate-700 dark:text-zinc-300">
                                      {cell}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                              {(!sheetData.values || sheetData.values.length <= 1) && (
                                <tr>
                                  <td className="p-4 text-center text-slate-400 font-medium" colSpan={5}>
                                    No data records filled.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <div className="p-10 border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl text-center space-y-2">
                        <FileSpreadsheet className="w-10 h-10 text-slate-300 dark:text-zinc-700 mx-auto" />
                        <h4 className="text-xs font-bold uppercase tracking-tight text-slate-700 dark:text-zinc-400">
                          Waiting for query...
                        </h4>
                        <p className="text-[11px] text-slate-400 dark:text-zinc-500 max-w-sm mx-auto leading-relaxed">
                          Enter your Google Spreadsheet ID above to extract cellular row values directly into your clinical records dashboard.
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* 2. Gmail Records Tab */}
                {activeWorkspaceTab === "gmail" && (
                  <motion.div
                    key="tab-gmail"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6 text-left"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-4">
                      <div className="space-y-1">
                        <span className="text-[10px] text-rose-500 font-bold uppercase tracking-widest block">
                          Service Integrator
                        </span>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white uppercase flex items-center gap-2">
                          <Mail className="w-5 h-5 text-rose-400" />
                          Gmail Communication Logs
                        </h2>
                      </div>

                      <button
                        onClick={handleSyncGmail}
                        disabled={loading}
                        className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 hover:text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                        Sync Inbox
                      </button>
                    </div>

                    {gmailMessages.length > 0 ? (
                      <div className="space-y-3.5">
                        <div className="text-[10px] focus:outline-none font-mono font-bold text-slate-400 dark:text-zinc-550 uppercase tracking-wider pl-1 font-mono">
                          Recent Health & Lifestyle Communications
                        </div>
                        <div className="flex flex-col gap-3">
                          {gmailMessages.map((msg) => (
                            <div 
                              key={msg.id}
                              className="p-4 bg-slate-50 dark:bg-zinc-950/45 border border-slate-150 dark:border-zinc-850 rounded-2xl space-y-2 hover:border-slate-300 dark:hover:border-zinc-750 transition-all text-left"
                            >
                              <div className="flex items-start justify-between gap-4 font-sans">
                                <div className="space-y-0.5 min-w-0">
                                  <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-150 truncate leading-snug">
                                    {msg.subject}
                                  </h4>
                                  <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono truncate">
                                    From: <span className="font-semibold text-slate-500 dark:text-zinc-400">{msg.from}</span>
                                  </p>
                                </div>
                                <span className="text-[9px] font-mono text-slate-400 dark:text-zinc-500 mt-0.5 shrink-0 uppercase tracking-tight">
                                  {new Date(msg.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </span>
                              </div>
                              <p className="text-[11px] font-sans leading-relaxed text-slate-500 dark:text-zinc-400 line-clamp-2">
                                {msg.snippet}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="p-12 border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl text-center space-y-4">
                        <Mail className="w-10 h-10 text-rose-300 dark:text-rose-950 mx-auto animate-pulse" />
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold uppercase tracking-tight text-slate-700 dark:text-zinc-400">
                            Zero mail records loaded
                          </h4>
                          <p className="text-[11px] text-slate-400 dark:text-zinc-500 max-w-sm mx-auto leading-relaxed">
                            Pull recent notification logs and patient messages directly from your live synchronized Gmail inbox folder.
                          </p>
                        </div>
                        <button
                          onClick={handleSyncGmail}
                          disabled={loading}
                          className="px-6 py-3 bg-[#3DB88A] hover:bg-[#2e956f] text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer"
                        >
                          Sync Gmail
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* 3. Google Calendar Tab */}
                {activeWorkspaceTab === "calendar" && (
                  <motion.div
                    key="tab-calendar"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6 text-left"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-4">
                      <div className="space-y-1">
                        <span className="text-[10px] text-blue-500 font-bold uppercase tracking-widest block">
                          Service Integrator
                        </span>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white uppercase flex items-center gap-2">
                          <CalendarIcon className="w-5 h-5 text-blue-400" />
                          Google Calendar Slot Scheduler
                        </h2>
                      </div>

                      <button
                        onClick={handleSyncCalendar}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-50/10 dark:bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 hover:text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                        Sync Calendar
                      </button>
                    </div>

                    {calendarEvents.length > 0 ? (
                      <div className="space-y-3.5">
                        <div className="text-[10px] font-mono font-bold text-slate-400 dark:text-zinc-550 uppercase tracking-wider pl-1">
                          Upcoming Calendar Appointments
                        </div>
                        <div className="flex flex-col gap-3">
                          {calendarEvents.map((evt) => {
                            const startStr = evt.start?.dateTime || evt.start?.date || "";
                            const dateObj = startStr ? new Date(startStr) : null;
                            return (
                              <div 
                                key={evt.id}
                                className="p-4 bg-slate-50 dark:bg-zinc-950/45 border border-slate-150 dark:border-zinc-850 rounded-2xl flex items-center justify-between gap-4 hover:border-slate-300 dark:hover:border-zinc-750 transition-all text-left"
                              >
                                <div className="space-y-1 min-w-0 flex-1">
                                  <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-150 truncate">
                                    {evt.summary}
                                  </h4>
                                  {evt.description && (
                                    <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-sans line-clamp-1">
                                      {evt.description}
                                    </p>
                                  )}
                                  {evt.location && (
                                    <span className="text-[9px] font-sans font-medium text-slate-400 uppercase tracking-wider block bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded w-max mt-1">
                                      📍 {evt.location}
                                    </span>
                                  )}
                                </div>
                                
                                {dateObj && (
                                  <div className="text-right shrink-0 font-mono space-y-0.5">
                                    <span className="text-[10px] font-bold text-[#3DB88A] block uppercase">
                                      {dateObj.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                    </span>
                                    <span className="text-[9px] text-slate-400 dark:text-zinc-500 block">
                                      {evt.start?.dateTime ? dateObj.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : "All Day"}
                                    </span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="p-12 border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl text-center space-y-4">
                        <CalendarIcon className="w-10 h-10 text-blue-300 dark:text-blue-950 mx-auto animate-pulse" />
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold uppercase tracking-tight text-slate-700 dark:text-zinc-400">
                            Zero calendar events synced
                          </h4>
                          <p className="text-[11px] text-slate-400 dark:text-zinc-500 max-w-sm mx-auto leading-relaxed">
                            Integrate wellness consultations, clinic sessions, doctor visits, and routines directly from your Google Calendar items.
                          </p>
                        </div>
                        <button
                          onClick={handleSyncCalendar}
                          disabled={loading}
                          className="px-6 py-3 bg-[#3DB88A] hover:bg-[#2e956f] text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer"
                        >
                          Sync Calendar
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* 4. Firestore Logs Tab */}
                {activeWorkspaceTab === "firestore" && (
                  <motion.div
                    key="tab-firestore"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6 text-left"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-4">
                      <div className="space-y-1">
                        <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest block">
                          Persistence Engine
                        </span>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white uppercase flex items-center gap-2">
                          <Database className="w-5 h-5 text-emerald-400" />
                          Firestore Backup Registry
                        </h2>
                      </div>

                      <button
                        onClick={loadSyncLogs}
                        disabled={loading}
                        className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/25 text-emerald-550 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Refresh History
                      </button>
                    </div>

                    {syncLogs.length > 0 ? (
                      <div className="space-y-3">
                        <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-zinc-550 uppercase tracking-wider pl-1 block">
                          Recent Firestore Logs (Collections: /users/{workspaceUser?.uid}/syncs)
                        </span>

                        <div className="flex flex-col gap-2.5 font-mono">
                          {syncLogs.map((log, idx) => {
                            const dateObj = log.lastSyncedAt ? new Date(log.lastSyncedAt) : null;
                            const isSuccess = log.status === "success";
                            return (
                              <div 
                                key={idx} 
                                className="p-4 bg-slate-50 dark:bg-zinc-950/40 border border-slate-150 dark:border-zinc-850 rounded-2xl flex items-center justify-between gap-4 text-xs hover:border-slate-200 dark:hover:border-zinc-750 transition-all text-left"
                              >
                                <div className="space-y-1 min-w-0">
                                  <div className="flex items-center gap-2.5">
                                    <span className="text-xs font-extrabold text-[#3DB88A] uppercase">
                                      {log.service}
                                    </span>
                                    <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${
                                      isSuccess 
                                        ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" 
                                        : "bg-red-500/10 text-red-550 border border-red-500/20"
                                    }`}>
                                      {log.status}
                                    </span>
                                  </div>
                                  <span className="text-[9px] text-slate-405 dark:text-zinc-500 block truncate leading-tight">
                                    ID Token: <code className="font-semibold text-slate-500 dark:text-zinc-400">{log.syncId}</code> • Synced Rows: <strong className="text-slate-700 dark:text-zinc-300 font-bold">{log.recordsSyncedCount}</strong>
                                  </span>
                                </div>

                                {dateObj && (
                                  <span className="text-[9px] text-slate-400 dark:text-zinc-500 mt-0.5 shrink-0 uppercase tracking-tight text-right">
                                    {dateObj.toLocaleTimeString()} • {dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="p-12 border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl text-center space-y-2">
                        <Database className="w-10 h-10 text-emerald-300 dark:text-emerald-950 mx-auto animate-pulse" />
                        <h4 className="text-xs font-bold uppercase tracking-tight text-slate-705 dark:text-zinc-405">
                          Database log is empty
                        </h4>
                        <p className="text-[11px] text-slate-400 dark:text-zinc-500 max-w-sm mx-auto leading-relaxed">
                          Synchronize any workspace tool above (Sheets, Calendar, Gmail) to commit certified sync events securely to your Cloud Firestore database.
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
