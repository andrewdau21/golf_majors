// Prebuild script — runs automatically before `npm run build`.
// On Netlify: reads the ENTRIES_DATA env var (base64 JSON) and writes src/data/entries.js.
// Locally: entries.js should already exist from running csv-to-entries.js.

import { writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const entriesPath = resolve(__dirname, "../src/data/entries.js");

if (existsSync(entriesPath)) {
  console.log("src/data/entries.js already exists, skipping generation.");
  process.exit(0);
}

const encoded = process.env.ENTRIES_DATA;
if (!encoded) {
  console.error("ERROR: src/data/entries.js is missing and ENTRIES_DATA env var is not set.");
  console.error("Run `node scripts/csv-to-entries.js` locally, or set ENTRIES_DATA in Netlify.");
  process.exit(1);
}

const entries = JSON.parse(Buffer.from(encoded, "base64").toString("utf8"));
const output = `// Auto-generated at build time from ENTRIES_DATA env var — do not edit
export const ENTRIES = ${JSON.stringify(entries, null, 2)};
`;

writeFileSync(entriesPath, output);
console.log(`Wrote src/data/entries.js (${entries.length} entries).`);
