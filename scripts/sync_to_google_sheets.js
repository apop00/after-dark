const fs = require("fs");
const path = require("path");

const WEBHOOK_URL = process.env.GOOGLE_SHEETS_WEBHOOK_URL || "https://script.google.com/macros/s/AKfycbzio48I-SDEBvtn2GvHV4DYNOxdZjJvcutjyIMU7PNvmtE_wfKNPvN0sC8QGC0KoHel/exec";

// Load missions
let raw = fs.readFileSync(path.join(__dirname, "../src/data/missions.ts"), "utf8");
raw = raw.replace(/^import\s+.*?;/m, "").replace("export const MISSIONS_DATABASE: Mission[] =", "const MISSIONS_DATABASE =") + "; module.exports = MISSIONS_DATABASE;";
const missions = eval(raw);

const categoryLabels = {
  socializzazione: "Socializzazione & Interazione",
  persuasione: "Persuasione & Influenza",
  bluff: "Bluff & Identità",
  collaborazione: "Collaborazione (Coop)",
  chaos: "Chaos & Imprevisti",
  creativita: "Creatività & Performance",
  osservazione: "Osservazione & Stealth",
  deduzione: "Deduzione & Psicologia",
  jeffrey_island: "Jeffrey Island Party 🔥"
};

const genderLabels = {
  uomo: "Uomo ♂",
  donna: "Donna ♀",
  neutro: "Neutro / Tutti 👥"
};

const difficultyLabels = {
  facile: "Facile",
  media: "Media",
  difficile: "Difficile",
  leggendaria: "Leggendaria"
};

const verificationLabels = {
  peer_target: "Bersaglio (Peer Target)",
  peer_witness: "Testimone (Peer Witness)",
  group_vote: "Voto di Gruppo"
};

const modeLabels = {
  bar: "Bar",
  house_party: "House Party",
  cena: "Cena",
  club: "Club / Disco",
  outdoor: "Outdoor",
  jeffrey_island: "Jeffrey Island"
};

const headers = [
  "N°",
  "ID Missione",
  "Categoria",
  "Target Genere",
  "Titolo",
  "Descrizione",
  "Difficoltà",
  "Punti Base",
  "Durata (min)",
  "Modalità Compatibili",
  "Partecipanti Target",
  "Tipo di Verifica",
  "Condizioni Speciali",
  "Missione Segreta"
];

const rows = [headers];

missions.forEach((m, idx) => {
  rows.push([
    idx + 1,
    m.id,
    categoryLabels[m.category] || m.category,
    genderLabels[m.gender_target] || "Neutro / Tutti 👥",
    m.title,
    m.description,
    difficultyLabels[m.difficulty] || m.difficulty,
    m.base_points,
    m.estimated_duration_minutes || "N/A",
    (m.compatible_modes || []).map(k => modeLabels[k] || k).join(", "),
    m.target_participants || 1,
    verificationLabels[m.verification_type] || m.verification_type,
    (m.special_conditions || []).join(" | ") || "Nessuna",
    m.is_secret ? "Sì" : "No"
  ]);
});

console.log(`Prepared ${rows.length - 1} missions for Google Sheets sync.`);
console.log(`Connecting to: ${WEBHOOK_URL}...`);

async function sync() {
  try {
    const res = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify(rows),
      redirect: "follow"
    });

    const text = await res.text();
    console.log(`Response status: ${res.status}`);
    console.log(`Response body: ${text}`);

    if (res.ok || text.includes("OK")) {
      console.log("✅ Google Sheets successfully updated in real-time!");
    } else {
      console.warn("⚠️ Response received but unexpected content:", text);
    }
  } catch (err) {
    console.error("❌ Error syncing to Google Sheets:", err);
    process.exit(1);
  }
}

sync();
