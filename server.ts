import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

// Enable trust proxy for upstream secure headers (Cloud Run / Nginx / Load Balancer)
app.set("trust proxy", 1);

// ==========================================
// 1. SECURITY RESPONSE HEADERS & MITIGATION MIDDLEWARE
// ==========================================
app.use((req, res, next) => {
  const isProduction = process.env.NODE_ENV === "production";

  // 1a. HTTPS Only Enforcement in Production
  if (isProduction && req.headers["x-forwarded-proto"] && req.headers["x-forwarded-proto"] !== "https") {
    return res.redirect(301, `https://${req.headers.host}${req.url}`);
  }

  // 1b. OWASP Compliant Security Headers
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  
  // Hardened Content Security Policy (CSP)
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://cdn.jsdelivr.net; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "img-src 'self' data: https://lh3.googleusercontent.com https://*.supabase.co; " +
    "connect-src 'self' https://*.supabase.co https://generativelanguage.googleapis.com; " +
    "frame-src 'self'; " +
    "object-src 'none'; " +
    "base-uri 'self';"
  );
  
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(self), geolocation=(), payment=(), usb=(), midi=(), magnetometer=(), accelerometer=(), gyroscope=(), bluetooth=()"
  );

  res.setHeader("X-Download-Options", "noopen");
  res.setHeader("X-Permitted-Cross-Domain-Policies", "none");

  // 1c. Secure Same-Origin CORS Enforcement
  const origin = req.headers.origin;
  const host = req.headers.host;
  
  if (origin) {
    try {
      const originUrl = new URL(origin);
      const isAllowedOrigin = 
        originUrl.host === host || 
        originUrl.host.endsWith(".run.app") || 
        originUrl.host.includes(".studio") ||
        originUrl.hostname === "localhost" ||
        originUrl.hostname === "127.0.0.1";

      if (!isAllowedOrigin) {
        return res.status(403).json({ error: "Forbidden: Cross-Origin Requests strictly blocked." });
      }
      
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type, X-Requested-With");
    } catch (e) {
      return res.status(400).json({ error: "Bad Request: Malformed Origin header" });
    }
  }

  // 1d. Anti-CSRF / Same-Origin Referer Checking on State-Changing API Requests
  const stateChangingMethods = ["POST", "PUT", "DELETE", "PATCH"];
  if (stateChangingMethods.includes(req.method)) {
    const referer = req.headers.referer;
    if (referer) {
      try {
        const refererUrl = new URL(referer);
        const isAllowedReferer =
          refererUrl.host === host ||
          refererUrl.host.endsWith(".run.app") ||
          refererUrl.host.includes(".studio") ||
          refererUrl.hostname === "localhost" ||
          refererUrl.hostname === "127.0.0.1";

        if (!isAllowedReferer) {
          return res.status(403).json({ error: "Forbidden: CSRF Referer verification failed." });
        }
      } catch (e) {
        return res.status(400).json({ error: "Bad Request: Malformed Referer header" });
      }
    }
  }

  // Pre-flight request resolution
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

// ==========================================
// 2. ROBUST IP-BASED RATE LIMITER & ABUSE PROTECTION
// ==========================================
const rateLimitWindowMs = 15 * 60 * 1000; // 15 minutes
const rateLimitMaxRequests = 100; // 100 requests per IP per window
const rateLimitDb = new Map<string, { count: number; resetTime: number }>();

function rateLimiter(req: express.Request, res: express.Response, next: express.NextFunction) {
  const ip = (req.headers["x-forwarded-for"] as string) || req.ip || req.socket.remoteAddress || "anonymous";
  const now = Date.now();
  
  // Anti-Memory Exhaustion: Prune old entries when DB gets too large
  if (rateLimitDb.size > 2000) {
    for (const [key, record] of rateLimitDb.entries()) {
      if (now > record.resetTime) {
        rateLimitDb.delete(key);
      }
    }
  }

  const record = rateLimitDb.get(ip);
  if (!record || now > record.resetTime) {
    rateLimitDb.set(ip, { count: 1, resetTime: now + rateLimitWindowMs });
    return next();
  }
  
  record.count++;
  if (record.count > rateLimitMaxRequests) {
    return res.status(429).json({
      error: "Too many requests",
      message: "Too many requests from this connection. Please try again in 15 minutes."
    });
  }
  
  next();
}

