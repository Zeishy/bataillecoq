import mongoose from 'mongoose';

const tournamentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Tournament name is required'],
    trim: true
  },
  game: {
    type: String,
    enum: ['valorant', 'callofduty', 'leagueoflegends', 'rocketleague'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  rules: {
    type: String,
    default: 'Standard tournament rules apply'
  },
  prizePool: {
    type: String,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  maxTeams: {
    type: Number,
    required: true,
    min: 2
  },
  format: {
    type: String,
    enum: ['single-elimination', 'double-elimination', 'round-robin'],
    default: 'single-elimination'
  },
  registeredTeams: [{
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team'
    },
    registrationDate: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['registered', 'confirmed', 'eliminated', 'withdrawn'],
      default: 'registered'
    }
  }],
  matches: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match'
  }],
  standings: [{
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team'
    },
    rank: Number,
    points: {
      type: Number,
      default: 0
    },
    wins: {
      type: Number,
      default: 0
    },
    losses: {
      type: Number,
      default: 0
    }
  }],
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Method to register team
tournamentSchema.methods.registerTeam = function(teamId) {
  // Check if already registered
  const exists = this.registeredTeams.some(rt => rt.teamId.toString() === teamId.toString());
  if (exists) {
    throw new Error('Team already registered');
  }
  
  // Check if max teams reached
  if (this.registeredTeams.length >= this.maxTeams) {
    throw new Error('Tournament is full');
  }
  
  // Check status
  if (this.status !== 'upcoming') {
    throw new Error('Registration is closed');
  }
  
  this.registeredTeams.push({ teamId });
  
  // Initialize standings
  this.standings.push({ teamId, rank: this.registeredTeams.length, points: 0, wins: 0, losses: 0 });
};

// Method to unregister team
tournamentSchema.methods.unregisterTeam = function(teamId) {
  this.registeredTeams = this.registeredTeams.filter(rt => rt.teamId.toString() !== teamId.toString());
  this.standings = this.standings.filter(s => s.teamId.toString() !== teamId.toString());
};

// Method to update standings
tournamentSchema.methods.updateStandings = function(teamId, win) {
  const standing = this.standings.find(s => s.teamId.toString() === teamId.toString());
  if (standing) {
    if (win) {
      standing.wins += 1;
      standing.points += 3;
    } else {
      standing.losses += 1;
    }
  }
  
  // Recalculate ranks
  this.standings.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return b.wins - a.wins;
  });
  
  this.standings.forEach((standing, index) => {
    standing.rank = index + 1;
  });
};

// Method to calculate status based on dates
tournamentSchema.methods.calculateStatus = function() {
  const now = new Date();
  const start = new Date(this.startDate);
  const end = new Date(this.endDate);
  
  if (now < start) {
    return 'upcoming';
  } else if (now >= start && now <= end) {
    return 'ongoing';
  } else {
    return 'completed';
  }
};

// Virtual property for automatic status
tournamentSchema.virtual('currentStatus').get(function() {
  return this.calculateStatus();
});

// Middleware to update status before saving
tournamentSchema.pre('save', function(next) {
  // Auto-update status based on dates
  const calculatedStatus = this.calculateStatus();
  
  // Only auto-update if not manually set to 'cancelled'
  if (this.status !== 'cancelled') {
    this.status = calculatedStatus;
  }
  
  next();
});

// Static method to update all tournament statuses
tournamentSchema.statics.updateAllStatuses = async function() {
  const tournaments = await this.find({ status: { $ne: 'cancelled' } });
  let updated = 0;
  
  for (const tournament of tournaments) {
    const newStatus = tournament.calculateStatus();
    if (tournament.status !== newStatus) {
      tournament.status = newStatus;
      await tournament.save();
      updated++;
    }
  }
  
  return { updated, total: tournaments.length };
};

export default mongoose.model('Tournament', tournamentSchema);
