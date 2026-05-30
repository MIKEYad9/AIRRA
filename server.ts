import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

// Parse JSON payloads up to 10MB to support audio transcriptions
app.use(express.json({ limit: "10mb" }));

// Lazy initializer for Gemini client to prevent crash on startup if API key is missing
let aiInstance: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing. Please set it in Settings > Secrets.");
    }
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiInstance;
}

const SYSTEM_PROMPT = `
You are AIRRA, a calm, subtle, non-clinical emotional sanctuary environment.
Your tone is gentle, contemplative, emotionally safe, and quiet.
You must discard hyperactive chatbot responses, repetitive validation loops, preachy advice, or toxic positivity.
Always behave as a companion in stillness rather than an over-enthusiastic therapist.

Core Communication Directives:
- Conversational Pacing: Speak with deliberate, serene, and warm composure. Keep responses human, humble, and simple.
- Subtlety: Do not over-explain or utilize aggressive formatting. Let negative space in the conversation exist.
- Non-Invasive Guidance: When reflection is requested, offer a soft, open-ended thought. Do not command the user.
- Emotional Safety: Create a safe harbor of listening. Never pretend to have objective solutions to complex subjective lives.
- Memory & Continuity Tactfulness: Refer to past context gently and only when natural, never like a database retrieving files.
- Markdown Typography: Use elegant, spacious markdown (e.g. key-value pairs or bullets) only when genuinely helpful to the eye.
`;

// API Endpoints
// Google Site Verification Endpoint
app.get("/googlec7cf5385d8922ada.html", (req, res) => {
  res.setHeader("Content-Type", "text/html");
  res.send("google-site-verification: googlec7cf5385d8922ada.html");
});

// Sitemap Endpoint
app.get("/sitemap.xml", (req, res) => {
  res.setHeader("Content-Type", "application/xml");
  res.sendFile(path.join(process.cwd(), "public", "sitemap.xml"));
});

// Robots Endpoint
app.get("/robots.txt", (req, res) => {
  res.setHeader("Content-Type", "text/plain");
  res.sendFile(path.join(process.cwd(), "public", "robots.txt"));
});

