
import React, { useState, useEffect } from 'react';
import { QRGenerator } from './components/QRGenerator';
import { Dashboard } from './components/Dashboard';
import { QRListView } from './components/QRListView';
import { storage } from './services/storage';
import { QRCodeData } from './types';

const App: React.FC = () => {
  const [view, setView] = useState<'dashboard' | 'generator' | 'list'>('dashboard');
  const [qrs, setQrs] = useState<QRCodeData[]>([]);
  const [notification, setNotification] = useState<{msg: string, type: 'success' | 'info'} | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    const data = await storage.getQRCodes();
    setQrs(data);
  };

  useEffect(() => {
    const handleInit = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const scanId = urlParams.get('scan');

      if (scanId) {
        const qr = await storage.findQRCode(scanId);
        if (qr) {
          await storage.logScan(scanId);
          window.location.replace(qr.targetUrl);
          return;
        }
      }
      
      await loadData();
      setLoading(false);
    };

    handleInit();
  }, []);

  const refreshData = async () => {
    // Aggiungiamo un piccolissimo delay per essere sicuri che Supabase abbia completato l'operazione
    await new Promise(resolve => setTimeout(resolve, 500));
    await loadData();
  };

  const showNotify = (msg: string, type: 'success' | 'info' = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('scan')) return null;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#f8fafc]">
      <aside className="hidden md:flex w-72 bg-white border-r border-slate-200 p-8 flex-col sticky h-screen top-0">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-11 h-11 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-100 font-bold text-xl">QR</div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tighter">QR PULSE</h1>
        </div>

        <nav className="space-y-2 flex-grow">
          <NavItem active={view === 'dashboard'} label="Dashboard" onClick={() => setView('dashboard')} />
          <NavItem active={view === 'generator'} label="Crea Nuovo" onClick={() => setView('generator')} />
          <NavItem active={view === 'list'} label="Le mie Campagne" onClick={() => setView('list')} />
        </nav>

        <div className="mt-auto pt-8 border-t border-slate-100">
          <div className="bg-blue-50 p-4 rounded-xl">
            <p className="text-[10px] font-bold text-blue-600 uppercase mb-1">Database Cloud</p>
            <p className="text-sm font-bold text-slate-700">Supabase Attivo</p>
          </div>
        </div>
      </aside>

      <main className="flex-grow p-6 lg:p-12 overflow-y-auto max-w-6xl">
        {notification && (
          <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top duration-300">
            <div className={`${notification.type === 'success' ? 'bg-slate-900' : 'bg-blue-600'} text-white px-8 py-4 rounded-2xl shadow-2xl font-bold`}>
              {notification.msg}
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
             <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
             <p className="mt-4 text-slate-400 font-medium">Caricamento dati dal cloud...</p>
          </div>
        ) : (
          <div className="pb-20">
            {view === 'dashboard' && <Dashboard />}
            {view === 'generator' && (
              <QRGenerator 
                onCreated={async () => { 
                  setView('list'); 
                  showNotify('Salvataggio in corso...');
                  await refreshData(); 
                  showNotify('QR Code Creato!'); 
                }} 
              />
            )}
            {view === 'list' && (
              <QRListView 
                qrs={qrs} 
                onDelete={async () => { 
                  await refreshData(); 
                  showNotify('Eliminato correttamente'); 
                }} 
                onSimulateScan={async (id) => {
                  await storage.logScan(id);
                  showNotify('Scansione simulata!', 'info');
                }} 
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
};

const NavItem = ({ active, label, onClick }: any) => {
  return (
    <button 
      onClick={onClick}
      className={`w-full text-left px-5 py-4 rounded-2xl transition-all ${active ? 'bg-blue-600 text-white shadow-lg font-bold' : 'text-slate-500 hover:bg-slate-50'}`}
    >
      {label}
    </button>
  );
};

export default App;
