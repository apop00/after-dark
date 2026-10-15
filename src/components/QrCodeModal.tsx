'use client';

import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { X, Copy, Check, Share2 } from 'lucide-react';
import { triggerHaptic } from '@/lib/haptics/vibration';

export function QrCodeModal({
  isOpen,
  onClose,
  roomCode,
}: {
  isOpen: boolean;
  onClose: () => void;
  roomCode: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copied, setCopied] = React.useState(false);

  const inviteUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/join?code=${roomCode}`
    : `https://afterdark.party/join?code=${roomCode}`;

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, inviteUrl, {
        width: 240,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });
    }
  }, [isOpen, inviteUrl]);

  if (!isOpen) return null;

  const handleCopy = () => {
    triggerHaptic('light');
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    triggerHaptic('medium');
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Unisciti alla partita AFTER DARK',
          text: `Entra nella mia stanza con il codice ${roomCode}!`,
          url: inviteUrl,
        });
      } catch {
        // Fallback
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-sm bg-[#120e24] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-5 text-center relative">
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <h3 className="font-black text-xl text-white tracking-wider">INVITA AMICI</h3>
          <p className="text-xs text-slate-400 mt-1">Inquadra con la fotocamera o condividi il link</p>
        </div>

        {/* QR Code Canvas */}
        <div className="flex justify-center p-4 bg-white rounded-2xl shadow-inner mx-auto w-fit">
          <canvas ref={canvasRef} />
        </div>

        {/* Room Code Badge */}
        <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
          <div className="text-left">
            <span className="text-[10px] uppercase tracking-wider text-slate-400">Codice Stanza</span>
            <p className="text-xl font-black tracking-widest text-rose-400">{roomCode}</p>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-white font-semibold transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copiato!' : 'Copia Link'}</span>
          </button>
        </div>

        <button
          onClick={handleShare}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-rose-950/50 flex items-center justify-center gap-2"
        >
          <Share2 className="w-4 h-4" />
          <span>Condividi Invito</span>
        </button>
      </div>
    </div>
  );
}
