import Match from '../models/Match.js';
import MapPool from '../models/MapPool.js';
import Tournament from '../models/Tournament.js';

const hasSelectedPlayers = (team) => Array.isArray(team?.selectedPlayers) && team.selectedPlayers.length > 0;

const getMatchFormatForRound = (tournament, round, fallback = 'bo3') => {
  const totalRounds = tournament?.bracket?.totalRounds;
  const isFinal = totalRounds && round === totalRounds;
  return isFinal ? (tournament.finalFormat || tournament.matchFormat || fallback) : (tournament.matchFormat || fallback);
};

const ensureMatchPickAndBanConfig = async (match) => {
  if (match.mapPoolId && match.matchFormat) return match;

  const tournamentId = match.tournamentId?._id || match.tournamentId;
  if (!tournamentId) return match;

  const tournament = await Tournament.findById(tournamentId).select('mapPoolId matchFormat finalFormat bracket');
  if (!tournament) return match;

  if (!match.mapPoolId && tournament.mapPoolId) {
    match.mapPoolId = tournament.mapPoolId;
  }
  const expectedFormat = getMatchFormatForRound(tournament, match.round, match.matchFormat || 'bo3');
  if (expectedFormat && match.matchFormat !== expectedFormat) {
    match.matchFormat = expectedFormat;
  }

  return match;
};

// Helper to generate the Pick and Ban sequence
const generateSequence = (matchFormat, modes) => {
  const hasModes = modes && modes.length > 0;
  const buildGenericBestOfSequence = (bestOf, mode = null) => {
    if (bestOf <= 1) {
      return [
        { action: 'ban', mode, teamRole: 'A' },
        { action: 'ban', mode, teamRole: 'B' },
        { action: 'ban', mode, teamRole: 'A' },
        { action: 'ban', mode, teamRole: 'B' },
        { action: 'auto-pick', mode, teamRole: 'none' }
      ];
    }

    const sequence = [
      { action: 'ban', mode, teamRole: 'A' },
      { action: 'ban', mode, teamRole: 'B' }
    ];

    for (let i = 0; i < bestOf - 1; i += 1) {
      sequence.push({ action: 'pick', mode, teamRole: i % 2 === 0 ? 'A' : 'B' });
    }

    sequence.push({ action: 'auto-pick', mode, teamRole: 'none' });
    return sequence;
  };
  
  if (hasModes) {
    // Call of Duty formats (assumes modes are HP, SND, Surcharge or similar)
    const hpMode = modes.find(m => m.name.toLowerCase().includes('hp') || m.name.toLowerCase().includes('hardpoint'))?.name || modes[0].name;
    const sndMode = modes.find(m => m.name.toLowerCase().includes('r&d') || m.name.toLowerCase().includes('snd'))?.name || modes[1]?.name || modes[0].name;
    const controlMode = modes.find(m => m.name.toLowerCase().includes('surcharge') || m.name.toLowerCase().includes('control'))?.name || modes[2]?.name || modes[0].name;
    
    if (matchFormat === 'bo5') {
      return [
        { action: 'ban', mode: hpMode, teamRole: 'A' },
        { action: 'ban', mode: hpMode, teamRole: 'B' },
        { action: 'pick', mode: hpMode, teamRole: 'A' },
        { action: 'pick', mode: hpMode, teamRole: 'B' },
        { action: 'ban', mode: sndMode, teamRole: 'B' },
        { action: 'ban', mode: sndMode, teamRole: 'A' },
        { action: 'pick', mode: sndMode, teamRole: 'B' },
        { action: 'pick', mode: sndMode, teamRole: 'A' },
        { action: 'ban', mode: controlMode, teamRole: 'A' },
        { action: 'ban', mode: controlMode, teamRole: 'B' },
        { action: 'auto-pick', mode: controlMode, teamRole: 'none' }
      ];
    } else if (matchFormat === 'bo3') {
      return [
        { action: 'ban', mode: hpMode, teamRole: 'A' },
        { action: 'ban', mode: hpMode, teamRole: 'B' },
        { action: 'pick', mode: hpMode, teamRole: 'A' },
        { action: 'ban', mode: sndMode, teamRole: 'B' },
        { action: 'ban', mode: sndMode, teamRole: 'A' },
        { action: 'pick', mode: sndMode, teamRole: 'B' },
        { action: 'ban', mode: controlMode, teamRole: 'A' },
        { action: 'ban', mode: controlMode, teamRole: 'B' },
        { action: 'auto-pick', mode: controlMode, teamRole: 'none' }
      ];
    }

    const bestOf = Number.parseInt(matchFormat?.replace('bo', ''), 10);
    if (bestOf > 0) {
      return buildGenericBestOfSequence(bestOf);
    }
  }
  
  // Generic single-mode formats
  if (matchFormat === 'bo3') {
    return [
      { action: 'ban', mode: null, teamRole: 'A' },
      { action: 'ban', mode: null, teamRole: 'B' },
      { action: 'pick', mode: null, teamRole: 'A' },
      { action: 'pick', mode: null, teamRole: 'B' },
      { action: 'auto-pick', mode: null, teamRole: 'none' }
    ];
  } else if (matchFormat === 'bo5') {
    return [
      { action: 'ban', mode: null, teamRole: 'A' },
      { action: 'ban', mode: null, teamRole: 'B' },
      { action: 'pick', mode: null, teamRole: 'A' },
      { action: 'pick', mode: null, teamRole: 'B' },
      { action: 'pick', mode: null, teamRole: 'A' },
      { action: 'pick', mode: null, teamRole: 'B' },
      { action: 'auto-pick', mode: null, teamRole: 'none' }
    ];
  } else if (matchFormat === 'bo1') {
    return buildGenericBestOfSequence(1);
  }

  const bestOf = Number.parseInt(matchFormat?.replace('bo', ''), 10);
  if (bestOf > 1) {
    return buildGenericBestOfSequence(bestOf);
  }
  
  return [];
};

