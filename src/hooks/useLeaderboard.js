import { useState, useEffect, useCallback } from "react";

const TOURNAMENT_ID = "401811952"; // US Open 2026
const API_URL = `https://site.api.espn.com/apis/site/v2/sports/golf/leaderboard?league=pga&tournament=${TOURNAMENT_ID}`;
const POLL_INTERVAL = 60_000; // refresh every 60s during live play

function parseCompetitor(c) {
  const pos = c.status?.position?.displayName ?? "-";
  const teeTime = c.status?.teeTime ?? null;
  const statusState = c.status?.type?.state ?? "pre"; // pre | in | post
  const statusName = c.status?.type?.name ?? "";
  const thru = c.status?.thru ?? 0;
  const round = c.status?.period ?? 1;

  // scoreToPar stat (negative = under par)
  const scoreToPar =
    c.statistics?.find((s) => s.name === "scoreToPar")?.value ?? 0;
  const scoreDisplay =
    c.statistics?.find((s) => s.name === "scoreToPar")?.displayValue ?? "-";

  // Per-round scores from linescores
  const rounds = (c.linescores ?? []).map((ls) => ({
    round: ls.period,
    score: ls.value ?? null,
    display: ls.displayValue ?? "-",
  }));

  const madeCut =
    statusName !== "STATUS_CUT" &&
    statusName !== "STATUS_WD" &&
    statusName !== "STATUS_DQ";

  const isCut =
    statusName === "STATUS_CUT" ||
    statusName === "STATUS_WD" ||
    statusName === "STATUS_DQ";

  return {
    id: c.athlete?.id,
    name: c.athlete?.displayName ?? "Unknown",
    shortName: c.athlete?.shortName ?? "",
    headshot: c.athlete?.headshot?.href ?? null,
    flag: c.athlete?.flag?.href ?? null,
    pos,
    scoreToPar,
    scoreDisplay,
    rounds,
    statusState,
    statusName,
    thru,
    round,
    teeTime,
    madeCut,
    isCut,
    sortOrder: c.sortOrder ?? 9999,
  };
}

export function useLeaderboard() {
  const [players, setPlayers] = useState([]);
  const [tournamentStatus, setTournamentStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      const event = json.events?.[0];
      if (!event) throw new Error("No event data");

      const competition = event.competitions?.[0];
      const status = competition?.status ?? event.status;

      setTournamentStatus({
        state: status?.type?.state ?? "pre",
        name: status?.type?.name ?? "",
        description: status?.type?.description ?? "",
        detail: status?.type?.detail ?? "",
        period: status?.period ?? 0,
        tournament: event.tournament,
      });

      const competitors = competition?.competitors ?? [];
      const parsed = competitors
        .map(parseCompetitor)
        .sort((a, b) => a.sortOrder - b.sortOrder);

      setPlayers(parsed);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  return { players, tournamentStatus, loading, error, lastUpdated, refetch: fetchData };
}
