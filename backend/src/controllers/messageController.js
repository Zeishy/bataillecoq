import Message from '../models/Message.model.js';
import Tournament from '../models/Tournament.js';
import Team from '../models/Team.js';
import Match from '../models/Match.js';
import { getIO } from '../config/socket.js';

// @desc    Get messages for a tournament
// @route   GET /api/messages/tournament/:tournamentId
// @access  Public
export const getTournamentMessages = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { limit = 50, skip = 0 } = req.query;

    const messages = await Message.find({
      tournament: tournamentId,
      type: 'tournament'
    })
      .populate('author', 'username avatar')
      .populate('replyTo', 'content author')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Message.countDocuments({
      tournament: tournamentId,
      type: 'tournament'
    });

    res.json({
      success: true,
      messages: messages.reverse(), // Show oldest first
      total
    });
  } catch (error) {
    console.error('Get tournament messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des messages'
    });
  }
};

// @desc    Get messages for a team
// @route   GET /api/messages/team/:teamId
// @access  Private (Team members only)
export const getTeamMessages = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { limit = 50, skip = 0 } = req.query;

    // Verify user is team member
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Équipe non trouvée'
      });
    }

    const isMember = team.members.some(
      member => member.toString() === req.user._id.toString()
    );

    if (!isMember && team.captainId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé - membres de l\'équipe uniquement'
      });
    }

    const messages = await Message.find({
      team: teamId,
      type: 'team'
    })
      .populate('author', 'username avatar')
      .populate('replyTo', 'content author')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Message.countDocuments({
      team: teamId,
      type: 'team'
    });

    res.json({
      success: true,
      messages: messages.reverse(),
      total
    });
  } catch (error) {
    console.error('Get team messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des messages'
    });
  }
};

// @desc    Get messages for a match
// @route   GET /api/messages/matches/:matchId/messages
// @access  Private (Match participants only)
export const getMatchMessages = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { limit = 50, skip = 0 } = req.query;

    // Get match and verify participation
    const match = await Match.findById(matchId)
      .populate('team1.teamId', 'name captainId')
      .populate('team2.teamId', 'name captainId');

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match non trouvé'
      });
    }

    // Check if user is participant or team captain
    const userId = req.user._id.toString();
    const team1PlayerIds = (match.team1?.selectedPlayers || []).map(id => id.toString());
    const team2PlayerIds = (match.team2?.selectedPlayers || []).map(id => id.toString());
    const team1CaptainId = match.team1?.teamId?.captainId?._id?.toString();
    const team2CaptainId = match.team2?.teamId?.captainId?._id?.toString();
    
    const isParticipant = team1PlayerIds.includes(userId) || 
                          team2PlayerIds.includes(userId);
    const isCaptain = team1CaptainId === userId || team2CaptainId === userId;

    if (!isParticipant && !isCaptain) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé - participants du match uniquement'
      });
    }

    const messages = await Message.find({
      match: matchId,
      type: 'match'
    })
      .populate('author', 'username avatar')
      .populate('team', 'name')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Message.countDocuments({
      match: matchId,
      type: 'match'
    });

    res.json({
      success: true,
      messages: messages.reverse(),
      total
    });
  } catch (error) {
    console.error('Get match messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des messages'
    });
  }
};

