'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, Image, AlertCircle } from 'lucide-react';
import { triggerHaptic } from '@/lib/haptics/vibration';
import { sounds } from '@/lib/audio/sound';

export function QrScannerModal({
  isOpen,
  onClose,
  onCodeScanned,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCodeScanned: (code: string) => void;
}) {
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Helper per estrarre il codice stanza da qualsiasi formato (URL o testo grezzo)
  const extractCode = (decodedText: string): string => {
    const clean = decodedText.trim();
    try {
      if (clean.startsWith('http://') || clean.startsWith('https://')) {
        const url = new URL(clean);
        const codeParam = url.searchParams.get('code');
        if (codeParam) return codeParam.toUpperCase();
        
        // Se URL è tipo /room/DARK42
        const parts = url.pathname.split('/').filter(Boolean);
        const roomIdx = parts.indexOf('room');
        if (roomIdx !== -1 && parts[roomIdx + 1]) {
          return parts[roomIdx + 1].toUpperCase();
        }
      }
    } catch {
      // Non è un URL valido, usa il testo diretto
    }
    return clean.toUpperCase().replace(/[^A-Z0-9]/g, '');
  };

  const handleScanSuccess = (decodedText: string) => {
    const code = extractCode(decodedText);
    if (code && code.length >= 4) {
      triggerHaptic('success');
      sounds.playSuccess();
      stopScanner();
      onCodeScanned(code);
      onClose();
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch {
        // Ignora errori di chiusura
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      return;
    }

    setScannerError(null);
    let mounted = true;

    const startScanner = async () => {
      try {
        // Attendi che il DOM renderizzi il container #qr-reader
        await new Promise((r) => setTimeout(r, 150));
        if (!mounted) return;

        const html5QrCode = new Html5Qrcode('qr-reader');
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 220, height: 220 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            if (mounted) handleScanSuccess(decodedText);
          },
          () => {
            // Frame ignorato
          }
        );
        if (mounted) setIsScanning(true);
      } catch {
        if (!mounted) return;
        setScannerError(
          'Permesso fotocamera negato o non disponibile. Puoi caricare uno screenshot del QR o inserire il codice a mano.'
        );
      }
    };

    startScanner();

    return () => {
      mounted = false;
      stopScanner();
    };
  }, [isOpen]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const html5QrCode = new Html5Qrcode('qr-reader-file-temp');
      const result = await html5QrCode.scanFile(file, true);
      handleScanSuccess(result);
      html5QrCode.clear();
    } catch {
      alert('Nessun QR Code valido trovato nell\'immagine caricata.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-sm bg-[#120e24] border border-white/15 rounded-3xl p-5 shadow-2xl space-y-4 text-center relative overflow-hidden">
        
        {/* Close Button */}
        <button
          onClick={() => {
            triggerHaptic('light');
            stopScanner();
            onClose();
          }}
          type="button"
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors z-20"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-black uppercase tracking-wider mb-1">
            <Camera className="w-3.5 h-3.5" />
            <span>Scansione QR Code</span>
          </div>
          <h3 className="text-xl font-black text-white">Inquadra per Entrare</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Punta la fotocamera verso lo schermo dell&apos;host o il link condiviso
          </p>
        </div>

        {/* Viewfinder Frame */}
        <div className="relative mx-auto w-64 h-64 rounded-3xl overflow-hidden bg-black border-2 border-rose-500/50 flex items-center justify-center shadow-inner">
          <div id="qr-reader" className="w-full h-full" />
          <div id="qr-reader-file-temp" className="hidden" />

          {/* Animated Overlay Reticle */}
          {isScanning && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-48 h-48 border-2 border-dashed border-rose-400 rounded-2xl animate-pulse" />
            </div>
          )}
        </div>

        {scannerError && (
          <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs text-left flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
            <span>{scannerError}</span>
          </div>
        )}

        {/* Alternative Actions: Upload Screenshot or Manual Code */}
        <div className="flex gap-2 pt-1">
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Image className="w-4 h-4 text-rose-400" />
            <span>Carica Immagine</span>
          </button>

          <button
            type="button"
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="flex-1 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs font-bold transition-colors"
          >
            Scrivi a Mano
          </button>
        </div>

      </div>
    </div>
  );
}
