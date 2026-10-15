'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, AlertTriangle, Sparkles, CheckCircle2, HeartHandshake, Eye, Flame } from 'lucide-react';
import { Navbar } from '@/components/Navbar';

export default function RulesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#07050f] text-slate-100 pb-12">
      <Navbar showRules={false} />

      <main className="flex-1 max-w-md w-full mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Torna al Gioco</span>
          </Link>
          <span className="text-xs uppercase tracking-widest text-rose-400 font-bold">
            Guida Ufficiale
          </span>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-white tracking-tight">
            REGOLE & CODICE ETICO
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            AFTER DARK è un party game psicologico e sociale progettato per rendere indimenticabile una serata tra amici.
          </p>
        </div>

        {/* Ethical Disclaimer Card */}
        <div className="p-4 rounded-3xl bg-rose-950/30 border border-rose-500/40 space-y-3 shadow-xl">
          <div className="flex items-center gap-2.5 text-rose-400 font-bold text-sm">
            <HeartHandshake className="w-5 h-5" />
            <span>IL PATTO DI RISPETTO & CONSENSO</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Il gioco è ironico, cinico e leggermente dark, ma <strong>NON incoraggia mai</strong> molestie, contatti fisici non consensuali, furti, consumo forzato di alcol, umiliazioni reali, attività illegali o comportamenti rischiosi.
          </p>
          <div className="space-y-1.5 text-xs text-rose-300/90 pt-1">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span>Il consenso e il comfort di tutti i partecipanti sono sempre prioritari.</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span>Nessuna missione richiede o giustifica di disturbare persone estranee.</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span>Se una missione ti mette a disagio, puoi abbandonarla senza penali.</span>
            </div>
          </div>
        </div>

        {/* 1. Come si Gioca */}
        <div className="space-y-3">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-rose-400" />
            <span>1. Come Funziona una Partita</span>
          </h2>
          <div className="p-4 rounded-3xl bg-white/[0.03] border border-white/5 space-y-2.5 text-xs text-slate-300 leading-relaxed">
            <p>
              1. <strong>Lobby</strong>: L&apos;host crea la stanza scegliendo la modalità adatta al luogo (Bar, Club, Casa, Outdoor, Chaos) e condivide il codice o QR code.
            </p>
            <p>
              2. <strong>Missioni Segrete</strong>: All&apos;avvio della partita ciascun giocatore riceve sul proprio telefono le sue missioni segrete, bilanciate per difficoltà e tipologia.
            </p>
            <p>
              3. <strong>Privacy Shield</strong>: Le missioni sullo schermo sono coperte da una protezione: tocca o tieni premuto per leggerle senza farle vedere a chi ti siede accanto.
            </p>
          </div>
        </div>

        {/* 2. Verifica a Due Fattori */}
        <div className="space-y-3">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Eye className="w-4 h-4 text-purple-400" />
            <span>2. Testimonianza e Punteggi</span>
          </h2>
          <div className="p-4 rounded-3xl bg-white/[0.03] border border-white/5 space-y-2.5 text-xs text-slate-300 leading-relaxed">
            <p>
              Per garantire fair play, quando dichiari di aver completato una missione devi selezionare un <strong>Testimone tra i presenti</strong>.
            </p>
            <p>
              Il testimone riceverà una notifica sul suo schermo e confermerà o negherà la veridicità dell&apos;accaduto.
            </p>
            <p>
              Se la missione era collaborativa, anche il partner segreto riceverà una parte dei punti!
            </p>
          </div>
        </div>

        {/* 3. Modalità */}
        <div className="space-y-3">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400" />
            <span>3. Le 5 Modalità di Gioco</span>
          </h2>
          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1">
              <p className="font-bold text-amber-300">🍸 BAR & LOUNGE</p>
              <p className="text-slate-300">Osservazione, scelte sui drink, aneddoti al tavolo e persuasione discreta.</p>
            </div>

            <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 space-y-1">
              <p className="font-bold text-purple-300">🪩 DISCOTECA & CLUB</p>
              <p className="text-slate-300">Ideale per musica alta e folla: cenni in codice, passi di danza sincronizzati, foto e pose scenografiche.</p>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
              <p className="font-bold text-emerald-300">🏠 HOUSE PARTY</p>
              <p className="text-slate-300">Divano, cucina, frigo, votazioni collettive e aneddoti del passato tra amici fidati.</p>
            </div>

            <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 space-y-1">
              <p className="font-bold text-cyan-300">🌳 OUTDOOR & FESTIVAL</p>
              <p className="text-slate-300">Passeggiate in centro, piazze, scorci urbani e movimento all&apos;aria aperta.</p>
            </div>

            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-1">
              <p className="font-bold text-rose-300">⚡ CHAOS MODE</p>
              <p className="text-slate-300">Sabotaggi controllati, bluff spinto, alleanze temporanee ed eventi a sorpresa.</p>
            </div>
          </div>
        </div>

        {/* Back action */}
        <div className="pt-2">
          <Link
            href="/"
            className="w-full py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center transition-colors"
          >
            Ho Capito, Andiamo a Giocare!
          </Link>
        </div>
      </main>
    </div>
  );
}
