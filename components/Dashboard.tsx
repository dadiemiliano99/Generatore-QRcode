
import React, { useMemo, useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
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
      try {
        const [dataScans, dataQrs] = await Promise.all([
          storage.getScans(),
          storage.getQRCodes()
        ]);
        setScans(dataScans);
        setQrs(dataQrs);

        if (dataScans.length > 0) {
          const insight = await geminiService.analyzeAnalytics({ total: dataScans.length, qrCount: dataQrs.length });
          setAiInsight(insight);
        } else {
          setAiInsight("Nessun dato ancora disponibile.");
        }
      } catch (err) {
        setAiInsight("Errore nel recupero dati.");
      } finally {
        setLoading(false);
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

    return { last7Days };
  }, [scans]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
      <p className="mt-4 text-slate-400 font-medium">Recupero statistiche dal cloud...</p>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Scansioni Totali</p>
          <p className="text-4xl font-black mt-1">{scans.length}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">QR Code Attivi</p>
          <p className="text-4xl font-black mt-1 text-blue-600">{qrs.length}</p>
        </div>
        <div className="bg-blue-600 p-6 rounded-2xl text-white shadow-xl shadow-blue-100">
          <p className="text-xs font-bold uppercase opacity-80 mb-1 tracking-wider">AI Insight</p>
          <p className="text-sm font-medium leading-relaxed">{aiInsight}</p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl border border-slate-100 h-80 shadow-sm">
        <h3 className="text-lg font-bold mb-6 text-slate-800">Volume Scansioni (Ultimi 7 gg)</h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={stats.last7Days}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
            <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
            />
            <Line type="monotone" dataKey="scans" stroke="#3b82f6" strokeWidth={4} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
