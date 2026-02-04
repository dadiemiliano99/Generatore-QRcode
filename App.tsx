
import React, { useState, useEffect } from 'react';
import { QRGenerator } from './components/QRGenerator';
import { Dashboard } from './components/Dashboard';
import { QRListView } from './components/QRListView';
import { storage } from './services/storage';
import { QRCodeData } from './types';

const App: React.FC = () => {
  const [view, setView] = useState<'dashboard' | 'generator' | 'list'>('dashboard');
  const [qrs, setQrs] = useState<QRCodeData[]>([]);
  const [showNotification, setShowNotification] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // Controllo se l'URL contiene un parametro di tracking per una scansione reale
    const urlParams = new URLSearchParams(window.location.search);
    const scanId = urlParams.get('scan');

    if (scanId) {
      const qr = storage.findQRCode(scanId);
      if (qr) {
        setIsRedirecting(true);
        storage.logScan(scanId);
        // Piccolo delay per permettere il salvataggio prima del redirect
        setTimeout(() => {
          window.location.href = qr.targetUrl;
        }, 800);
      }
    }

    setQrs(storage.getQRCodes());
  }, []);

  const refreshData = () => {
    setQrs(storage.getQRCodes());
  };

  const handleSimulateScan = (id: string) => {
    storage.logScan(id);
    setShowNotification('Scansione simulata con successo!');
    setTimeout(() => setShowNotification(null), 3000);
    refreshData();
  };

  if (isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-slate-800">Reindirizzamento in corso...</h2>
          <p className="text-slate-500 text-sm">QR Pulse sta tracciando la tua scansione.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
          </div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">QR PULSE</h1>
        </div>

        <nav className="space-y-2 flex-grow">
          <button 
            onClick={() => setView('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'dashboard' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
            </svg>
            Dashboard
          </button>
          <button 
            onClick={() => setView('generator')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'generator' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuovo QR
          </button>
          <button 
            onClick={() => setView('list')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'list' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            Miei QR Code
          </button>
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-100">
          <div className="bg-slate-900 p-4 rounded-xl text-white">
            <p className="text-xs text-slate-400">Piano Attuale</p>
            <p className="font-bold">Starter Free</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow p-6 lg:p-10 max-w-7xl mx-auto w-full">
        {showNotification && (
          <div className="fixed top-6 right-6 z-50 animate-bounce">
            <div className="bg-green-500 text-white px-6 py-3 rounded-full shadow-2xl font-bold flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {showNotification}
            </div>
          </div>
        )}

        <header className="mb-10">
          <h2 className="text-3xl font-extrabold text-slate-800">
            {view === 'dashboard' ? 'Analisi Scansioni' : view === 'generator' ? 'Crea QR Code' : 'Gestione Campagne'}
          </h2>
          <p className="text-slate-500 mt-1">
            {view === 'dashboard' && 'Monitora le performance dei tuoi link fisici in tempo reale.'}
            {view === 'generator' && 'Crea un link tracciabile e genera il file grafico per la stampa.'}
            {view === 'list' && 'Gestisci, modifica e simula scansioni per i tuoi QR code attivi.'}
          </p>
        </header>

        {view === 'dashboard' && <Dashboard />}
        {view === 'generator' && <QRGenerator onCreated={() => { setView('list'); refreshData(); }} />}
        {view === 'list' && <QRListView qrs={qrs} onDelete={refreshData} onSimulateScan={handleSimulateScan} />}
      </main>
    </div>
  );
};

export default App;
