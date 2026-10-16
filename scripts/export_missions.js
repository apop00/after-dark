const fs = require("fs");
const path = require("path");

// Load missions
let raw = fs.readFileSync(path.join(__dirname, "../src/data/missions.ts"), "utf8");
raw = raw.replace(/^import\s+.*?;/m, "").replace("export const MISSIONS_DATABASE: Mission[] =", "const MISSIONS_DATABASE =") + "; module.exports = MISSIONS_DATABASE;";
const missions = eval(raw);

const categoryLabels = {
  persuasione: "Persuasione",
  bluff: "Bluff",
  creativita: "Creatività",
  osservazione: "Osservazione",
  socializzazione: "Socializzazione",
  deduzione: "Deduzione",
  collaborazione: "Collaborazione",
  chaos: "Chaos",
  jeffrey_island: "Jeffrey Island 🌴"
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
  group_vote: "Voto di Gruppo (Group Vote)"
};

const modeLabels = {
  bar: "Bar",
  house_party: "House Party",
  cena: "Cena",
  club: "Club",
  outdoor: "All'aperto / Outdoor",
  jeffrey_island: "Jeffrey Island Party 🔥"
};

function escapeCSV(val, delimiter = ",") {
  if (val === null || val === undefined) return "";
  let str = String(val);
  if (str.includes(delimiter) || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    str = '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function generateCSV(delimiter = ",") {
  const headers = [
    "N°",
    "ID",
    "Categoria",
    "Target Genere",
    "Titolo",
    "Descrizione",
    "Difficoltà",
    "Punti Base",
    "Durata Stimata (min)",
    "Modalità Compatibili",
    "Partecipanti Bersaglio",
    "Tipo di Verifica",
    "Condizioni Speciali",
    "Missione Segreta"
  ];

  const rows = [headers.map(h => escapeCSV(h, delimiter)).join(delimiter)];

  missions.forEach((m, idx) => {
    const targetGen = genderLabels[m.gender_target] || "Neutro / Tutti 👥";
    const row = [
      idx + 1,
      m.id,
      categoryLabels[m.category] || m.category,
      targetGen,
      m.title,
      m.description,
      difficultyLabels[m.difficulty] || m.difficulty,
      m.base_points,
      m.estimated_duration_minutes || "N/A",
      (m.compatible_modes || []).map(k => modeLabels[k] || k).join(", "),
      m.target_participants || 1,
      verificationLabels[m.verification_type] || m.verification_type,
      (m.special_conditions || []).join(" | "),
      m.is_secret ? "Sì" : "No"
    ];
    rows.push(row.map(val => escapeCSV(val, delimiter)).join(delimiter));
  });

  // UTF-8 BOM + rows joined by CRLF
  return "\uFEFF" + rows.join("\r\n");
}

function generateHTML() {
  const categoryColors = {
    persuasione: { bg: "#fef3c7", text: "#92400e", border: "#fde68a" },
    bluff: { bg: "#fce7f3", text: "#9d174d", border: "#fbcfe8" },
    creativita: { bg: "#ede9fe", text: "#5b21b6", border: "#ddd6fe" },
    osservazione: { bg: "#e0f2fe", text: "#075985", border: "#bae6fd" },
    socializzazione: { bg: "#dcfce7", text: "#166534", border: "#bbf7d0" },
    deduzione: { bg: "#e0e7ff", text: "#3730a3", border: "#c7d2fe" },
    collaborazione: { bg: "#ccfbf1", text: "#115e59", border: "#99f6e4" },
    chaos: { bg: "#fee2e2", text: "#991b1b", border: "#fecaca" },
    jeffrey_island: { bg: "#fdf4ff", text: "#c026d3", border: "#f0abfc" }
  };

  const difficultyColors = {
    facile: "#10b981",
    media: "#f59e0b",
    difficile: "#ef4444",
    leggendaria: "#a855f7"
  };

  const genderBadges = {
    uomo: { label: "Uomo ♂", bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe" },
    donna: { label: "Donna ♀", bg: "#fdf2f8", text: "#be185d", border: "#fbcfe8" },
    neutro: { label: "Tutti 👥", bg: "#f1f5f9", text: "#475569", border: "#cbd5e1" }
  };

  const rowsHtml = missions.map((m, idx) => {
    const catCol = categoryColors[m.category] || { bg: "#f3f4f6", text: "#1f2937", border: "#e5e7eb" };
    const diffCol = difficultyColors[m.difficulty] || "#6b7280";
    const genBadge = genderBadges[m.gender_target] || genderBadges.neutro;
    const modes = (m.compatible_modes || []).map(k => modeLabels[k] || k).join(", ");
    const conds = (m.special_conditions && m.special_conditions.length > 0)
      ? m.special_conditions.map(c => `• ${c}`).join("<br>")
      : "<span style='color:#9ca3af;'>Nessuna</span>";

    return `
      <tr>
        <td style="text-align: center; font-weight: bold; color: #6b7280;">${idx + 1}</td>
        <td><code>${m.id}</code></td>
        <td>
          <span style="display:inline-block; padding: 3px 8px; border-radius: 9999px; font-size: 11px; font-weight: 700; background: ${catCol.bg}; color: ${catCol.text}; border: 1px solid ${catCol.border};">
            ${categoryLabels[m.category] || m.category}
          </span>
        </td>
        <td style="text-align: center;">
          <span style="display:inline-block; padding: 2px 7px; border-radius: 6px; font-size: 11px; font-weight: 700; background: ${genBadge.bg}; color: ${genBadge.text}; border: 1px solid ${genBadge.border};">
            ${genBadge.label}
          </span>
        </td>
        <td style="font-weight: 700; color: #111827;">${m.title}</td>
        <td style="color: #374151; font-size: 13px; line-height: 1.45;">${m.description}</td>
        <td style="text-align: center;">
          <span style="display:inline-block; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; color: #fff; background: ${diffCol};">
            ${difficultyLabels[m.difficulty] || m.difficulty}
          </span>
        </td>
        <td style="text-align: right; font-weight: 700; color: #0284c7;">+${m.base_points}</td>
        <td style="text-align: center; color: #4b5563;">${m.estimated_duration_minutes ? m.estimated_duration_minutes + " min" : "N/A"}</td>
        <td style="font-size: 12px; color: #4b5563;">${modes}</td>
        <td style="font-size: 12px; color: #374151;">${verificationLabels[m.verification_type] || m.verification_type}</td>
        <td style="font-size: 12px; color: #6b7280;">${conds}</td>
      </tr>
    `;
  }).join("\n");

  return `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <title>AFTER DARK - Catalogo Completo Missioni (125 Task)</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 24px;
      background: #f8fafc;
      color: #0f172a;
    }
    .header {
      background: #09090b;
      color: white;
      padding: 24px 32px;
      border-radius: 16px;
      margin-bottom: 24px;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.2);
    }
    .header h1 {
      margin: 0 0 8px 0;
      font-size: 26px;
      letter-spacing: -0.5px;
    }
    .header p {
      margin: 0;
      color: #a1a1aa;
      font-size: 14px;
    }
    .stats-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 16px;
    }
    .stat-pill {
      background: rgba(255,255,255,0.1);
      padding: 6px 14px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
    }
    .actions {
      display: flex;
      gap: 12px;
      margin-bottom: 20px;
    }
    .btn {
      background: #2563eb;
      color: white;
      border: none;
      padding: 10px 18px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 13px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: background 0.15s ease;
      text-decoration: none;
    }
    .btn:hover {
      background: #1d4ed8;
    }
    .btn-secondary {
      background: #ffffff;
      color: #374151;
      border: 1px solid #d1d5db;
    }
    .btn-secondary:hover {
      background: #f3f4f6;
    }
    .table-container {
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05);
      border: 1px solid #e2e8f0;
      overflow-x: auto;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      text-align: left;
    }
    th {
      background: #f1f5f9;
      color: #334155;
      font-weight: 700;
      padding: 12px 14px;
      border-bottom: 2px solid #cbd5e1;
      position: sticky;
      top: 0;
      white-space: nowrap;
    }
    td {
      padding: 12px 14px;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: top;
    }
    tr:hover {
      background: #f8fafc;
    }
    code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 11px;
      background: #f1f5f9;
      padding: 2px 6px;
      border-radius: 4px;
      color: #475569;
    }
  </style>
</head>
<body>

  <div class="header">
    <h1>AFTER DARK • Database Completo Missioni</h1>
    <p>Tutte le ${missions.length} missioni pronte per essere importate in Google Fogli (Google Sheets), Microsoft Excel o Google Documenti.</p>
    <div class="stats-bar">
      <div class="stat-pill">Totale Missioni: ${missions.length}</div>
      <div class="stat-pill">9 Categorie (incl. Jeffrey Island 🌴)</div>
      <div class="stat-pill">Genere: Neutro / Uomo ♂ / Donna ♀</div>
      <div class="stat-pill">Formati: CSV (Google Fogli) &bull; CSV Excel &bull; Tabella HTML</div>
    </div>
  </div>

  <div class="actions">
    <button class="btn" onclick="copyTableForGoogleDocs()">
      📋 Copia Tabella per Google Fogli / Docs
    </button>
    <a href="after_dark_missioni.csv" download class="btn btn-secondary">
      ⬇ Scarica CSV (Google Sheets standard)
    </a>
    <a href="after_dark_missioni_excel.csv" download class="btn btn-secondary">
      ⬇ Scarica CSV (Excel con punto e virgola)
    </a>
  </div>

  <div id="copyNotice" style="display:none; padding:10px 16px; margin-bottom:16px; background:#dcfce7; color:#166534; border:1px solid #86efac; border-radius:8px; font-weight:600; font-size:13px;">
    Copiato negli appunti! Ora apri un nuovo file su Google Fogli (o Google Docs) e premi Incolla (Cmd+V o Ctrl+V).
  </div>

  <div class="table-container">
    <table id="missionsTable">
      <thead>
        <tr>
          <th style="width: 40px; text-align: center;">N°</th>
          <th style="width: 80px;">ID</th>
          <th style="width: 130px;">Categoria</th>
          <th style="width: 90px; text-align: center;">Genere</th>
          <th style="width: 180px;">Titolo</th>
          <th style="min-width: 320px;">Descrizione</th>
          <th style="width: 90px; text-align: center;">Difficoltà</th>
          <th style="width: 70px; text-align: right;">Punti</th>
          <th style="width: 70px; text-align: center;">Durata</th>
          <th style="width: 150px;">Modalità</th>
          <th style="width: 150px;">Tipo Verifica</th>
          <th style="width: 200px;">Condizioni Speciali</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
  </div>

  <script>
    function copyTableForGoogleDocs() {
      const table = document.getElementById("missionsTable");
      const range = document.createRange();
      range.selectNode(table);
      window.getSelection().removeAllRanges();
      window.getSelection().addRange(range);
      try {
        document.execCommand("copy");
        const notice = document.getElementById("copyNotice");
        notice.style.display = "block";
        setTimeout(() => { notice.style.display = "none"; }, 5000);
      } catch (err) {
        alert("Premi Cmd+A poi Cmd+C per copiare la tabella, quindi incolla su Google Docs / Fogli.");
      }
      window.getSelection().removeAllRanges();
    }
  </script>
</body>
</html>
`;
}

// Generate files
const csvStandard = generateCSV(",");
const csvExcel = generateCSV(";");
const htmlTable = generateHTML();

const baseDir = path.join(__dirname, "..");
const parentDir = path.join(baseDir, "..");
const brainDir = "/Users/pastorenegresco/.gemini/antigravity/brain/1c5221f4-4a1a-4740-b03a-371a26249f4e";

// 1. In project after-dark
fs.writeFileSync(path.join(baseDir, "after_dark_missioni.csv"), csvStandard, "utf8");
fs.writeFileSync(path.join(baseDir, "after_dark_missioni_excel.csv"), csvExcel, "utf8");
fs.writeFileSync(path.join(baseDir, "after_dark_tabella_missioni.html"), htmlTable, "utf8");

// 2. In parent workspace Progettini
fs.writeFileSync(path.join(parentDir, "after_dark_missioni.csv"), csvStandard, "utf8");
fs.writeFileSync(path.join(parentDir, "after_dark_tabella_missioni.html"), htmlTable, "utf8");

// 3. In artifacts directory
if (fs.existsSync(brainDir)) {
  fs.writeFileSync(path.join(brainDir, "after_dark_missioni.csv"), csvStandard, "utf8");
  fs.writeFileSync(path.join(brainDir, "after_dark_tabella_missioni.html"), htmlTable, "utf8");
}

console.log("Successfully generated all files!");
