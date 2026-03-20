/**
 * Script de réparation - Ajouter les userId manquants et synchroniser le ladder
 * Usage: node scripts/fix-and-sync-ladder.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Tournament from '../src/models/Tournament.js';
import Team from '../src/models/Team.js';
import Ladder from '../src/models/Ladder.js';
import User from '../src/models/User.js';
import Player from '../src/models/Player.js';
import connectDB from '../src/config/database.js';

dotenv.config();

const fixAndSyncLadder = async () => {
  try {
    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║        RÉPARATION ET SYNCHRONISATION DU LADDER           ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');

    // Connecter à la base de données
    await connectDB();
    console.log('✅ Connected to database\n');

    // 1. Trouver tous les tournois complétés avec gagnant
    console.log('📋 Recherche des tournois complétés avec gagnant...');
    
    const completedTournaments = await Tournament.find({
      status: 'completed',
      winner: { $exists: true, $ne: null }
    })
      .populate('winner', '_id name');

    console.log(`✅ Trouvé ${completedTournaments.length} tournois complétés\n`);

    let playersProcessed = 0;
    let playersAdded = 0;
    const results = [];

    // 2. Pour chaque tournoi
    for (const tournament of completedTournaments) {
      console.log(`\n📍 Tournoi: "${tournament.name}"`);

      if (!tournament.winner) {
        console.log('   ⚠️  Pas de gagnant, passage...');
        continue;
      }

      // Récupérer l'équipe gagnante
      const winningTeam = await Team.findById(tournament.winner._id)
        .populate('players.userId', '_id username email')
        .populate('players.playerId', '_id userId');

      if (!winningTeam) {
        console.log('   ❌ Équipe gagnante non trouvée');
        continue;
      }

      console.log(`   👥 Équipe: ${winningTeam.name} (${winningTeam.players.length} joueurs)`);

      // 3. Pour chaque joueur de l'équipe gagnante
      for (const player of winningTeam.players) {
        console.log(`\n   🔍 Joueur ${player._id}:`);

        let userId = null;

        // Essai 1: userId direct
        if (player.userId && player.userId._id) {
          userId = player.userId._id;
          console.log(`      ✅ userId trouvé (direct): ${userId}`);
        }
        // Essai 2: via playerId
        else if (player.playerId && player.playerId.userId) {
          userId = player.playerId.userId;
          console.log(`      ✅ userId trouvé (via playerId): ${userId}`);
        }
        // Essai 3: Chercher dans le modèle Player
        else if (player.playerId) {
          const playerDoc = await Player.findById(player.playerId)
            .populate('userId', '_id username');
          
          if (playerDoc && playerDoc.userId) {
            userId = playerDoc.userId._id;
            console.log(`      ✅ userId trouvé (Player doc): ${userId}`);
          }
        }

        if (!userId) {
          console.log(`      ⚠️  userId non trouvé pour ce joueur`);
          continue;
        }

        // Récupérer l'utilisateur
        const user = await User.findById(userId);
        if (!user) {
          console.log(`      ❌ Utilisateur non trouvé: ${userId}`);
          continue;
        }

        console.log(`      👤 Utilisateur: ${user.username}`);

        // Ajouter ou mettre à jour au ladder
        let ladderEntry = await Ladder.findOne({ userId });

        if (!ladderEntry) {
          ladderEntry = new Ladder({
            userId,
            username: user.username,
            points: 10,
            gamesPlayed: 0,
            tournamentsWon: 1
          });
          console.log(`      ✅ Créé au ladder: ${user.username} → 10 pts`);
          playersAdded++;
        } else {
          const oldPoints = ladderEntry.points;
          ladderEntry.points += 10;
          ladderEntry.tournamentsWon += 1;
          console.log(`      ✅ Mis à jour au ladder: ${user.username} → ${oldPoints} + 10 = ${ladderEntry.points} pts`);
        }

        ladderEntry.lastUpdated = new Date();
        await ladderEntry.save();

        playersProcessed++;

        results.push({
          username: user.username,
          tournament: tournament.name,
          points: 10,
          newTotal: ladderEntry.points,
          tournamentsWon: ladderEntry.tournamentsWon
        });
      }
    }

    // 4. Afficher le résultat
    console.log('\n\n╔══════════════════════════════════════════════════════════╗');
    console.log('║                    RÉSULTATS                             ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');

    console.log(`📊 Statistiques:`);
    console.log(`   • Joueurs traités: ${playersProcessed}`);
    console.log(`   • Nouveaux joueurs ajoutés: ${playersAdded}`);
    console.log(`   • Joueurs mis à jour: ${playersProcessed - playersAdded}`);

    // 5. Afficher le top 10
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
    console.error('\n❌ Erreur:', error.message);
    console.error(error);
    process.exit(1);
  }
};

fixAndSyncLadder();
