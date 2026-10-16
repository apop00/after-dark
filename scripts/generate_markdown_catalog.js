const fs = require("fs");
const path = require("path");

// Load missions
let raw = fs.readFileSync(path.join(__dirname, "../src/data/missions.ts"), "utf8");
raw = raw.replace(/^import\s+.*?;/m, "").replace("export const MISSIONS_DATABASE: Mission[] =", "const MISSIONS_DATABASE =") + "; module.exports = MISSIONS_DATABASE;";
const missions = eval(raw);

const categoryMeta = {
  socializzazione: {
    title: "🤝 Socializzazione & Interazione",
    desc: "Missioni sociali per rompere il ghiaccio, fare nuove conoscenze, avviare brindisi o innescare momenti corali e conversazioni memorabili."
  },
  persuasione: {
    title: "🎭 Persuasione & Influenza",
    desc: "Missioni per convincere gli amici o sconosciuti ad adottare opinioni bizzarre, ordinare cose inaspettate o compiere piccoli gesti teatrali."
  },
  bluff: {
    title: "🃏 Bluff & Identità Segrete",
    desc: "Missioni psicologiche in cui fingere ruoli, inventare aneddoti fittizi credibili e mantenere la calma senza farsi smascherare."
  },
  collaborazione: {
    title: "👥 Collaborazione (Missioni Coop a Coppie o Triplette)",
    desc: "Missioni di squadra esclusive: tu e il tuo/tuoi partner complottate segretamente in sincronia per portare a termine l'obiettivo comune."
  },
  chaos: {
    title: "⚡ Chaos & Imprevisti Dinamici",
    desc: "Azioni dinamiche, colpi di scena, sfide a catena e momenti ad altissima energia capaci di sconvolgere il ritmo della serata."
  },
  creativita: {
    title: "🎨 Creatività & Performance",
    desc: "Inventiva pura: rime estemporanee, creazioni fisiche con oggetti del locale, cocktail signature improvvisati e mini show spontanei."
  },
  osservazione: {
    title: "🔍 Osservazione & Stealth",
    desc: "Missioni silenziose per chi sa guardarsi intorno: contare tic verbali, anticipare mosse altrui, rubare sguardi o nascondere indizi."
  },
  deduzione: {
    title: "🧠 Deduzione & Psicologia",
    desc: "Indovinare segreti, gusti musicali, drink preferiti o retroscena degli amici attraverso domande indirette e intuito puro."
  },
  jeffrey_island: {
    title: "🌴 Jeffrey Island Party (18+ / Alcol, Flirt & Sfide Frizzanti)",
    desc: "La modalità più audace e scatenata per feste adulte: shot di gruppo, aneddoti scottanti, sfide di seduzione, sguardi provocanti e missioni con target Uomo ♂ / Donna ♀ / Neutro 👥."
  }
};

const difficultyLabels = {
  facile: "FACILE",
  media: "MEDIA",
  difficile: "DIFFICILE",
  leggendaria: "LEGGENDARIA"
};

const verificationLabels = {
  peer_target: "Bersaglio (la persona coinvolta conferma)",
  peer_witness: "Testimone (un compagno conferma)",
  group_vote: "Voto di gruppo"
};

const modeIcons = {
  bar: "🍸 Bar",
  house_party: "🏠 Festa a Casa",
  cena: "🍽️ Cena",
  club: "🪩 Discoteca",
  outdoor: "🌙 All'aperto",
  jeffrey_island: "🔥 Jeffrey Island"
};

const genderLabels = {
  uomo: "Uomo ♂",
  donna: "Donna ♀",
  neutro: "Neutro / Tutti 👥"
};

// Group by category
const grouped = {};
Object.keys(categoryMeta).forEach(cat => {
  grouped[cat] = [];
});

missions.forEach(m => {
  if (!grouped[m.category]) {
    grouped[m.category] = [];
  }
  grouped[m.category].push(m);
});

