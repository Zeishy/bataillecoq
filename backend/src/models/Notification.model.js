import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'tournament_started',
      'tournament_completed',
      'match_scheduled',
      'match_result',
      'team_invitation',
      'registration_confirmed',
      'registration_rejected',
      'team_approved',
      'team_rejected',
      'bracket_generated',
      'team_member_joined',
      'team_member_left'
    ]
  },
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  message: {
    type: String,
    required: true,
    maxlength: 500
  },
  read: {
    type: Boolean,
    default: false
  },
  relatedTournament: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tournament'
  },
  relatedMatch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match'
  },
  relatedTeam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  actionUrl: {
    type: String
  }
}, {
  timestamps: true
});

// Index for efficient querying
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

// Static method to create notification
notificationSchema.statics.createNotification = async function(data) {
  try {
    const notification = new this(data);
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Static method to notify all team members
notificationSchema.statics.notifyTeamMembers = async function(teamId, notificationData) {
  try {
    const Team = mongoose.model('Team');
    const team = await Team.findById(teamId)
      .populate('players.userId', 'username email')
      .populate({
        path: 'players.playerId',
        populate: { path: 'userId', select: 'username email' }
      });
    
    if (!team || !team.players || team.players.length === 0) return;
    
    const notifications = team.players
      .map(player => {
        // Handle both userId and playerId.userId structures
        let userId = player.userId;
        if (!userId && player.playerId?.userId) {
          userId = player.playerId.userId;
        }
        return userId ? {
          ...notificationData,
          recipient: userId._id
        } : null;
      })
      .filter(n => n !== null); // Remove null entries
    
    if (notifications.length > 0) {
      await this.insertMany(notifications);
    }
  } catch (error) {
    console.error('Error notifying team members:', error);
  }
};

// Static method to notify all tournament participants
notificationSchema.statics.notifyTournamentParticipants = async function(tournamentId, notificationData) {
  try {
    const Tournament = mongoose.model('Tournament');
    const tournament = await Tournament.findById(tournamentId).populate({
      path: 'registeredTeams.teamId',
      populate: { path: 'players.userId', select: 'username email' }
    });
    
    if (!tournament) return;
    
    const userIds = new Set();
    tournament.registeredTeams.forEach(reg => {
      if (reg.teamId && reg.teamId.players) {
        reg.teamId.players.forEach(player => {
          if (player.userId) {
            userIds.add(player.userId._id.toString());
          }
        });
      }
    });
    
    const notifications = Array.from(userIds).map(userId => ({
      ...notificationData,
      recipient: userId
    }));
    
    await this.insertMany(notifications);
  } catch (error) {
    console.error('Error notifying tournament participants:', error);
  }
};

export default mongoose.model('Notification', notificationSchema);
