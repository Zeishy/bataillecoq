import { useState } from 'react';
import { X, UserPlus, Search, Loader } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import axios from '../api/axios';

const InvitePlayerModal = ({ isOpen, onClose, teamId, teamName }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!searchTerm.trim()) {
      toast.error('Entrez un nom d\'utilisateur');
      return;
    }

    setIsSearching(true);
    try {
      const res = await axios.get(`/users/search?q=${searchTerm}`);
      setSearchResults(res.data.users || []);
      
      if (res.data.users?.length === 0) {
        toast.error('Aucun joueur trouvé');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Erreur lors de la recherche');
    } finally {
      setIsSearching(false);
    }
  };

  const handleInvite = async (userId, username) => {
    setIsSending(true);
    try {
      const res = await axios.post(`/teams/${teamId}/invite`, { userId });
      
      if (res.data.success) {
        toast.success(`Invitation envoyée à ${username}`);
        setSearchTerm('');
        setSearchResults([]);
        onClose();
      }
    } catch (error) {
      console.error('Invite error:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de l\'invitation');
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-dark-800 rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-reunion-red via-reunion-gold to-reunion-green p-[2px]">
            <div className="bg-dark-800 p-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <UserPlus className="w-6 h-6 text-reunion-gold" />
                  <h2 className="text-2xl font-bold text-white">Inviter un joueur</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-dark-700 rounded-lg transition"
                >
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>
              <p className="text-gray-400 mt-2">
                Invitez des joueurs à rejoindre <span className="text-reunion-gold font-semibold">{teamName}</span>
              </p>
            </div>
          </div>

          {/* Search Form */}
          <div className="p-6 space-y-4">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Rechercher par nom d'utilisateur..."
                  className="w-full pl-10 pr-4 py-3 bg-dark-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-reunion-gold transition"
                />
              </div>
              <motion.button
                type="submit"
                disabled={isSearching}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 bg-reunion-gold text-dark-900 font-semibold rounded-lg hover:bg-yellow-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSearching ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : (
                  'Rechercher'
                )}
              </motion.button>
            </form>

            {/* Search Results */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {searchResults.length > 0 ? (
                searchResults.map(user => (
                  <motion.div
                    key={user._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-4 bg-dark-700 rounded-lg hover:bg-dark-600 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-reunion-red to-reunion-gold rounded-full flex items-center justify-center text-white font-bold">
                        {user.username?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-white">{user.username}</p>
                        <p className="text-sm text-gray-400">{user.email}</p>
                      </div>
                    </div>
                    <motion.button
                      onClick={() => handleInvite(user._id, user.username)}
                      disabled={isSending}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-4 py-2 bg-reunion-green text-white font-semibold rounded-lg hover:bg-green-600 transition disabled:opacity-50"
                    >
                      {isSending ? (
                        <Loader className="w-5 h-5 animate-spin" />
                      ) : (
                        'Inviter'
                      )}
                    </motion.button>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Recherchez un joueur pour l'inviter</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default InvitePlayerModal;
