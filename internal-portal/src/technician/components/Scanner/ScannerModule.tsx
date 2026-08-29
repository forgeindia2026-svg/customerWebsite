import React, { useState, useEffect } from 'react';
import { QrCode } from 'lucide-react';

export const ScannerModule = () => {
  const [qrCodes, setQrCodes] = useState<any[]>([]);

  useEffect(() => {
    const fetchQRs = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'https://65.0.45.64.sslip.io';
        const res = await fetch(`${apiUrl}/api/dashboard`);
        const json = await res.json();
        if (json.success && json.data && json.data.qrCodes) {
          setQrCodes(json.data.qrCodes);
        }
      } catch (e) {
        console.error("Failed to fetch qrCodes", e);
      }
    };
    fetchQRs();
    const interval = setInterval(fetchQRs, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <QrCode className="w-5 h-5 text-emerald-600" />
            Active QR Codes
          </h2>
          <p className="text-xs text-slate-500 mt-1">Scan or view official payment and assignment QR codes</p>
        </div>
      </div>

      <div className="p-6">
        {qrCodes.length === 0 ? (
          <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <QrCode className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="font-semibold text-sm">No QR Codes Available</p>
            <p className="text-xs mt-1">Admin has not uploaded any QR codes yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {qrCodes.map(qr => (
              <div key={qr.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group flex flex-col">
                <div className="p-6 flex-1 flex items-center justify-center bg-slate-50 relative group-hover:bg-emerald-50/30 transition-colors">
                  <img src={qr.image} alt={qr.title} className="max-w-full max-h-48 object-contain rounded-lg shadow-sm bg-white p-2 border border-slate-200" />
                </div>
                <div className="p-4 border-t border-slate-100 bg-white">
                  <h3 className="font-bold text-slate-800 text-sm truncate">{qr.title}</h3>
                  <p className="text-[10px] text-slate-500 mt-1 uppercase font-semibold tracking-wider">
                    Added: {new Date(qr.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
