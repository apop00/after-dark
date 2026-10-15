# 🌙 AFTER DARK — Social Party Game Mobile-First

**AFTER DARK** è un party game sociale multiplayer mobile-first progettato per serate dal vivo con gruppi di amici (bar, discoteca, festa in casa, outdoor e chaos).

Ciascun giocatore riceve missioni segrete asimmetriche, interagisce dal vivo con gli altri partecipanti, bluffa, fa convalidare le missioni tramite testimonianza a due parti, scatena eventi Chaos e concorre per la vittoria e per i titoli ironici di fine serata.

---

## 🎯 Caratteristiche Chiave

- **Mobile-First & PWA Installabile**: UI scura, raffinata, ad alto contrasto con neon accent e icone native.
- **Privacy Shield (Tap-to-Hold / Toggle)**: Le card delle missioni segrete sono schermate per impedire che amici al bancone o al tavolo possano sbirciare lo schermo.
- **5 Modalità di Gioco Ambientali**:
  - 🍸 **Bar & Lounge**: Conversazioni, drink, osservazione discreta e aneddoti.
  - 🪩 **Discoteca & Club**: Musica alta, cenni visivi, sguardi, ballo coordinato e playback scenografico.
  - 🏠 **House Party**: Spazi domestici (cucina, divano, frigo), segreti tra amici, votazioni al volo.
  - 🌳 **Outdoor & Festival**: Passeggiate serali, piazze, ponti e scorci urbani.
  - ⚡ **Chaos Mode**: Sabotaggi controllati, alleanze segrete, bluff spinto ed eventi a sorpresa.
- **Catalogo di 125 Missioni Curate**: Distribuite su 8 categorie e 4 livelli di difficoltà (Facile, Media, Difficile, Leggendaria), con condizioni speciali e regole contro la ripetizione.
- **Consenso & Etica Garantiti**: Zero molestie, zero contatti non consensuali, zero furti, nessun consumo forzato di alcol, nessuna umiliazione reale.
- **Verifica Tra Pari a Due Fattori**: Sistema di testimonianza anti-cheating controllato dal backend.
- **Eventi Chaos & Moltiplicatori Live**: Double Points Rush a tempo, countdown e missioni lampo.
- **Podio e Premi Ironici della Serata**: Riconoscimenti come *"Leggenda della Notte"*, *"Agente del Caos"*, *"Manipolatore della Serata"*, *"Fallimento Glorioso"*, completi di festeggiamento coriandoli (`canvas-confetti`).
- **Web Audio & Haptics**: Micro-feedback sonori sintetizzati nativi (nessun download di file audio esterni) e vibrazioni tattili (`navigator.vibrate`).

---

## 🛠️ Stack Tecnologico

- **Frontend**: [Next.js](https://nextjs.org/) (App Router), React, TypeScript, Tailwind CSS, Lucide Icons, Framer Motion, Canvas Confetti, QRCode.
- **Backend**: Next.js Server API Routes & Server Store per la gestione atomica di stanze, missioni, consensi e punteggi.
- **Database & Realtime**: PostgreSQL + Supabase Realtime con Row Level Security (RLS) che protegge le missioni segrete da ispezioni malevole sul client.
- **Test Runner**: [Vitest](https://vitest.dev/) con suite completa di unit test e test di integrazione end-to-end.

---

## 🚀 Avvio Rapido Locale

### 1. Prerequisiti
- Node.js 20+ ed npm

### 2. Installazione
```bash
cd after-dark
npm install
```

### 3. Esecuzione dei Test
```bash
npm test
```
Tutti i 9 test end-to-end e di logica di gioco (creazione stanza, privacy missioni, verifica consensi, duplicati, calcolo premi) verranno eseguiti.

### 4. Avvio Server di Sviluppo
```bash
npm run dev
```
L'app sarà attiva su `http://localhost:3000`.

---

## ☁️ Connessione a Supabase (Opzionale per Sincronizzazione Cloud)

L'applicazione include un motore atomico che funziona immediatamente in locale. Per collegare il tuo progetto Supabase cloud per il multiplayer tra telefoni diversi:

1. Crea un progetto su [supabase.com](https://supabase.com).
2. Apri la sezione **SQL Editor** su Supabase e incolla l'intero contenuto del file `supabase/schema.sql` (tabelle, indici, trigger, policy RLS e pubblicazioni Realtime).
3. (Opzionale) Esegui anche `supabase/seed.sql` per inserire le 125 missioni nel database PostgreSQL.
4. Crea un file `.env.local` nella cartella `after-dark/` con le credenziali ricavate da **Project Settings -> API**:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tuo-progetto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsIn...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsIn...
```

---

## 🧪 Struttura dei File

```
after-dark/
├── public/
│   ├── icon.svg             # Icona vettoriale PWA
│   └── manifest.json        # Manifest per installazione PWA
├── src/
│   ├── app/
│   │   ├── api/             # 9 Route Handlers REST sicuri per la gestione della partita
│   │   ├── create/          # Configurazione e creazione stanza
│   │   ├── game/[id]/       # HUD di gioco mobile, Privacy Shield, Testimonianze
│   │   │   └── results/     # Podio, animazioni, premi ironici e statistiche
│   │   ├── join/            # Accesso con codice o QR code
│   │   ├── room/[code]/     # Lobby multiplayer con giocatori connessi
│   │   ├── rules/           # Regole, modalità e codice etico
│   │   ├── globals.css      # Stili globali Tailwind dark mode
│   │   ├── layout.tsx       # Root layout mobile-first
│   │   └── page.tsx         # Landing page e personalizzazione avatar/nickname
│   ├── components/
│   │   ├── AvatarPicker.tsx # Selettore avatar rapido
│   │   ├── MissionCard.tsx  # Card missione con Privacy Shield Tap-to-Reveal
│   │   ├── Navbar.tsx       # Header con audio toggle e badge giocatore
│   │   ├── QrCodeModal.tsx  # Generatore QR code per inviti immediati
│   │   ├── SupabaseNotice.tsx # Guida e stato di connessione Supabase
│   │   └── VerificationModal.tsx # Modale selezione testimone e drawer approvazione
│   ├── data/
│   │   └── missions.ts      # 125 missioni uniche classificate
│   ├── lib/
│   │   ├── audio/           # Sintetizzatore Web Audio (click, reveal, success, chaos)
│   │   ├── game/            # Algoritmo di distribuzione missioni e premi
│   │   ├── haptics/         # Feedback vibrazione tattile
│   │   ├── server/          # Store server-side con controlli di privacy
│   │   ├── session/         # Gestione sessione anonima persistente
│   │   └── supabase/        # Client e server helper Supabase
│   └── types/
│       └── game.ts          # Interfacce TypeScript
├── supabase/
│   ├── schema.sql           # DDL PostgreSQL completo con RLS e Realtime
│   └── seed.sql             # Script SQL di seed con le 125 missioni
├── tests/
│   ├── api-routes.test.ts   # Test di integrazione API HTTP
│   └── game-engine.test.ts  # Test unitari sul motore di gioco
└── package.json
```
