import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Trophy, Users, BarChart3, User, Shield, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const MobileNav = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();

  const navItems = [
    { name: 'Home', path: '/', icon: Trophy },
    { name: 'Tournaments', path: '/tournaments', icon: Trophy },
    { name: 'Teams', path: '/teams', icon: Users },
    { name: 'Rankings', path: '/rankings', icon: BarChart3 },
    { name: 'Personal Stats', path: '/stats', icon: User },
  ];

  const handleLinkClick = () => {
    setIsOpen(false);
  };

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden p-2 text-gray-300 hover:text-white transition"
        aria-label="Toggle menu"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-80 bg-dark-800 border-l border-reunion-red/20 z-50 md:hidden overflow-y-auto"
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-3xl">🐓</span>
                    <span className="text-xl font-bold text-gradient">BatailleCoq</span>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-dark-700 rounded-lg transition"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* User Info */}
                {isAuthenticated && user && (
                  <div className="flex items-center gap-3 p-3 bg-dark-700 rounded-lg">
                    <div className="w-10 h-10 bg-gradient-to-br from-reunion-red to-reunion-gold rounded-full flex items-center justify-center text-white font-bold">
                      {user.username?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white truncate">{user.username}</p>
                      <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation Links */}
              <nav className="p-4">
                <div className="space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;

                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={handleLinkClick}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                          isActive
                            ? 'bg-gradient-to-r from-reunion-red/20 via-reunion-gold/20 to-reunion-green/20 text-reunion-gold border border-reunion-gold/30'
                            : 'text-gray-300 hover:bg-dark-700 hover:text-white'
                        }`}
                      >
                        <Icon size={20} />
                        <span className="font-medium">{item.name}</span>
                      </Link>
                    );
                  })}

                  {/* Admin Link */}
                  {user?.role === 'admin' && (
                    <Link
                      to="/admin/tournaments"
                      onClick={handleLinkClick}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                        location.pathname === '/admin/tournaments'
                          ? 'bg-gradient-to-r from-reunion-red/20 via-reunion-gold/20 to-reunion-green/20 text-reunion-gold border border-reunion-gold/30'
                          : 'text-gray-300 hover:bg-dark-700 hover:text-white'
                      }`}
                    >
                      <Shield size={20} />
                      <span className="font-medium">Admin</span>
                    </Link>
                  )}
                </div>

                {/* Auth Actions */}
                <div className="mt-6 pt-6 border-t border-gray-700">
                  {isAuthenticated ? (
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-400/10 rounded-lg transition"
                    >
                      <LogOut size={20} />
                      <span className="font-medium">Déconnexion</span>
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <Link
                        to="/login"
                        onClick={handleLinkClick}
                        className="block w-full px-4 py-3 text-center bg-reunion-gold text-dark-900 font-semibold rounded-lg hover:bg-yellow-400 transition"
                      >
                        Connexion
                      </Link>
                      <Link
                        to="/register"
                        onClick={handleLinkClick}
                        className="block w-full px-4 py-3 text-center border border-reunion-gold text-reunion-gold font-semibold rounded-lg hover:bg-reunion-gold/10 transition"
                      >
                        Inscription
                      </Link>
                    </div>
                  )}
                </div>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default MobileNav;
