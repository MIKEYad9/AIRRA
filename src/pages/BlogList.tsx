import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { 
  BookOpen, 
  Search, 
  ArrowRight, 
  Sparkles, 
  Calendar, 
  Clock, 
  User, 
  Tag, 
  Brain, 
  ShieldAlert,
  Compass,
  Zap,
  Mail,
  ShieldCheck,
  Plus,
  Minus,
  HelpCircle
} from "lucide-react";
import { BLOG_POSTS, BlogPost } from "@/src/data/blogData";
import { db, auth } from "@/src/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
    authUserId: auth?.currentUser?.uid || null
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export default function BlogList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  
  // Newsletter Signup State
  const [emailInput, setEmailInput] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  // FAQ Accordion State
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(null);

  useEffect(() => {
    // Dynamic Page-Level SEO Metadata Updates
    const title = "Sovereign Insight Blog | AIRRA AI-Powered Digital Wellbeing Hub";
    const descContent = "Explore scientific perspectives, philosophical de-escalation protocols, and architectural sensory safety insights to reclaim your cognitive sovereignty and focus.";
    const pageUrl = "https://airra-beryl.vercel.app/blog";
    const coverImage = "https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&q=80&w=1200";

    document.title = title;

    const setMetaTag = (selectorAttr: string, attrVal: string, contentVal: string) => {
      let meta = document.querySelector(`meta[${selectorAttr}="${attrVal}"]`);
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute(selectorAttr, attrVal);
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", contentVal);
    };

    // Standard Description
    setMetaTag("name", "description", descContent);

    // OpenGraph Tags
    setMetaTag("property", "og:title", title);
    setMetaTag("property", "og:description", descContent);
    setMetaTag("property", "og:url", pageUrl);
    setMetaTag("property", "og:type", "website");
    setMetaTag("property", "og:image", coverImage);
    setMetaTag("property", "og:site_name", "AIRRA Sanctuary");

    // Twitter Tags
    setMetaTag("name", "twitter:card", "summary_large_image");
    setMetaTag("name", "twitter:title", title);
    setMetaTag("name", "twitter:description", descContent);
    setMetaTag("name", "twitter:image", coverImage);

    // Canonical link
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", pageUrl);

    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      setStatus("error");
      setMessage("Please enter a valid email address.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInput.trim())) {
      setStatus("error");
      setMessage("Please type a valid email address.");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const emailLower = emailInput.trim().toLowerCase();
      
      // Save directly to raw firestore using rules
      await addDoc(collection(db, "subscribers"), {
        email: emailLower,
        active: true,
        subscribedAt: serverTimestamp(),
        source: "blog_footer"
      });

      // Save to local storage cache representation as backup
      const existing = localStorage.getItem("airra_subscribers");
      let list = [];
      if (existing) {
        try { list = JSON.parse(existing); } catch (err) {}
      }
      if (!list.includes(emailLower)) {
        list.push(emailLower);
        localStorage.setItem("airra_subscribers", JSON.stringify(list));
      }

      setStatus("success");
      setMessage("Somatic connection active. Welcome to Sovereign Weekly insights.");
      setEmailInput("");
    } catch (err) {
      console.error("Firebase subscription error:", err);
      setStatus("error");
      setMessage("A connection issue occurred. Please try again.");
      try {
        handleFirestoreError(err, OperationType.CREATE, "subscribers");
      } catch (logErr) {
        console.error("Audit logged firestore subscriber failure:", logErr);
      }
    }
  };

  const categories = ["All", "Philosophy", "Science", "Clinical AI", "Design Science"];

  const filteredPosts = BLOG_POSTS.filter(post => {
    const matchesSearch = 
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === "All" || post.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const featuredPost = BLOG_POSTS[0];

  return (
    <div className="relative min-h-screen bg-airra-bg dark:bg-airra-dark-bg selection:bg-airra-primary/20 pb-24 text-airra-text dark:text-zinc-100">
      
      {/* Decorative Blur Backdrops */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute top-1/3 left-0 w-96 h-96 bg-teal-500/5 blur-3xl rounded-full pointer-events-none" />

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-6 sm:px-12 pt-28 space-y-16">
        
        {/* Header Intro */}
        <div id="blog-header" className="max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-150/10 dark:bg-emerald-950/20 border border-emerald-500/10 dark:border-emerald-500/20 rounded-full">
            <BookOpen className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
            <span className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">Sovereign Chronicles</span>
          </div>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-display font-black tracking-tighter text-airra-text dark:text-white uppercase leading-none">
            Cognitive Insight <br/>
            <span className="text-[#3DB88A]">& Wellness Hub</span>
          </h1>
          <p className="text-sm sm:text-lg text-zinc-650 dark:text-zinc-400 font-medium leading-relaxed max-w-2xl">
            A comprehensive, scientifically backed archive exploring sensory de-escalation, professional burnout reclamation, end-to-end somatic encryption, and mental longevity benchmarks.
          </p>
        </div>

        {/* Featured Post Hero Card */}
        {featuredPost && selectedCategory === "All" && !searchTerm && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="group relative rounded-[2.5rem] overflow-hidden border border-airra-border/40 dark:border-zinc-800 bg-airra-surface dark:bg-zinc-900 shadow-airra-xl grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden"
          >
            <div className="lg:col-span-7 relative aspect-[16/10] lg:aspect-auto min-h-[300px] overflow-hidden">
              <img 
                src={featuredPost.coverImage} 
                alt={featuredPost.title} 
                className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-103"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-black/80 via-black/25 to-transparent mix-blend-multiply opacity-50" />
              <div className="absolute top-6 left-6 flex gap-2">
                <span className="h-8 px-4 rounded-xl airra-glass text-[9px] font-black uppercase tracking-widest text-white flex items-center justify-center">
                  Featured
                </span>
                <span className="h-8 px-4 rounded-xl bg-emerald-600 text-[9px] font-black uppercase tracking-widest text-white flex items-center justify-center">
                  {featuredPost.category}
                </span>
              </div>
            </div>

            <div className="lg:col-span-5 p-8 sm:p-12 flex flex-col justify-between space-y-8">
              <div className="space-y-4">
                <div className="flex items-center gap-4 text-[10px] font-mono text-zinc-600 dark:text-zinc-400 font-extrabold uppercase tracking-wider">
                  <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{featuredPost.publishedAt}</span>
                  <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{featuredPost.readTime}</span>
                </div>
                <h2 className="text-2xl sm:text-3.5xl font-display font-black text-airra-text dark:text-white uppercase leading-tight tracking-tight hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors">
                  <Link to={`/blog/${featuredPost.slug}`}>{featuredPost.title}</Link>
                </h2>
                <p className="text-zinc-700 dark:text-zinc-400 font-medium text-sm leading-relaxed line-clamp-4">
                  {featuredPost.excerpt}
                </p>
              </div>

              <div className="pt-6 border-t border-airra-border/20 dark:border-white/5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img 
                    src={featuredPost.author.avatar} 
                    alt={featuredPost.author.name} 
                    className="w-10 h-10 rounded-xl object-cover" 
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h4 className="text-xs font-black text-airra-text dark:text-white uppercase">{featuredPost.author.name}</h4>
                    <p className="text-[9px] text-zinc-500 font-bold tracking-wider">{featuredPost.author.role}</p>
                  </div>
                </div>
                
                <Link 
                  to={`/blog/${featuredPost.slug}`}
                  className="w-11 h-11 rounded-xl bg-airra-text dark:bg-white text-airra-bg dark:text-zinc-950 flex items-center justify-center hover:bg-emerald-550 dark:hover:bg-emerald-400 dark:hover:text-zinc-950 transition-all shadow-md group-hover:scale-105"
                >
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </motion.div>
        )}

        {/* Content Explorer Bar (Search + Categories) */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6 border-y border-airra-border/20 dark:border-white/5 py-8">
          
          {/* Categories Row */}
          <div className="flex items-center gap-2 overflow-x-auto pb-4 md:pb-0 scrollbar-none shrink-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all shrink-0 ${
                  selectedCategory === cat 
                    ? "bg-[#3DB88A] text-white border-[#3DB88A] shadow-lg shadow-emerald-500/10"
                    : "bg-airra-surface dark:bg-zinc-900 border-airra-border/40 dark:border-zinc-800 text-airra-muted hover:border-airra-muted"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative max-w-md w-full">
            <input 
              type="text"
              placeholder="Search wellbeing articles, tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-12 bg-airra-surface dark:bg-zinc-900 border border-airra-border/40 dark:border-zinc-800 rounded-2xl pl-12 pr-5 text-xs font-semibold text-airra-text dark:text-white placeholder:text-zinc-505 dark:placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500"
            />
            <Search className="absolute left-4.5 top-3.5 w-4.5 h-4.5 text-zinc-505 dark:text-zinc-500" />
          </div>

        </div>

        {/* Article Grid Layout */}
        {filteredPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post, idx) => (
              <motion.article
                key={post.slug}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.05 }}
                className="group flex flex-col justify-between bg-airra-surface dark:bg-zinc-900 border border-airra-border/40 dark:border-zinc-800 rounded-[2rem] overflow-hidden hover:bg-airra-surface/80 dark:hover:bg-zinc-900/80 transition-all duration-300 shadow-sm hover:shadow-airra-md"
              >
                <div className="space-y-6">
                  {/* Card Cover */}
                  <div className="relative aspect-video overflow-hidden border-b border-airra-border/20 dark:border-white/5">
                    <img 
                      src={post.coverImage} 
                      alt={post.title} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-60" />
                    <span className="absolute top-4 right-4 h-7 px-3.5 rounded-lg airra-glass text-[9px] font-black uppercase tracking-widest text-white flex items-center justify-center">
                      {post.category}
                    </span>
                  </div>

                  {/* Card Context */}
                  <div className="px-8 space-y-4">
                    <div className="flex items-center gap-4 text-[9px] font-mono font-extrabold text-[#3DB88A] uppercase tracking-wider">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{post.publishedAt}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{post.readTime}</span>
                    </div>

                    <h3 className="text-xl font-display font-black text-airra-text dark:text-white uppercase tracking-tight leading-tight group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">
                      <Link to={`/blog/${post.slug}`}>{post.title}</Link>
                    </h3>

                    <p className="text-xs text-zinc-650 dark:text-zinc-400 font-medium leading-relaxed line-clamp-3">
                      {post.excerpt}
                    </p>
                  </div>
                </div>

                {/* Card Footer / Author */}
                <div className="p-8 pt-6 border-t border-airra-border/20 dark:border-white/5 flex items-center justify-between gap-4 mt-8">
                  <div className="flex items-center gap-2.5">
                    <img 
                      src={post.author.avatar} 
                      alt={post.author.name} 
                      className="w-8 h-8 rounded-lg object-cover" 
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0">
                      <h4 className="text-[10px] font-black text-airra-text dark:text-white uppercase truncate">{post.author.name}</h4>
                      <p className="text-[8px] text-zinc-500 font-bold tracking-wider truncate">{post.author.role}</p>
                    </div>
                  </div>
                  
                  <Link 
                    to={`/blog/${post.slug}`}
                    className="w-8 h-8 rounded-lg border border-airra-border/50 dark:border-zinc-800 flex items-center justify-center text-zinc-650 dark:text-zinc-400 group-hover:bg-[#3DB88A] group-hover:text-white group-hover:border-[#3DB88A] transition-all"
                  >
                    <ArrowRight className="w-4.5 h-4.5" />
                  </Link>
                </div>
              </motion.article>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 space-y-4">
            <Compass className="w-12 h-12 text-zinc-400 mx-auto animate-pulse" />
            <h3 className="text-lg font-display font-black uppercase text-airra-text dark:text-white">No scientific entries located</h3>
            <p className="text-xs text-airra-muted">Refining search syntax or resetting the category toggle might restore results.</p>
            <button 
              onClick={() => { setSearchTerm(""); setSelectedCategory("All"); }}
              className="text-xs font-bold text-emerald-500 hover:underline"
            >
              Reset exploration matrix
            </button>
          </div>
        )}

        {/* Backlinks & Continuous SEO Context Blocks */}
        <section className="border-t border-airra-border/20 dark:border-white/5 pt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-[2rem] bg-airra-surface/50 dark:bg-zinc-900/30 border border-airra-border/20 dark:border-white/5 space-y-3">
            <span className="font-mono text-[9px] font-black text-emerald-500 uppercase tracking-widest block">Core Integration</span>
            <h4 className="text-xs font-black uppercase tracking-tight text-airra-text dark:text-white">Cognitive Sovereignty Protocol</h4>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Every digital interface hosts critical feedback nodes. AIRRA guarantees that local records and somatic diagnostics operate inside isolated environment capsules. Explore our <Link to="/pricing" className="text-emerald-500 hover:underline">Pricing Spheres</Link> to secure your server-side instance.
            </p>
          </div>

          <div className="p-8 rounded-[2rem] bg-airra-surface/50 dark:bg-zinc-900/30 border border-airra-border/20 dark:border-white/5 space-y-3">
            <span className="font-mono text-[9px] font-black text-emerald-500 uppercase tracking-widest block">Somatic Grounding</span>
            <h4 className="text-xs font-black uppercase tracking-tight text-airra-text dark:text-white">Sovereign Journal Archives</h4>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Expressing shadow patterns reduces subconscious activity. Read about somatic integration models and trace your therapeutic milestones under the encrypted keys of <Link to="/journals" className="text-emerald-500 hover:underline">Sovereign Chronicles</Link>.
            </p>
          </div>

          <div className="p-8 rounded-[2rem] bg-emerald-500/5 border border-[#3DB88A]/20 space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <span className="font-mono text-[9px] font-black text-emerald-500 uppercase tracking-widest block">Active De-escalation</span>
              <h4 className="text-xs font-black uppercase tracking-tight text-airra-text dark:text-white">Try the Healing Deceleration</h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Unlock immediate de-escalation cycles, microtonal music maps, and dedicated stress-response consultations.
              </p>
            </div>
            <Link 
              to="/login"
              className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 hover:underline pt-2"
            >
              Initialize Sanctuary Session <Zap className="w-3.5 h-3.5" />
            </Link>
          </div>
        </section>

        {/* SEO FAQ Section with JSON-LD Schema */}
        <section className="mt-20 border-t border-airra-border/25 dark:border-white/5 pt-16 max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 text-[9px] font-mono font-black uppercase text-[#2D6A4F] dark:text-emerald-400 bg-[#E8F0EC]/80 dark:bg-emerald-950/40 px-3.5 py-1.5 rounded-full mx-auto">
              <HelpCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> FAQ Registry
            </div>
            <h3 className="text-2xl sm:text-3xl font-display font-black uppercase tracking-tight text-airra-text dark:text-white">
              Somatic & Cognitive FAQ
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-lg mx-auto leading-relaxed">
              Explore scientifically grounded answers regarding sensory safety, digital micro-dosing, and neuro-ergonomic compliance.
            </p>
          </div>

          <div id="faq-accordion-group" className="space-y-4 max-w-3xl mx-auto">
            {[
              {
                question: "How does AIRRA help maintain cognitive balance?",
                answer: "AIRRA combines precise microtonal soundscapes, scientifically backed somatic sensory models, and voice/text sentiment tracing to identify periods of physiological tension. By prompting gentle parasympathetic breathing intervals, we assist in regulating autonomic nervous system responses."
              },
              {
                question: "What are somatic sensory feedback loops?",
                answer: "Somatic feedback loops are bidirectional communication channels between the mind and physical triggers—specifically cardiovascular rhythms and breathing rates. By visualizing these bio-signals in real time, we foster active neuro-sensory adaptation."
              },
              {
                question: "Can digital de-escalation prevent physiological burnout?",
                answer: "Absolutely. Guided cognitive detachment, or planned micro-breaks of targeted clinical deceleration, interrupts systemic hyper-vigilance. Our models are crafted based on psychiatric literature to decelerate sympathetic arousal."
              },
              {
                question: "Is my mental wellness and journal data completely secure?",
                answer: "Yes, confidentiality is our highest design principle. All journal configurations, diagnostic values, and biofeedback measurements are held within local sandbox storage or encrypted using military-grade security keys."
              },
              {
                question: "Who reviews the clinical neuroscience elements on AIRRA?",
                answer: "Our content and telemetry strategies are adapted from clinical research in sensory ergonomics, psychological biofeedback, and psychiatric rehabilitation literature to support safe neural balance."
              }
            ].map((faq, idx) => {
              const isExpanded = expandedFaqIndex === idx;
              return (
                <div 
                  key={idx} 
                  className="rounded-[1.5rem] bg-white dark:bg-zinc-900 border border-airra-border/50 dark:border-white/5 overflow-hidden transition-all duration-300"
                >
                  <button
                    onClick={() => setExpandedFaqIndex(isExpanded ? null : idx)}
                    className="w-full p-6 text-left flex items-center justify-between gap-4 font-sans focus:outline-none hover:bg-slate-50/50 dark:hover:bg-zinc-850/30 transition-colors"
                  >
                    <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-zinc-850 dark:text-zinc-200">
                      {faq.question}
                    </span>
                    <span className="p-1 rounded-lg bg-slate-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 shrink-0">
                      {isExpanded ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    </span>
                  </button>

                  <motion.div
                    initial={false}
                    animate={{ height: isExpanded ? "auto" : 0, opacity: isExpanded ? 1 : 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="p-6 pt-0 border-t border-slate-100 dark:border-zinc-850/40">
                      <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed font-sans font-medium">
                        {faq.answer}
                      </p>
                    </div>
                  </motion.div>
                </div>
              );
            })}
          </div>

          {/* JSON-LD Structured Data Schema for Crawler Indexers */}
          <script type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": [
                {
                  "@type": "Question",
                  "name": "How does AIRRA help maintain cognitive balance?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "AIRRA combines precise microtonal soundscapes, scientifically backed somatic sensory models, and voice/text sentiment tracing to identify periods of physiological tension. By prompting gentle parasympathetic breathing intervals, we assist in regulating autonomic nervous system responses."
                  }
                },
                {
                  "@type": "Question",
                  "name": "What are somatic sensory feedback loops?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Somatic feedback loops are bidirectional communication channels between the mind and physical triggers—specifically cardiovascular rhythms and breathing rates. By visualizing these bio-signals in real time, we foster active neuro-sensory adaptation."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Can digital de-escalation prevent physiological burnout?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Absolutely. Guided cognitive detachment, or planned micro-breaks of targeted clinical deceleration, interrupts systemic hyper-vigilance. Our models are crafted based on psychiatric literature to decelerate sympathetic arousal."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Is my mental wellness and journal data completely secure?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes, confidentiality is our highest design principle. All journal configurations, diagnostic values, and biofeedback measurements are held within local sandbox storage or encrypted using military-grade security keys."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Who reviews the clinical neuroscience elements on AIRRA?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Our content and telemetry strategies are adapted from clinical research in sensory ergonomics, psychological biofeedback, and psychiatric rehabilitation literature to support safe neural balance."
                  }
                }
              ]
            })}
          </script>
        </section>

        {/* Premium Newsletter Signup Subsection */}
        <section className="mt-20 p-8 sm:p-12 rounded-[2.5rem] bg-slate-50 dark:bg-zinc-900/60 border border-airra-border dark:border-white/5 space-y-6 text-center max-w-3xl mx-auto">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 text-[9px] font-mono font-black uppercase text-[#2D6A4F] dark:text-emerald-400 bg-[#E8F0EC]/80 dark:bg-emerald-950/40 px-3.5 py-1.5 rounded-full mx-auto">
              <Mail className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Weekly Insights
            </div>
            <h3 className="text-xl sm:text-2xl font-display font-black uppercase tracking-tight text-airra-text dark:text-white">
              Sovereign Transmissions
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-lg mx-auto leading-relaxed">
              Cultivate focused awareness. Receive exclusive weekly reflections on cognitive hygiene, somatic privacy limits, and digital de-escalation models from the AIRRA lab.
            </p>
          </div>

          <form onSubmit={handleSubscribe} className="max-w-md mx-auto space-y-4">
            <div className="relative rounded-2xl overflow-hidden shadow-sm flex flex-col sm:flex-row gap-2">
              <input 
                type="email" 
                placeholder="Secure email link"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                disabled={status === "loading" || status === "success"}
                className="flex-grow h-12 bg-white dark:bg-zinc-850 text-airra-text dark:text-white rounded-xl px-4 text-xs font-black uppercase tracking-widest border border-airra-border/60 dark:border-white/5 focus:outline-none focus:border-emerald-500 transition-all text-center sm:text-left"
              />
              <button 
                type="submit"
                disabled={status === "loading" || status === "success"}
                className="h-12 px-6 bg-[#3DB88A] hover:opacity-95 text-white rounded-xl text-[10px] font-mono font-black uppercase tracking-widest transition-all disabled:opacity-50 hover:cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap"
              >
                {status === "loading" ? "CONNECTING..." : status === "success" ? "CONNECTED" : "ACTIVATE TRANSMISSION"}
              </button>
            </div>
            
            {message && (
              <motion.div 
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className={`text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 ${
                  status === "success" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {status === "success" && <ShieldCheck className="w-4 h-4" />}
                {message}
              </motion.div>
            )}
          </form>
        </section>

      </div>
    </div>
  );
}
