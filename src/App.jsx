import { useState, useMemo } from "react";
import { useLeaderboard } from "./hooks/useLeaderboard";
import { ENTRIES } from "./data/entries";
import { scoreEntry, rankEntries } from "./data/scoring";
import PoolLeaderboard from "./components/PoolLeaderboard";
import GolfLeaderboard from "./components/GolfLeaderboard";

const TABS = ["Pool Leaderboard", "Golf Leaderboard"];

function TournamentBanner({ status, lastUpdated, onRefresh }) {
  if (!status) return null;
  const isLive = status.state === "in";
  const isPre = status.state === "pre";
  return (
    <div className={`banner ${isLive ? "live" : isPre ? "pre" : "post"}`}>
      <div className="banner-left">
        <span className="banner-title">U.S. Open 2026</span>
        {isLive && <span className="live-dot">● LIVE</span>}
        {isPre && <span className="status-label">Starts June 18</span>}
        {status.state === "post" && <span className="status-label">Final</span>}
      </div>
      <div className="banner-right">
        {lastUpdated && (
          <span className="last-updated">
            Updated {lastUpdated.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", second: "2-digit" })}
          </span>
        )}
        <button className="refresh-btn" onClick={onRefresh} title="Refresh">
          ↻
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState(0);
  const { players, tournamentStatus, loading, error, lastUpdated, refetch } = useLeaderboard();

  // Build a name→player map for scoring
  const playerMap = useMemo(
    () => Object.fromEntries(players.map((p) => [p.name, p])),
    [players]
  );

  const rankedEntries = useMemo(() => {
    const scored = ENTRIES.map((e) => scoreEntry(e, playerMap));
    return rankEntries(scored);
  }, [playerMap]);

  const allPoolPlayers = useMemo(
    () => [...new Set(ENTRIES.flatMap((e) => e.picks))],
    []
  );

  const pickCounts = useMemo(() => {
    const counts = {};
    ENTRIES.forEach((e) => e.picks.forEach((name) => {
      counts[name] = (counts[name] || 0) + 1;
    }));
    return counts;
  }, []);

  return (
    <div className="app">
      <TournamentBanner
        status={tournamentStatus}
        lastUpdated={lastUpdated}
        onRefresh={refetch}
      />

      <div className="tabs">
        {TABS.map((t, i) => (
          <button
            key={t}
            className={`tab-btn ${tab === i ? "active" : ""}`}
            onClick={() => setTab(i)}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="content">
        {loading && <div className="loading">Loading tournament data…</div>}
        {error && <div className="error">Error: {error}</div>}

        {!loading && tab === 0 && (
          <PoolLeaderboard rankedEntries={rankedEntries} />
        )}
        {!loading && tab === 1 && (
          <GolfLeaderboard players={players} poolPlayerNames={allPoolPlayers} pickCounts={pickCounts} />
        )}
      </div>
    </div>
  );
}
