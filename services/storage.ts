
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { QRCodeData, ScanEvent } from '../types';

let supabase: SupabaseClient | null = null;

const getClient = (): SupabaseClient | null => {
  if (supabase) return supabase;
  
  // Debug log per aiutarti a vedere cosa succede nel browser (controlla F12)
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  
  console.log("DEBUG STORAGE - URL presente:", !!url, "KEY presente:", !!key);

  if (!url || !key || url === "" || key === "") {
    // Se siamo qui, Netlify non sta passando le variabili al browser correttamente
    return null;
  }
  
  try {
    supabase = createClient(url, key);
    return supabase;
  } catch (e) {
    console.error("Errore inizializzazione client Supabase:", e);
    return null;
  }
};

export const storage = {
  getQRCodes: async (): Promise<QRCodeData[]> => {
    const client = getClient();
    if (!client) return [];
    
    try {
      const { data, error } = await client
        .from('qrcodes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      return (data || []).map(item => ({
        id: item.id,
        name: item.name,
        targetUrl: item.target_url,
        category: item.category,
        description: item.description,
        createdAt: item.created_at
      }));
    } catch (err) {
      console.error('Errore fetch QR:', err);
      return [];
    }
  },

  findQRCode: async (id: string): Promise<QRCodeData | undefined> => {
    const client = getClient();
    if (!client) return undefined;

    const { data, error } = await client
      .from('qrcodes')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return undefined;

    return {
      id: data.id,
      name: data.name,
      targetUrl: data.target_url,
      category: data.category,
      description: data.description,
      createdAt: data.created_at
    };
  },

  saveQRCode: async (qr: QRCodeData) => {
    const client = getClient();
    if (!client) {
      throw new Error("Il database non risponde. Assicurati di aver fatto 'Clear cache and deploy' su Netlify dopo aver aggiunto le variabili.");
    }

    const dbData = {
      id: qr.id,
      name: qr.name,
      target_url: qr.targetUrl,
      category: qr.category,
      description: qr.description,
      created_at: qr.createdAt
    };

    const { error } = await client
      .from('qrcodes')
      .insert([dbData]);
    
    if (error) {
      console.error("Errore salvataggio Supabase:", error);
      throw new Error("Errore database: " + error.message);
    }
  },

  getScans: async (): Promise<ScanEvent[]> => {
    const client = getClient();
    if (!client) return [];

    const { data, error } = await client
      .from('scans')
      .select('*')
      .order('timestamp', { ascending: false });
    
    if (error) return [];

    return (data || []).map(item => ({
      id: item.id,
      qrId: item.qr_id,
      timestamp: item.timestamp,
      device: item.device,
      location: item.location,
      browser: item.browser
    }));
  },

  logScan: async (qrId: string) => {
    const client = getClient();
    if (!client) return;

    const newScan = {
      id: Math.random().toString(36).substr(2, 9),
      qr_id: qrId,
      timestamp: new Date().toISOString(),
      device: navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop',
      location: 'Rilevata', 
      browser: getBrowserName(),
    };
    
    await client.from('scans').insert([newScan]);
  },

  deleteQRCode: async (id: string) => {
    const client = getClient();
    if (!client) return;
    await client.from('qrcodes').delete().eq('id', id);
  }
};

function getBrowserName() {
  const userAgent = navigator.userAgent;
  if (userAgent.indexOf("Chrome") > -1) return "Chrome";
  if (userAgent.indexOf("Safari") > -1) return "Safari";
  if (userAgent.indexOf("Firefox") > -1) return "Firefox";
  return "Browser";
}
