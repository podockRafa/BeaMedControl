import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../services/firebaseConnection';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { db } from '../services/firebaseConnection';
import { doc, setDoc } from 'firebase/firestore'; 

import logoImg from '../assets/logo.png'; 

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // 👇 FUNÇÃO DE VALIDAÇÃO DE SENHA FORTE
  function validarSenhaForte(senha) {
    // Regex explicada:
    // (?=.*[a-z]) -> Pelo menos uma minúscula
    // (?=.*[A-Z]) -> Pelo menos uma maiúscula
    // (?=.*\d)    -> Pelo menos um número
    // (?=.*[@$!%*?&]) -> Pelo menos um especial
    // [A-Za-z\d@$!%*?&]{6,} -> Mínimo 6 caracteres no total
    
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
    return regex.test(senha);
  }

  // 👇 FUNÇÃO DE VALIDAÇÃO DE EMAIL SIMPLES
  function validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  async function handleRegister(e) {
    e.preventDefault();

    // 1. Validação de Campos Vazios
    if(name === '' || email === '' || password === ''){
      alert("Preencha todos os campos!");
      return;
    }

    // 2. Validação de Email Válido
    if(!validarEmail(email)) {
        alert("Por favor, digite um email válido (ex: nome@email.com)");
        return;
    }

    // 3. Validação de Senha Forte
    if(!validarSenhaForte(password)) {
        alert("A senha é muito fraca!\n\nEla precisa ter:\n- Mínimo 6 caracteres\n- 1 Letra Maiúscula\n- 1 Letra Minúscula\n- 1 Número\n- 1 Caractere especial (@ $ ! % * ? &)");
        return;
    }

    setLoading(true);

    try {
      const value = await createUserWithEmailAndPassword(auth, email, password);
      const uid = value.user.uid;

      await updateProfile(value.user, {
        displayName: name
      });

      await setDoc(doc(db, "users", uid), {
        nome: name,
        email: email,
        status: "trial", 
        criadoEm: new Date(),
        asaasCustomerId: null 
      });

      alert("Cadastrado com sucesso!");
      navigate('/dashboard');

    } catch (error) {
      console.log(error);
      if(error.code === 'auth/weak-password'){
        alert("O Firebase achou a senha fraca."); // Fallback caso nossa validação falhe
      } else if(error.code === 'auth/email-already-in-use'){
        alert("Email já existe!");
      } else {
        alert("Erro ao cadastrar: " + error.message);
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
              className="mx-auto h-24 w-auto object-contain mb-4" 
            />
            <h2 className="text-2xl font-bold text-gray-800">Crie sua conta</h2>
            <p className="text-gray-500 text-sm mt-1">Comece a gerenciar seus pacientes</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nome Completo</label>
            <input 
              type="text" 
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-hospital-blue focus:border-hospital-blue"
              placeholder="Seu nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">E-mail</label>
            <input 
              type="email" 
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-hospital-blue focus:border-hospital-blue"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Senha</label>
            <input 
              type="password" 
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-hospital-blue focus:border-hospital-blue"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <p className="text-[10px] text-gray-400 mt-1">
                Mínimo 6 caracteres, 1 maiúscula, 1 minúscula, 1 número e 1 símbolo.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-hospital-blue hover:bg-blue-700 focus:outline-none transition-colors"
          >
            {loading ? 'Cadastrando...' : 'Criar Conta Grátis'}
          </button>
        </form>

        <div className="mt-6 text-center border-t border-gray-200 pt-4">
            <p className="text-sm text-gray-600">
                Já possui uma conta?{' '}
                <Link to="/" className="font-medium text-hospital-blue hover:text-blue-500">
                    Fazer Login
                </Link>
            </p>
        </div>

      </div>
    </div>
  );
}