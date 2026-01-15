// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthProvider, { AuthContext } from './contexts/AuthContext';
import { useContext } from 'react';
import { Lock, CreditCard, AlertTriangle, Ban } from 'lucide-react'; 

// --- IMPORTAÇÃO DAS PÁGINAS ---
import LandingPage from './pages/LandingPage'; 
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

// 👇 COMPONENTE GUARDIÃO
function Private({ children, ignoreBlock = false }) {
  // 👇 AQUI ESTAVA FALTANDO O LOGOUT!
  const { signed, loadingAuth, user, logout } = useContext(AuthContext);

  if (loadingAuth) {
    return <div className="h-screen flex items-center justify-center bg-gray-100 text-hospital-blue font-bold">Carregando sistema...</div>;
  }

  if (!signed) {
    return <Navigate to="/login" />;
  }

  // ==========================================================
  // 🚨 ZONA DE BLOQUEIO
  // ==========================================================
  
  if (user && !ignoreBlock) {
    
    // 1. BLOQUEIO DE CALOTEIRO (OVERDUE)
    if (user.status === 'overdue') {
        return (
            <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
                <div className="bg-white max-w-md w-full p-8 rounded-xl shadow-2xl text-center border-t-4 border-red-500">
                    <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle size={32} className="text-red-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Pagamento Pendente</h2>
                    <p className="text-gray-600 mb-6">
                        Identificamos uma pendência na sua última fatura. Regularize para liberar o acesso.
                    </p>
                    <a href="/perfil" className="block w-full bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 transition mb-3">
                        Regularizar Agora
                    </a>
                    {/* 👇 O BOTÃO AGORA DESLOGA DE VERDADE */}
                    <button onClick={logout} className="text-sm text-gray-400 hover:text-gray-600 underline">Sair da conta</button>
                </div>
            </div>
        );
    }

    // 2. BLOQUEIO DE CANCELADO (CANCELED)
    if (user.status === 'canceled') {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                <div className="bg-white max-w-md w-full p-8 rounded-xl shadow-2xl text-center">
                    <div className="bg-gray-200 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Ban size={32} className="text-gray-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Assinatura Inativa</h2>
                    <p className="text-gray-600 mb-6">
                        Sua assinatura foi cancelada. Reative agora para voltar a usar o sistema.
                    </p>
                    <a href="/perfil" className="block w-full bg-hospital-blue text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition">
                        Reativar Assinatura
                    </a>
                    {/* 👇 O BOTÃO AGORA DESLOGA DE VERDADE */}
                    <button onClick={logout} className="mt-4 text-sm text-gray-400 hover:text-gray-600 underline">Sair da conta</button>
                </div>
            </div>
        );
    }

    // 3. BLOQUEIO DE TRIAL EXPIRADO
    if (user.status === 'trial') {
        const dataCriacao = user.criadoEm?.toDate ? user.criadoEm.toDate() : new Date(user.criadoEm);
        const agora = new Date();
        const diferencaHoras = (agora - dataCriacao) / (1000 * 60 * 60);

        if (diferencaHoras > 72) {
          return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                <div className="bg-white max-w-md w-full p-8 rounded-xl shadow-2xl text-center">
                    <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock size={32} className="text-hospital-blue" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Período de Teste Finalizado</h2>
                    <p className="text-gray-600 mb-6">
                        Seus 3 dias de teste gratuito acabaram. Assine o plano Premium para continuar.
                    </p>
                    
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6 text-left">
                        <p className="font-bold text-gray-800 flex items-center gap-2">
                            <CreditCard size={18}/> Plano Enfermeiro Premium
                        </p>
                        <p className="text-sm text-gray-500 mt-1">Acesso ilimitado + Robô Bea.</p>
                        <p className="text-xl font-bold text-hospital-blue mt-2">R$ 19,90<span className="text-sm text-gray-400 font-normal">/mês</span></p>
                    </div>

                    <a href="/perfil" className="block w-full bg-hospital-blue text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition">
                        Assinar Agora
                    </a>
                    {/* 👇 O BOTÃO AGORA DESLOGA DE VERDADE */}
                    <button onClick={logout} className="mt-4 text-sm text-gray-400 hover:text-gray-600 underline">Sair da conta</button>
                </div>
            </div>
          );
        }
    }
  }

  return children;
}

// Componente para quem JÁ está logado
function Public({ children }) {
  const { signed } = useContext(AuthContext);
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
          {/* ROTAS PÚBLICAS */}
          <Route path="/" element={<Public><LandingPage /></Public>} />
          <Route path="/login" element={<Public><Login /></Public>} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/legal/termos" element={<Termos />} />
          <Route path="/legal/privacidade" element={<Privacidade />} />
          <Route path="/instalar" element={<InstallTutorial />} /> 
          
          {/* ROTAS PROTEGIDAS */}
          <Route path="/dashboard" element={<Private><Dashboard /></Private>} />
          <Route path="/paciente/:id" element={<Private><PatientDetails /></Private>} />
          <Route path="/checklist" element={<Private><WeekendChecklist /></Private>} />
          
          {/* Rota Perfil liberada para pagamento */}
          <Route path="/perfil" element={<Private ignoreBlock={true}><Profile /></Private>} />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;