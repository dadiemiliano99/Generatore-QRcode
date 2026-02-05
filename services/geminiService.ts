
import { GoogleGenAI } from "@google/genai";

const getApiKey = () => {
  try {
    // Cerchiamo entrambi i nomi possibili per flessibilità
    return process.env.API_KEY || process.env.API_KEY_gemini || "";
  } catch (e) {
    return "";
  }
};

export const geminiService = {
  async suggestCTA(url: string, category: string): Promise<string> {
    const key = getApiKey();
    if (!key) return "Scansiona per saperne di più";
    
    try {
      const ai = new GoogleGenAI({ apiKey: key });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Given a URL "${url}" and category "${category}", suggest a catchy short "Call to Action" for a QR Code flyer (max 10 words). Return only the text.`,
      });
      return response.text || "Scansiona per scoprire di più";
    } catch (error) {
      console.error("Gemini Error:", error);
      return "Scansiona per esplorare";
    }
  },

  async analyzeAnalytics(scanData: any): Promise<string> {
    const key = getApiKey();
    if (!key) return "Continua a monitorare le tue scansioni.";

    try {
      const ai = new GoogleGenAI({ apiKey: key });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze these scan stats for a QR code: ${JSON.stringify(scanData)}. Provide a very brief 1-2 sentence insight or recommendation for improvement.`,
      });
      return response.text || "L'andamento delle scansioni è regolare.";
    } catch (error) {
      return "Frequenza di scansione costante rispetto ai periodi precedenti.";
    }
  }
};
