
import React, { useMemo, useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { storage } from '../services/storage';
import { geminiService } from '../services/geminiService';
import { ScanEvent, QRCodeData } from '../types';

export const Dashboard: React.FC = () => {
  const [scans, setScans] = useState<ScanEvent[]>([]);
  const [qrs, setQrs] = useState<QRCodeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiInsight, setAiInsight] = useState<string>('Recuperando dati dal cloud...');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [dataScans, dataQrs] = await Promise.all([
          storage.getScans(),
          storage.getQRCodes()
        ]);
        setScans(dataScans);
        setQrs(dataQrs);
        setLoading(false);

        if (dataScans.length > 0) {
          const insight = await geminiService.analyzeAnalytics({ 
            total: dataScans.length, 
            qrCount: dataQrs.length 
          });
          setAiInsight(insight);
        } else {
          setAiInsight("Nessuna scansione rilevata nel cloud. Inizia a condividere i tuoi QR.");
        }
      } catch (err) {
        setAiInsight("Errore di connessione al database.");
      }
    };
    loadData();
  }, []);

  const stats = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
      const count = scans.filter(s => {
        const scanDate = new Date(s.timestamp);
        return scanDate.toDateString() === d.toDateString();
      }).length;
      return { name: dateStr, scans: count };
    }).reverse();

    const qrStats = qrs.map(qr => ({
      name: qr.name,
      value: scans.filter(s => s.qrId === qr.id).length
    })).sort((a, b) => b.value - a.value).slice(0, 5);

    return { last7Days, qrStats };
  }, [scans, qrs]);

  const exportToCSV = () => {
    const headers = "ID,QR_Name,Timestamp,Device,Browser\n";
    const rows = scans.map(s => {
      const qr = qrs.find(q => q.id === s.qrId);
      return `${s.id},${qr?.name || 'Deleted'},${new Date(s.timestamp).toLocaleString()},${s.device},${s.browser}`;
    }).join("\n");
    
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qrpulse_cloud_export.csv`;
    a.click();
  };

  if (loading) return <div className="p-12 text-center text-slate-400 font-medium">Sincronizzazione dati cloud...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-slate-800">Dati Cloud in Tempo Reale</h3>
        <button onClick={exportToCSV} className="text-sm font-bold text-blue-600 hover:underline">Esporta Archivio</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-slate-500 text-sm font-medium uppercase tracking-wider">Scansioni Cloud</p>
          <p className="text-4xl font-bold text-slate-900 mt-2">{scans.length}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-slate-500 text-sm font-medium uppercase tracking-wider">Campagne Pubbliche</p>
          <p className="text-4xl font-bold text-blue-600 mt-2">{qrs.length}</p>
        </div>
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-2xl shadow-lg text-white">
          <p className="text-xs font-bold uppercase tracking-widest opacity-60 mb-2">AI Insights</p>
          <p className="text-sm leading-relaxed">{aiInsight}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-80">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Volume Scansioni (Ultimi 7gg)</h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats.last7Days}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
              <Tooltip />
              <Line type="monotone" dataKey="scans" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-80">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Top QR Pubblici</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.qrStats} layout="vertical">
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 10}} axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
