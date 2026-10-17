'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Shield,
  Sparkles,
  HeartHandshake,
  Eye,
  Flame,
  Link2,
  Target,
  RotateCcw,
  Scale,
  Users,
  Zap,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';

export default function RulesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#07050f] text-slate-100 pb-24">
      <Navbar showRules={false} />

      <main className="flex-1 max-w-md w-full mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Torna alla Home</span>
          </Link>
          <span className="text-[10px] uppercase tracking-widest text-rose-400 font-bold px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20">
            Guida Ufficiale
          </span>
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">
            Regole & Modalità
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            AFTER DARK è un party game psicologico e sociale progettato per trasformare una serata dal vivo in un gioco di missioni segrete, bluff e colpi di scena.
          </p>
        </div>

        {/* Patto di Rispetto & Consenso */}
        <div className="p-4 rounded-3xl bg-rose-950/30 border border-rose-500/40 space-y-3 shadow-xl">
          <div className="flex items-center gap-2.5 text-rose-400 font-bold text-sm">
            <HeartHandshake className="w-5 h-5 shrink-0" />
            <span>IL PATTO DI RISPETTO & CONSENSO</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Il gioco è ironico, cinico e frizzante, ma <strong>NON incoraggia mai</strong> molestie, contatti fisici non consensuali, furti, consumo forzato di alcol, umiliazioni reali, attività illegali o comportamenti rischiosi.
          </p>
          <div className="space-y-1.5 text-xs text-rose-300/90 pt-1">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
              <span>Il consenso e il comfort di tutti i partecipanti sono sempre prioritari.</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
              <span>Nessuna missione richiede o giustifica di disturbare persone estranee.</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
              <span>Se una missione ti mette a disagio, puoi cambiarla o abbandonarla senza penali.</span>
            </div>
          </div>
        </div>

        {/* 1. Come si Gioca */}
        <div className="space-y-3">
          <h2 className="text-base font-black text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-rose-400" />
            <span>1. Come Funziona una Partita</span>
          </h2>
          <div className="p-4 rounded-3xl bg-white/[0.03] border border-white/5 space-y-2.5 text-xs text-slate-300 leading-relaxed">
            <p>
              1. <strong>Lobby & Stanza</strong>: L&apos;host crea la stanza scegliendo l&apos;ambientazione, le regole di progressione e il numero di task. I giocatori si uniscono tramite codice stanza o scansionando il QR code.
            </p>
            <p>
              2. <strong>Ricezione Task Segrete</strong>: All&apos;avvio ciascun giocatore riceve sul proprio smartphone le sue missioni, bilanciate e calibrate per sesso (se attivato) e difficoltà.
            </p>
            <p>
              3. <strong>Convalida</strong>: Una volta compiuta la missione, il giocatore ne richiede la convalida immediata (Auto-conferma) oppure seleziona un <strong>Testimone oculare</strong> tra gli altri giocatori che dovrà confermare o smentire l&apos;accaduto.
            </p>
          </div>
        </div>

        {/* 2. Nuove Opzioni di Progressione: Catena vs Libera */}
        <div className="space-y-3">
          <h2 className="text-base font-black text-white flex items-center gap-2">
            <Link2 className="w-4 h-4 text-indigo-400" />
            <span>2. Progressione: Catena di Sfide vs Libere</span>
          </h2>
          <div className="space-y-2.5 text-xs">
            <div className="p-3.5 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 space-y-1">
              <p className="font-extrabold text-indigo-300 flex items-center gap-1.5">
                <span>🔗 CATENA DI SFIDE (STEP BY STEP)</span>
              </p>
              <p className="text-slate-300 leading-relaxed">
                Le missioni devono essere affrontate <strong>obbligatoriamente in sequenza</strong>, ordinate per difficoltà crescente. Le sfide successive sono coperte e bloccate con un lucchetto: si sbloccano una alla volta solo quando completi o decidi di cambiare la missione attuale!
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
              <p className="font-extrabold text-slate-200">
                🎴 MISSIONI LIBERE (CLASSICA)
              </p>
              <p className="text-slate-300 leading-relaxed">
                Tutte le tue missioni sono visibili e sbloccate fin dal primo minuto. Puoi pianificare la tua strategia e completarle nell&apos;ordine che ritieni più opportuno durante la serata.
              </p>
            </div>
          </div>
        </div>

        {/* 3. Sistemi di Punteggio: A Punti vs Solo Missioni */}
        <div className="space-y-3">
          <h2 className="text-base font-black text-white flex items-center gap-2">
            <Scale className="w-4 h-4 text-amber-400" />
            <span>3. Modalità Punteggio: A Punti vs Solo Missioni</span>
          </h2>
          <div className="space-y-2.5 text-xs">
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
              <p className="font-extrabold text-amber-300">🏆 A PUNTI (PUNTEGGIO CLASSICO)</p>
              <p className="text-slate-300 leading-relaxed">
                Ogni missione vale un montepremi numerico proporzionale al livello di sfida: <strong>Facile (+50 PT)</strong>, <strong>Media (+100 PT)</strong>, <strong>Difficile (+150 PT)</strong>, <strong>Leggendaria (+250 PT)</strong>. Vince chi totalizza il punteggio più alto.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-violet-950/20 border border-violet-500/30 space-y-1.5">
              <p className="font-extrabold text-violet-300">🎯 SENZA PUNTI (CONTEGGIO SFIDE)</p>
              <p className="text-slate-300 leading-relaxed">
                Non ci sono numeri o calcoli: vince semplicemente chi porta a termine il maggior numero di missioni. Si suddivide in due varianti:
              </p>
              <ul className="space-y-1 pl-3 text-slate-300 list-disc">
                <li>
                  <strong className="text-emerald-300">Fair Mode (Equilibrata)</strong>: ogni partecipante riceve un mazzo con identica proporzione di difficoltà (ad es. 1 facile, 1 media, 1 difficile) per una gara ad armi pari.
                </li>
                <li>
                  <strong className="text-rose-300">Chaos Roulette (Casuale)</strong>: le difficoltà sono pescate a sorte. Alcuni giocatori avranno vita facile, altri dovranno superare sfide impossibili!
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* 4. Meccanica "Cambia Task" (Skip) */}
        <div className="space-y-3">
          <h2 className="text-base font-black text-white flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-cyan-400" />
            <span>4. Cambia Task (Skip / Reroll)</span>
          </h2>
          <div className="p-4 rounded-3xl bg-cyan-950/20 border border-cyan-500/30 space-y-2.5 text-xs text-slate-300 leading-relaxed">
            <p>
              Se una missione ti sembra irrealizzabile o le condizioni non lo permettono, puoi utilizzare il tasto <strong>🔄 Cambia Task</strong> direttamente sulla carta.
            </p>
            <ul className="space-y-1 pl-3 list-disc">
              <li>
                <strong>Cambi Disponibili</strong>: L&apos;host può impostare da <strong>0 a 3 cambi</strong> per giocatore per tutta la durata del match.
              </li>
              <li>
                <strong>Regola di Difficoltà</strong>:
                può essere <em>Stesso Livello</em> (sostituto equivalente), <em>Più Difficile</em> (penalità per i più coraggiosi), o <em>Difficoltà Casuale</em>.
              </li>
              <li>
                <strong>Garanzia Anti-Duplicato</strong>: Il motore di gioco garantisce che non ti verrà mai riproposta una missione già vista o tentata nella stessa partita.
              </li>
            </ul>
          </div>
        </div>

        {/* 5. Privacy Shield vs Carte Scoperte */}
        <div className="space-y-3">
          <h2 className="text-base font-black text-white flex items-center gap-2">
            <Eye className="w-4 h-4 text-emerald-400" />
            <span>5. Privacy Shield & Carte Scoperte</span>
          </h2>
          <div className="p-4 rounded-3xl bg-white/[0.03] border border-white/5 space-y-2.5 text-xs text-slate-300 leading-relaxed">
            <p>
              • <strong>Task Coperte (Default)</strong>: Un velo protettivo nasconde testo e titolo della missione. Basta un tocco sullo schermo per rivelare l&apos;obiettivo solo ai tuoi occhi e nasconderlo all&apos;istante se qualcuno si avvicina.
            </p>
            <p>
              • <strong>Carte Scoperte</strong>: Impostazione pensata per party aperti e dichiarati in cui le carte sono sempre visibili sullo schermo.
            </p>
          </div>
        </div>

        {/* 6. Le 6 Ambientazioni */}
        <div className="space-y-3">
          <h2 className="text-base font-black text-white flex items-center gap-2">
            <Flame className="w-4 h-4 text-rose-400" />
            <span>6. Le 6 Ambientazioni di Gioco</span>
          </h2>
          <div className="space-y-2 text-xs">
            <div className="p-3.5 rounded-2xl bg-fuchsia-950/30 border border-fuchsia-500/40 space-y-1">
              <p className="font-extrabold text-fuchsia-300">🌴 JEFFREY ISLAND 🔥 (PICCANTE & ALCOLICA)</p>
              <p className="text-slate-300">Party senza filtri: flirt, penitenze piccanti, verità scottanti, drink e sfide proibite tra amici intimi.</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1">
              <p className="font-extrabold text-amber-300">🍸 BAR & LOUNGE</p>
              <p className="text-slate-300">Osservazione discreta, scelte sui drink, aneddoti al tavolo e persuasione psicologica.</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 space-y-1">
              <p className="font-extrabold text-purple-300">🪩 DISCOTECA & CLUB</p>
              <p className="text-slate-300">Ideale con musica alta e folla: cenni in codice, passi di danza sincronizzati, pose e sguardi d&apos;intesa.</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
              <p className="font-extrabold text-emerald-300">🏠 HOUSE PARTY</p>
              <p className="text-slate-300">Divano, cucina, frigo, votazioni collettive e aneddoti del passato tra amici fidati.</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 space-y-1">
              <p className="font-extrabold text-cyan-300">🌳 ALL&apos;APERTO & FESTIVAL</p>
              <p className="text-slate-300">Passeggiate serali, piazze, scorci urbani e movimento continuo all&apos;aria aperta.</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-1">
              <p className="font-extrabold text-rose-300">⚡ CHAOS MODE</p>
              <p className="text-slate-300">Sabotaggi amichevoli, bluff estremo, alleanze temporanee ed eventi a sorpresa.</p>
            </div>
          </div>
        </div>

        {/* Back action */}
        <div className="pt-2">
          <Link
            href="/"
            className="w-full py-4 rounded-2xl btn-game-rose text-white font-black text-xs uppercase tracking-wider flex items-center justify-center transition-all cursor-pointer shadow-xl active:scale-98"
          >
            Ho Capito, Andiamo a Giocare!
          </Link>
        </div>
      </main>
    </div>
  );
}