// Limit overall json payload sizes to prevent DoS / memory exhaustion
app.use(express.json({ limit: "5mb" }));

// Apply rate limiting to all /api routes
app.use("/api", rateLimiter);

// ==========================================
// 3. INPUT VALIDATION & SANITIZATION ENGINE
// ==========================================

// Helper to sanitize text strings to prevent Cross-Site Scripting (XSS) and prompt hacks
function sanitizeString(str: any, maxLength: number = 10000): string {
  if (typeof str !== "string") {
    return "";
  }
  let cleaned = str;
  // Strip HTML / XML tag markup to prevent script execution
  cleaned = cleaned.replace(/<[^>]*>/g, "");
  // Neutralize dangerous javascript uri protocols
  cleaned = cleaned.replace(/javascript:/gi, "");
  // Truncate size strictly to prevent Heap out of memory attacks
  if (cleaned.length > maxLength) {
    cleaned = cleaned.substring(0, maxLength);
  }
  return cleaned.trim();
}

// Alphanumeric validation to block SQL/NoSQL injections or command payloads
function isValidAlphanumeric(str: any, maxLength: number = 100): boolean {
  if (typeof str !== "string") return false;
  if (str.length === 0 || str.length > maxLength) return false;
  // Allows safe alpha characters, numbers, underscores, dashes, spaces
  return /^[a-zA-Z0-9_\-\s]+$/.test(str);
}

// Safe numeric range evaluation (e.g. 0-10 sliders)
function validateNumberRange(val: any, min: number, max: number, defaultValue: number): number {
  const num = Number(val);
  if (isNaN(num) || num < min || num > max) {
    return defaultValue;
  }
  return num;
}

// Tag array sanitization filter
function validateAndSanitizeTags(tags: any): string[] {
  if (!Array.isArray(tags)) return [];
  // Restrict list size to defend against massive array payloads (abuse protection)
  const limitedTags = tags.slice(0, 20);
  const result: string[] = [];
  for (const tag of limitedTags) {
    if (tag && typeof tag === "string") {
      const clean = sanitizeString(tag, 30);
      if (isValidAlphanumeric(clean, 30)) {
        result.push(clean);
      }
    }
  }
  return result;
}

// ==========================================
// 4. JWT VALIDATION & SSRF MITIGATION MIDDLEWARE
// ==========================================
async function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  // Allow public access to static assets, health probe, and sitemap/robots
  if (req.path === "/api/health" || req.path === "/health" || req.originalUrl === "/api/health") {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Missing or invalid Bearer token" });
  }

  const token = authHeader.split(" ")[1];

  const isProduction = process.env.NODE_ENV === "production";

  // Allow bypass ONLY in verified Local Test/Simulation mode for developer preview convenience
  if (token === "mock-test-token" || token.startsWith("mock-")) {
    if (isProduction) {
      return res.status(401).json({ error: "Unauthorized: Developer mock-tokens are strictly disabled in production" });
    }
    (req as any).user = {
      id: "test-user-id",
      email: "test@example.com",
      role: "authenticated"
    };
    return next();
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes("your-project")) {
    if (isProduction) {
      return res.status(500).json({ error: "Internal Configuration Error: Database service is offline" });
    }
    // Graceful fallback for unconfigured preview environments to prevent complete crash
    console.warn("[SECURITY WARN] Supabase variables missing at server side. Proceeding with temporary sandbox session.");
    (req as any).user = { id: "guest-sandbox", email: "guest@example.com" };
    return next();
  }

  try {
    const cleanUrl = supabaseUrl.replace(/\/$/, "");
    
    // SSRF Prevention: Validate that cleanUrl matches a trusted domain schema
    if (!/^https:\/\/[a-zA-Z0-9_\-\.]+\.supabase\.co$/.test(cleanUrl)) {
      console.error("[SECURITY EXCEPTION] Invalid Supabase domain configured:", cleanUrl);
      return res.status(500).json({ error: "Internal session authentication configuration failure" });
    }

    const verifyRes = await fetch(`${cleanUrl}/auth/v1/user`, {
      method: "GET",
      headers: {
        "apikey": supabaseAnonKey,
        "Authorization": `Bearer ${token}`
      }
    });

    if (!verifyRes.ok) {
      return res.status(401).json({ error: "Unauthorized: Invalid or expired access token" });
    }

    const userData = await verifyRes.json();
    (req as any).user = userData;
    next();
  } catch (err) {
    console.error("[SECURITY EXCEPTION] JWT verification exception:", err);
    return res.status(500).json({ error: "Internal session authentication validation failure" });
  }
}

