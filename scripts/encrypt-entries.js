// Reads data/USOpen.csv, encrypts entries with AES-256-GCM, saves data/entries.enc.
// Also writes src/data/entries.js for local dev.
//
// Usage:
//   1. Add DB_KEY=yourpassword to .env.local (gitignored)
//   2. node scripts/encrypt-entries.js
//   3. Commit data/entries.enc
//   4. Add DB_KEY to Netlify env vars

import { createCipheriv, randomBytes, scryptSync } from "crypto";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

// Load DB_KEY from .env.local if not already in environment
if (!process.env.DB_KEY && existsSync(resolve(root, ".env.local"))) {
  for (const line of readFileSync(resolve(root, ".env.local"), "utf8").split("\n")) {
    const m = line.match(/^DB_KEY=(.+)$/);
    if (m) { process.env.DB_KEY = m[1].trim(); break; }
  }
}

if (!process.env.DB_KEY) {
  console.error("ERROR: DB_KEY is not set.");
  console.error("Add DB_KEY=yourpassword to .env.local then re-run.");
  process.exit(1);
}

// --- CSV parser ---
const NAME_MAP = {
  "Ludvig Aberg": "Ludvig Åberg",
  "Nicolai Hojgaard": "Nicolai Højgaard",
  "Alexander Noren": "Alex Noren",
  "Joaquin Niemann": "Joaquín Niemann",
  "Matthias Schmid": "Matti Schmid",
  "Benjamin James": "Ben James",
};

function normalize(name) {
  const t = name.trim();
  return NAME_MAP[t] ?? t;
}

const csvPath = resolve(root, "data/USOpen.csv");
if (!existsSync(csvPath)) {
  console.error("ERROR: data/USOpen.csv not found. See data/USOpen.sample.csv for format.");
  process.exit(1);
}

const lines = readFileSync(csvPath, "utf8").split("\n").filter((l) => l.trim());
const entries = lines.slice(1).map((line, i) => {
  const fields = [];
  let cur = "", inQ = false;
  for (const ch of line) {
    if (ch === '"') { inQ = !inQ; continue; }
    if (ch === "," && !inQ) { fields.push(cur.trim()); cur = ""; continue; }
    cur += ch;
  }
  fields.push(cur.trim());
  const [name, ...picks] = fields;
  return { id: i + 1, name, picks: picks.map(normalize) };
});

entries.forEach((e) => {
  if (e.picks.length !== 6)
    console.warn(`WARNING: "${e.name}" has ${e.picks.length} picks (expected 6)`);
});
console.log(`Parsed ${entries.length} entries.`);

// --- Encrypt ---
const plaintext = JSON.stringify(entries);
const salt = randomBytes(32);
const iv   = randomBytes(12);
const key  = scryptSync(process.env.DB_KEY, salt, 32);

const cipher = createCipheriv("aes-256-gcm", key, iv);
const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
const tag = cipher.getAuthTag();

const blob = {
  v: 1,
  salt: salt.toString("hex"),
  iv:   iv.toString("hex"),
  tag:  tag.toString("hex"),
  data: encrypted.toString("hex"),
};

writeFileSync(resolve(root, "data/entries.enc"), JSON.stringify(blob));
console.log("Wrote data/entries.enc (commit this file).");

// Also write entries.js for immediate local dev use
const js = `// Auto-generated — do not edit. Run: node scripts/encrypt-entries.js\nexport const ENTRIES = ${JSON.stringify(entries, null, 2)};\n`;
writeFileSync(resolve(root, "src/data/entries.js"), js);
console.log("Wrote src/data/entries.js (gitignored, local dev only).");