// Helper to advance sequence
const advanceSequence = async (match) => {
  match.pickAndBan.currentStepIndex += 1;
  
  const nextStep = match.pickAndBan.sequence[match.pickAndBan.currentStepIndex];
  
  if (!nextStep) {
    match.pickAndBan.status = 'completed';
    match.pickAndBan.completedAt = new Date();
    match.pickAndBan.activeTurn = null;
    match.status = 'ongoing';
    return;
  }

  // Find remaining maps for the nextStep mode/pool
  const pool = await MapPool.findById(match.mapPoolId);
  if (!pool) {
    match.pickAndBan.status = 'completed';
    match.pickAndBan.completedAt = new Date();
    match.pickAndBan.activeTurn = null;
    match.status = 'ongoing';
    return;
  }

  const mode = nextStep.mode;
  let availableMaps = [];
  if (pool.modes && pool.modes.length > 0) {
    if (mode) {
      const modeData = pool.modes.find(m => m.name === mode);
      if (modeData) availableMaps = modeData.maps || [];
    } else {
      availableMaps = pool.modes.reduce((acc, m) => acc.concat(m.maps || []), []);
    }
  } else {
    availableMaps = pool.maps || [];
  }

  // Filter out already picked or banned maps
  const pickedNames = match.pickAndBan.selectedMaps.filter(m => !mode || m.mode === mode).map(m => m.mapName);
  const bannedNames = match.pickAndBan.bannedMaps.map(m => m.mapName);
  const remainingMaps = availableMaps.filter(m => !pickedNames.includes(m.name) && !bannedNames.includes(m.name));

  if (remainingMaps.length === 0) {
    // No maps available for this step, so skip it and advance sequence
    await advanceSequence(match);
    return;
  }
  
  if (nextStep.action === 'auto-pick') {
    match.pickAndBan.selectedMaps.push({
      mode: mode,
      mapName: remainingMaps[0].name, // Auto-pick the last remaining
      pickedBy: null
    });
    
    // Advance again in case there are multiple auto-picks or sequence ends
    await advanceSequence(match);
    return;
  }
  
  // Set next active turn
  match.pickAndBan.activeTurn = nextStep.teamRole === 'A' ? match.pickAndBan.teamA : match.pickAndBan.teamB;
};

