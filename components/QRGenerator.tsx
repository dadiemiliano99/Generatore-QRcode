
import React, { useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { storage } from '../services/storage';
import { geminiService } from '../services/geminiService';
import { QRCodeData } from '../types';

interface QRGeneratorProps {
  onCreated: () => void;
}

export const QRGenerator: React.FC<QRGeneratorProps> = ({ onCreated }) => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('Marketing');
  const [suggestedCTA, setSuggestedCTA] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [qrColor, setQrColor] = useState('#0f172a');

  const getTrackingUrl = (id: string) => {
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}?scan=${id}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !url) return;

    setSaving(true);
    const id = Math.random().toString(36).substr(2, 9);
    const newQR: QRCodeData = {
      id,
      name,
      targetUrl: url,
      category,
      createdAt: Date.now(),
      description: suggestedCTA,
    };

    try {
      await storage.saveQRCode(newQR);
      onCreated();
    } catch (err) {
      alert("Errore durante il salvataggio cloud. Riprova.");
    } finally {
      setSaving(false);
    }
  };

  const handleSuggest = async () => {
    if (!url) return;
    setLoading(true);
    const suggestion = await geminiService.suggestCTA(url, category);
    setSuggestedCTA(suggestion);
    setLoading(false);
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 mb-8 max-w-4xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-800">Dettagli QR Code</h2>
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1">Nome Campagna</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-800"
                placeholder="es: Menù Digitale, Promo Instagram..."
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1">URL di Destinazione</label>
              <input
                type="url"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-800"
                placeholder="https://tuosito.it/promozione"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Categoria</label>
                <select
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white text-slate-800"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option>Marketing</option>
                  <option>Personale</option>
                  <option>Business</option>
                  <option>Eventi</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Colore QR</label>
                <input
                  type="color"
                  className="w-full h-[42px] p-1 rounded-xl border border-slate-200 cursor-pointer"
                  value={qrColor}
                  onChange={(e) => setQrColor(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <button
              type="button"
              onClick={handleSuggest}
              disabled={loading || !url}
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-bold disabled:opacity-50 transition-colors mb-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {loading ? 'Analisi AI...' : 'Chiedi suggerimento CTA'}
            </button>
            {suggestedCTA && <p className="text-sm text-slate-600 italic leading-snug">" {suggestedCTA} "</p>}
          </div>

          <button
            onClick={handleSubmit}
            disabled={!name || !url || saving}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50"
          >
            {saving ? 'Sincronizzazione Cloud...' : 'Crea QR Code Pubblico'}
          </button>
        </div>

        <div className="flex flex-col items-center justify-center space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100 flex flex-col items-center">
            <div className="p-4 bg-slate-50 rounded-2xl mb-4">
              <QRCodeCanvas 
                id="preview-qr"
                value={url ? getTrackingUrl("preview") : "https://qrpulse.app"} 
                size={200}
                level="H"
                fgColor={qrColor}
                includeMargin
              />
            </div>
            <div className="text-center">
              <p className="text-slate-800 font-bold mb-1">{name || "Anteprima"}</p>
              <p className="text-slate-400 text-xs truncate max-w-[200px]">{url || "inserisci un link..."}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
