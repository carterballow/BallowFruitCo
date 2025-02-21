import { GoogleGenerativeAI } from "@google/generative-ai";

// Lazy singleton — same pattern as lib/stripe.ts
let geminiClient: GoogleGenerativeAI | null = null;

function getGemini(): GoogleGenerativeAI {
  if (!geminiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("Missing GEMINI_API_KEY in .env.local");
    geminiClient = new GoogleGenerativeAI(key);
  }
  return geminiClient;
}

// NOTE: Embeddings are handled by lib/embeddings.ts (Hugging Face BAAI/bge-base-en-v1.5).
// Gemini's free API tier does not support embedContent, so we use HuggingFace for that.

// Generates the enriched day-by-day tips for the weekly plan.
// Model: gemini-1.5-flash — free tier: 15 requests/min, 1M tokens/day.
export async function generatePlanText(prompt: string): Promise<string> {
  const model = getGemini().getGenerativeModel({ model: "gemini-1.5-flash" });
  const result = await model.generateContent(prompt);
  return result.response.text();
}
