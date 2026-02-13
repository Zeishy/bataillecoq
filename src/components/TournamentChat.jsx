import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, MessageCircle, Loader, Edit2, Trash2, Reply, Wifi, WifiOff } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const TournamentChat = ({ tournamentId, tournamentName }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const { user, isAuthenticated } = useAuth();
  const { socket, connected } = useSocket();

  useEffect(() => {
    if (tournamentId) {
      fetchMessages();
    }
  }, [tournamentId]);

  // WebSocket effects
  useEffect(() => {
    if (!socket || !tournamentId) return;

    // Join tournament room
    socket.emit('tournament:join', tournamentId);

    // Listen for new messages
    const handleNewMessage = (data) => {
      if (data.message && data.message.tournament === tournamentId) {
        setMessages(prev => {
          // Avoid duplicates
          const exists = prev.some(m => m._id === data.message._id);
          if (exists) return prev;
          return [...prev, data.message];
        });
      }
    };

    // Listen for edited messages
    const handleEditedMessage = (data) => {
      setMessages(prev => prev.map(msg =>
        msg._id === data.message._id ? data.message : msg
      ));
    };

    // Listen for deleted messages
    const handleDeletedMessage = (data) => {
      setMessages(prev => prev.filter(msg => msg._id !== data.messageId));
    };

    // Listen for typing indicators
    const handleTyping = (data) => {
      if (data.tournamentId === tournamentId && data.userId !== user?._id) {
        if (data.isTyping) {
          setTypingUsers(prev => new Set([...prev, data.username]));
          // Remove after 3 seconds
          setTimeout(() => {
            setTypingUsers(prev => {
              const updated = new Set(prev);
              updated.delete(data.username);
              return updated;
            });
          }, 3000);
        } else {
          setTypingUsers(prev => {
            const updated = new Set(prev);
            updated.delete(data.username);
            return updated;
          });
        }
      }
    };

    socket.on('message:new', handleNewMessage);
    socket.on('message:edited', handleEditedMessage);
    socket.on('message:deleted', handleDeletedMessage);
    socket.on('user:typing', handleTyping);

    // Cleanup
    return () => {
      socket.emit('tournament:leave', tournamentId);
      socket.off('message:new', handleNewMessage);
      socket.off('message:edited', handleEditedMessage);
      socket.off('message:deleted', handleDeletedMessage);
      socket.off('user:typing', handleTyping);
    };
  }, [socket, tournamentId, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleTyping = () => {
    if (!socket || !connected) return;

    // Emit typing event
    socket.emit('tournament:typing', {
      tournamentId,
      isTyping: true
    });

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to emit not typing after 2 seconds
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('tournament:typing', {
        tournamentId,
        isTyping: false
      });
    }, 2000);
  };

  const fetchMessages = async () => {
    try {
      const res = await axios.get(`/messages/tournament/${tournamentId}`);
      if (res.data.success) {
        setMessages(res.data.messages || []);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim()) {
      toast.error('Le message ne peut pas être vide');
      return;
    }

    if (!isAuthenticated) {
      toast.error('Vous devez être connecté pour envoyer un message');
      return;
    }

    setIsSending(true);
    try {
      const res = await axios.post('/messages', {
        tournament: tournamentId,
        content: newMessage.trim(),
        type: 'tournament',
        replyTo: replyingTo?._id
      });

      if (res.data.success) {
        setMessages(prev => [...prev, res.data.message]);
        setNewMessage('');
        setReplyingTo(null);
        toast.success('Message envoyé');
      }
    } catch (error) {
      console.error('Send message error:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de l\'envoi');
    } finally {
      setIsSending(false);
    }
  };

  const handleEditMessage = async (messageId) => {
    if (!editContent.trim()) {
      toast.error('Le message ne peut pas être vide');
      return;
    }

    try {
      const res = await axios.put(`/messages/${messageId}`, {
        content: editContent.trim()
      });

      if (res.data.success) {
        setMessages(prev =>
          prev.map(msg => (msg._id === messageId ? res.data.message : msg))
        );
        setEditingId(null);
        setEditContent('');
        toast.success('Message modifié');
      }
    } catch (error) {
      console.error('Edit message error:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la modification');
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) return;

    try {
      const res = await axios.delete(`/messages/${messageId}`);

      if (res.data.success) {
        setMessages(prev => prev.filter(msg => msg._id !== messageId));
        toast.success('Message supprimé');
      }
    } catch (error) {
      console.error('Delete message error:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const startEditing = (message) => {
    setEditingId(message._id);
    setEditContent(message.content);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditContent('');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader className="w-8 h-8 animate-spin text-reunion-gold" />
      </div>
    );
  }

  return (
    <div className="bg-dark-800 rounded-xl border border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-reunion-red via-reunion-gold to-reunion-green p-[2px]">
        <div className="bg-dark-800 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageCircle className="w-6 h-6 text-reunion-gold" />
              <h3 className="text-xl font-bold text-white">
                Chat du tournoi
              </h3>
            </div>
            {/* Connection status indicator */}
            <div className="flex items-center gap-2">
              {connected ? (
                <>
                  <Wifi className="w-4 h-4 text-green-400" />
                  <span className="text-xs text-green-400">En ligne</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-red-400" />
                  <span className="text-xs text-red-400">Hors ligne</span>
                </>
              )}
            </div>
          </div>
          <p className="text-sm text-gray-400 mt-1">
            {messages.length} message{messages.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="h-64 md:h-96 overflow-y-auto p-3 md:p-4 space-y-3 bg-dark-900">
        {messages.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Aucun message. Soyez le premier à discuter !</p>
          </div>
        ) : (
          <AnimatePresence>
            {messages.map(message => (
              <motion.div
                key={message._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-dark-700 rounded-lg p-3"
              >
                {/* Reply indicator */}
                {message.replyTo && (
                  <div className="mb-2 pl-3 border-l-2 border-reunion-gold text-xs text-gray-400">
                    <Reply className="w-3 h-3 inline mr-1" />
                    Réponse à: {message.replyTo.content?.substring(0, 50)}...
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-reunion-red to-reunion-gold rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                    {message.author?.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-white text-sm">
                        {message.author?.username || 'Utilisateur'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(message.createdAt).toLocaleString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                          day: '2-digit',
                          month: 'short'
                        })}
                      </span>
                      {message.edited && (
                        <span className="text-xs text-gray-500 italic">(modifié)</span>
                      )}
                    </div>

                    {editingId === message._id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full px-3 py-2 bg-dark-600 border border-gray-600 rounded-lg text-white text-sm resize-none focus:outline-none focus:border-reunion-gold"
                          rows="2"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditMessage(message._id)}
                            className="px-3 py-1 bg-reunion-gold text-dark-900 text-sm font-semibold rounded hover:bg-yellow-400 transition"
                          >
                            Enregistrer
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="px-3 py-1 bg-gray-600 text-white text-sm font-semibold rounded hover:bg-gray-500 transition"
                          >
                            Annuler
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-gray-200 text-sm break-words">
                          {message.content}
                        </p>
                        <div className="flex gap-2 mt-2">
                          {isAuthenticated && (
                            <button
                              onClick={() => setReplyingTo(message)}
                              className="text-xs text-reunion-gold hover:text-yellow-400 transition flex items-center gap-1"
                            >
                              <Reply className="w-3 h-3" />
                              Répondre
                            </button>
                          )}
                          {user?._id === message.author?._id && (
                            <>
                              <button
                                onClick={() => startEditing(message)}
                                className="text-xs text-blue-400 hover:text-blue-300 transition flex items-center gap-1"
                              >
                                <Edit2 className="w-3 h-3" />
                                Modifier
                              </button>
                              <button
                                onClick={() => handleDeleteMessage(message._id)}
                                className="text-xs text-red-400 hover:text-red-300 transition flex items-center gap-1"
                              >
                                <Trash2 className="w-3 h-3" />
                                Supprimer
                              </button>
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        
        {/* Typing indicator */}
        {typingUsers.size > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-sm text-gray-400"
          >
            <div className="flex gap-1">
              <motion.span
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ repeat: Infinity, duration: 1.5, delay: 0 }}
              >
                •
              </motion.span>
              <motion.span
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}
              >
                •
              </motion.span>
              <motion.span
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }}
              >
                •
              </motion.span>
            </div>
            <span>
              {Array.from(typingUsers).slice(0, 3).join(', ')} 
              {typingUsers.size > 1 ? ' sont en train d\'écrire' : ' est en train d\'écrire'}...
            </span>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {isAuthenticated ? (
        <div className="p-4 bg-dark-800 border-t border-gray-700">
          {replyingTo && (
            <div className="mb-2 p-2 bg-dark-700 rounded-lg flex justify-between items-center">
              <div className="text-xs text-gray-400">
                <Reply className="w-3 h-3 inline mr-1" />
                Réponse à <span className="text-reunion-gold">{replyingTo.author?.username}</span>
              </div>
              <button
                onClick={() => setReplyingTo(null)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>
          )}
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              placeholder="Écrire un message..."
              maxLength={1000}
              className="flex-1 px-4 py-2 bg-dark-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-reunion-gold transition"
            />
            <motion.button
              type="submit"
              disabled={isSending || !newMessage.trim()}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-reunion-gold text-dark-900 font-semibold rounded-lg hover:bg-yellow-400 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSending ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Envoyer
                </>
              )}
            </motion.button>
          </form>
          <p className="text-xs text-gray-500 mt-2">
            {newMessage.length}/1000 caractères
          </p>
        </div>
      ) : (
        <div className="p-4 bg-dark-800 border-t border-gray-700 text-center">
          <p className="text-gray-400">
            Connectez-vous pour participer à la discussion
          </p>
        </div>
      )}
    </div>
  );
};

export default TournamentChat;
