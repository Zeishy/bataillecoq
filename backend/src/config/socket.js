import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

let io;

export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.user.username} (${socket.id})`);

    // Join user's personal room
    socket.join(`user:${socket.user._id}`);

    // Send online status
    socket.broadcast.emit('user:online', {
      userId: socket.user._id,
      username: socket.user.username
    });

    // Join tournament chat room
    socket.on('tournament:join', (tournamentId) => {
      socket.join(`tournament:${tournamentId}`);
      console.log(`👥 ${socket.user.username} joined tournament ${tournamentId}`);
      
      // Notify others in the room
      socket.to(`tournament:${tournamentId}`).emit('user:joined', {
        userId: socket.user._id,
        username: socket.user.username,
        tournamentId
      });
    });

    // Leave tournament chat room
    socket.on('tournament:leave', (tournamentId) => {
      socket.leave(`tournament:${tournamentId}`);
      console.log(`👋 ${socket.user.username} left tournament ${tournamentId}`);
      
      socket.to(`tournament:${tournamentId}`).emit('user:left', {
        userId: socket.user._id,
        username: socket.user.username,
        tournamentId
      });
    });

    // Join team chat room
    socket.on('team:join', (teamId) => {
      socket.join(`team:${teamId}`);
      console.log(`👥 ${socket.user.username} joined team ${teamId}`);
      
      socket.to(`team:${teamId}`).emit('user:joined', {
        userId: socket.user._id,
        username: socket.user.username,
        teamId
      });
    });

    // Leave team chat room
    socket.on('team:leave', (teamId) => {
      socket.leave(`team:${teamId}`);
      console.log(`👋 ${socket.user.username} left team ${teamId}`);
      
      socket.to(`team:${teamId}`).emit('user:left', {
        userId: socket.user._id,
        username: socket.user.username,
        teamId
      });
    });

    // Typing indicator for tournament
    socket.on('tournament:typing', ({ tournamentId, isTyping }) => {
      socket.to(`tournament:${tournamentId}`).emit('user:typing', {
        userId: socket.user._id,
        username: socket.user.username,
        tournamentId,
        isTyping
      });
    });

    // Typing indicator for team
    socket.on('team:typing', ({ teamId, isTyping }) => {
      socket.to(`team:${teamId}`).emit('user:typing', {
        userId: socket.user._id,
        username: socket.user.username,
        teamId,
        isTyping
      });
    });

    // New message in tournament
    socket.on('tournament:message', (data) => {
      io.to(`tournament:${data.tournamentId}`).emit('message:new', {
        ...data,
        type: 'tournament'
      });
    });

    // New message in team
    socket.on('team:message', (data) => {
      io.to(`team:${data.teamId}`).emit('message:new', {
        ...data,
        type: 'team'
      });
    });

    // Message edited
    socket.on('message:edit', (data) => {
      const room = data.tournamentId 
        ? `tournament:${data.tournamentId}` 
        : `team:${data.teamId}`;
      
      io.to(room).emit('message:edited', data);
    });

    // Message deleted
    socket.on('message:delete', (data) => {
      const room = data.tournamentId 
        ? `tournament:${data.tournamentId}` 
        : `team:${data.teamId}`;
      
      io.to(room).emit('message:deleted', data);
    });

    // Notification events
    socket.on('notification:send', ({ userId, notification }) => {
      io.to(`user:${userId}`).emit('notification:new', notification);
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.user.username}`);
      
      socket.broadcast.emit('user:offline', {
        userId: socket.user._id,
        username: socket.user.username
      });
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

export default { initializeSocket, getIO };