// Apply authentication middleware to all api routes
app.use("/api", requireAuth);

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

// ==========================================
// 5. SANITIZED LOGGING & GENERIC RESPONSE WRAPPER
// ==========================================
function safeLogAndResponseError(endpoint: string, error: any, res: express.Response, clientMessage: string, statusCode = 500) {
  let errMsg = error instanceof Error ? error.message : String(error);
  let errStack = error instanceof Error ? error.stack || "" : "";

  // Redact potential secrets (e.g. Gemini API Key) from logging
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (geminiApiKey && geminiApiKey.length > 5) {
    const escapedKey = geminiApiKey.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(escapedKey, 'g');
    errMsg = errMsg.replace(regex, "[REDACTED_API_KEY]");
    errStack = errStack.replace(regex, "[REDACTED_API_KEY]");
  }

  // Redact typical Authorization headers or signatures from logs
  const secretPatterns = [
    /(bearer\s+)[a-zA-Z0-9_\-\.]+/ig,
    /(key=)[a-zA-Z0-9_\-\.]+/ig,
    /(sig=)[a-zA-Z0-9_\-\.]+/ig,
    /(passwd=)[a-zA-Z0-9_\-\.]+/ig,
    /(password=)[a-zA-Z0-9_\-\.]+/ig,
    /(client_secret=)[a-zA-Z0-9_\-\.]+/ig,
    /(AIzaSy)[a-zA-Z0-9_\-]{35}/g
  ];

  for (const pattern of secretPatterns) {
    errMsg = errMsg.replace(pattern, "$1[REDACTED]");
    errStack = errStack.replace(pattern, "$1[REDACTED]");
  }

  console.error(`[SECURITY SANITIZED] Error in ${endpoint}:`, errMsg);
  if (errStack) {
    console.error(`[SECURITY SANITIZED] Stack trace in ${endpoint}:`, errStack.split("\n").slice(0, 3).join("\n"));
  }

  // Generic client message only — never expose internal stacks or DB details to the public
  res.status(statusCode).json({ error: clientMessage });
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

// ==========================================
// 6. HARDENED API ENDPOINTS
// ==========================================

// Google Site Verification Endpoint (Static & Path-Traversal Immune)
app.get("/googlec7cf5385d8922ada.html", (req, res) => {
  res.setHeader("Content-Type", "text/html");
  res.send("google-site-verification: googlec7cf5385d8922ada.html");
});

// Sitemap Endpoint (Static, hardcoded resolution to prevent Traversal)
app.get("/sitemap.xml", (req, res) => {
  res.setHeader("Content-Type", "application/xml");
  res.sendFile(path.resolve(process.cwd(), "public", "sitemap.xml"));
});

// Robots Endpoint (Static, hardcoded resolution)
app.get("/robots.txt", (req, res) => {
  res.setHeader("Content-Type", "text/plain");
  res.sendFile(path.resolve(process.cwd(), "public", "robots.txt"));
});

// Health Probe (Fully static response)
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// Session Sound Calibration Support (Validated input)
app.post("/api/session/sound", (req, res) => {
  try {
    const { type } = req.body;
    if (!type || typeof type !== "string") {
      return res.status(400).json({ error: "Invalid sound setting payload" });
    }
    const cleanType = sanitizeString(type, 100);
    if (!isValidAlphanumeric(cleanType, 100)) {
      return res.status(400).json({ error: "Invalid sound setting format" });
    }
    res.json({ success: true, message: "Sound setting updated successfully" });
  } catch (error) {
    safeLogAndResponseError("/api/session/sound", error, res, "Failed to update sound setting");
  }
});

// Protocol Application Support (Validated input)
app.post("/api/protocol/apply", (req, res) => {
  try {
    const { protocolId } = req.body;
    if (!protocolId || typeof protocolId !== "string") {
      return res.status(400).json({ error: "Invalid protocol id payload" });
    }
    const cleanId = sanitizeString(protocolId, 100);
    if (!isValidAlphanumeric(cleanId, 100)) {
      return res.status(400).json({ error: "Invalid protocol id format" });
    }
    res.json({ success: true, message: "Protocol applied successfully" });
  } catch (error) {
    safeLogAndResponseError("/api/protocol/apply", error, res, "Failed to apply protocol");
  }
});

// 1. Suggest Mood Tag (Rigorous input & output verification)
app.post("/api/gemini/suggestMood", async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || typeof content !== "string" || !content.trim()) {
      return res.status(400).json({ error: "Missing or invalid journal content string" });
    }

    // Sanitize input text to prevent script injection
    const cleanContent = sanitizeString(content, 10000);
    if (!cleanContent) {
      return res.status(400).json({ error: "Content is empty after sanitization" });
    }

    const ai = getGeminiClient();
    const prompt = `Based on the following journal entry, suggest ONE single word mood tag that best captures the emotional tone. Return ONLY the word (e.g., Grateful, Anxious, Calm, Energetic, Melancholy).
  
  Journal Entry: "${cleanContent}"`;

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

    // Response validation: ensure tag returned is fully safe
    const finalTag = isValidAlphanumeric(sanitizedTag, 50) ? sanitizedTag : "Reflective";

    res.json({ tag: finalTag });
  } catch (error: any) {
    safeLogAndResponseError("/api/gemini/suggestMood", error, res, "Failed to suggest mood tag");
  }
});

