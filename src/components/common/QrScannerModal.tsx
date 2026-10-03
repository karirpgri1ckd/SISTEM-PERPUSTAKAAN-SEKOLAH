import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, Keyboard, AlertCircle, RefreshCw } from 'lucide-react';
import { soundService } from '../../services/soundService';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (scannedText: string) => void;
  title?: string;
  subtitle?: string;
  expectedPrefix?: 'AGT' | 'BK' | 'PJM' | string;
  sampleCodes?: { code: string; label: string }[];
  keepOpenOnScan?: boolean;
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({
  isOpen,
  onClose,
  onScan,
  title = 'Scan QR Code / Barcode',
  subtitle = 'Arahkan kamera ke QR Code atau Barcode',
  expectedPrefix,
  keepOpenOnScan = false
}) => {
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanMessage, setLastScanMessage] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScannedTimeRef = useRef<{ code: string; time: number }>({ code: '', time: 0 });
  const scannerContainerId = 'qr-reader-region';

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCameraError(null);
      setManualCode('');
      setLastScanMessage(null);
      return;
    }

    let isMounted = true;

    const startScanner = async () => {
      try {
        setCameraError(null);
        setLastScanMessage(null);
        // Small delay to allow DOM render of container
        await new Promise(r => setTimeout(r, 100));

        if (!isMounted) return;

        const scanner = new Html5Qrcode(scannerContainerId);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
          },
          decodedText => {
            if (!isMounted) return;
            const code = decodedText.trim();
            const now = Date.now();

            // Throttle to prevent scanning same barcode within 1.5 seconds
            if (lastScannedTimeRef.current.code === code && now - lastScannedTimeRef.current.time < 1500) {
              return;
            }

            lastScannedTimeRef.current = { code, time: now };
            soundService.playSuccessBeep();
            onScan(code);

            if (keepOpenOnScan) {
              setLastScanMessage(`Berhasil scan: "${code}". Silakan scan buku berikutnya.`);
              setTimeout(() => {
                if (isMounted) setLastScanMessage(null);
              }, 2500);
            } else {
              onClose();
            }
          },
          () => {
            // ignore frame parse errors
          }
        );
        setIsScanning(true);
      } catch (err: unknown) {
        if (isMounted) {
          console.warn('Camera failed to start or access denied:', err);
          setCameraError(
            'Kamera tidak dapat diakses atau izin ditolak. Silakan gunakan input manual di bawah atau tombol simulasi.'
          );
          setIsScanning(false);
        }
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      stopCamera();
    };
  }, [isOpen]);

  const stopCamera = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch (e) {
        console.warn('Error stopping scanner:', e);
      }
      scannerRef.current = null;
      setIsScanning(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    soundService.playSuccessBeep();
    onScan(manualCode.trim());
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">{title}</h3>
              <p className="text-xs text-slate-500">{subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Viewport Area */}
        <div className="p-4 flex flex-col items-center">
          {lastScanMessage && (
            <div className="w-full mb-3 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2 animate-in fade-in duration-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>{lastScanMessage}</span>
            </div>
          )}

          <div className="relative w-full aspect-square max-w-[280px] bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center border-2 border-slate-200 shadow-inner">
            <div id={scannerContainerId} className="w-full h-full" />

            {/* Target overlay guide */}
            {isScanning && !cameraError && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-48 h-48 border-2 border-blue-500/80 rounded-xl relative animate-pulse">
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-blue-500 -mt-0.5 -ml-0.5" />
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-blue-500 -mt-0.5 -mr-0.5" />
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-blue-500 -mb-0.5 -ml-0.5" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-blue-500 -mb-0.5 -mr-0.5" />
                </div>
              </div>
            )}

            {/* Error or No Camera Fallback */}
            {cameraError && (
              <div className="absolute inset-0 bg-slate-900/90 text-white p-6 flex flex-col items-center justify-center text-center">
                <AlertCircle className="w-10 h-10 text-amber-400 mb-2" />
                <p className="text-xs text-slate-200 leading-relaxed mb-3">{cameraError}</p>
                <span className="text-[11px] text-slate-400">Gunakan form input kode manual di bawah</span>
              </div>
            )}
          </div>

          {/* Manual Input Form */}
          <form onSubmit={handleManualSubmit} className="w-full mt-4">
            <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1.5">
              <Keyboard className="w-3.5 h-3.5 text-slate-500" />
              <span>Input Kode Manual / Barcode USB</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualCode}
                onChange={e => setManualCode(e.target.value.toUpperCase())}
                placeholder={expectedPrefix ? `Contoh: ${expectedPrefix}-00001` : 'Ketik kode di sini...'}
                autoFocus
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm uppercase font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                Pilih
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Scanner USB otomatis terdeteksi saat aktif</span>
          <button
            onClick={onClose}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              keepOpenOnScan
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                : 'bg-white border border-slate-200 hover:bg-slate-100 text-slate-700'
            }`}
          >
            {keepOpenOnScan ? 'Selesai Memindai' : 'Tutup'}
          </button>
        </div>
      </div>
    </div>
  );
};
