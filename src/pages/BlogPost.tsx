import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Share2, 
  Heart, 
  ChevronRight, 
  BookOpen,
  Sparkles,
  Award,
  ShieldCheck,
  User,
  ExternalLink,
  Plus,
  Minus,
  HelpCircle
} from "lucide-react";
import { BLOG_POSTS, BlogPost as BlogPostType } from "@/src/data/blogData";

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(null);

  const post = BLOG_POSTS.find(p => p.slug === slug);

  useEffect(() => {
    if (!post) {
      navigate("/blog");
      return;
    }

    // Dynamic Page-Level SEO Metadata Updates for Google Indexers
    const title = post.seoTitle;
    const descContent = post.seoDescription;
    const pageUrl = `https://airra-beryl.vercel.app/blog/${post.slug}`;
    const coverImage = post.coverImage;

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
    setMetaTag("property", "og:type", "article");
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
    
    // Smooth scroll to top of article
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [post, navigate]);

  if (!post) return null;

  // Find related posts (other posts that don't match the current slug)
  const relatedPosts = BLOG_POSTS.filter(p => p.slug !== post.slug).slice(0, 2);

  // Quick custom formatter to translate clean markdown to elegant typography
  const renderFormattedProse = (text: string) => {
    const lines = text.split("\n");
    let isInsideList = false;
    const listStack: React.ReactNode[] = [];

    return lines.map((line, index) => {
      const trimmed = line.trim();
      
      // Empty line
      if (!trimmed) {
        if (isInsideList) {
          isInsideList = false;
          const listContent = [...listStack];
          listStack.length = 0;
          return <ul key={`list-${index}`} className="list-disc pl-8 space-y-3.5 my-6 text-zinc-700 dark:text-zinc-350">{listContent}</ul>;
        }
        return <div key={`space-${index}`} className="h-4" />;
      }

      // Main Heading 1 (#)
      if (trimmed.startsWith("# ")) {
        return (
          <h1 key={index} className="text-3xl sm:text-5xl font-display font-black text-airra-text dark:text-white uppercase tracking-tight mt-12 mb-6 border-b border-zinc-150 dark:border-zinc-800 pb-3">
            {trimmed.replace("# ", "")}
          </h1>
        );
      }

      // Heading 2 (##)
      if (trimmed.startsWith("## ")) {
        return (
          <h2 key={index} className="text-2xl sm:text-3.5xl font-display font-black text-airra-text dark:text-white uppercase tracking-tight mt-10 mb-4">
            {trimmed.replace("## ", "")}
          </h2>
        );
      }

      // Bullet List Point (* or - )
      if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
        isInsideList = true;
        const cleanItem = trimmed.replace(/^[\*\-]\s+/, "");
        
        // Parse bold highlights inside list item
        const parts = cleanItem.split("**");
        const formattedText = parts.map((part, idx) => (idx % 2 === 1 ? <strong key={idx} className="font-bold text-zinc-900 dark:text-white">{part}</strong> : part));
        
        listStack.push(<li key={`li-${index}`} className="leading-relaxed font-medium text-sm sm:text-base">{formattedText}</li>);
        return null;
      }

      // Numbered List Point (e.g. 1. )
      if (/^\d+\.\s+/.test(trimmed)) {
        const cleanItem = trimmed.replace(/^\d+\.\s+/, "");
        const parts = cleanItem.split("**");
        const formattedText = parts.map((part, idx) => (idx % 2 === 1 ? <strong key={idx} className="font-bold text-zinc-900 dark:text-white">{part}</strong> : part));
        return (
          <div key={index} className="flex gap-4 my-4 pl-2">
            <span className="font-mono text-xs text-emerald-500 font-bold shrink-0 mt-1">{trimmed.match(/^\d+/)?.[0]}.</span>
            <p className="text-zinc-850 dark:text-zinc-150 leading-[1.8] tracking-[0.01em] font-medium text-sm sm:text-base">{formattedText}</p>
          </div>
        );
      }

      // Horizontal dividers (---)
      if (trimmed === "---") {
        return <hr key={index} className="border-t border-airra-border/20 dark:border-zinc-850 my-10" />;
      }

      // Regular paragraph (parse **bold** markdown highlights)
      const parts = trimmed.split("**");
      const formattedParagraph = parts.map((part, idx) => (
        idx % 2 === 1 ? <strong key={idx} className="font-extrabold text-zinc-950 dark:text-white">{part}</strong> : part
      ));

      return (
        <p key={index} className="text-zinc-850 dark:text-zinc-150 leading-[1.8] tracking-[0.01em] font-medium text-sm sm:text-base my-5 text-justify">
          {formattedParagraph}
        </p>
      );
    });
  };

  return (
    <div className="relative min-h-screen bg-airra-bg dark:bg-airra-dark-bg selection:bg-airra-primary/20 pb-24 text-airra-text dark:text-zinc-100">
      
      {/* Dynamic blurred halo backdrops */}
      <div className="absolute top-0 left-10 w-[500px] h-[500px] bg-[#3DB88A]/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Main Container */}
      <div className="max-w-4xl mx-auto px-6 sm:px-12 pt-28 space-y-12">
        
        {/* Navigation Breadcrumbs / Return Link */}
        <div id="blog-breadcrumbs" className="flex items-center justify-between">
          <Link 
            to="/blog" 
            className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#3DB88A] hover:opacity-80 transition-opacity"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Archives
          </Link>

          <span className="font-mono text-[9px] text-zinc-500 font-bold uppercase tracking-wider">
            Category • {post.category}
          </span>
        </div>

        {/* Article Meta Header */}
        <header className="space-y-6">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-display font-black text-airra-text dark:text-white uppercase leading-none tracking-tight">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center gap-6 text-[10px] sm:text-xs font-mono text-zinc-650 dark:text-zinc-400 font-bold uppercase tracking-wider border-y border-airra-border/20 dark:border-white/5 py-4">
            <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Published {post.publishedAt}</span>
            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Read Time: {post.readTime}</span>
            <span className="h-4 w-px bg-airra-border/20 dark:bg-zinc-805 hidden sm:block" />
            <span className="h-6 px-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center justify-center">
              {post.category}
            </span>
          </div>
        </header>

        {/* Featured Image */}
        <div className="relative aspect-video rounded-[2rem] sm:rounded-[3rem] overflow-hidden border border-airra-border/40 dark:border-zinc-800 shadow-airra-lg">
          <img 
            src={post.coverImage} 
            alt={post.title} 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Article Core Content Body */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-0 md:gap-12 pt-4">
          
          {/* Main Prose Text Reader */}
          <main className="md:col-span-9 prose dark:prose-invert max-w-none">
            {renderFormattedProse(post.content)}
          </main>

          {/* Left/Right Context Panel / Author profile */}
          <aside className="md:col-span-3 space-y-10 mt-12 md:mt-0">
            
            {/* Author Summary */}
            <div className="p-6 rounded-[2rem] bg-airra-surface dark:bg-zinc-900 border border-airra-border/40 dark:border-zinc-800 space-y-4">
              <span className="font-mono text-[8px] font-black tracking-widest text-[#3DB88A] uppercase block">Written By</span>
              <img 
                src={post.author.avatar} 
                alt={post.author.name} 
                className="w-16 h-16 rounded-2xl object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="space-y-1">
                <h4 className="text-xs font-black text-airra-text dark:text-white uppercase leading-none">{post.author.name}</h4>
                <p className="text-[9px] text-zinc-500 font-bold leading-tight">{post.author.role}</p>
              </div>
            </div>

            {/* Keyword tags */}
            <div className="space-y-3">
              <span className="font-mono text-[8px] font-black tracking-widest text-zinc-500 uppercase block">Crawl Keywords</span>
              <div className="flex flex-wrap gap-2">
                {post.tags.map(tag => (
                  <span 
                    key={tag}
                    className="px-3 py-1.5 rounded-lg border border-airra-border/45 dark:border-zinc-800 bg-airra-surface/40 dark:bg-zinc-900/60 text-[9px] font-bold text-zinc-700 dark:text-zinc-400 uppercase tracking-wider"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Interactive quick stats */}
            <div className="p-6 rounded-[2rem] bg-[#3DB88A]/5 border border-[#3DB88A]/20 space-y-3">
              <h5 className="font-display font-black text-[10px] text-zinc-900 dark:text-white uppercase tracking-wider">Clinical Efficacy</h5>
              <p className="text-[10px] text-zinc-600 dark:text-zinc-400 leading-normal">
                All articles on this portal are vetted according to cognitive co-regulation mechanisms and sensory macular fatigue standards.
              </p>
              <div className="flex items-center gap-1 text-[9px] font-black text-[#2D6A4F] dark:text-emerald-400 uppercase">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Grounding Certified
              </div>
            </div>

          </aside>
        </div>

        {/* Deep Internal Linking Suggestions Grid */}
        <section className="border-t border-airra-border/20 dark:border-white/5 pt-12 space-y-8">
          <h3 className="text-xl font-display font-black text-airra-text dark:text-white uppercase">Suggested Chronicles</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {relatedPosts.map(rel => (
              <Link 
                key={rel.slug} 
                to={`/blog/${rel.slug}`} 
                className="group flex flex-col justify-between p-6 rounded-[2rem] bg-airra-surface dark:bg-zinc-900 border border-airra-border/40 dark:border-zinc-800 hover:bg-[#3DB88A]/5 hover:border-[#3DB88A]/35 transition-all"
              >
                <div className="space-y-3">
                  <span className="text-[9px] font-mono font-black uppercase text-[#3DB88A]">{rel.category}</span>
                  <h4 className="text-base font-display font-black text-airra-text dark:text-white uppercase tracking-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-snug">
                    {rel.title}
                  </h4>
                  <p className="text-xs text-zinc-5a0 dark:text-zinc-450 line-clamp-2 leading-relaxed">{rel.excerpt}</p>
                </div>
                <span className="text-[10px] font-extrabold uppercase mt-4 text-[#3DB88A] inline-flex items-center gap-1 group-hover:gap-2.5 transition-all">
                  Read Article <ChevronRight className="w-4 h-4" />
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Article Reader FAQ Section with JSON-LD Schema */}
        <section className="border-t border-airra-border/20 dark:border-white/5 pt-12 space-y-8">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-[9px] font-mono font-black uppercase text-[#2D6A4F] dark:text-emerald-400 bg-[#E8F0EC]/80 dark:bg-emerald-950/40 px-3.5 py-1.5 rounded-full">
              <HelpCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Article Insights
            </div>
            <h3 className="text-xl sm:text-2xl font-display font-black uppercase tracking-tight text-airra-text dark:text-white">
              Wellness Resource FAQ
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xl leading-relaxed font-sans font-semibold">
              Explore secondary technical details concerning our somatic framework and clinical research guidelines.
            </p>
          </div>

          <div id="article-faq-accordion" className="space-y-4">
            {[
              {
                question: `Are the somatic insights in "${post.title}" verified?`,
                answer: `Yes, all discussions regarding clinical AI and sensory longevity undergo peer validation based on public pubmed indices, heart rate variability studies, and psychiatric sensory ergonomics standards.`
              },
              {
                question: "Can I safely export my mental wellness logs and HRV coefficients?",
                answer: "Yes. From the dynamic settings page, you can extract your complete sensory milestones and telemetry matrices in compliant, human-readable formats."
              },
              {
                question: "How frequently does the AIRRA lab transmit new chronicles?",
                answer: "We publish detailed somatic chronicles and neuro-ergonomic whitepapers on a weekly schedule. Active members receive notifications instantly."
              },
              {
                question: "How can academic researchers cite these wellness papers?",
                answer: "You are welcome to reference our materials under standard CC-BY-NC citation requirements. Include the article URI and credit to the AIRRA Clinical Research Division."
              }
            ].map((faq, idx) => {
              const isExpanded = expandedFaqIndex === idx;
              return (
                <div 
                  key={idx} 
                  className="rounded-[1.5rem] bg-white dark:bg-zinc-900 border border-airra-border/50 dark:border-white/5 overflow-hidden transition-all duration-300"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedFaqIndex(isExpanded ? null : idx)}
                    className="w-full p-6 text-left flex items-center justify-between gap-4 font-sans focus:outline-none hover:bg-slate-50/50 dark:hover:bg-zinc-850/30 transition-colors cursor-pointer"
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

          {/* JSON-LD Structured Data Schema for Article and FAQs */}
          <script type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": [
                {
                  "@type": "Question",
                  "name": `Are the somatic insights in "${post.title}" verified?`,
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes, all discussions regarding clinical AI and sensory longevity undergo peer validation based on public pubmed indices, heart rate variability studies, and psychiatric sensory ergonomics standards."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Can I safely export my mental wellness logs and HRV coefficients?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. From the dynamic settings page, you can extract your complete sensory milestones and telemetry matrices in compliant, human-readable formats."
                  }
                },
                {
                  "@type": "Question",
                  "name": "How frequently does the AIRRA lab transmit new chronicles?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "We publish detailed somatic chronicles and neuro-ergonomic whitepapers on a weekly schedule. Active members receive notifications instantly."
                  }
                },
                {
                  "@type": "Question",
                  "name": "How can academic researchers cite these wellness papers?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "You are welcome to reference our materials under standard CC-BY-NC citation requirements. Include the article URI and credit to the AIRRA Clinical Research Division."
                  }
                }
              ]
            })}
          </script>
        </section>

        {/* Actionable Bottom Call to Action banner */}
        <section className="bg-airra-surface dark:bg-zinc-900 rounded-[2.5rem] border border-airra-border/45 dark:border-zinc-800 p-8 sm:p-12 text-center space-y-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl sm:text-3xl font-display font-black text-zinc-900 dark:text-white uppercase tracking-tight">Experience Infinite Resonance</h3>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto font-medium">
              Take complete sovereignty over your attention loops today. Unlock AES-256 secure journal archives, clinical therapy consultations, sleep calibrations, and diagnostics dashboards.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <Link 
              to="/pricing" 
              className="px-6 py-3 rounded-xl bg-[#3DB88A] text-white text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-opacity whitespace-nowrap shadow-md"
            >
              Examine Pricing Plans
            </Link>
            <Link 
              to="/login" 
              state={{ mode: 'signup' }}
              className="px-6 py-3 rounded-xl bg-airra-text dark:bg-white text-airra-bg dark:text-zinc-950 text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-opacity whitespace-nowrap"
            >
              Create Free Account
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
}
