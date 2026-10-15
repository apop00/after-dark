'use client';

import React, { useState } from 'react';
import { Database, CheckCircle, Info, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { triggerHaptic } from '@/lib/haptics/vibration';

export function SupabaseNotice() {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  if (isSupabaseConfigured) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium w-fit mx-auto mb-4">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span>Supabase Realtime Connesso</span>
      </div>
    );
  }

  const envGuide = `NEXT_PUBLIC_SUPABASE_URL=https://tuo-id.supabase.co\nNEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsIn...\nSUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsIn...`;

  const copyEnv = () => {
    triggerHaptic('light');
    navigator.clipboard.writeText(envGuide);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-md mx-auto mb-4 p-3 rounded-2xl bg-[#130f24] border border-rose-500/20 text-left">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => {
          triggerHaptic('light');
          setIsOpen(!isOpen);
        }}
      >
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-rose-400" />
          <span className="text-xs font-semibold text-slate-300">
            Connessione Supabase (Opzionale per Cloud Sync)
          </span>
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </div>

      {isOpen && (
        <div className="mt-3 pt-3 border-t border-white/5 text-xs text-slate-400 space-y-2">
          <p>
            Per sincronizzare le partite tra telefoni diversi via Supabase Realtime, crea un progetto gratuito su{' '}
            <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-rose-400 underline">
              supabase.com
            </a>
            , esegui il file <code className="text-slate-200">supabase/schema.sql</code> nell&apos;SQL Editor e inserisci le credenziali in <code className="text-slate-200">.env.local</code>:
          </p>
          <div className="relative bg-black/60 p-2.5 rounded-xl font-mono text-[11px] text-slate-300">
            <pre className="whitespace-pre-wrap">{envGuide}</pre>
            <button
              onClick={copyEnv}
              className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          <p className="text-[11px] text-emerald-400/90">
            ✓ In locale o in assenza di chiavi, l&apos;app opera tramite il motore di gioco integrato con test completi e simulazione real-time.
          </p>
        </div>
      )}
    </div>
  );
}
