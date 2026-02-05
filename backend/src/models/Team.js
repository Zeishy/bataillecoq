import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Team name is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Team name must be at least 3 characters'],
    maxlength: [50, 'Team name cannot exceed 50 characters']
  },
  logo: {
    type: String,
    default: '🏆'
  },
  captainId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  game: {
    type: String,
    enum: ['valorant', 'callofduty', 'leagueoflegends', 'rocketleague'],
    required: [true, 'Primary game is required']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  players: [{
    playerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player'
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      default: 'Player'
    },
    game: String,
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  stats: {
    wins: {
      type: Number,
      default: 0
    },
    losses: {
      type: Number,
      default: 0
    },
    points: {
      type: Number,
      default: 0
    },
    rank: Number
  },
  tournaments: [{
    tournamentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tournament'
    },
    registeredAt: Date,
    finalRank: Number,
    points: Number
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for win rate
teamSchema.virtual('winRate').get(function() {
  const totalGames = this.stats.wins + this.stats.losses;
  if (totalGames === 0) return 0;
  return Math.round((this.stats.wins / totalGames) * 100);
});

// Method to add player
teamSchema.methods.addPlayer = function(playerId, userId, role, game) {
  const exists = this.players.some(p => p.userId.toString() === userId.toString());
  if (!exists) {
    this.players.push({ playerId, userId, role, game });
  }
};

// Method to remove player
teamSchema.methods.removePlayer = function(userId) {
  this.players = this.players.filter(p => p.userId.toString() !== userId.toString());
};

// Method to update stats
teamSchema.methods.updateStats = function(win) {
  if (win) {
    this.stats.wins += 1;
    this.stats.points += 50;
  } else {
    this.stats.losses += 1;
    this.stats.points = Math.max(0, this.stats.points - 10);
  }
};

export default mongoose.model('Team', teamSchema);
