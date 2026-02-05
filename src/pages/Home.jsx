import { motion } from 'framer-motion';
import { Users, Trophy, Target, DollarSign, TrendingUp, Calendar } from 'lucide-react';
import { mockStats, mockTournaments, mockTeams, mockPlayers, mockNews } from '../data/mockData';
import { Link } from 'react-router-dom';

const Home = () => {
  const upcomingTournaments = mockTournaments.filter(t => t.status === 'upcoming').slice(0, 3);
  const topTeams = mockTeams.slice(0, 3);
  const topPlayers = mockPlayers.slice(0, 3);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen pt-20 pb-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-reunion-red/10 via-transparent to-reunion-blue/10" />
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="container mx-auto text-center relative z-10"
        >
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            Bienvenue sur <span className="text-gradient">BatailleCoq</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
            La plateforme esport n°1 de la Réunion. Rejoignez la bataille, montrez vos compétences !
          </p>
          
          {/* Stats Cards */}
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto mt-12"
          >
            <motion.div variants={item} className="bg-dark-800 p-6 rounded-lg border border-reunion-red/20 card-glow">
              <Users className="mx-auto mb-2 text-reunion-gold" size={32} />
              <div className="text-3xl font-bold text-white">{mockStats.totalPlayers}</div>
              <div className="text-sm text-gray-400">Joueurs</div>
            </motion.div>
            
            <motion.div variants={item} className="bg-dark-800 p-6 rounded-lg border border-reunion-green/20 card-glow">
              <Trophy className="mx-auto mb-2 text-reunion-green" size={32} />
              <div className="text-3xl font-bold text-white">{mockStats.totalTeams}</div>
              <div className="text-sm text-gray-400">Équipes</div>
            </motion.div>
            
            <motion.div variants={item} className="bg-dark-800 p-6 rounded-lg border border-reunion-blue/20 card-glow">
              <Target className="mx-auto mb-2 text-reunion-blue" size={32} />
              <div className="text-3xl font-bold text-white">{mockStats.activeTournaments}</div>
              <div className="text-sm text-gray-400">Tournois Actifs</div>
            </motion.div>
            
            <motion.div variants={item} className="bg-dark-800 p-6 rounded-lg border border-reunion-gold/20 card-glow">
              <DollarSign className="mx-auto mb-2 text-reunion-gold" size={32} />
              <div className="text-3xl font-bold text-white">{mockStats.totalPrizePool}</div>
              <div className="text-sm text-gray-400">Prize Pool Total</div>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      <div className="container mx-auto px-4">
        {/* Upcoming Tournaments */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold flex items-center">
              <Trophy className="mr-2 text-reunion-gold" />
              Prochains Tournois
            </h2>
            <Link to="/tournaments" className="text-reunion-gold hover:text-reunion-red transition-colors">
              Voir tout →
            </Link>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {upcomingTournaments.map((tournament, index) => (
              <motion.div
                key={tournament.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-dark-800 rounded-lg overflow-hidden border border-reunion-blue/20 card-glow"
              >
                <div className="h-48 bg-gradient-to-br from-reunion-red/20 to-reunion-blue/20 flex items-center justify-center">
                  <Trophy size={64} className="text-reunion-gold" />
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-3 py-1 bg-reunion-blue/20 text-reunion-blue rounded-full text-sm">
                      {tournament.game}
                    </span>
                    <span className="text-reunion-gold font-bold">{tournament.prizePool}</span>
                  </div>
                  <h3 className="text-xl font-bold mb-2">{tournament.name}</h3>
                  <div className="flex items-center text-sm text-gray-400 mb-2">
                    <Calendar size={16} className="mr-1" />
                    {tournament.startDate}
                  </div>
                  <div className="flex items-center text-sm text-gray-400 mb-4">
                    <Users size={16} className="mr-1" />
                    {tournament.teams} équipes
                  </div>
                  <button className="w-full bg-reunion-red hover:bg-reunion-red/80 text-white py-2 rounded-lg font-medium transition-colors">
                    S'inscrire
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Top Teams and Players */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {/* Top Teams */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold flex items-center">
                <Users className="mr-2 text-reunion-green" />
                Top 3 Équipes
              </h2>
              <Link to="/rankings" className="text-reunion-gold hover:text-reunion-red transition-colors">
                Voir classement →
              </Link>
            </div>
            
            <div className="space-y-4">
              {topTeams.map((team, index) => (
                <motion.div
                  key={team.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-dark-800 p-4 rounded-lg border border-reunion-green/20 card-glow flex items-center"
                >
                  <div className={`text-4xl mr-4 ${
                    index === 0 ? 'text-reunion-gold' :
                    index === 1 ? 'text-gray-400' :
                    'text-reunion-red'
                  }`}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center mb-1">
                      <span className="text-2xl mr-2">{team.logo}</span>
                      <h3 className="text-xl font-bold">{team.name}</h3>
                    </div>
                    <div className="flex items-center text-sm text-gray-400">
                      <span className="mr-4">{team.game}</span>
                      <Users size={14} className="mr-1" />
                      {team.members.length} membres
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-reunion-gold">{team.points}</div>
                    <div className="text-xs text-gray-400">points</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Top Players */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold flex items-center">
                <TrendingUp className="mr-2 text-reunion-red" />
                Top 3 Joueurs
              </h2>
              <Link to="/rankings" className="text-reunion-gold hover:text-reunion-red transition-colors">
                Voir classement →
              </Link>
            </div>
            
            <div className="space-y-4">
              {topPlayers.map((player, index) => (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-dark-800 p-4 rounded-lg border border-reunion-red/20 card-glow flex items-center"
                >
                  <div className={`text-4xl mr-4 ${
                    index === 0 ? 'text-reunion-gold' :
                    index === 1 ? 'text-gray-400' :
                    'text-reunion-red'
                  }`}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-1">{player.name}</h3>
                    <div className="flex items-center text-sm text-gray-400">
                      <span className="mr-4">{player.game}</span>
                      <span className="mr-2">KDA: {player.kda}</span>
                      <span>WR: {player.winrate}%</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-reunion-gold">{player.points}</div>
                    <div className="text-xs text-gray-400">points</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        </div>

        {/* News Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6 flex items-center">
            <Calendar className="mr-2 text-reunion-blue" />
            Dernières Actualités
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            {mockNews.map((news, index) => (
              <motion.div
                key={news.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-dark-800 p-6 rounded-lg border border-reunion-gold/20 card-glow"
              >
                <div className="text-sm text-reunion-gold mb-2">{news.date}</div>
                <h3 className="text-xl font-bold mb-2">{news.title}</h3>
                <p className="text-gray-400">{news.excerpt}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center py-16 bg-gradient-to-r from-reunion-red/10 via-reunion-gold/10 to-reunion-green/10 rounded-2xl">
          <h2 className="text-4xl font-bold mb-4">Prêt à rejoindre la bataille ?</h2>
          <p className="text-xl text-gray-300 mb-8">Créez votre équipe ou inscrivez-vous à un tournoi dès maintenant !</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/teams"
              className="px-8 py-3 bg-reunion-red hover:bg-reunion-red/80 text-white rounded-lg font-bold transition-colors"
            >
              Créer une équipe
            </Link>
            <Link
              to="/tournaments"
              className="px-8 py-3 bg-reunion-gold hover:bg-reunion-gold/80 text-dark-900 rounded-lg font-bold transition-colors"
            >
              Voir les tournois
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;
