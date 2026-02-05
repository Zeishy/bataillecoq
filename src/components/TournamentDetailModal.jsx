import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Trophy, 
  Calendar, 
  Users, 
  DollarSign, 
  MapPin, 
  Info,
  Gamepad2,
  Award,
  Clock,
  TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function TournamentDetailModal({ isOpen, onClose, tournament, onRegister }) {
  const [activeTab, setActiveTab] = useState('info');

  if (!tournament) return null;

  const tabs = [
    { id: 'info', label: 'Informations', icon: Info },
    { id: 'teams', label: 'Équipes inscrites', icon: Users },
    { id: 'matches', label: 'Matchs', icon: Gamepad2 },
    { id: 'standings', label: 'Classement', icon: TrendingUp }
  ];

  const getStatusBadge = (status) => {
    const badges = {
      upcoming: { text: 'À venir', class: 'bg-blue-500/20 text-blue-400 border-blue-500/50' },
      ongoing: { text: 'En cours', class: 'bg-green-500/20 text-green-400 border-green-500/50' },
      completed: { text: 'Terminé', class: 'bg-gray-500/20 text-gray-400 border-gray-500/50' },
      cancelled: { text: 'Annulé', class: 'bg-red-500/20 text-red-400 border-red-500/50' }
    };
    return badges[status] || badges.upcoming;
  };

  const getMatchStatusBadge = (status) => {
    const badges = {
      pending: { text: 'À venir', class: 'bg-blue-500/20 text-blue-400' },
      ongoing: { text: 'En cours', class: 'bg-green-500/20 text-green-400' },
      completed: { text: 'Terminé', class: 'bg-gray-500/20 text-gray-400' },
      cancelled: { text: 'Annulé', class: 'bg-red-500/20 text-red-400' }
    };
    return badges[status] || badges.pending;
  };

  const statusBadge = getStatusBadge(tournament.status);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-dark-800 rounded-2xl shadow-2xl max-w-5xl w-full my-8 border border-reunion-green/30"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="relative p-6 border-b border-dark-700">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-12 h-12 bg-gradient-to-br from-reunion-gold to-reunion-red rounded-xl flex items-center justify-center">
                        <Trophy className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">{tournament.name}</h2>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-3 py-1 bg-reunion-green/20 text-reunion-green rounded-full text-xs uppercase font-bold">
                            {tournament.game}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusBadge.class}`}>
                            {statusBadge.text}
                          </span>
                        </div>
                      </div>
                    </div>
                    {tournament.description && (
                      <p className="text-gray-400 text-sm mt-3">{tournament.description}</p>
                    )}
                  </div>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-white transition-colors ml-4"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  <div className="bg-dark-700 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-gray-400 mb-1">
                      <Calendar className="w-4 h-4" />
                      <span className="text-xs">Début</span>
                    </div>
                    <p className="text-white font-bold text-sm">
                      {format(new Date(tournament.startDate), 'dd MMM yyyy', { locale: fr })}
                    </p>
                  </div>
                  <div className="bg-dark-700 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-gray-400 mb-1">
                      <Users className="w-4 h-4" />
                      <span className="text-xs">Équipes</span>
                    </div>
                    <p className="text-white font-bold text-sm">
                      {tournament.registeredTeams?.length || 0} / {tournament.maxTeams}
                    </p>
                  </div>
                  <div className="bg-dark-700 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-gray-400 mb-1">
                      <DollarSign className="w-4 h-4" />
                      <span className="text-xs">Prize Pool</span>
                    </div>
                    <p className="text-reunion-gold font-bold text-sm">{tournament.prizePool}€</p>
                  </div>
                  <div className="bg-dark-700 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-gray-400 mb-1">
                      <MapPin className="w-4 h-4" />
                      <span className="text-xs">Lieu</span>
                    </div>
                    <p className="text-white font-bold text-sm">{tournament.location || 'En ligne'}</p>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="border-b border-dark-700">
                <div className="flex overflow-x-auto">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-6 py-4 font-medium transition-all whitespace-nowrap ${
                          activeTab === tab.id
                            ? 'text-reunion-green border-b-2 border-reunion-green'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Content */}
              <div className="p-6 max-h-[500px] overflow-y-auto">
                {/* Info Tab */}
                {activeTab === 'info' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                        <Info className="w-5 h-5 text-reunion-green" />
                        Détails du tournoi
                      </h3>
                      <div className="bg-dark-700 rounded-lg p-4 space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Format</span>
                          <span className="text-white font-medium">{tournament.format || 'Simple élimination'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Date de début</span>
                          <span className="text-white font-medium">
                            {format(new Date(tournament.startDate), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                          </span>
                        </div>
                        {tournament.endDate && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Date de fin</span>
                            <span className="text-white font-medium">
                              {format(new Date(tournament.endDate), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-gray-400">Places disponibles</span>
                          <span className={`font-bold ${
                            (tournament.registeredTeams?.length || 0) >= tournament.maxTeams
                              ? 'text-red-400'
                              : 'text-green-400'
                          }`}>
                            {tournament.maxTeams - (tournament.registeredTeams?.length || 0)} / {tournament.maxTeams}
                          </span>
                        </div>
                      </div>
                    </div>

                    {tournament.rules && (
                      <div>
                        <h3 className="text-lg font-bold text-white mb-3">Règlement</h3>
                        <div className="bg-dark-700 rounded-lg p-4">
                          <p className="text-gray-300 text-sm whitespace-pre-line">{tournament.rules}</p>
                        </div>
                      </div>
                    )}

                    {tournament.prizes && tournament.prizes.length > 0 && (
                      <div>
                        <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                          <Award className="w-5 h-5 text-reunion-gold" />
                          Récompenses
                        </h3>
                        <div className="space-y-2">
                          {tournament.prizes.map((prize, index) => (
                            <div key={index} className="bg-dark-700 rounded-lg p-3 flex justify-between items-center">
                              <span className="text-gray-300">
                                {index === 0 && '🥇'} {index === 1 && '🥈'} {index === 2 && '🥉'}
                                {index > 2 && `#${index + 1}`} {prize.position}
                              </span>
                              <span className="text-reunion-gold font-bold">{prize.amount}€</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Teams Tab */}
                {activeTab === 'teams' && (
                  <div>
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <Users className="w-5 h-5 text-reunion-green" />
                      Équipes inscrites ({tournament.registeredTeams?.length || 0}/{tournament.maxTeams})
                    </h3>
                    {tournament.registeredTeams && tournament.registeredTeams.length > 0 ? (
                      <div className="grid md:grid-cols-2 gap-3">
                        {tournament.registeredTeams.map((registered, index) => {
                          const team = registered.teamId || registered;
                          return (
                            <div
                              key={team._id || index}
                              className="bg-dark-700 rounded-lg p-4 flex items-center gap-3 hover:bg-dark-600 transition-colors"
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
                                <p className="text-gray-400 text-sm flex items-center gap-2">
                                  <Users className="w-3 h-3" />
                                  {team.players?.length || 0} membres
                                </p>
                              </div>
                              {registered.registeredAt && (
                                <div className="text-right">
                                  <p className="text-xs text-gray-500">
                                    {format(new Date(registered.registeredAt), 'dd/MM', { locale: fr })}
                                  </p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Users className="w-16 h-16 text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-400">Aucune équipe inscrite pour le moment</p>
                        <p className="text-gray-500 text-sm mt-1">Soyez le premier à vous inscrire !</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Matches Tab */}
                {activeTab === 'matches' && (
                  <div>
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <Gamepad2 className="w-5 h-5 text-reunion-green" />
                      Matchs du tournoi
                    </h3>
                    {tournament.matches && tournament.matches.length > 0 ? (
                      <div className="space-y-3">
                        {tournament.matches.map((match) => {
                          const matchStatus = getMatchStatusBadge(match.status);
                          return (
                            <div
                              key={match._id}
                              className="bg-dark-700 rounded-lg p-4 hover:bg-dark-600 transition-colors"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-gray-400 text-sm">Round {match.round}</span>
                                <span className={`px-2 py-1 rounded text-xs font-bold ${matchStatus.class}`}>
                                  {matchStatus.text}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 flex-1">
                                  <div className="text-right flex-1">
                                    <p className="text-white font-bold">
                                      {match.team1?.teamId?.name || 'TBD'}
                                    </p>
                                  </div>
                                  {match.status === 'completed' && (
                                    <div className="bg-dark-800 px-3 py-2 rounded-lg">
                                      <span className={`font-bold ${match.winner?.toString() === match.team1?.teamId?._id?.toString() ? 'text-reunion-green' : 'text-gray-400'}`}>
                                        {match.team1?.score || 0}
                                      </span>
                                      <span className="text-gray-500 mx-2">-</span>
                                      <span className={`font-bold ${match.winner?.toString() === match.team2?.teamId?._id?.toString() ? 'text-reunion-green' : 'text-gray-400'}`}>
                                        {match.team2?.score || 0}
                                      </span>
                                    </div>
                                  )}
                                  <div className="flex-1">
                                    <p className="text-white font-bold">
                                      {match.team2?.teamId?.name || 'TBD'}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              {match.scheduledAt && (
                                <div className="mt-3 pt-3 border-t border-dark-600 flex items-center gap-2 text-xs text-gray-400">
                                  <Clock className="w-3 h-3" />
                                  {format(new Date(match.scheduledAt), "dd MMMM yyyy 'à' HH:mm", { locale: fr })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Gamepad2 className="w-16 h-16 text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-400">Aucun match programmé</p>
                        <p className="text-gray-500 text-sm mt-1">Les matchs seront créés après les inscriptions</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Standings Tab */}
                {activeTab === 'standings' && (
                  <div>
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-reunion-green" />
                      Classement actuel
                    </h3>
                    {tournament.standings && tournament.standings.length > 0 ? (
                      <div className="bg-dark-700 rounded-lg overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-dark-600">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Rang</th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Équipe</th>
                              <th className="px-4 py-3 text-center text-xs font-bold text-gray-400 uppercase">Points</th>
                              <th className="px-4 py-3 text-center text-xs font-bold text-gray-400 uppercase">V</th>
                              <th className="px-4 py-3 text-center text-xs font-bold text-gray-400 uppercase">D</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-dark-600">
                            {tournament.standings
                              .sort((a, b) => a.rank - b.rank)
                              .map((standing, index) => {
                                const team = standing.teamId;
                                return (
                                  <tr key={team?._id || index} className="hover:bg-dark-600 transition-colors">
                                    <td className="px-4 py-3">
                                      <div className="flex items-center gap-2">
                                        {standing.rank === 1 && <span className="text-lg">🥇</span>}
                                        {standing.rank === 2 && <span className="text-lg">🥈</span>}
                                        {standing.rank === 3 && <span className="text-lg">🥉</span>}
                                        <span className="text-white font-bold">{standing.rank}</span>
                                      </div>
                                    </td>
                                    <td className="px-4 py-3">
                                      <div className="flex items-center gap-2">
                                        {team?.logo ? (
                                          <img src={team.logo} alt={team.name} className="w-6 h-6 rounded" />
                                        ) : (
                                          <div className="w-6 h-6 bg-dark-500 rounded flex items-center justify-center text-xs">
                                            {team?.name?.charAt(0) || '?'}
                                          </div>
                                        )}
                                        <span className="text-white font-medium">{team?.name || 'TBD'}</span>
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      <span className="text-reunion-green font-bold">{standing.points || 0}</span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      <span className="text-green-400">{standing.wins || 0}</span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      <span className="text-red-400">{standing.losses || 0}</span>
                                    </td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <TrendingUp className="w-16 h-16 text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-400">Aucun classement disponible</p>
                        <p className="text-gray-500 text-sm mt-1">Le classement sera affiché après les premiers matchs</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              {tournament.status === 'upcoming' && onRegister && (
                <div className="p-6 border-t border-dark-700 bg-dark-700/50">
                  <button
                    onClick={onRegister}
                    disabled={(tournament.registeredTeams?.length || 0) >= tournament.maxTeams}
                    className="w-full px-6 py-3 bg-reunion-green hover:bg-reunion-green/80 text-white rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Trophy className="w-5 h-5" />
                    {(tournament.registeredTeams?.length || 0) >= tournament.maxTeams
                      ? 'Tournoi complet'
                      : 'S\'inscrire au tournoi'}
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
