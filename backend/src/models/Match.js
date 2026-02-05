import mongoose from 'mongoose';

const matchSchema = new mongoose.Schema({
  tournamentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tournament',
    required: true
  },
  round: {
    type: Number,
    default: 1
  },
  matchNumber: Number,
  team1: {
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: true
    },
    score: {
      type: Number,
      default: 0
    }
  },
  team2: {
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: true
    },
    score: {
      type: Number,
      default: 0
    }
  },
  scheduledDate: Date,
  status: {
    type: String,
    enum: ['pending', 'ongoing', 'completed', 'cancelled'],
    default: 'pending'
  },
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  playerStats: [{
    playerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player'
    },
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team'
    },
    kills: {
      type: Number,
      default: 0
    },
    deaths: {
      type: Number,
      default: 0
    },
    assists: {
      type: Number,
      default: 0
    },
    kda: {
      type: Number,
      default: 0
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Method to update score
matchSchema.methods.updateScore = function(teamId, score) {
  if (this.team1.teamId.toString() === teamId.toString()) {
    this.team1.score = score;
  } else if (this.team2.teamId.toString() === teamId.toString()) {
    this.team2.score = score;
  }
  
  // Determine winner
  if (this.team1.score > this.team2.score) {
    this.winner = this.team1.teamId;
  } else if (this.team2.score > this.team1.score) {
    this.winner = this.team2.teamId;
  }
};

// Method to complete match
matchSchema.methods.completeMatch = function() {
  this.status = 'completed';
  
  // Determine winner if not set
  if (!this.winner) {
    if (this.team1.score > this.team2.score) {
      this.winner = this.team1.teamId;
    } else if (this.team2.score > this.team1.score) {
      this.winner = this.team2.teamId;
    }
  }
};

export default mongoose.model('Match', matchSchema);
