
export interface QRCodeData {
  id: string | number;
  name: string;
  targetUrl: string;
  createdAt: string | number; 
  category: string;
  description?: string;
}

export interface ScanEvent {
  id: string | number;
  qrId: string | number;
  timestamp: string | number;
  device: string;
  location: string;
  browser: string;
}

export interface AnalyticsSummary {
  totalScans: number;
  scansByDay: { date: string; count: number }[];
  scansByBrowser: { name: string; value: number }[];
  scansByDevice: { name: string; value: number }[];
}
