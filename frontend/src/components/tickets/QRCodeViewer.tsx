import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode } from 'lucide-react';

interface QRCodeViewerProps {
  qrCode?: string;
  label?: string;
}

export const QRCodeViewer: React.FC<QRCodeViewerProps> = ({ qrCode, label = 'Ticket QR' }) => (
  <div className="flex flex-col items-center gap-4 rounded-lg border border-slate-200 bg-white p-5">
    <div className="flex h-64 w-64 items-center justify-center rounded-lg bg-slate-50 p-4">
      {qrCode ? (
        qrCode.startsWith('data:image') ? (
          <img src={qrCode} alt={label} className="h-full w-full object-contain" />
        ) : (
          <QRCodeSVG value={qrCode} size={220} level="M" includeMargin />
        )
      ) : (
        <div className="flex flex-col items-center gap-2 text-slate-400">
          <QrCode className="h-12 w-12" />
          <span className="text-sm font-bold">QR unavailable</span>
        </div>
      )}
    </div>
    <p className="text-center text-xs font-semibold text-slate-500">Present this QR at check-in. Keep it private.</p>
  </div>
);
