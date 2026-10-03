import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface QrCodeViewerProps {
  value: string;
  size?: number;
  className?: string;
  showText?: boolean;
}

export const QrCodeViewer: React.FC<QrCodeViewerProps> = ({
  value,
  size = 120,
  className = '',
  showText = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (canvasRef.current && value) {
      QRCode.toCanvas(
        canvasRef.current,
        value,
        {
          width: size,
          margin: 1,
          color: {
            dark: '#0f172a',
            light: '#ffffff'
          }
        },
        error => {
          if (error) console.error('Error generating QR code', error);
        }
      );
    }
  }, [value, size]);

  return (
    <div className={`inline-flex flex-col items-center justify-center ${className}`}>
      <canvas ref={canvasRef} className="rounded-lg shadow-sm border border-slate-100 bg-white" />
      {showText && (
        <span className="mt-1 text-xs font-mono font-medium text-slate-600 tracking-wider">
          {value}
        </span>
      )}
    </div>
  );
};