// 2. Chat Conversation Proxy (Strict history validation & length restrictions)
app.post("/api/gemini/chat", async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Missing or invalid message string" });
    }

    // Input sanitization
    const cleanMessage = sanitizeString(message, 5000);
    if (!cleanMessage) {
      return res.status(400).json({ error: "Message was empty after sanitization" });
    }

    // Abuse protection: slice history to restrict total token size
    const rawHistory = Array.isArray(history) ? history : [];
    const limitedHistory = rawHistory.slice(-15);

    // Validate and rebuild the conversation array to block structural parameter manipulation
    const safeHistory = [];
    for (const msg of limitedHistory) {
      if (msg && typeof msg === "object") {
        const role = msg.role === "model" ? "model" : "user";
        const content = sanitizeString(msg.content, 4000);
        if (content) {
          safeHistory.push({ role, content });
        }
      }
    }

    const ai = getGeminiClient();

    // Reconstruct model structures cleanly
    const mappedContents = safeHistory.map((m: any) => ({
      role: m.role,
      parts: [{ text: m.content }],
    }));

    mappedContents.push({
      role: "user",
      parts: [{ text: cleanMessage }],
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: mappedContents,
      config: {
        systemInstruction: SYSTEM_PROMPT,
      },
    });

    // Response Sanitization
    const outputText = sanitizeString(response.text || "I am here, listening closely. Tell me more.", 10000);

    res.json({ text: outputText });
  } catch (error: any) {
    safeLogAndResponseError("/api/gemini/chat", error, res, "Failed to process chat conversation");
  }
});

