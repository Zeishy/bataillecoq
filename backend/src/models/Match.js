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
    },
    selectedPlayers: [{
      type: mongoose.Schema.Types.ObjectId
    }]
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
    },
    selectedPlayers: [{
      type: mongoose.Schema.Types.ObjectId
    }]
  },
  // Score Submission and Validation
  scoreSubmission: {
    status: {
      type: String,
      enum: ['not-submitted', 'pending', 'approved', 'rejected'],
      default: 'not-submitted'
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team'
    },
    submittedAt: Date,
    team1Score: Number,
    team2Score: Number,
    screenshots: [{
      url: String,
      uploadedAt: Date
    }],
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: Date,
    rejectionReason: String,
    rejectedAt: Date
  },
  scheduledDate: Date,
  status: {
    type: String,
    enum: ['pending', 'ready', 'ongoing', 'completed', 'cancelled'],
    default: 'pending'
  },
  // Pick and Ban System
  mapPoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MapPool',
    default: null
  },
  matchFormat: {
    type: String,
    enum: ['bo1', 'bo3', 'bo5', 'bo7', 'bo9'],
    default: 'bo3'
  },
  pickAndBan: {
    status: {
      type: String,
      enum: ['not-started', 'side-selection', 'in-progress', 'completed'],
      default: 'not-started'
    },
    selectedMaps: [{
      mode: String,               // For multi-mode: "HP", "SND", "Surcharge"
      mapName: String,
      pickedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
      }
    }],
    bannedMaps: [{
      mapName: String,
      bannedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
      }
    }],
    completedAt: Date
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

// Method to submit score with screenshots
matchSchema.methods.submitScore = function(teamId, team1Score, team2Score, screenshotUrls) {
  this.scoreSubmission = {
    status: 'pending',
    submittedBy: teamId,
    submittedAt: new Date(),
    team1Score,
    team2Score,
    screenshots: screenshotUrls.map(url => ({
      url,
      uploadedAt: new Date()
    }))
  };
};

// Method to approve score
matchSchema.methods.approveScore = function(adminId) {
  if (this.scoreSubmission.status !== 'pending') {
    throw new Error('Score is not pending approval');
  }
  
  this.team1.score = this.scoreSubmission.team1Score;
  this.team2.score = this.scoreSubmission.team2Score;
  this.status = 'completed';
  
  // Determine winner
  if (this.team1.score > this.team2.score) {
    this.winner = this.team1.teamId;
  } else if (this.team2.score > this.team1.score) {
    this.winner = this.team2.teamId;
  }
  
  this.scoreSubmission.status = 'approved';
  this.scoreSubmission.approvedBy = adminId;
  this.scoreSubmission.approvedAt = new Date();
};

// Method to reject score
matchSchema.methods.rejectScore = function(adminId, reason) {
  if (this.scoreSubmission.status !== 'pending') {
    throw new Error('Score is not pending approval');
  }
  
  this.scoreSubmission.status = 'rejected';
  this.scoreSubmission.approvedBy = adminId;
  this.scoreSubmission.rejectedAt = new Date();
  this.scoreSubmission.rejectionReason = reason;
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
