import mongoose from 'mongoose';
import Game from '../models/Game.js';
import dotenv from 'dotenv';

dotenv.config();

const seedGames = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bataillecoq');

    console.log('Checking existing games...');
    const existingGames = await Game.countDocuments();
    
    if (existingGames > 0) {
      console.log(`✅ ${existingGames} games already exist. Skipping seed.`);
      process.exit(0);
    }

    const defaultGames = [
      {
        name: 'Valorant',
        description: 'Jeu de tir à la première personne compétitif 5v5',
        icon: '🎯',
        playersPerTeam: 5,
        isActive: true
      },
      {
        name: 'League of Legends',
        description: 'MOBA d\'équipe 5v5 avec champions variés',
        icon: '⚔️',
        playersPerTeam: 5,
        isActive: true
      },
      {
        name: 'Counter-Strike 2',
        description: 'Jeu de tir tactique 5v5 compétitif',
        icon: '💣',
        playersPerTeam: 5,
        isActive: true
      },
      {
        name: 'Rocket League',
        description: 'Football avec voitures aérodynamiques 3v3 ou 4v4',
        icon: '🚗',
        playersPerTeam: 3,
        isActive: true
      },
      {
        name: 'Dota 2',
        description: 'MOBA compétitif 5v5 avec gameplay stratégique',
        icon: '👹',
        playersPerTeam: 5,
        isActive: true
      },
      {
        name: 'Call of Duty',
        description: 'Jeu de tir multiplayer compétitif',
        icon: '🔫',
        playersPerTeam: 4,
        isActive: true
      },
      {
        name: 'Fortnite',
        description: 'Battle royale compétitif à équipes',
        icon: '🎮',
        playersPerTeam: 4,
        isActive: true
      },
      {
        name: 'Overwatch 2',
        description: 'Hero shooter compétitif 5v5',
        icon: '🛡️',
        playersPerTeam: 5,
        isActive: true
      }
    ];

    console.log('Creating default games...');
    const createdGames = await Game.insertMany(defaultGames);
    console.log(`✅ ${createdGames.length} games created successfully!`);

    const games = await Game.find();
    console.log('\n📋 Games in database:');
    games.forEach(game => {
      console.log(`  - ${game.icon} ${game.name} (${game.playersPerTeam} players/team)`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding games:', error);
    process.exit(1);
  }
};

seedGames();