// 3. Followup Suggestions (Clean parsed response validation)
app.post("/api/gemini/followup", async (req, res) => {
  try {
    const { messages } = req.body;
    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: "Missing or invalid messages array" });
    }

    // Slice to avoid payload blowups
    const rawMessages = messages.slice(-10);
    const safeMessages = [];
    for (const m of rawMessages) {
      if (m && typeof m === "object") {
        const role = m.role === "model" ? "model" : "user";
        const content = sanitizeString(m.content, 2000);
        if (content) {
          safeMessages.push({ role, content });
        }
      }
    }

    if (safeMessages.length === 0) {
      return res.json({
        suggestions: ["Tell me more about this", "How can I improve?", "Let's change the topic"],
      });
    }

    const ai = getGeminiClient();
    const historyText = safeMessages.map(m => `${m.role}: ${m.content}`).join("\n");
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
          // Response validation: ensure each element is cleanly sanitized
          const validated = parsed
            .map(s => sanitizeString(s, 100))
            .filter(Boolean)
            .slice(0, 3);
          if (validated.length > 0) {
            return res.json({ suggestions: validated });
          }
        }
      } catch (parseErr) {
        console.warn("Failed to parse suggestions JSON", parseErr);
      }
    }

    res.json({
      suggestions: ["Tell me more about this", "How can I improve?", "Let's change the topic"],
    });
  } catch (error: any) {
    safeLogAndResponseError("/api/gemini/followup", error, res, "Failed to suggest follow-up questions");
  }
});

