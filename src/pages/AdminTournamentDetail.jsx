import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Trophy, 
  Users, 
  Gamepad2, 
  Settings, 
  Check, 
  X, 
  Calendar,
  Loader,
  Trash2,
  Play,
  StopCircle,
  Sparkles,
  GitBranch
} from 'lucide-react';
import toast from 'react-hot-toast';
import tournamentService from '../services/tournamentService';
import matchService from '../services/matchService';
import TournamentBracket from '../components/TournamentBracket';
import MatchScoreModal from '../components/MatchScoreModal';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const AdminTournamentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [matches, setMatches] = useState([]);
  const [selectedRound, setSelectedRound] = useState('all');
  const [bracket, setBracket] = useState(null);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [showScoreModal, setShowScoreModal] = useState(false);

  const tabs = [
    { id: 'overview', label: 'Aperçu', icon: Trophy },
    { id: 'teams', label: 'Équipes', icon: Users },
    { id: 'matches', label: 'Matchs', icon: Gamepad2 },
    { id: 'bracket', label: 'Bracket', icon: GitBranch },
    { id: 'settings', label: 'Paramètres', icon: Settings }
  ];

  useEffect(() => {
    fetchTournament();
  }, [id]);

  useEffect(() => {
    if (activeTab === 'matches') {
      fetchMatches();
    }
    if (activeTab === 'bracket') {
      fetchBracket();
    }
  }, [activeTab, id]);

  const fetchTournament = async () => {
    try {
      const data = await tournamentService.getTournamentById(id);
      console.log('Tournament data:', data);
      console.log('Tournament standings:', data.tournament?.standings);
      setTournament(data.tournament);
    } catch (error) {
      console.error('Error fetching tournament:', error);
      toast.error('Impossible de charger le tournoi');
      navigate('/admin/tournaments');
    } finally {
      setLoading(false);
    }
  };

  const fetchMatches = async () => {
    try {
      const data = await tournamentService.getMatches(id);
      console.log('Matches data:', data);
      setMatches(data.matches || []);
    } catch (error) {
      console.error('Error fetching matches:', error);
      setMatches([]);
    }
  };

  const fetchBracket = async () => {
    try {
      const data = await tournamentService.getBracket(id);
      console.log('Bracket data:', data);
      setBracket(data.bracket);
    } catch (error) {
      console.log('No bracket yet or error:', error);
      setBracket(null);
    }
  };

  const handleApproveTeam = async (teamId) => {
    try {
      await tournamentService.approveTeam(id, teamId);
      toast.success('Équipe approuvée avec succès!', {
        icon: '✅',
        duration: 3000,
        style: {
          background: '#10B981',
          color: '#fff',
        }
      });
      fetchTournament();
    } catch (error) {
      console.error('Error approving team:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de l\'approbation');
    }
  };

  const handleRejectTeam = async (teamId) => {
    try {
      await tournamentService.rejectTeam(id, teamId);
      toast.success('Équipe rejetée');
      fetchTournament();
    } catch (error) {
      console.error('Error rejecting team:', error);
      toast.error(error.response?.data?.message || 'Erreur lors du rejet');
    }
  };

  const handleGenerateSchedule = async () => {
    const loadingToast = toast.loading('Génération du planning en cours...');
    
    try {
      await tournamentService.generateSchedule(id);
      toast.success('Planning généré avec succès! 🎉', {
        id: loadingToast,
        duration: 4000,
        icon: '🏆',
        style: {
          background: '#10B981',
          color: '#fff',
        }
      });
      fetchTournament();
      fetchMatches();
      fetchBracket(); // Refresh bracket after schedule generation
      setActiveTab('matches');
    } catch (error) {
      console.error('Error generating schedule:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la génération du planning', {
        id: loadingToast
      });
    }
  };

  const handleStartTournament = async () => {
    try {
      await tournamentService.startTournament(id);
      toast.success('Tournoi démarré! 🎮');
      fetchTournament();
    } catch (error) {
      console.error('Error starting tournament:', error);
      toast.error(error.response?.data?.message || 'Erreur lors du démarrage');
    }
  };

  const handleEndTournament = async () => {
    try {
      await tournamentService.endTournament(id);
      toast.success('Tournoi terminé! 🏆');
      fetchTournament();
    } catch (error) {
      console.error('Error ending tournament:', error);
      toast.error(error.response?.data?.message || 'Erreur');
    }
  };

  const handleCancelTournament = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir annuler ce tournoi?')) return;
    
    try {
      await tournamentService.cancelTournament(id);
      toast.success('Tournoi annulé');
      navigate('/admin/tournaments');
    } catch (error) {
      console.error('Error canceling tournament:', error);
      toast.error(error.response?.data?.message || 'Erreur');
    }
  };

  const handleMatchClick = (match) => {
    // Only allow score update if match has a matchId and tournament is ongoing
    if (match.matchId && tournament.status === 'ongoing' && match.team1?._id && match.team2?._id) {
      setSelectedMatch(match);
      setShowScoreModal(true);
    } else if (!match.matchId) {
      toast.error('Ce match n\'est pas encore créé. Les équipes doivent d\'abord gagner les matchs précédents.');
    } else if (tournament.status !== 'ongoing') {
      toast.error('Le tournoi doit être en cours pour modifier les scores.');
    }
  };

  const handleSaveScore = async (scoreData) => {
    try {
      const loadingToast = toast.loading('Sauvegarde du score...');
      
      const result = await matchService.updateScoreAndAdvance(scoreData.matchId, scoreData);
      
      toast.success('Score enregistré! Bracket mis à jour! 🎉', { id: loadingToast });
      
      // Refresh tournament and bracket data
      await fetchTournament();
      await fetchBracket();
      await fetchMatches();
      
      // Check if tournament is completed
      if (result.tournamentStatus === 'completed') {
        toast.success('🏆 Tournoi terminé! Le gagnant est déterminé!', {
          duration: 5000,
          style: {
            background: '#FFD700',
            color: '#000',
            fontWeight: 'bold'
          }
        });
      }
      
      setShowScoreModal(false);
      setSelectedMatch(null);
    } catch (error) {
      console.error('Error saving score:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la sauvegarde du score');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      upcoming: { text: 'À venir', class: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
      ongoing: { text: 'En cours', class: 'bg-green-500/20 text-green-400 border-green-500/30' },
      completed: { text: 'Terminé', class: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
      cancelled: { text: 'Annulé', class: 'bg-red-500/20 text-red-400 border-red-500/30' }
    };
    return badges[status] || badges.upcoming;
  };

  const getTeamStatusBadge = (status) => {
    const badges = {
      registered: { text: 'En attente', class: 'bg-yellow-500/20 text-yellow-400', icon: Loader },
      confirmed: { text: 'Approuvée', class: 'bg-green-500/20 text-green-400', icon: Check },
      eliminated: { text: 'Éliminée', class: 'bg-gray-500/20 text-gray-400', icon: X },
      withdrawn: { text: 'Retirée', class: 'bg-red-500/20 text-red-400', icon: X }
    };
    return badges[status] || badges.registered;
  };

  const getMatchStatusBadge = (status) => {
    const badges = {
      pending: { text: 'À venir', class: 'bg-blue-500/20 text-blue-400' },
      ongoing: { text: 'En cours', class: 'bg-green-500/20 text-green-400' },
      completed: { text: 'Terminé', class: 'bg-gray-500/20 text-gray-400' }
    };
    return badges[status] || badges.pending;
  };

  const getRounds = () => {
    if (!matches || matches.length === 0) return [];
    const rounds = [...new Set(matches.map(m => m.round))].sort();
    return rounds;
  };

  const filteredMatches = selectedRound === 'all' 
    ? matches 
    : matches.filter(m => m.round === selectedRound);

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <Loader className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <p className="text-gray-400">Tournoi introuvable</p>
      </div>
    );
  }

  const statusBadge = getStatusBadge(tournament.status);
  const approvedTeams = tournament.registeredTeams?.filter(t => t.status === 'confirmed') || [];
  const pendingTeams = tournament.registeredTeams?.filter(t => t.status === 'registered') || [];

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => navigate('/admin/tournaments')}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour aux tournois
          </button>

          <div className="bg-dark-800 rounded-lg border border-dark-700 p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-white mb-2">{tournament.name}</h1>
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-3 py-1 bg-primary-500/20 text-primary-400 rounded-full text-sm uppercase font-bold">
                    {tournament.game}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold border ${statusBadge.class}`}>
                    {statusBadge.text}
                  </span>
                </div>
                {tournament.description && (
                  <p className="text-gray-400">{tournament.description}</p>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-dark-700 rounded-lg p-4">
                <div className="text-gray-400 text-sm mb-1">Date de début</div>
                <div className="text-white font-bold">
                  {format(new Date(tournament.startDate), 'dd MMM yyyy', { locale: fr })}
                </div>
              </div>
              <div className="bg-dark-700 rounded-lg p-4">
                <div className="text-gray-400 text-sm mb-1">Équipes</div>
                <div className="text-white font-bold">
                  {approvedTeams.length} / {tournament.maxTeams}
                </div>
              </div>
              <div className="bg-dark-700 rounded-lg p-4">
                <div className="text-gray-400 text-sm mb-1">Matchs</div>
                <div className="text-white font-bold">
                  {matches.length || 0}
                </div>
              </div>
              <div className="bg-dark-700 rounded-lg p-4">
                <div className="text-gray-400 text-sm mb-1">Prize Pool</div>
                <div className="text-primary-400 font-bold">
                  {tournament.prizePool?.toLocaleString() || 0} €
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="bg-dark-800 rounded-lg border border-dark-700 mb-6">
          <div className="flex overflow-x-auto border-b border-dark-700">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 font-medium transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'text-primary-400 border-b-2 border-primary-400'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                  {tab.id === 'teams' && pendingTeams.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                      {pendingTeams.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white mb-4">Informations générales</h3>
                  <div className="bg-dark-700 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Format</span>
                      <span className="text-white font-medium capitalize">
                        {tournament.format?.replace('-', ' ') || 'Simple élimination'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Date de début</span>
                      <span className="text-white">
                        {format(new Date(tournament.startDate), 'dd MMMM yyyy', { locale: fr })}
                      </span>
                    </div>
                    {tournament.endDate && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Date de fin</span>
                        <span className="text-white">
                          {format(new Date(tournament.endDate), 'dd MMMM yyyy', { locale: fr })}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-400">Équipes max</span>
                      <span className="text-white">{tournament.maxTeams}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Équipes approuvées</span>
                      <span className="text-green-400 font-bold">{approvedTeams.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">En attente</span>
                      <span className="text-yellow-400 font-bold">{pendingTeams.length}</span>
                    </div>
                  </div>
                </div>

                {tournament.rules && (
                  <div>
                    <h3 className="text-lg font-bold text-white mb-4">Règlement</h3>
                    <div className="bg-dark-700 rounded-lg p-4">
                      <p className="text-gray-300 whitespace-pre-line">{tournament.rules}</p>
                    </div>
                  </div>
                )}
                
                {/* Winner and Top 3 - Only show if tournament is completed */}
                {tournament.status === 'completed' && tournament.winner && (
                  <div>
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <Trophy className="w-6 h-6 text-yellow-400" />
                      Podium Final
                    </h3>
                    <div className="space-y-4">
                      {tournament.standings
                        .filter(s => s.teamId)
                        .sort((a, b) => a.rank - b.rank)
                        .slice(0, 3)
                        .map((standing, index) => {
                          const team = tournament.registeredTeams.find(
                            rt => rt.teamId?._id?.toString() === standing.teamId?.toString()
                          )?.teamId;
                          
                          if (!team) return null;

                          const medals = ['🥇', '🥈', '🥉'];
                          const colors = [
                            'from-yellow-400 to-yellow-600',
                            'from-gray-300 to-gray-500',
                            'from-orange-400 to-orange-600'
                          ];
                          
                          return (
                            <motion.div
                              key={standing._id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className={`bg-gradient-to-r ${colors[index]} rounded-lg p-6 flex items-center gap-4 shadow-lg`}
                            >
                              <div className="text-6xl">{medals[index]}</div>
                              <div className="flex items-center gap-3 flex-1">
                                {team.logo && (
                                  <img src={team.logo} alt={team.name} className="w-16 h-16 rounded-lg" />
                                )}
                                <div>
                                  <h4 className="text-2xl font-bold text-white">{team.name}</h4>
                                  <p className="text-sm text-white/80">Position #{standing.rank}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-3xl font-bold text-white">{standing.points}</div>
                                <div className="text-sm text-white/80">points</div>
                              </div>
                            </motion.div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Teams Tab */}
            {activeTab === 'teams' && (
              <div className="space-y-6">
                {/* Pending Teams */}
                {pendingTeams.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <Loader className="w-5 h-5 text-yellow-400" />
                      Équipes en attente ({pendingTeams.length})
                    </h3>
                    <div className="space-y-3">
                      {pendingTeams.map((registered) => {
                        const team = registered.teamId || registered;
                        const badge = getTeamStatusBadge(registered.status);
                        
                        return (
                          <div
                            key={team._id}
                            className="bg-dark-700 rounded-lg p-4 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-4">
                              {team.logo ? (
                                <img src={team.logo} alt={team.name} className="w-12 h-12 rounded-lg object-cover" />
                              ) : (
                                <div className="w-12 h-12 bg-dark-600 rounded-lg flex items-center justify-center text-2xl">
                                  {team.name?.charAt(0) || '?'}
                                </div>
                              )}
                              <div>
                                <h4 className="text-white font-bold">{team.name}</h4>
                                <p className="text-gray-400 text-sm">
                                  {team.players?.length || 0} membres
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`px-3 py-1 rounded-full text-sm ${badge.class}`}>
                                {badge.text}
                              </span>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleApproveTeam(team._id)}
                                  className="p-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors"
                                  title="Approuver"
                                >
                                  <Check className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => handleRejectTeam(team._id)}
                                  className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                                  title="Rejeter"
                                >
                                  <X className="w-5 h-5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Approved Teams */}
                <div>
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-400" />
                    Équipes approuvées ({approvedTeams.length})
                  </h3>
                  {approvedTeams.length > 0 ? (
                    <div className="grid md:grid-cols-2 gap-3">
                      {approvedTeams.map((registered) => {
                        const team = registered.teamId || registered;
                        
                        return (
                          <div
                            key={team._id}
                            className="bg-dark-700 rounded-lg p-4 flex items-center gap-4"
                          >
                            {team.logo ? (
                              <img src={team.logo} alt={team.name} className="w-12 h-12 rounded-lg object-cover" />
                            ) : (
                              <div className="w-12 h-12 bg-dark-600 rounded-lg flex items-center justify-center text-2xl">
                                {team.name?.charAt(0) || '?'}
                              </div>
                            )}
                            <div className="flex-1">
                              <h4 className="text-white font-bold">{team.name}</h4>
                              <p className="text-gray-400 text-sm">
                                {team.players?.length || 0} membres
                              </p>
                            </div>
                            <Check className="w-5 h-5 text-green-400" />
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-dark-700 rounded-lg">
                      <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-400">Aucune équipe approuvée</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Matches Tab */}
            {activeTab === 'matches' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Gamepad2 className="w-5 h-5 text-primary-400" />
                    Matchs du tournoi ({matches.length})
                  </h3>
                  
                  {getRounds().length > 0 && (
                    <select
                      value={selectedRound}
                      onChange={(e) => setSelectedRound(e.target.value)}
                      className="px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white"
                    >
                      <option value="all">Tous les rounds</option>
                      {getRounds().map((round) => (
                        <option key={round} value={round}>
                          Round {round}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {matches.length > 0 ? (
                  <div className="space-y-4">
                    {filteredMatches.map((match) => {
                      const matchBadge = getMatchStatusBadge(match.status);
                      // Extract team data from the nested structure
                      const team1 = match.team1?.teamId || match.team1Id || match.team1;
                      const team2 = match.team2?.teamId || match.team2Id || match.team2;
                      
                      return (
                        <div
                          key={match._id}
                          className="bg-dark-700 rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400 font-medium">Round {match.round}</span>
                              {match.matchNumber && (
                                <span className="text-gray-500">• Match {match.matchNumber}</span>
                              )}
                            </div>
                            <span className={`px-3 py-1 rounded-full text-sm ${matchBadge.class}`}>
                              {matchBadge.text}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex-1 flex items-center gap-3">
                              {team1?.logo && (
                                <img src={team1.logo} alt={team1.name} className="w-10 h-10 rounded-lg object-cover" />
                              )}
                              <span className="text-white font-bold">{team1?.name || 'TBD'}</span>
                            </div>

                            <div className="px-6 py-2 bg-dark-800 rounded-lg">
                              <span className="text-white font-bold text-lg">
                                {match.team1?.score ?? match.score1 ?? '-'} : {match.team2?.score ?? match.score2 ?? '-'}
                              </span>
                            </div>

                            <div className="flex-1 flex items-center justify-end gap-3">
                              <span className="text-white font-bold">{team2?.name || 'TBD'}</span>
                              {team2?.logo && (
                                <img src={team2.logo} alt={team2.name} className="w-10 h-10 rounded-lg object-cover" />
                              )}
                            </div>
                          </div>

                          {match.scheduledDate && (
                            <div className="mt-3 flex items-center gap-2 text-gray-400 text-sm">
                              <Calendar className="w-4 h-4" />
                              {format(new Date(match.scheduledDate), 'dd MMM yyyy à HH:mm', { locale: fr })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-dark-700 rounded-lg">
                    <Gamepad2 className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">Aucun match pour le moment</p>
                    <p className="text-gray-500 text-sm mt-1">
                      Générez le planning pour créer les matchs
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Bracket Tab */}
            {activeTab === 'bracket' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white">Bracket d'élimination</h3>
                  {!bracket && tournament.matches && tournament.matches.length > 0 && (
                    <button
                      onClick={async () => {
                        try {
                          await tournamentService.generateBracket(id);
                          toast.success('Bracket généré avec succès!');
                          fetchBracket();
                        } catch (error) {
                          toast.error('Erreur lors de la génération du bracket');
                        }
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold transition-colors"
                    >
                      <GitBranch className="w-4 h-4" />
                      Générer le bracket
                    </button>
                  )}
                </div>

                {bracket ? (
                  <TournamentBracket 
                    bracket={bracket} 
                    onMatchClick={handleMatchClick}
                  />
                ) : (
                  <div className="bg-dark-700 rounded-lg p-8 text-center">
                    <GitBranch className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400 mb-2">Aucun bracket disponible</p>
                    <p className="text-gray-500 text-sm">
                      {tournament.matches && tournament.matches.length > 0 
                        ? 'Le bracket sera généré automatiquement avec le planning, ou cliquez sur "Générer le bracket"'
                        : 'Générez d\'abord le planning des matchs pour créer le bracket'}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                {/* Tournament Planning */}
                <div>
                  <h3 className="text-lg font-bold text-white mb-4">Planning du tournoi</h3>
                  <div className="bg-dark-700 rounded-lg p-6">
                    <p className="text-gray-400 mb-4">
                      Générez automatiquement le planning des matchs pour ce tournoi.
                      {approvedTeams.length < 2 && (
                        <span className="block mt-2 text-yellow-400">
                          ⚠️ Au moins 2 équipes approuvées sont nécessaires
                        </span>
                      )}
                    </p>
                    <button
                      onClick={handleGenerateSchedule}
                      disabled={approvedTeams.length < 2}
                      className="flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Sparkles className="w-5 h-5" />
                      Générer le planning
                    </button>
                  </div>
                </div>

                {/* Tournament Status */}
                <div>
                  <h3 className="text-lg font-bold text-white mb-4">Gestion du statut</h3>
                  <div className="bg-dark-700 rounded-lg p-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Statut actuel</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-bold border ${statusBadge.class}`}>
                        {statusBadge.text}
                      </span>
                    </div>

                    <div className="flex gap-3 pt-4">
                      {tournament.status === 'upcoming' && (
                        <button
                          onClick={handleStartTournament}
                          className="flex items-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors"
                        >
                          <Play className="w-4 h-4" />
                          Démarrer le tournoi
                        </button>
                      )}
                      
                      {tournament.status === 'ongoing' && (
                        <>
                          <button
                            onClick={handleEndTournament}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors"
                          >
                            <StopCircle className="w-4 h-4" />
                            Terminer le tournoi
                          </button>
                        </>
                      )}
                      
                      {tournament.status !== 'cancelled' && tournament.status !== 'completed' && (
                        <button
                          onClick={handleCancelTournament}
                          className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                          Annuler le tournoi
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Danger Zone */}
                <div>
                  <h3 className="text-lg font-bold text-red-400 mb-4">Zone de danger</h3>
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6">
                    <p className="text-gray-400 mb-4">
                      Supprimer définitivement ce tournoi. Cette action est irréversible.
                    </p>
                    <button
                      onClick={handleCancelTournament}
                      className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Supprimer le tournoi
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Match Score Modal */}
      <MatchScoreModal
        match={selectedMatch}
        isOpen={showScoreModal}
        onClose={() => {
          setShowScoreModal(false);
          setSelectedMatch(null);
        }}
        onSave={handleSaveScore}
      />
    </div>
  );
};

export default AdminTournamentDetail;
