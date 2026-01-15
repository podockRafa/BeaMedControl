// src/pages/Login.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../services/firebaseConnection';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { Mail } from 'lucide-react'; // 👈 FALTAVA ISSO AQUI!

import logoImg from '../assets/logo.png'; 

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard');
    } catch (error) {
      alert("Erro ao logar: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      navigate('/dashboard');
    } catch (error) {
      console.log(error); 
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        
        <div className="text-center mb-8">
            <img 
              src={logoImg} 
              alt="Logo Beamed Control" 
              className="mx-auto h-24 w-auto object-contain mb-4" 
            />
            <p className="text-gray-500 text-sm mt-1">Acesso Enfermagem</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">E-mail</label>
            <input 
              type="email" 
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-hospital-blue focus:border-hospital-blue"
              placeholder="admin@beamed.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Senha</label>
            <input 
              type="password" 
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-hospital-blue focus:border-hospital-blue"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-hospital-blue hover:bg-blue-700 focus:outline-none transition-colors"
          >
            {loading ? 'Entrando...' : 'Acessar Sistema'}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Ou entre com</span>
            </div>
          </div>

          <div className="mt-6">
            <button 
              onClick={handleGoogleLogin}
              className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <span className="font-bold text-blue-600 mr-2">G</span> Google
            </button>
          </div>
        </div>

        <div className="mt-6 text-center border-t border-gray-200 pt-4">
            <p className="text-sm text-gray-600">
                Ainda não tem conta?{' '}
                <Link to="/register" className="font-medium text-hospital-blue hover:text-blue-500">
                    Criar conta grátis
                </Link>
            </p>
        </div>

        {/* 👇 SUA NOVA ÁREA DE SUPORTE (COM LAYOUT AJUSTADO) */}
        <div className="mt-6 text-center">
            <p className="text-xs text-gray-500 mb-1">
                Problema para acessar a conta?
            </p>
            <a 
                href="mailto:beamedcontrol@gmail.com" 
                className="text-sm font-bold text-hospital-blue hover:underline flex items-center justify-center gap-1 transition-colors"
            >
                <Mail size={14}/>
                beamedcontrol@gmail.com
            </a>   
        </div>

      </div>
    </div>
  );
}