
import React, { useState, useEffect } from 'react';
import { QRGenerator } from './components/QRGenerator';
import { Dashboard } from './components/Dashboard';
import { QRListView } from './components/QRListView';
import { storage } from './services/storage';
import { QRCodeData } from './types';

const App: React.FC = () => {
  const [view, setView] = useState<'dashboard' | 'generator' | 'list'>('dashboard');
  const [qrs, setQrs] = useState<QRCodeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{msg: string, type: 'success' | 'info'} | null>(null);

  useEffect(() => {
    const handleInitialFlow = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const scanId = urlParams.get('scan');

      if (scanId) {
        const qr = await storage.findQRCode(scanId);
        if (qr) {
          await storage.logScan(scanId);
          window.location.href = qr.targetUrl;
          return;
        }
      }

      const data = await storage.getQRCodes();
      setQrs(data);
      setLoading(false);
    };

    handleInitialFlow();
  }, []);

  const refreshData = async () => {
    const data = await storage.getQRCodes();
    setQrs(data);
  };

  const showNotify = (msg: string, type: 'success' | 'info' = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const handleSimulateScan = async (id: string) => {
    await storage.logScan(id);
    showNotify('Scansione cloud registrata!', 'info');
    refreshData();
  };

  // Se siamo in fase di redirect, non mostrare nulla
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('scan')) return null;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#f8fafc]">
      {/* Sidebar */}
      <aside className="hidden md:flex w-72 bg-white border-r border-slate-200 p-8 flex-col sticky h-screen top-0">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-11 h-11 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tighter">QR PULSE</h1>
        </div>

        <nav className="space-y-2 flex-grow">
          <NavItem active={view === 'dashboard'} icon="chart" label="Analytics" onClick={() => setView('dashboard')} />
          <NavItem active={view === 'generator'} icon="plus" label="Crea Nuovo" onClick={() => setView('generator')} />
          <NavItem active={view === 'list'} icon="list" label="Le mie Campagne" onClick={() => setView('list')} />
        </nav>

        <div className="mt-auto pt-8 border-t border-slate-100">
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Stato Cloud</p>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full animate-pulse ${process.env.SUPABASE_URL ? 'bg-green-500' : 'bg-amber-500'}`}></div>
              <p className="text-sm font-bold text-slate-700">
                {process.env.SUPABASE_URL ? 'DB Connesso' : 'Local Only'}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow p-6 lg:p-12 overflow-y-auto max-w-6xl">
        {notification && (
          <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top duration-300">
            <div className={`${notification.type === 'success' ? 'bg-slate-900' : 'bg-blue-600'} text-white px-8 py-4 rounded-2xl shadow-2xl font-bold flex items-center gap-3 border border-white/10`}>
              <div className="bg-white/20 p-1.5 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              {notification.msg}
            </div>
          </div>
        )}

        <header className="mb-12">
          <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-widest mb-2">
            <div className="w-4 h-[2px] bg-blue-600"></div>
            Management System
          </div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">
            {view === 'dashboard' ? 'Insight Scansioni' : view === 'generator' ? 'Generatore QR' : 'Campagne Attive'}
          </h2>
        </header>

        <div className="pb-20">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1,2,3].map(i => <div key={i} className="h-32 bg-slate-100 rounded-2xl loading-shimmer"></div>)}
            </div>
          ) : (
            <>
              {view === 'dashboard' && <Dashboard />}
              {view === 'generator' && <QRGenerator onCreated={() => { setView('list'); refreshData(); showNotify('Salvato nel Cloud!'); }} />}
              {view === 'list' && <QRListView qrs={qrs} onDelete={() => { refreshData(); showNotify('Rimosso dal Database'); }} onSimulateScan={handleSimulateScan} />}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

const NavItem = ({ active, icon, label, onClick }: any) => {
  const icons: any = {
    chart: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />,
    plus: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />,
    list: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
  };

  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-200 group ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 font-bold' : 'text-slate-500 hover:bg-slate-50'}`}
    >
      <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${active ? 'text-white' : 'text-slate-400 group-hover:text-blue-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        {icons[icon]}
      </svg>
      {label}
    </button>
  );
};

export default App;