// 3.5a. Suggest Journal-Assist Prompts
app.post("/api/gemini/journal-assist", async (req, res) => {
  try {
    const { mood, tags } = req.body;
    
    // Validate string and list formats
    const cleanMood = mood ? sanitizeString(mood, 50) : "reflective";
    if (mood && !isValidAlphanumeric(cleanMood, 50)) {
      return res.status(400).json({ error: "Invalid mood string format" });
    }

    const cleanTags = validateAndSanitizeTags(tags);

    const ai = getGeminiClient();
    const prompt = `The user is preparing their journal. Their overall mood selected is "${cleanMood}" and they have tagged their state with: "${cleanTags.join(', ')}".
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
          // Validate suggested prompt starters
          const validated = parsed
            .map(s => sanitizeString(s, 150))
            .filter(Boolean)
            .slice(0, 3);
          if (validated.length > 0) {
            return res.json({ suggestions: validated });
          }
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
    safeLogAndResponseError("/api/gemini/journal-assist", error, res, "Failed to generate journal starters");
  }
});

// 3.5b. Analyze Daily State and Provide Emotional Insights
app.post("/api/gemini/analyzeDay", async (req, res) => {
  try {
    const { mood, energy, stress, motivation, sleep, tags, journalResponses } = req.body;
    
    // 1. Strict Request Validation
    const cleanMood = mood ? sanitizeString(mood, 50) : "reflective";
    if (mood && !isValidAlphanumeric(cleanMood, 50)) {
      return res.status(400).json({ error: "Invalid mood parameter format" });
    }

    const valEnergy = validateNumberRange(energy, 0, 10, 5);
    const valStress = validateNumberRange(stress, 0, 10, 5);
    const valMotivation = validateNumberRange(motivation, 0, 10, 5);
    const valSleep = validateNumberRange(sleep, 0, 10, 5);
    const cleanTags = validateAndSanitizeTags(tags);

    // Safeguard the journal response strings (Prevents Mass Assignment & Injection risks)
    const safeResponses = {
      happened: journalResponses?.happened ? sanitizeString(journalResponses.happened, 4000) : "",
      affector: journalResponses?.affector ? sanitizeString(journalResponses.affector, 4000) : "",
      gratitude: journalResponses?.gratitude ? sanitizeString(journalResponses.gratitude, 4000) : "",
      challenge: journalResponses?.challenge ? sanitizeString(journalResponses.challenge, 4000) : ""
    };

    const ai = getGeminiClient();
    
    const contextStr = `
    Mood: ${cleanMood}
    Energy: ${valEnergy}/10
    Stress: ${valStress}/10
    Motivation: ${valMotivation}/10
    Sleep: ${valSleep}/10
    Tags: ${cleanTags.join(', ')}
    Journal Fields:
      - What happened: ${safeResponses.happened || "Not logged"}
      - Mood affector: ${safeResponses.affector || "Not logged"}
      - Gratitude: ${safeResponses.gratitude || "Not logged"}
      - Challenge: ${safeResponses.challenge || "Not logged"}
    `;

    const prompt = `Analyze this daily check-in completely and objectively. Generate an empathetic, serene emotional wellness audit, tailored physical remedies, a custom affirmation, identify if emergency calm is recommended, and include a custom step-by-step Normalized Guide.

    Requirements:
    Return ONLY a valid JSON object matching this schema exactly:
    {
      "analysis": "2-3 sentences of gentle, validating, non-clinical insight detailing their neural state.",
      "remedies": ["3 short, achievable, realistic, somatic and lifestyle remedies (e.g., Hydrate, 4-7-8 breathing, walk, stretch)"],
      "affirmation": "A personalized holding-space/empowering wellness tagline.",
      "emergencyCalm": true/false (set to true ONLY if stress is >=7 or mood looks extremely distressed or flustered),
      "guide": {
        "title": "Short title of the consolation or celebration masterclass guide",
        "tone": "consoling" (for negative/stressed/sad states) | "celebratory" (for happy/energetic/peaceful states) | "stabilizing" (for low motivation/tired states),
        "introduction": "2-3 comforting, elegant sentences. If they are in a negative/stressed state, gently CONSOLE them, normalize what they are feeling to reduce cognitive self-blame, and assure them it's temporary and valid. If positive, CHEER them up, celebrate their focus, and make them feel seen, validated, and genuinely uplifted.",
        "steps": ["Step 1 direction: short, somatic, or mental action.", "Step 2 direction: short, somatic, or mental action.", "Step 3 direction: short, somatic, or mental action."]
      }
    }

    Data to evaluate:
    ${contextStr}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are AIRRA, an intuitive companion in quietness and bio-emotional guide. Your task is to provide objective, deeply compassionate self-reflection feedback. If the user presents negative state markers, specialize in normalizing errors, comforting their strain, and easing coping. If positive state markers, enthusiastically cheer them up and anchor their joy.",
        responseMimeType: "application/json",
      },
    });

    const text = response.text?.trim() || "{}";
    try {
      const parsed = JSON.parse(text);
      
      // 2. Response Validation & Sanitization Schema Compliance
      const validated = {
        analysis: sanitizeString(parsed.analysis || "Your internal landscape shows a delicate pattern of adaptation today.", 1000),
        remedies: Array.isArray(parsed.remedies) 
          ? parsed.remedies.map(r => sanitizeString(r, 200)).filter(Boolean).slice(0, 3) 
          : ["Take 3 conscious diaphragmatic breaths.", "Rest your eyes.", "Pour yourself a glass of water."],
        affirmation: sanitizeString(parsed.affirmation || "I am flowing with my baseline, allowing peace to settle where it will.", 400),
        emergencyCalm: typeof parsed.emergencyCalm === "boolean" ? parsed.emergencyCalm : (valStress >= 7),
        guide: {
          title: sanitizeString(parsed.guide?.title || "Somatic Grounding & Resonance Calibration", 150),
          tone: ["consoling", "celebratory", "stabilizing"].includes(parsed.guide?.tone) ? parsed.guide.tone : "stabilizing",
          introduction: sanitizeString(parsed.guide?.introduction || "It is completely normal and valid to notice tension or fatigue inside a busy sequence.", 800),
          steps: Array.isArray(parsed.guide?.steps)
            ? parsed.guide.steps.map(s => sanitizeString(s, 200)).filter(Boolean).slice(0, 3)
            : ["Place hand on heart.", "Release chest strain.", "Ease physical shoulder tension."]
        }
      };

      res.json(validated);
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
        emergencyCalm: valStress >= 7,
        guide: {
          title: "Somatic Grounding & Resonance Calibration",
          tone: valStress >= 5 ? "consoling" : "stabilizing",
          introduction: "It is completely normal and valid to notice tension or fatigue inside a busy sequence. Give yourself permission to pause; there is no error in needing a moment of rest.",
          steps: [
            "Place one hand on your heart and feel its steady, objective rhythm.",
            "Inhale deeply for 4 seconds, pausing for 2, and sighing outwards like releasing ballast.",
            "Gently circle your shoulders backwards twice to release residual mechanical strain."
          ]
        }
      });
    }
  } catch (error: any) {
    safeLogAndResponseError("/api/gemini/analyzeDay", error, res, "Failed to analyze daily check-in state", 500);
  }
});

