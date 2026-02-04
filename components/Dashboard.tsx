
import React, { useMemo, useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { storage } from '../services/storage';
import { geminiService } from '../services/geminiService';
import { ScanEvent, QRCodeData } from '../types';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export const Dashboard: React.FC = () => {
  const [scans, setScans] = useState<ScanEvent[]>([]);
  const [qrs, setQrs] = useState<QRCodeData[]>([]);
  const [aiInsight, setAiInsight] = useState<string>('Analizzando i tuoi dati...');

  useEffect(() => {
    const dataScans = storage.getScans();
    const dataQrs = storage.getQRCodes();
    setScans(dataScans);
    setQrs(dataQrs);

    const getInsight = async () => {
      if (dataScans.length > 0) {
        const insight = await geminiService.analyzeAnalytics({ 
          total: dataScans.length, 
          lastScans: dataScans.slice(0, 5),
          qrCount: dataQrs.length 
        });
        setAiInsight(insight);
      } else {
        setAiInsight("Crea il tuo primo QR code per iniziare a tracciare le scansioni.");
      }
    };
    getInsight();
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

    const devices = scans.reduce((acc: any, curr) => {
      acc[curr.device] = (acc[curr.device] || 0) + 1;
      return acc;
    }, {});
    const deviceData = Object.entries(devices).map(([name, value]) => ({ name, value: Number(value) }));

    const qrStats = qrs.map(qr => ({
      name: qr.name,
      value: scans.filter(s => s.qrId === qr.id).length
    })).sort((a, b) => b.value - a.value).slice(0, 5);

    return { last7Days, deviceData, qrStats };
  }, [scans, qrs]);

  const exportToCSV = () => {
    const headers = "ID,QR_Name,Timestamp,Device,Browser\n";
    const rows = scans.map(s => {
      const qr = qrs.find(q => q.id === s.qrId);
      return `${s.id},${qr?.name || 'Eliminato'},${new Date(s.timestamp).toLocaleString()},${s.device},${s.browser}`;
    }).join("\n");
    
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `scansioni_qrpulse_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-slate-800">Panoramica Generale</h3>
        <button 
          onClick={exportToCSV}
          disabled={scans.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Esporta CSV
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-slate-500 text-sm font-medium uppercase tracking-wider">Totale Scansioni</p>
          <p className="text-4xl font-bold text-slate-900 mt-2">{scans.length}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-slate-500 text-sm font-medium uppercase tracking-wider">QR Attivi</p>
          <p className="text-4xl font-bold text-blue-600 mt-2">{qrs.length}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 rounded-2xl shadow-lg text-white">
          <div className="flex items-center gap-2 mb-2">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.989-2.386l-.548-.547z" />
            </svg>
            <p className="text-xs font-bold uppercase tracking-widest opacity-80">AI Analysis</p>
          </div>
          <p className="text-sm leading-relaxed">{aiInsight}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Performance Temporale</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.last7Days}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Line type="monotone" dataKey="scans" stroke="#3b82f6" strokeWidth={4} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Campagne più attive</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.qrStats} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={100} tick={{fill: '#64748b', fontSize: 11}} />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 8, 8, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
