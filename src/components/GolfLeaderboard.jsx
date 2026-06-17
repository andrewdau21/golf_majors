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

export default function GolfLeaderboard({ players, poolPlayerNames }) {
  const poolSet = new Set(poolPlayerNames);

  return (
    <div className="golf-leaderboard">
      <div className="gl-header">
        <span className="gl-pos">Pos</span>
        <span className="gl-name">Player</span>
        <span className="gl-score">Score</span>
        <span className="gl-status">Status</span>
      </div>
      {players.map((p) => (
        <div
          key={p.id}
          className={[
            "gl-row",
            poolSet.has(p.name) ? "in-pool" : "",
            p.isCut ? "gl-cut" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <span className="gl-pos">{p.pos}</span>
          <span className="gl-name">
            {poolSet.has(p.name) && <span className="pool-dot" title="In pool">●</span>}
            {p.name}
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
