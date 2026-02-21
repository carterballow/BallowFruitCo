import { GoogleGenerativeAI } from "@google/generative-ai";

let geminiClient: GoogleGenerativeAI | null = null;

function getGemini(): GoogleGenerativeAI {
  if (!geminiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("Missing GEMINI_API_KEY in .env.local");
    geminiClient = new GoogleGenerativeAI(key);
  }
  return geminiClient;
}

export async function generatePlanText(prompt: string): Promise<string> {
  const model = getGemini().getGenerativeModel({ model: "gemini-2.5-flash" });
  const result = await model.generateContent(prompt);
  return result.response.text();
}
