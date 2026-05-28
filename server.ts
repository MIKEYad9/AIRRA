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
