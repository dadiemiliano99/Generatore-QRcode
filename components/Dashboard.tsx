
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
        const insight = await geminiService.analyzeAnalytics({ total: dataScans.length, last: dataScans[0] });
        setAiInsight(insight);
      } else {
        setAiInsight("Crea il tuo primo QR code per iniziare a tracciare le scansioni.");
      }
    };
    getInsight();
  }, []);

  const stats = useMemo(() => {
    // Last 7 days chart data
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

    // Device split
    const devices = scans.reduce((acc: any, curr) => {
      acc[curr.device] = (acc[curr.device] || 0) + 1;
      return acc;
    }, {});
    const deviceData = Object.entries(devices).map(([name, value]) => ({ name, value: Number(value) }));

    // Top QR Codes
    const qrStats = qrs.map(qr => ({
      name: qr.name,
      value: scans.filter(s => s.qrId === qr.id).length
    })).sort((a, b) => b.value - a.value).slice(0, 5);

    return { last7Days, deviceData, qrStats };
  }, [scans, qrs]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-slate-500 text-sm font-medium">Totale Scansioni</p>
          <p className="text-4xl font-bold text-slate-900 mt-2">{scans.length}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-slate-500 text-sm font-medium">QR Attivi</p>
          <p className="text-4xl font-bold text-blue-600 mt-2">{qrs.length}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="bg-blue-50 p-3 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <p className="text-slate-500 text-xs font-medium">AI INSIGHT</p>
            <p className="text-sm text-slate-700 mt-1">{aiInsight}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Andamento Scansioni (Ultimi 7 giorni)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.last7Days}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line type="monotone" dataKey="scans" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Top QR Codes</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.qrStats} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={100} />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 lg:col-span-2">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Distribuzione Dispositivi</h3>
          <div className="h-64 flex flex-col md:flex-row items-center justify-around">
            <div className="w-full md:w-1/2 h-full">
               <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.deviceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stats.deviceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-4 w-full md:w-1/2 mt-4 md:mt-0">
              {stats.deviceData.map((item, i) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                  <span className="text-slate-600 text-sm">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
