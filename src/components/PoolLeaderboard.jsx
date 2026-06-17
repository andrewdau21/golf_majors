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

function PickRow({ pick, best4Players }) {
  const isBest = best4Players?.includes(pick.name);
  const classes = ["pick-row", isBest ? "best" : "", pick.isCut ? "cut" : ""].filter(Boolean).join(" ");
  return (
    <div className={classes}>
      <span className="pick-name">{pick.name}</span>
      <span className="pick-score">{formatScore(pick.madeCut || (!pick.isCut && !pick.notStarted) ? pick.scoreToPar : null)}</span>
      {pick.isCut && <span className="cut-label">CUT</span>}
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

  const hasStarred = starred.size > 0;

  return (
    <div className="pool-leaderboard">
      <div className="pool-header-row">
        <span style={{ width: 32 }}></span>
        <span style={{ width: 40 }}>#</span>
        <span style={{ flex: 1 }}>Entry</span>
        <span style={{ width: 60, textAlign: "right" }}>Score</span>
        <span style={{ width: 24 }}></span>
      </div>
      {hasStarred && <div className="section-divider">Favorites</div>}
      {sorted.map((entry, i) => {
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
