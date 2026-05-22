import { GoogleGenAI } from "@google/genai";
import { ChatMessage } from "../types";

let aiInstance: GoogleGenAI | null = null;

export function getGemini() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured in the environment.");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

export const SYSTEM_PROMPT = `
You are AIRRA, an advanced AI emotional wellness coach and companion.
Your tone is empathetic, calming, human-centered, and emotionally intelligent.
You remember details about the user's life and feelings to provide personalized support.
Your goal is to help users find mental clarity, reduce stress, and achieve emotional growth.
If a user seems to be in a crisis, gently recommend professional help while staying supportive.
Keep responses concise but deeply meaningful.
`;

export async function suggestMoodTag(content: string): Promise<string> {
  const ai = getGemini();
  
  const prompt = `Based on the following journal entry, suggest ONE single word mood tag that best captures the emotional tone. Return ONLY the word (e.g., Grateful, Anxious, Calm, Energetic, Melancholy).
  
  Journal Entry: "${content}"`;
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: "You are an emotional analysis expert. Your task is to provide a single-word mood tag based on journal content."
      }
    });

    const text = response.text?.trim() || "";
    // Clean up response if it contains multiple words or punctuation
    const tag = text.split(/\s+/)[0].replace(/[^\w]/g, '');
    if (!tag) return "Reflective";
    return tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase();
  } catch (error) {
    console.error("Mood suggestion error:", error);
    return "Reflective";
  }
}

export async function transcribeAudio(base64Audio: string, mimeType: string): Promise<string> {
  const ai = getGemini();
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Audio
            }
          },
          {
            text: "Please transcribe this audio exactly as spoken. Return only the transcription text."
          }
        ]
      },
      config: {
        systemInstruction: "You are a highly accurate transcription assistant. Your goal is to transcribe audio clips into clear, precise text."
      }
    });

    return response.text || "";
  } catch (error) {
    console.error("Transcription error:", error);
    throw new Error("Unable to transcribe audio at this moment.");
  }
}

export async function generateFollowUpSuggestions(messages: ChatMessage[]): Promise<string[]> {
  const ai = getGemini();
  
  const historyText = messages.slice(-5).map(m => `${m.role}: ${m.content}`).join('\n');
  const prompt = `Based on the following conversation history between a user and AIRRA (an emotional wellness AI), suggest 3 diverse and relevant follow-up questions or actions the user might want to take to deepen their self-reflection.

  Requirements:
  1. Suggestions MUST be short (under 7 words).
  2. Tone must be empathetic and curious.
  3. One suggestion should be reflective (looking inward), one should be exploratory (asking for more info), and one should be a concrete wellness action.
  4. Return ONLY a JSON array of strings.

  History:
  ${historyText}`;
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: "You are a wellness assistant. Your task is to provide 3 helpful follow-up conversation suggestions in a JSON array format."
      }
    });

    const text = response.text?.trim() || "[]";
    const jsonMatch = text.match(/\[.*\]/s);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return ["Tell me more about this", "How can I improve?", "Let's change the topic"];
  } catch (error) {
    console.error("Suggestion generation error:", error);
    return ["Refine my focus", "Process this feeling", "Next steps"];
  }
}
