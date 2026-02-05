
import React, { useState, useEffect } from 'react';
import { QRGenerator } from './components/QRGenerator';
import { Dashboard } from './components/Dashboard';
import { QRListView } from './components/QRListView';
import { storage } from './services/storage';
import { QRCodeData } from './types';

const SetupView: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (url && key) {
      storage.setConfig(url, key);
      onComplete();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 max-w-md w-full">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">QR</div>
          <h1 className="text-xl font-black text-slate-800">QR PULSE SETUP</h1>
        </div>
        
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Configura Database</h2>
        <p className="text-slate-500 text-sm mb-6 leading-relaxed">
          Le variabili di Netlify non sono state rilevate nel browser. Incolla qui le credenziali di Supabase per attivare il database.
        </p>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Supabase URL</label>
            <input
              type="url"
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="https://xyz.supabase.co"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Anon Key</label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="eyJhbG..."
              value={key}
              onChange={(e) => setKey(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
          >
            Attiva Database
          </button>
        </form>
        
        <p className="mt-6 text-[10px] text-slate-400 text-center uppercase tracking-widest">
          Le chiavi verranno salvate localmente nel browser
        </p>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [view, setView] = useState<'dashboard' | 'generator' | 'list'>('dashboard');
  const [qrs, setQrs] = useState<QRCodeData[]>([]);
  const [notification, setNotification] = useState<{msg: string, type: 'success' | 'info'} | null>(null);
  const [loading, setLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(storage.isConfigured());

  const loadData = async () => {
    if (!storage.isConfigured()) return;
    const data = await storage.getQRCodes();
    setQrs(data);
  };

  useEffect(() => {
    const handleInit = async () => {
      if (!isConfigured) {
        setLoading(false);
        return;
      }

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
  }, [isConfigured]);

  const refreshData = async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    await loadData();
  };

  const showNotify = (msg: string, type: 'success' | 'info' = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  };

  if (!isConfigured) {
    return <SetupView onComplete={() => setIsConfigured(true)} />;
  }

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
          <div className="bg-blue-50 p-4 rounded-xl flex justify-between items-center group">
            <div>
              <p className="text-[10px] font-bold text-blue-600 uppercase mb-1">Database Cloud</p>
              <p className="text-sm font-bold text-slate-700">Connesso</p>
            </div>
            <button 
              onClick={() => {
                if(confirm("Vuoi resettare la configurazione?")) {
                  storage.resetConfig();
                  window.location.reload();
                }
              }}
              className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all"
              title="Reset Database"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
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
