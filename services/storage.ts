
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { QRCodeData, ScanEvent } from '../types';

let supabase: SupabaseClient | null = null;

const STORAGE_KEYS = {
  URL: 'qrpulse_supabase_url',
  KEY: 'qrpulse_supabase_key'
};

export const storage = {
  isConfigured: (): boolean => {
    const url = process.env.SUPABASE_URL || localStorage.getItem(STORAGE_KEYS.URL);
    const key = process.env.SUPABASE_ANON_KEY || localStorage.getItem(STORAGE_KEYS.KEY);
    return !!(url && key);
  },

  setConfig: (url: string, key: string) => {
    localStorage.setItem(STORAGE_KEYS.URL, url);
    localStorage.setItem(STORAGE_KEYS.KEY, key);
    supabase = null; 
  },

  resetConfig: () => {
    localStorage.removeItem(STORAGE_KEYS.URL);
    localStorage.removeItem(STORAGE_KEYS.KEY);
    supabase = null;
  },

  getClient: (): SupabaseClient | null => {
    if (supabase) return supabase;
    
    const url = process.env.SUPABASE_URL || localStorage.getItem(STORAGE_KEYS.URL);
    const key = process.env.SUPABASE_ANON_KEY || localStorage.getItem(STORAGE_KEYS.KEY);
    
    if (!url || !key) return null;
    
    try {
      supabase = createClient(url, key);
      return supabase;
    } catch (e) {
      console.error("Errore inizializzazione client Supabase:", e);
      return null;
    }
  },

  getQRCodes: async (): Promise<QRCodeData[]> => {
    const client = storage.getClient();
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

  findQRCode: async (id: string | number): Promise<QRCodeData | undefined> => {
    const client = storage.getClient();
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

  saveQRCode: async (qr: Omit<QRCodeData, 'id'>) => {
    const client = storage.getClient();
    if (!client) throw new Error("Database non configurato.");

    // Assicuriamoci che la data sia SEMPRE un numero intero (timestamp)
    const timestamp = typeof qr.createdAt === 'number' ? qr.createdAt : new Date(qr.createdAt).getTime();
    
    const dbData = {
      // Non inviamo l'ID: Supabase lo genererà automaticamente come BigInt serial
      name: qr.name,
      target_url: qr.targetUrl,
      category: qr.category,
      description: qr.description,
      created_at: timestamp 
    };

    const { error } = await client.from('qrcodes').insert([dbData]);
    if (error) {
      console.error("Dettagli errore Supabase (Insert QR):", error);
      throw new Error("Errore database: " + error.message);
    }
  },

  getScans: async (): Promise<ScanEvent[]> => {
    const client = storage.getClient();
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

  logScan: async (qrId: string | number) => {
    const client = storage.getClient();
    if (!client) return;

    // Non inviamo l'id, lasciamo che Supabase usi il suo BigInt seriale
    const newScan = {
      qr_id: qrId,
      timestamp: Date.now(), // Numero intero
      device: navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop',
      location: 'Rilevata', 
      browser: getBrowserName(),
    };
    
    const { error } = await client.from('scans').insert([newScan]);
    if (error) console.error("Errore log scan:", error);
  },

  deleteQRCode: async (id: string | number) => {
    const client = storage.getClient();
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
