
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

  // Genera l'URL di tracking reale basato sull'indirizzo corrente del sito
  const getTrackingUrl = (id: string) => {
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}?scan=${id}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !url) return;

    const id = Math.random().toString(36).substr(2, 9);
    const newQR: QRCodeData = {
      id,
      name,
      targetUrl: url,
      category,
      createdAt: Date.now(),
      description: suggestedCTA,
    };

    storage.saveQRCode(newQR);
    setName('');
    setUrl('');
    setSuggestedCTA('');
    onCreated();
  };

  const handleSuggest = async () => {
    if (!url) return;
    setLoading(true);
    const suggestion = await geminiService.suggestCTA(url, category);
    setSuggestedCTA(suggestion);
    setLoading(false);
  };

  const previewId = "preview_id";
  const previewTrackingUrl = getTrackingUrl(previewId);

  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 mb-8">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Genera Nuovo QR Code</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nome Campagna</label>
            <input
              type="text"
              required
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              placeholder="es: Menù Estivo, Volantino Evento..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">URL di Destinazione Reale</label>
            <input
              type="url"
              required
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              placeholder="https://tuosito.it"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">Il QR punterà al link di tracking e poi reindirizzerà qui.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
            <select
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option>Marketing</option>
              <option>Personale</option>
              <option>Business</option>
              <option>Altro</option>
            </select>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={handleSuggest}
              disabled={loading || !url}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50 transition-colors"
            >
              {loading ? 'Generando...' : 'AI Suggestion: Crea una Call to Action'}
            </button>
            {suggestedCTA && (
              <p className="mt-2 text-sm text-slate-600 italic">"{suggestedCTA}"</p>
            )}
          </div>
          <button
            type="submit"
            className="w-full bg-slate-900 text-white py-3 rounded-lg font-semibold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
          >
            Crea QR Code Tracciabile
          </button>
        </form>

        <div className="flex flex-col items-center justify-center bg-slate-50 rounded-xl p-8 border border-dashed border-slate-200">
          <div className="bg-white p-4 rounded-lg shadow-md mb-4">
            <QRCodeCanvas 
              value={url ? previewTrackingUrl : "https://qrpulse.app"} 
              size={180}
              level="H"
              includeMargin
            />
          </div>
          <p className="text-slate-500 text-xs text-center px-4">
            {url ? `Anteprima QR Tracciabile. Destinazione finale: ${url}` : 'Inserisci un URL per generare il tracking'}
          </p>
        </div>
      </div>
    </div>
  );
};