// @desc    Start pick and ban process
// @route   POST /api/pick-and-ban/:matchId/start
// @access  Private (Admin or Captain)
export const startPickAndBan = async (req, res) => {
  try {
    const match = await Match.findById(req.params.matchId)
      .populate('tournamentId')
      .populate('mapPoolId');
    
    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found' });
    }
    
    if (match.pickAndBan.status !== 'not-started') {
      return res.status(400).json({ success: false, message: 'Pick and ban already started or completed' });
    }

    await ensureMatchPickAndBanConfig(match);
    if (!match.mapPoolId) {
      return res.status(400).json({ success: false, message: 'Aucun pool de maps n’est configuré pour ce match' });
    }

    if (match.status !== 'ready') {
      return res.status(400).json({
        success: false,
        message: 'Les deux équipes doivent sélectionner leurs joueurs avant de démarrer le pick and ban',
        currentStatus: match.status
      });
    }

    if (!hasSelectedPlayers(match.team1) || !hasSelectedPlayers(match.team2)) {
      return res.status(400).json({
        success: false,
        message: 'Les deux équipes doivent sélectionner leurs joueurs avant de démarrer le pick and ban'
      });
    }
    
    // Generate sequence
    const mapPool = match.mapPoolId?.modes ? match.mapPoolId : await MapPool.findById(match.mapPoolId);
    const sequence = generateSequence(match.matchFormat || 'bo3', mapPool?.modes);
    
    match.pickAndBan.sequence = sequence;
    match.pickAndBan.currentStepIndex = 0;
    
    if (sequence.length > 0) {
      // ✅ Automatically assign Team A and B (always: team1 = A, team2 = B)
      match.pickAndBan.teamA = match.team1.teamId;
      match.pickAndBan.teamB = match.team2.teamId;
      
      // ✅ Skip side-selection and go directly to in-progress
      match.pickAndBan.status = 'in-progress';
      
      // Set first turn (Team A starts with first action)
      const firstStep = sequence[0];
      match.pickAndBan.activeTurn = firstStep.teamRole === 'A' ? match.pickAndBan.teamA : match.pickAndBan.teamB;
    } else {
      return res.status(400).json({
        success: false,
        message: `Aucune séquence de pick and ban disponible pour le format ${match.matchFormat}`
      });
    }
    
    await match.save();
    
    res.status(200).json({
      success: true,
      message: 'Pick and ban started directly. Team A (team1) vs Team B (team2).',
      match
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Select side (Team A or Team B)
// @route   POST /api/pick-and-ban/:matchId/select-side
// @access  Private (Captain)
export const selectSide = async (req, res) => {
  try {
    const { teamId, side } = req.body; // side = 'A' or 'B'
    
    if (!['A', 'B'].includes(side)) {
      return res.status(400).json({ success: false, message: 'Side must be A or B' });
    }
    
    const match = await Match.findById(req.params.matchId);
    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found' });
    }
    
    if (match.pickAndBan.status !== 'side-selection') {
      return res.status(400).json({ success: false, message: 'Not in side selection phase' });
    }
    
    const activeTurnId = match.pickAndBan.activeTurn?.toString();
    const team1Id = match.team1.teamId.toString();

    if (activeTurnId && activeTurnId !== teamId.toString()) {
      return res.status(403).json({ success: false, message: 'It is not your turn to select side' });
    }

    if (!activeTurnId && team1Id !== teamId.toString()) {
      return res.status(403).json({ success: false, message: 'Team 1 must select the side' });
    }
    
    const otherTeamId = match.team1.teamId.toString() === teamId.toString() 
      ? match.team2.teamId 
      : match.team1.teamId;
      
    if (side === 'A') {
      match.pickAndBan.teamA = teamId;
      match.pickAndBan.teamB = otherTeamId;
    } else {
      match.pickAndBan.teamB = teamId;
      match.pickAndBan.teamA = otherTeamId;
    }
    
    match.pickAndBan.status = 'in-progress';
    match.pickAndBan.currentStepIndex = -1;
    await advanceSequence(match);
    
    await match.save();
    
    res.status(200).json({
      success: true,
      message: `Team side selected. You are Team ${side}.`,
      match
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Select a map during pick and ban
// @route   POST /api/pick-and-ban/:matchId/pick
// @access  Private (Captain)
export const pickMap = async (req, res) => {
  try {
    const { mapName, mode, teamId } = req.body;
    
    const match = await Match.findById(req.params.matchId).populate('mapPoolId');
    if (!match) return res.status(404).json({ success: false, message: 'Match not found' });
    
    if (match.pickAndBan.status !== 'in-progress') {
      return res.status(400).json({ success: false, message: 'Pick and ban not in progress' });
    }
    
    // Check turn
    if (match.pickAndBan.activeTurn && match.pickAndBan.activeTurn.toString() !== teamId.toString()) {
      return res.status(403).json({ success: false, message: 'It is not your turn' });
    }
    
    // Verify sequence Step
    const currentStep = match.pickAndBan.sequence[match.pickAndBan.currentStepIndex];
    if (currentStep) {
      if (currentStep.action !== 'pick') {
        return res.status(400).json({ success: false, message: 'Current step requires a BAN, not a PICK.' });
      }
      if (currentStep.mode && currentStep.mode !== mode) {
        return res.status(400).json({ success: false, message: `Current step requires picking a map in mode: ${currentStep.mode}` });
      }
    }
    
    const alreadyPicked = match.pickAndBan.selectedMaps.some(m => m.mapName === mapName && (!mode || m.mode === mode));
    const alreadyBanned = match.pickAndBan.bannedMaps.some(m => m.mapName === mapName);
    
    if (alreadyPicked || alreadyBanned) {
      return res.status(400).json({ success: false, message: 'This map is already picked or banned' });
    }
    
    match.pickAndBan.selectedMaps.push({ mode: mode || null, mapName, pickedBy: teamId });
    
    // Advance sequence
    if (currentStep) {
      await advanceSequence(match);
    }
    
    await match.save();
    
    res.status(200).json({ success: true, message: 'Map picked successfully', match });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Ban a map during pick and ban
// @route   POST /api/pick-and-ban/:matchId/ban
// @access  Private (Captain)
export const banMap = async (req, res) => {
  try {
    const { mapName, mode, teamId } = req.body;
    
    const match = await Match.findById(req.params.matchId).populate('mapPoolId');
    if (!match) return res.status(404).json({ success: false, message: 'Match not found' });
    
    if (match.pickAndBan.status !== 'in-progress') {
      return res.status(400).json({ success: false, message: 'Pick and ban not in progress' });
    }
    
    // Check turn
    if (match.pickAndBan.activeTurn && match.pickAndBan.activeTurn.toString() !== teamId.toString()) {
      return res.status(403).json({ success: false, message: 'It is not your turn' });
    }
    
    // Verify sequence Step
    const currentStep = match.pickAndBan.sequence[match.pickAndBan.currentStepIndex];
    if (currentStep) {
      if (currentStep.action !== 'ban') {
        return res.status(400).json({ success: false, message: 'Current step requires a PICK, not a BAN.' });
      }
      if (currentStep.mode && currentStep.mode !== mode) {
        return res.status(400).json({ success: false, message: `Current step requires banning a map in mode: ${currentStep.mode}` });
      }
    }
    
    const alreadyPicked = match.pickAndBan.selectedMaps.some(m => m.mapName === mapName);
    const alreadyBanned = match.pickAndBan.bannedMaps.some(m => m.mapName === mapName);
    
    if (alreadyPicked || alreadyBanned) {
      return res.status(400).json({ success: false, message: 'This map is already picked or banned' });
    }
    
    match.pickAndBan.bannedMaps.push({ mode: mode || null, mapName, bannedBy: teamId });
    
    // Advance sequence
    if (currentStep) {
      await advanceSequence(match);
    }
    
    await match.save();
    
    res.status(200).json({ success: true, message: 'Map banned successfully', match });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Complete pick and ban process
// @route   PUT /api/pick-and-ban/:matchId/complete
// @access  Private (Admin)
export const completePickAndBan = async (req, res) => {
  try {
    const match = await Match.findById(req.params.matchId);
    if (!match) return res.status(404).json({ success: false, message: 'Match not found' });
    
    match.pickAndBan.status = 'completed';
    match.pickAndBan.completedAt = new Date();
    match.pickAndBan.activeTurn = null;
    match.status = 'ongoing';
    
    await match.save();
    res.status(200).json({ success: true, message: 'Pick and ban completed', match });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get match pick and ban status
// @route   GET /api/pick-and-ban/:matchId
// @access  Public
export const getPickAndBanStatus = async (req, res) => {
  try {
    const match = await Match.findById(req.params.matchId)
      .populate('mapPoolId')
      .select('team1 team2 pickAndBan matchFormat mapPoolId');
    if (!match) return res.status(404).json({ success: false, message: 'Match not found' });
    
    res.status(200).json({
      success: true,
      pickAndBan: match.pickAndBan,
      matchFormat: match.matchFormat,
      mapPool: match.mapPoolId,
      teams: {
        team1: match.team1.teamId,
        team2: match.team2.teamId
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
