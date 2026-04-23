import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { matchChatService } from '../services/matchChatService';

const MatchChat = ({ matchId, team1Name, team2Name, currentUserTeamId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const messagesEndRef = useRef(null);
  const { user } = useAuth();
  const { socket, connected } = useSocket();

  useEffect(() => {
    if (matchId) {
      loadMessages();
    }
  }, [matchId]);

  // WebSocket effects
  useEffect(() => {
    if (!socket || !matchId) return;

    // Join match room
    socket.emit('match:join', matchId);

    // Listen for new messages
    const handleNewMessage = (data) => {
      setMessages(prev => {
        const exists = prev.some(m => m._id === data.message._id);
        if (exists) return prev;
        return [...prev, data.message];
      });
      scrollToBottom();
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

    socket.on('match:message', handleNewMessage);
    socket.on('message:new', handleNewMessage);
    socket.on('match:message:edited', handleEditedMessage);
    socket.on('message:edited', handleEditedMessage);
    socket.on('match:message:deleted', handleDeletedMessage);
    socket.on('message:deleted', handleDeletedMessage);

    return () => {
      socket.emit('match:leave', matchId);
      socket.off('match:message', handleNewMessage);
      socket.off('message:new', handleNewMessage);
      socket.off('match:message:edited', handleEditedMessage);
      socket.off('message:edited', handleEditedMessage);
      socket.off('match:message:deleted', handleDeletedMessage);
      socket.off('message:deleted', handleDeletedMessage);
    };
  }, [socket, matchId]);

  const loadMessages = async () => {
    try {
      setIsLoading(true);
      const msgs = await matchChatService.getMatchMessages(matchId);
      setMessages(msgs);
      scrollToBottom();
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Erreur lors du chargement des messages');
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      setIsSending(true);
      await matchChatService.sendMessage(matchId, newMessage);
      setNewMessage('');
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Erreur lors de l\'envoi du message');
    } finally {
      setIsSending(false);
    }
  };

  const handleEditMessage = async (messageId, content) => {
    try {
      await matchChatService.editMessage(messageId, content);
      setEditingId(null);
      setEditContent('');
      toast.success('Message modifié');
    } catch (error) {
      console.error('Error editing message:', error);
      toast.error('Erreur lors de la modification');
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await matchChatService.deleteMessage(messageId);
      toast.success('Message supprimé');
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-lg border border-slate-700">
      {/* Header */}
      <div className="p-4 border-b border-slate-700 bg-slate-800">
        <h3 className="text-lg font-bold text-white">💬 Chat du Match</h3>
        <p className="text-xs text-slate-400">
          {connected ? '🟢 Connecté' : '🔴 Déconnecté'}
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="text-center text-slate-400 py-8">Chargement des messages...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-slate-400 py-8">Aucun message pour le moment</div>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.author?._id === user?._id;
            return (
            <motion.div
              key={message._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-xs ${isOwnMessage ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-100'} p-3 rounded-lg`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm">
                    {message.author?.username || 'Utilisateur'}
                  </span>
                  <span className={`text-xs ${isOwnMessage ? 'text-purple-200' : 'text-slate-400'}`}>
                    {message.team?.name || 'Équipe'}
                  </span>
                </div>

                {editingId === message._id ? (
                  <div className="flex gap-2 mt-2">
                    <input
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="flex-1 bg-slate-600 text-white rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                      autoFocus
                    />
                    <button
                      onClick={() => handleEditMessage(message._id, editContent)}
                      className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition"
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-2 py-1 bg-slate-600 text-white rounded text-xs hover:bg-slate-500 transition"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <p className="text-sm break-words">{message.content}</p>
                )}

                {message.edited && (
                  <p className={`text-xs mt-1 ${isOwnMessage ? 'text-purple-200' : 'text-slate-500'}`}>(modifié)</p>
                )}

                {isOwnMessage && (
                  <div className="flex gap-1 mt-2 justify-end">
                    <button
                      onClick={() => {
                        setEditingId(message._id);
                        setEditContent(message.content);
                      }}
                      className="text-xs hover:text-yellow-300 transition opacity-75 hover:opacity-100"
                      title="Modifier"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteMessage(message._id)}
                      className="text-xs hover:text-red-300 transition opacity-75 hover:opacity-100"
                      title="Supprimer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-700 bg-slate-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Écrivez un message..."
            className="flex-1 bg-slate-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
            disabled={isSending}
          />
          <button
            onClick={handleSendMessage}
            disabled={isSending || !newMessage.trim()}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-50 transition"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MatchChat;
