export interface PenaltyDefinition {
  id: string;
  title: string;
  description: string;
  duration_minutes?: number;
  requires_target_player?: boolean;
  category: 'tempo' | 'comportamento' | 'sociale' | 'recitazione';
  icon: string;
}

export const PENALTIES_DATABASE: PenaltyDefinition[] = [
  {
    id: 'pen_mute',
    title: 'Voto del Silenzio',
    description: 'Non puoi proferire parola per 2 minuti interi. Se parli, il tempo riparte da capo o perdi la sfida!',
    duration_minutes: 2,
    category: 'tempo',
    icon: 'VolumeX',
  },
  {
    id: 'pen_statue',
    title: 'Statua di Marmo',
    description: 'Rimani immobile come una statua per 2 minuti. Nessun passo, nessun gesto brusco!',
    duration_minutes: 2,
    category: 'tempo',
    icon: 'PauseCircle',
  },
  {
    id: 'pen_mime',
    title: 'Il Mimo Silenzioso',
    description: 'Fai il mimo per 5 minuti consecutivi: puoi comunicare solo a gesti, smorfie e mimica facciale, zero suoni vocali!',
    duration_minutes: 5,
    category: 'recitazione',
    icon: 'Smile',
  },
  {
    id: 'pen_call',
    title: 'Chiamata al Buio',
    description: 'Chiama al telefono una persona decisa da {target_player}. Devi fare una chiamata vera di almeno 30 secondi!',
    requires_target_player: true,
    category: 'sociale',
    icon: 'PhoneCall',
  },
  {
    id: 'pen_message',
    title: 'Messaggio Imbarazzante',
    description: 'Manda un messaggio WhatsApp o SMS a una persona decisa da {target_player}. Mostra la chat agli altri come prova!',
    requires_target_player: true,
    category: 'sociale',
    icon: 'MessageSquare',
  },
  {
    id: 'pen_noble',
    title: 'Il Lord Altolocato',
    description: 'Parla da aristocratico snob e altolocato per 5 minuti: usa vocaboli arcaici, dai del "voi" a tutti e tieni il mignolo alzato quando bevi!',
    duration_minutes: 5,
    category: 'recitazione',
    icon: 'Crown',
  },
  {
    id: 'pen_german',
    title: 'Accento Teutonico',
    description: 'Parla con un marcato accento tedesco caricaturale per 5 minuti (Ja, natürlich, wunderbar, kartoffeln, achtung)!',
    duration_minutes: 5,
    category: 'recitazione',
    icon: 'Globe',
  },
  {
    id: 'pen_ventennio',
    title: "Discorso d'Altri Tempi",
    description: "Parla con retorica teatrale ed enfasi d'altri tempi da nostalgico del ventennio per 5 minuti (petto in fuori, 'arditi', 'adunate', 'quando c'era lui')!",
    duration_minutes: 5,
    category: 'recitazione',
    icon: 'Megaphone',
  },
  {
    id: 'pen_no_italian',
    title: 'Divieto di Italiano',
    description: 'È severamente vietato parlare in italiano per 5 minuti. Puoi esprimerti solo in inglese, spagnolo, dialetto strettissimo o versi!',
    duration_minutes: 5,
    category: 'comportamento',
    icon: 'Languages',
  },
  {
    id: 'pen_dog',
    title: 'Vita da Cane',
    description: 'Sei un cane per 5 minuti: abbaia, scodinzola quando ti parlano, guaisci se ti ignorano e fatti fare i grattini sulla testa!',
    duration_minutes: 5,
    category: 'recitazione',
    icon: 'Dog',
  },
  {
    id: 'pen_cat',
    title: 'Spirito Felino',
    description: "Sei un gatto per 5 minuti: fai le fusa, miagola per chiedere le cose, guarda tutti dall'alto in basso con fare superiore e strusciati!",
    duration_minutes: 5,
    category: 'recitazione',
    icon: 'Cat',
  },
  {
    id: 'pen_cramps',
    title: 'Crampi & Falso Allarme',
    description: "Lamentati a voce alta dicendo a tutti che ti fa malissimo la pancia, che hai crampi fortissimi e che ti stai cagando addosso per 1 minuto recitando con convinzione, poi di' con massima nonchalance: 'Ah no, nulla... è passato!'.",
    duration_minutes: 1,
    category: 'recitazione',
    icon: 'Activity',
  },
];
