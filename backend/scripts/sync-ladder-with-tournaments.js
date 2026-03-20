/**
 * Script de maintenance - Mettre à jour le ladder avec les gagnants des tournois existants
 * À exécuter une fois pour synchroniser les données
 * 
 * Usage: node scripts/sync-ladder-with-tournaments.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Tournament from '../src/models/Tournament.js';
import Team from '../src/models/Team.js';
import Ladder from '../src/models/Ladder.js';
import User from '../src/models/User.js';
import connectDB from '../src/config/database.js';

dotenv.config();

/**
 * Ajoute des points au ladder d'un joueur
 */
const addPointsToLadder = async (userId, points, reason = 'Tournament win') => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      console.warn(`⚠️  User not found: ${userId}`);
      return null;
    }

    let ladderEntry = await Ladder.findOne({ userId });

    if (!ladderEntry) {
      // Create new ladder entry
      ladderEntry = new Ladder({
        userId,
        username: user.username,
        points,
        gamesPlayed: 0,
        tournamentsWon: 1
      });
      console.log(`✅ Created ladder entry for ${user.username} with ${points} points`);
    } else {
      // Update existing entry
      const oldPoints = ladderEntry.points;
      ladderEntry.points += points;
      ladderEntry.tournamentsWon += 1;
      console.log(`✅ Updated ${user.username}: ${oldPoints} → ${ladderEntry.points} points (${ladderEntry.tournamentsWon} tournaments)`);
    }

    ladderEntry.lastUpdated = new Date();
    await ladderEntry.save();

    return ladderEntry;
  } catch (error) {
    console.error(`❌ Error adding points to ladder for user ${userId}:`, error.message);
    throw error;
  }
};

/**
 * Synchronise le ladder avec les gagnants des tournois complétés
 */
const syncLadderWithTournaments = async () => {
  try {
    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║  Synchronisation du Ladder avec les Tournois              ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');

    // Connecter à la base de données
    await connectDB();
    console.log('✅ Connected to database\n');

    // Trouver tous les tournois complétés avec un gagnant
    const completedTournaments = await Tournament.find({
      status: 'completed',
      winner: { $exists: true, $ne: null }
    })
      .populate({
        path: 'winner',
        select: '_id name'
      })
      .populate({
        path: 'registeredTeams.teamId',
        select: 'name players'
      });

    console.log(`📊 Found ${completedTournaments.length} completed tournaments with winners\n`);

    let totalPointsAdded = 0;
    let playersUpdated = 0;

    // Pour chaque tournoi complété
    for (const tournament of completedTournaments) {
      console.log(`\n📋 Tournament: "${tournament.name}"`);
      console.log(`   Status: ${tournament.status}`);
      console.log(`   Winner: ${tournament.winner?.name || 'Not set'}`);

      // Récupérer l'équipe gagnante complète
      if (!tournament.winner) {
        console.log('   ⚠️  No winner set, skipping...');
        continue;
      }

      try {
        const winningTeam = await Team.findById(tournament.winner._id)
          .populate('players.userId', '_id username');

        if (!winningTeam) {
          console.log(`   ❌ Winning team not found`);
          continue;
        }

        if (!winningTeam.players || winningTeam.players.length === 0) {
          console.log(`   ⚠️  No players in winning team`);
          continue;
        }

        console.log(`   👥 Team: ${winningTeam.name} (${winningTeam.players.length} players)`);

        // Ajouter les points à chaque joueur
        for (const player of winningTeam.players) {
          if (player.userId && player.userId._id) {
            try {
              const result = await addPointsToLadder(
                player.userId._id, 
                10, 
                `Tournament ${tournament.name} - Victory`
              );
              
              if (result) {
                totalPointsAdded += 10;
                playersUpdated++;
              }
            } catch (playerError) {
              console.error(`   ❌ Error updating player: ${playerError.message}`);
            }
          }
        }

      } catch (teamError) {
        console.error(`   ❌ Error processing tournament: ${teamError.message}`);
      }
    }

    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║                    STATISTIQUES                          ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log(`\n📊 Résultats:`);
    console.log(`   • Tournois traités: ${completedTournaments.length}`);
    console.log(`   • Joueurs mis à jour: ${playersUpdated}`);
    console.log(`   • Points totaux attribués: ${totalPointsAdded}`);

    // Afficher le top 10 du nouveau ladder
    const topPlayers = await Ladder.find()
      .sort({ points: -1 })
      .limit(10);

    if (topPlayers.length > 0) {
      console.log(`\n🏆 Top 10 du Classement:`);
      topPlayers.forEach((player, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `  #${index + 1}`;
        console.log(`   ${medal} ${player.username.padEnd(20)} → ${player.points} pts (${player.tournamentsWon} tournois)`);
      });
    }

    console.log('\n✅ Synchronisation complétée!\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    console.error(error);
    process.exit(1);
  }
};

// Exécuter la synchronisation
syncLadderWithTournaments();
