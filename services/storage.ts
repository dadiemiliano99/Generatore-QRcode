
import { createClient } from '@supabase/supabase-js';
import { QRCodeData, ScanEvent } from '../types';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

// Fallback al localStorage se le chiavi Supabase non sono presenti
const isCloudEnabled = supabaseUrl && supabaseKey;
const supabase = isCloudEnabled ? createClient(supabaseUrl, supabaseKey) : null;

export const storage = {
  getQRCodes: async (): Promise<QRCodeData[]> => {
    if (!supabase) {
      const data = localStorage.getItem('qrpulse_qrcodes');
      return data ? JSON.parse(data) : [];
    }
    const { data, error } = await supabase
      .from('qrcodes')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data.map(q => ({
      id: q.id,
      name: q.name,
      targetUrl: q.target_url,
      category: q.category,
      createdAt: new Date(q.created_at).getTime(),
      description: q.description
    }));
  },

  findQRCode: async (id: string): Promise<QRCodeData | undefined> => {
    if (!supabase) {
      const codes = await storage.getQRCodes();
      return codes.find(q => q.id === id);
    }
    const { data, error } = await supabase
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
      createdAt: new Date(data.created_at).getTime(),
      description: data.description
    };
  },

  saveQRCode: async (qr: QRCodeData) => {
    if (!supabase) {
      const current = await storage.getQRCodes();
      localStorage.setItem('qrpulse_qrcodes', JSON.stringify([qr, ...current]));
      return;
    }
    const { error } = await supabase
      .from('qrcodes')
      .insert([{
        id: qr.id,
        name: qr.name,
        target_url: qr.targetUrl,
        category: qr.category,
        description: qr.description
      }]);
    if (error) throw error;
  },

  getScans: async (): Promise<ScanEvent[]> => {
    if (!supabase) {
      const data = localStorage.getItem('qrpulse_scans');
      return data ? JSON.parse(data) : [];
    }
    const { data, error } = await supabase
      .from('scans')
      .select('*')
      .order('timestamp', { ascending: false });
    
    if (error) throw error;
    return data.map(s => ({
      id: s.id,
      qrId: s.qr_id,
      timestamp: new Date(s.timestamp).getTime(),
      device: s.device,
      browser: s.browser,
      location: s.location || 'Unknown'
    }));
  },

  logScan: async (qrId: string) => {
    const scanData = {
      qr_id: qrId,
      device: navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop',
      browser: getBrowserName(),
      location: 'Rilevata Cloud'
    };

    if (!supabase) {
      const scans = await storage.getScans();
      const newScan: ScanEvent = {
        id: Math.random().toString(36).substr(2, 9),
        qrId,
        timestamp: Date.now(),
        ...scanData,
        location: 'Local'
      };
      localStorage.setItem('qrpulse_scans', JSON.stringify([newScan, ...scans]));
      return;
    }

    const { error } = await supabase.from('scans').insert([scanData]);
    if (error) console.error("Error logging scan to cloud:", error);
  },

  deleteQRCode: async (id: string) => {
    if (!supabase) {
      const qrs = (await storage.getQRCodes()).filter(q => q.id !== id);
      const scans = (await storage.getScans()).filter(s => s.qrId !== id);
      localStorage.setItem('qrpulse_qrcodes', JSON.stringify(qrs));
      localStorage.setItem('qrpulse_scans', JSON.stringify(scans));
      return;
    }
    const { error } = await supabase.from('qrcodes').delete().eq('id', id);
    if (error) throw error;
  }
};

function getBrowserName() {
  const userAgent = navigator.userAgent;
  if (userAgent.indexOf("Chrome") > -1) return "Chrome";
  if (userAgent.indexOf("Safari") > -1) return "Safari";
  if (userAgent.indexOf("Firefox") > -1) return "Firefox";
  if (userAgent.indexOf("Edge") > -1) return "Edge";
  return "Mobile Browser";
}