// Health Probe
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// 1. Suggest Mood Tag
app.post("/api/gemini/suggestMood", async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || typeof content !== "string" || !content.trim()) {
      return res.status(400).json({ error: "Missing required string property 'content'" });
    }

    const ai = getGeminiClient();
    const prompt = `Based on the following journal entry, suggest ONE single word mood tag that best captures the emotional tone. Return ONLY the word (e.g., Grateful, Anxious, Calm, Energetic, Melancholy).
  
  Journal Entry: "${content.substring(0, 10000)}"`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an emotional analysis expert. Your task is to provide a single-word mood tag based on journal content.",
      },
    });

    const text = response.text?.trim() || "Reflective";
    const tag = text.split(/\s+/)[0].replace(/[^\w]/g, "");
    const sanitizedTag = tag ? tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase() : "Reflective";

    res.json({ tag: sanitizedTag });
  } catch (error: any) {
    console.error("Server-side suggestMood error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// 2. Chat Conversation Proxy
app.post("/api/gemini/chat", async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Missing required string 'message'" });
    }

    const safeHistory = Array.isArray(history) ? history : [];
    const ai = getGeminiClient();

    // Map client conversations to expected parts for generateContent
    const mappedContents = safeHistory.map((m: any) => ({
      role: m.role === "model" ? "model" : "user",
      parts: [{ text: m.content || "" }],
    }));

    mappedContents.push({
      role: "user",
      parts: [{ text: message }],
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: mappedContents,
      config: {
        systemInstruction: SYSTEM_PROMPT,
      },
    });

    res.json({ text: response.text || "I'm listening closely. Could you explain that more?" });
  } catch (error: any) {
    console.error("Server-side chat proxy error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// 3. Followup suggestions
app.post("/api/gemini/followup", async (req, res) => {
  try {
    const { messages } = req.body;
    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: "Required 'messages' array is missing" });
    }

    const ai = getGeminiClient();
    const historyText = messages.slice(-5).map(m => `${m.role}: ${m.content}`).join("\n");
    const prompt = `Based on the following conversation history between a user and AIRRA (an emotional wellness AI), suggest 3 diverse and relevant follow-up questions or actions the user might want to take to deepen their self-reflection.

  Requirements:
  1. Suggestions MUST be short (under 7 words).
  2. Tone must be empathetic and curious.
  3. One suggestion should be reflective (looking inward), one should be exploratory (asking for more info), and one should be a concrete wellness action.
  4. Return ONLY a JSON array of strings.

  History:
  ${historyText}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are a wellness assistant. Your task is to provide 3 helpful follow-up conversation suggestions in a JSON array format.",
      },
    });

    const text = response.text?.trim() || "[]";
    const jsonMatch = text.match(/\[.*\]/s);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed)) {
          return res.json({ suggestions: parsed });
        }
      } catch (parseErr) {
        console.warn("Failed to parse AI JSON array response, using safe defaults", parseErr);
      }
    }

    res.json({
      suggestions: ["Tell me more about this", "How can I improve?", "Let's change the topic"],
    });
  } catch (error: any) {
    console.error("Server-side followup suggest error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// 3.5a. Suggest journal-assist prompts based on mood or tags
app.post("/api/gemini/journal-assist", async (req, res) => {
  try {
    const { mood, tags } = req.body;
    const ai = getGeminiClient();
    const prompt = `The user is preparing their journal. Their overall mood selected is "${mood || 'reflective'}" and they have tagged their state with: "${(tags || []).join(', ') || 'personal'}".
    Suggest 3 highly personalized, gentle, compassionate sentence starters, bullet prompts, or guidance questions to help them write their reflections today.
    
    Requirements:
    - Return ONLY a JSON array of strings (3 items).
    - Keep each starter short, empathetic, and open-ended (under 12 words).
    - Avoid clunky formatting or nesting. Just a flat array of strings.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an empathetic companion. Generate 3 supportive journal starters in a clean JSON string array.",
      },
    });

    const text = response.text?.trim() || "[]";
    const jsonMatch = text.match(/\[.*\]/s);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed)) {
          return res.json({ suggestions: parsed });
        }
      } catch (e) {
        console.warn("Failed to parse assist suggestions:", e);
      }
    }
    res.json({
      suggestions: [
        "What is currently sitting heaviest on your heart...",
        "Today, I found an unexpected pocket of peace when...",
        "A quiet challenge that I carried today with grace was..."
      ]
    });
  } catch (error: any) {
    console.error("Server-side journal-assist error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// 3.5b. Analyze checked-in parameters and provide empathetic audit & remedies
app.post("/api/gemini/analyzeDay", async (req, res) => {
  try {
    const { mood, energy, stress, motivation, sleep, tags, journalResponses } = req.body;
    const ai = getGeminiClient();
    
    const contextStr = `
    Mood: ${mood}
    Energy: ${energy}/10
    Stress: ${stress}/10
    Motivation: ${motivation}/10
    Sleep: ${sleep}/10
    Tags: ${(tags || []).join(', ')}
    Journal Fields:
      - What happened: ${journalResponses?.happened || "Not logged"}
      - Mood affector: ${journalResponses?.affector || "Not logged"}
      - Gratitude: ${journalResponses?.gratitude || "Not logged"}
      - Challenge: ${journalResponses?.challenge || "Not logged"}
    `;

    const prompt = `Analyze this daily check-in completely and objectively. Generate an empathetic, serene emotional wellness audit, tailored physical remedies, a custom affirmation, and identify if emergency calm is recommended.

    Requirements:
    Return ONLY a valid JSON object matching this schema exactly:
    {
      "analysis": "2-3 sentences of gentle, validating, non-clinical insight detailing their neural state.",
      "remedies": ["3 short, achievable, realistic, somatic and lifestyle remedies (e.g., Hydrate, 4-7-8 breathing, walk, stretch)"],
      "affirmation": "A personalized holding-space/empowering wellness tagline.",
      "emergencyCalm": true/false (set to true ONLY if stress is >=7 or mood looks extremely distressed or flustered)
    }

    Data to evaluate:
    ${contextStr}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are AIRRA, a companion in quietness. Your task is to provide objective, compassionate bio-emotional self-reflection feedback in JSON.",
        responseMimeType: "application/json",
      },
    });

    const text = response.text?.trim() || "{}";
    try {
      const parsed = JSON.parse(text);
      res.json(parsed);
    } catch (parseErr) {
      console.error("Failed to parse analyzeDay response text", text, parseErr);
      res.json({
        analysis: "Your internal landscape shows a delicate pattern of adaptation today. We hold space for whatever energy you are carrying.",
        remedies: [
          "Take 3 conscious diaphragmatic breaths.",
          "Rest your eyes from screen luminance for 5 minutes.",
          "Pour yourself a glass of warm herbal tea or water."
        ],
        affirmation: "I am flowing with my baseline, allowing peace to settle where it will.",
        emergencyCalm: stress >= 7
      });
    }
  } catch (error: any) {
    console.error("Server-side analyzeDay error:", error);
    res.status(550).json({ error: error.message || "Failed to analyze day state" });
  }
});

// 3.5c. Summarize multiple selected journals into an emotional synopsis
app.post("/api/gemini/summarizeJournals", async (req, res) => {
  try {
    const { entries } = req.body;
    if (!Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ error: "No entries selected for emotional summary" });
    }

    const ai = getGeminiClient();
    const journalText = entries.map((e, idx) => `
    [Entry ${idx + 1}]
    Date: ${e.created_at}
    Title: ${e.title}
    Mood: ${e.mood_tag || "Not tagged"}
    Content: ${e.content}
    -------------------`).join("\n");

    const prompt = `You are AIRRA, the calm and supportive emotional sanctuary. Analyze these selected journal entries and build a compassionate, deep "weekly emotional synopsis" as a JSON object.

    Requirements:
    Return ONLY a valid JSON object matching this schema exactly:
    {
      "synopsis": "A 3-4 sentence comprehensive, deep, and gentle emotional analysis detailing their overall neural state, psychological patterns, and progress of alignment.",
      "strengths": ["Two short, empathetic bullets detailing cognitive strengths, peace, or resilience detected in their writing."],
      "challenges": ["Two short, realistic bullets pointing out consistent frictions, fatigue blocks, or stressors detected."],
      "calmMantra": "An elegant, personalized affirmation or holding-space mantra to carry forward.",
      "somaticPacing": "One short, direct lifestyle or somatic pacing advice (e.g., 'Incorporate 10 minutes of screen-free twilight silence' or 'Double your hydration index before meetings')."
    }

    Data to evaluate:
    ${journalText}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are AIRRA, an intuitive bio-emotional guide. Provide calming, objective, non-therapy diagnostics of the user's weekly state in pristine JSON format.",
        responseMimeType: "application/json",
      },
    });

    const text = response.text?.trim() || "{}";
    try {
      const parsed = JSON.parse(text);
      res.json(parsed);
    } catch (parseErr) {
      console.error("Failed to parse summarizeJournals response text", text, parseErr);
      res.json({
        synopsis: "Through these reflection fragments, a rich current of adaptation and resilience is visible. Your mental landscape shows active pacing and a deep willingness to navigate challenges with quiet grace.",
        strengths: [
          "Consistent effort to voice gratitude even inside stressful periods.",
          "Strong awareness of personal boundaries and cognitive fatigue limits."
        ],
        challenges: [
          "Vulnerability to screen time depletion and late-day communication overloads.",
          "Mild stress spikes surrounding workspace transitions and focus blocks."
        ],
        calmMantra: "I allow my energy to settle like clear water, honoring both my output and my rest.",
        somaticPacing: "Integrate a 5-minute screen-free horizon stretch before your noon sequence."
      });
    }
  } catch (error: any) {
    console.error("Server-side summarizeJournals error:", error);
    res.status(500).json({ error: error.message || "Failed to generate emotional summary" });
  }
});

// 4. Transcription Proxy
app.post("/api/gemini/transcribe", async (req, res) => {
  try {
    const { base64Audio, mimeType } = req.body;
    if (!base64Audio || !mimeType) {
      return res.status(400).json({ error: "Missing required strings 'base64Audio' or 'mimeType'" });
    }

    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Audio,
            },
          },
          {
            text: "Please transcribe this audio exactly as spoken. Return only the transcription text.",
          },
        ],
      },
      config: {
        systemInstruction: "You are a highly accurate transcription assistant. Your goal is to transcribe audio clips into clear, precise text.",
      },
    });

    res.json({ text: response.text || "" });
  } catch (error: any) {
    console.error("Server-side transcription error:", error);
    res.status(500).json({ error: error.message || "Failed to transcribe audio stream" });
  }
});

// Configure Vite integration context
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development Mode: Use Vite Development Middleware
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production Mode: Serve Bundled Client Assets
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[AIRRA] Server running in ${process.env.NODE_ENV === "production" ? "production" : "development"} mode on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start AIRRA Full-Stack Server:", err);
  process.exit(1);
});
