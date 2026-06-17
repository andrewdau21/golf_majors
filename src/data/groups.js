// US Open 2026 player groups by odds tier
// Group 1 = favorites, Group 6 = longest shots

export const GROUPS = [
  {
    id: 1,
    label: "Group 1 — Favorites",
    players: [
      "Scottie Scheffler",
      "Rory McIlroy",
      "Xander Schauffele",
      "Collin Morikawa",
      "Ludvig Åberg",
    ],
  },
  {
    id: 2,
    label: "Group 2",
    players: [
      "Brooks Koepka",
      "Bryson DeChambeau",
      "Viktor Hovland",
      "Tommy Fleetwood",
      "Patrick Cantlay",
    ],
  },
  {
    id: 3,
    label: "Group 3",
    players: [
      "Justin Thomas",
      "Jordan Spieth",
      "Hideki Matsuyama",
      "Matt Fitzpatrick",
      "Tyrrell Hatton",
    ],
  },
  {
    id: 4,
    label: "Group 4",
    players: [
      "Sam Burns",
      "Sahith Theegala",
      "Cameron Young",
      "Shane Lowry",
      "Wyndham Clark",
    ],
  },
  {
    id: 5,
    label: "Group 5",
    players: [
      "Jason Day",
      "Brian Harman",
      "Rickie Fowler",
      "Cameron Smith",
      "Russell Henley",
    ],
  },
  {
    id: 6,
    label: "Group 6 — Long Shots",
    players: [
      "Billy Horschel",
      "Joaquín Niemann",
      "Min Woo Lee",
      "Robert MacIntyre",
      "Sungjae Im",
    ],
  },
];

// Flat map for quick lookup: player name → group number
export const PLAYER_GROUP = Object.fromEntries(
  GROUPS.flatMap((g) => g.players.map((p) => [p, g.id]))
);
