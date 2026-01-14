// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthProvider, { AuthContext } from './contexts/AuthContext';
import { useContext } from 'react';

// --- IMPORTAÇÃO DAS PÁGINAS ---
// Ajustei os caminhos para ficarem padronizados (./pages/...)
import LandingPage from './pages/LandingPage'; // ✅ Nova Importação
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PatientDetails from './pages/PatientDetails';
import WeekendChecklist from './pages/WeekendChecklist';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Termos from './pages/Legal/Termos';
import Privacidade from './pages/Legal/Privacidade';
import ForgotPassword from './pages/ForgotPassword';
import InstallTutorial from './pages/InstallTutorial';

// Componente que protege as rotas
function Private({ children }) {
  const { signed, loadingAuth } = useContext(AuthContext);

  if (loadingAuth) {
    return <div className="h-screen flex items-center justify-center">Carregando...</div>;
  }

  if (!signed) {
    // ⚠️ MUDANÇA IMPORTANTE:
    // Se não estiver logado, manda para o /login (não mais para a /)
    // Assim, se a sessão cair, ele cai direto na tela de digitar senha.
    return <Navigate to="/login" />;
  }

  return children;
}

// (Opcional) Componente para quem JÁ está logado não ver a Landing Page/Login
function Public({ children }) {
  const { signed } = useContext(AuthContext);
  // Se já estiver logado, joga direto pro Dashboard
  if (signed) {
    return <Navigate to="/dashboard" />;
  }
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          
          {/* 1. A PORTA DE ENTRADA (LANDING PAGE) */}
          {/* Agora a raiz "/" mostra a sua página de vendas bonita */}
          <Route path="/" element={
            <Public>
              <LandingPage />
            </Public>
          } />

          {/* 2. A TELA DE LOGIN (AGORA SEPARADA) */}
          {/* O botão "Já tenho conta" da Landing Page vai apontar pra cá */}
          <Route path="/login" element={
            <Public>
              <Login />
            </Public>
          } />

          {/* Outras rotas públicas */}
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/legal/termos" element={<Termos />} />
          <Route path="/legal/privacidade" element={<Privacidade />} />
          <Route path="/instalar" element={<InstallTutorial />} /> 
          
          {/* 3. ROTAS PRIVADAS (PROTEGIDAS) */}
          <Route path="/dashboard" element={
            <Private>
              <Dashboard />
            </Private>
          } />
          
          <Route path="/paciente/:id" element={
            <Private>
              <PatientDetails />
            </Private>
          } />

          <Route path="/checklist" element={
            <Private>
              <WeekendChecklist />
            </Private>
          } />

          <Route path="/perfil" element={
            <Private>
              <Profile />
            </Private>
          } />
          
          {/* Rota Coringa: Se digitar qualquer coisa errada, vai pra Landing Page */}
          <Route path="*" element={<Navigate to="/" />} />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;