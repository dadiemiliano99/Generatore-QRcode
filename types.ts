
export interface QRCodeData {
  id: string;
  name: string;
  targetUrl: string;
  createdAt: number;
  category: string;
  description?: string;
}

export interface ScanEvent {
  id: string;
  qrId: string;
  timestamp: number;
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
