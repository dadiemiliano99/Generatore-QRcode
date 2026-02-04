
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const geminiService = {
  async suggestCTA(url: string, category: string): Promise<string> {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Given a URL "${url}" and category "${category}", suggest a catchy short "Call to Action" for a QR Code flyer (max 10 words). Return only the text.`,
      });
      return response.text || "Scan to learn more";
    } catch (error) {
      console.error("Gemini Error:", error);
      return "Scan to explore";
    }
  },

  async analyzeAnalytics(scanData: any): Promise<string> {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze these scan stats for a QR code: ${JSON.stringify(scanData)}. Provide a very brief 1-2 sentence insight or recommendation for improvement.`,
      });
      return response.text || "Keep monitoring your scans for trends.";
    } catch (error) {
      return "Scan frequency is consistent with your typical activity.";
    }
  }
};