// @desc    Post a message
// @route   POST /api/messages
// @access  Private
export const postMessage = async (req, res) => {
  try {
    const { tournament, team, match, content, type, replyTo } = req.body;
    const { matchId } = req.params;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Le contenu ne peut pas être vide'
      });
    }

    if (content.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Le message ne peut pas dépasser 1000 caractères'
      });
    }

    // Determine message type and validate
    let messageType = type || 'tournament';
    let messageData = {
      author: req.user._id,
      content: content.trim(),
      replyTo: replyTo || null
    };

    // If creating match message via POST /matches/:matchId/messages
    if (matchId) {
      messageType = 'match';
      const matchRecord = await Match.findById(matchId)
        .populate('team1.teamId', 'name captainId')
        .populate('team2.teamId', 'name captainId');

      if (!matchRecord) {
        return res.status(404).json({
          success: false,
          message: 'Match non trouvé'
        });
      }

      // Check if user is participant or team captain
      const userId = req.user._id.toString();
      const team1PlayerIds = (matchRecord.team1?.selectedPlayers || []).map(id => id.toString());
      const team2PlayerIds = (matchRecord.team2?.selectedPlayers || []).map(id => id.toString());
      const team1CaptainId = matchRecord.team1?.teamId?.captainId?._id?.toString();
      const team2CaptainId = matchRecord.team2?.teamId?.captainId?._id?.toString();
      
      let userTeamId = null;
      if (team1PlayerIds.includes(userId) || team1CaptainId === userId) {
        userTeamId = matchRecord.team1.teamId._id;
      } else if (team2PlayerIds.includes(userId) || team2CaptainId === userId) {
        userTeamId = matchRecord.team2.teamId._id;
      } else {
        return res.status(403).json({
          success: false,
          message: 'Vous n\'êtes pas participant du match'
        });
      }

      messageData = {
        ...messageData,
        match: matchId,
        tournament: matchRecord.tournamentId,
        team: userTeamId,
        type: messageType
      };
    } else if (type === 'tournament') {
      const tournamentExists = await Tournament.findById(tournament);
      if (!tournamentExists) {
        return res.status(404).json({
          success: false,
          message: 'Tournoi non trouvé'
        });
      }
      messageData = {
        ...messageData,
        tournament,
        type: messageType
      };
    } else if (type === 'team') {
      const teamExists = await Team.findById(team);
      if (!teamExists) {
        return res.status(404).json({
          success: false,
          message: 'Équipe non trouvée'
        });
      }

      // Verify user is team member
      const isMember = teamExists.members.some(
        member => member.toString() === req.user._id.toString()
      );

      if (!isMember && teamExists.captainId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Vous devez être membre de l\'équipe'
        });
      }
      messageData = {
        ...messageData,
        team,
        tournament,
        type: messageType
      };
    }

    const message = await Message.create(messageData);

    const populatedMessage = await Message.findById(message._id)
      .populate('author', 'username avatar')
      .populate('team', 'name')
      .populate('replyTo', 'content author');

    // Emit Socket.IO event for real-time updates
    try {
      const io = getIO();
      let room;
      if (messageType === 'match') {
        room = `match:${matchId}`;
      } else if (messageType === 'tournament') {
        room = `tournament:${tournament}`;
      } else if (messageType === 'team') {
        room = `team:${team}`;
      }
      
      io.to(room).emit('message:new', {
        message: populatedMessage,
        type: messageType
      });
    } catch (socketError) {
      console.error('Socket.IO error:', socketError);
      // Don't fail the request if socket fails
    }

    res.status(201).json({
      success: true,
      message: populatedMessage
    });
  } catch (error) {
    console.error('Post message error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'envoi du message'
    });
  }
};

// @desc    Edit a message
// @route   PUT /api/messages/:id
// @access  Private (Author only)
export const editMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    const message = await Message.findById(id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message non trouvé'
      });
    }

    // Verify user is the author
    if (message.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Vous ne pouvez modifier que vos propres messages'
      });
    }

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Le contenu ne peut pas être vide'
      });
    }

    message.content = content.trim();
    message.edited = true;
    message.editedAt = new Date();
    await message.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('author', 'username avatar')
      .populate('replyTo', 'content author');

    // Emit Socket.IO event for real-time updates
    try {
      const io = getIO();
      let room;
      if (message.match) {
        room = `match:${message.match}`;
      } else if (message.tournament) {
        room = `tournament:${message.tournament}`;
      } else if (message.team) {
        room = `team:${message.team}`;
      }
      
      io.to(room).emit('message:edited', {
        message: populatedMessage
      });
    } catch (socketError) {
      console.error('Socket.IO error:', socketError);
    }

    res.json({
      success: true,
      message: populatedMessage
    });
  } catch (error) {
    console.error('Edit message error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la modification'
    });
  }
};

// @desc    Delete a message
// @route   DELETE /api/messages/:id
// @access  Private (Author or Admin only)
export const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;

    const message = await Message.findById(id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message non trouvé'
      });
    }

    // Verify user is the author or admin
    if (
      message.author.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé'
      });
    }

    await message.deleteOne();

    // Emit Socket.IO event for real-time updates
    try {
      const io = getIO();
      let room;
      if (message.match) {
        room = `match:${message.match}`;
      } else if (message.tournament) {
        room = `tournament:${message.tournament}`;
      } else if (message.team) {
        room = `team:${message.team}`;
      }
      
      io.to(room).emit('message:deleted', {
        messageId: message._id,
        type: message.type
      });
    } catch (socketError) {
      console.error('Socket.IO error:', socketError);
    }

    res.json({
      success: true,
      message: 'Message supprimé'
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression'
    });
  }
};
