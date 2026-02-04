
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { QRCodeData, ScanEvent } from '../types';

let supabase: SupabaseClient | null = null;

const getClient = (): SupabaseClient | null => {
  if (supabase) return supabase;
  
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  
  if (!url || !key || url === "" || key === "") {
    console.warn("Supabase credentials missing. Data persistence is disabled. Please set SUPABASE_URL and SUPABASE_ANON_KEY in your environment variables.");
    return null;
  }
  
  try {
    supabase = createClient(url, key);
    return supabase;
  } catch (e) {
    console.error("Failed to initialize Supabase:", e);
    return null;
  }
};

export const storage = {
  getQRCodes: async (): Promise<QRCodeData[]> => {
    const client = getClient();
    if (!client) return [];
    
    const { data, error } = await client
      .from('qrcodes')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Fetch QR error:', error);
      return [];
    }
    return data as QRCodeData[];
  },

  findQRCode: async (id: string): Promise<QRCodeData | undefined> => {
    const client = getClient();
    if (!client) return undefined;

    const { data, error } = await client
      .from('qrcodes')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) return undefined;
    return data as QRCodeData;
  },

  saveQRCode: async (qr: QRCodeData) => {
    const client = getClient();
    if (!client) throw new Error("Database not connected");

    const { error } = await client
      .from('qrcodes')
      .insert([qr]);
    
    if (error) throw error;
  },

  getScans: async (): Promise<ScanEvent[]> => {
    const client = getClient();
    if (!client) return [];

    const { data, error } = await client
      .from('scans')
      .select('*')
      .order('timestamp', { ascending: false });
    
    if (error) return [];
    return data as ScanEvent[];
  },

  logScan: async (qrId: string) => {
    const client = getClient();
    if (!client) return;

    const newScan = {
      id: Math.random().toString(36).substr(2, 9),
      qr_id: qrId,
      timestamp: Date.now(),
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
