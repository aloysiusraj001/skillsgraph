import { GoogleGenAI } from "@google/genai";

export function getGeminiClient() {
  const raw = process.env.GEMINI_API_KEY;
  const apiKey = raw ? raw.trim().replace(/^["']|["']$/g, "") : "";
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not configured. Check your API key in Settings > Secrets.",
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}
