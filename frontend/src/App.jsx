import { useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useWebSocket } from './hooks/useWebSocket';
import Sidebar from './components/Sidebar';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import ProjectBoard from './pages/ProjectBoard';
import Notifications from './pages/Notifications';
import CreateProjectModal from './components/CreateProjectModal';
import './index.css';

function AppLayout() {
  const { user } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const handleWsMessage = useCallback((msg) => {
    if (msg.type === 'notification') setUnreadCount(p => p + 1);
    if (window.__boardHandler) window.__boardHandler(msg);
  }, []);

  useWebSocket(handleWsMessage);

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar notifCount={unreadCount} onCreateProject={() => setShowCreate(true)} />
      <main style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        <Routes>
          <Route path="/" element={<Dashboard onCreateProject={() => setShowCreate(true)} />} />
          <Route path="/projects" element={<Dashboard onCreateProject={() => setShowCreate(true)} />} />
          <Route path="/projects/:id" element={<ProjectBoard />} />
          <Route path="/notifications" element={<Notifications onOpen={() => setUnreadCount(0)} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {showCreate && (
        <CreateProjectModal
          onClose={() => setShowCreate(false)}
          onCreated={() => setShowCreate(false)}
        />
      )}
    </div>
  );
}

function AuthGuard({ redirect, children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to={redirect} replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ style: { fontSize: 14 } }} />
        <Routes>
          <Route path="/login" element={<AuthGuard redirect="/"><AuthPage /></AuthGuard>} />
          <Route path="/*" element={<AppLayout />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
