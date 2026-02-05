import mongoose from 'mongoose';

const playerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  games: [{
    gameName: {
      type: String,
      enum: ['valorant', 'callofduty', 'leagueoflegends', 'rocketleague'],
      required: true
    },
    gameTag: String,
    stats: {
      kda: {
        type: Number,
        default: 0
      },
      winrate: {
        type: Number,
        default: 0
      },
      matchesPlayed: {
        type: Number,
        default: 0
      },
      rank: {
        type: String,
        default: 'Unranked'
      },
      points: {
        type: Number,
        default: 0
      }
    },
    history: [{
      matchId: mongoose.Schema.Types.ObjectId,
      date: Date,
      result: {
        type: String,
        enum: ['win', 'loss', 'draw']
      },
      score: String,
      kda: Number,
      kills: Number,
      deaths: Number,
      assists: Number
    }],
    lastSyncedAt: Date
  }],
  teams: [{
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team'
    },
    game: String,
    role: String,
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  totalPoints: {
    type: Number,
    default: 0
  },
  globalRank: Number,
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Method to calculate total points from all games
playerSchema.methods.calculateTotalPoints = function() {
  this.totalPoints = this.games.reduce((total, game) => {
    return total + (game.stats.points || 0);
  }, 0);
  return this.totalPoints;
};

// Method to update game stats
playerSchema.methods.updateGameStats = function(gameName, newStats) {
  const gameIndex = this.games.findIndex(g => g.gameName === gameName);
  if (gameIndex !== -1) {
    this.games[gameIndex].stats = { ...this.games[gameIndex].stats, ...newStats };
    this.games[gameIndex].lastSyncedAt = new Date();
  } else {
    this.games.push({
      gameName,
      stats: newStats,
      lastSyncedAt: new Date()
    });
  }
  this.calculateTotalPoints();
};

export default mongoose.model('Player', playerSchema);
