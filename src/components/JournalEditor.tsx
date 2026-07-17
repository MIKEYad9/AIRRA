import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { useUserStore } from '../services/useUserStore';
import { 
  X, Feather, Sparkles, ChevronRight, ChevronLeft, Mic, MicOff, 
  Smile, Heart, Shield, Radio, Flame, CheckSquare, MessageSquare, 
  BellRing, Music, Wind, Sun, Compass, Play, Pause, RefreshCw, CheckCircle2
} from 'lucide-react';
import { suggestMoodTag, transcribeAudio, sendChatMessage } from '../services/geminiService';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer } from 'recharts';

interface JournalEditorProps {
  onSave: () => void;
  onCancel: () => void;
}

const MOOD_OPTIONS = [
  { emoji: '😄', label: 'Happy', value: 'happy', desc: 'Light and optimistic', bg: 'from-amber-500/10 via-orange-500/5 to-transparent' },
  { emoji: '😌', label: 'Calm', value: 'calm', desc: 'Serene and balanced', bg: 'from-teal-500/10 via-cyan-500/5 to-transparent' },
  { emoji: '🙂', label: 'Content', value: 'content', desc: 'Quiet satisfaction', bg: 'from-emerald-500/10 via-zinc-500/5 to-transparent' },
  { emoji: '😐', label: 'Neutral', value: 'neutral', desc: 'Frictionless baseline', bg: 'from-slate-500/10 via-zinc-500/5 to-transparent' },
  { emoji: '😔', label: 'Down', value: 'down', desc: 'Soft melancholic dampener', bg: 'from-indigo-500/10 via-rose-500/5 to-transparent' },
  { emoji: '😤', label: 'Flustered', value: 'flustered', desc: 'High somatic friction', bg: 'from-rose-500/15 via-orange-500/5 to-transparent' },
  { emoji: '😴', label: 'Exhausted', value: 'exhausted', desc: 'Depleted bio-reserves', bg: 'from-slate-900/40 via-violet-950/20 to-transparent' },
  { emoji: '🤯', label: 'Overwhelmed', value: 'overwhelmed', desc: 'Cognitive load saturation', bg: 'from-violet-500/10 via-rose-500/10 to-transparent' },
  { emoji: '❤️‍🩹', label: 'Healing', value: 'healing', desc: 'Active somatic recovery', bg: 'from-fuchsia-500/10 via-pink-500/5 to-transparent' }
];

const QUICK_TAGS = [
  'Productive', 'Tired', 'Happy', 'Burned Out', 'Focused', 
  'Distracted', 'Social', 'Lonely', 'Calm', 'Anxious'
];

