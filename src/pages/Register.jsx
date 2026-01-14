// src/pages/Register.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '../services/firebaseConnection';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import logoImg from '../assets/logo.png';

export default function Register() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleRegister(e) {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Cria o usuário na Autenticação (Login)
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Atualiza o nome de exibição no perfil
      await updateProfile(user, { displayName: nome });

      // 3. Cria o registro Financeiro no Banco de Dados
      // Aqui salvaremos se ele pagou ou não (status: trial/ativo/bloqueado)
      await setDoc(doc(db, "users", user.uid), {
        nome: nome,
        email: email,
        status: 'trial', // Começa como teste grátis
        criadoEm: new Date(),
        plano: 'mensal'
      });

      alert("Conta criada com sucesso! Seja bem-vindo(a).");
      navigate('/dashboard');

    } catch (error) {
      console.log(error);
      if(error.code === 'auth/email-already-in-use'){
        alert("Este email já existe! Tente fazer login.");
      } else if(error.code === 'auth/weak-password'){
        alert("A senha deve ter pelo menos 6 caracteres.");
      } else {
        alert("Erro ao cadastrar. Verifique os dados.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        
        <div className="text-center mb-8">
            <img 
              src={logoImg} 
              alt="Logo Beamed Control" 
              className="mx-auto h-20 w-auto object-contain mb-4" 
            />
            <h2 className="text-2xl font-bold text-gray-800">Criar Nova Conta</h2>
            <p className="text-gray-500 text-sm mt-1">Teste grátis o Beamed Control</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nome da Clínica ou Enfermeiro</label>
            <input 
              type="text" 
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-hospital-blue focus:border-hospital-blue"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Enfermagem Silva"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">E-mail</label>
            <input 
              type="email" 
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-hospital-blue focus:border-hospital-blue"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Senha</label>
            <input 
              type="password" 
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-hospital-blue focus:border-hospital-blue"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="******"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-hospital-blue hover:bg-blue-700 focus:outline-none transition-colors"
          >
            {loading ? 'Criando conta...' : 'Começar Agora'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Já tem uma conta?{' '}
            <Link to="/" className="font-medium text-hospital-blue hover:text-blue-500">
              Fazer Login
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}