// Build markdown
let md = `# 🍸 AFTER DARK — Catalogo Ufficiale delle Missioni (${missions.length} Task)\n\n`;
md += `> Catalogo completo delle missioni segrete di **AFTER DARK**, organizzato per le **${Object.keys(categoryMeta).length} Categorie Tematiche** ufficiali del gioco.\n`;
md += `> Include la nuova modalità e categoria **Jeffrey Island Party 🔥** (36 task alcoliche, divertenti e con missioni dedicate Uomo / Donna / Neutro).\n`;
md += `> Ogni task include dettagli operativi: livello di difficoltà, target genere, punteggio base, tempo stimato, modalità adatte e condizioni speciali.\n\n`;

md += `### 📊 Riepilogo delle Categorie\n\n`;
md += `| Categoria | N° Missioni | Target Genere | Focus di Gioco |\n`;
md += `| :--- | :---: | :---: | :--- |\n`;

Object.entries(categoryMeta).forEach(([catKey, meta]) => {
  const count = grouped[catKey] ? grouped[catKey].length : 0;
  const genderNote = catKey === 'jeffrey_island' ? 'Uomo (6) / Donna (6) / Neutro (24)' : 'Neutro / Tutti';
  const shortDesc = meta.desc.length > 80 ? meta.desc.substring(0, 80) + '...' : meta.desc;
  md += `| ${meta.title.split(' (')[0]} | **${count}** | ${genderNote} | ${shortDesc} |\n`;
});
md += `| **TOTALE MISSIONI** | **${missions.length}** | **Tutti i profili** | *Esperienza completa per ogni tipo di serata* |\n\n`;
md += `---\n\n`;

// Detail per category
Object.entries(categoryMeta).forEach(([catKey, meta]) => {
  const list = grouped[catKey] || [];
  md += `## ${meta.title} (${list.length} Missioni)\n`;
  md += `*${meta.desc}*\n\n`;

  list.forEach((m, idx) => {
    const diff = difficultyLabels[m.difficulty] || m.difficulty.toUpperCase();
    const verif = verificationLabels[m.verification_type] || m.verification_type;
    const modes = (m.compatible_modes || []).map(k => modeIcons[k] || k).join(", ");
    const dur = m.estimated_duration_minutes ? `~${m.estimated_duration_minutes} min` : "Variabile";
    const genTag = m.gender_target && m.gender_target !== 'neutro' ? ` | **Target Genere**: \`${genderLabels[m.gender_target]}\`` : "";

    md += `### ${idx + 1}. ${m.title} \`[ID: ${m.id}]\`\n`;
    md += `- **Obiettivo**: ${m.description}\n`;
    md += `- **Difficoltà**: \`${diff}\` | **Punti Base**: \`+${m.base_points} PT\` | **Durata stimata**: ${dur}${genTag}\n`;
    md += `- **Verifica**: ${verif}\n`;
    md += `- **Atmosfere compatibili**: ${modes}\n`;
    if (m.special_conditions && m.special_conditions.length > 0) {
      md += `- **Condizioni speciali**: ${m.special_conditions.join(" | ")}\n`;
    }
    md += `\n`;
  });

  md += `---\n\n`;
});

const baseDir = path.join(__dirname, "..");
const parentDir = path.join(baseDir, "..");
const brainDir = "/Users/pastorenegresco/.gemini/antigravity/brain/1c5221f4-4a1a-4740-b03a-371a26249f4e";

fs.writeFileSync(path.join(baseDir, "catalogo_missioni_after_dark.md"), md, "utf8");
fs.writeFileSync(path.join(parentDir, "catalogo_missioni_after_dark.md"), md, "utf8");
if (fs.existsSync(brainDir)) {
  fs.writeFileSync(path.join(brainDir, "catalogo_missioni_after_dark.md"), md, "utf8");
}

console.log("Successfully generated markdown catalog with", missions.length, "missions!");
