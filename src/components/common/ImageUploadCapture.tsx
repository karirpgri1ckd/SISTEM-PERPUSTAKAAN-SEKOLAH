import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  Trash2,
  RotateCw,
  Check,
  X,
  Image as ImageIcon,
  Building,
  User as UserIcon,
  BookOpen,
  Sparkles,
  AlertCircle,
  SwitchCamera
} from 'lucide-react';

interface ImageUploadCaptureProps {
  label: string;
  value?: string;
  onChange: (dataUrl: string) => void;
  aspectRatio?: 'square' | 'portrait' | 'auto';
  placeholderType?: 'logo' | 'member' | 'book';
  helpText?: string;
  className?: string;
}

/**
 * Resizes and compresses an image file or blob to an optimized JPEG data URL.
 * Keeps storage small (<100KB) and renders fast in UI, PDF, and prints.
 */
export async function compressImageToDataUrl(
  fileOrBlob: Blob,
  maxWidth = 800,
  maxHeight = 800,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca berkas gambar.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Format berkas gambar tidak didukung atau rusak.'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Fallback to raw data url if canvas context fails
          resolve(reader.result as string);
          return;
        }

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(fileOrBlob);
  });
}

export const ImageUploadCapture: React.FC<ImageUploadCaptureProps> = ({
  label,
  value,
  onChange,
  aspectRatio = 'square',
  placeholderType = 'logo',
  helpText,
  className = ''
}) => {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedSnapshot, setCapturedSnapshot] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isShutterFlashing, setIsShutterFlashing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Stop camera tracks when camera modal is closed or unmounted
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  // Connect video element whenever stream changes and camera modal is open
  useEffect(() => {
    if (isCameraOpen && videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [isCameraOpen, cameraStream]);

  const startCamera = async (mode: 'user' | 'environment' = facingMode) => {
    setCameraError(null);
    setCapturedSnapshot(null);
    setIsCameraOpen(true);

    // Stop existing stream if switching
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
      setCameraStream(null);
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Perangkat atau browser ini tidak mendukung akses kamera langsung.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 960 }
        },
        audio: false
      });

      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: unknown) {
      console.error('Camera access error:', err);
      let errMsg = 'Tidak dapat mengakses kamera.';
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          errMsg = 'Izin akses kamera ditolak. Harap izinkan akses kamera di peramban Anda.';
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          errMsg = 'Kamera tidak ditemukan pada perangkat Anda.';
        } else {
          errMsg = err.message || errMsg;
        }
      }
      setCameraError(errMsg);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraOpen(false);
    setCapturedSnapshot(null);
    setCameraError(null);
  };

  const handleToggleFacingMode = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  const handleCaptureSnapshot = () => {
    if (!videoRef.current) return;

    // Trigger flash animation
    setIsShutterFlashing(true);
    setTimeout(() => setIsShutterFlashing(false), 200);

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // If front camera, mirror image so it appears natural
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
    setCapturedSnapshot(dataUrl);
  };

  const handleConfirmSnapshot = async () => {
    if (!capturedSnapshot) return;
    try {
      const res = await fetch(capturedSnapshot);
      const blob = await res.blob();
      const compressed = await compressImageToDataUrl(
        blob,
        aspectRatio === 'portrait' ? 600 : 700,
        aspectRatio === 'portrait' ? 800 : 700,
        0.85
      );
      onChange(compressed);
      stopCamera();
    } catch {
      onChange(capturedSnapshot);
      stopCamera();
    }
  };

  const handleRetakeSnapshot = () => {
    setCapturedSnapshot(null);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImageToDataUrl(
        file,
        aspectRatio === 'portrait' ? 600 : 700,
        aspectRatio === 'portrait' ? 800 : 700,
        0.85
      );
      onChange(compressed);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal memproses berkas gambar.');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      try {
        const compressed = await compressImageToDataUrl(
          file,
          aspectRatio === 'portrait' ? 600 : 700,
          aspectRatio === 'portrait' ? 800 : 700,
          0.85
        );
        onChange(compressed);
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : 'Gagal memproses berkas gambar.');
      }
    }
  };

  const handleRemovePhoto = () => {
    onChange('');
  };

  // Render placeholder icon based on type
  const renderPlaceholderIcon = () => {
    switch (placeholderType) {
      case 'logo':
        return <Building className="w-8 h-8 text-blue-400" />;
      case 'member':
        return <UserIcon className="w-8 h-8 text-indigo-400" />;
      case 'book':
        return <BookOpen className="w-8 h-8 text-emerald-400" />;
      default:
        return <ImageIcon className="w-8 h-8 text-slate-400" />;
    }
  };

  const getAspectClass = () => {
    if (aspectRatio === 'portrait') return 'w-24 h-32 sm:w-28 sm:h-36';
    return 'w-24 h-24 sm:w-28 sm:h-28';
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
          {label}
        </label>
      )}

      {/* Main Container */}
      <div
        onDragOver={e => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`p-3.5 sm:p-4 rounded-2xl border-2 transition-all bg-slate-50/70 ${
          isDragging
            ? 'border-blue-500 bg-blue-50/50 scale-[1.01]'
            : 'border-slate-200/90 hover:border-slate-300'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
          {/* Image Preview Box */}
          <div className="relative group shrink-0">
            <div
              className={`${getAspectClass()} rounded-2xl bg-white border border-slate-200 shadow-2xs overflow-hidden flex items-center justify-center relative`}
            >
              {value && value.trim() !== '' ? (
                <img
                  src={value}
                  alt={label}
                  className="w-full h-full object-cover"
                  onError={e => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-2 text-center">
                  {renderPlaceholderIcon()}
                  <span className="text-[10px] text-slate-400 font-medium mt-1">Belum ada foto</span>
                </div>
              )}
            </div>

            {value && value.trim() !== '' && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                title="Hapus foto ini"
                className="absolute -top-2 -right-2 p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full shadow-md transition-transform hover:scale-110"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Action Buttons & Description */}
          <div className="flex-1 space-y-2.5 text-center sm:text-left w-full">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              {/* File Upload Button */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl shadow-2xs transition-all hover:border-blue-400"
              >
                <Upload className="w-3.5 h-3.5 text-blue-600" />
                <span>Pilih Berkas Foto</span>
              </button>

              {/* Camera Capture Button */}
              <button
                type="button"
                onClick={() => startCamera('user')}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-2xs transition-all hover:shadow-md"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Ambil dari Kamera</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              {helpText ||
                'Unggah foto dari perangkat atau jepret langsung via webcam / kamera perangkat. Foto akan dioptimalkan otomatis.'}
            </p>

            {value ? (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-[10px] font-semibold">
                <Check className="w-3 h-3 text-emerald-600" />
                <span>Foto siap disimpan</span>
              </div>
            ) : (
              <div className="text-[10px] text-slate-400">
                Format didukung: JPG, PNG, WEBP (Bisa drag & drop ke sini)
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CAMERA CAPTURE MODAL OVERLAY */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col">
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold">Kamera Pengambilan Foto</h4>
                  <p className="text-[10px] text-slate-400">Arahkan kamera ke objek foto {label.toLowerCase()}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={stopCamera}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Camera Viewport */}
            <div className="relative bg-black flex items-center justify-center min-h-[320px] max-h-[460px] overflow-hidden">
              {cameraError ? (
                <div className="p-6 text-center text-white space-y-3 max-w-sm">
                  <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <h5 className="font-bold text-sm">Tidak Dapat Mengakses Kamera</h5>
                  <p className="text-xs text-slate-300">{cameraError}</p>
                  <div className="pt-2 flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => startCamera(facingMode)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl"
                    >
                      Coba Lagi
                    </button>
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              ) : capturedSnapshot ? (
                /* Snapshot Preview */
                <div className="relative w-full h-full flex items-center justify-center bg-slate-950">
                  <img
                    src={capturedSnapshot}
                    alt="Hasil Foto"
                    className="max-h-[380px] w-auto object-contain rounded-lg shadow-lg"
                  />
                  <div className="absolute top-3 left-3 px-2.5 py-1 bg-black/60 backdrop-blur-xs text-white text-[11px] font-semibold rounded-lg flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>Hasil Jepretan Foto</span>
                  </div>
                </div>
              ) : (
                /* Live Camera Feed */
                <div className="relative w-full h-full flex items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${
                      facingMode === 'user' ? 'scale-x-[-1]' : ''
                    }`}
                  />

                  {/* Shutter Flash Effect */}
                  {isShutterFlashing && (
                    <div className="absolute inset-0 bg-white opacity-80 pointer-events-none transition-opacity" />
                  )}

                  {/* Framing Guide */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
                    <div
                      className={`border-2 border-dashed border-white/70 rounded-2xl shadow-lg ${
                        aspectRatio === 'portrait' ? 'w-48 h-64' : 'w-56 h-56'
                      }`}
                    />
                  </div>

                  {/* Camera Controls Overlay */}
                  <div className="absolute top-3 right-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleToggleFacingMode}
                      title="Balik Kamera (Depan / Belakang)"
                      className="p-2 bg-black/50 hover:bg-black/80 text-white rounded-full backdrop-blur-xs transition-colors"
                    >
                      <SwitchCamera className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Controls */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              {capturedSnapshot ? (
                <>
                  <button
                    type="button"
                    onClick={handleRetakeSnapshot}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl shadow-2xs"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Foto Ulang</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmSnapshot}
                    className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all"
                  >
                    <Check className="w-4 h-4" />
                    <span>Gunakan Foto Ini</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    disabled={!!cameraError}
                    onClick={handleCaptureSnapshot}
                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-extrabold rounded-xl shadow-md transition-all hover:scale-105 active:scale-95"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Jepret Foto</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
