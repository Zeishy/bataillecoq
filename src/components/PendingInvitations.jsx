import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Check, X, Loader, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from '../api/axios';

const PendingInvitations = ({ userId }) => {
  const [invitations, setInvitations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    if (userId) {
      fetchInvitations();
    }
  }, [userId]);

  const fetchInvitations = async () => {
    try {
      const res = await axios.get('/teams/invitations/pending');
      setInvitations(res.data.invitations || []);
    } catch (error) {
      console.error('Error fetching invitations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async (invitationId, teamName) => {
    setProcessingId(invitationId);
    try {
      const res = await axios.post(`/teams/invitations/${invitationId}/accept`);
      
      if (res.data.success) {
        toast.success(`Vous avez rejoint ${teamName} !`);
        setInvitations(prev => prev.filter(inv => inv._id !== invitationId));
      }
    } catch (error) {
      console.error('Accept error:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de l\'acceptation');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (invitationId, teamName) => {
    setProcessingId(invitationId);
    try {
      const res = await axios.post(`/teams/invitations/${invitationId}/reject`);
      
      if (res.data.success) {
        toast.success(`Invitation de ${teamName} refusée`);
        setInvitations(prev => prev.filter(inv => inv._id !== invitationId));
      }
    } catch (error) {
      console.error('Reject error:', error);
      toast.error(error.response?.data?.message || 'Erreur lors du refus');
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader className="w-6 h-6 animate-spin text-reunion-gold" />
      </div>
    );
  }

  if (invitations.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <div className="bg-gradient-to-r from-reunion-red/10 via-reunion-gold/10 to-reunion-green/10 border border-reunion-gold/30 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Mail className="w-6 h-6 text-reunion-gold" />
          <h3 className="text-xl font-bold text-white">
            Invitations en attente ({invitations.length})
          </h3>
        </div>

        <div className="space-y-3">
          <AnimatePresence>
            {invitations.map(invitation => (
              <motion.div
                key={invitation._id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className="bg-dark-700 rounded-lg p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-reunion-red to-reunion-gold rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">
                      {invitation.team?.name || 'Équipe'}
                    </p>
                    <p className="text-sm text-gray-400">
                      Jeu: {invitation.team?.game || 'N/A'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Invité par {invitation.invitedBy?.username || 'Un membre'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <motion.button
                    onClick={() => handleAccept(invitation._id, invitation.team?.name)}
                    disabled={processingId === invitation._id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-2 bg-reunion-green text-white font-semibold rounded-lg hover:bg-green-600 transition disabled:opacity-50 flex items-center gap-2"
                  >
                    {processingId === invitation._id ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Accepter
                      </>
                    )}
                  </motion.button>

                  <motion.button
                    onClick={() => handleReject(invitation._id, invitation.team?.name)}
                    disabled={processingId === invitation._id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition disabled:opacity-50 flex items-center gap-2"
                  >
                    {processingId === invitation._id ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <X className="w-4 h-4" />
                        Refuser
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default PendingInvitations;
