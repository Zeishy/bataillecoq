// Mock data for tournaments
export const mockTournaments = [
  {
    id: 1,
    name: "Valorant Island Championship",
    game: "Valorant",
    status: "ongoing",
    startDate: "2026-01-10",
    endDate: "2026-01-20",
    teams: 16,
    prizePool: "5000€",
    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop"
  },
  {
    id: 2,
    name: "Call of Duty Masters",
    game: "Call of Duty",
    status: "upcoming",
    startDate: "2026-02-01",
    endDate: "2026-02-15",
    teams: 12,
    prizePool: "3000€",
    image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&auto=format&fit=crop"
  },
  {
    id: 3,
    name: "League of Legends Reunion Cup",
    game: "League of Legends",
    status: "upcoming",
    startDate: "2026-02-20",
    endDate: "2026-03-05",
    teams: 8,
    prizePool: "7000€",
    image: "https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=800&auto=format&fit=crop"
  },
  {
    id: 4,
    name: "Rocket League Showdown",
    game: "Rocket League",
    status: "past",
    startDate: "2025-12-15",
    endDate: "2025-12-30",
    teams: 10,
    prizePool: "2000€",
    image: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&auto=format&fit=crop"
  }
];

// Mock data for teams
export const mockTeams = [
  {
    id: 1,
    name: "Volcano Warriors",
    logo: "🌋",
    game: "Valorant",
    players: ["Player1", "Player2", "Player3", "Player4", "Player5"],
    points: 2450,
    rank: 1
  },
  {
    id: 2,
    name: "Ocean Breakers",
    logo: "🌊",
    game: "Valorant",
    players: ["ProGamer1", "ProGamer2", "ProGamer3", "ProGamer4", "ProGamer5"],
    points: 2380,
    rank: 2
  },
  {
    id: 3,
    name: "Tropical Tigers",
    logo: "🐅",
    game: "League of Legends",
    players: ["Tiger1", "Tiger2", "Tiger3", "Tiger4", "Tiger5"],
    points: 2200,
    rank: 3
  },
  {
    id: 4,
    name: "Reunion Legends",
    logo: "⚡",
    game: "Call of Duty",
    players: ["Legend1", "Legend2", "Legend3", "Legend4"],
    points: 2100,
    rank: 4
  },
  {
    id: 5,
    name: "Island Ninjas",
    logo: "🥷",
    game: "Valorant",
    players: ["Ninja1", "Ninja2", "Ninja3", "Ninja4", "Ninja5"],
    points: 1950,
    rank: 5
  }
];

// Mock data for players
export const mockPlayers = [
  {
    id: 1,
    name: "ReunionKing",
    game: "Valorant",
    points: 1250,
    rank: 1,
    kda: 1.85,
    winrate: 68,
    matchesPlayed: 142,
    trend: "up"
  },
  {
    id: 2,
    name: "VolcanoPro",
    game: "Valorant",
    points: 1180,
    rank: 2,
    kda: 1.72,
    winrate: 64,
    matchesPlayed: 128,
    trend: "up"
  },
  {
    id: 3,
    name: "OceanMaster",
    game: "League of Legends",
    points: 1150,
    rank: 3,
    kda: 3.2,
    winrate: 62,
    matchesPlayed: 156,
    trend: "down"
  },
  {
    id: 4,
    name: "IslandAce",
    game: "Call of Duty",
    points: 1100,
    rank: 4,
    kda: 2.1,
    winrate: 60,
    matchesPlayed: 98,
    trend: "up"
  },
  {
    id: 5,
    name: "TropicalSniper",
    game: "Call of Duty",
    points: 1050,
    rank: 5,
    kda: 1.95,
    winrate: 58,
    matchesPlayed: 110,
    trend: "same"
  }
];

// Mock statistics
export const mockStats = {
  totalPlayers: 1247,
  totalTeams: 89,
  activeTournaments: 3,
  totalPrizePool: "15000€"
};

// Mock user stats
export const mockUserStats = {
  kda: 1.65,
  winrate: 58,
  matchesPlayed: 87,
  rank: 24,
  recentMatches: [
    { id: 1, result: "win", score: "13-10", kda: 1.8, date: "2026-01-11" },
    { id: 2, result: "loss", score: "8-13", kda: 1.2, date: "2026-01-10" },
    { id: 3, result: "win", score: "13-7", kda: 2.1, date: "2026-01-09" },
    { id: 4, result: "win", score: "13-9", kda: 1.9, date: "2026-01-08" },
    { id: 5, result: "loss", score: "11-13", kda: 1.4, date: "2026-01-07" }
  ],
  progressionData: [
    { month: 'Sept', points: 850 },
    { month: 'Oct', points: 920 },
    { month: 'Nov', points: 980 },
    { month: 'Dec', points: 1050 },
    { month: 'Jan', points: 1150 }
  ]
};

// Mock news
export const mockNews = [
  {
    id: 1,
    title: "Volcano Warriors remportent le tournoi Valorant",
    date: "2026-01-11",
    excerpt: "Une victoire écrasante en finale avec un score de 3-1."
  },
  {
    id: 2,
    title: "Nouveau tournoi League of Legends annoncé",
    date: "2026-01-10",
    excerpt: "Prize pool de 7000€ pour la Reunion Cup 2026."
  },
  {
    id: 3,
    title: "Record de participation pour janvier",
    date: "2026-01-09",
    excerpt: "Plus de 200 joueurs inscrits ce mois-ci."
  }
];
