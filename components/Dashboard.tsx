
import React, { useMemo, useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { storage } from '../services/storage';
import { geminiService } from '../services/geminiService';
import { ScanEvent, QRCodeData } from '../types';

export const Dashboard: React.FC = () => {
  const [scans, setScans] = useState<ScanEvent[]>([]);
  const [qrs, setQrs] = useState<QRCodeData[]>([]);
  const [aiInsight, setAiInsight] = useState<string>('Caricamento dati...');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const [dataScans, dataQrs] = await Promise.all([
        storage.getScans(),
        storage.getQRCodes()
      ]);
      setScans(dataScans);
      setQrs(dataQrs);
      setLoading(false);

      if (dataScans.length > 0) {
        const insight = await geminiService.analyzeAnalytics({ total: dataScans.length, qrCount: dataQrs.length });
        setAiInsight(insight);
      } else {
        setAiInsight("Nessun dato ancora disponibile.");
      }
    };
    loadData();
  }, []);

  const stats = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
      const count = scans.filter(s => new Date(s.timestamp).toDateString() === d.toDateString()).length;
      return { name: dateStr, scans: count };
    }).reverse();

    const qrStats = qrs.map(qr => ({
      name: qr.name,
      value: scans.filter(s => (s as any).qr_id === qr.id).length
    })).sort((a, b) => b.value - a.value).slice(0, 5);

    return { last7Days, qrStats };
  }, [scans, qrs]);

  if (loading) return <div className="p-10 text-center text-slate-400">Recupero statistiche dal cloud...</div>;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100">
          <p className="text-slate-500 text-xs font-bold uppercase">Scansioni Totali</p>
          <p className="text-4xl font-black mt-1">{scans.length}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100">
          <p className="text-slate-500 text-xs font-bold uppercase">QR Code Attivi</p>
          <p className="text-4xl font-black mt-1 text-blue-600">{qrs.length}</p>
        </div>
        <div className="bg-blue-600 p-6 rounded-2xl text-white">
          <p className="text-xs font-bold uppercase opacity-80 mb-1">AI Insight</p>
          <p className="text-sm">{aiInsight}</p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl border border-slate-100 h-80">
        <h3 className="text-lg font-bold mb-6">Volume Scansioni (Ultimi 7 gg)</h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={stats.last7Days}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
            <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
            <Tooltip />
            <Line type="monotone" dataKey="scans" stroke="#3b82f6" strokeWidth={4} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
