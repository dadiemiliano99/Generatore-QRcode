
import React, { useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { storage } from '../services/storage';
import { QRCodeData } from '../types';

interface QRListViewProps {
  qrs: QRCodeData[];
  onDelete: () => void;
  onSimulateScan: (id: string) => void;
}

export const QRListView: React.FC<QRListViewProps> = ({ qrs, onDelete, onSimulateScan }) => {
  const [selectedQR, setSelectedQR] = useState<QRCodeData | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    if (confirm('Sei sicuro di voler eliminare questo QR code e i suoi dati di tracciamento?')) {
      storage.deleteQRCode(id);
      onDelete();
    }
  };

  const getTrackingUrl = (id: string) => {
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}?scan=${id}`;
  };

  const copyToClipboard = (id: string) => {
    const url = getTrackingUrl(id);
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (qrs.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300">
        <p className="text-slate-500">Non hai ancora creato nessun QR code.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {qrs.map((qr) => (
        <div key={qr.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-lg leading-tight">{qr.name}</h3>
              <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full mt-1 inline-block">
                {qr.category}
              </span>
            </div>
            <button 
              onClick={() => handleDelete(qr.id)}
              className="text-slate-400 hover:text-red-500 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          
          <div className="flex justify-center mb-6 bg-slate-50 p-4 rounded-xl cursor-pointer" onClick={() => setSelectedQR(qr)}>
            <QRCodeCanvas value={getTrackingUrl(qr.id)} size={140} />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-xs text-slate-500">
              <span>Destinazione:</span>
              <span className="truncate max-w-[150px]">{qr.targetUrl}</span>
            </div>
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => copyToClipboard(qr.id)}
                className="w-full bg-slate-100 text-slate-700 py-2 rounded-lg text-sm font-semibold hover:bg-slate-200 transition-colors"
              >
                {copiedId === qr.id ? 'Copiato!' : 'Copia Link Tracking'}
              </button>
              <button 
                onClick={() => onSimulateScan(qr.id)}
                className="w-full bg-blue-50 text-blue-700 py-2 rounded-lg text-sm font-semibold hover:bg-blue-100 transition-colors"
              >
                Simula Scansione
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Detail Modal Overlay */}
      {selectedQR && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 relative shadow-2xl">
            <button 
              onClick={() => setSelectedQR(null)}
              className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-800 mb-2">{selectedQR.name}</h2>
              <p className="text-slate-500 text-xs mb-1 uppercase font-bold tracking-widest">Tracking Link:</p>
              <p className="text-blue-600 text-xs mb-6 break-all font-mono bg-blue-50 p-2 rounded">{getTrackingUrl(selectedQR.id)}</p>
              <div className="bg-white p-6 rounded-2xl shadow-inner border border-slate-100 inline-block mb-6">
                <QRCodeCanvas value={getTrackingUrl(selectedQR.id)} size={250} />
              </div>
              <button 
                onClick={() => {
                   const canvas = document.querySelector('canvas');
                   if (canvas) {
                     const url = canvas.toDataURL("image/png");
                     const link = document.createElement('a');
                     link.download = `${selectedQR.name}-qr.png`;
                     link.href = url;
                     link.click();
                   }
                }}
                className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
              >
                Scarica Immagine PNG
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
