
import { QRCodeData, ScanEvent } from '../types';

const QR_KEY = 'qrpulse_qrcodes';
const SCAN_KEY = 'qrpulse_scans';

export const storage = {
  getQRCodes: (): QRCodeData[] => {
    const data = localStorage.getItem(QR_KEY);
    return data ? JSON.parse(data) : [];
  },

  findQRCode: (id: string): QRCodeData | undefined => {
    return storage.getQRCodes().find(q => q.id === id);
  },

  saveQRCode: (qr: QRCodeData) => {
    const current = storage.getQRCodes();
    localStorage.setItem(QR_KEY, JSON.stringify([qr, ...current]));
  },

  getScans: (): ScanEvent[] => {
    const data = localStorage.getItem(SCAN_KEY);
    return data ? JSON.parse(data) : [];
  },

  logScan: (qrId: string) => {
    const scans = storage.getScans();
    const newScan: ScanEvent = {
      id: Math.random().toString(36).substr(2, 9),
      qrId,
      timestamp: Date.now(),
      device: navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop',
      location: 'Rilevata', 
      browser: getBrowserName(),
    };
    localStorage.setItem(SCAN_KEY, JSON.stringify([newScan, ...scans]));
  },

  deleteQRCode: (id: string) => {
    const qrs = storage.getQRCodes().filter(q => q.id !== id);
    const scans = storage.getScans().filter(s => s.qrId !== id);
    localStorage.setItem(QR_KEY, JSON.stringify(qrs));
    localStorage.setItem(SCAN_KEY, JSON.stringify(scans));
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
