import { useState, useMemo } from "react";
import { formatScore } from "../data/scoring";

const STARRED_KEY = "golf_pool_starred";

function loadStarred() {
  try {
    return new Set(JSON.parse(localStorage.getItem(STARRED_KEY) || "[]"));
  } catch {
    return new Set();
  }
}

function saveStarred(set) {
  localStorage.setItem(STARRED_KEY, JSON.stringify([...set]));
}

function RankBadge({ rank }) {
  if (rank === null) return <span className="rank missed">MC</span>;
  if (rank === 1) return <span className="rank gold">{rank}</span>;
  if (rank === 2) return <span className="rank silver">{rank}</span>;
  if (rank === 3) return <span className="rank bronze">{rank}</span>;
  return <span className="rank">{rank}</span>;
}

function TierBadge({ tier }) {
  return <span className={`tier-badge tier-${tier}`}>T{tier}</span>;
}

function RoundStatus({ pick }) {
  if (pick.notStarted) return null;
  const { statusName, statusState, thru, round, teeTime } = pick;

  if (statusName === "STATUS_CUT" || statusName === "STATUS_WD" || statusName === "STATUS_DQ") {
    return null; // already shown via cut-label
  }
  if (statusState === "pre") {
    if (!teeTime) return null;
    const t = new Date(teeTime);
    const time = t.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    return <span className="pick-round">R1 · {time}</span>;
  }
  const holesDisplay = thru === 0 ? "F*" : thru === 18 ? "F" : `Thru ${thru}`;
  return <span className="pick-round">R{round} · {holesDisplay}</span>;
}

function PickRow({ pick, best4Players }) {
  const isBest = best4Players?.includes(pick.name);
  const classes = ["pick-row", isBest ? "best" : "", pick.isCut ? "cut" : ""].filter(Boolean).join(" ");
  const showScore = pick.madeCut || (!pick.isCut && !pick.notStarted);

  return (
    <div className={classes}>
      <div className="pick-headshot">
        {pick.headshot
          ? <img src={pick.headshot} alt={pick.name} loading="lazy" />
          : <span className="pick-headshot-placeholder">{pick.name.charAt(0)}</span>
        }
      </div>
      <div className="pick-info">
        <div className="pick-top-row">
          <TierBadge tier={pick.tier} />
          <span className="pick-name">{pick.name}</span>
        </div>
        <RoundStatus pick={pick} />
      </div>
      <div className="pick-right">
        <span className="pick-score">{formatScore(showScore ? pick.scoreToPar : null)}</span>
        {pick.isCut && <span className="cut-label">CUT</span>}
      </div>
    </div>
  );
}

function EntryRow({ entry, expanded, starred, onToggle, onStar }) {
  return (
    <div className={[
      "entry-card",
      entry.missedCut ? "entry-missed" : "",
      starred ? "entry-starred" : "",
    ].filter(Boolean).join(" ")}>
      <div className="entry-header-wrap">
        <button
          className={`star-btn ${starred ? "starred" : ""}`}
          onClick={(e) => { e.stopPropagation(); onStar(); }}
          title={starred ? "Unstar" : "Star this entry"}
          aria-label={starred ? "Unstar" : "Star"}
        >
          {starred ? "★" : "☆"}
        </button>
        <button className="entry-header" onClick={onToggle}>
          <RankBadge rank={entry.rank} />
          <span className="entry-name">{entry.name}</span>
          <span className="entry-score">
            {entry.missedCut ? "MC" : formatScore(entry.totalScore)}
          </span>
          <span className="entry-chevron">{expanded ? "▲" : "▼"}</span>
        </button>
      </div>

      {expanded && (
        <div className="entry-body">
          <div className="picks-grid">
            {entry.picks.map((pick) => (
              <PickRow key={pick.name} pick={pick} best4Players={entry.best4Players} />
            ))}
          </div>
          {!entry.missedCut && (
            <div className="entry-meta">
              <span>Best 4: {formatScore(entry.best4Score)}</span>
              <span>Players thru cut: {entry.cutPlayers}/6</span>
            </div>
          )}
          {entry.missedCut && (
            <div className="entry-meta missed">
              Only {entry.cutPlayers}/6 players made the cut — entry eliminated
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function PoolLeaderboard({ rankedEntries }) {
  const [expandedId, setExpandedId] = useState(null);
  const [starred, setStarred] = useState(loadStarred);
  const [query, setQuery] = useState("");

  const toggle = (id) => setExpandedId((prev) => (prev === id ? null : id));

  const toggleStar = (id) => {
    setStarred((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      saveStarred(next);
      return next;
    });
  };

  const sorted = useMemo(() => {
    const pinned = rankedEntries.filter((e) => starred.has(e.id));
    const rest = rankedEntries.filter((e) => !starred.has(e.id));
    return [...pinned, ...rest];
  }, [rankedEntries, starred]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter((e) => e.name.toLowerCase().includes(q));
  }, [sorted, query]);

  const isSearching = query.trim().length > 0;
  const hasStarred = !isSearching && starred.size > 0;

  return (
    <div className="pool-leaderboard">
      <div className="search-bar">
        <span className="search-icon">⌕</span>
        <input
          type="text"
          placeholder="Search entries…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="search-input"
        />
        {isSearching && (
          <button className="search-clear" onClick={() => setQuery("")} aria-label="Clear">✕</button>
        )}
      </div>

      {filtered.length === 0 && (
        <div className="search-empty">No entries match "{query}"</div>
      )}

      <div className="pool-header-row">
        <span style={{ width: 32 }}></span>
        <span style={{ width: 40 }}>#</span>
        <span style={{ flex: 1 }}>Entry</span>
        <span style={{ width: 60, textAlign: "right" }}>Score</span>
        <span style={{ width: 24 }}></span>
      </div>
      {hasStarred && <div className="section-divider">Favorites</div>}
      {filtered.map((entry, i) => {
        const isFirstUnstarred = hasStarred && i === starred.size;
        return (
          <div key={entry.id}>
            {isFirstUnstarred && <div className="section-divider">All Entries</div>}
            <EntryRow
              entry={entry}
              expanded={expandedId === entry.id}
              starred={starred.has(entry.id)}
              onToggle={() => toggle(entry.id)}
              onStar={() => toggleStar(entry.id)}
            />
          </div>
        );
      })}
    </div>
  );
}
