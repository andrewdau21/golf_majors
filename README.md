# Golf Majors Pool 2026

Live scoring app for the Golf Majors pick 'em pool. Pulls real-time leaderboard data from the ESPN API and calculates each entry's pool score automatically.

## How the pool works

- Each entry picks **1 golfer from each of 6 tiers** (best odds → longest shots)
- Score = sum of your **best 4 players'** scores (lower = better, like golf)
- At least **4 of 6 picks must make the cut** or the entry is eliminated
- Tiebreaker 1: most players surviving the cut
- Tiebreaker 2: lowest combined score of all remaining (non-top-4) players

## Features

- Live leaderboard pulling from ESPN's API, auto-refreshing every 60 seconds
- Pool leaderboard with rank, score, and expandable pick details
- Per-pick: tier badge, ESPN headshot, round + hole status, score
- Star any entry to pin it to the top
- Search/filter by name across all 95 entries
- Golf leaderboard tab showing the full field (pool picks highlighted)
- Dark mode by default

## Tech stack

- [Vite](https://vite.dev) + React
- ESPN hidden API (`site.api.espn.com`) for live scoring
- AES-256-GCM encrypted entry data (see below)
- Deployed on Netlify (free tier, static build)

## Local development

```bash
npm install
npm run dev
```

`src/data/entries.js` must exist before running. If it doesn't, decrypt it from the committed blob:

```bash
# Add DB_KEY=yourpassword to .env.local first
npm run build   # prebuild step decrypts data/entries.enc → src/data/entries.js
```

Or regenerate from the source CSV (see below).

## Entry data

Pool entries are stored as an AES-256-GCM encrypted blob at `data/entries.enc`. The blob is safe to commit — it's unreadable without the key.

### Updating entries (new major or corrections)

1. Place the picks CSV at `data/USOpen.csv` (gitignored — never committed)
2. Set your password: add `DB_KEY=yourpassword` to `.env.local`
3. Encrypt and generate:
   ```bash
   npm run encrypt
   ```
4. Commit only `data/entries.enc`
5. Push — Netlify redeploys automatically

### CSV format

See `data/USOpen.sample.csv` for the expected format:

```
Player Name,Group 1,Group 2,Group 3,Group 4,Group 5,Group 6
Smith,Scottie Scheffler,Russell Henley,Viktor Hovland,...
```

### Name normalization

If a player's name in the CSV doesn't exactly match ESPN's spelling (accents, abbreviations), add a mapping to the `NAME_MAP` object in `scripts/encrypt-entries.js`.

## Deployment (Netlify)

The app is deployed via GitHub → Netlify. Every push to `master` triggers a redeploy.

**Required environment variable in Netlify:**

| Variable | Value |
|----------|-------|
| `DB_KEY` | The password used to encrypt `data/entries.enc` |

Set it at: **Netlify → Site configuration → Environment variables**

The `prebuild` script (`scripts/build-entries.js`) decrypts the blob at build time and writes `src/data/entries.js`, which Vite then bundles. Neither the CSV nor the generated JS is ever committed to the repo.

## Scripts

| Command | What it does |
|---------|-------------|
| `npm run dev` | Start local dev server |
| `npm run encrypt` | CSV → encrypt → `data/entries.enc` + `src/data/entries.js` |
| `npm run build` | Decrypt entries + Vite production build |
| `npm run preview` | Preview the production build locally |
