const mongoose = require('mongoose');
const Tournament = require('./src/models/Tournament.model');
const Team = require('./src/models/Team.model');
const Match = require('./src/models/Match.model');

mongoose.connect('mongodb://localhost:27017/bataillecoq')
  .then(async () => {
    console.log('Connected to MongoDB\n');
    
    // Find tournament
    const tournament = await Tournament.findOne().populate('registeredTeams.teamId');
    console.log('=== TOURNAMENT ===');
    console.log('Name:', tournament.name);
    console.log('Registered Teams:', tournament.registeredTeams.map(rt => ({
      teamId: rt.teamId?._id,
      teamName: rt.teamId?.name,
      status: rt.status
    })));
    
    // Find matches
    const matches = await Match.find({ tournamentId: tournament._id })
      .populate('team1.teamId team2.teamId');
    
    console.log('\n=== MATCHES ===');
    matches.forEach((match, i) => {
      console.log(`Match ${i + 1}:`);
      console.log('  team1.teamId:', match.team1?.teamId);
      console.log('  team2.teamId:', match.team2?.teamId);
      console.log('  Raw team1:', match.team1);
      console.log('  Raw team2:', match.team2);
    });
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
