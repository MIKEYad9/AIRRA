import { ChatMessage } from "../types";

export const SYSTEM_PROMPT = `
You are AIRRA, an advanced AI emotional wellness coach and companion.
Your tone is empathetic, calming, human-centered, and emotionally intelligent.
Your goal is to help users find mental clarity, reduce stress, and achieve emotional growth.
If a user seems to be in a crisis, gently recommend professional help while staying supportive.
Keep responses concise but deeply meaningful. Output responses using rich Markdown typography.
`;

/**
 * Suggests a single-word mood tag based on journal content.
 * Calls secure backend proxy endpoint.
 */
export async function suggestMoodTag(content: string): Promise<string> {
  if (!content || !content.trim()) return "Reflective";

  try {
    const response = await fetch("/api/gemini/suggestMood", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.tag || "Reflective";
  } catch (error) {
    console.error("Client suggestMoodTag error, falling back:", error);
    return "Reflective";
  }
}

/**
 * Transcribes audio via safe voice model.
 * Calls secure backend proxy endpoint.
 */
export async function transcribeAudio(base64Audio: string, mimeType: string): Promise<string> {
  if (!base64Audio) return "";

  try {
    const response = await fetch("/api/gemini/transcribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ base64Audio, mimeType }),
    });

    if (!response.ok) {
      throw new Error(`Failed to transcribe: ${response.statusText}`);
    }

    const data = await response.json();
    return data.text || "";
  } catch (error) {
    console.error("Client transcribeAudio error:", error);
    throw new Error("Unable to transcribe audio at this moment. Please try again.");
  }
}

/**
 * Generates 3 empathetic, contextually relevant suggestions to deepen conversations.
 * Calls secure backend proxy endpoint.
 */
export async function generateFollowUpSuggestions(messages: ChatMessage[]): Promise<string[]> {
  const safeMessages = Array.isArray(messages) ? messages : [];
  if (safeMessages.length === 0) {
    return ["Reflect further", "Let's explore key triggers", "A healthy grounding step"];
  }

  try {
    const response = await fetch("/api/gemini/followup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages: safeMessages }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.suggestions || ["Reflect further", "Let's explore key triggers", "A healthy grounding step"];
  } catch (error) {
    console.error("Client generateFollowUpSuggestions error, falling back:", error);
    return ["Refine my focus", "Process this feeling", "Next steps"];
  }
}

/**
 * Sends a message and gets a response from AIRRA Chat model.
 * Calls secure backend proxy endpoint.
 */
export async function sendChatMessage(message: string, history: ChatMessage[]): Promise<string> {
  try {
    const response = await fetch("/api/gemini/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message, history }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server responded with ${response.status}`);
    }

    const data = await response.json();
    return data.text || "I am here, listening. Please continue.";
  } catch (error: any) {
    console.error("Client chat proxy error:", error);
    return `Mindfulness Connection Alert: I am currently feeling a bit offline, but I'm holding space for you. (Error: ${error.message || "Endpoint unreachable"})`;
  }
}
