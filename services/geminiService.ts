
import { GoogleGenAI } from "@google/genai";

export const geminiService = {
  // Fix: Using gemini-3-flash-preview for basic text tasks and direct process.env.API_KEY usage
  async suggestCTA(url: string, category: string): Promise<string> {
    try {
      // Initialize GoogleGenAI using process.env.API_KEY directly as per guidelines
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Given a URL "${url}" and category "${category}", suggest a catchy short "Call to Action" for a QR Code flyer (max 10 words). Return only the text.`,
      });
      // Fix: Correctly access response.text property (not a method)
      return response.text || "Scansiona per scoprire di più";
    } catch (error) {
      console.error("Gemini Error:", error);
      return "Scansiona per esplorare";
    }
  },

  // Fix: Using gemini-3-flash-preview for analytics insights and direct process.env.API_KEY usage
  async analyzeAnalytics(scanData: any): Promise<string> {
    try {
      // Initialize GoogleGenAI using process.env.API_KEY directly as per guidelines
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze these scan stats for a QR code: ${JSON.stringify(scanData)}. Provide a very brief 1-2 sentence insight or recommendation for improvement.`,
      });
      // Fix: Correctly access response.text property (not a method)
      return response.text || "L'andamento delle scansioni è regolare.";
    } catch (error) {
      console.error("Gemini Error:", error);
      return "Frequenza di scansione costante rispetto ai periodi precedenti.";
    }
  }
};