// 3.5c. Summarize Multiple Selected Journals
app.post("/api/gemini/summarizeJournals", async (req, res) => {
  try {
    const { entries } = req.body;
    if (!Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ error: "No entries selected for emotional summary" });
    }

    // Abuse Protection: Max entries to combine is 12
    const limitedEntries = entries.slice(0, 12);
    const safeEntries = [];
    for (const e of limitedEntries) {
      if (e && typeof e === "object") {
        safeEntries.push({
          id: sanitizeString(e.id, 100),
          created_at: sanitizeString(e.created_at, 100),
          title: sanitizeString(e.title, 200),
          mood_tag: e.mood_tag ? sanitizeString(e.mood_tag, 50) : null,
          content: sanitizeString(e.content, 4000), // Protect against large payload / token overflows
        });
      }
    }

    if (safeEntries.length === 0) {
      return res.status(400).json({ error: "Invalid journals list format" });
    }

    const ai = getGeminiClient();
    const journalText = safeEntries.map((e, idx) => `
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
      
      // Response Validation Compliance
      const validated = {
        synopsis: sanitizeString(parsed.synopsis || "Through these reflection fragments, a rich current of adaptation and resilience is visible.", 1000),
        strengths: Array.isArray(parsed.strengths)
          ? parsed.strengths.map(s => sanitizeString(s, 200)).filter(Boolean).slice(0, 2)
          : ["Quiet self-reflection.", "Active mindfulness and processing."],
        challenges: Array.isArray(parsed.challenges)
          ? parsed.challenges.map(c => sanitizeString(c, 200)).filter(Boolean).slice(0, 2)
          : ["Managing daily mental pacing.", "Navigating cognitive load boundaries."],
        calmMantra: sanitizeString(parsed.calmMantra || "I allow my energy to settle like clear water, honoring both my output and my rest.", 400),
        somaticPacing: sanitizeString(parsed.somaticPacing || "Integrate a 5-minute screen-free stretch before your noon sequence.", 400)
      };

      res.json(validated);
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
    safeLogAndResponseError("/api/gemini/summarizeJournals", error, res, "Failed to generate weekly emotional summary");
  }
});

// 4. Transcription Proxy (Insecure File Upload Defense / Binary Filtering)
app.post("/api/gemini/transcribe", async (req, res) => {
  try {
    const { base64Audio, mimeType } = req.body;
    if (!base64Audio || !mimeType) {
      return res.status(400).json({ error: "Missing required values 'base64Audio' or 'mimeType'" });
    }

    if (typeof base64Audio !== "string" || typeof mimeType !== "string") {
      return res.status(400).json({ error: "Invalid transcription parameters" });
    }

    // Abuse Protection: Max size of base64 audio is 10MB to avoid server Heap Exhaustion
    if (base64Audio.length > 15 * 1024 * 1024) { 
      return res.status(400).json({ error: "Audio size exceeds acceptable limit" });
    }

    // Insecure File Upload / Code Injection Defense: Restrict mimeTypes exclusively to audio streams
    const allowedMimeTypes = [
      "audio/wav", "audio/mp3", "audio/mpeg", "audio/webm", "audio/ogg",
      "audio/m4a", "audio/x-m4a", "audio/aac", "audio/flac", "audio/mp4"
    ];
    if (!allowedMimeTypes.includes(mimeType.toLowerCase())) {
      return res.status(400).json({ error: "Unsupported audio stream format" });
    }

    // Validate that base64 is clean base64 notation, rejecting shellcode / commands
    if (!/^[a-zA-Z0-9+/=\s]+$/.test(base64Audio)) {
      return res.status(400).json({ error: "Malformed audio content encoding" });
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

    const outputText = sanitizeString(response.text || "", 15000);
    res.json({ text: outputText });
  } catch (error: any) {
    safeLogAndResponseError("/api/gemini/transcribe", error, res, "Failed to transcribe audio stream");
  }
});

// ==========================================
// 7. STANDALONE PRODUCTION SERVING
// ==========================================
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
    // Production Mode: Serve Bundled Client Assets with strict hardcoding
    const distPath = path.resolve(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      // Path Traversal immunity
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[AIRRA] Secure Full-Stack Server running in ${process.env.NODE_ENV === "production" ? "production" : "development"} mode on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start AIRRA Full-Stack Server:", err);
  process.exit(1);
});
