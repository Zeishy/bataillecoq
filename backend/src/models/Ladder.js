import mongoose from 'mongoose';

const pointsHistorySchema = new mongoose.Schema({
  tournamentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tournament'
  },
  tournamentName: String,
  placement: Number,
  weight: {
    type: Number,
    default: 1.0
  },
  matchesWon: {
    type: Number,
    default: 0
  },
  placementPoints: Number,
  matchPoints: {
    type: Number,
    default: 0
  },
  pointsEarned: Number,
  earnedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const ladderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  username: {
    type: String,
    required: true
  },
  points: {
    type: Number,
    default: 0
  },
  gamesPlayed: {
    type: Number,
    default: 0
  },
  tournamentsParticipated: {
    type: Number,
    default: 0
  },
  tournamentsWon: {
    type: Number,
    default: 0
  },
  // New: Track points by tournament
  pointsHistory: [pointsHistorySchema],
  rank: {
    type: Number
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for sorting by points
ladderSchema.index({ points: -1 });
ladderSchema.index({ userId: 1 });

export default mongoose.model('Ladder', ladderSchema);
