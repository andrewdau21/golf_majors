// Pool scoring rules:
//  - Each entry has 6 picks (one per group)
//  - Score = sum of best 4 players' scoreToPar (lower = better)
//  - If fewer than 4 players made the cut → entry misses the cut (score = null)
//  - Tiebreaker 1: most players who made the cut
//  - Tiebreaker 2: lowest total of ALL remaining (non-top-4) players

export function scoreEntry(entry, playerMap) {
  const pickData = entry.picks.map((name, idx) => {
    const p = playerMap[name];
    return p
      ? {
          name,
          tier: idx + 1,
          scoreToPar: p.scoreToPar,
          madeCut: p.madeCut,
          isCut: p.isCut,
          headshot: p.headshot ?? null,
          thru: p.thru ?? 0,
          round: p.round ?? 1,
          statusState: p.statusState ?? "pre",
          statusName: p.statusName ?? "",
          teeTime: p.teeTime ?? null,
        }
      : { name, tier: idx + 1, scoreToPar: 0, madeCut: false, isCut: false, notStarted: true };
  });

  const madePicksCut = pickData.filter((p) => p.madeCut);
  const missedCut = pickData.filter((p) => p.isCut);

  // Entry misses the cut if fewer than 4 players survived
  if (madePicksCut.length < 4) {
    return {
      ...entry,
      picks: pickData,
      totalScore: null,
      best4Score: null,
      cutPlayers: madePicksCut.length,
      missedCut: true,
      tiebreaker2: null,
    };
  }

  // Sort surviving players by scoreToPar ascending (best first)
  const sorted = [...madePicksCut].sort((a, b) => a.scoreToPar - b.scoreToPar);
  const best4 = sorted.slice(0, 4);
  const rest = sorted.slice(4);

  const best4Score = best4.reduce((sum, p) => sum + p.scoreToPar, 0);
  const tiebreaker2 = rest.reduce((sum, p) => sum + p.scoreToPar, 0);

  return {
    ...entry,
    picks: pickData,
    totalScore: best4Score,
    best4Score,
    best4Players: best4.map((p) => p.name),
    cutPlayers: madePicksCut.length,
    missedCut: false,
    tiebreaker2,
  };
}

export function rankEntries(scoredEntries) {
  const made = scoredEntries
    .filter((e) => !e.missedCut)
    .sort((a, b) => {
      if (a.totalScore !== b.totalScore) return a.totalScore - b.totalScore;
      if (a.cutPlayers !== b.cutPlayers) return b.cutPlayers - a.cutPlayers;
      return a.tiebreaker2 - b.tiebreaker2;
    });

  const missed = scoredEntries
    .filter((e) => e.missedCut)
    .sort((a, b) => b.cutPlayers - a.cutPlayers);

  let rank = 1;
  const ranked = [];
  for (let i = 0; i < made.length; i++) {
    const isTie =
      i > 0 &&
      made[i].totalScore === made[i - 1].totalScore &&
      made[i].cutPlayers === made[i - 1].cutPlayers &&
      made[i].tiebreaker2 === made[i - 1].tiebreaker2;
    if (!isTie) rank = i + 1;
    ranked.push({ ...made[i], rank, tied: isTie || (i < made.length - 1 && made[i].totalScore === made[i + 1]?.totalScore) });
  }

  missed.forEach((e) => ranked.push({ ...e, rank: null }));
  return ranked;
}

export function formatScore(score) {
  if (score === null || score === undefined) return "-";
  if (score === 0) return "E";
  return score > 0 ? `+${score}` : `${score}`;
}