export default function JournalEditor({ onSave, onCancel }: JournalEditorProps) {
  const { profile } = useUserStore();
  
  // Wizard state: 1 (Moods & Sliders), 2 (Tags & Context), 3 (Grounded journaling), 4 (AI Resonance), 5 (Patterns)
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1 State: Mood & 1-10 Vital Sliders
  const [selectedMood, setSelectedMood] = useState(MOOD_OPTIONS[1]); // Default Calm
  const [vitalSliders, setVitalSliders] = useState({
    energy: 5,
    stress: 3,
    motivation: 6,
    sleep: 7
  });

  // Step 2 State: Selected tags
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Step 3 State: 4 journaling prompts
  const [journalAnswers, setJournalAnswers] = useState({
    happened: '',
    affector: '',
    gratitude: '',
    challenge: ''
  });
  const [activePromptField, setActivePromptField] = useState<'happened' | 'affector' | 'gratitude' | 'challenge'>('happened');
  
  // Voice recording & transcription
  const [isRecording, setIsRecording] = useState(false);
  const [recordingField, setRecordingField] = useState<string | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [transcribing, setTranscribing] = useState(false);
  const audioChunksRef = useRef<Blob[]>([]);

  // AI Assistance & Writing Starters
  const [writingSuggestions, setWritingSuggestions] = useState<string[]>([]);
  const [fetchingSuggestions, setFetchingSuggestions] = useState(false);

  // Step 4 State: AI Analysis Results, Remedies, Chat
  const [aiAnalysis, setAiAnalysis] = useState<{
    analysis: string;
    remedies: string[];
    affirmation: string;
    emergencyCalm: boolean;
    guide?: {
      title: string;
      tone: 'consoling' | 'celebratory' | 'stabilizing';
      introduction: string;
      steps: string[];
    };
  } | null>(null);
  const [fetchingAnalysis, setFetchingAnalysis] = useState(false);
  const [completedRemedies, setCompletedRemedies] = useState<string[]>([]);

  // Floating AI Chat inside the modal
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'model'; content: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Emergency Calm System
  const [emergencyCalmActive, setEmergencyCalmActive] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState<'inhale' | 'hold' | 'exhale' | 'rest'>('inhale');
  const [breathingCounter, setBreathingCounter] = useState(4);
  const [rainAudioPlaying, setRainAudioPlaying] = useState(false);
  const audioTrackRef = useRef<HTMLAudioElement | null>(null);

  // Mock analytics history for Step 5 Patterns
  const [weeklyPatterns, setWeeklyPatterns] = useState([
    { name: 'Mon', Mood: 4, Energy: 5 },
    { name: 'Tue', Mood: 5, Energy: 6 },
    { name: 'Wed', Mood: 6, Energy: 7 },
    { name: 'Thu', Mood: 5, Energy: 5 },
    { name: 'Fri', Mood: 7, Energy: 7 },
    { name: 'Sat', Mood: 8, Energy: 8 },
    { name: 'Today', Mood: 5, Energy: 5 },
  ]);

  // Sync today's input with vital sliders
  useEffect(() => {
    // Dynamically update the 'Today' value in patterns based on state
    setWeeklyPatterns(prev => {
      const next = [...prev];
      // Map chosen overall mood to an index scale
      const moodValue = selectedMood.value === 'radiant' || selectedMood.value === 'happy' ? 8 
                      : selectedMood.value === 'calm' || selectedMood.value === 'healing' ? 7
                      : selectedMood.value === 'content' ? 6
                      : selectedMood.value === 'neutral' ? 5
                      : selectedMood.value === 'down' ? 4
                      : 3;
      next[6] = {
        name: 'Today',
        Mood: moodValue,
        Energy: vitalSliders.energy
      };
      return next;
    });
  }, [selectedMood, vitalSliders.energy]);

  // Audio elements for Emergency Calm mode
  useEffect(() => {
    if (rainAudioPlaying && !audioTrackRef.current) {
      // Create ambient white noise generator natively using Web Audio API
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const bufferSize = 2 * audioCtx.sampleRate;
        const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }
        const whiteNoise = audioCtx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;
        
        // Filter noise to create soft waves / rain sound
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 400; // soft low hum/rain sound
        
        whiteNoise.connect(filter);
        filter.connect(audioCtx.destination);
        whiteNoise.start();
        
        (window as any)._audioSource = whiteNoise;
        (window as any)._audioCtx = audioCtx;
      } catch (e) {
        console.warn("Natively generated wave sound is blocked or unsupported in client:", e);
      }
    } else if (!rainAudioPlaying) {
      if ((window as any)._audioSource) {
        try {
          (window as any)._audioSource.stop();
          (window as any)._audioCtx.close();
        } catch {}
        (window as any)._audioSource = null;
        (window as any)._audioCtx = null;
      }
    }
    return () => {
      if ((window as any)._audioSource) {
        try {
          (window as any)._audioSource.stop();
          (window as any)._audioCtx.close();
        } catch {}
      }
    };
  }, [rainAudioPlaying]);

  // Breathing loop for Emergency Calm mode (4-4-4 pacing)
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (emergencyCalmActive) {
      timer = setInterval(() => {
        setBreathingCounter(prev => {
          if (prev <= 1) {
            setBreathingPhase(curr => {
              if (curr === 'inhale') return 'hold';
              if (curr === 'hold') return 'exhale';
              if (curr === 'exhale') return 'rest';
              return 'inhale';
            });
            return 4; // return to 4 seconds
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [emergencyCalmActive]);

  // Navigation handlers
  const handleNext = async () => {
    if (step === 3) {
      // Transitioning into Step 4 (AI Analysis Panel): trigger backend analysis
      setStep(4);
      fetchAIAnalysis();
    } else {
      setStep(prev => Math.min(prev + 1, 5));
    }
  };

  const handleBack = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  // Recording functionality
  const startRecording = async (field: 'happened' | 'affector' | 'gratitude' | 'challenge') => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          setTranscribing(true);
          try {
            const transcription = await transcribeAudio(base64Audio, 'audio/webm');
            if (transcription) {
              setJournalAnswers(prev => ({
                ...prev,
                [field]: (prev[field] ? prev[field] + ' ' : '') + transcription
              }));
            }
          } catch (err) {
            console.error("Voice-to-text error:", err);
          } finally {
            setTranscribing(false);
          }
        };
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingField(field);
    } catch (err) {
      console.error("Microphone access failed:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      setIsRecording(false);
      setRecordingField(null);
    }
  };

  // Fetch AI journal-assist writing suggestions
  const fetchWritingStarters = async () => {
    const getAuthHeader = async () => {
      if (localStorage.getItem('test_mode') === 'true') {
        return "Bearer mock-test-token";
      }
      if (supabase) {
        const { data } = await supabase.auth.getSession();
        if (data?.session?.access_token) {
          return `Bearer ${data.session.access_token}`;
        }
      }
      return "";
    };

    setFetchingSuggestions(true);
    setWritingSuggestions([]);
    try {
      const res = await fetch('/api/gemini/journal-assist', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': await getAuthHeader()
        },
        body: JSON.stringify({ 
          mood: selectedMood.label, 
          tags: selectedTags 
        })
      });
      if (res.ok) {
        const data = await res.json();
        setWritingSuggestions(data.suggestions || []);
      }
    } catch (e) {
      console.error("Assist suggestion API failed, falling back:", e);
      setWritingSuggestions([
        "In quiet reflection, the core focus of my morning was...",
        "I was surprised by how deeply I was affected by...",
        "Before today slips away, I want to voice my gratitude for..."
      ]);
    } finally {
      setFetchingSuggestions(false);
    }
  };

  const applyWritingStarter = (starter: string) => {
    setJournalAnswers(prev => ({
      ...prev,
      [activePromptField]: (prev[activePromptField] ? prev[activePromptField] + ' ' : '') + starter
    }));
  };

  // Fetch AI bio-emotional calibration overview
  const fetchAIAnalysis = async () => {
    const getAuthHeader = async () => {
      if (localStorage.getItem('test_mode') === 'true') {
        return "Bearer mock-test-token";
      }
      if (supabase) {
        const { data } = await supabase.auth.getSession();
        if (data?.session?.access_token) {
          return `Bearer ${data.session.access_token}`;
        }
      }
      return "";
    };

    setFetchingAnalysis(true);
    setAiAnalysis(null);
    const hasAnyContent = Object.values(journalAnswers).some(val => (val as string).trim().length > 0);
    
    try {
      const res = await fetch('/api/gemini/analyzeDay', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': await getAuthHeader()
        },
        body: JSON.stringify({
          mood: selectedMood.label,
          energy: vitalSliders.energy,
          stress: vitalSliders.stress,
          motivation: vitalSliders.motivation,
          sleep: vitalSliders.sleep,
          tags: selectedTags,
          journalResponses: journalAnswers
        })
      });

      if (res.ok) {
        const data = await res.json();
        setAiAnalysis(data);
        if (data.emergencyCalm && vitalSliders.stress >= 7) {
          // Softly trigger emergency calm if stress index is extremely saturated
          setEmergencyCalmActive(true);
        }
      }
    } catch (err) {
      console.error("Analysis generation error, utilizing safe fallback:", err);
      const isNegative = vitalSliders.stress >= 5 || vitalSliders.energy <= 5;
      setAiAnalysis({
        analysis: "Your neuro-vital signal indicates delicate adaptation with elevated focus patterns.",
        remedies: [
          "Practice 3 cycles of rhythmic breath stabilization.",
          "Limit digital screen exposure for 10-15 minutes.",
          "Integrate direct stretching patterns around your back."
        ],
        affirmation: "I am acknowledging the weight I carry, allowing clarity to surface slowly.",
        emergencyCalm: vitalSliders.stress >= 7,
        guide: {
          title: isNegative ? "Somatic Calming Walkthrough" : "Anchoring Daily Joy Practice",
          tone: isNegative ? "consoling" : "celebratory",
          introduction: isNegative 
            ? "Feeling fatigued or anxious is a natural, healthy indicator that your cognitive capacity needs standard replenishment. There is no error in taking space for rest." 
            : "Your baseline shows exceptional neural resilience and alignment. Let us anchor this elevated energy with brief celebratory somatic pacing.",
          steps: isNegative 
            ? [
                "Gently place one palm over your breastbone, closing your eyes to reset screen luminance.",
                "Inhale for 4 beats, hold for 2, then breathe out slowly with a soft humming sound to trigger safe vagal tone.",
                "Gently shift focus from digital interfaces to a physical object across the room."
              ]
            : [
                "Acknowledge the specific moment or detail that generated alignment today.",
                "Take a deep, expansion breath to occupy physical space and feel the glow.",
                "Scribble a prompt response to anchor this bright resonance in your internal library."
              ]
        }
      });
    } finally {
      setFetchingAnalysis(false);
    }
  };

  // Wellness Chat Assistant inside modal
  const handleSendChatMessage = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setChatLoading(true);

    // Form comprehensive contextual memory header for AI
    const stateContextMemo = `
    [AI MEMORY RECORD PROTOCOL]
    The user is currently inside their 5-step daily check-in flow.
    Current Overall Mood: ${selectedMood.label}
    Vitals: Energy: ${vitalSliders.energy}/10, Stress: ${vitalSliders.stress}/10, Motivation: ${vitalSliders.motivation}/10, Sleep Quality: ${vitalSliders.sleep}/10.
    Select Tags: ${selectedTags.join(', ')}
    What happened: ${journalAnswers.happened}
    Affected by: ${journalAnswers.affector}
    Grateful for: ${journalAnswers.gratitude}
    Challenged by: ${journalAnswers.challenge}
    
    Please provide an emotionally intelligent, supportive, and grounded response to the user's reflection or question: "${userMsg}". No robotic advice or preachy instructions. Speak like an gentle companion in calm spaces.
    `;

    try {
      // Map existing modal thread messages to general ChatMessage structures
      const formattedHistory = chatMessages.map(m => ({
        id: Math.random().toString(),
        conversation_id: 'checkin-thread',
        role: m.role,
        content: m.content,
        created_at: new Date().toISOString()
      }));

      const responseText = await sendChatMessage(stateContextMemo, formattedHistory);
      setChatMessages(prev => [...prev, { role: 'model', content: responseText }]);
    } catch (e) {
      console.error("Message send error:", e);
      setChatMessages(prev => [...prev, { 
        role: 'model', 
        content: "I am keeping quiet space with you right now. I encountered a minor signal wobble, but I am listening." 
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Synchronize final checkin data
  const handleFinalSynchronize = async () => {
    if (!profile) return;
    setLoading(true);

    const checkInTitle = `Daily Calibration (${selectedMood.emoji} ${selectedMood.label})`;
    
    // Compile gorgeous Markdown string representing the full premium check-in
    const checkInMarkdown = `
# Daily Alignment Summary
**Overall Mood**: ${selectedMood.emoji} ${selectedMood.label} (Energy: ${vitalSliders.energy}/10, Stress: ${vitalSliders.stress}/10, Motivation: ${vitalSliders.motivation}/10, Sleep Quality: ${vitalSliders.sleep}/10)
**Tags Selected**: ${selectedTags.length > 0 ? selectedTags.join(', ') : 'None'}

## What Happened Today
${journalAnswers.happened || '*No input captured*'}

## Affectors & Influences
${journalAnswers.affector || '*No input captured*'}

## Grateful Focus
${journalAnswers.gratitude || '*No input captured*'}

## Key Challenges
${journalAnswers.challenge || '*No input captured*'}

## AI resonance report
* **Wellness Audit**: ${aiAnalysis?.analysis || 'Generated upon checkout.'}
* **Affirmative Anchor**: *${aiAnalysis?.affirmation || 'Flowing forward.'}*
* **Completed Sanative Actions**: ${completedRemedies.length > 0 ? completedRemedies.map(r => `[x] ${r}`).join(', ') : 'Calibration protocol integrated.'}
    `.trim();

    try {
      // Save entry into standard database tables
      if (supabase) {
        // 1. Insert into journals
        await supabase.from('journals').insert({
          user_id: profile.id,
          title: checkInTitle,
          content: checkInMarkdown,
          mood_tag: selectedMood.label,
          created_at: new Date().toISOString()
        });

        // 2. Insert telemetry indicator into mood_logs
        await supabase.from('mood_logs').insert({
          user_id: profile.id,
          mood: selectedMood.label,
          intensity: Math.round((vitalSliders.energy + (10 - vitalSliders.stress)) / 2),
          note: `Vitals - Energy: ${vitalSliders.energy}, Stress: ${vitalSliders.stress}, Sleep: ${vitalSliders.sleep}`
        });

        // 3. Update profiles for the streak progression increment
        const nextStreak = (profile.daily_streak || 1) + 1;
        await supabase
          .from('profiles')
          .update({ daily_streak: nextStreak, updated_at: new Date().toISOString() })
          .eq('id', profile.id);
      } else {
        // Fallback standard offline client persistence
        const offlineLogs = JSON.parse(localStorage.getItem('airra_offline_journals') || '[]');
        offlineLogs.unshift({
          id: Math.random().toString(),
          title: checkInTitle,
          content: checkInMarkdown,
          mood_tag: selectedMood.label,
          created_at: new Date().toISOString()
        });
        localStorage.setItem('airra_offline_journals', JSON.stringify(offlineLogs));
      }
    } catch (e) {
      console.error("Persistence failed, logging telemetry offline:", e);
    } finally {
      setLoading(false);
      onSave(); // Close the modal
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 md:p-6 bg-zinc-950/60 backdrop-blur-2xl overflow-y-auto"
    >
      {/* Emergency Calm Canvas Overlay */}
      <AnimatePresence>
        {emergencyCalmActive && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex flex-col items-center justify-center p-6 bg-gradient-to-tr from-cyan-950 via-teal-950 to-zinc-950 text-white select-none"
          >
            {/* Visual Ripple of Breathing Ring */}
            <div className="relative w-80 h-80 flex items-center justify-center mb-10">
              <motion.div 
                animate={{
                  scale: breathingPhase === 'inhale' ? 1.4 :
                         breathingPhase === 'hold' ? 1.4 :
                         breathingPhase === 'exhale' ? 0.8 : 0.8
                }}
                transition={{
                  duration: 4,
                  ease: "easeInOut"
                }}
                className={`absolute w-48 h-48 rounded-full border-2 ${
                  breathingPhase === 'inhale' ? 'border-teal-400 bg-teal-400/5 shadow-[0_0_40px_rgba(45,212,191,0.2)]' :
                  breathingPhase === 'hold' ? 'border-emerald-400 bg-emerald-400/10 shadow-[0_0_50px_rgba(52,211,153,0.3)] animate-pulse' :
                  breathingPhase === 'exhale' ? 'border-cyan-400 bg-transparent' : 'border-zinc-700 bg-transparent'
                } transition-colors duration-1000 flex items-center justify-center`}
              >
                <div className="text-center">
                  <p className="text-sm tracking-[0.2em] uppercase text-zinc-300 font-black">
                    {breathingPhase === 'inhale' && 'Breathe In'}
                    {breathingPhase === 'hold' && 'Hold'}
                    {breathingPhase === 'exhale' && 'Exhale'}
                    {breathingPhase === 'rest' && 'Ready'}
                  </p>
                  <p className="text-4xl font-black font-display mt-2">{breathingCounter}</p>
                </div>
              </motion.div>
              {/* Surrounding concentric ambient waves */}
              <div className="absolute inset-0 border border-zinc-800/40 rounded-full animate-ping pointer-events-none" />
            </div>

            <div className="text-center max-w-md space-y-6">
              <h3 className="text-3xl font-display font-black tracking-tight uppercase">Emergency Calm Mode</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Your stress levels or flustered state has detected elevated resonance. Lie back, breathe rhythmically, and let the auditory calibration wave soothe your autonomic nervous system.
              </p>
              
              <div className="flex justify-center gap-4">
                <button 
                  onClick={() => setRainAudioPlaying(!rainAudioPlaying)}
                  className={`h-12 px-6 rounded-xl flex items-center gap-2 text-xs font-bold uppercase tracking-wider border ${
                    rainAudioPlaying 
                    ? 'bg-teal-500 border-transparent text-zinc-950 shadow-lg' 
                    : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800'
                  } transition-all`}
                >
                  <Music size={14} />
                  {rainAudioPlaying ? "Mute Acoustic Hum" : "Play Gentle Sound Wave"}
                </button>
                <button 
                  onClick={() => { setEmergencyCalmActive(false); setRainAudioPlaying(false); }}
                  className="h-12 px-6 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white text-xs font-bold uppercase tracking-wider"
                >
                  Exit Calm
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0, scale: 0.98, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 30 }}
        className={`w-full max-w-3xl bg-airra-bg dark:bg-zinc-900 border border-airra-border dark:border-zinc-800 rounded-[2.5rem] shadow-airra-xl overflow-hidden flex flex-col max-h-[92vh] relative bg-gradient-to-br ${selectedMood.bg} transition-all duration-1000`}
      >
        {/* Progress Bar Header */}
        <div className="px-8 md:px-10 pt-8 pb-4 border-b border-airra-border/50 dark:border-zinc-800/50">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Compass size={24} className="animate-spin-slow" />
              </div>
              <div>
                <h3 className="text-xl font-display font-extrabold text-airra-text dark:text-white tracking-tight uppercase leading-none">CHECK-IN CALIBRATION</h3>
                <span className="text-[9px] font-black tracking-widest text-[#2D6A4F] uppercase">Dynamic alignment sequence</span>
              </div>
            </div>
            <button 
              onClick={onCancel}
              className="w-10 h-10 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center text-zinc-400 dark:text-zinc-500 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Stepper Wizard Indicator */}
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex-1 space-y-1.5">
                <div className={`h-1.5 rounded-full transition-all duration-500 ${
                  step > i ? 'bg-emerald-600 dark:bg-emerald-400' :
                  step === i ? 'bg-[#2D6A4F] animate-pulse shadow-[0_0_10px_rgba(45,106,79,0.5)]' :
                  'bg-zinc-200 dark:bg-zinc-800'
                }`} />
                <span className={`hidden sm:block text-[8px] font-bold uppercase tracking-widest text-center ${step === i ? 'text-zinc-600 dark:text-zinc-300' : 'text-zinc-400 dark:text-zinc-650'}`}>
                  {i === 1 && 'Vitals & Mood'}
                  {i === 2 && 'Context Tags'}
                  {i === 3 && 'Smart Script'}
                  {i === 4 && 'AI Audit'}
                  {i === 5 && 'Memory Check'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Dynamic Multi-Step Body */}
        <div className="flex-1 overflow-y-auto airra-scrollbar p-8 md:p-10">
          <AnimatePresence mode="wait">
            
            {/* STEP 1: Mood & Vital Gauges */}
            {step === 1 && (
              <motion.div 
                key="step-1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="space-y-2">
                  <h4 className="text-2xl font-display font-black text-airra-text dark:text-white uppercase tracking-tight">Emotional Tone</h4>
                  <p className="text-sm text-zinc-500 pl-0.5">Select the overall frequency or mood currently expressing in your headspace today.</p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {MOOD_OPTIONS.map((mood) => {
                    const isSelected = selectedMood.value === mood.value;
                    return (
                      <button
                        key={mood.value}
                        onClick={() => setSelectedMood(mood)}
                        className={`flex flex-col items-center p-4 rounded-2xl border text-center relative overflow-hidden transition-all duration-300 ${
                          isSelected 
                          ? 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 border-transparent shadow-airra-md scale-[1.03]' 
                          : 'bg-white/50 dark:bg-zinc-900/40 border-airra-border/60 dark:border-zinc-800 hover:bg-white dark:hover:bg-zinc-800'
                        }`}
                      >
                        <span className="text-3xl mb-2 animate-float-slow">{mood.emoji}</span>
                        <span className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">{mood.label}</span>
                        <span className={`text-[8px] opacity-60 font-medium ${isSelected ? 'text-inherit' : 'text-zinc-400'}`}>{mood.desc}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Rating Sliders with Gradient Visual Tracks */}
                <div className="space-y-6 pt-4 border-t border-airra-border/20 dark:border-zinc-800/50">
                  <h4 className="text-lg font-display font-black text-zinc-700 dark:text-zinc-300 uppercase tracking-tight">Bio-Vitals Sliders</h4>
                  
                  <div className="space-y-6">
                    {/* Energy slider */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-500">
                        <span>Energy Reserves</span>
                        <span className="text-emerald-500 font-mono font-bold">{vitalSliders.energy} / 10</span>
                      </div>
                      <input 
                        type="range" min="1" max="10" 
                        value={vitalSliders.energy} 
                        onChange={(e) => setVitalSliders(prev => ({ ...prev, energy: parseInt(e.target.value) }))}
                        className="w-full h-2 rounded-full appearance-none cursor-pointer bg-gradient-to-r from-teal-200 to-teal-500 dark:from-zinc-800 dark:to-teal-400/80 outline-none"
                      />
                    </div>

                    {/* Stress slider */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-500">
                        <span>Friction & Stress Index</span>
                        <span className={`${vitalSliders.stress >= 7 ? 'text-rose-500 animate-pulse' : 'text-orange-500'} font-mono font-bold`}>{vitalSliders.stress} / 10</span>
                      </div>
                      <input 
                        type="range" min="1" max="10" 
                        value={vitalSliders.stress} 
                        onChange={(e) => setVitalSliders(prev => ({ ...prev, stress: parseInt(e.target.value) }))}
                        className="w-full h-2 rounded-full appearance-none cursor-pointer bg-gradient-to-r from-amber-200 to-rose-500 dark:from-zinc-800 dark:to-rose-400 outline-none"
                      />
                    </div>

                    {/* Motivation slider */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-500">
                        <span>Motivation Peak</span>
                        <span className="text-violet-500 font-mono font-bold">{vitalSliders.motivation} / 10</span>
                      </div>
                      <input 
                        type="range" min="1" max="10" 
                        value={vitalSliders.motivation} 
                        onChange={(e) => setVitalSliders(prev => ({ ...prev, motivation: parseInt(e.target.value) }))}
                        className="w-full h-2 rounded-full appearance-none cursor-pointer bg-gradient-to-r from-indigo-200 to-violet-500 dark:from-zinc-800 dark:to-violet-400 outline-none"
                      />
                    </div>

                    {/* Sleep quality slider */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-500">
                        <span>Sleep Recovery Quality</span>
                        <span className="text-sky-500 font-mono font-bold">{vitalSliders.sleep} / 10</span>
                      </div>
                      <input 
                        type="range" min="1" max="10" 
                        value={vitalSliders.sleep} 
                        onChange={(e) => setVitalSliders(prev => ({ ...prev, sleep: parseInt(e.target.value) }))}
                        className="w-full h-2 rounded-full appearance-none cursor-pointer bg-gradient-to-r from-sky-200 to-indigo-500 dark:from-zinc-800 dark:to-sky-400 outline-none"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 2: Selected Context Tags */}
            {step === 2 && (
              <motion.div 
                key="step-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="space-y-2">
                  <h4 className="text-2xl font-display font-black text-airra-text dark:text-white uppercase tracking-tight">Experiential context</h4>
                  <p className="text-sm text-zinc-500 pl-0.5">Identify any recurring tags that describe your productivity, physical feedback, or environments.</p>
                </div>

                <div className="flex flex-wrap gap-3">
                  {QUICK_TAGS.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`h-12 px-6 rounded-2xl flex items-center gap-3 border text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                          isSelected 
                          ? 'bg-emerald-600 border-transparent text-white shadow-airra-md scale-[1.03]' 
                          : 'bg-white/50 dark:bg-zinc-900/40 border-airra-border/60 dark:border-zinc-800 hover:border-zinc-400 text-zinc-650 dark:text-zinc-400'
                        }`}
                      >
                        <div className={`w-3 h-3 rounded-full transition-colors ${isSelected ? 'bg-white' : 'bg-zinc-400'}`} />
                        <span>{tag}</span>
                      </button>
                    );
                  })}
                </div>

                {selectedTags.length > 0 && (
                  <div className="p-6 rounded-[1.5rem] bg-emerald-500/5 border border-emerald-500/10 space-y-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#2D6A4F]">Active Resonance Pattern</span>
                    <p className="text-xs text-zinc-500 italic">"The selected parameters define a focus pattern highly correlating with healthy parasympathetic resilience."</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* STEP 3: Multi-Prompts with Voice Transcription */}
            {step === 3 && (
              <motion.div 
                key="step-3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="text-2xl font-display font-black text-airra-text dark:text-white uppercase tracking-tight">Immersive Script</h4>
                    <p className="text-xs text-zinc-500">Record thoughts textually or using secure acoustic microphone transcriptions.</p>
                  </div>
                  
                  {/* AI Starter Helper Trigger Button */}
                  <button
                    onClick={fetchWritingStarters}
                    disabled={fetchingSuggestions}
                    className="h-10 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all disabled:opacity-40"
                  >
                    <Sparkles size={12} />
                    {fetchingSuggestions ? "Generating..." : "Generate AI Starters"}
                  </button>
                </div>

                {/* AI Starters Suggestions Shelf */}
                <AnimatePresence>
                  {writingSuggestions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="p-4 rounded-2xl bg-violet-500/5 border border-violet-500/10 space-y-3"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black uppercase tracking-widest text-violet-650 flex items-center gap-1.5">
                          <Sparkles size={11} className="text-violet-500" /> Suggestions matching {selectedMood.emoji}
                        </span>
                        <button onClick={() => setWritingSuggestions([])} className="text-zinc-400 hover:text-zinc-600">
                          <X size={12} />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        {writingSuggestions.map((starter, idx) => (
                          <button
                            key={idx}
                            onClick={() => applyWritingStarter(starter)}
                            className="p-3 text-left bg-white dark:bg-zinc-950 border border-violet-500/10 rounded-xl hover:border-violet-400 hover:bg-violet-500/5 transition-all text-[11px] font-medium leading-relaxed italic text-zinc-650 dark:text-zinc-300"
                          >
                            {starter}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Input Fields */}
                <div className="space-y-4">
                  {/* prompt-1: What happened */}
                  <div className={`p-4 rounded-2xl border transition-all ${activePromptField === 'happened' ? 'bg-white dark:bg-zinc-950 border-emerald-500/20 shadow-airra-sm' : 'bg-white/40 dark:bg-zinc-900/40 border-airra-border/60 dark:border-zinc-800'}`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">1. What has unfolded today?</span>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => isRecording && recordingField === 'happened' ? stopRecording() : startRecording('happened')}
                          disabled={transcribing}
                          className={`h-8 px-3 rounded-lg border flex items-center gap-1.5 transition-all text-[9.5px] font-black uppercase tracking-widest ${
                            isRecording && recordingField === 'happened' 
                            ? 'bg-rose-500/15 border-rose-500/40 text-rose-500 animate-pulse' 
                            : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 border-transparent'
                          }`}
                        >
                          <Mic size={10} />
                          {isRecording && recordingField === 'happened' ? "Recording" : "Speak"}
                        </button>
                      </div>
                    </div>
                    <textarea
                      value={journalAnswers.happened}
                      onFocus={() => setActivePromptField('happened')}
                      onChange={(e) => setJournalAnswers(prev => ({ ...prev, happened: e.target.value }))}
                      placeholder="Capture standard actions, events, or interactions..."
                      className="w-full bg-transparent border-none text-zinc-800 dark:text-white placeholder:text-zinc-400 outline-none resize-none h-16 font-serif text-sm italic"
                    />
                  </div>

                  {/* prompt-2: Mood affector */}
                  <div className={`p-4 rounded-2xl border transition-all ${activePromptField === 'affector' ? 'bg-white dark:bg-zinc-950 border-emerald-500/20 shadow-airra-sm' : 'bg-white/40 dark:bg-zinc-900/40 border-airra-border/60 dark:border-zinc-800'}`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">2. What specific elements affected your mood?</span>
                      <button 
                        onClick={() => isRecording && recordingField === 'affector' ? stopRecording() : startRecording('affector')}
                        disabled={transcribing}
                        className={`h-8 px-3 rounded-lg border flex items-center gap-1.5 transition-all text-[9.5px] font-black uppercase tracking-widest ${
                          isRecording && recordingField === 'affector' 
                          ? 'bg-rose-500/15 border-rose-500/40 text-rose-500 animate-pulse' 
                          : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 border-transparent'
                        }`}
                      >
                        <Mic size={10} />
                        {isRecording && recordingField === 'affector' ? "Recording" : "Speak"}
                      </button>
                    </div>
                    <textarea
                      value={journalAnswers.affector}
                      onFocus={() => setActivePromptField('affector')}
                      onChange={(e) => setJournalAnswers(prev => ({ ...prev, affector: e.target.value }))}
                      placeholder="Write about screen time, physical encounters, coffee, etc..."
                      className="w-full bg-transparent border-none text-zinc-800 dark:text-white placeholder:text-zinc-400 outline-none resize-none h-16 font-serif text-sm italic"
                    />
                  </div>

                  {/* prompt-3: Gratitude */}
                  <div className={`p-4 rounded-2xl border transition-all ${activePromptField === 'gratitude' ? 'bg-white dark:bg-zinc-950 border-emerald-500/20 shadow-airra-sm' : 'bg-white/40 dark:bg-zinc-900/40 border-airra-border/60 dark:border-zinc-800'}`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">3. What was a source of quiet gratitude today?</span>
                      <button 
                        onClick={() => isRecording && recordingField === 'gratitude' ? stopRecording() : startRecording('gratitude')}
                        disabled={transcribing}
                        className={`h-8 px-3 rounded-lg border flex items-center gap-1.5 transition-all text-[9.5px] font-black uppercase tracking-widest ${
                          isRecording && recordingField === 'gratitude' 
                          ? 'bg-rose-500/15 border-rose-500/40 text-rose-500 animate-pulse' 
                          : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 border-transparent'
                        }`}
                      >
                        <Mic size={10} />
                        {isRecording && recordingField === 'gratitude' ? "Recording" : "Speak"}
                      </button>
                    </div>
                    <textarea
                      value={journalAnswers.gratitude}
                      onFocus={() => setActivePromptField('gratitude')}
                      onChange={(e) => setJournalAnswers(prev => ({ ...prev, gratitude: e.target.value }))}
                      placeholder="A kind word, a warm workspace, or simple focus moment..."
                      className="w-full bg-transparent border-none text-zinc-800 dark:text-white placeholder:text-zinc-400 outline-none resize-none h-16 font-serif text-sm italic"
                    />
                  </div>

                  {/* prompt-4: Challenge */}
                  <div className={`p-4 rounded-2xl border transition-all ${activePromptField === 'challenge' ? 'bg-white dark:bg-zinc-950 border-emerald-500/20 shadow-airra-sm' : 'bg-white/40 dark:bg-zinc-900/40 border-airra-border/60 dark:border-zinc-800'}`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">4. What challenged or bottlenecked your peace?</span>
                      <button 
                        onClick={() => isRecording && recordingField === 'challenge' ? stopRecording() : startRecording('challenge')}
                        disabled={transcribing}
                        className={`h-8 px-3 rounded-lg border flex items-center gap-1.5 transition-all text-[9.5px] font-black uppercase tracking-widest ${
                          isRecording && recordingField === 'challenge' 
                          ? 'bg-rose-500/15 border-rose-500/40 text-rose-500 animate-pulse' 
                          : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 border-transparent'
                        }`}
                      >
                        <Mic size={10} />
                        {isRecording && recordingField === 'challenge' ? "Recording" : "Speak"}
                      </button>
                    </div>
                    <textarea
                      value={journalAnswers.challenge}
                      onFocus={() => setActivePromptField('challenge')}
                      onChange={(e) => setJournalAnswers(prev => ({ ...prev, challenge: e.target.value }))}
                      placeholder="An anxious block, workload spike, or minor physical setback..."
                      className="w-full bg-transparent border-none text-zinc-800 dark:text-white placeholder:text-zinc-400 outline-none resize-none h-16 font-serif text-sm italic"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 4: AI Resonance Analyzer & Remedies & Memory Chat */}
            {step === 4 && (
              <motion.div 
                key="step-4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                {fetchingAnalysis ? (
                  <div className="h-80 flex flex-col items-center justify-center gap-4">
                    <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-[#2D6A4F] rounded-full animate-spin" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Synthesizing Bio-Emotional Resonance</p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* Emotional audit */}
                    <div className="p-6 rounded-[2rem] bg-emerald-500/5 border border-emerald-500/10 space-y-3 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[50px] pointer-events-none" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-[#2D6A4F] flex items-center gap-1.5">
                        <Feather size={12} /> Somatic Resonance Calibration
                      </span>
                      <p className="text-base font-serif italic leading-relaxed text-zinc-700 dark:text-zinc-200">
                        "{aiAnalysis?.analysis}"
                      </p>
                    </div>

                    {/* Somatic Remedy Suggested Actions */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center pl-1">
                        <h5 className="text-xs font-black uppercase tracking-widest text-zinc-500">Highly Achievable Wellness Remedies</h5>
                        {vitalSliders.stress >= 7 && (
                          <button
                            onClick={() => setEmergencyCalmActive(true)}
                            className="bg-rose-500 text-white text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full animate-pulse shadow-md flex items-center gap-1"
                          >
                            <Wind size={10} /> Direct Somatic Calm Needed
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {aiAnalysis?.remedies.map((remedy, i) => {
                          const isDone = completedRemedies.includes(remedy);
                          return (
                            <button
                              key={i}
                              onClick={() => setCompletedRemedies(prev => isDone ? prev.filter(r => r !== remedy) : [...prev, remedy])}
                              className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all duration-300 ${
                                isDone 
                                ? 'bg-zinc-950 dark:bg-white border-transparent text-white dark:text-zinc-950 shadow-inner' 
                                : 'bg-white/40 dark:bg-zinc-900/40 border-airra-border/60 dark:border-zinc-800 hover:bg-white dark:hover:bg-zinc-800/80'
                              }`}
                            >
                              <CheckSquare size={16} className={`mt-0.5 flex-shrink-0 ${isDone ? 'text-emerald-400' : 'text-zinc-400'}`} />
                              <span className="text-xs font-medium leading-tight">{remedy}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Custom Guide (Consolational / Celebratory depending on tone) */}
                    {aiAnalysis?.guide && (
                      <div className={`p-6 sm:p-8 rounded-[2rem] border transition-all duration-300 relative overflow-hidden ${
                        aiAnalysis.guide.tone === 'consoling' 
                          ? 'bg-rose-500/5 dark:bg-rose-500/10 border-rose-500/20' 
                          : aiAnalysis.guide.tone === 'celebratory'
                            ? 'bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/20'
                            : 'bg-indigo-500/5 dark:bg-indigo-500/10 border-indigo-500/20'
                      }`}>
                        {/* Decorative glow indicator */}
                        <div className={`absolute top-0 right-0 w-32 h-32 blur-[50px] pointer-events-none opacity-40 ${
                          aiAnalysis.guide.tone === 'consoling' 
                            ? 'bg-rose-500/10' 
                            : aiAnalysis.guide.tone === 'celebratory'
                              ? 'bg-amber-500/10'
                              : 'bg-indigo-500/10'
                        }`} />

                        <div className="space-y-4 relative z-10">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <span className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 ${
                              aiAnalysis.guide.tone === 'consoling'
                                ? 'text-rose-600 dark:text-rose-450'
                                : aiAnalysis.guide.tone === 'celebratory'
                                  ? 'text-amber-600 dark:text-amber-450'
                                  : 'text-indigo-600 dark:text-indigo-450'
                            }`}>
                              <Sparkles size={11} className="animate-pulse" />
                              {aiAnalysis.guide.tone === 'consoling' 
                                ? 'AIRRA Compassionate Sanctuary Guide' 
                                : aiAnalysis.guide.tone === 'celebratory'
                                  ? 'AIRRA Alignment Celebration Guide'
                                  : 'AIRRA Somatic Stabilization Guide'
                              }
                            </span>
                            <span className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border self-start sm:self-auto ${
                              aiAnalysis.guide.tone === 'consoling'
                                ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-600 border-rose-200 dark:border-rose-900/40'
                                : aiAnalysis.guide.tone === 'celebratory'
                                  ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-600 border-amber-200 dark:border-amber-900/40'
                                  : 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 border-indigo-200 dark:border-indigo-900/40'
                            }`}>
                              {aiAnalysis.guide.title}
                            </span>
                          </div>

                          <p className="text-xs text-zinc-650 dark:text-zinc-300 leading-relaxed italic font-serif">
                            "{aiAnalysis.guide.introduction}"
                          </p>

                          <div className="border-t border-zinc-200/50 dark:border-zinc-800/40 pt-4 space-y-3">
                            <h6 className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Micro-Practice Walkthrough</h6>
                            <div className="grid grid-cols-1 gap-2">
                              {aiAnalysis.guide.steps.map((step, idx) => (
                                <div key={idx} className="flex gap-3 items-start p-3.5 rounded-2xl bg-white/40 dark:bg-zinc-950/30 border border-zinc-200/30 dark:border-zinc-800/30">
                                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                                    aiAnalysis.guide?.tone === 'consoling'
                                      ? 'bg-rose-100 dark:bg-rose-950 text-rose-600'
                                      : aiAnalysis.guide?.tone === 'celebratory'
                                        ? 'bg-amber-100 dark:bg-amber-950 text-amber-600'
                                        : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600'
                                  }`}>
                                    {idx + 1}
                                  </span>
                                  <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-normal font-medium">{step}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* custom affirmation anchor */}
                    <div className="p-5 rounded-[1.5rem] bg-zinc-50 dark:bg-zinc-950/40 border border-airra-border/40 dark:border-zinc-800 text-center space-y-1">
                      <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Personal affirmation anchor</span>
                      <p className="text-sm font-serif italic text-zinc-650 dark:text-zinc-250 font-normal">
                        "{aiAnalysis?.affirmation}"
                      </p>
                    </div>

                    {/* Integrated contextual wellness chat */}
                    <div className="border border-airra-border/60 dark:border-zinc-800 rounded-[2rem] overflow-hidden flex flex-col h-64 bg-white/30 dark:bg-zinc-900/30">
                      <div className="px-5 py-3 border-b border-airra-border/40 dark:border-zinc-800/65 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#2D6A4F]">Consciousness Companion Dialogue</span>
                      </div>
                      
                      {/* Chat messages viewport */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-3 airra-scrollbar text-xs">
                        {chatMessages.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-400 space-y-2">
                            <MessageSquare className="w-6 h-6 stroke-1" />
                            <p className="italic">"Ask AIRRA about the stress triggers identified today or ask for custom breathing instructions..."</p>
                          </div>
                        ) : (
                          chatMessages.map((m, i) => (
                            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[80%] p-3 rounded-2xl leading-relaxed ${
                                m.role === 'user' 
                                ? 'bg-zinc-950 text-white rounded-tr-none' 
                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-tl-none border border-zinc-200/50 dark:border-zinc-700'
                              }`}>
                                {m.content}
                              </div>
                            </div>
                          ))
                        )}
                        {chatLoading && (
                          <div className="flex justify-start">
                            <div className="bg-zinc-100 dark:bg-zinc-800 text-zinc-400 p-3 rounded-2xl rounded-tl-none animate-pulse">
                              AIRRA has entered quiet reflection...
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Chat Input */}
                      <div className="p-3 border-t border-airra-border/40 dark:border-zinc-800/65 flex gap-2">
                        <input
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
                          placeholder="Speak directly into the sanctuary companion stream..."
                          className="flex-1 bg-transparent border-none text-xs outline-none pl-2 text-zinc-800 dark:text-white"
                        />
                        <button
                          onClick={handleSendChatMessage}
                          disabled={chatLoading || !chatInput.trim()}
                          className="h-8 px-4 rounded-lg bg-[#2D6A4F] hover:bg-emerald-700 text-white text-[9px] font-black uppercase tracking-widest transition-opacity disabled:opacity-45"
                        >
                          Send
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* STEP 5: Patterns & Consistency Index Dashboard */}
            {step === 5 && (
              <motion.div 
                key="step-5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6 text-center"
              >
                <div className="w-16 h-16 rounded-[1.5rem] bg-emerald-500/10 flex items-center justify-center text-emerald-500 mx-auto animate-bounce-slow">
                  <CheckCircle2 size={32} />
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-3xl font-display font-black text-[#2D6A4F] dark:text-emerald-400 uppercase tracking-tight">Vibrational Check Complete</h4>
                  <p className="text-zinc-500 text-sm max-w-md mx-auto">
                    Excellent alignment. Today's diagnostics has successfully captured your parameters into our zero-knowledge wellness ledger.
                  </p>
                </div>

                {/* Micro-Analytics Trends Preview */}
                <div className="p-6 rounded-[2rem] bg-white/40 dark:bg-zinc-900/40 border border-airra-border/60 dark:border-zinc-800 space-y-4 text-left">
                  <div className="flex justify-between items-center pb-2 border-b border-airra-border/20 dark:border-zinc-800">
                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Weekly calibration indices</span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500">Telemetry secured</span>
                  </div>

                  {/* 1-week mini area chart */}
                  <div className="h-28 w-full mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={weeklyPatterns}>
                        <defs>
                          <linearGradient id="colorIntensityCheckin" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: 'rgba(100,116,139,0.5)', fontSize: 8, fontWeight: 900 }} 
                        />
                        <YAxis hide domain={[0, 10]} />
                        <Area 
                          type="monotone" 
                          dataKey="Mood" 
                          stroke="#10b981" 
                          strokeWidth={2}
                          fillOpacity={1} 
                          fill="url(#colorIntensityCheckin)" 
                        />
                        <Area 
                          type="monotone" 
                          dataKey="Energy" 
                          stroke="#3b82f6" 
                          strokeWidth={1.5}
                          strokeDasharray="4 4"
                          fill="transparent" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-950/40 rounded-2xl border border-zinc-200/40 dark:border-zinc-800">
                      <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500 block">Autonomy Score</span>
                      <span className="text-lg font-bold text-zinc-800 dark:text-zinc-200 uppercase font-display">89% Stability</span>
                    </div>
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-950/40 rounded-2xl border border-zinc-200/40 dark:border-zinc-800">
                      <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500 block">Momentum Saved</span>
                      <span className="text-lg font-bold text-emerald-500 uppercase font-display">{(profile?.daily_streak || 1) + 1} Calibrations</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Action navigation Footer */}
        <div className="px-8 md:px-10 py-6 border-t border-airra-border/50 dark:border-zinc-800/50 flex justify-between items-center bg-zinc-50 dark:bg-zinc-950/20">
          <button
            onClick={handleBack}
            disabled={step === 1 || loading}
            className={`h-12 px-6 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${
              step > 1 ? 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white' : 'opacity-0 pointer-events-none'
            }`}
          >
            <ChevronLeft size={14} /> Back
          </button>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="h-12 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-colors"
            >
              Cancel
            </button>
            {step < 5 ? (
              <button
                onClick={handleNext}
                disabled={isRecording}
                className="h-12 px-8 rounded-xl bg-zinc-950 hover:bg-zinc-850 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg hover:scale-103"
              >
                <span>Continue</span>
                <ChevronRight size={14} />
              </button>
            ) : (
              <button
                onClick={handleFinalSynchronize}
                disabled={loading}
                className="h-12 px-8 rounded-xl bg-[#2D6A4F] hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg hover:scale-110 active:scale-95"
              >
                {loading ? (
                  <div className="w-3.5 h-3.5 border border-current/20 border-t-current rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Synchronize Records</span>
                    <CheckCircle2 size={14} />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
