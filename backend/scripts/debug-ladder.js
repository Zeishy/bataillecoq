/**
 * Script de diagnostic - Vérifier l'état des tournois et du ladder
 * Usage: node scripts/debug-ladder.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Tournament from '../src/models/Tournament.js';
import Team from '../src/models/Team.js';
import Ladder from '../src/models/Ladder.js';
import User from '../src/models/User.js';
import connectDB from '../src/config/database.js';

dotenv.config();

const debugLadder = async () => {
  try {
    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║            DIAGNOSTIC DU LADDER                          ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');

    // Connecter à la base de données
    await connectDB();
    console.log('✅ Connected to database\n');

    // 1. Vérifier les tournois
    console.log('📋 TOURNOIS');
    console.log('═══════════════════════════════════════');
    
    const allTournaments = await Tournament.find()
      .populate('winner', 'name')
      .populate('registeredTeams.teamId', 'name');

    console.log(`Total de tournois: ${allTournaments.length}\n`);

    for (const tournament of allTournaments) {
      console.log(`Tournament: "${tournament.name}"`);
      console.log(`  Status: ${tournament.status}`);
      console.log(`  Winner: ${tournament.winner?.name || 'NOT SET'}`);
      console.log(`  Winner ID: ${tournament.winner?._id || 'NONE'}`);
      console.log(`  Registered Teams: ${tournament.registeredTeams.length}`);
      console.log('');
    }

    // 2. Vérifier les tournois complétés
    console.log('\n📊 TOURNOIS COMPLÉTÉS');
    console.log('═══════════════════════════════════════');
    
    const completedTournaments = await Tournament.find({
      status: 'completed'
    })
      .populate('winner', '_id name')
      .populate('registeredTeams.teamId', 'name players');

    console.log(`Tournois complétés: ${completedTournaments.length}\n`);

    for (const tournament of completedTournaments) {
      console.log(`Tournament: "${tournament.name}"`);
      console.log(`  Status: ${tournament.status}`);
      console.log(`  Winner: ${tournament.winner ? tournament.winner.name : 'NOT SET'}`);
      console.log(`  Winner ID: ${tournament.winner?._id || 'NONE'}`);
      
      if (tournament.winner) {
        const winningTeam = await Team.findById(tournament.winner._id)
          .populate('players.userId', 'username');
        
        if (winningTeam) {
          console.log(`  Winning Team: ${winningTeam.name}`);
          console.log(`  Players in winning team: ${winningTeam.players.length}`);
          for (const player of winningTeam.players) {
            console.log(`    - ${player.userId?.username || 'NO USER'} (userId: ${player.userId?._id || 'NONE'})`);
          }
        } else {
          console.log(`  ❌ Winning team not found!`);
        }
      } else {
        console.log(`  ⚠️  NO WINNER SET!`);
      }
      console.log('');
    }

    // 3. Vérifier le ladder
    console.log('\n🏆 LADDER');
    console.log('═══════════════════════════════════════');
    
    const ladderEntries = await Ladder.find().sort({ points: -1 });
    
    console.log(`Joueurs au ladder: ${ladderEntries.length}\n`);

    if (ladderEntries.length === 0) {
      console.log('❌ Le ladder est VIDE!');
    } else {
      for (const entry of ladderEntries) {
        console.log(`${entry.username.padEnd(20)} → ${entry.points} pts (${entry.tournamentsWon} tournois)`);
      }
    }

    // 4. Vérifier les utilisateurs
    console.log('\n\n👥 UTILISATEURS');
    console.log('═══════════════════════════════════════');
    
    const allUsers = await User.find().select('username email role');
    console.log(`Total d'utilisateurs: ${allUsers.length}\n`);
    
    for (const user of allUsers) {
      console.log(`${user.username} (${user.email}) - Role: ${user.role}`);
    }

    console.log('\n\n📝 RÉSUMÉ');
    console.log('═══════════════════════════════════════');
    console.log(`✅ Tournois totaux: ${allTournaments.length}`);
    console.log(`✅ Tournois complétés: ${completedTournaments.length}`);
    console.log(`✅ Joueurs au ladder: ${ladderEntries.length}`);
    console.log(`✅ Utilisateurs totaux: ${allUsers.length}`);

    if (completedTournaments.length > 0 && ladderEntries.length === 0) {
      console.log('\n⚠️  PROBLÈME DÉTECTÉ:');
      console.log('   - Il y a des tournois complétés');
      console.log('   - Mais le ladder est vide');
      console.log('   - Les gagnants n\'ont pas été ajoutés au ladder');
      console.log('\n💡 SOLUTION: Exécutez la synchronisation:');
      console.log('   curl -X POST http://localhost:5000/api/ladder/sync-debug');
    }

    console.log('\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    console.error(error);
    process.exit(1);
  }
};

debugLadder();
