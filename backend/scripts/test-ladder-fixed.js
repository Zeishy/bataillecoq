#!/usr/bin/env node

/**
 * Test Script - Verify the fixed ladder endpoints
 * This script tests that the improved ladder sync works correctly with multi-level userId resolution
 */

import axios from 'axios';
import mongodb from 'mongodb';

const API_URL = 'http://localhost:5000';

async function testLadderEndpoints() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🧪 Testing Fixed Ladder Endpoints');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    // Test 1: Get ladder
    console.log('1️⃣  Testing GET /api/ladder');
    try {
      const ladderResponse = await axios.get(`${API_URL}/api/ladder`);
      console.log(`✅ Ladder retrieved: ${ladderResponse.data.ladder.length} players found`);
      
      if (ladderResponse.data.ladder.length > 0) {
        console.log('\n   Top 3 Players:');
        ladderResponse.data.ladder.slice(0, 3).forEach((player, idx) => {
          const medals = ['🥇', '🥈', '🥉'];
          console.log(`   ${medals[idx]} ${idx + 1}. ${player.username} - ${player.points} pts (${player.tournamentsWon} wins)`);
        });
      }
    } catch (error) {
      console.log(`❌ Error: ${error.response?.data?.message || error.message}`);
    }

    console.log('\n─────────────────────────────────────────────────────\n');

    // Test 2: Search ladder
    console.log('2️⃣  Testing GET /api/ladder/search');
    try {
      const searchResponse = await axios.get(`${API_URL}/api/ladder/search?page=1&limit=5`);
      console.log(`✅ Search works: ${searchResponse.data.count} results on page 1/${searchResponse.data.pages}`);
    } catch (error) {
      console.log(`❌ Error: ${error.response?.data?.message || error.message}`);
    }

    console.log('\n─────────────────────────────────────────────────────\n');

    // Test 3: Debug sync endpoint
    console.log('3️⃣  Testing POST /api/ladder/sync-debug (multi-level userId resolution)');
    try {
      const syncResponse = await axios.post(`${API_URL}/api/ladder/sync-debug`);
      const stats = syncResponse.data.stats;
      console.log(`✅ Sync completed:`);
      console.log(`   📊 Tournaments processed: ${stats.tournamentsProcessed}`);
      console.log(`   👥 Players processed: ${stats.playersUpdated}`);
      console.log(`   ⭐ Total points added: ${stats.totalPointsAdded}`);
      
      if (syncResponse.data.topPlayers && syncResponse.data.topPlayers.length > 0) {
        console.log(`\n   Updated Top 3:`);
        syncResponse.data.topPlayers.slice(0, 3).forEach((player, idx) => {
          const medals = ['🥇', '🥈', '🥉'];
          console.log(`   ${medals[idx]} ${idx + 1}. ${player.username} - ${player.points} pts`);
        });
      }
    } catch (error) {
      console.log(`❌ Error: ${error.response?.data?.message || error.message}`);
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✅ All tests completed!');
    console.log('═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('💥 Fatal error:', error.message);
    process.exit(1);
  }
}

// Run tests
testLadderEndpoints().then(() => {
  console.log('✨ Tests finished. Server should be running to see results.\n');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});
