// Prebuild script — runs automatically before `npm run build`.
// Decrypts data/entries.enc using DB_KEY env var and writes src/data/entries.js.

import { createDecipheriv, scryptSync } from "crypto";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const entriesJs  = resolve(root, "src/data/entries.js");
const entriesEnc = resolve(root, "data/entries.enc");

// For local builds, entries.js may already exist from encrypt-entries.js
if (existsSync(entriesJs)) {
  console.log("src/data/entries.js already exists, skipping decryption.");
  process.exit(0);
}

// Load DB_KEY from .env.local if not already in environment
if (!process.env.DB_KEY && existsSync(resolve(root, ".env.local"))) {
  for (const line of readFileSync(resolve(root, ".env.local"), "utf8").split("\n")) {
    const m = line.match(/^DB_KEY=(.+)$/);
    if (m) { process.env.DB_KEY = m[1].trim(); break; }
  }
}

if (!process.env.DB_KEY) {
  console.error("ERROR: DB_KEY env var is not set.");
  console.error("Add it to Netlify environment variables (Site config → Environment variables).");
  process.exit(1);
}

if (!existsSync(entriesEnc)) {
  console.error("ERROR: data/entries.enc not found.");
  console.error("Run node scripts/encrypt-entries.js locally and commit data/entries.enc.");
  process.exit(1);
}

const blob = JSON.parse(readFileSync(entriesEnc, "utf8"));

if (blob.v !== 1) {
  console.error(`ERROR: Unknown entries.enc version: ${blob.v}`);
  process.exit(1);
}

const salt      = Buffer.from(blob.salt, "hex");
const iv        = Buffer.from(blob.iv,   "hex");
const tag       = Buffer.from(blob.tag,  "hex");
const encrypted = Buffer.from(blob.data, "hex");

let entries;
try {
  const key = scryptSync(process.env.DB_KEY, salt, 32);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  entries = JSON.parse(decrypted.toString("utf8"));
} catch {
  console.error("ERROR: Decryption failed — wrong DB_KEY or corrupted entries.enc.");
  process.exit(1);
}

const js = `// Auto-generated at build time — do not edit.\nexport const ENTRIES = ${JSON.stringify(entries, null, 2)};\n`;
writeFileSync(entriesJs, js);
console.log(`Wrote src/data/entries.js (${entries.length} entries).`);
