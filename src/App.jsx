import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './components/ProtectedRoute';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';
import Header from './components/Header';
import Home from './pages/Home';
import Tournaments from './pages/Tournaments';
import Teams from './pages/Teams';
import Rankings from './pages/Rankings';
import PersonalStats from './pages/PersonalStats';
import AdminTournaments from './pages/AdminTournaments';
import AdminTournamentDetail from './pages/AdminTournamentDetail';
import Login from './pages/Login';
import Register from './pages/Register';

function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <div className="min-h-screen bg-dark-900">
            <Header />
            <Routes>
            {/* Routes publiques */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/tournaments" element={<Tournaments />} />
            <Route path="/teams" element={<Teams />} />
            <Route path="/rankings" element={<Rankings />} />
            
            {/* Routes protégées */}
            <Route
              path="/stats"
              element={
                <ProtectedRoute>
                  <PersonalStats />
                </ProtectedRoute>
              }
            />
            
            {/* Routes admin */}
            <Route
              path="/admin/tournaments"
              element={
                <ProtectedAdminRoute>
                  <AdminTournaments />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/tournaments/:id"
              element={
                <ProtectedAdminRoute>
                  <AdminTournamentDetail />
                </ProtectedAdminRoute>
              }
            />
          </Routes>
          
          {/* Toast notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1f2937',
                color: '#fff',
                border: '1px solid #374151',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </div>
      </SocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;

