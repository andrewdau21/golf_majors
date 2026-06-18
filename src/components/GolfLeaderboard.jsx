import { useState, useMemo } from "react";
import { formatScore } from "../data/scoring";

function StatusBadge({ player }) {
  if (player.statusName === "STATUS_CUT") return <span className="badge cut">CUT</span>;
  if (player.statusName === "STATUS_WD") return <span className="badge wd">WD</span>;
  if (player.statusName === "STATUS_DQ") return <span className="badge dq">DQ</span>;
  if (player.statusState === "in") {
    return (
      <span className="badge active">
        Thru {player.thru === 18 ? "F" : player.thru || "-"}
      </span>
    );
  }
  if (player.statusState === "post") return <span className="badge done">F</span>;
  if (player.teeTime) {
    const t = new Date(player.teeTime);
    return (
      <span className="badge tee">
        {t.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
      </span>
    );
  }
  return <span className="badge sched">Sched</span>;
}

function PickCountBadge({ count }) {
  if (!count) return null;
  const intensity = Math.min(count / 20, 1);
  return (
    <span
      className="pick-count-badge"
      title={`Selected by ${count} ${count === 1 ? "entry" : "entries"}`}
      style={{ opacity: 0.45 + intensity * 0.55 }}
    >
      {count}
    </span>
  );
}

// How far along a player is in the tournament (for "thru" sort)
function progress(p) {
  if (p.isCut) return -1; // cut players sink to the bottom
  return (p.round - 1) * 18 + (p.thru || 0);
}

const COLUMNS = [
  { key: "pos",    label: "Pos",   title: "Tournament position" },
  { key: "name",   label: "Player" },
  { key: "picks",  label: "Picks", title: "Pool entries who picked this player" },
  { key: "score",  label: "Score" },
  { key: "thru",   label: "Thru",  title: "Holes completed this tournament" },
];

function SortIcon({ active, dir }) {
  if (!active) return <span className="sort-icon inactive">⇅</span>;
  return <span className="sort-icon">{dir === "asc" ? "▲" : "▼"}</span>;
}

export default function GolfLeaderboard({ players, poolPlayerNames, pickCounts }) {
  const poolSet = new Set(poolPlayerNames);
  const [sortCol, setSortCol] = useState("pos");
  const [sortDir, setSortDir] = useState("asc");

  function handleSort(key) {
    if (sortCol === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(key);
      // Picks/thru default descending (more = better); others ascending
      setSortDir(key === "picks" || key === "thru" ? "desc" : "asc");
    }
  }

  const sorted = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;
    return [...players].sort((a, b) => {
      switch (sortCol) {
        case "pos":   return dir * (a.sortOrder - b.sortOrder);
        case "name":  return dir * a.name.localeCompare(b.name);
        case "picks": return dir * ((pickCounts[a.name] || 0) - (pickCounts[b.name] || 0));
        case "score": return dir * (a.scoreToPar - b.scoreToPar);
        case "thru":  return dir * (progress(a) - progress(b));
        default:      return 0;
      }
    });
  }, [players, pickCounts, sortCol, sortDir]);

  return (
    <div className="golf-leaderboard">
      <div className="gl-header">
        {COLUMNS.map((col) => (
          <button
            key={col.key}
            className={`gl-col-btn gl-${col.key} ${sortCol === col.key ? "sorted" : ""}`}
            onClick={() => handleSort(col.key)}
            title={col.title ?? `Sort by ${col.label}`}
          >
            {col.label}
            <SortIcon active={sortCol === col.key} dir={sortDir} />
          </button>
        ))}
      </div>

      {sorted.map((p) => (
        <div
          key={p.id}
          className={[
            "gl-row",
            poolSet.has(p.name) ? "in-pool" : "",
            p.isCut ? "gl-cut" : "",
          ].filter(Boolean).join(" ")}
        >
          <span className="gl-pos">{p.pos}</span>
          <span className="gl-name">
            {poolSet.has(p.name) && <span className="pool-dot" title="In pool">●</span>}
            {p.name}
          </span>
          <span className="gl-picks">
            <PickCountBadge count={pickCounts[p.name]} />
          </span>
          <span className={`gl-score ${p.scoreToPar < 0 ? "under" : p.scoreToPar > 0 ? "over" : ""}`}>
            {p.scoreDisplay}
          </span>
          <span className="gl-status">
            <StatusBadge player={p} />
          </span>
        </div>
      ))}
    </div>
  );
}
