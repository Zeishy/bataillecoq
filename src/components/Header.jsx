import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Users, BarChart3, User, LogIn, LogOut, UserPlus, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationCenter from './NotificationCenter';
import MobileNav from './MobileNav';

const Header = () => {
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  
  const navItems = [
    { name: 'Home', path: '/', icon: Trophy },
    { name: 'Tournaments', path: '/tournaments', icon: Trophy },
    { name: 'Teams', path: '/teams', icon: Users },
    { name: 'Rankings', path: '/rankings', icon: BarChart3 },
    { name: 'Personal Stats', path: '/stats', icon: User },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-dark-800/90 backdrop-blur-md border-b border-reunion-red/20">
      <nav className="container mx-auto px-4 py-3 md:py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
              className="text-3xl md:text-4xl"
            >
              🐓
            </motion.div>
            <span className="text-xl md:text-2xl font-bold text-gradient">BatailleCoq</span>
          </Link>

          {/* Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="relative px-4 py-2 group"
                >
                  <div className={`flex items-center space-x-2 transition-colors ${
                    isActive ? 'text-reunion-gold' : 'text-gray-300 hover:text-white'
                  }`}>
                    <Icon size={18} />
                    <span className="font-medium">{item.name}</span>
                  </div>
                  
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-reunion-red via-reunion-gold to-reunion-green"
                      initial={false}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
            
            {/* Admin link */}
            {user?.role === 'admin' && (
              <Link
                to="/admin/tournaments"
                className="relative px-4 py-2 group"
              >
                <div className={`flex items-center space-x-2 transition-colors ${
                  location.pathname === '/admin/tournaments' ? 'text-reunion-gold' : 'text-gray-300 hover:text-white'
                }`}>
                  <Shield size={18} />
                  <span className="font-medium">Admin</span>
                </div>
                
                {location.pathname === '/admin/tournaments' && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-reunion-red via-reunion-gold to-reunion-green"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </Link>
            )}

            {/* Auth buttons */}
            <div className="ml-4 flex items-center gap-2">
              {isAuthenticated ? (
                <>
                  {/* Notification Center */}
                  <NotificationCenter userId={user?._id} />
                  
                  <div className="flex items-center gap-2 px-3 py-1 bg-dark-700 rounded-lg">
                    <User size={16} className="text-reunion-gold" />
                    <span className="text-sm text-white">{user?.username}</span>
                  </div>
                  <motion.button
                    onClick={logout}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors"
                  >
                    <LogOut size={18} />
                    <span className="font-medium">Déconnexion</span>
                  </motion.button>
                </>
              ) : (
                <>
                  <Link to="/login">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-2 px-4 py-2 bg-dark-700 text-white rounded-lg hover:bg-dark-600 transition-colors"
                    >
                      <LogIn size={18} />
                      <span className="font-medium">Connexion</span>
                    </motion.button>
                  </Link>
                  <Link to="/register">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-reunion-red to-reunion-gold text-white rounded-lg hover:shadow-lg transition-all"
                    >
                      <UserPlus size={18} />
                      <span className="font-medium">Inscription</span>
                    </motion.button>
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Mobile Navigation & Notifications */}
          <div className="flex md:hidden items-center gap-2">
            {isAuthenticated && <NotificationCenter userId={user?._id} />}
            <MobileNav />
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
