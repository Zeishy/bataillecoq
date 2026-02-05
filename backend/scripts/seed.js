import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.js';
import Player from '../src/models/Player.js';
import Team from '../src/models/Team.js';
import Tournament from '../src/models/Tournament.js';
import Match from '../src/models/Match.js';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const seedData = async () => {
  try {
    // Clear existing data
    await User.deleteMany();
    await Player.deleteMany();
    await Team.deleteMany();
    await Tournament.deleteMany();
    await Match.deleteMany();

    console.log('Data cleared');

    // Create admin user
    const admin = await User.create({
      username: 'admin',
      email: 'admin@bataillecoq.re',
      password: 'admin123',
      role: 'admin',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin'
    });

    await Player.create({
      userId: admin._id,
      games: []
    });

    console.log('Admin created');

    // Create sample players
    const players = [];
    const playerNames = [
      { username: 'KawaiiNinja974', email: 'kawaii@bataillecoq.re' },
      { username: 'TigerShark97', email: 'tiger@bataillecoq.re' },
      { username: 'VortexGaming', email: 'vortex@bataillecoq.re' },
      { username: 'PhoenixRise', email: 'phoenix@bataillecoq.re' },
      { username: 'ShadowStrike', email: 'shadow@bataillecoq.re' },
      { username: 'BlazeMaster', email: 'blaze@bataillecoq.re' },
      { username: 'FrostByte', email: 'frost@bataillecoq.re' },
      { username: 'ThunderBolt', email: 'thunder@bataillecoq.re' }
    ];

    for (const playerData of playerNames) {
      const user = await User.create({
        username: playerData.username,
        email: playerData.email,
        password: 'password123',
        role: 'captain',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${playerData.username}`,
        linkedGames: [
          {
            game: 'valorant',
            gameTag: `${playerData.username}#9740`,
            accountId: `riot_${playerData.username}`,
            verified: true
          }
        ]
      });

      const player = await Player.create({
        userId: user._id,
        games: [
          {
            gameName: 'valorant',
            gameTag: `${playerData.username}#9740`,
            stats: {
              kda: (Math.random() * 2 + 1).toFixed(2),
              winrate: (Math.random() * 30 + 45).toFixed(1),
              matchesPlayed: Math.floor(Math.random() * 100) + 50,
              rank: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'][Math.floor(Math.random() * 5)],
              points: Math.floor(Math.random() * 1000) + 500
            },
            history: []
          }
        ]
      });

      players.push({ user, player });
    }

    console.log('Players created');

    // Create sample teams
    const teams = [];
    const teamData = [
      { name: 'Reunion Warriors', logo: '⚔️', description: 'Les guerriers de la Réunion' },
      { name: 'Volcano Squad', logo: '🌋', description: 'La puissance du Piton de la Fournaise' },
      { name: 'Tropical Titans', logo: '🌴', description: 'Force tropicale' },
      { name: 'Ocean Legends', logo: '🌊', description: 'Légendes de l\'océan Indien' }
    ];

    for (let i = 0; i < teamData.length; i++) {
      const captain = players[i * 2];
      
      const team = await Team.create({
        name: teamData[i].name,
        game: 'valorant',
        logo: teamData[i].logo,
        description: teamData[i].description,
        captainId: captain.user._id,
        players: [
          {
            playerId: captain.user._id,
            role: 'Captain',
            joinedAt: new Date()
          },
          {
            playerId: players[i * 2 + 1].user._id,
            role: 'Player',
            joinedAt: new Date()
          }
        ],
        stats: {
          wins: Math.floor(Math.random() * 20) + 5,
          losses: Math.floor(Math.random() * 15) + 3,
          points: Math.floor(Math.random() * 500) + 200
        }
      });

      // Update users
      captain.user.teams.push(team._id);
      await captain.user.save();
      
      players[i * 2 + 1].user.teams.push(team._id);
      await players[i * 2 + 1].user.save();

      teams.push(team);
    }

    console.log('Teams created');

    // Create sample tournament
    const tournament = await Tournament.create({
      name: 'Valorant Championship La Réunion 2024',
      game: 'valorant',
      description: 'Le plus grand tournoi Valorant de l\'île de la Réunion',
      startDate: new Date('2024-06-15'),
      endDate: new Date('2024-06-30'),
      maxTeams: 16,
      prizePool: '5000€',
      status: 'upcoming',
      rules: 'Format: Best of 3. Équipes de 5 joueurs minimum. Ping maximum: 100ms. Aucun smurf autorisé.',
      format: 'single-elimination',
      registeredTeams: teams.slice(0, 4).map(team => ({
        teamId: team._id,
        registrationDate: new Date()
      }))
    });

    console.log('Tournament created');

    // Create sample matches
    const match1 = await Match.create({
      tournamentId: tournament._id,
      team1: {
        teamId: teams[0]._id,
        score: 2
      },
      team2: {
        teamId: teams[1]._id,
        score: 1
      },
      round: 1,
      scheduledAt: new Date('2024-06-15T14:00:00'),
      status: 'completed',
      winner: teams[0]._id
    });

    const match2 = await Match.create({
      tournamentId: tournament._id,
      team1: {
        teamId: teams[2]._id,
        score: 0
      },
      team2: {
        teamId: teams[3]._id,
        score: 0
      },
      round: 1,
      scheduledAt: new Date('2024-06-15T16:00:00'),
      status: 'pending'
    });

    tournament.matches.push(match1._id, match2._id);
    tournament.standings = [
      { teamId: teams[0]._id, wins: 1, losses: 0, points: 3 },
      { teamId: teams[1]._id, wins: 0, losses: 1, points: 0 },
      { teamId: teams[2]._id, wins: 0, losses: 0, points: 0 },
      { teamId: teams[3]._id, wins: 0, losses: 0, points: 0 }
    ];
    await tournament.save();

    console.log('Matches created');

    console.log('✅ Seed data created successfully!');
    console.log('\nTest accounts:');
    console.log('Admin: admin@bataillecoq.re / admin123');
    console.log('Player: kawaii@bataillecoq.re / password123');
    console.log('\n🚀 You can now start the server with: npm run dev');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

connectDB().then(() => seedData());
