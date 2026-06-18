// Run with: node scripts/csv-to-entries.js
// Reads data/USOpen.csv and writes src/data/entries.js

import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

// Names in the CSV that don't match the ESPN API spelling
const NAME_MAP = {
  "Ludvig Aberg": "Ludvig Åberg",
  "Nicolai Hojgaard": "Nicolai Højgaard",
  "Alexander Noren": "Alex Noren",
  "Joaquin Niemann": "Joaquín Niemann",
  "Matthias Schmid": "Matti Schmid",
  "Benjamin James": "Ben James",
};

function normalize(name) {
  const trimmed = name.trim();
  return NAME_MAP[trimmed] ?? trimmed;
}

const csvPath = resolve(root, "data/USOpen.csv");
if (!existsSync(csvPath)) {
  console.error("ERROR: data/USOpen.csv not found.");
  console.error("Copy your real picks CSV to data/USOpen.csv (it is gitignored) then re-run.");
  console.error("See data/USOpen.sample.csv for the expected format.");
  process.exit(1);
}
const csv = readFileSync(csvPath, "utf8");
const lines = csv.split("\n").filter((l) => l.trim());

// Skip header row
const entries = lines.slice(1).map((line, i) => {
  // CSV parser that handles quoted fields with commas
  const fields = [];
  let current = "";
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') { inQuotes = !inQuotes; continue; }
    if (ch === "," && !inQuotes) { fields.push(current.trim()); current = ""; continue; }
    current += ch;
  }
  fields.push(current.trim());

  const [playerName, ...picks] = fields;
  return {
    id: i + 1,
    name: playerName,
    picks: picks.map(normalize),
  };
});

// Warn about any entries that don't have exactly 6 picks
entries.forEach((e) => {
  if (e.picks.length !== 6) {
    console.warn(`WARNING: "${e.name}" has ${e.picks.length} picks (expected 6)`);
  }
});

console.log(`Parsed ${entries.length} entries.`);

const output = `// Auto-generated from data/USOpen.csv — do not edit manually
// Run: node scripts/csv-to-entries.js

export const ENTRIES = ${JSON.stringify(entries, null, 2)};
`;

writeFileSync(resolve(root, "src/data/entries.js"), output);
console.log("Wrote src/data/entries.js");

const base64 = Buffer.from(JSON.stringify(entries)).toString("base64");
console.log("\n--- Netlify ENTRIES_DATA env var ---");
console.log(base64);
console.log("------------------------------------");
console.log("Paste the value above into Netlify: Site config → Environment variables → ENTRIES_DATA");
